import ResumeProfile from "./ResumeProfile";
import ResumeViewer from "./ResumeViewer";
import InterviewProfile from "./InterviewProfile";
import { useState } from "react";
import { X, User, FileText, MessageSquare } from "lucide-react";

function getFilenameFromUrl(url) {
  const parts = url.split('/');
  return parts.pop() || parts.pop();
}

export default function CandidateDetailsModal({
  candidateDetailsModalOpen,
  setCandidateDetailsModalOpen,
  candidateId,
  candidate
}) {
  const [activeSection, setActiveSection] = useState("ResumeProfile");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sections = [
    { key: "ResumeProfile", label: "Resume Profile", icon: <User className="w-4 h-4" /> },
    { key: "OriginalResume", label: "Original Resume", icon: <FileText className="w-4 h-4" /> },
    { key: "InterviewProfile", label: "Interview Profile", icon: <MessageSquare className="w-4 h-4" /> }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "ResumeProfile":
        return <ResumeProfile candidateId={candidateId} />;
      case "OriginalResume":
        return (
          <ResumeViewer
            fileName={`documents/${getFilenameFromUrl(candidate.resumeUrl)}`}
            onClose={() => setActiveSection("ResumeProfile")}
          />
        );
      case "InterviewProfile":
        return <InterviewProfile candidateId={candidateId} />;
      default:
        return null;
    }
  };

  if (!candidateDetailsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => setCandidateDetailsModalOpen(false)}
      />

      {/* Modal Container*/}
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden p-4">
        <div className="pointer-events-auto relative w-full max-w-7xl rounded-xl shadow-2xl bg-white dark:bg-gray-900 flex flex-col max-h-[95vh]">

          {/* Navbar Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="flex flex-col">
              {/* Top Bar */}
              <div className="flex items-center justify-between px-6 py-4">
                
                {/* Close + Title */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCandidateDetailsModalOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="text-lg font-semibold">
                    Candidate Profile
                  </div>
                </div>

                {/* Desktop Nav */}
                <div className="hidden lg:flex items-center gap-1">
                  {sections.map((section) => (
                    <button
                      key={section.key}
                      onClick={() => setActiveSection(section.key)}
                      className={`
                        flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer
                        ${activeSection === section.key
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900'
                        }
                      `}
                    >
                      {section.icon}
                      {section.label}
                    </button>
                  ))}
                </div>

                {/* Mobile Menu Button */}
                <div className="lg:hidden">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Mobile Navigation */}
              {isMobileMenuOpen && (
                <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 px-6 py-3 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex flex-col gap-2">
                    {sections.map((section) => (
                      <button
                        key={section.key}
                        onClick={() => {
                          setActiveSection(section.key);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`
                          flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer
                          ${activeSection === section.key
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }
                        `}
                      >
                        {section.icon}
                        {section.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Section Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderSection()}
          </div>

        </div>
      </div>
    </div>
  );
}
