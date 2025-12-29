'use client'
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BarChart3, CheckCircle, TrendingUp, Calendar, Timer, Users, Eye, ChevronRight, ArrowLeft, Award, Target, Clock, CalendarCheckIcon } from "lucide-react";
import PerformanceModal from "./PerformanceModal";
import Pagination from "../other/Pagination";

export default function CompletedInterviewsPage() {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInterview, setSelectedInterview] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(8);
    const { data: session } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (!session?.user?.token) return;
        fetchInterviews();
    }, [session?.user?.token]);

    const fetchInterviews = async() => {
        if (!session?.user?.token) return;
        try{
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/candidate/interviews/list?status=completed`, {
            method: 'GET',
            headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`}
        });
        if(res.ok){
        const data = await res.json();
        const interviews = data.interviews || [];
        const sortByDate = (a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt);
        setInterviews(
          interviews
            .sort(sortByDate)
        );
        console.log('II',interviews);
        setLoading(false);
        }
        if(!res.ok){
            console.error("Failed in fetching completed interviews.")
        }
        }
        catch(error){
            console.error("Failed in fetching completed interviews.",error)
        }
    }

    const formatDate = (dateString) => {
        const options = { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getDuration = (minutes) => {
        if (minutes < 60) return `${minutes} mins`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    const getScoreColor = (score) => {
        if (score >= 8) return "text-green-600 bg-green-50 border-green-200";
        if (score >= 6) return "text-yellow-600 bg-yellow-50 border-yellow-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    const openPerformanceModal = (interview) => {
        setSelectedInterview(interview);
        setIsModalOpen(true);
    };

    const closePerformanceModal = () => {
        setSelectedInterview(null);
        setIsModalOpen(false);
    };

    // Calculate stats
    const stats = React.useMemo(() => {
        const scores = interviews
            .filter(i => i.interviewProfile?.performanceScore)
            .map(i => Number(i.interviewProfile.performanceScore));

        const averageScore =
            scores.length > 0
                ? Number(
                    (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
                  )
                : 0;

        const totalQuestions = interviews.reduce(
            (acc, i) =>
                acc + Number(i.interviewProfile?.analytics?.totalQuestions || 0),
            0
        );

        const correctAnswers = interviews.reduce(
            (acc, i) =>
                acc + Number(i.interviewProfile?.analytics?.correctAnswers || 0),
            0
        );

        return {
            averageScore,
            totalQuestions,
            correctAnswers,
            accuracy:
                totalQuestions > 0
                    ? Math.round((correctAnswers / totalQuestions) * 100)
                    : 0,
            totalInterviews: interviews.length,
        };
    }, [interviews]);

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentInterviews = interviews.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(interviews.length / itemsPerPage);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-xl p-6">
                                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/candidate/interviews')}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 cursor-pointer"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </button>
                    
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                                Completed Interviews
                            </h1>
                            <p className="text-gray-600 text-lg">
                                Review your performance and analytics
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
                                <div className="text-sm text-green-700 font-medium mb-1">Overall Performance</div>
                                <div className="text-lg font-bold text-green-900">
                                    {stats.averageScore}/100
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-6 border border-amber-100">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-amber-100 rounded-xl">
                                <BarChart3 className="w-8 h-8 text-amber-600" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">{stats.averageScore}</div>
                                <div className="text-gray-600">Avg. Score</div>
                            </div>
                        </div>
                        <div className="text-sm text-amber-700">
                            Out of {interviews.length} interviews
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 border border-blue-100">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Target className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">{stats.accuracy}%</div>
                                <div className="text-gray-600">Accuracy</div>
                            </div>
                        </div>
                        <div className="text-sm text-blue-700">
                            {stats.correctAnswers}/{stats.totalQuestions} correct answers
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 border border-purple-100">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <Award className="w-8 h-8 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">{stats.totalInterviews}</div>
                                <div className="text-gray-600">Interviews</div>
                            </div>
                        </div>
                        <div className="text-sm text-purple-700">
                            Successfully completed
                        </div>
                    </div>
                    
                    {/* <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-100">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-amber-100 rounded-xl">
                                <TrendingUp className="w-8 h-8 text-amber-600" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">+12%</div>
                                <div className="text-gray-600">Improvement</div>
                            </div>
                        </div>
                        <div className="text-sm text-amber-700">
                            Since last month
                        </div>
                    </div> */}
                </div>

                {/* Interview List */}
                {interviews.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
                        <div className="w-24 h-24 bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-400" />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Completed Interviews</h3>
                        <p className="text-gray-600 max-w-md mx-auto mb-8">
                            Your completed interviews will appear here with detailed performance analytics.
                        </p>
                        <button 
                            onClick={() => router.push('/candidate/interviews/upcoming')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                        >
                            View Upcoming Interviews
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {currentInterviews.map((interview) => (
                                <div key={interview.interviewId} className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:border-green-300 hover:shadow-xl transition-all duration-300">
                                    <div className="p-6">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                                    {/* {interview.admin?.firstName?.charAt(0)}{interview.admin?.lastName?.charAt(0)} */}
                                                    <CalendarCheckIcon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900">Technical Interview</h3>
                                                    <p className="text-gray-600">With {interview.admin?.firstName} {interview.admin?.lastName}</p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full">
                                                Completed
                                            </span>
                                        </div>

                                        {/* Performance Metrics */}
                                        {interview.interviewProfile && (
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <BarChart3 className="w-4 h-4" />
                                                        <span className="text-sm">Score</span>
                                                    </div>
                                                    <p className={`font-semibold ${getScoreColor(interview.interviewProfile.performanceScore)} px-3 py-1 rounded-lg inline-block`}>
                                                        {interview.interviewProfile.performanceScore}/10
                                                    </p>
                                                </div>
                                                
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span className="text-sm">Accuracy</span>
                                                    </div>
                                                    <p className="font-semibold text-gray-900">
                                                        {interview.interviewProfile.analytics?.correctAnswers}/{interview.interviewProfile.analytics?.totalQuestions} correct
                                                    </p>
                                                </div>
                                                
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Calendar className="w-4 h-4" />
                                                        <span className="text-sm">Date</span>
                                                    </div>
                                                    <p className="font-semibold text-gray-900">{formatDate(interview.scheduledAt)}</p>
                                                </div>
                                                
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Timer className="w-4 h-4" />
                                                        <span className="text-sm">Duration</span>
                                                    </div>
                                                    <p className="font-semibold text-gray-900">{getDuration(interview.durationMin)}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Strengths */}
                                        {interview.interviewProfile?.strengths && interview.interviewProfile.strengths.length > 0 && (
                                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Award className="w-5 h-5 text-green-600" />
                                                    <h4 className="font-semibold text-green-800">Key Strengths</h4>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {interview.interviewProfile.strengths.slice(0, 3).map((strength, idx) => (
                                                        <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                                                            {strength}
                                                        </span>
                                                    ))}
                                                    {interview.interviewProfile.strengths.length > 3 && (
                                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                                                            +{interview.interviewProfile.strengths.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Button */}
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-600">
                                                Completed on {formatDate(interview.scheduledAt)}
                                            </div>
                                            
                                            <button
                                                onClick={() => openPerformanceModal(interview)}
                                                className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-200 cursor-pointer"
                                            >
                                                <Eye className="w-5 h-5" />
                                                <span>View Full Report</span>
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={interviews.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}

                {/* Improvement Tips */}
                <div className="mt-12 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Performance Improvement Areas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white/80 rounded-xl p-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <Target className="w-6 h-6 text-blue-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">System Design</h4>
                            <p className="text-gray-600 text-sm">Practice designing scalable architectures and distributed systems</p>
                        </div>
                        
                        <div className="bg-white/80 rounded-xl p-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Time Management</h4>
                            <p className="text-gray-600 text-sm">Work on explaining solutions clearly within time constraints</p>
                        </div>
                        
                        <div className="bg-white/80 rounded-xl p-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Communication</h4>
                            <p className="text-gray-600 text-sm">Practice explaining complex technical concepts simply</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Modal */}
            <PerformanceModal 
                interview={selectedInterview} 
                isOpen={isModalOpen} 
                onClose={closePerformanceModal} 
                formatDate={formatDate}
            />
        </div>
    );
}