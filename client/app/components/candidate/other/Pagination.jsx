'use client'
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ 
    currentPage, 
    totalPages, 
    totalItems, 
    itemsPerPage, 
    onPageChange 
}) {
    if (totalPages <= 1) return null;

    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = totalItems === 0 ? 0 : Math.min(currentPage * itemsPerPage, totalItems);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);
            
            if (currentPage <= 3) {
                end = 4;
            }
            
            if (currentPage >= totalPages - 2) {
                start = totalPages - 3;
            }
            
            if (start > 2) pages.push('...');
            
            for (let i = start; i <= end; i++) pages.push(i);
            
            if (end < totalPages - 1) pages.push('...');
            
            pages.push(totalPages);
        }
        
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
            {/* Items info */}
            <div className="text-sm text-gray-700">
                Showing <span className="font-semibold">{startItem}</span> to{" "}
                <span className="font-semibold">{endItem}</span> of{" "}
                <span className="font-semibold">{totalItems}</span> results
            </div>

            {/* Pagination controls */}
            <nav className="flex items-center space-x-2">
                {/* Previous button */}
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg border ${
                        currentPage === 1
                            ? "border-gray-200 text-gray-400 cursor-not-allowed"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                    }`}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                    {getPageNumbers().map((page, index) => (
                        <React.Fragment key={index}>
                            {page === "..." ? (
                                <span className="px-3 py-2 text-gray-500">...</span>
                            ) : (
                                <button
                                    onClick={() => onPageChange(page)}
                                    className={`min-w-[40px] px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        currentPage === page
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "text-gray-700 hover:bg-gray-100 border border-transparent hover:border-gray-300"
                                    } cursor-pointer`}
                                >
                                    {page}
                                </button>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Next button */}
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg border ${
                        currentPage === totalPages
                            ? "border-gray-200 text-gray-400 cursor-not-allowed"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                    }`}
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </nav>

            {/* Page info */}
            <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
            </div>
        </div>
    );
}