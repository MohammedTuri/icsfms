import React from 'react';
import { UnifiedRecord, UserRole } from '../types';
import { 
  Database, ShieldCheck, Terminal, Play, Copy, Check, Sparkles, HelpCircle, 
  Lock, RefreshCw, Layers, ShieldAlert, Award
} from 'lucide-react';

interface SqlConsoleProps {
  records: UnifiedRecord[];
  activeRole: UserRole;
}

export default function SupabaseSqlConsole({ records, activeRole }: SqlConsoleProps) {
  const [copiedText, setCopiedText] = React.useState<boolean>(false);
  const [selectedSchemaTab, setSelectedSchemaTab] = React.useState<'sql' | 'rls'>('sql');
  const [selectedQuery, setSelectedQuery] = React.useState<string>('SELECT_FILES');
  const [queryOutput, setQueryOutput] = React.useState<string>('');
  const [isRunning, setIsRunning] = React.useState<boolean>(false);

  // PostgreSQL Raw SQL Script
  const POSTGRES_SQL_SCRIPT = `-- =======================================================
-- SYSTEM ARCHITECTURE: DOCUMENT ARCHIVE & TRACKING SCHEMA
-- Database: PostgreSQL (Supabase Compatible)
-- Generated on: 2026-05-23
-- =======================================================

-- 1. ENUMS AND CUSTOM TYPES
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('SuperAdmin', 'Archivist', 'Viewer');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doc_category') THEN
    CREATE TYPE doc_category AS ENUM ('ICS Visa', 'Residence Permit', 'Origin ID', 'ETD', 'Yellow Card');
  END IF;
END $$;

-- 2. USER PROFILES TABLE (Syncs with auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'Viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. PERSONAL MASTER FILES (Applicants Core Identity File)
CREATE TABLE personal_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  master_file_no VARCHAR(50) UNIQUE NOT NULL, -- Format: FSD-M-YYYY-XXXX
  applicant_name TEXT NOT NULL,
  passport_no VARCHAR(50) NOT NULL,
  nationality TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- CREATE INDEXES ON CORE IDENTITY SEARCH COLUMNS FOR HIGH THROUGHPUT
CREATE INDEX idx_personal_master_no ON personal_files(master_file_no);
CREATE INDEX idx_applicant_name_trgm ON personal_files(applicant_name);
CREATE INDEX idx_passport_raw_no ON personal_files(passport_no);

-- 4. DOCUMENT RECORDS TABLE (Maps to physical archive coord)
CREATE TABLE document_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES personal_files(id) ON DELETE CASCADE NOT NULL,
  doc_type doc_category NOT NULL,
  doc_number VARCHAR(100) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  
  status VARCHAR(50) DEFAULT 'Active', -- Status tracked cleanly in ledger
  
  -- PHYSICAL COORDINATE MATRIX MAPPING
  cabinet_box_no VARCHAR(50) NOT NULL,   -- e.g., 'BOX-2026-A'
  shelf_location VARCHAR(100) NOT NULL,   -- e.g., 'Row 3, Shelf B'
  binder_slot_sequence VARCHAR(100) NOT NULL, -- e.g., 'Binder 2 / Slot 12'
  
  -- STORAGE TRACKING CORES
  pdf_storage_path TEXT NOT NULL,          -- Storage path key inside supabase bucket
  file_size_bytes INTEGER DEFAULT 0,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create coordinate indices to speed up cabinet-level aggregation dashboards
CREATE INDEX idx_cabinet_box_no ON document_records(cabinet_box_no);
CREATE INDEX idx_expiry_checker ON document_records(expiry_date);
`;

  // Row Level Security policies
  const RLS_POLICIES_SCRIPT = `-- =======================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- Target: Multi-tenant Role Restrictions
-- Viewer, Archivist, and SuperAdmin permissions
-- =======================================================

-- Enable RLS on core production tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_records ENABLE ROW LEVEL SECURITY;

-- SECURE FUNCTIONS: Get authenticated user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;


-- -------------------------------------------------------
-- POLICY MATRIX FOR: profiles
-- -------------------------------------------------------

-- Allow select to everyone authenticated
CREATE POLICY "Public profile lookup capability"
  ON profiles FOR SELECT TO authenticated
  USING (true);

-- Restrict full adjustments of user profiles strictly to SuperAdmin
CREATE POLICY "SuperAdmins maintain unrestricted profile modification"
  ON profiles FOR ALL TO authenticated
  USING (get_user_role() = 'SuperAdmin')
  WITH CHECK (get_user_role() = 'SuperAdmin');


-- -------------------------------------------------------
-- POLICY MATRIX FOR: personal_files
-- -------------------------------------------------------

-- Selective RLS Select: Readable by all roles
CREATE POLICY "Unified personal file select capability"
  ON personal_files FOR SELECT TO authenticated
  USING (true);

-- Archivists and SuperAdmins can write files
CREATE POLICY "Archivists and SuperAdmins write files"
  ON personal_files FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('Archivist', 'SuperAdmin'));

CREATE POLICY "Archivists and SuperAdmins update files"
  ON personal_files FOR UPDATE TO authenticated
  USING (get_user_role() IN ('Archivist', 'SuperAdmin'))
  WITH CHECK (get_user_role() IN ('Archivist', 'SuperAdmin'));

-- Only SuperAdmin can DELETE files
CREATE POLICY "Only SuperAdmins execute delete operations on personal files"
  ON personal_files FOR DELETE TO authenticated
  USING (get_user_role() = 'SuperAdmin');


-- -------------------------------------------------------
-- POLICY MATRIX FOR: document_records
-- -------------------------------------------------------

-- Metadata Select: Readable by all roles
CREATE POLICY "Unified document records select metadata capability"
  ON document_records FOR SELECT TO authenticated
  USING (true);

-- Archivists and SuperAdmins can insert document records
CREATE POLICY "Archivists and SuperAdmins insert document metadata"
  ON document_records FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('Archivist', 'SuperAdmin'));

-- Archivists and SuperAdmins can update document records
CREATE POLICY "Archivists and SuperAdmins update document metadata"
  ON document_records FOR UPDATE TO authenticated
  USING (get_user_role() IN ('Archivist', 'SuperAdmin'))
  WITH CHECK (get_user_role() IN ('Archivist', 'SuperAdmin'));

-- Only SuperAdmin can DELETE document records
CREATE POLICY "Only SuperAdmins execute delete operations on document metadata"
  ON document_records FOR DELETE TO authenticated
  USING (get_user_role() = 'SuperAdmin');


-- -------------------------------------------------------
-- STORAGE BUCKET POLICIES (Supabase storage.objects)
-- Bucket: 'document-pdfs'
-- -------------------------------------------------------

-- Read Access: Limited to Archivist & SuperAdmin Roles. Strict Viewer restriction.
-- (Exception allowed if specific file explicitly marked/flagged)
CREATE POLICY "Cabinet storage PDF select restrictions"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'document-pdfs' AND (
      get_user_role() IN ('Archivist', 'SuperAdmin') OR
      -- Code simulation for viewer explicitly flagged column checks:
      EXISTS (
        SELECT 1 FROM document_records 
        WHERE pdf_storage_path = storage.objects.name AND viewer_explicitly_flaged = true
      )
    )
  );

-- Insert Access: Archivist & SuperAdmin are allowed to upload
CREATE POLICY "Cabinet storage PDF insert restrictions"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'document-pdfs' AND 
    get_user_role() IN ('Archivist', 'SuperAdmin')
  );

-- Only SuperAdmin has storage delete access
CREATE POLICY "Cabinet storage PDF delete restrictions"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'document-pdfs' AND 
    get_user_role() = 'SuperAdmin'
  );
`;

  // Simulate SQL execution console logs
  const handleRunSimulateQuery = () => {
    setIsRunning(true);
    setQueryOutput('-- Spinning connection pool...\n-- Authenticating user with active role: ' + activeRole + '\n');
    
    setTimeout(() => {
      let output = '';
      const start = Date.now();
      
      try {
        switch (selectedQuery) {
          case 'SELECT_ALL':
            output = JSON.stringify(records, null, 2);
            break;
            
          case 'SELECT_FILES':
            const personalFiles = records.map(r => ({
              id: r.file_id,
              master_file_no: r.master_file_no,
              applicant_name: r.applicant_name,
              passport_no: r.passport_no,
              nationality: r.nationality
            })).filter((v, i, self) => self.findIndex(t => t.id === v.id) === i);
            
            output = `-- QUERY: SELECT id, master_file_no, applicant_name, passport_no, nationality FROM personal_files;\n`;
            output += `-- Status: SUCCESS (Returned ${personalFiles.length} rows in ${Date.now() - start}ms)\n\n`;
            output += JSON.stringify(personalFiles, null, 2);
            break;

          case 'SELECT_DOCUMENTS':
            const docRecords = records.map(r => ({
              id: r.id,
              file_id: r.file_id,
              doc_type: r.doc_type,
              doc_number: r.doc_number,
              status: r.status,
              cabinet_box_no: r.cabinet_box_no,
              shelf_location: r.shelf_location,
              binder_slot_sequence: r.binder_slot_sequence
            }));
            
            output = `-- QUERY: SELECT id, file_id, doc_type, doc_number, status, cabinet_box_no FROM document_records;\n`;
            output += `-- Status: SUCCESS (Returned ${docRecords.length} rows)\n\n`;
            output += JSON.stringify(docRecords, null, 2);
            break;

          case 'AGGREGATE_CABINETS':
            const cabinetMap: Record<string, any> = {};
            records.forEach(r => {
              if (!cabinetMap[r.cabinet_box_no]) {
                cabinetMap[r.cabinet_box_no] = { count: 0, doc_types: [] };
              }
              cabinetMap[r.cabinet_box_no].count++;
              if (!cabinetMap[r.cabinet_box_no].doc_types.includes(r.doc_type)) {
                cabinetMap[r.cabinet_box_no].doc_types.push(r.doc_type);
              }
            });
            output = `-- QUERY: SELECT cabinet_box_no, count(id) FROM document_records GROUP BY cabinet_box_no;\n\n`;
            output += JSON.stringify(cabinetMap, null, 2);
            break;

          case 'TEST_RLS_VIOLATION':
            if (activeRole === 'Viewer') {
              output = `-- EXECUTING QUERY: INSERT INTO document_records (doc_type, doc_number, cabinet_box_no) VALUES (...);\n`;
              output += `[ERROR] CRITICAL POLICY VIOLATION (42501): new row violates Row-Level Security (RLS) policies for table "document_records".\n`;
              output += `Reason: User role 'Viewer' does not possess INSERT privileges on target table metadata unless elevated.`;
            } else {
              output = `-- EXECUTING QUERY: INSERT INTO document_records (doc_type, doc_number) VALUES ('Residence Permit', 'MOCK-X');\n`;
              output += `-- Status: SUCCESS. 1 row inserted.\n`;
              output += `-- Authorized by security policy "Archivists and SuperAdmins write/insert document metadata".`;
            }
            break;
            
          default:
            output = 'No query output generated.';
        }
      } catch (err: any) {
        output = `Error executing simulated statement: ${err.message}`;
      }

      setQueryOutput(output);
      setIsRunning(false);
    }, 700);
  };

  const copyToClipboard = () => {
    const textToCopy = selectedSchemaTab === 'sql' ? POSTGRES_SQL_SCRIPT : RLS_POLICIES_SCRIPT;
    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  React.useEffect(() => {
    handleRunSimulateQuery();
  }, [selectedQuery, activeRole]);

  return (
    <div className="space-y-6 text-[13px]">
      
      {/* Intro section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Supabase Postgres Schema & Security console
          </h2>
          <p className="text-xs text-slate-500">
            Export relational schemas, audit customizable row-level security policies, and benchmark interactive simulated query sandboxes.
          </p>
        </div>
        
        <div className="bg-slate-100 flex items-center gap-1.5 p-1 rounded-lg border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 px-2">Active Simulator context:</span>
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 font-bold text-xs text-indigo-700 px-2.5 py-1 rounded shadow-xs uppercase">
            <Lock className="w-3.5 h-3.5" />
            Role Policy: {activeRole}
          </div>
        </div>
      </div>

      {/* Grid Layout: Left raw syntax code copy, Right Live PostgreSQL emulator sandboxing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Side: Copyable Schema viewer */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg shadow-xs flex flex-col overflow-hidden h-[540px]">
          
          {/* Header toolbar */}
          <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between items-center shrink-0">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedSchemaTab('sql')}
                className={`px-3 py-1 font-semibold text-xs rounded transition flex items-center gap-1 cursor-pointer ${selectedSchemaTab === 'sql' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-800'}`}
              >
                <Layers className="w-3.5 h-3.5" /> Core Tables SQL
              </button>
              <button
                onClick={() => setSelectedSchemaTab('rls')}
                className={`px-3 py-1 font-semibold text-xs rounded transition flex items-center gap-1 cursor-pointer ${selectedSchemaTab === 'rls' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-800'}`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> RLS Security Rules
              </button>
            </div>

            <button
              onClick={copyToClipboard}
              className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 rounded hover:shadow-xs transition text-xs flex items-center gap-1 cursor-pointer font-semibold"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied Setup Script
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy SQL Code
                </>
              )}
            </button>
          </div>

          {/* Symmetrical Terminal Editor Code scroll */}
          <div className="flex-1 bg-slate-900 p-4 font-mono text-[11px] text-slate-300 overflow-y-auto leading-relaxed relative selection:bg-indigo-800 selection:text-white">
            <div className="absolute top-2 right-2 text-[9px] text-slate-500 select-none uppercase font-bold tracking-widest bg-slate-800/80 border border-slate-700 px-1.5 py-0.5 rounded">
              PostgreSQL
            </div>
            
            <pre className="whitespace-pre-wrap">
              {selectedSchemaTab === 'sql' ? POSTGRES_SQL_SCRIPT : RLS_POLICIES_SCRIPT}
            </pre>
          </div>

          <div className="bg-slate-50 border-t border-slate-200 p-3 text-[11px] text-slate-500 flex items-center gap-1.5 font-sans">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>These setup scripts can be run directly inside any Supabase SQL Editor console to provision the database schema or security parameters.</span>
          </div>

        </div>

        {/* Right Side: Virtual Sandbox client compiler */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg shadow-xs flex flex-col overflow-hidden h-[540px]">
          
          <div className="bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-800 p-3.5 text-slate-200 flex justify-between items-center shrink-0">
            <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Terminal className="text-emerald-400 w-4 h-4" />
              Interactive Postgres Simulator
            </span>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Database Online: 2026-05-23
            </div>
          </div>

          <div className="p-4 space-y-4 flex-1 flex flex-col justify-between overflow-y-auto">
            
            {/* Custom interactive controls */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">
                Select Statement to run:
              </label>

              <div className="grid grid-cols-1 gap-1.5 font-mono">
                
                <button
                  onClick={() => setSelectedQuery('SELECT_FILES')}
                  className={`w-full text-left p-2.5 rounded border transition flex items-start gap-2.5 ${selectedQuery === 'SELECT_FILES' ? 'bg-indigo-50 border-indigo-300 text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  <Terminal className="w-4 h-4 shrink-0 text-slate-500 mt-0.5" />
                  <div>
                    <div className="font-bold text-[11px]">SELECT * FROM personal_files;</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Fetch and scan core applicant name, nationality parameters.</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedQuery('SELECT_DOCUMENTS')}
                  className={`w-full text-left p-2.5 rounded border transition flex items-start gap-2.5 ${selectedQuery === 'SELECT_DOCUMENTS' ? 'bg-indigo-50 border-indigo-300 text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  <Terminal className="w-4 h-4 shrink-0 text-slate-500 mt-0.5" />
                  <div>
                    <div className="font-bold text-[11px]">SELECT * FROM document_records;</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Query document status, categories, and physical coordenadas.</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedQuery('AGGREGATE_CABINETS')}
                  className={`w-full text-left p-2.5 rounded border transition flex items-start gap-2.5 ${selectedQuery === 'AGGREGATE_CABINETS' ? 'bg-indigo-50 border-indigo-300 text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  <Terminal className="w-4 h-4 shrink-0 text-slate-500 mt-0.5" />
                  <div>
                    <div className="font-bold text-[11px]">GROUP BY cabinet_box_no COUNT;</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Analyze physical capacity density inside real archive rooms.</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedQuery('TEST_RLS_VIOLATION')}
                  className={`w-full text-left p-2.5 rounded border transition flex items-start gap-2.5 ${selectedQuery === 'TEST_RLS_VIOLATION' ? 'bg-red-50/50 border-red-300 text-red-950' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <div>
                    <div className="font-bold text-[11px] text-red-800">TEST POLICY INSERT RLS;</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Simulate security compliance triggers based on the active role.</div>
                  </div>
                </button>

              </div>

              {/* Run Query button */}
              <div className="flex gap-2 justify-between items-center bg-slate-50 p-2.5 border border-slate-200 rounded-lg">
                <div className="text-[11px] text-slate-500 font-sans flex items-center gap-1.5 leading-tight">
                  <Play className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Runs directly against our active memory index store simulator.</span>
                </div>
                <button
                  onClick={handleRunSimulateQuery}
                  disabled={isRunning}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded transition text-xs flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <RefreshCw className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`} /> Run Simulation Query
                </button>
              </div>

            </div>

            {/* Simulated Live Output screen */}
            <div className="flex-1 min-h-[160px] bg-slate-950 rounded-lg p-3 font-mono text-[11px] text-emerald-400 overflow-y-auto border border-slate-800 block relative mt-3 select-all">
              <span className="absolute bottom-2 right-2 text-[9px] font-bold text-slate-600 uppercase">
                Mock PostgreSQL Response Screen
              </span>
              {isRunning ? (
                <div className="text-slate-500 animate-pulse flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  Running transactional Postgres routine...
                </div>
              ) : (
                <pre className="whitespace-pre-wrap">{queryOutput}</pre>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
