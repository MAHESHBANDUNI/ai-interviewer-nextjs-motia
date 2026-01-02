import { X, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useState, useEffect } from "react";

export default function InterviewProfile({ candidateId, interviewId }) {
  const {data: session} = useSession();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedInterview, setSelectedInterview] = useState(null);

  useEffect(() => {
    if (!session?.user?.token) return;
    fetchInterviewProfiles(candidateId, interviewId);
  }, [session?.user?.token]);

  const fetchInterviewProfiles = async (candidateId, interviewId) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/candidate/interview/list`, {
        method: 'POST',
        headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`},
        body: JSON.stringify({ candidateId, interviewId })
      });
      const data = await response.json();
      if (response.ok && data?.interviews) {
        setInterviews(data?.interviews);
        if (data?.interviews.length > 0) {
          setSelectedInterview(data.interviews[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching interview profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[75vh] bg-white flex flex-col items-center justify-center space-y-12 p-8">
        
        {/* Professional Interview Analysis Animation */}
        <div className="relative w-full max-w-4xl">
          
          {/* Interview Analysis Container */}
          <div className="relative bg-white rounded-xl shadow-lg border border-slate-200 mx-auto w-auto sm:w-96 h-48 overflow-hidden">
            
            {/* Analysis Header */}
            <div className="bg-indigo-600 text-white p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-lg animate-pulse"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-indigo-400 rounded-full w-32 animate-pulse"></div>
                  <div className="h-2 bg-indigo-500 rounded-full w-24 animate-pulse"></div>
                </div>
              </div>
            </div>
    
            {/* Analysis Content */}
            <div className="p-6 h-32 overflow-hidden">
              <div className="animate-professionalScroll space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex space-x-4 items-center">
                    <div className="flex-shrink-0 w-3 h-3 bg-indigo-500 rounded-full opacity-70"></div>
                    <div 
                      className="h-2 bg-slate-200 rounded-full flex-1"
                      style={{ width: `${60 + (i * 5)}%` }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
              
            {/* Progress Indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
              <div className="h-full bg-gradient-to-r from-indigo-600 to-blue-600 animate-progress"></div>
            </div>
          </div>
              
          {/* Processing Elements */}
          <div className="absolute -top-4 -right-4">
            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-3 w-32">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <div className="text-xs font-medium text-slate-700">Analyzing</div>
              </div>
              <div className="mt-1 h-1 bg-slate-100 rounded-full">
                <div className="h-full bg-amber-500 rounded-full w-3/4"></div>
              </div>
            </div>
          </div>
              
          <div className="absolute -bottom-4 -left-4">
            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-3 w-32">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <div className="text-xs font-medium text-slate-700">Scoring</div>
              </div>
              <div className="mt-1 h-1 bg-slate-100 rounded-full">
                <div className="h-full bg-indigo-500 rounded-full w-2/3"></div>
              </div>
            </div>
          </div>
              
          {/* Analysis Visualization */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 opacity-10">
            <div className="absolute inset-0 border-2 border-indigo-300 rounded-full animate-ping-slow"></div>
            <div className="absolute inset-4 border-2 border-indigo-400 rounded-full animate-ping-slower"></div>
          </div>
              
        </div>
              
        {/* Status Information */}
        <div className="text-center space-y-6 max-w-2xl">
              
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-800">
              Processing Interview Performance
            </h1>
            <p className="text-slate-600 text-lg">
              Analyzing responses and evaluating technical competency
            </p>
          </div>
              
          {/* Interview Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-4">
            {[
              { label: 'Response Analysis', value: 'Processing', color: 'bg-indigo-500' },
              { label: 'Skill Assessment', value: 'Evaluating', color: 'bg-amber-500' },
              { label: 'Performance Score', value: 'Calculating', color: 'bg-green-500' },
              { label: 'Role Fit', value: 'Analyzing', color: 'bg-blue-500' }
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
              { label: 'Interview Analysis', progress: '75%', width: 'w-3/4' },
              { label: 'Performance Scoring', progress: '65%', width: 'w-2/3' },
              { label: 'Recommendation Engine', progress: '50%', width: 'w-1/2' }
            ].map((item, index) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="font-semibold text-slate-600">{item.progress}</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full animate-progressBar ${item.width}`}
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
  
  if (!interviews || interviews.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-gradient-to-r from-indigo-200 to-blue-200 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">No Interview Data Available</h2>
          <p className="text-gray-600">This candidate hasn't completed any interviews yet.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 animate-fade-in">
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {interviews[0]?.candidate?.firstName[0]}{interviews[0]?.candidate?.lastName[0]}
                </div>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                  {interviews[0]?.candidate?.firstName} {interviews[0]?.candidate?.lastName}
                </h1>
                <p className="text-gray-600 mb-3">Interview Performance Analysis</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-sm">{interviews.length} Interview{interviews.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-sm">Latest Score: {interviews[0]?.interviewProfile?.performanceScore || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Interview Selector */}
            {/* <div className="flex-shrink-0">
              <select 
                value={selectedInterview?.interviewId || ''}
                onChange={(e) => {
                  const interview = interviews.find(i => i.interviewId === e.target.value);
                  setSelectedInterview(interview);
                }}
                className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {interviews.map((interview) => (
                  <option key={interview.interviewId} value={interview.interviewId}>
                    {formatDate(interview.scheduledAt)} - {interview.status}
                  </option>
                ))}
              </select>
            </div> */}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
          {['overview', 'performance', 'questions', 'recommendations'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg transform scale-105'
                  : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <div className="animate-fade-in-up">
          {/* Overview Section */}
          {activeTab === 'overview' && selectedInterview && (
            <div className="space-y-6">
              {/* Performance Score Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4 lg:mb-10">
                    <h3 className="text-lg font-semibold text-gray-900">Performance Score</h3>
                    <div className="text-sm font-medium px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
                      {selectedInterview.interviewProfile?.analytics?.correctAnswers || 0}/{selectedInterview.interviewProfile?.analytics?.totalQuestions || 0} Correct
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="relative w-48 h-48">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-5xl font-bold text-gray-900">
                            {selectedInterview.interviewProfile?.performanceScore || 0}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">out of 100</div>
                        </div>
                      </div>
                      <svg className="w-48 h-48" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="10"/>
                        <circle cx="50" cy="50" r="45" fill="none" 
                          stroke="url(#gradient)" 
                          strokeWidth="10" 
                          strokeLinecap="round"
                          strokeDasharray={`${(selectedInterview.interviewProfile?.performanceScore || 0) * 2.83} 283`}
                          transform="rotate(-90 50 50)"
                        />
                        <defs>
                           <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                             <stop offset="0%" stopColor="#4f46e5" />
                             <stop offset="50%" stopColor="#4338ca" />
                             <stop offset="100%" stopColor="#1d4ed8" />
                           </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Interview Details */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                          </svg>
                          <span className="font-medium">Interviewer:</span>
                          <span>{selectedInterview.admin?.firstName} {selectedInterview.admin?.lastName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                          </svg>
                          <span className="font-medium">Date:</span>
                          <span>{formatDate(selectedInterview.scheduledAt)}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                          </svg>
                          <span className="font-medium">Time:</span>
                          <span>{formatTime(selectedInterview.scheduledAt)} ({selectedInterview.durationMin} mins)</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                          <span className="font-medium">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedInterview.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            selectedInterview.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {selectedInterview.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-indigo-50 rounded-xl">
                        <div className="text-2xl font-bold text-indigo-600">
                          {selectedInterview.interviewProfile?.analytics?.averageDifficulty || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Avg. Difficulty</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-xl">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedInterview.interviewProfile?.analytics?.correctAnswers || 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Correct Answers</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-xl">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedInterview.interviewProfile?.analytics?.totalQuestions || 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Total Questions</div>
                      </div>
                      <div className="text-center p-4 bg-amber-50 rounded-xl">
                        <div className="text-2xl font-bold text-amber-600">
                          {selectedInterview.interviewProfile?.recommendedRoles?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Recommended Roles</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tech Stack Fit */}
              {/* <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Technology Stack Fit</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedInterview.interviewProfile?.techStackFit?.map((tech, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 rounded-full text-sm font-medium hover:from-indigo-200 hover:to-blue-200 transition-colors"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div> */}
            </div>
          )}

          {/* Performance Analysis Section */}
          {activeTab === 'performance' && selectedInterview && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4 ">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Strengths</h3>
                  </div>
                  <ul className="space-y-3">
                    {selectedInterview.interviewProfile?.strengths?.map((strength, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Areas for Improvement</h3>
                  </div>
                  <ul className="space-y-3">
                    {selectedInterview.interviewProfile?.weaknesses?.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Analytics Details */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analytics</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Average Question Difficulty</span>
                      <span>{selectedInterview.interviewProfile?.analytics?.averageDifficulty || 'N/A'}/5</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"
                        style={{ width: `${((selectedInterview.interviewProfile?.analytics?.averageDifficulty || 0) / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Accuracy Rate</span>
                      <span>
                        {selectedInterview.interviewProfile?.analytics?.correctAnswers || 0}/
                        {selectedInterview.interviewProfile?.analytics?.totalQuestions || 0} 
                        ({selectedInterview.interviewProfile?.analytics?.totalQuestions ? 
                          Math.round((selectedInterview.interviewProfile.analytics.correctAnswers / selectedInterview.interviewProfile.analytics.totalQuestions) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                        style={{ width: `${selectedInterview.interviewProfile?.analytics?.totalQuestions ? 
                          (selectedInterview.interviewProfile.analytics.correctAnswers / selectedInterview.interviewProfile.analytics.totalQuestions) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Questions & Answers Section */}
          {activeTab === 'questions' && selectedInterview && (
            // <div className="space-y-6">
            //   {selectedInterview.questions?.map((question, index) => (
            //     <div
            //       key={index}
            //       className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
            //       style={{ animationDelay: `${index * 100}ms` }}
            //     >
            //       <div className="flex items-start justify-between gap-4 mb-4">
            //         <div className="flex-1">
            //           <div className="flex items-center gap-4 mb-2">
            //             <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
            //               {index + 1}
            //             </div>
            //             <div>
            //               <div className="flex items-center gap-2">
            //                 <span className="text-sm font-medium text-gray-500">Difficulty:</span>
            //                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            //                   question.difficultyLevel >= 4 ? 'bg-red-100 text-red-800' :
            //                   question.difficultyLevel >= 3 ? 'bg-amber-100 text-amber-800' :
            //                   'bg-green-100 text-green-800'
            //                 }`}>
            //                   Level {question.difficultyLevel}
            //                 </span>
            //               </div>
            //             </div>
            //             <div>
            //               <div className="flex items-center gap-2">
            //                 <span className="text-sm font-medium text-gray-500">Correct:</span>
            //                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            //                   question.correct === true ? 'bg-green-100 text-green-800' :
            //                   'bg-red-100 text-red-800'
            //                 }`}>
            //                   {question.correct === true ? <Check className="w-4 h-4"></Check> : <X className="w-4 h-4"></X>}
            //                 </span>
            //               </div>
            //             </div>
            //           </div>
            //           <h3 className="text-lg font-semibold text-gray-900 mb-3">{question.content}</h3>
            //         </div>
            //       </div>

            //       <div className="space-y-4">
            //         <div>
            //           <h4 className="text-sm font-medium text-gray-700 mb-2">Candidate's Answer</h4>
            //           <div className="bg-gray-50 rounded-xl p-4">
            //             <p className="text-gray-700 whitespace-pre-wrap">{question.candidateAnswer}</p>
            //           </div>
            //         </div>

            //         <div>
            //           <h4 className="text-sm font-medium text-gray-700 mb-2">AI Feedback</h4>
            //           <div className="bg-blue-50 rounded-xl p-4">
            //             <p className="text-gray-700">{question.aiFeedback}</p>
            //           </div>
            //         </div>
            //       </div>
            //     </div>
            //   ))}
            // </div>
              <div className="mt-6">
                <div className="flex items-center mb-6">
                    <div className="w-1 h-8 bg-indigo-500 rounded-full mr-3"></div>
                    <h3 className="text-xl font-bold text-gray-800">Interview Questions</h3>
                    <span className="ml-3 px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full">
                        {selectedInterview.questions.length} Questions
                    </span>
                </div>
                
                <div className="space-y-4">
                    {selectedInterview.questions.map((question, index) => (
                        <div key={question.interviewQuestionId} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                            <div className="p-5">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                                    <div className="flex items-start space-x-3 mb-3 lg:mb-0">
                                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                            <span className="text-white font-bold text-sm">Q{index + 1}</span>
                                        </div>
                                        <div>
                                            <p className="text-gray-800 font-medium">{question.content}</p>
                                            {question.topic && (
                                                <span className="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                                                    {question.topic}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                        question.difficultyLevel >= 4 
                                            ? 'bg-red-50 text-red-700 border border-red-100' 
                                            : question.difficultyLevel >= 3 
                                                ? 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                                                : 'bg-green-50 text-green-700 border border-green-100'
                                    }`}>
                                        {question.difficultyLevel >= 4 ? 'Expert' : 
                                         question.difficultyLevel >= 3 ? 'Intermediate' : 'Beginner'}
                                    </div>
                                </div>

                                {question.candidateAnswer && (
                                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                                        <div className="flex items-center mb-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                            <span className="text-sm font-semibold text-blue-700">Candidate Answer</span>
                                        </div>
                                        <p className="text-gray-700 text-sm leading-relaxed">{question.candidateAnswer}</p>
                                    </div>
                                )}

                                {question.aiFeedback && (
                                    <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-100">
                                        <div className="flex items-center mb-2">
                                            <svg className="w-4 h-4 text-indigo-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm font-semibold text-indigo-700">AI Feedback</span>
                                        </div>
                                        <p className="text-gray-700 text-sm leading-relaxed">{question.aiFeedback}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {/* Recommendations Section */}
          {activeTab === 'recommendations' && selectedInterview && (
            <div className="space-y-6">
              {/* Recommended Roles */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Recommended Roles</h3>
                    <p className="text-gray-600">Based on interview performance and skills</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedInterview.interviewProfile?.recommendedRoles?.map((role, index) => (
                    <div
                      key={index}
                      className="group relative bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5 hover:from-indigo-100 hover:to-blue-100 transition-all duration-300 cursor-pointer border border-indigo-100"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/>
                          </svg>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                          Score: {selectedInterview.interviewProfile?.performanceScore || 0}/100
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                        {role}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Strong match based on technical skills and interview responses
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Items */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
                <div className="space-y-3">
                  {[
                    { 
                      title: 'Schedule Follow-up Interview', 
                      description: 'Consider a technical deep-dive interview',
                      status: 'pending'
                    },
                    { 
                      title: 'Share Performance Report', 
                      description: 'Send detailed analysis to hiring manager',
                      status: 'completed'
                    },
                    { 
                      title: 'Skill Development Plan', 
                      description: 'Create improvement plan for identified weaknesses',
                      status: 'pending'
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.status === 'completed' ? 'bg-green-100' : 'bg-indigo-100'
                      }`}>
                        {item.status === 'completed' ? (
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <button className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer">
                        {item.status === 'completed' ? 'Completed' : 'Take Action'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
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