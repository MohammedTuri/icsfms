-- =======================================================
-- SYSTEM ARCHITECTURE: DOCUMENT ARCHIVE & TRACKING SCHEMA
-- Database: PostgreSQL (Supabase Compatible)
-- Generated on: 2026-05-23
-- Target Application: Archive Registry Divisions Ledger
-- =======================================================

-- -------------------------------------------------------
-- 1. ENUMS AND CUSTOM TYPES
-- -------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('SuperAdmin', 'Archivist', 'Viewer');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doc_category') THEN
    CREATE TYPE doc_category AS ENUM ('ICS Visa', 'Residence Permit', 'Origin ID', 'ETD', 'Yellow Card');
  END IF;
END $$;

-- -------------------------------------------------------
-- 2. USER PROFILES TABLE
-- -------------------------------------------------------
-- Syncs with auth.users via Supabase auth triggers
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'Viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- -------------------------------------------------------
-- 3. PERSONAL MASTER FILES (Applicant Core Identities)
-- -------------------------------------------------------
CREATE TABLE personal_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  master_file_no VARCHAR(50) UNIQUE NOT NULL, -- Format example: FSD-M-YYYY-XXXX
  applicant_name TEXT NOT NULL,
  passport_no VARCHAR(50) NOT NULL,
  nationality TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create performance indexes for frequent lookups
CREATE INDEX idx_personal_master_no ON personal_files(master_file_no);
CREATE INDEX idx_applicant_name_trgm ON personal_files(applicant_name);
CREATE INDEX idx_passport_raw_no ON personal_files(passport_no);

-- -------------------------------------------------------
-- 4. DOCUMENT RECORDS TABLE (Physical Archive Mappings)
-- -------------------------------------------------------
CREATE TABLE document_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES personal_files(id) ON DELETE CASCADE NOT NULL,
  doc_type doc_category NOT NULL,
  doc_number VARCHAR(100) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  
  status VARCHAR(50) DEFAULT 'Active', -- Status tracked cleanly in ledger
  
  -- PHYSICAL COORDINATE MATRIX MAPPING
  cabinet_box_no VARCHAR(50) NOT NULL,        -- e.g., 'BOX-2026-A'
  shelf_location VARCHAR(100) NOT NULL,       -- e.g., 'Row 3, Shelf B'
  binder_slot_sequence VARCHAR(100) NOT NULL, -- e.g., 'Binder 2 / Slot 12'
  
  -- STORAGE TRACKING & METADATA
  pdf_storage_path TEXT NOT NULL,             -- Storage path key inside Supabase bucket
  file_size_bytes INTEGER DEFAULT 0,
  viewer_explicitly_flaged BOOLEAN DEFAULT false, -- Set to true to override viewer access checks
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indices to optimize cabinet inventory dashboards and expiry checkers
CREATE INDEX idx_cabinet_box_no ON document_records(cabinet_box_no);
CREATE INDEX idx_expiry_checker ON document_records(expiry_date);
CREATE INDEX idx_doc_records_file_id ON document_records(file_id);


-- =======================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES & FUNCTIONS
-- =======================================================

-- Enable RLS on core system tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_records ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- SECURE FUNCTIONS & TRIGGER SETUPS
-- -------------------------------------------------------

-- Retrieve the active user's internal application role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- -------------------------------------------------------
-- POLICY MATRIX FOR: profiles
-- -------------------------------------------------------

-- Allow profile lookups to any authenticated application user
CREATE POLICY "Public profile lookup capability"
  ON profiles FOR SELECT TO authenticated
  USING (true);

-- Edit profile settings: strictly reserved for SuperAdmins
CREATE POLICY "SuperAdmins maintain unrestricted profile modification"
  ON profiles FOR ALL TO authenticated
  USING (get_user_role() = 'SuperAdmin')
  WITH CHECK (get_user_role() = 'SuperAdmin');

-- -------------------------------------------------------
-- POLICY MATRIX FOR: personal_files
-- -------------------------------------------------------

