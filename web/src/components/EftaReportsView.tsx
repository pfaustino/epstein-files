import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  FileText,
  ExternalLink,
  FolderArchive,
  Download,
  BookOpen,
  Filter,
  CheckCircle,
  AlertCircle,
  Hash,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { EftaReport, EftaDataset } from '../types';

interface EftaReportsViewProps {
  reports: EftaReport[];
  datasets: EftaDataset[];
  onSelectPerson?: (personId: string) => void;
}

export const EftaReportsView: React.FC<EftaReportsViewProps> = ({
  reports,
  datasets,
  onSelectPerson,
}) => {
  const [subView, setSubView] = useState<'reports' | 'datasets'>('reports');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // EFTA Bates Calculator State
  const [batesQuery, setBatesQuery] = useState('');
  const [batesResult, setBatesResult] = useState<{
    dataset: EftaDataset;
    formattedNumber: string;
    pdfUrl: string;
  } | null>(null);

  // Categories and their counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, { label: string; count: number; order: number }> = {};
    reports.forEach(r => {
      if (!counts[r.category]) {
        counts[r.category] = {
          label: r.category_label,
          count: 0,
          order: r.category_order,
        };
      }
      counts[r.category].count += 1;
    });
    return counts;
  }, [reports]);

  const sortedCategories = useMemo(() => {
    return Object.entries(categoryCounts).sort((a, b) => a[1].order - b[1].order);
  }, [categoryCounts]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reports.filter(r => {
      if (selectedCategory !== 'all' && r.category !== selectedCategory) {
        return false;
      }
      if (q) {
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesCat = r.category.toLowerCase().includes(q) || r.category_label.toLowerCase().includes(q);
        const matchesFilename = r.filename.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat && !matchesFilename) return false;
      }
      return true;
    });
  }, [reports, searchQuery, selectedCategory]);

  // Handle Bates number lookup
  const handleBatesLookup = (val: string) => {
    setBatesQuery(val);
    const cleaned = val.toUpperCase().replace(/\s+/g, '');
    const numMatch = cleaned.match(/\d+/);
    if (!numMatch) {
      setBatesResult(null);
      return;
    }

    const num = parseInt(numMatch[0], 10);
    const matchedDs = datasets.find(d => num >= d.efta_start && num <= d.efta_end);

    if (matchedDs) {
      const formatted = 'EFTA' + num.toString().padStart(8, '0');
      const url = matchedDs.url_template.replace('{number}', formatted);
      setBatesResult({
        dataset: matchedDs,
        formattedNumber: formatted,
        pdfUrl: url,
      });
    } else {
      setBatesResult(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080a10] overflow-hidden">
      {/* Sub-view switcher bar */}
      <div className="bg-[#0e111a] border-b border-slate-800/80 px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubView('reports')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              subView === 'reports'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-300" />
            <span>201 Investigation Reports</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
              {reports.length}
            </span>
          </button>

          <button
            onClick={() => setSubView('datasets')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              subView === 'datasets'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            <FolderArchive className="w-4 h-4 text-indigo-300" />
            <span>12 Official DOJ Datasets (EFTA)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
              {datasets.length}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="hidden sm:inline">Source: Department of Justice EFTA Release (Public Law 119-38)</span>
          <a
            href="https://github.com/rhowardstone/Epstein-research"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-400 hover:underline"
          >
            <span>GitHub Archive</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* VIEW 1: 201 Investigation Reports */}
      {subView === 'reports' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search and Category Filter Toolbar */}
          <div className="bg-[#0b0e17] border-b border-slate-800/60 p-4 lg:px-8 space-y-3 shrink-0">
            {/* Search Input */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[280px] max-w-lg">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search 201 reports (e.g. Trump, Apollo, Redaction, Black, Subpoena, Geffen...)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-400">
                Showing <span className="text-emerald-400 font-mono font-bold">{filteredReports.length}</span> of {reports.length} reports
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium border shrink-0 transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                <span>All Topics</span>
                <span className="text-[10px] px-1.5 rounded-full bg-black/40 font-mono">
                  {reports.length}
                </span>
              </button>

              {sortedCategories.map(([cat, info]) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border shrink-0 transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:text-white hover:border-emerald-800/80'
                    }`}
                  >
                    <span>{info.label}</span>
                    <span
                      className={`text-[10px] px-1.5 rounded-full font-mono ${
                        isSelected ? 'bg-black/40 text-white' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {info.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reports Grid */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredReports.map(report => (
                <div
                  key={report.id}
                  className="bg-[#0e111a] hover:bg-[#141824] border border-slate-800/80 hover:border-emerald-700/60 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 group shadow-lg hover:shadow-emerald-950/20"
                >
                  <div>
                    {/* Top Header */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 truncate max-w-[200px]">
                        {report.category_label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {report.size ? `${(report.size / 1024).toFixed(1)} KB` : ''}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors mt-2.5 leading-snug">
                      {report.title}
                    </h3>

                    {/* File Path */}
                    <p className="text-[11px] text-slate-400 font-mono mt-1 truncate">
                      {report.path}
                    </p>
                  </div>

                  {/* Actions Bottom */}
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                    <a
                      href={report.reader_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 hover:border-emerald-500 text-xs font-medium transition-all"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Read Online</span>
                    </a>

                    <a
                      href={report.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="View Markdown on GitHub"
                    >
                      <span>Markdown</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: 12 Official DOJ EFTA Datasets */}
      {subView === 'datasets' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* EFTA Bates Number Lookup Tool */}
          <div className="bg-[#0b0e17] border-b border-slate-800/80 p-4 lg:px-8 shrink-0 space-y-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[280px] max-w-md">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                <input
                  type="text"
                  placeholder="Enter EFTA Bates # (e.g. EFTA01660636, EFTA00005000, 2731023)..."
                  value={batesQuery}
                  onChange={e => handleBatesLookup(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                />
                {batesQuery && (
                  <button
                    onClick={() => {
                      setBatesQuery('');
                      setBatesResult(null);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Lookup Result Box */}
              {batesResult && (
                <div className="flex items-center gap-3 bg-indigo-950/50 border border-indigo-700/80 px-4 py-2 rounded-xl text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-slate-300">Resolved to: </span>
                    <span className="font-bold text-white">{batesResult.dataset.name}</span>
                    <span className="text-slate-400 font-mono ml-2">({batesResult.formattedNumber})</span>
                  </div>
                  <a
                    href={batesResult.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium ml-2 shadow-sm transition-colors"
                  >
                    <span>View PDF on justice.gov</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Locates which of the 12 Department of Justice declassified datasets contains a given Bates document and generates direct official PDF download links.
            </p>
          </div>

          {/* Datasets Grid */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {datasets.map(ds => (
                <div
                  key={ds.dataset}
                  className="bg-[#0e111a] border border-slate-800/90 hover:border-indigo-700/60 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:shadow-indigo-950/20 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800">
                        {ds.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 font-semibold">
                        {ds.doc_count.toLocaleString()} Documents
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mt-3">
                      Bates Range:
                    </h4>
                    <p className="text-xs font-mono text-cyan-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 mt-1">
                      {ds.efta_start_formatted} — {ds.efta_end_formatted}
                    </p>

                    <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                      {ds.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                    <a
                      href={ds.sample_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 hover:border-indigo-500 text-xs font-medium transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Sample PDF</span>
                    </a>

                    <a
                      href={`https://www.justice.gov/epstein/files/DataSet%20${ds.dataset}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      <span>DOJ Folder</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
