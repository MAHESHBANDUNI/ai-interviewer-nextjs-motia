import React, { useState, useEffect, useMemo } from 'react';

const Pagination = ({ 
  currentPage = 1, 
  totalPages = 1, 
  totalItems = 0, 
  itemsPerPage = 10,
  onPageChange,
  showItemsCount = true,
  siblingCount = 1,
  boundaryCount = 1
}) => {
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate range of items displayed
  const itemRange = useMemo(() => {
    if (totalItems === 0) return { start: 0, end: 0 };
    
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    return { start, end };
  }, [currentPage, totalItems, itemsPerPage]);

  // Generate pagination range with ellipsis logic
  const paginationRange = useMemo(() => {
    // If total pages is small, show all pages
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => ({
        type: 'page',
        value: i + 1
      }));
    }

    const range = [];
    
    // Always show first page
    range.push({ type: 'page', value: 1 });
    
    // Calculate left and right sibling boundaries
    const leftSibling = Math.max(currentPage - siblingCount, 2);
    const rightSibling = Math.min(currentPage + siblingCount, totalPages - 1);
    
    // Show left ellipsis if needed
    if (leftSibling > 2) {
      range.push({ type: 'ellipsis', value: 'left' });
    }
    
    // Add sibling pages
    for (let i = leftSibling; i <= rightSibling; i++) {
      range.push({ type: 'page', value: i });
    }
    
    // Show right ellipsis if needed
    if (rightSibling < totalPages - 1) {
      range.push({ type: 'ellipsis', value: 'right' });
    }
    
    // Always show last page if not already shown
    if (rightSibling < totalPages) {
      range.push({ type: 'page', value: totalPages });
    }
    
    return range;
  }, [currentPage, totalPages, siblingCount, boundaryCount]);

  // Handle direct page jump
  const handlePageJump = (e) => {
    if (e.key === 'Enter') {
      const page = parseInt(e.target.value);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        onPageChange(page);
        e.target.value = '';
      }
    }
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
      onPageChange(pageNumber);
    }
  };

  // Don't render if no pages
  if (totalPages <= 1) return null;

  // Mobile view - compact with page number display
  if (isMobile) {
    return (
      <div className="flex items-center justify-between bg-white px-3 py-3 sm:px-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex w-full items-center justify-between">
          {/* Previous button */}
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className={`inline-flex items-center justify-center p-2 rounded-lg min-w-[40px] ${
              currentPage === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
            } transition-colors duration-150`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Page info */}
          <div className="flex flex-col items-center">
            {showItemsCount && totalItems > 0 && (
              <div className="text-xs text-gray-600 mb-1">
                Showing <span className="font-semibold">{itemRange.start}-{itemRange.end}</span> of{' '}
                <span className="font-semibold">{totalItems}</span> results
              </div>
            )}
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium text-gray-700">Page</span>
              <span className="text-sm font-bold text-blue-600 min-w-[20px] text-center">
                {currentPage}
              </span>
              <span className="text-sm text-gray-500">of</span>
              <span className="text-sm font-bold text-gray-900 min-w-[20px] text-center">
                {totalPages}
              </span>
            </div>
            
            {/* Dots indicator for mobile */}
            <div className="flex items-center space-x-1 mt-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                let displayNum = pageNum;
                
                // Adjust display for current page near boundaries
                if (currentPage > 3 && currentPage < totalPages - 2) {
                  if (pageNum === 1) displayNum = currentPage - 2;
                  else if (pageNum === 2) displayNum = currentPage - 1;
                  else if (pageNum === 3) displayNum = currentPage;
                  else if (pageNum === 4) displayNum = currentPage + 1;
                  else if (pageNum === 5) displayNum = currentPage + 2;
                } else if (currentPage <= 3) {
                  displayNum = pageNum;
                } else {
                  displayNum = totalPages - 5 + pageNum;
                }
                
                return (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      displayNum === currentPage ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    title={`Page ${displayNum}`}
                  />
                );
              })}
            </div>
          </div>
          
          {/* Next button */}
          <button
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className={`inline-flex items-center justify-center p-2 rounded-lg min-w-[40px] ${
              currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
            } transition-colors duration-150`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Desktop view - full pagination
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-4 py-4 sm:px-6 rounded-lg border border-gray-200 shadow-sm">
      {/* Item count info */}
      {showItemsCount && totalItems > 0 && (
        <div className="mb-4 sm:mb-0 w-full sm:w-auto text-center sm:text-left">
          <p className="text-sm text-gray-700">
            Showing <span className="font-semibold">{itemRange.start}</span> to{' '}
            <span className="font-semibold">{itemRange.end}</span> of{' '}
            <span className="font-semibold">{totalItems}</span> results
            <span className="hidden lg:inline ml-2">
              (Page <span className="font-semibold">{currentPage}</span> of{' '}
              <span className="font-semibold">{totalPages}</span>)
            </span>
          </p>
        </div>
      )}
      
      {/* Pagination controls */}
      <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
        {/* Desktop page jump */}
          <div className="hidden lg:flex items-center space-x-2">
            <span className="text-sm text-gray-600">Go to:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
            //   onKeyDown={handlePageJump}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  handlePageChange(page);
                }
              }}
              className="w-16 text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </div>
        
        {/* Pagination buttons */}
        <nav className="flex items-center" aria-label="Pagination">
          <div className="flex items-center -space-x-px">
            {/* Previous button */}
            <button
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className={`relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 ${
                currentPage === 1
                  ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                  : 'text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'
              } transition-colors duration-150`}
            >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>

              {/* <span className="ml-1 hidden sm:inline text-sm font-medium">Previous</span> */}
            </button>
            
            {/* Page numbers */}
            {paginationRange.map((item, index) => {
              if (item.type === 'ellipsis') {
                return (
                  <span
                    key={`ellipsis-${item.value}-${index}`}
                    className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 border border-gray-300 bg-white"
                  >
                    ...
                  </span>
                );
              }
              
              const isCurrent = item.value === currentPage;
              
              return (
                <button
                  key={`page-${item.value}`}
                  onClick={() => onPageChange(item.value)}
                  aria-current={isCurrent ? 'page' : undefined}
                  aria-label={`Page ${item.value}`}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border border-gray-300 ${
                    isCurrent
                      ? 'z-10 bg-blue-600 text-white border-blue-600 font-semibold'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } transition-colors duration-150 cursor-pointer`}
                >
                  {item.value}
                </button>
              );
            })}
            
            {/* Next button */}
            <button
              onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className={`relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 ${
                currentPage === totalPages
                  ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                  : 'text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'
              } transition-colors duration-150`}
            >
              {/* <span className="mr-1 hidden sm:inline text-sm font-medium">Next</span> */}
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>

            </button>
          </div>
        </nav>
        
        {/* Mobile/tablet page jump */}
        <div className="flex lg:hidden items-center space-x-2">
          <span className="text-sm text-gray-600">Page:</span>
          <div className="flex items-center space-x-1">
            <select
              value={currentPage}
              onChange={(e) => onPageChange(parseInt(e.target.value))}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Select page"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <option key={page} value={page}>
                  {page}
                </option>
              ))}
            </select>
            {/* <span className="text-sm text-gray-400">/ {totalPages}</span> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pagination;