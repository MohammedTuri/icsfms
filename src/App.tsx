import React from 'react';
import { 
  Database, ShieldCheck, Sparkles, AlertCircle, Info, HelpCircle, 
  Layers, Settings, UserCheck, Shield, ChevronRight, Activity, Globe, LayoutDashboard, SearchCode, RefreshCw,
  Ticket, FileText, CreditCard, Menu, X
} from 'lucide-react';
import { UnifiedRecord, DocCategory, UserRole } from './types';
import { INITIAL_IMMIGRATION_RECORDS } from './mockData';
import DashboardOverview from './components/DashboardOverview';
import DocumentGrid from './components/DocumentGrid';
import SplitScreenViewer from './components/SplitScreenViewer';
import DocumentDigitizer from './components/DocumentDigitizer';
import BulkImportWorkspace from './components/BulkImportWorkspace';
import SupabaseSqlConsole from './components/SupabaseSqlConsole';

export default function App() {
  
  // Tab Management: 'dashboard' | 'database' | 'digitize' | 'bulk-import' | 'supabase-sql'
  const [activeTab, setActiveTab ] = React.useState<'dashboard' | 'database' | 'digitize' | 'bulk-import' | 'supabase-sql'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(false);
  
  // Interactive Active Role (Viewer by default, toggleable instantly)
  const [userRole, setUserRole] = React.useState<UserRole>('Archivist'); // Default to Archivist so the initial testing experience is fully unlocked
  
  // Records state
  const [records, setRecords] = React.useState<UnifiedRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = React.useState<UnifiedRecord | null>(null);
  const [gridCategoryFilter, setGridCategoryFilter] = React.useState<DocCategory | 'All'>('All');
  
  // General Loader & Toast state
  const [loading, setLoading] = React.useState<boolean>(true);
  const [toast, setToast] = React.useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Load state and mock records on load
  React.useEffect(() => {
    setLoading(true);
    const stored = localStorage.getItem('fsd_document_archive_records');
    if (stored) {
      try {
        setRecords(JSON.parse(stored));
      } catch (e) {
        setRecords(INITIAL_IMMIGRATION_RECORDS);
      }
    } else {
      setRecords(INITIAL_IMMIGRATION_RECORDS);
      localStorage.setItem('fsd_document_archive_records', JSON.stringify(INITIAL_IMMIGRATION_RECORDS));
    }
    setLoading(false);
  }, []);

  // Sync state with local storage
  const saveRecordsToStateAndStorage = (updatedList: UnifiedRecord[]) => {
    setRecords(updatedList);
    localStorage.setItem('fsd_document_archive_records', JSON.stringify(updatedList));
  };

  // Toast notifier trigger
  const triggerToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Add individual digitized record
  const handleAddRecord = (newRecord: UnifiedRecord) => {
    if (userRole === 'Viewer') {
      triggerToast('Security Alert: Viewer role is restricted from writing actions.', 'error');
      return;
    }
    const updated = [newRecord, ...records];
    saveRecordsToStateAndStorage(updated);
    setSelectedRecord(newRecord);
    setActiveTab('database'); // bounce to view the selected item in database split view
  };

  // Batch insert multiple parsed rows
  const handleAddRecordsBatch = (batchList: UnifiedRecord[]) => {
    if (userRole === 'Viewer') {
      triggerToast('Security Alert: Viewer role is restricted from batch writing actions.', 'error');
      return;
    }
    const updated = [...batchList, ...records];
    saveRecordsToStateAndStorage(updated);
    setActiveTab('database');
  };

  // Update record metadata on form commit
  const handleUpdateRecord = (updatedRecord: UnifiedRecord) => {
    if (userRole === 'Viewer') {
      triggerToast('Security Alert: Viewer role cannot update documents.', 'error');
      return;
    }
    const updatedList = records.map(r => r.id === updatedRecord.id ? updatedRecord : r);
    saveRecordsToStateAndStorage(updatedList);
    setSelectedRecord(updatedRecord);
  };

  // Permanent execution deletion
  const handleDeleteRecord = (id: string) => {
    if (userRole !== 'SuperAdmin') {
      triggerToast('Security Violation: Only SuperAdmin accounts possess Postgres DELETE transaction authority.', 'error');
      return;
    }
    const filtered = records.filter(r => r.id !== id);
    saveRecordsToStateAndStorage(filtered);
    setSelectedRecord(null);
  };

  // Dynamically count alerts for badges
  const activeAlertCount = React.useMemo(() => {
    const TODAY = new Date('2026-05-23T09:19:20Z');
    const SIXTY_DAYS_LATER = new Date(TODAY.getTime() + 60 * 24 * 60 * 60 * 1000);
    return records.filter(r => {
      const exp = new Date(r.expiry_date);
      return exp <= SIXTY_DAYS_LATER;
    }).length;
  }, [records]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-800">
      
      {/* Sidebar Overlay on Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 1. PERSISTENT LEFT SIDEBAR */}
      <aside 
        id="app-main-sidebar"
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          
          {/* Brand header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-gradient-to-tr from-indigo-600 to-blue-500 p-2 rounded text-white flex items-center justify-center">
                <Database className="w-5 h-5" />
              </span>
              <div>
                <div className="font-bold text-xs tracking-tight text-white uppercase leading-tight">
                  Archive Ledger
                </div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight">FSD Evidence Suite</div>
              </div>
            </div>
            
            {/* Mobile close button */}
            <button 
              className="md:hidden p-1 bg-slate-800 border border-slate-700 rounded text-slate-350 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* APPLICATION NAVIGATION (Tabs) */}
          <div className="p-4 space-y-1.5 border-b border-slate-800">
            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">Navigation</span>
            
            <button
              id="sidebar-tab-overview"
              onClick={() => {
                setActiveTab('dashboard');
                setSidebarOpen(false);
              }}
              className={`w-full py-2 px-3 rounded flex items-center gap-2.5 transition text-xs text-left cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-slate-800 text-white font-bold border-l-2 border-indigo-505 bg-slate-800 border-l-2 border-indigo-500' 
                  : 'text-slate-400 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Overview Summary</span>
            </button>
          </div>

          {/* DEDICATED DIVISION MODULES SECTION (AS EXPLICITLY REQUESTED) */}
          <div className="p-4 space-y-1.5 border-b border-slate-800">
            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">Division Modules</span>
            
            {/* 1. Visa Module */}
            <button
              id="sidebar-mod-link-visa"
              onClick={() => {
                setActiveTab('database');
                setGridCategoryFilter('ICS Visa');
                setSidebarOpen(false);
                triggerToast('Loaded Visa Module (ICS Visa) division archives.', 'success');
              }}
              className={`w-full py-2 px-3 rounded flex items-center justify-between transition text-xs text-left cursor-pointer ${
                activeTab === 'database' && gridCategoryFilter === 'ICS Visa'
                  ? 'bg-indigo-950 border border-indigo-800 text-indigo-205 font-bold'
                  : 'text-slate-400 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Ticket className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Visa (ICS Visa)</span>
              </div>
              <span className="text-[9px] bg-indigo-900 border border-indigo-800/50 pb-0.2 text-indigo-305 text-indigo-300 font-semibold px-2 rounded-full font-mono">
                {records.filter(r => r.doc_type === 'ICS Visa').length}
              </span>
            </button>

            {/* 2. Residence Permit Module */}
            <button
              id="sidebar-mod-link-residence"
              onClick={() => {
                setActiveTab('database');
                setGridCategoryFilter('Residence Permit');
                setSidebarOpen(false);
                triggerToast('Loaded Residence Permit division archives.', 'success');
              }}
              className={`w-full py-2 px-3 rounded flex items-center justify-between transition text-xs text-left cursor-pointer ${
                activeTab === 'database' && gridCategoryFilter === 'Residence Permit'
                  ? 'bg-emerald-950 border border-emerald-800 text-emerald-205 font-bold'
                  : 'text-slate-400 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Residence Permit</span>
              </div>
              <span className="text-[9px] bg-emerald-900 border border-emerald-800/50 pb-0.2 text-emerald-305 text-emerald-300 font-semibold px-2 rounded-full font-mono">
                {records.filter(r => r.doc_type === 'Residence Permit').length}
              </span>
            </button>

            {/* 3. EOID (Origin ID) Module */}
            <button
              id="sidebar-mod-link-eoid"
              onClick={() => {
                setActiveTab('database');
                setGridCategoryFilter('Origin ID');
                setSidebarOpen(false);
                triggerToast('Loaded EOID (Origin ID) division archives.', 'success');
              }}
              className={`w-full py-2 px-3 rounded flex items-center justify-between transition text-xs text-left cursor-pointer ${
                activeTab === 'database' && gridCategoryFilter === 'Origin ID'
                  ? 'bg-amber-950 border border-amber-800 text-amber-205 font-bold'
                  : 'text-slate-400 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>EOID (Origin ID)</span>
              </div>
              <span className="text-[9px] bg-amber-900 border border-amber-805 text-amber-305 text-amber-300 font-semibold px-2 rounded-full font-mono">
                {records.filter(r => r.doc_type === 'Origin ID').length}
              </span>
            </button>

            {/* 4. ETD Module */}
            <button
              id="sidebar-mod-link-etd"
              onClick={() => {
                setActiveTab('database');
                setGridCategoryFilter('ETD');
                setSidebarOpen(false);
                triggerToast('Loaded ETD division archives.', 'success');
              }}
              className={`w-full py-2 px-3 rounded flex items-center justify-between transition text-xs text-left cursor-pointer ${
                activeTab === 'database' && gridCategoryFilter === 'ETD'
                  ? 'bg-blue-950 border border-blue-800 text-blue-205 font-bold'
                  : 'text-slate-400 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>ETD</span>
              </div>
              <span className="text-[9px] bg-blue-900 border border-blue-805 text-blue-305 text-blue-300 font-semibold px-2 rounded-full font-mono">
                {records.filter(r => r.doc_type === 'ETD').length}
              </span>
            </button>

            {/* 5. Yellow Card Module */}
            <button
              id="sidebar-mod-link-yellow"
              onClick={() => {
                setActiveTab('database');
                setGridCategoryFilter('Yellow Card');
                setSidebarOpen(false);
                triggerToast('Loaded Yellow Card vaccination clearances.', 'success');
              }}
              className={`w-full py-2 px-3 rounded flex items-center justify-between transition text-xs text-left cursor-pointer ${
                activeTab === 'database' && gridCategoryFilter === 'Yellow Card'
                  ? 'bg-orange-950 border border-orange-800 text-orange-205 font-bold'
                  : 'text-slate-400 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>Yellow Card</span>
              </div>
              <span className="text-[9px] bg-orange-900 border border-orange-805 text-orange-305 text-orange-300 font-semibold px-2 rounded-full font-mono">
                {records.filter(r => r.doc_type === 'Yellow Card').length}
              </span>
            </button>
          </div>

          {/* SIMULATED ROLE SELECTOR PANEL (Inside Sidebar for fast toggle) */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/40 space-y-2">
            <div className="flex items-center gap-1 font-bold font-mono text-[9px] text-slate-400 uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              Simulated Role:
            </div>
            
            <div className="grid grid-cols-1 gap-1 text-[11px]">
              <button
                id="sidebar-role-viewer"
                onClick={() => {
                  setUserRole('Viewer');
                  triggerToast('Simulated Account context changed: Viewer. Read-only permissions with strict PDF lock activated.', 'info');
                }}
                className={`py-1.5 px-2.5 rounded text-left font-medium transition flex items-center justify-between cursor-pointer ${
                  userRole === 'Viewer' 
                    ? 'bg-indigo-650 bg-indigo-600 text-white font-bold' 
                    : 'bg-slate-800/50 text-slate-350 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>Viewer</span>
                <span className="text-[8.5px] font-mono leading-none bg-indigo-950 text-indigo-300 border border-indigo-800 px-1 py-0.5 rounded">RO</span>
              </button>
              <button
                id="sidebar-role-archivist"
                onClick={() => {
                  setUserRole('Archivist');
                  triggerToast('Simulated Account context changed: Archivist. Full insert/edit access to files metadata operational.', 'info');
                }}
                className={`py-1.5 px-2.5 rounded text-left font-medium transition flex items-center justify-between cursor-pointer ${
                  userRole === 'Archivist' 
                    ? 'bg-emerald-600 text-white font-bold' 
                    : 'bg-slate-800/50 text-slate-350 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>Archivist</span>
                <span className="text-[8.5px] font-mono leading-none bg-emerald-950 text-emerald-300 border border-emerald-800 px-1 py-0.5 rounded">RW</span>
              </button>
              <button
                id="sidebar-role-admin"
                onClick={() => {
                  setUserRole('SuperAdmin');
                  triggerToast('Simulated Account context changed: SuperAdmin. Full unrestricted access, user administration, and PDF purge rights enabled.', 'info');
                }}
                className={`py-1.5 px-2.5 rounded text-left font-medium transition flex items-center justify-between cursor-pointer ${
                  userRole === 'SuperAdmin' 
                    ? 'bg-amber-600 text-white font-bold' 
                    : 'bg-slate-800/50 text-slate-350 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>SuperAdmin</span>
                <span className="text-[8.5px] font-mono leading-none bg-amber-950 text-amber-300 border border-amber-805 px-1 py-0.5 rounded">ALL</span>
              </button>
            </div>
          </div>

        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-505 text-slate-500 font-mono space-y-1">
          <div>Archival Vault Standard v3</div>
          <div className="flex justify-between">
            <span>Server Status</span>
            <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN AREA WITH SCROLLING CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden md:h-screen md:overflow-y-auto">
        
        {/* Top Header Row for mobile menu trigger & quick server metrics */}
        <header className="bg-white border-b border-slate-200 shrink-0 py-3 px-4 flex justify-between items-center z-10 sticky top-0 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Hamburger button on mobile */}
            <button
              id="btn-hamburger-menu"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="space-y-0.5">
              <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">Secure Division Ledger</h2>
              <h1 className="text-base font-extrabold text-slate-900 uppercase tracking-tight leading-tight">
                {activeTab === 'dashboard' && "Overview Summary"}
                {activeTab === 'database' && (gridCategoryFilter === 'All' ? "Advanced Search Database" : `${gridCategoryFilter} DIVISONS`)}
                {activeTab === 'digitize' && "AI PDF OCR Digitize Portal"}
                {activeTab === 'bulk-import' && "Excel Bulk Clipboard Migration"}
                {activeTab === 'supabase-sql' && "Supabase Security Console"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="hidden lg:block text-slate-500">
              UTC Reference: <strong className="text-slate-700">2026-05-23</strong>
            </div>
            <span className="text-[10px] font-mono text-slate-505 text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              Secured SSL Tunnel
            </span>
          </div>
        </header>

        {/* TOAST POPUPS CONTAINER inside page view */}
        {toast && (
          <div className="fixed bottom-4 right-4 z-50 animate-bounce">
            <div className={`p-3.5 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2.5 border ${
              toast.type === 'success' 
                ? 'bg-emerald-900 border-emerald-800 text-emerald-100' 
                : toast.type === 'error' 
                ? 'bg-red-950 border-red-900 text-red-100' 
                : 'bg-slate-900 border-slate-800 text-white'
            }`}>
              <ShieldCheck className="w-4.5 h-4.5 shrink-0" />
              <span>{toast.text}</span>
            </div>
          </div>
        )}

        {/* Actual Content Area */}
        <main className="flex-1 p-4 md:p-6 space-y-5">
          {loading ? (
            <div className="text-center py-20 bg-white border rounded p-12 space-y-4">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
              <h3 className="text-slate-700 font-bold uppercase tracking-wider text-xs">Accessing Supabase database parameters...</h3>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardOverview 
                  records={records} 
                  onNavigate={(tab) => {
                    setActiveTab(tab as any);
                  }} 
                  onSelectCategory={(cat) => {
                    setGridCategoryFilter(cat);
                  }}
                  userRole={userRole}
                />
              )}

              {activeTab === 'database' && (
                <div className="space-y-5">
                  <DocumentGrid 
                    records={records} 
                    onSelectRecord={(rec) => {
                      setSelectedRecord(rec);
                      triggerToast(`Loaded metadata for "${rec.applicant_name}" into Split-Screen portal.`, 'info');
                    }} 
                    selectedRecordId={selectedRecord?.id}
                    preSelectedCategory={gridCategoryFilter}
                    onCategoryFilterChange={(cat) => setGridCategoryFilter(cat)}
                    onDeleteRecord={handleDeleteRecord}
                    userRole={userRole}
                  />

                  <div className="pt-2">
                    <SplitScreenViewer 
                      selectedRecord={selectedRecord} 
                      activeRole={userRole} 
                      onUpdateRecord={handleUpdateRecord} 
                      onDeleteRecord={handleDeleteRecord}
                      showToast={triggerToast}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'digitize' && (
                <DocumentDigitizer 
                  onAddRecord={handleAddRecord} 
                  showToast={triggerToast}
                  userRole={userRole}
                />
              )}

              {activeTab === 'bulk-import' && (
                <BulkImportWorkspace 
                  onAddRecordsBatch={handleAddRecordsBatch} 
                  showToast={triggerToast}
                  userRole={userRole}
                />
              )}

              {activeTab === 'supabase-sql' && (
                <SupabaseSqlConsole 
                  records={records} 
                  activeRole={userRole}
                />
              )}
            </>
          )}
        </main>

        {/* Footer inside content area */}
        <footer className="bg-white border-t border-slate-200 text-[11px] text-slate-400 py-3.5 px-6 shrink-0 font-mono mt-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            &copy; 2026 Federal Immigration Division (FSD/HQ). Archive & Evidence Suite.
          </div>
          <div className="flex gap-4">
            <span>Standard compliant (SVS/v3)</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
