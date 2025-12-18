import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ResumeProfile({ candidateId }) {
  const [candidateResumeProfile, setCandidateResumeProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("experience");
  const { data: session } = useSession();

  useEffect(() => {
    fetchCandidateResumeProfile(candidateId);
  }, [candidateId]);

  const fetchCandidateResumeProfile = async (candidateId) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/candidate/resume/profile`, {
        method: 'POST',
        headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`},
        body: JSON.stringify({ candidateId })
      });
      const data = await response.json();
      if (response.ok) {
        setCandidateResumeProfile(data?.resumeProfile);
      }
    } catch (error) {
      console.error('Error fetching resume profile:', error);
    } finally {
      setLoading(false);
    }
    };
  
  if (loading || !candidateResumeProfile) {
    return (
      <div className="h-full bg-white flex flex-col items-center justify-center space-y-12 p-8">
      
        {/* Professional Document Processing Animation */}
        <div className="relative w-full max-w-4xl">
          
          {/* Main Resume Container */}
          <div className="relative bg-white rounded-xl shadow-lg border border-slate-200 mx-auto w-auto sm:w-96 h-48 overflow-hidden">
            
            {/* Document Header */}
            <div className="bg-slate-600 text-white p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg animate-pulse"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-blue-400 rounded-full w-32 animate-pulse"></div>
                  <div className="h-2 bg-blue-500 rounded-full w-24 animate-pulse"></div>
                </div>
              </div>
            </div>
    
            {/* Scrolling Content */}
            <div className="p-6 h-32 overflow-hidden">
              <div className="animate-professionalScroll space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex space-x-4 items-center">
                    <div className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full opacity-70"></div>
                    <div 
                      className="h-2 bg-slate-200 rounded-full flex-1"
                      style={{ width: `${75 + (i * 3)}%` }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
              
            {/* Progress Indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
              <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 animate-progress"></div>
            </div>
          </div>
              
          {/* Processing Elements */}
          <div className="absolute -top-4 -right-4">
            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-3 w-32">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="text-xs font-medium text-slate-700">Analyzing</div>
              </div>
              <div className="mt-1 h-1 bg-slate-100 rounded-full">
                <div className="h-full bg-green-500 rounded-full w-3/4"></div>
              </div>
            </div>
          </div>
              
          <div className="absolute -bottom-4 -left-4">
            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-3 w-32">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="text-xs font-medium text-slate-700">Structuring</div>
              </div>
              <div className="mt-1 h-1 bg-slate-100 rounded-full">
                <div className="h-full bg-blue-500 rounded-full w-2/3"></div>
              </div>
            </div>
          </div>
              
          {/* Data Points Visualization */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 opacity-10">
            <div className="absolute inset-0 border-2 border-slate-300 rounded-full animate-ping-slow"></div>
            <div className="absolute inset-4 border-2 border-slate-400 rounded-full animate-ping-slower"></div>
          </div>
              
        </div>
              
        {/* Status Information */}
        <div className="text-center space-y-6 max-w-2xl">
              
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-800">
              Processing Professional Profile
            </h1>
            <p className="text-slate-600 text-lg">
              Extracting and analyzing career achievements and qualifications
            </p>
          </div>
              
          {/* Professional Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-4">
            {[
              { label: 'Career History', value: 'Processing', color: 'bg-blue-500' },
              { label: 'Qualifications', value: 'Analyzing', color: 'bg-emerald-500' },
              { label: 'Achievements', value: 'Extracting', color: 'bg-purple-500' },
              { label: 'Expertise', value: 'Cataloging', color: 'bg-amber-500' }
            ].map((metric, index) => (
              <div key={metric.label} className="text-center">
                <div className="flex justify-center mb-2">
                  <div className={`w-3 h-3 rounded-full ${metric.color} animate-pulse`}></div>
                </div>
                <div className="text-sm font-semibold text-slate-700 mb-1">{metric.label}</div>
                <div className="text-xs text-slate-500 font-medium">{metric.value}</div>
              </div>
            ))}
          </div>
          
          {/* Progress Bars */}
          <div className="space-y-5 pt-4">
            {[
              { label: 'Document Analysis', progress: '85%', width: 'w-5/6' },
              { label: 'Data Extraction', progress: '70%', width: 'w-2/3' },
              { label: 'Profile Optimization', progress: '60%', width: 'w-3/5' }
            ].map((item, index) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="font-semibold text-slate-600">{item.progress}</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r from-slate-600 to-slate-500 rounded-full animate-progressBar ${item.width}`}
                    style={{ animationDelay: `${index * 0.5}s` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Subtle Loading Indicator */}
          <div className="flex items-center justify-center space-x-2 pt-4">
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          
        </div>
          
        <style jsx>{`
          @keyframes professionalScroll {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
          
          @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          
          @keyframes progressBar {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          
          @keyframes ping-slow {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(2); opacity: 0; }
          }
          
          @keyframes ping-slower {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          
          .animate-professionalScroll {
            animation: professionalScroll 8s linear infinite;
          }
          
          .animate-progress {
            animation: progress 3s ease-in-out infinite;
          }
          
          .animate-progressBar {
            animation: progressBar 2s ease-out forwards;
          }
          
          .animate-ping-slow {
            animation: ping-slow 3s ease-out infinite;
          }
          
          .animate-ping-slower {
            animation: ping-slower 4s ease-out infinite;
          }
        `}</style>
  
      </div>
    );
  }

  const { candidate, experienceSummary, technicalSkills, projects, certifications, educationSummary } = candidateResumeProfile;

  const tabData = {
    experience: experienceSummary.length > 0,
    skills: Object.keys(technicalSkills).length > 0,
    projects: projects.length > 0,
    certifications: certifications.length > 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 animate-fade-in">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {candidate.firstName[0]}{candidate.lastName[0]}
              </div>
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {candidate.firstName} {candidate.lastName}
              </h1>
              <p className="text-xl text-blue-600 font-semibold mb-4">{candidateResumeProfile.profileTitle}</p>
              <p className="text-gray-600 mb-4 max-w-2xl">{educationSummary}</p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <a href={`mailto:${candidate.email}`} className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                  {candidate.email}
                </a>
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                  </svg>
                  {candidate.phone}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
          {['experience', 'skills', 'projects', 'certifications']
            .filter(tab => tabData[tab]) // Only show tabs with data
            .map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`cursor-pointer px-6 py-3 rounded-full font-semibold transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
        </div>

        {/* Content Sections */}
        <div className="animate-fade-in-up">
          {/* Experience Section */}
          {activeTab === 'experience' && (
            <div className="space-y-6">
              {experienceSummary?.map((exp, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-l-4 border-blue-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{exp.title}</h3>
                      <p className="text-lg text-blue-600 font-semibold">{exp.company}</p>
                    </div>
                    <div className="mt-2 lg:mt-0 lg:text-right">
                      <p className="text-gray-600 font-medium">{exp.dates}</p>
                      <p className="text-gray-500">{exp.location}</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {exp.responsibilities.map((resp, respIndex) => (
                      <li key={respIndex} className="flex items-start gap-3 text-gray-700">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Skills Section */}
          {activeTab === 'skills' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {Object.entries(technicalSkills).map(([category, skills], index) => (
                <div
                  key={category}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skills?.map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Projects Section */}
          {activeTab === 'projects' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects?.map((project, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {project.name}
                  </h3>
                  <ul className="space-y-2">
                    {project.description.map((description, descriptionIndex) => (
                      <li key={descriptionIndex} className="flex items-start gap-3 text-gray-700">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Certifications Section */}
          {activeTab === 'certifications' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {certifications?.map((cert, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-t-4 border-green-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{cert}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}