import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Setup generous body limits for uploading high-resolution passport/visa images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Gemini API client lazily inside operations as per instructions,
// checking standard environment variables.
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // We throw a clear error or fall back gracefully
    throw new Error('GEMINI_API_KEY is not defined in the environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory records state that is initialized from client or updated via endpoints.
// To prevent service restarts wiping records, the frontend also backs up and merges data from LocalStorage
let recordsStore: any[] = [];

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Get all records
app.get('/api/records', (req, res) => {
  res.json({ success: true, count: recordsStore.length, data: recordsStore });
});

// Batch load or sync records from client on launch
app.post('/api/records/sync', (req, res) => {
  const { records } = req.body;
  if (Array.isArray(records)) {
    recordsStore = records;
    return res.json({ success: true, count: recordsStore.length });
  }
  res.status(400).json({ success: false, error: 'Invalid payload type. Expected records array.' });
});

// Create record
app.post('/api/records', (req, res) => {
  const newRecord = {
    id: `rec-${Math.random().toString(36).substr(2, 9)}`,
    ...req.body
  };
  recordsStore.unshift(newRecord);
  res.status(201).json({ success: true, data: newRecord });
});

// Update record
app.put('/api/records/:id', (req, res) => {
  const { id } = req.params;
  const index = recordsStore.findIndex(r => r.id === id);
  if (index !== -1) {
    recordsStore[index] = { ...recordsStore[index], ...req.body };
    return res.json({ success: true, data: recordsStore[index] });
  }
  res.status(404).json({ success: false, error: 'Record not found' });
});

// Delete record
app.delete('/api/records/:id', (req, res) => {
  const { id } = req.params;
  const index = recordsStore.findIndex(r => r.id === id);
  if (index !== -1) {
    const deleted = recordsStore.splice(index, 1);
    return res.json({ success: true, data: deleted[0] });
  }
  res.status(404).json({ success: false, error: 'Record not found' });
});

// AI Digitization & Categorization Endpoint
app.post('/api/digitize', async (req, res) => {
  try {
    const { fileData, fileName, mimeType, textInput, categoryHint } = req.body;

    if (!fileData && !textInput) {
      return res.status(400).json({
        success: false,
        error: 'Please provide either document image data (Base64) or textual details / Excel copy-paste.'
      });
    }

    // Verify key exists before initializing
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY missing. Please configure it in Settings > Secrets to enable instant AI digitizing. Mocking parser for testing...'
      });
    }

    const ai = getGeminiClient();

    // Prepare contents
    const contents: any[] = [];
    
    let instructions = `You are a professional Immigration Document Verification Officer AI belonging to the "Immigration Data and Evidence structuring Division" (Source: FSD).
Your task is to analyze the provided immigration evidence (could be a visa card, resident passport page, Diaspora certificate, text descriptions, or Excel clipboard row) and digitize/structure it.

First, categorize the document into one of the five official categories:
1. 'ICS Visa' (Immigration/Visa control records, tourist/business entry stamps)
2. 'Residence Permit' (Local residency status, permanent/temporary residence card)
3. 'Origin ID' (Diaspora/Origin identification, heritage certs)
4. 'ETD' (Emergency Travel Documents, repatriation certificate)
5. 'Yellow Card' (Health/Vaccination/Special clearance, medical clearance)

Second, extract the fields strictly using the specified JSON schema.
Ensure to standardize fields:
- Standardize 'sex' to 'Male' or 'Female' (or 'Other' if applicable).
- Standardize dates to 'YYYY-MM-DD' format if legible.
- Generate a logical master_file_no format like 'FSD-M-2026-XXXX' if not visible.
- Infer cabinet_box_no from document cues or generate a realistic tracking code like 'BOX-2026-A', 'BOX-2026-B', etc.
- Shelf location should be structured like 'Row 3, Shelf B'
- Binder slot sequence should be structured like 'Binder 2 / Slot 12'

Context:
${categoryHint ? `User suggested category: ${categoryHint}` : 'Determine category dynamically.'}
Current local year: 2026.
`;

    if (fileData) {
      // Decode base64
      const imagePart = {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: fileData.split(',')[1] || fileData
        }
      };
      contents.push(imagePart);
      instructions += `\nAnalyze the attached document page/image. Locate details like Full Name, Nationality/Citizenship, Passport Number, Dates, ID numbers and physical locations to populate the schema.`;
    }

    if (textInput) {
      contents.push({ text: `Text representation or OCR data of the document and manual fields:\n${textInput}` });
    }

    contents.push({ text: `Extract data now. Category can only be 'ICS Visa', 'Residence Permit', 'Origin ID', 'ETD', or 'Yellow Card'.` });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: instructions,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'doc_type', 'master_file_no', 'applicant_name', 'passport_no', 'nationality', 
            'doc_number', 'issue_date', 'expiry_date', 'cabinet_box_no', 'shelf_location', 'binder_slot_sequence'
          ],
          properties: {
            doc_type: {
              type: Type.STRING,
              description: "The detected category of the document: 'ICS Visa', 'Residence Permit', 'Origin ID', 'ETD', or 'Yellow Card'"
            },
            master_file_no: {
              type: Type.STRING,
              description: "Unified master file number, e.g. FSD-M-2026-XXXX"
            },
            applicant_name: {
              type: Type.STRING,
              description: "Full legal name of the applicant/traveler"
            },
            passport_no: {
              type: Type.STRING,
              description: "Passport or travel document identity number"
            },
            nationality: {
              type: Type.STRING,
              description: "Nationality/citizenship of the passport holder"
            },
            doc_number: {
              type: Type.STRING,
              description: "Official document number or permit registration ID"
            },
            issue_date: {
              type: Type.STRING,
              description: "Chronological date of issuance in YYYY-MM-DD format"
            },
            expiry_date: {
              type: Type.STRING,
              description: "Chronological date of expiration in YYYY-MM-DD format"
            },
            cabinet_box_no: {
              type: Type.STRING,
              description: "Extracted/inferred physical folder/cabinet box tracking number, e.g. BOX-2026-A"
            },
            shelf_location: {
              type: Type.STRING,
              description: "Physical shelf coordinate, e.g. Row 3, Shelf B"
            },
            binder_slot_sequence: {
              type: Type.STRING,
              description: "Sequence inside binder/slot, e.g. Binder 2 / Slot 12"
            },
            confidence: {
              type: Type.INTEGER,
              description: "Confidence level of parsing out of 100"
            }
          }
        }
      }
    });

    const parsedText = response.text;
    if (!parsedText) {
      throw new Error('Empirical parsing returned empty string. Please try with clearer inputs.');
    }

    const dataObj = JSON.parse(parsedText.trim());
    return res.json({
      success: true,
      data: dataObj,
      message: 'Immigration files digitized & structured successfully.'
    });

  } catch (error: any) {
    console.error('Error in AI Digitizer:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while integrating with Gemini parser. Ensure your API key is correctly active.'
    });
  }
});

// Setup Vite & static serving
async function initializeApp() {
  if (process.env.NODE_ENV !== 'production') {
    // Development server with Vite Hot-Loading configured
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted for local UI development');
  } else {
    // Serving compiled static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`Static assets initialized from: ${distPath}`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Immigration portal server bootstrapped on port ${PORT}`);
  });
}

initializeApp().catch((err) => {
  console.error('Fatal initialization error:', err);
});
