import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = "",
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Limit visible page buttons for large page counts
  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (currentPage >= totalPages - 2) {
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  };

  const visiblePages = getVisiblePages();

  return (
    <div
      className={`flex items-center justify-between px-8 py-6 border-t border-gray-100 ${className}`}
    >
      <p className="text-xs text-gray-500 font-medium">
        Menampilkan{" "}
        <span className="font-bold text-slate-900">
          {startItem}-{endItem}
        </span>{" "}
        dari <span className="font-bold text-slate-900">{totalItems}</span> item
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>

        {visiblePages[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="w-10 h-10 rounded-xl text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
            >
              1
            </button>
            {visiblePages[0] > 2 && (
              <span className="text-gray-400 px-1">...</span>
            )}
          </>
        )}

        {visiblePages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
              currentPage === page
                ? "bg-slate-900 text-white shadow-lg"
                : "border border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            {page}
          </button>
        ))}

        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <span className="text-gray-400 px-1">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="w-10 h-10 rounded-xl text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
