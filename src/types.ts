export type DocCategory = 'ICS Visa' | 'Residence Permit' | 'Origin ID' | 'ETD' | 'Yellow Card';

export type UserRole = 'SuperAdmin' | 'Archivist' | 'Viewer';

export interface UserProfile {
  id: string; // UUID
  full_name: string;
  role: UserRole;
  email: string;
  avatar_url?: string;
}

export interface PersonalFile {
  id: string; // UUID (PK)
  master_file_no: string; // Unique, e.g. FSD-M-2026-9041
  applicant_name: string;
  passport_no: string;
  nationality: string;
}

export interface DocumentRecord {
  id: string; // UUID (PK)
  file_id: string; // FK to PersonalFile.id
  doc_type: DocCategory;
  doc_number: string;
  issue_date: string;
  expiry_date: string;
  status: 'Active' | 'Expired';
  cabinet_box_no: string; // e.g. BOX-2026-A
  shelf_location: string; // e.g. Row 3, Shelf B
  binder_slot_sequence: string; // e.g. Binder 2 / Slot 12
  pdf_storage_path: string; // Text path in Supabase storage bucket
  file_size_bytes?: number;
  uploaded_at: string;
}

// Denormalized joined structure for list display, filtering and table operations
export interface UnifiedRecord {
  id: string; // Document ID (PK)
  file_id: string; // File ID (FK)
  master_file_no: string;
  applicant_name: string;
  passport_no: string;
  nationality: string;
  doc_type: DocCategory;
  doc_number: string;
  issue_date: string;
  expiry_date: string;
  status: 'Active' | 'Expired'; // Client computed or backend stored
  cabinet_box_no: string;
  shelf_location: string;
  binder_slot_sequence: string;
  pdf_storage_path: string;
  file_size_bytes?: number;
  uploaded_at: string;
  
  // Custom metadata for simulated viewing permissions override (viewers explicitly flagged)
  viewer_explicitly_flaged?: boolean;
}

// Upload structure
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'scanning' | 'parsed' | 'failed';
  uploadedAt: string;
  categoryDetected?: DocCategory;
  parsedData?: Partial<UnifiedRecord>;
  error?: string;
  fileData?: string; // base64 representation if needed
  pdf_url?: string; // local preview Blob URL or simulated path
}

export interface Statistics {
  totalRecords: number;
  totalBoxes: number;
  expiringSoonCount: number; // Expiring in next 60 days
  totalUploadVolumeMB: number; // Combined sizes
  byCategory: Record<DocCategory, number>;
  byStatus: { Active: number; Expired: number };
  byCabinet: Record<string, number>;
}
