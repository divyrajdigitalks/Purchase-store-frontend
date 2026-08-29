import React, { useState } from 'react';

interface TableProps<T> {
  headers: string[];
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  itemsPerPage?: number;
}

export function Table<T>({ headers, data, renderRow, itemsPerPage = 5 }: TableProps<T>) {
  const [pageSize, setPageSize] = useState(itemsPerPage);
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination boundaries
  const totalPages = Math.ceil(data.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedData = data.slice(startIndex, startIndex + pageSize);

  const handlePrev = () => {
    if (safeCurrentPage > 1) setCurrentPage(safeCurrentPage - 1);
  };

  const handleNext = () => {
    if (safeCurrentPage < totalPages) setCurrentPage(safeCurrentPage + 1);
  };

  return (
    <div className="space-y-0 rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-blue-50/40 text-slate-650 font-bold uppercase tracking-wider text-[10px]">
              {headers.map((h, i) => (
                <th key={i} className="px-6 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-10 text-center text-slate-400 italic font-bold">
                  No matching records discovered.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => renderRow(item, startIndex + idx))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer block matching parivar.me reference */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-200/85 bg-slate-50/50 gap-4">
        
        {/* Left Side: ROWS selector & Page Ranges */}
        <div className="flex items-center space-x-3 text-slate-450 font-bold text-[10px] uppercase tracking-wider">
          <span>ROWS</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white border border-slate-250 rounded px-1.5 py-0.5 text-xs text-slate-700 font-bold focus:outline-none cursor-pointer focus:border-[#045598] transition-all"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
          </select>
          <span>
            Showing {data.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + pageSize, data.length)} of {data.length}
          </span>
        </div>

        {/* Right Side: Square Page Nav Buttons */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handlePrev}
            disabled={safeCurrentPage === 1}
            className="w-8 h-8 rounded border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs transition-colors cursor-pointer"
          >
            &lt;
          </button>
          
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            const isActive = p === safeCurrentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 rounded border flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#045598] border-[#045598] text-white shadow-sm'
                    : 'bg-white border-slate-250 text-slate-650 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleNext}
            disabled={safeCurrentPage === totalPages}
            className="w-8 h-8 rounded border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs transition-colors cursor-pointer"
          >
            &gt;
          </button>
        </div>

      </div>
    </div>
  );
}
