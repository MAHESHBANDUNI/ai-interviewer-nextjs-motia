'use client';

export default function PerformanceModal({ interview, isOpen, onClose, formatDate }) {
    if (!isOpen || !interview) return null;

    const InterviewQuestions = ({ questions }) => {
        if (!questions || questions.length === 0) return null;

        return (
            <div className="mt-6">
                <div className="flex items-center mb-6">
                    <div className="w-1 h-8 bg-indigo-500 rounded-full mr-3"></div>
                    <h3 className="text-xl font-bold text-gray-800">Interview Questions</h3>
                    <span className="ml-3 px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full">
                        {questions.length} Questions
                    </span>
                </div>
                
                <div className="space-y-4">
                    {questions.map((question, index) => (
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
                                            <span className="text-sm font-semibold text-blue-700">Your Answer</span>
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
        );
    };

    return (
        <div className="fixed inset-0 z-500 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />
            
            {/* Modal Container */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-6xl">
                    {/* Modal Card */}
                    <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                        {/* Light Header */}
                        <div className="bg-gradient-to-b from-white via-white to-blue-50 px-8 py-6 border-b border-gray-100">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center space-x-4">
                                    <div className="relative">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                                            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            Performance Analysis
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                                                {interview.admin?.firstName} {interview.admin?.lastName}
                                            </span>
                                            <span className="text-gray-500">•</span>
                                            <span className="text-gray-600">
                                                {formatDate(interview.scheduledAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="cursor-pointer self-start sm:self-center p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-200"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 max-h-[70vh] overflow-y-auto">
                            {/* Enhanced Performance Score Card */}
                            {interview.interviewProfile && (
                                <div className="mb-10">
                                    {/* Main Performance Dashboard */}
                                    <div className="mb-8">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Main Score Card */}
                                            <div className="lg:col-span-2 bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
                                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Overall Performance Score</h3>
                                                        <div className="relative">
                                                            <div className="flex items-baseline mb-4">
                                                                <span className="text-6xl font-bold text-gray-900">
                                                                    {interview.interviewProfile.performanceScore}
                                                                </span>
                                                                <span className="text-2xl text-gray-500 ml-2">/100</span>
                                                                <div className={`ml-4 px-3 py-1 rounded-full text-sm font-semibold ${
                                                                    interview.interviewProfile.performanceScore >= 80 
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : interview.interviewProfile.performanceScore >= 60
                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {interview.interviewProfile.performanceScore >= 80 
                                                                        ? 'Excellent'
                                                                        : interview.interviewProfile.performanceScore >= 60
                                                                        ? 'Good'
                                                                        : 'Needs Improvement'}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Score Progress Bar */}
                                                            <div className="relative pt-1">
                                                                <div className="flex mb-2 items-center justify-between">
                                                                    <div>
                                                                        <span className="text-xs font-semibold inline-block text-blue-600">
                                                                            Performance Level
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-xs font-semibold inline-block text-blue-600">
                                                                            {interview.interviewProfile.performanceScore}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-gray-200">
                                                                    <div 
                                                                        style={{ width: `${interview.interviewProfile.performanceScore}%` }}
                                                                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full transition-all duration-500 ${
                                                                            interview.interviewProfile.performanceScore >= 80 
                                                                                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                                                                : interview.interviewProfile.performanceScore >= 60
                                                                                ? 'bg-gradient-to-r from-yellow-500 to-amber-600'
                                                                                : 'bg-gradient-to-r from-red-500 to-pink-600'
                                                                        }`}
                                                                    ></div>
                                                                </div>
                                                                <div className="flex justify-between text-xs text-gray-500">
                                                                    <span>0</span>
                                                                    <span>25</span>
                                                                    <span>50</span>
                                                                    <span>75</span>
                                                                    <span>100</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Vertical Stats Divider */}
                                                    <div className="hidden md:block w-px h-40 bg-gradient-to-b from-transparent via-blue-200 to-transparent"></div>
                                                    
                                                    {/* Quick Stats */}
                                                    <div className="flex-1">
                                                        <h4 className="text-lg font-semibold text-gray-700 mb-4">Quick Stats</h4>
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                                                                <div className="flex items-center">
                                                                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                                                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm text-gray-600">Correct Answers</p>
                                                                        <p className="text-2xl font-bold text-gray-900">
                                                                            {interview.interviewProfile.analytics?.correctAnswers || 0}/{interview.interviewProfile.analytics?.totalQuestions || 0}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-lg font-bold text-green-600">
                                                                        {interview?.interviewProfile?.analytics?.totalQuestions != 0
                                                                            ? Math.round((interview.interviewProfile.analytics.correctAnswers / interview.interviewProfile.analytics.totalQuestions) * 100)
                                                                            : 0}%
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">Accuracy</div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                                                                <div className="flex items-center">
                                                                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mr-3">
                                                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                                        </svg>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm text-gray-600">Avg Difficulty</p>
                                                                        <p className="text-2xl font-bold text-gray-900">
                                                                            {interview.interviewProfile.analytics?.averageDifficulty?.toFixed(1) || 'N/A'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className={`text-lg font-bold ${
                                                                        interview.interviewProfile.analytics?.averageDifficulty >= 4
                                                                            ? 'text-red-600'
                                                                            : interview.interviewProfile.analytics?.averageDifficulty >= 3
                                                                            ? 'text-yellow-600'
                                                                            : 'text-green-600'
                                                                    }`}>
                                                                        {interview.interviewProfile.analytics?.averageDifficulty >= 4
                                                                            ? 'Expert'
                                                                            : interview.interviewProfile.analytics?.averageDifficulty >= 3
                                                                            ? 'Intermediate'
                                                                            : 'Beginner'}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">Level</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Confidence Score */}
                                            {/* <div className="bg-gradient-to-br from-white to-indigo-50 rounded-2xl p-6 border border-indigo-100 shadow-sm">
                                                <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                                    <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    AI Confidence
                                                </h4>
                                                <div className="text-center mb-4">
                                                    <div className="relative inline-flex items-center justify-center">
                                                        <div className="relative">
                                                            <svg className="w-32 h-32">
                                                                <circle
                                                                    cx="64"
                                                                    cy="64"
                                                                    r="58"
                                                                    fill="none"
                                                                    stroke="#e5e7eb"
                                                                    strokeWidth="8"
                                                                />
                                                                <circle
                                                                    cx="64"
                                                                    cy="64"
                                                                    r="58"
                                                                    fill="none"
                                                                    stroke="url(#gradient)"
                                                                    strokeWidth="8"
                                                                    strokeLinecap="round"
                                                                    strokeDasharray={`${interview.interviewProfile.confidenceScore || 85 * 3.64} 365`}
                                                                    transform="rotate(-90 64 64)"
                                                                />
                                                                <defs>
                                                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                        <stop offset="0%" stopColor="#4f46e5" />
                                                                        <stop offset="100%" stopColor="#3b82f6" />
                                                                    </linearGradient>
                                                                </defs>
                                                            </svg>
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                <span className="text-3xl font-bold text-gray-900">
                                                                    {interview.interviewProfile.confidenceScore || 85}%
                                                                </span>
                                                                <span className="text-sm text-gray-600">Confidence</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 text-center">
                                                    AI's confidence in assessment accuracy
                                                </p>
                                            </div> */}
                                        </div>
                                    </div>

                                    {/* Analytics Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                        {/* Strengths */}
                                        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                            <div className="flex items-center mb-4">
                                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <h4 className="text-lg font-semibold text-gray-800">Strengths</h4>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {interview.interviewProfile.strengths?.map((strength, index) => (
                                                    <span key={index} className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-green-50 to-green-100 text-green-700 text-sm font-medium rounded-lg border border-green-200">
                                                        {strength}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Areas for Improvement */}
                                        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                            <div className="flex items-center mb-4">
                                                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center mr-3">
                                                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                </div>
                                                <h4 className="text-lg font-semibold text-gray-800">Areas for Improvement</h4>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {interview.interviewProfile.weaknesses?.length > 0 ? (
                                                    interview.interviewProfile.weaknesses.map((weakness, index) => (
                                                        <span key={index} className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 text-sm font-medium rounded-lg border border-yellow-200">
                                                            {weakness}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-500 text-sm">Excellent performance across all areas</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recommendations */}
                                    <div className="space-y-6">
                                        {/* Recommended Roles */}
                                        {interview.interviewProfile.recommendedRoles && (
                                            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                                <div className="flex items-center mb-4">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                                                        </svg>
                                                    </div>
                                                    <h4 className="text-lg font-semibold text-gray-800">Recommended Roles</h4>
                                                </div>
                                                <div className="flex flex-wrap gap-3">
                                                    {interview.interviewProfile.recommendedRoles.map((role, index) => (
                                                        <span key={index} className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-sm font-semibold rounded-xl border border-blue-200">
                                                            {role}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Tech Stack Fit */}
                                        {/* {interview.interviewProfile.techStackFit && (
                                            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                                <div className="flex items-center mb-4">
                                                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
                                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                                        </svg>
                                                    </div>
                                                    <h4 className="text-lg font-semibold text-gray-800">Tech Stack Compatibility</h4>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {interview.interviewProfile.techStackFit.map((tech, index) => (
                                                        <span key={index} className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 text-sm font-medium rounded-lg border border-purple-200">
                                                            {tech}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )} */}
                                    </div>
                                </div>
                            )}

                            {/* Questions Section */}
                            <div className="border-t border-gray-200 pt-8">
                                <InterviewQuestions questions={interview.questions} />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
                            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium">Interview ID:</span> {interview.interviewId?.substring(0, 8)}...
                                </div>
                                <button
                                    onClick={onClose}
                                    className="cursor-pointer px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                >
                                    Close Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}