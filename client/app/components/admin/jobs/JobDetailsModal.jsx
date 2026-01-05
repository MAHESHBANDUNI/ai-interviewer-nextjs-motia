"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function JobDetailsModal({ 
    jobDetailsModalOpen,
    setJobDetailsModalOpen,
    jobDetails
}) {

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setJobDetailsModalOpen(false);
      }
    };

    if (jobDetailsModalOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [jobDetailsModalOpen]);

  if (!jobDetailsModalOpen || !jobDetails) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setJobDetailsModalOpen(false);
    }
  };

  const cleanContent = jobDetails?.jobDescription.replace(/&nbsp;/g, " ").replace(/\u00A0/g, " ");

  if (!jobDetailsModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000]"
    >
      {/* Backdrop with smoother transition */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleBackdropClick}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden p-4">
        <div
          className="pointer-events-auto relative w-full max-w-7xl rounded-xl shadow-2xl bg-white dark:bg-gray-900 flex flex-col max-h-[95vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 p-3 md:p-6 flex justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 whitespace-nowrap">Job details</span>
            
            {/* Close Button */}
            <button
              onClick={()=>setJobDetailsModalOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 p-4 sm:p-6">
            {/* Job Details Sections */}
            {jobDetails.jobDescription && (
              <section className="mb-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 whitespace-nowrap">
                    Job Position:
                  </span>
                  <p className="text-lg sm:text-xl md:text-2xl font-medium text-gray-600 truncate flex-1 min-w-0">
                    {jobDetails.jobPositionName || "Job Details"}
                  </p>
                </div>
                <div className="mt-5">
                  <p className="text-lg sm:text-xl md:text-2xl font-medium mt-1 mb-2 text-gray-800"><strong>Job description:</strong></p>
                </div>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    <div
                      className="quill-content"
                      dangerouslySetInnerHTML={{
                      __html: cleanContent || "",
                      }}
                    />
                  </p>
                </div>
              </section>
            )}

          </div>

          {/* Footer with Actions */}
          {/* <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-800 sticky bottom-0 bg-white dark:bg-gray-900 rounded-b-2xl">
            <div className="flex justify-end gap-3">
              <button
                onClick={()=>setJobDetailsModalOpen(false)}
                className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={()=>setJobDetailsModalOpen(false)}
                className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}