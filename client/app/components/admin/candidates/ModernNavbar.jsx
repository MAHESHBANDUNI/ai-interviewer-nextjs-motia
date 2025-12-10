import { useState } from 'react';
import { Menu, X, User, FileText, MessageSquare } from 'lucide-react';

export default function ModernNavbar() {
  const [activeTab, setActiveTab] = useState("ResumeProfile");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { 
      key: "ResumeProfile", 
      label: "Resume Profile", 
      icon: <User className="w-4 h-4" />
    },
    { 
      key: "OriginalResume", 
      label: "Original Resume", 
      icon: <FileText className="w-4 h-4" />
    },
    { 
      key: "InterviewProfile", 
      label: "Interview Profile", 
      icon: <MessageSquare className="w-4 h-4" />
    }
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TalentView
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer
                  ${activeTab === item.key 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          {/* Right side items (optional) */}
          <div className="hidden md:flex items-center gap-4">
            <button className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              Settings
            </button>
            <button className="cursor-pointer px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              New Candidate
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-4">
            <button className="cursor-pointer px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              New
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="cursor-pointer inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setActiveTab(item.key);
                  setIsMobileMenuOpen(false);
                }}
                className={`
                  cursor-pointer w-full flex items-center gap-3 px-3 py-3 text-base font-medium rounded-lg transition-all
                  ${activeTab === item.key 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                {item.icon}
                {item.label}
                {activeTab === item.key && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-blue-600"></div>
                )}
              </button>
            ))}
            
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
              <button className="w-full px-3 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active tab indicator (for mobile) */}
      <div className="md:hidden">
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            {navItems.find(item => item.key === activeTab)?.icon}
            <span className="font-medium">
              {navItems.find(item => item.key === activeTab)?.label}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}