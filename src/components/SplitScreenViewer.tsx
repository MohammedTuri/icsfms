import React from 'react';
import { UnifiedRecord, DocCategory, UserRole } from '../types';
import { 
  FileText, ShieldCheck, CreditCard, Ticket, Layers, 
  Lock, Check, Trash2, Edit2, AlertCircle, Sparkles, Download, 
  EyeOff, RefreshCw, Pin, Eye, Calendar, Printer, CheckCircle
} from 'lucide-react';

interface SplitScreenViewerProps {
  selectedRecord: UnifiedRecord | null;
  activeRole: UserRole;
  onUpdateRecord: (updated: UnifiedRecord) => void;
  onDeleteRecord: (id: string) => void;
  showToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export default function SplitScreenViewer({ 
  selectedRecord, 
  activeRole, 
  onUpdateRecord, 
  onDeleteRecord,
  showToast
}: SplitScreenViewerProps) {
  
  // Local state for editing metadata form (on the left)
  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const [formData, setFormData] = React.useState<Partial<UnifiedRecord>>({});
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Sync selected record with form state
  React.useEffect(() => {
    if (selectedRecord) {
      setFormData(selectedRecord);
      setIsEditing(false);
    }
  }, [selectedRecord]);

  // Read capability details
  const isViewer = activeRole === 'Viewer';
  const isArchivist = activeRole === 'Archivist';
  const isSuperAdmin = activeRole === 'SuperAdmin';
  
  // Viewer can only view PDF if the file is explicitly flagged
  const viewerHasAccessToPdf = selectedRecord?.viewer_explicitly_flaged === true;
  const pdfAccessAllowed = !isViewer || viewerHasAccessToPdf;

  // React Canvas Drawing for Interactive PDF Simulator on the Right
  React.useEffect(() => {
    if (!selectedRecord || !canvasRef.current || !pdfAccessAllowed) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-density proportions
    const width = 450;
    const height = 580;
    canvas.width = width;
    canvas.height = height;

    // Clear background (standard official document off-white paper look)
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(0, 0, width, height);

    // Dynamic color banner based on document category
    let headerColor = '#1e293b'; // Slate
    let lightAccent = '#f1f5f9';
    if (selectedRecord.doc_type === 'ICS Visa') { headerColor = '#475569'; lightAccent = '#f8fafc'; }
    else if (selectedRecord.doc_type === 'Residence Permit') { headerColor = '#059669'; lightAccent = '#ecfdf5'; }
    else if (selectedRecord.doc_type === 'Origin ID') { headerColor = '#d97706'; lightAccent = '#fffbeb'; }
    else if (selectedRecord.doc_type === 'ETD') { headerColor = '#2563eb'; lightAccent = '#eff6ff'; }
    else if (selectedRecord.doc_type === 'Yellow Card') { headerColor = '#ea580c'; lightAccent = '#fff7ed'; }

    ctx.fillStyle = headerColor;
    ctx.fillRect(0, 0, width, 14); // Very thin aesthetic top edge stripe

    // Draw document frame border outline
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 15, width - 30, height - 30);

    // Draw Official Document Header Header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('IMMIGRATION EVIDENCE & ARCHIVAL DIGITIZATION CORE', 35, 45);

    ctx.fillStyle = '#64748b';
    ctx.font = '700 8px sans-serif';
    ctx.fillText('SOURCE DIVISION: FSD CHRONOLOGICAL LEDGER INDEX', 35, 58);

    // Drawer a coordinate separator line
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(35, 68);
    ctx.lineTo(width - 35, 68);
    ctx.stroke();

    // Draw Master File Coordinates Info
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(selectedRecord.doc_type.toUpperCase(), 35, 90);

    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(`MASTER FILE NO: ${selectedRecord.master_file_no}`, 35, 105);

    ctx.fillStyle = '#475569';
    ctx.font = '9px sans-serif';
    ctx.fillText(`Physical Coordinate: Box Locker ${selectedRecord.cabinet_box_no} / ${selectedRecord.shelf_location}`, 35, 120);

    // Draw a grey container background for applicant metadata info
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(35, 135, width - 70, 110);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(35, 135, width - 70, 110);

    // Populate simulated document parameters inside grey card
    ctx.fillStyle = '#64748b';
    ctx.font = '9px sans-serif';
    ctx.fillText('APPLICANT NAME', 48, 155);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(selectedRecord.applicant_name, 48, 170);

    ctx.fillStyle = '#64748b';
    ctx.font = '9px sans-serif';
    ctx.fillText('PASSPORT CORES', 48, 195);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`${selectedRecord.passport_no} (${selectedRecord.nationality.toUpperCase()})`, 48, 208);

    ctx.fillStyle = '#64748b';
    ctx.font = '9px sans-serif';
    ctx.fillText('DOCUMENT SERIAL OR PARSED ID', 240, 155);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(selectedRecord.doc_number, 240, 170);

    ctx.fillStyle = '#64748b';
    ctx.font = '9px sans-serif';
    ctx.fillText('EXPIRATION CHECK', 240, 195);
    const expText = `${selectedRecord.expiry_date} - ${selectedRecord.status}`;
    ctx.fillStyle = selectedRecord.status === 'Expired' ? '#ef4444' : '#10b981';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(expText, 240, 208);

    // Draw an official looking Government Verification watermark circle stamp
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.2)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(330, 360, 50, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = 'rgba(37, 99, 235, 0.25)';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText('IMMIGRATION DIV', 295, 345);
    ctx.fillText('FSD VERIFIED', 300, 360);
    ctx.fillText('ARCHIVAL DEPT', 298, 375);

    // Draw secondary examined red stamp (slanted grid look)
    ctx.save();
    ctx.translate(140, 340);
    ctx.rotate(-0.16);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.strokeRect(-60, -20, 120, 38);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('EXAMINED SYSTEM SECURE', -50, -5);
    ctx.fillText('DATE: 2026-05-23', -40, 10);
    ctx.restore();

    // Bottom structural barcode tracking lines
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 7px monospace';
    ctx.fillText(`SUPABASE REF: ${selectedRecord.pdf_storage_path}`, 35, 510);

    // Draw a clean mock barcode
    ctx.fillStyle = '#1e293b';
    let currentBarcodeX = 35;
    const barcodeY = 522;
    const barcodeHeight = 22;
    for (let j = 0; j < 48; j++) {
      const barWidth = (j % 3 === 0) ? 2.5 : (j % 5 === 0) ? 4 : 1;
      const barGap = (j % 2 === 0) ? 1.5 : 2;
      ctx.fillRect(currentBarcodeX, barcodeY, barWidth, barcodeHeight);
      currentBarcodeX += barWidth + barGap;
    }
    ctx.font = '7px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`*${selectedRecord.id.toUpperCase()}-${selectedRecord.file_id.toUpperCase()}*`, 35, 554);

    // Explicit Indicator warning labels if viewer has explicit view permission
    if (viewerHasAccessToPdf) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(33, 270, width - 66, 30);
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('VIEWER EXPLICIT FLAG APPLIED - ACCESS GRANTED VIA SECURITY POLICIES EXCEPTION', 45, 288);
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 7.5px sans-serif';
      ctx.fillText('Archival Evidence Locker digital metadata synchronized with physical coordinates catalog.', 35, 480);
    }

  }, [selectedRecord, pdfAccessAllowed, viewerHasAccessToPdf, activeRole]);

  if (!selectedRecord) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center text-slate-400 font-sans flex flex-col items-center justify-center space-y-4">
        <FileText className="w-12 h-12 text-slate-300 animate-pulse" />
        <div className="space-y-1">
          <h3 className="text-slate-700 font-bold text-sm uppercase">No Record Selected</h3>
          <p className="text-xs max-w-sm mx-auto">
            Select a document row from the primary interactive datagrid above to launch the secure split-screen document viewer.
          </p>
        </div>
      </div>
    );
  }

  // Handle saving modified inputs manually
  const handleSaveMetadataChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      showToast('Viewer accounts cannot edit file metadata due to Postgres security parameters.', 'error');
      return;
    }
    
    // Validate required fields
    if (!formData.applicant_name?.trim() || !formData.passport_no?.trim() || !formData.doc_number?.trim()) {
      showToast('Validation Failed: Correct blank parameters.', 'error');
      return;
    }

    // Recompute Expired Status based on static context date 2026-05-23
    const TODAY = new Date('2026-05-23T09:19:20Z');
    const expiry = formData.expiry_date ? new Date(formData.expiry_date) : TODAY;
    const computedStatus = expiry < TODAY ? 'Expired' : 'Active';

    const mergedUpdated: UnifiedRecord = {
      ...selectedRecord,
      ...formData,
      status: computedStatus,
    } as UnifiedRecord;

    onUpdateRecord(mergedUpdated);
    setIsEditing(false);
    showToast('Immigration file metadata synchronized to Postgres personal_files & document_records databases.', 'success');
  };

  // Safe file size converter
  const convertedSizeMB = React.useMemo(() => {
    return selectedRecord.file_size_bytes 
      ? (selectedRecord.file_size_bytes / (1024 * 1024)).toFixed(2)
      : '2.4';
  }, [selectedRecord]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      
      {/* LEFT HALF: Interactive metadata edit parameters */}
      <div className="lg:col-span-6 p-4 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
        
        <div>
          {/* Section banner */}
          <div className="flex justify-between items-center border-b pb-3 border-slate-100">
            <div className="space-y-0.5">
              <span className="text-[9px] bg-slate-900 text-slate-100 font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                METADATA COMPONENT (personal_files)
              </span>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight uppercase flex items-center gap-1.5 mt-1">
                <Layers className="w-4 h-4 text-slate-600" /> FILE PARAMETERS
              </h3>
            </div>

            {/* Editing states block */}
            <div className="flex gap-1.5">
              {!isEditing ? (
                <button
                  onClick={() => {
                    if (isViewer) {
                      showToast('Security Alert: Viewer role restricted from modifying records.', 'error');
                      return;
                    }
                    setIsEditing(true);
                  }}
                  className={`px-3 py-1 font-semibold text-xs border rounded transition flex items-center gap-1 cursor-pointer ${isViewer ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300 hover:text-indigo-600'}`}
                >
                  <Edit2 className="w-3 h-3" /> Edit Entry
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 font-semibold text-xs rounded transition cursor-pointer"
                >
                  Cancel
                </button>
              )}

              {isSuperAdmin && (
                <button
                  onClick={() => {
                    if (confirm(`Confirm permanent deletion of ${selectedRecord.applicant_name} record? This executes a CASCADE transaction from Supabase.`)) {
                      onDeleteRecord(selectedRecord.id);
                      showToast('Database record purged successfully.', 'success');
                    }
                  }}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1 font-semibold text-xs rounded transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Purge
                </button>
              )}
            </div>
          </div>

          {/* Form setup */}
          <form onSubmit={handleSaveMetadataChanges} className="space-y-4 mt-4">
            
            {/* Applicant core */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
              <span className="text-[9px] font-bold uppercase font-mono tracking-wider text-slate-500">Applicant Core Credentials</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Applicant Legal Name</label>
                  <input
                    type="text"
                    value={formData.applicant_name || ''}
                    disabled={!isEditing}
                    onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Master File Sequence No</label>
                  <input
                    type="text"
                    value={formData.master_file_no || ''}
                    disabled={!isEditing}
                    onChange={(e) => setFormData({ ...formData, master_file_no: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-600 font-mono text-indigo-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Passport Number</label>
                  <input
                    type="text"
                    value={formData.passport_no || ''}
                    disabled={!isEditing}
                    onChange={(e) => setFormData({ ...formData, passport_no: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-600 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Applicant Citizenship</label>
                  <input
                    type="text"
                    value={formData.nationality || ''}
                    disabled={!isEditing}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* Document details */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
              <span className="text-[9px] font-bold uppercase font-mono tracking-wider text-slate-500">Document Specific Metadata</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Document Category Key</label>
                  <select
                    value={formData.doc_type || 'ICS Visa'}
                    disabled={!isEditing}
                    onChange={(e) => setFormData({ ...formData, doc_type: e.target.value as DocCategory })}
                    className="w-full text-xs bg-white border border-slate-300 rounded px-1.5 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-600 font-bold"
                  >
                    <option value="ICS Visa">ICS Visa</option>
                    <option value="Residence Permit">Residence Permit</option>
                    <option value="Origin ID">Origin ID</option>
                    <option value="ETD">ETD</option>
                    <option value="Yellow Card">Yellow Card</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Document Identification Serial</label>
                  <input
                    type="text"
                    value={formData.doc_number || ''}
                    disabled={!isEditing}
                    onChange={(e) => setFormData({ ...formData, doc_number: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Issue Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={formData.issue_date || ''}
                    disabled={!isEditing}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-600 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Expiry Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={formData.expiry_date || ''}
                    disabled={!isEditing}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-600 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* PHYSICAL COORDINATE PROFILE (Matches user objective) */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3 border-l-4 border-l-amber-500">
              <span className="text-[10px] font-extrabold uppercase font-mono tracking-widest text-slate-700 flex items-center gap-1">
                <Pin className="w-3.5 h-3.5 text-amber-500 rotate-45" /> Physical Cabinet coordinate details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 font-mono">CABINET BOX IDENTIFIER</label>
                  <input
                    type="text"
                    value={formData.cabinet_box_no || ''}
                    disabled={!isEditing}
                    placeholder="e.g. BOX-2026-A"
                    onChange={(e) => setFormData({ ...formData, cabinet_box_no: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-700 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 font-mono">SHELF/ROW COORDINATE</label>
                  <input
                    type="text"
                    value={formData.shelf_location || ''}
                    disabled={!isEditing}
                    placeholder="e.g. Row 3, Shelf B"
                    onChange={(e) => setFormData({ ...formData, shelf_location: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 font-mono">BINDER/SLOT SEQUENCE</label>
                  <input
                    type="text"
                    value={formData.binder_slot_sequence || ''}
                    disabled={!isEditing}
                    placeholder="e.g. Binder 2 / Slot 12"
                    onChange={(e) => setFormData({ ...formData, binder_slot_sequence: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Viewer Explicit Flag Trigger section */}
            <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between text-xs text-indigo-950 font-medium">
              <div className="space-y-0.5 max-w-[280px]">
                <div className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Secure Viewer Override Flag
                </div>
                <div className="text-[11px] text-indigo-700">Allow authenticated Viewer accounts to inspect the PDF visual representation screen.</div>
              </div>
              <label className="inline-flex items-center cursor-pointer relative">
                <input
                  type="checkbox"
                  disabled={!isEditing}
                  checked={formData.viewer_explicitly_flaged || false}
                  onChange={(e) => setFormData({ ...formData, viewer_explicitly_flaged: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Form actions save */}
            {isEditing && (
              <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-1.5 rounded text-xs cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-1.5 rounded text-xs cursor-pointer shadow-xs transition flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Commit Database Updates
                </button>
              </div>
            )}

          </form>
        </div>

        {/* Audit timeline details at the bottom of metadata */}
        <div className="mt-6 pt-3.5 border-t border-slate-100 space-y-3">
          <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
            <span>Supabase Storage Ref:</span>
            <span className="font-medium text-slate-600 truncate max-w-[240px] select-all">{selectedRecord.pdf_storage_path}</span>
          </div>
          
          <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
            <span>Standardized Size:</span>
            <span className="font-bold text-slate-700 uppercase bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{convertedSizeMB} MegaBytes (PDF Only)</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[10px] text-slate-500 font-mono space-y-0.5">
            <div>AUDIT_UUID: <span className="text-slate-700">{selectedRecord.id}-{selectedRecord.file_id}</span></div>
            <div>RECORD_CREATED: <span className="text-slate-700">{selectedRecord.uploaded_at}</span></div>
          </div>
        </div>

      </div>

      {/* RIGHT HALF: Secure PDF visualizer */}
      <div className="lg:col-span-6 bg-slate-50 p-4 flex flex-col justify-between items-center min-h-[580px]">
        
        {/* Secure Document Header title bar */}
        <div className="w-full flex justify-between items-center pb-2 border-b border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold font-mono">
            <Lock className="w-3.5 h-3.5 text-slate-500" /> Integrated PDF Canvas Viewer
          </div>

          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
            <span>Status:</span>
            {pdfAccessAllowed ? (
              <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
                <CheckCircle className="w-3 h-3 text-emerald-500" /> SECURE UNLOCKED
              </span>
            ) : (
              <span className="text-red-600 font-extrabold flex items-center gap-0.5">
                <EyeOff className="w-3 h-3 text-red-500" /> RLS REFUSED
              </span>
            )}
          </div>
        </div>

        {/* Display visual check block */}
        <div className="w-full flex-1 flex items-center justify-center p-2">
          
          {pdfAccessAllowed ? (
            <div className="relative border border-slate-300 rounded shadow bg-white max-w-full overflow-hidden">
              <canvas 
                ref={canvasRef} 
                className="block max-w-full bg-slate-100" 
                style={{ width: '380px', height: '490px' }} 
              />
              
              {/* Floating control buttons */}
              <div className="absolute bottom-3 right-3 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    alert(`Supabase Storage Bucket: Starting secure download fetch for "${selectedRecord.pdf_storage_path}" inside secure SSL session tunnel...`);
                    showToast('PDF Document downloaded in high fidelity.', 'success');
                  }}
                  className="bg-slate-900/90 hover:bg-slate-900 text-white rounded p-1.5 shadow tooltip transition cursor-pointer"
                  title="Secure Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => alert(`Print instruction transmitted to FSD standard output cabinet spooler.`)}
                  className="bg-slate-900/90 hover:bg-slate-900 text-white rounded p-1.5 shadow tooltip transition cursor-pointer"
                  title="Print File"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            // BLOCKED VIEW SHIELD
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-xl text-center flex flex-col items-center justify-center space-y-4 text-slate-300 font-mono">
              <EyeOff className="w-12 h-12 text-red-500 animate-bounce" />
              
              <div className="space-y-1">
                <span className="bg-red-950 text-red-400 border border-red-800 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded">
                  ACCESS DENIED
                </span>
                <h4 className="text-xs font-bold text-slate-100 uppercase mt-2">Row-Level Security Active</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs mt-1 font-sans">
                  Postgres storage bucket security policy <strong className="text-indigo-300">"Cabinet storage PDF select restrictions"</strong> refused SELECT authorization to role <strong className="text-yellow-500 font-bold">"Viewer"</strong>.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800 text-[10px] text-slate-500 space-y-1 font-mono text-left w-full">
                <div>• Object: {selectedRecord.pdf_storage_path}</div>
                <div>• Session Role: {activeRole}</div>
                <div>• Flag override State: false</div>
                <div>• SQL Error code: PG-42501-STORAGE</div>
              </div>

              <div className="text-[10px] text-slate-400 max-w-xs leading-normal font-sans bg-slate-800 p-2 rounded">
                💡 <strong>How to unlock:</strong> Select <strong>"SuperAdmin"</strong> or <strong>"Archivist"</strong> role in the toolbar to bypass RLS, or toggle the <strong>"Secure Viewer Override Flag"</strong> in form metadata.
              </div>
            </div>
          )}

        </div>

        {/* Footer info message */}
        <div className="w-full pt-2 border-t border-slate-200 text-center text-[10px] text-slate-400 flex items-center justify-between font-mono">
          <span>Symmetric Vault Lock: Active SSL</span>
          <span>FSD IMMIGRATION SECURE V3</span>
        </div>

      </div>

    </div>
  );
}
