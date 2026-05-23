import React from 'react';
import { UnifiedRecord, DocCategory, Statistics } from '../types';
import { 
  FileText, ShieldCheck, CreditCard, Ticket, AlertOctagon,
  Users, Globe, TrendingUp, Sparkles, UploadCloud, Layers, Database, Box, CalendarRange, FolderGit, Pin
} from 'lucide-react';

interface OverviewProps {
  records: UnifiedRecord[];
  onNavigate: (tab: 'digitize' | 'database' | 'supabase-sql' | 'bulk-import') => void;
  onSelectCategory: (category: DocCategory) => void;
  userRole: string;
}

export default function DashboardOverview({ records, onNavigate, onSelectCategory, userRole }: OverviewProps) {
  
  // Calculate Statistics dynamically
  const stats = React.useMemo<Statistics>(() => {
    const byCategory: Record<DocCategory, number> = {
      'ICS Visa': 0,
      'Residence Permit': 0,
      'Origin ID': 0,
      'ETD': 0,
      'Yellow Card': 0
    };
    
    let totalSize = 0;
    let expiringSoon = 0;
    const cabinetMap: Record<string, number> = {};
    const byStatus = { Active: 0, Expired: 0 };
    
    const TODAY = new Date('2026-05-23T09:19:20Z'); // Static context reference time
    const SIXTY_DAYS_LATER = new Date(TODAY.getTime() + 60 * 24 * 60 * 60 * 1000);

    records.forEach(r => {
      // Category counts
      if (byCategory[r.doc_type] !== undefined) {
        byCategory[r.doc_type]++;
      } else {
        byCategory[r.doc_type] = 1;
      }
      
      // File Size accumulated
      totalSize += r.file_size_bytes || 2048000; // fallback default 2MB
      
      // Expiry calculation
      const expDate = new Date(r.expiry_date);
      if (expDate < TODAY) {
        byStatus.Expired++;
      } else {
        byStatus.Active++;
        if (expDate <= SIXTY_DAYS_LATER) {
          expiringSoon++;
        }
      }

      // Symmetrical physical box mapping
      const box = r.cabinet_box_no || 'BOX-UNASSIGNED';
      cabinetMap[box] = (cabinetMap[box] || 0) + 1;
    });

    const totalBoxes = Object.keys(cabinetMap).length;

    return {
      totalRecords: records.length,
      totalBoxes,
      expiringSoonCount: expiringSoon + byStatus.Expired, // represent all danger/risk elements
      totalUploadVolumeMB: parseFloat((totalSize / (1024 * 1024)).toFixed(2)),
      byCategory,
      byStatus,
      byCabinet: cabinetMap
    };
  }, [records]);

  // Document Type styling matrix
  const categoryMeta: Record<DocCategory, { bg: string, text: string, textLight: string, border: string, icon: any, label: string, desc: string }> = {
    'ICS Visa': { 
      bg: 'bg-white hover:bg-slate-50', 
      border: 'border-l-4 border-l-slate-700 border-slate-200',
      text: 'text-slate-800', 
      textLight: 'bg-slate-100 text-slate-800',
      icon: Ticket, 
      label: 'ICS Visa Cabinet',
      desc: 'Immigration & Visa control file records'
    },
    'Residence Permit': { 
      bg: 'bg-white hover:bg-slate-50', 
      border: 'border-l-4 border-l-emerald-600 border-slate-200',
      text: 'text-emerald-700', 
      textLight: 'bg-emerald-50 text-emerald-800',
      icon: ShieldCheck, 
      label: 'Residence Registry',
      desc: 'Long-term corporate & investor residency'
    },
    'Origin ID': { 
      bg: 'bg-white hover:bg-slate-50', 
      border: 'border-l-4 border-l-amber-500 border-slate-200',
      text: 'text-amber-700', 
      textLight: 'bg-amber-50 text-amber-800',
      icon: CreditCard, 
      label: 'Origin / Diaspora ID',
      desc: 'Heritage & origin certification index'
    },
    'ETD': { 
      bg: 'bg-white hover:bg-slate-50', 
      border: 'border-l-4 border-l-blue-500 border-slate-200',
      text: 'text-blue-700', 
      textLight: 'bg-blue-50 text-blue-800',
      icon: FileText, 
      label: 'ETD Records',
      desc: 'Emergency Travel Document certificates'
    },
    'Yellow Card': {
      bg: 'bg-white hover:bg-slate-50',
      border: 'border-l-4 border-l-orange-500 border-slate-200',
      text: 'text-orange-700',
      textLight: 'bg-orange-50 text-orange-800',
      icon: Layers,
      label: 'Yellow Clearance',
      desc: 'Special medical/health/vaccine tags'
    }
  };

  // Find expiring items directly for danger board
  const criticalItems = React.useMemo(() => {
    const TODAY = new Date('2026-05-23T09:19:20Z');
    return records
      .filter(r => {
        const exp = new Date(r.expiry_date);
        return exp <= new Date(TODAY.getTime() + 60 * 24 * 60 * 60 * 1000);
      })
      .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
      .slice(0, 4);
  }, [records]);

  return (
    <div className="space-y-6 text-[13px]">
      
      {/* High Density Welcome Banner (Dark professional slate design) */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 rounded-lg p-5 text-slate-300 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-8">
          <Database className="w-96 h-96 text-white" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap text-[10px]">
              <span className="bg-slate-700 text-slate-100 font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-slate-600">
                FSD DOCUMENT SECURITY SYSTEM
              </span>
              <span className="flex items-center gap-1 bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold px-2 py-0.5 rounded">
                <Sparkles className="w-3 h-3 text-emerald-400" /> SUPABASE BACKEND STRUCTURE
              </span>
              <span className="bg-indigo-900 text-indigo-200 px-2 py-0.5 rounded font-mono font-bold">
                ROLE: {userRole}
              </span>
            </div>
            
            <h1 className="text-xl font-bold text-slate-100 tracking-tight mt-1.5 uppercase">
              Immigration Document Archive and Tracking Suite
            </h1>
            
            <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
              Bridge digital workflow metadata with physical archival lockers. Securely structure ICS Visa, residency, diaspora origins and health clearance physical coordinates inside symmetrical Postgres schemas.
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {userRole !== 'Viewer' ? (
              <button 
                id="btn-nav-upload-overview"
                onClick={() => onNavigate('digitize')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-2 rounded text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-900"
              >
                <UploadCloud className="w-4 h-4" /> Start AI Digitization
              </button>
            ) : (
              <div className="bg-slate-800/80 text-yellow-500 border border-slate-700 rounded p-2 text-[11px] max-w-[200px] leading-tight">
                ⚠️ Viewer Mode: Uploads locked. Select a different role above to try Archivist/Admin actions.
              </div>
            )}
            <button 
              id="btn-nav-sql-overview"
              onClick={() => onNavigate('supabase-sql')}
              className="bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-semibold px-3.5 py-2 rounded text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-4 h-4" /> Export SQL Schema
            </button>
          </div>
        </div>
      </div>

      {/* CORE PERFORMANCE ANALYTIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Records */}
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">Ledger Documents</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-900">{stats.totalRecords}</span>
              <span className="text-slate-400 text-[11px] mb-1">Standardized</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Symmetric personal files mapped</p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 text-slate-700 rounded-lg">
            <FolderGit className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Physical Box Assets */}
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono text-emerald-700">Physical Lockers</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-900">{stats.totalBoxes}</span>
              <span className="text-emerald-600 text-[11px] font-bold mb-1">Cabinet Boxes</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Shelves mapped: Space-Optimized</p>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg">
            <Box className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Expiring & Danger indicators */}
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1 font-mono">Security Check Alerts</p>
            <div className="flex items-end gap-2">
              <span className={`text-2xl font-bold ${stats.expiringSoonCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{stats.expiringSoonCount}</span>
              <span className="text-red-600 text-[10px] font-semibold mb-1">Flags Active</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Expired or ending within 60d</p>
          </div>
          <div className={`p-3 rounded-lg border ${stats.expiringSoonCount > 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
            <CalendarRange className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Accumulated Storage Volume */}
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono text-blue-700">Digital Storage Volume</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-900">{stats.totalUploadVolumeMB}</span>
              <span className="text-blue-600 text-[11px] font-bold mb-1">MB Data</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">PDF bucket upload volume</p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg">
            <UploadCloud className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Structured Category grid selection blocks */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">DIVISION STRUCTURE ARCHIVE MATRIX</h3>
          <span className="text-[11px] text-slate-400">Select file category below to filtered target index databases</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {(Object.keys(categoryMeta) as DocCategory[]).map((cat) => {
            const meta = categoryMeta[cat];
            const Icon = meta.icon;
            const count = stats.byCategory[cat] || 0;
            const percentage = stats.totalRecords > 0 ? Math.round((count / stats.totalRecords) * 100) : 0;

            return (
              <button
                key={cat}
                id={`card-folder-overview-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => {
                  onSelectCategory(cat);
                  onNavigate('database');
                }}
                className={`p-3.5 rounded-lg border shadow-xs flex flex-col justify-between text-left transition h-full ${meta.bg} ${meta.border} cursor-pointer group`}
              >
                <div>
                  <div className="flex items-center justify-between w-full mb-3">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${meta.textLight}`}>
                      {cat.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 py-0.5 px-1.5 rounded group-hover:bg-slate-200">
                      {count} files
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {meta.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 min-h-[30px] line-clamp-2 leading-relaxed">
                    {meta.desc}
                  </p>
                </div>
                
                {/* Space usage indicators */}
                <div className="w-full mt-4 space-y-1">
                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                    <span>Index representation</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${meta.text.replace('text-', 'bg-')} transition-all`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Split layout: Cabinet Locker Maps & Critical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Left Side: Physical Cabinet Locker Density list */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center border-b pb-2 border-slate-100">
            <div>
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest font-mono">Archival Box Coordinate Map</h4>
              <p className="text-[11px] text-slate-400">Standardizing civil indexes across real-world shelf cabinets (BOX-2026-X)</p>
            </div>
            <Box className="text-slate-400 w-4 h-4 shrink-0" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
            {Object.keys(stats.byCabinet).length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-6 font-mono col-span-2">No active records registered in locker lockers.</p>
            ) : (
              Object.entries(stats.byCabinet).map(([box, fileCount]) => {
                // Determine row coordinate based on box or mock data
                let detailVal = 'Row 2, Shelf Alpha';
                if (box.includes('-A')) detailVal = 'Row 3, Shelf B';
                if (box.includes('-B')) detailVal = 'Row 4, Shelf A';
                if (box.includes('-C')) detailVal = 'Row 2, Shelf D';
                if (box.includes('-D')) detailVal = 'Row 1, Shelf C';
                if (box.includes('-E')) detailVal = 'Row 5, Shelf E';
                if (box.includes('-F')) detailVal = 'Row 2, Shelf F';

                const maxCapacity = 15; // Set safe capacity to 15 records per box coordinate
                const pct = Math.min(100, Math.round((Number(fileCount) / maxCapacity) * 100));
                
                return (
                  <div key={box} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Pin className="w-3.5 h-3.5 text-slate-600 rotate-45 shrink-0" />
                        {box}
                      </span>
                      <span className="text-[10px] bg-slate-200 border border-slate-300 font-semibold px-1.5 py-0.5 rounded">
                        {fileCount} / {maxCapacity} slots
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                      <div>Coordinate: <span className="text-slate-800 font-bold">{detailVal}</span></div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                        <span>Locker Fill</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-indigo-600'}`} 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Security Critical Expiry Danger Board */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2 border-slate-100">
              <div>
                <h4 className="text-xs font-extrabold text-red-700 uppercase tracking-widest font-mono">Security Check Alerts</h4>
                <p className="text-[11px] text-slate-400">Chronological verification alerts expiring soon or expired</p>
              </div>
              <AlertOctagon className="text-red-500 w-4 h-4 shrink-0" />
            </div>

            <div className="space-y-2.5">
              {criticalItems.length === 0 ? (
                <div className="text-center py-6">
                  <span className="text-xs text-slate-400 font-mono">No expiring / expired document flags active.</span>
                </div>
              ) : (
                criticalItems.map((item) => {
                  const labelStyle = item.status === 'Expired' 
                    ? 'bg-red-100 text-red-800 border-red-200' 
                    : 'bg-amber-100 text-amber-800 border-amber-200';
                  
                  return (
                    <div key={item.id} className="p-2.5 rounded border border-slate-100 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-800 text-xs truncate max-w-[160px]">{item.applicant_name}</div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                          <span>{item.doc_type}</span>
                          <span>•</span>
                          <span>{item.doc_number}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Expires: <strong className="text-slate-600">{item.expiry_date}</strong></div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border font-mono ${labelStyle}`}>
                          {item.status}
                        </span>
                        <div className="text-[9px] text-slate-400 mt-1 font-mono">{item.cabinet_box_no}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-slate-900 text-slate-300 p-3 rounded-lg border border-slate-800 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="text-[11px] font-mono leading-tight">
                <strong>Supabase PG Status:</strong> Row-level security (RLS) policies operational. Active user: <span className="text-indigo-300">{userRole}</span>.
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
