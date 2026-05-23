import React from 'react';
import { UnifiedRecord, DocCategory } from '../types';
import { 
  Search, ShieldAlert, CheckCircle, Database, Pin, Filter, ArrowUpDown, 
  Trash2, Eye, Calendar, User, FileDigit, HelpCircle, Layers, FolderClosed, ShieldCheck, Ticket, CreditCard, FileText
} from 'lucide-react';

interface DocumentGridProps {
  records: UnifiedRecord[];
  onSelectRecord: (record: UnifiedRecord) => void;
  selectedRecordId?: string;
  preSelectedCategory: DocCategory | 'All';
  onCategoryFilterChange: (cat: DocCategory | 'All') => void;
  onDeleteRecord?: (id: string) => void;
  userRole: string;
}

export default function DocumentGrid({
  records,
  onSelectRecord,
  selectedRecordId,
  preSelectedCategory,
  onCategoryFilterChange,
  onDeleteRecord,
  userRole
}: DocumentGridProps) {
  
  // Search state
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [selectedStatus, setSelectedStatus] = React.useState<'All' | 'Active' | 'Expired'>('All');
  const [selectedBox, setSelectedBox] = React.useState<string>('All');
  const [sortField, setSortField] = React.useState<'applicant_name' | 'expiry_date' | 'master_file_no' | 'cabinet_box_no'>('applicant_name');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  // Gather unique box names for filter dropdown dynamically
  const uniqueBoxes = React.useMemo(() => {
    const list = records.map(r => r.cabinet_box_no || 'BOX-UNASSIGNED');
    return Array.from(new Set(list)).sort();
  }, [records]);

  // Handle Dynamic Filter and Sorting Pipeline
  const filteredAndSortedRecords = React.useMemo(() => {
    let result = [...records];

    // 1. Text Search Across Multiple Columns (Name, Passport, Master File No, Box No)
    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.applicant_name.toLowerCase().includes(query) ||
        r.passport_no.toLowerCase().includes(query) ||
        r.master_file_no.toLowerCase().includes(query) ||
        r.doc_number.toLowerCase().includes(query) ||
        (r.cabinet_box_no && r.cabinet_box_no.toLowerCase().includes(query))
      );
    }

    // 2. Category Filter
    if (preSelectedCategory !== 'All') {
      result = result.filter(r => r.doc_type === preSelectedCategory);
    }

    // 3. Status Filter (Active / Expired)
    if (selectedStatus !== 'All') {
      result = result.filter(r => r.status === selectedStatus);
    }

    // 4. Cabinet Box Filter
    if (selectedBox !== 'All') {
      result = result.filter(r => r.cabinet_box_no === selectedBox);
    }

    // 5. Apply Core Field Sort Dynamic Logic
    result.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'expiry_date') {
        const dateA = new Date(valA).getTime();
        const dateB = new Date(valB).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }

      valA = valA.toString().toLowerCase();
      valB = valB.toString().toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [records, searchTerm, preSelectedCategory, selectedStatus, selectedBox, sortField, sortDirection]);

  // Toggle Sorting column keys
  const toggleSort = (field: 'applicant_name' | 'expiry_date' | 'master_file_no' | 'cabinet_box_no') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Helper icons for categories inside table rows
  const renderCategoryPill = (cat: DocCategory) => {
    let style = 'bg-slate-100 text-slate-800 border-slate-300';
    let Icon = FileText;

    if (cat === 'ICS Visa') {
      style = 'bg-slate-50 text-slate-700 border-slate-200';
      Icon = Ticket;
    } else if (cat === 'Residence Permit') {
      style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      Icon = ShieldCheck;
    } else if (cat === 'Origin ID') {
      style = 'bg-amber-50 text-amber-800 border-amber-200';
      Icon = CreditCard;
    } else if (cat === 'ETD') {
      style = 'bg-blue-50 text-blue-800 border-blue-200';
      Icon = FileText;
    } else if (cat === 'Yellow Card') {
      style = 'bg-orange-50 text-orange-850 border-orange-200';
      Icon = Layers;
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-semibold border ${style}`}>
        <Icon className="w-3 h-3 shrink-0" />
        {cat}
      </span>
    );
  };

  return (
    <div className="space-y-4 text-[13px]">
        
        {/* 1. ADVANCED SEARCH & MULTI-FILTER PANEL (High Density Style) */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3.5 shadow-xs">
          
          {/* Top Header Row detailing stats inside criteria */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-600 rounded text-white shrink-0">
                <Filter className="w-3.5 h-3.5" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Advanced Archives Search Matrix</h3>
                <p className="text-[11px] text-slate-400">Standardize data filter operations for files and cabinet maps</p>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-500 bg-white border px-2.5 py-1 rounded">
              Filtered Index Count: <strong className="text-indigo-600 font-bold">{filteredAndSortedRecords.length}</strong> / {records.length} records
            </div>
          </div>

          {/* Input Parameters Form grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            
            {/* Query Keyword Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                id="input-grid-search"
                placeholder="Search Name, Passport, Box..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs placeholder-slate-400 bg-white border border-slate-300 rounded pl-9 pr-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Division Category Dropdown */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-slate-500 font-mono whitespace-nowrap">Division:</label>
              <select
                value={preSelectedCategory}
                onChange={(e) => onCategoryFilterChange(e.target.value as any)}
                className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="All">All Categories</option>
                <option value="ICS Visa">ICS Visa</option>
                <option value="Residence Permit">Residence Permit</option>
                <option value="Origin ID">Origin ID</option>
                <option value="ETD">ETD</option>
                <option value="Yellow Card">Yellow Card</option>
              </select>
            </div>

            {/* Core Status Selector */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-slate-500 font-mono whitespace-nowrap">Status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="All">All Expiries</option>
                <option value="Active">Active Clearance</option>
                <option value="Expired">Expired / Suspended</option>
              </select>
            </div>

            {/* Physical Box Coordinates selector */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-slate-500 font-mono whitespace-nowrap">Box ID:</label>
              <select
                value={selectedBox}
                onChange={(e) => setSelectedBox(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="All">All Locker Boxes</option>
                {uniqueBoxes.map(box => (
                  <option key={box} value={box}>{box}</option>
                ))}
              </select>
            </div>

          </div>

        </div>

        {/* 2. THE HIGH DENSITY DATA GRID TABLE */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              
              {/* Table Header with interactive sorting triggers */}
              <thead className="bg-slate-100 text-slate-600 text-[11px] font-mono sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="p-2.5 font-bold uppercase tracking-wider text-slate-705">
                    <span className="flex items-center gap-1">Category</span>
                  </th>
                  <th 
                    onClick={() => toggleSort('applicant_name')} 
                    className="p-2.5 font-bold uppercase tracking-wider hover:bg-slate-250 cursor-pointer text-slate-705 group"
                  >
                    <span className="flex items-center gap-1">
                      Applicant Name
                      <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition" />
                    </span>
                  </th>
                  <th 
                    onClick={() => toggleSort('master_file_no')} 
                    className="p-2.5 font-bold uppercase tracking-wider hover:bg-slate-250 cursor-pointer text-slate-705 group"
                  >
                    <span className="flex items-center gap-1">
                      Master File No
                      <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition" />
                    </span>
                  </th>
                  <th className="p-2.5 font-bold uppercase tracking-wider text-slate-705">Passport & Nation</th>
                  <th className="p-2.5 font-bold uppercase tracking-wider text-slate-705">Document ID</th>
                  <th 
                    onClick={() => toggleSort('cabinet_box_no')} 
                    className="p-2.5 font-bold uppercase tracking-wider hover:bg-slate-250 cursor-pointer text-slate-705 group"
                  >
                    <span className="flex items-center gap-1">
                      Archive Coordinate (Box)
                      <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition" />
                    </span>
                  </th>
                  <th 
                    onClick={() => toggleSort('expiry_date')} 
                    className="p-2.5 font-bold uppercase tracking-wider hover:bg-slate-250 cursor-pointer text-slate-705 group text-center"
                  >
                    <span className="flex items-center justify-center gap-1">
                      Expiry Date / Status
                      <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition" />
                    </span>
                  </th>
                  <th className="p-2.5 font-bold uppercase tracking-wider text-slate-705 text-center">RLS Flag</th>
                </tr>
              </thead>

              {/* Table Rows Body */}
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAndSortedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FolderClosed className="w-8 h-8 text-slate-300" />
                        <div>No immigration records found matching active query filters.</div>
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            onCategoryFilterChange('All');
                            setSelectedStatus('All');
                            setSelectedBox('All');
                          }}
                          className="text-xs text-indigo-600 hover:underline font-bold"
                        >
                          Reset search filters to default
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedRecords.map((rec) => {
                    const isSelected = selectedRecordId === rec.id;
                    const rowBg = isSelected 
                      ? 'bg-indigo-50/75 hover:bg-indigo-50 border-l-2 border-l-indigo-600' 
                      : 'hover:bg-slate-50/80 transition-transform';
                    
                    return (
                      <tr 
                        key={rec.id}
                        onClick={() => onSelectRecord(rec)}
                        className={`cursor-pointer ${rowBg}`}
                      >
                        {/* Document Type Category Pill */}
                        <td className="p-2.5 whitespace-nowrap">
                          {renderCategoryPill(rec.doc_type)}
                        </td>

                        {/* Applicant Name */}
                        <td className="p-2.5 font-semibold text-slate-900 whitespace-nowrap">
                          {rec.applicant_name}
                        </td>

                        {/* Master File Number */}
                        <td className="p-2.5 font-mono text-xs text-slate-605 font-bold whitespace-nowrap font-bold">
                          {rec.master_file_no}
                        </td>

                        {/* Passport & Nation */}
                        <td className="p-2.5 text-slate-500 whitespace-nowrap">
                          <span className="font-mono text-slate-850 font-bold">{rec.passport_no}</span>
                          <span className="mx-1 text-slate-300">|</span>
                          <span>{rec.nationality}</span>
                        </td>

                        {/* Document ID */}
                        <td className="p-2.5 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                          {rec.doc_number}
                        </td>

                        {/* Archive Coordinate (cabinet box / shelf) */}
                        <td className="p-2.5 text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Pin className="w-3 h-3 text-slate-400" />
                            <strong className="text-slate-800 font-bold font-mono text-[11px]">{rec.cabinet_box_no}</strong>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded truncate max-w-[120px]" title={rec.shelf_location}>
                              {rec.shelf_location}
                            </span>
                          </div>
                        </td>

                        {/* Expiry / Status */}
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center justify-center space-y-0.5">
                            <span className="font-mono text-slate-755 text-[11px]">{rec.expiry_date}</span>
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9.5px] font-bold uppercase font-mono ${rec.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                              {rec.status === 'Active' ? 'Active' : 'Expired'}
                            </span>
                          </div>
                        </td>

                        {/* Explicit Viewer Flag status */}
                        <td className="p-2.5 text-center whitespace-nowrap">
                          {rec.viewer_explicitly_flaged ? (
                            <span className="text-emerald-605 bg-emerald-50 border border-emerald-200 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase font-mono shadow-xs">
                              OVERRIDE_OK
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] uppercase font-mono bg-slate-100 px-1 py-0.5 rounded">
                              LOCKED_RLS
                            </span>
                          )}
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>

            </table>
          </div>
        </div>

    </div>
  );
}
