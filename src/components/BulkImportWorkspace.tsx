import React from 'react';
import { UnifiedRecord, DocCategory } from '../types';
import { 
  Clipboard, Table, Check, Sparkles, FolderUp, RefreshCw, AlertCircle, FileSpreadsheet, Plus, HelpCircle, Layers, CheckCircle
} from 'lucide-react';

interface BulkImportWorkspaceProps {
  onAddRecordsBatch: (records: UnifiedRecord[]) => void;
  showToast: (text: string, type: 'success' | 'error' | 'info') => void;
  userRole: string;
}

export default function BulkImportWorkspace({ onAddRecordsBatch, showToast, userRole }: BulkImportWorkspaceProps) {
  
  const [copiedData, setCopiedData] = React.useState<string>('');
  const [parsedRows, setParsedRows] = React.useState<any[]>([]);
  const isViewer = userRole === 'Viewer';

  // Sample CSV format for copy to Excel clipboard testing
  const EXCEL_TSV_TEMPLATE = `Alexander Sterling Vance	GB8238192	United Kingdom	ICS Visa	V-ICS-920198	2025-05-15	2026-05-15	BOX-2026-A	Row 3, Shelf B	Binder 1 / Slot 04
Christina Maria Alvarez	ES9810291	Spain	Residence Permit	R-PERM-112044	2026-02-10	2031-02-10	BOX-2026-C	Row 2, Shelf D	Binder 12 / Slot 08
Hassan Bin-Faisal	AE1902812	United Arab Emirates	Origin ID	ORG-ID-992110	2024-11-12	2029-11-12	BOX-2026-D	Row 1, Shelf C	Binder 5 / Slot 30
Liam Robert Murphy	IE8820192	Ireland	ETD	ETD-550183	2026-05-18	2026-06-18	BOX-2026-E	Row 5, Shelf E	Binder 18 / Slot 15`;

  // Parse TSV clipboard values
  const handleParseClipboardData = () => {
    if (!copiedData.trim()) {
      showToast('Emtpy Parameters: Paste some tab-separated values to digest.', 'error');
      return;
    }

    try {
      const rows = copiedData.trim().split('\n');
      const results: any[] = [];

      rows.forEach((line, idx) => {
        // Tab separated attributes
        const cols = line.split('\t');
        if (cols.length < 5) return; // skip junk lines

        // Normalise fields with robust fallbacks
        results.push({
          applicant_name: cols[0]?.trim() || `Bulk Applicant ${idx + 1}`,
          passport_no: cols[1]?.trim() || `PASS-BULK-${idx + 1}`,
          nationality: cols[2]?.trim() || 'Worldwide',
          doc_type: (cols[3]?.trim() as DocCategory) || 'ICS Visa',
          doc_number: cols[4]?.trim() || `DOC-BULK-SERIAL-${idx + 1}`,
          issue_date: cols[5]?.trim() || '2026-01-01',
          expiry_date: cols[6]?.trim() || '2027-01-01',
          cabinet_box_no: cols[7]?.trim() || 'BOX-2026-A',
          shelf_location: cols[8]?.trim() || 'Row 1, Shelf A',
          binder_slot_sequence: cols[9]?.trim() || 'Binder 1 / Slot 01',
          isValid: true
        });
      });

      if (results.length === 0) {
        showToast('Format unrecognized: Make sure you copied tab-separated columns from Excel.', 'error');
        return;
      }

      setParsedRows(results);
      showToast(`Parsed ${results.length} rows from spreadsheet clipboard.`, 'success');

    } catch (e: any) {
      showToast(`Format analysis error: ${e.message}`, 'error');
    }
  };

  // Run the Batch Injection in the core index
  const handleExecuteBatchInjection = () => {
    if (isViewer) {
      showToast('Security Violation: Viewer role locked from bulk write privileges.', 'error');
      return;
    }

    if (parsedRows.length === 0) return;

    // Convert into UnifiedRecords array
    const batch: UnifiedRecord[] = parsedRows.map((row, idx) => {
      const TODAY = new Date('2026-05-23T09:19:20Z');
      const exp = new Date(row.expiry_date);
      const computedStatus = exp < TODAY ? 'Expired' : 'Active';

      return {
        id: `bulk-doc-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        file_id: `bulk-file-${Date.now()}-${idx}`,
        applicant_name: row.applicant_name,
        master_file_no: `FSD-M-2026-${Math.floor(6000 + Math.random() * 3000)}`,
        passport_no: row.passport_no,
        nationality: row.nationality,
        doc_type: row.doc_type,
        doc_number: row.doc_number,
        issue_date: row.issue_date,
        expiry_date: row.expiry_date,
        status: computedStatus,
        cabinet_box_no: row.cabinet_box_no,
        shelf_location: row.shelf_location,
        binder_slot_sequence: row.binder_slot_sequence,
        pdf_storage_path: `document-pdfs/${row.applicant_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_bulk_imported.pdf`,
        file_size_bytes: 1048576, // fallback size 1MB
        uploaded_at: new Date().toISOString(),
        viewer_explicitly_flaged: false
      };
    });

    onAddRecordsBatch(batch);
    setParsedRows([]);
    setCopiedData('');
    showToast(`Injected ${batch.length} files successfully inside primary Supabase instances.`, 'success');
  };

  return (
    <div className="space-y-6 text-[13px]">
      
      {/* Overview */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Excel Spreadsheets Automated Digitization Matrix
          </h2>
          <p className="text-xs text-slate-500">
            Immigration verification agents often manage active files inside tabular spreadsheets. Paste columns from Excel/CSV tracking grids to automatically digitize and categorize batches of records.
          </p>
        </div>

        {/* Templates guide box */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-8 space-y-1">
            <h4 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">Tabular Spreadsheet Columns Standard Format:</h4>
            <p className="text-[11px] text-slate-500 leading-normal">
              Copy rows containing: <strong className="text-slate-700">Name [TAB] Passport [TAB] Nationality [TAB] Category [TAB] Document No [TAB] Issue Date [TAB] Expiry Date [TAB] Box ID [TAB] Shelf Coord [TAB] Slot Sequence</strong>
            </p>
          </div>

          <div className="md:col-span-4 justify-self-stretch md:justify-self-end text-center">
            <button
              onClick={() => {
                setCopiedData(EXCEL_TSV_TEMPLATE);
                showToast('Sample template copied into pasting textbox.', 'info');
              }}
              className="bg-white hover:bg-slate-100 text-slate-700 border font-bold px-3 py-1.5 rounded text-xs transition inline-flex items-center gap-1 cursor-pointer"
            >
              <Clipboard className="w-3.5 h-3.5" /> Load Copyable Excel Rows
            </button>
          </div>
        </div>

        {/* Paste block */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">Paste clipboard content directly here from your spreadsheet:</label>
          <textarea
            value={copiedData}
            onChange={(e) => setCopiedData(e.target.value)}
            rows={6}
            placeholder="Marcus Aurelius Severus	IT2910821	Italy	ICS Visa	V-ICS-882019A	2025-08-10	2026-08-10	BOX-2026-B	Row 4, Shelf A	Slot 12"
            className="w-full text-xs font-mono bg-slate-50/50 border border-slate-300 rounded p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />

          <div className="flex justify-between items-center bg-slate-50 p-2.5 border border-slate-200 rounded-lg">
            <span className="text-[11px] text-slate-500 font-sans">Click process below to preview elements inside tabular structure.</span>
            <button
              onClick={handleParseClipboardData}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-1.5 rounded transition text-xs cursor-pointer shadow-xs"
            >
              Process Spreadsheet Data
            </button>
          </div>
        </div>
      </div>

      {/* Structured spreadsheet matrix pre-load evaluation */}
      {parsedRows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-sm animate-fadeIn">
          
          <div className="flex justify-between items-center border-b pb-2">
            <span className="font-mono text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Table className="w-4 h-4 text-emerald-600" />
              Spreadsheet rows structured staging (Database commit pending...)
            </span>

            <span className="text-[10.5px] bg-amber-50 text-amber-800 font-semibold border border-amber-200 px-2 py-0.5 rounded font-mono">
              Ready to digitize: {parsedRows.length} files
            </span>
          </div>

          <div className="overflow-x-auto max-h-[220px]">
            <table className="w-full text-left font-mono text-[11px] border-collapse bg-slate-50">
              <thead className="bg-slate-200/80 text-slate-700 border-b border-slate-300">
                <tr>
                  <th className="p-1.5 font-bold">Name</th>
                  <th className="p-1.5 font-bold">Passport & Nation</th>
                  <th className="p-1.5 font-bold">Category</th>
                  <th className="p-1.5 font-bold">Document Serial</th>
                  <th className="p-1.5 font-bold text-center">Validity Range</th>
                  <th className="p-1.5 font-bold">Cabinet box coordinate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {parsedRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-indigo-50/40">
                    <td className="p-1.5 text-slate-800 font-sans font-semibold">{row.applicant_name}</td>
                    <td className="p-1.5 text-slate-500">{row.passport_no} ({row.nationality})</td>
                    <td className="p-1.5"><span className="bg-white px-1.5 py-0.2 rounded border font-sans font-bold text-[10px]">{row.doc_type}</span></td>
                    <td className="p-1.5 text-slate-600 font-bold">{row.doc_number}</td>
                    <td className="p-1.5 text-center text-slate-500">{row.issue_date} to {row.expiry_date}</td>
                    <td className="p-1.5 text-slate-600 text-[10px] font-bold">{row.cabinet_box_no} / {row.shelf_location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action trigger section */}
          <div className="pt-3 border-t flex justify-end gap-2 items-center">
            <span className="text-[11px] text-slate-400">Clicking below batch commits items directly into active relational state.</span>
            
            {isViewer ? (
              <div className="bg-yellow-50 text-yellow-700 border border-yellow-200 p-2 rounded text-[11px] font-semibold">
                ⚠️ Viewer role blocked from bulk inserts. Choose an active role above.
              </div>
            ) : (
              <button
                type="button"
                onClick={handleExecuteBatchInjection}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2 rounded text-xs transition cursor-pointer shadow-md flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4 text-emerald-300" /> Execute Batch Digitization ({parsedRows.length} Rows)
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
