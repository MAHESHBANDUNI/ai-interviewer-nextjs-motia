'use client'
import React from "react";
import { X, BarChart3, CheckCircle, AlertCircle, Target, TrendingUp, Clock, Users } from "lucide-react";

export default function PerformanceModal({ interview, isOpen, onClose, formatDate }) {
    if (!isOpen || !interview) return null;

    const profile = interview.interviewProfile;

    const getScoreColor = (score) => {
        if (score >= 8) return "text-green-600";
        if (score >= 6) return "text-yellow-600";
        return "text-red-600";
    };

    const getScoreBgColor = (score) => {
        if (score >= 8) return "bg-green-50";
        if (score >= 6) return "bg-yellow-50";
        return "bg-red-50";
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Backdrop */}
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
                    onClick={onClose}
                />

                {/* Modal */}
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Performance Report</h2>
                                <p className="text-gray-600">
                                    Interview with {interview.admin?.firstName} {interview.admin?.lastName} • {formatDate(interview.scheduledAt)}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Overall Score */}
                        {profile && (
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold text-gray-900">Overall Performance</h3>
                                    <div className={`px-4 py-2 rounded-xl ${getScoreBgColor(profile.performanceScore)}`}>
                                        <span className={`text-2xl font-bold ${getScoreColor(profile.performanceScore)}`}>
                                            {profile.performanceScore}/10
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Score breakdown */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                            <span className="font-medium text-gray-700">Accuracy</span>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {profile.analytics?.correctAnswers}/{profile.analytics?.totalQuestions}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {Math.round((profile.analytics?.correctAnswers / profile.analytics?.totalQuestions) * 100)}% correct
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="w-5 h-5 text-blue-600" />
                                            <span className="font-medium text-gray-700">Difficulty</span>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {profile.analytics?.averageDifficulty?.toFixed(1)}/5
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Average question level
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-5 h-5 text-purple-600" />
                                            <span className="font-medium text-gray-700">Speed</span>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {profile.analytics?.timePerQuestion}s
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Per question average
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp className="w-5 h-5 text-orange-600" />
                                            <span className="font-medium text-gray-700">Improvement</span>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            +2.1
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            From previous
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Strengths and Weaknesses */}
                        {profile && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                        <h3 className="text-lg font-semibold text-green-800">Strengths</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        {profile.strengths?.map((strength, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                                <span className="text-gray-700">{strength}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                        <h3 className="text-lg font-semibold text-red-800">Areas for Improvement</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        {profile.weaknesses?.map((weakness, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                                                <span className="text-gray-700">{weakness}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Tech Stack Fit */}
                        {profile?.techStackFit && profile.techStackFit.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tech Stack Compatibility</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.techStackFit.map((tech, index) => (
                                        <span 
                                            key={index} 
                                            className="px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-full"
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recommended Roles */}
                        {profile?.recommendedRoles && profile.recommendedRoles.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Roles</h3>
                                <div className="flex flex-wrap gap-3">
                                    {profile.recommendedRoles.map((role, index) => (
                                        <div 
                                            key={index} 
                                            className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                                        >
                                            <span className="font-medium text-gray-900">{role}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Questions and Answers */}
                        {interview.questions && interview.questions.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">Questions & Answers</h3>
                                <div className="space-y-6">
                                    {interview.questions.map((question, index) => (
                                        <div key={index} className="bg-gray-50 rounded-xl p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 mb-2">
                                                        Q{index + 1}: {question.content}
                                                    </h4>
                                                    <div className="flex items-center gap-4">
                                                        <span className={`px-3 py-1 rounded-full text-sm ${
                                                            question.difficultyLevel >= 4 ? 'bg-red-100 text-red-700' :
                                                            question.difficultyLevel >= 3 ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-green-100 text-green-700'
                                                        }`}>
                                                            Level {question.difficultyLevel}
                                                        </span>
                                                        {question.correct !== null && (
                                                            <span className={`px-3 py-1 rounded-full text-sm ${
                                                                question.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                                {question.correct ? 'Correct' : 'Needs Improvement'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {question.candidateAnswer && (
                                                <div className="mb-4">
                                                    <p className="text-sm font-medium text-gray-700 mb-2">Your Answer:</p>
                                                    <p className="text-gray-900 bg-white p-4 rounded-lg border border-gray-200">
                                                        {question.candidateAnswer}
                                                    </p>
                                                </div>
                                            )}
                                            
                                            {question.aiFeedback && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 mb-2">Feedback:</p>
                                                    <p className="text-gray-900 bg-white p-4 rounded-lg border border-gray-200">
                                                        {question.aiFeedback}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Report generated on {profile ? formatDate(profile.createdAt) : formatDate(interview.scheduledAt)}
                            </div>
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
                            >
                                Close Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}