-- Selective RLS Select: Readable by all authenticated roles
CREATE POLICY "Unified personal file select capability"
  ON personal_files FOR SELECT TO authenticated
  USING (true);

-- Insert/Update rights: Archivist and SuperAdmin roles
CREATE POLICY "Archivists and SuperAdmins write files"
  ON personal_files FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('Archivist', 'SuperAdmin'));

CREATE POLICY "Archivists and SuperAdmins update files"
  ON personal_files FOR UPDATE TO authenticated
  USING (get_user_role() IN ('Archivist', 'SuperAdmin'))
  WITH CHECK (get_user_role() IN ('Archivist', 'SuperAdmin'));

-- Delete operations: Uniquely restricted to SuperAdmin
CREATE POLICY "Only SuperAdmins execute delete operations on personal files"
  ON personal_files FOR DELETE TO authenticated
  USING (get_user_role() = 'SuperAdmin');

-- -------------------------------------------------------
-- POLICY MATRIX FOR: document_records
-- -------------------------------------------------------

-- Unified document records select permission
CREATE POLICY "Unified document records select metadata capability"
  ON document_records FOR SELECT TO authenticated
  USING (true);

-- Insert/Update rights: Archivist and SuperAdmin roles
CREATE POLICY "Archivists and SuperAdmins insert document metadata"
  ON document_records FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('Archivist', 'SuperAdmin'));

CREATE POLICY "Archivists and SuperAdmins update document metadata"
  ON document_records FOR UPDATE TO authenticated
  USING (get_user_role() IN ('Archivist', 'SuperAdmin'))
  WITH CHECK (get_user_role() IN ('Archivist', 'SuperAdmin'));

-- Delete operations: Only SuperAdmins can delete archive metadata
CREATE POLICY "Only SuperAdmins execute delete operations on document metadata"
  ON document_records FOR DELETE TO authenticated
  USING (get_user_role() = 'SuperAdmin');


-- =======================================================
-- SUPABASE STORAGE BUCKET SECURITY RULES
-- Bucket Target: 'document-pdfs'
-- =======================================================

-- 1. Read Storage Access: Restricted to Archivist and SuperAdmin roles.
-- Exception: Viewers can retrieve files if the document record has the explicit override flag.
CREATE POLICY "Cabinet storage PDF select restrictions"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'document-pdfs' AND (
      get_user_role() IN ('Archivist', 'SuperAdmin') OR
      EXISTS (
        SELECT 1 FROM document_records 
        WHERE pdf_storage_path = storage.objects.name AND viewer_explicitly_flaged = true
      )
    )
  );

-- 2. Upload Storage Access: Only Archivists and SuperAdmins
CREATE POLICY "Cabinet storage PDF insert restrictions"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'document-pdfs' AND 
    get_user_role() IN ('Archivist', 'SuperAdmin')
  );

-- 3. Delete Storage Access: Only SuperAdmins
CREATE POLICY "Cabinet storage PDF delete restrictions"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'document-pdfs' AND 
    get_user_role() = 'SuperAdmin'
  );

-- =======================================================
-- 5. SEED DATA GENERATION (Simulated Setup Mocking)
-- =======================================================
-- Note: These inserts can be used to pre-populate default records for testing.

-- INSERT INTO personal_files (id, master_file_no, applicant_name, passport_no, nationality) VALUES
--   ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'FSD-M-2026-9041', 'Amara Chuks-Kalu', 'A02941566', 'Nigeria'),
--   ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'FSD-M-2026-3829', 'Jean-Luc Dubois', 'B18390251', 'France');

-- INSERT INTO document_records (file_id, doc_type, doc_number, issue_date, expiry_date, cabinet_box_no, shelf_location, binder_slot_sequence, pdf_storage_path, file_size_bytes) VALUES
--   ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'ICS Visa', 'NGA-VS-2026-004', '2026-01-15', '2026-07-15', 'BOX-2026-A', 'Row 3, Shelf B', 'Binder 1 / Slot 4', 'document-pdfs/NG_VS_2026_004.pdf', 1048576);
