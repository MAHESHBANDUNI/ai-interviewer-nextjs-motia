"use client";

import { useEffect, useState } from "react";

export default function ResumeViewer({ fileName }) {
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const pdfUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/candidates/resume/view?file=${encodeURIComponent(fileName)}`;

  useEffect(() => {
    if (!pdfUrl) return;

    let objectUrl = null;

    fetch(pdfUrl)
      .then((res) => res.blob())
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(objectUrl);
      });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [pdfUrl]);

  return (
    <div className="w-full h-full bg-white">
      {!pdfBlobUrl ? (
        <div className="h-[85vh] bg-white flex items-center justify-center">
         <div className="text-center space-y-8">
              {/* Opening Book Animation */}
              <div className="relative w-32 h-40 mx-auto">
                {/* Book Cover */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-2xl transform -rotate-6 transition-transform duration-1000 animate-pulse">
                  <div className="absolute top-4 left-0 right-0 text-center">
                    <div className="w-16 h-1 bg-white/30 mx-auto mb-2"></div>
                    <div className="w-20 h-1 bg-white/30 mx-auto mb-1"></div>
                    <div className="w-12 h-1 bg-white/30 mx-auto"></div>
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-xs font-bold">
                    RESUME
                  </div>
                </div>

                {/* Pages flipping */}
                <div className="absolute top-1 left-4 right-4 bottom-1 bg-white rounded-r transform rotate-0 origin-left animate-[pageFlip_2s_ease-in-out_infinite]">
                  <div className="h-full w-full bg-gray-50 rounded-r">
                    <div className="p-2">
                      <div className="h-1 bg-gray-300 rounded mb-1"></div>
                      <div className="h-1 bg-gray-300 rounded mb-1 w-3/4"></div>
                      <div className="h-1 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>

                {/* Next page peeking */}
                <div className="absolute top-1 left-6 right-2 bottom-1 bg-gray-100 rounded-r opacity-70"></div>
              </div>

              <div className="space-y-2">
                <p className="text-slate-700 text-xl font-semibold">Opening Resume</p>
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
        </div>
      ) : (
        <iframe
          src={pdfBlobUrl}
          className="w-full h-[85vh] rounded-md"
          frameBorder="0"
        />
      )}
    </div>
  );
}
