'use client';

import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
}

export default function Pagination({ currentPage, totalPages, basePath, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  // Generate page numbers with ellipsis
  const getPages = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    const delta = 1; // pages to show around current

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (currentPage - delta > 2) pages.push('...');

    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage + delta < totalPages - 1) pages.push('...');
    pages.push(totalPages);

    return pages;
  };

  const pages = getPages();

  const btnBase =
    'inline-flex items-center justify-center min-w-[2.25rem] h-9 px-2.5 text-sm font-medium rounded-lg transition-all duration-200';

  return (
    <nav className="flex items-center justify-center gap-1 mt-12" aria-label="Pagination">
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={buildUrl(currentPage - 1)}
          className={`${btnBase} text-gray-600 hover:text-blue-600 hover:bg-blue-50`}
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Prev</span>
        </Link>
      ) : (
        <span className={`${btnBase} text-gray-300 cursor-not-allowed`}>
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Prev</span>
        </span>
      )}

      {/* Page numbers */}
      <div className="hidden sm:flex items-center gap-1">
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className={`${btnBase} text-gray-400 cursor-default`}>...</span>
          ) : (
            <Link
              key={p}
              href={buildUrl(p)}
              className={`${btnBase} ${
                p === currentPage
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              {p}
            </Link>
          )
        )}
      </div>

      {/* Mobile: current / total indicator */}
      <span className="sm:hidden text-sm font-medium text-gray-600 px-3">
        {currentPage} / {totalPages}
      </span>

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={buildUrl(currentPage + 1)}
          className={`${btnBase} text-gray-600 hover:text-blue-600 hover:bg-blue-50`}
        >
          <span className="hidden sm:inline">Next</span>
          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ) : (
        <span className={`${btnBase} text-gray-300 cursor-not-allowed`}>
          <span className="hidden sm:inline">Next</span>
          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      )}
    </nav>
  );
}
