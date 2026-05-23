import { UnifiedRecord } from './types';

export const INITIAL_IMMIGRATION_RECORDS: UnifiedRecord[] = [
  // ICS Visa
  {
    id: 'doc-001',
    file_id: 'file-101',
    master_file_no: 'FSD-M-2026-1011',
    applicant_name: 'Alexander Sterling Vance',
    passport_no: 'GB8238192',
    nationality: 'United Kingdom',
    doc_type: 'ICS Visa',
    doc_number: 'V-ICS-920198',
    issue_date: '2025-05-15',
    expiry_date: '2026-05-15', // Expired
    status: 'Expired',
    cabinet_box_no: 'BOX-2026-A',
    shelf_location: 'Row 3, Shelf B',
    binder_slot_sequence: 'Binder 1 / Slot 04',
    pdf_storage_path: 'document-pdfs/v_ics_920198_vance_20250515.pdf',
    file_size_bytes: 2840105, // ~2.7MB
    uploaded_at: '2025-05-15T10:30:00Z',
    viewer_explicitly_flaged: false
  },
  {
    id: 'doc-002',
    file_id: 'file-102',
    master_file_no: 'FSD-M-2026-1012',
    applicant_name: 'Evelyn Marie Dubois',
    passport_no: 'FR9021832',
    nationality: 'France',
    doc_type: 'ICS Visa',
    doc_number: 'V-ICS-109283',
    issue_date: '2025-11-20',
    expiry_date: '2026-11-20', // Active
    status: 'Active',
    cabinet_box_no: 'BOX-2026-A',
    shelf_location: 'Row 3, Shelf B',
    binder_slot_sequence: 'Binder 1 / Slot 05',
    pdf_storage_path: 'document-pdfs/v_ics_109283_dubois_20251120.pdf',
    file_size_bytes: 4120892, // ~3.9MB
    uploaded_at: '2025-11-20T14:45:00Z',
    viewer_explicitly_flaged: true // Viewer has explicit flag access!
  },
  {
    id: 'doc-003',
    file_id: 'file-103',
    master_file_no: 'FSD-M-2026-1013',
    applicant_name: 'Yuki Takahashi',
    passport_no: 'JP1829031',
    nationality: 'Japan',
    doc_type: 'ICS Visa',
    doc_number: 'V-ICS-748102',
    issue_date: '2026-01-10',
    expiry_date: '2027-01-10', // Active
    status: 'Active',
    cabinet_box_no: 'BOX-2026-B',
    shelf_location: 'Row 4, Shelf A',
    binder_slot_sequence: 'Binder 3 / Slot 11',
    pdf_storage_path: 'document-pdfs/v_ics_748102_takahashi_20260110.pdf',
    file_size_bytes: 3349102,
    uploaded_at: '2026-01-10T09:15:00Z',
    viewer_explicitly_flaged: false
  },

  // Residence Permit
  {
    id: 'doc-004',
    file_id: 'file-104',
    master_file_no: 'FSD-M-2026-2024',
    applicant_name: 'Li Wei Chang',
    passport_no: 'CN8102918',
    nationality: 'China',
    doc_type: 'Residence Permit',
    doc_number: 'R-PERM-553012',
    issue_date: '2024-04-20',
    expiry_date: '2029-04-20', // Active (5 Year Permit)
    status: 'Active',
    cabinet_box_no: 'BOX-2026-C',
    shelf_location: 'Row 2, Shelf D',
    binder_slot_sequence: 'Binder 12 / Slot 01',
    pdf_storage_path: 'document-pdfs/r_perm_553012_wei_20240420.pdf',
    file_size_bytes: 6512803,
    uploaded_at: '2024-04-22T16:00:00Z',
    viewer_explicitly_flaged: false
  },
  {
    id: 'doc-005',
    file_id: 'file-105',
    master_file_no: 'FSD-M-2026-2025',
    applicant_name: 'Elena Rostova',
    passport_no: 'RU1920318',
    nationality: 'Russia',
    doc_type: 'Residence Permit',
    doc_number: 'R-PERM-882910',
    issue_date: '2026-02-12',
    expiry_date: '2026-08-12', // Active (6-Month Investor Visa Transition)
    status: 'Active',
    cabinet_box_no: 'BOX-2026-C',
    shelf_location: 'Row 2, Shelf D',
    binder_slot_sequence: 'Binder 12 / Slot 02',
    pdf_storage_path: 'document-pdfs/r_perm_882910_rostova_20260212.pdf',
    file_size_bytes: 5891223,
    uploaded_at: '2026-02-13T11:24:00Z',
    viewer_explicitly_flaged: true
  },

  // Origin ID (Diaspora/Origin certification)
  {
    id: 'doc-006',
    file_id: 'file-106',
    master_file_no: 'FSD-M-2026-3031',
    applicant_name: 'Carlos Santana Cardona',
    passport_no: 'CO7182918',
    nationality: 'Colombia',
    doc_type: 'Origin ID',
    doc_number: 'ORG-ID-442109',
    issue_date: '2023-08-11',
    expiry_date: '2028-08-11', // Active
    status: 'Active',
    cabinet_box_no: 'BOX-2026-D',
    shelf_location: 'Row 1, Shelf C',
    binder_slot_sequence: 'Binder 5 / Slot 22',
    pdf_storage_path: 'document-pdfs/org_id_442109_cardona_20230811.pdf',
    file_size_bytes: 3120194,
    uploaded_at: '2023-08-12T10:15:00Z',
    viewer_explicitly_flaged: false
  },
  {
    id: 'doc-007',
    file_id: 'file-107',
    master_file_no: 'FSD-M-2026-3032',
    applicant_name: 'Amara Nnenna Okeke',
    passport_no: 'NG8029183',
    nationality: 'Nigeria',
    doc_type: 'Origin ID',
    doc_number: 'ORG-ID-772911',
    issue_date: '2021-06-15',
    expiry_date: '2026-06-15', // Expiring Soon (Relative to Local Date 2026-05-23)
    status: 'Active',
    cabinet_box_no: 'BOX-2026-D',
    shelf_location: 'Row 1, Shelf C',
    binder_slot_sequence: 'Binder 5 / Slot 23',
    pdf_storage_path: 'document-pdfs/org_id_772911_okeke_20210615.pdf',
    file_size_bytes: 4782012,
    uploaded_at: '2021-06-15T15:30:00Z',
    viewer_explicitly_flaged: false
  },

  // ETD Records
  {
    id: 'doc-008',
    file_id: 'file-108',
    master_file_no: 'FSD-M-2026-4041',
    applicant_name: 'Jack William Harrison',
    passport_no: 'AU8192803',
    nationality: 'Australia',
    doc_type: 'ETD',
    doc_number: 'ETD-921092',
    issue_date: '2026-05-01',
    expiry_date: '2026-05-31', // Active
    status: 'Active',
    cabinet_box_no: 'BOX-2026-E',
    shelf_location: 'Row 5, Shelf E',
    binder_slot_sequence: 'Binder 18 / Slot 01',
    pdf_storage_path: 'document-pdfs/etd_921092_harrison_20260501.pdf',
    file_size_bytes: 1849204,
    uploaded_at: '2026-05-01T17:20:00Z',
    viewer_explicitly_flaged: true
  },
  {
    id: 'doc-009',
    file_id: 'file-109',
    master_file_no: 'FSD-M-2026-4042',
    applicant_name: 'Clara Maria Nielsen',
    passport_no: 'DK9921038',
    nationality: 'Denmark',
    doc_type: 'ETD',
    doc_number: 'ETD-812032',
    issue_date: '2026-03-10',
    expiry_date: '2026-04-10', // Expired Emergency travel document
    status: 'Expired',
    cabinet_box_no: 'BOX-2026-E',
    shelf_location: 'Row 5, Shelf E',
    binder_slot_sequence: 'Binder 18 / Slot 02',
    pdf_storage_path: 'document-pdfs/etd_812032_nielsen_20260310.pdf',
    file_size_bytes: 2049182,
    uploaded_at: '2026-03-10T12:00:00Z',
    viewer_explicitly_flaged: false
  },

  // Yellow Card Records
  {
    id: 'doc-010',
    file_id: 'file-110',
    master_file_no: 'FSD-M-2026-5051',
    applicant_name: 'Kofi Mensah Boateng',
    passport_no: 'GH5539201',
    nationality: 'Ghana',
    doc_type: 'Yellow Card',
    doc_number: 'YEL-CARD-88120',
    issue_date: '2025-01-14',
    expiry_date: '2035-01-14', // Lifetime / Long duration Active
    status: 'Active',
    cabinet_box_no: 'BOX-2026-F',
    shelf_location: 'Row 2, Shelf F',
    binder_slot_sequence: 'Binder 8 / Slot 44',
    pdf_storage_path: 'document-pdfs/yel_card_88120_boateng_20250114.pdf',
    file_size_bytes: 1540102,
    uploaded_at: '2025-01-14T08:30:00Z',
    viewer_explicitly_flaged: false
  }
];
