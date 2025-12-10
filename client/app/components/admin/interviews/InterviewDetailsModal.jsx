import InterviewProfile from "./InterviewProfile";
import { useState } from "react";
import { X, MessageSquare } from "lucide-react";

export default function InterviewDetailsModal({
  interviewDetailsModalOpen,
  setInterviewDetailsModalOpen,
  interview,
  selectedInterviewId,
}) {
  const [activeSection, setActiveSection] = useState("InterviewProfile");

  const sections = [
    { key: "InterviewProfile", label: "Interview Profile", icon: <MessageSquare className="w-4 h-4" /> }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "InterviewProfile":
        return (
          <InterviewProfile
            interviewId={selectedInterviewId}
            candidateId={interview?.candidate?.candidateId}
          />
        );
      default:
        return null;
    }
  };

  if (!interviewDetailsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => setInterviewDetailsModalOpen(false)}
      />

      {/* Modal Container — CENTERED */}
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden p-4">
        <div className="pointer-events-auto relative w-full max-w-7xl rounded-xl shadow-2xl bg-white dark:bg-gray-900 flex flex-col max-h-[95vh]">

          {/* Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="flex flex-col">

              {/* Top Bar */}
              <div className="flex items-center justify-between px-6 py-4">
                
                {/* Close + Title */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setInterviewDetailsModalOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    Interview Performance
                  </div>
                </div>

                {/* Desktop Navigation (only 1 tab now) */}
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

              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderSection()}
          </div>

        </div>
      </div>
    </div>
  );
}
