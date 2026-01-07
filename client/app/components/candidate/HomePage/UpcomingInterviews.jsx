'use client'
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Calendar, Timer, Clock, Video, Users, Play, ChevronRight, AlertCircle, Zap, ArrowLeft, CalendarClock, User2 } from "lucide-react";
import Pagination from "../other/Pagination";

export default function UpcomingInterviewsPage() {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/candidate/interviews/list?status=upcoming`, {
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
        setLoading(false);
        }
        if(!res.ok){
            console.error("Failed in fetching upcoming interviews.")
        }
        }
        catch(error){
            console.error("Failed in fetching upcoming interviews.",error)
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

    const getTimeUntil = (dateString) => {
        const now = new Date();
        const interviewTime = new Date(dateString);
        const diffMs = interviewTime - now;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (diffDays > 0) return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
        if (diffHours > 0) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
        if (diffMs > 0) return "Starting soon";
        return "Started";
    };

    const handleJoinMeeting = (interviewId) => {
        router.push(`/candidate/interview/${interviewId}`);
    };

    // Calculate paginated data
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
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                                Upcoming Interviews
                            </h1>
                            <p className="text-gray-600 text-lg">
                                {interviews.length} interview{interviews.length !== 1 ? 's' : ''} scheduled
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                                <div className="text-sm text-blue-700 font-medium mb-1">Next Interview</div>
                                <div className="text-lg font-bold text-blue-900">
                                    {interviews.length > 0 ? formatDate(interviews[0].scheduledAt) : 'No interviews'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Interview List */}
                {interviews.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar className="w-12 h-12 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Upcoming Interviews</h3>
                        <p className="text-gray-600 max-w-md mx-auto mb-8">
                            You don't have any interviews scheduled at the moment. Check back later or contact your recruiter.
                        </p>
                        <button 
                            onClick={() => router.push('/candidate/dashboard')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                            Go to Dashboard
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {currentInterviews.map((interview) => {
                                const now = new Date();
                                const interviewTime = new Date(interview.scheduledAt);
                                const diffInMinutes = (interviewTime - now) / 1000 / 60;
                                const canStart = diffInMinutes <= 0 && diffInMinutes >= -60;
                                
                                return (
                                    <div key={interview.interviewId} className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
                                        <div className="p-6">
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                                        <CalendarClock className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900">Technical Interview</h3>
                                                        <span className="text-gray-800 mr-1">Position:</span>
                                                        <span className="text-gray-800">{interview?.job?.jobPositionName}</span>
                                                    </div>
                                                </div>
                                                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                                                    Scheduled
                                                </span>
                                            </div>

                                            {/* Details */}
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Calendar className="w-4 h-4" />
                                                        <span className="text-sm">Date</span>
                                                    </div>
                                                    <p className="font-semibold text-gray-800">{formatDate(interview.scheduledAt)}</p>
                                                </div>
                                                
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Clock className="w-4 h-4" />
                                                        <span className="text-sm">Time</span>
                                                    </div>
                                                    <p className="font-semibold text-gray-800">{formatTime(interview.scheduledAt)}</p>
                                                </div>
                                                
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Timer className="w-4 h-4" />
                                                        <span className="text-sm">Duration</span>
                                                    </div>
                                                    <p className="font-semibold text-gray-800">{getDuration(interview.durationMin)}</p>
                                                </div>
                                                
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <AlertCircle className="w-4 h-4" />
                                                        <span className="text-sm">Starts</span>
                                                    </div>
                                                    <p className="font-semibold text-gray-800">{getTimeUntil(interview.scheduledAt)}</p>
                                                </div>
                                            </div>

                                            {/* Preparation */}
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Zap className="w-5 h-5 text-blue-600" />
                                                    <h4 className="font-semibold text-blue-800">Preparation Required</h4>
                                                </div>
                                                <ul className="space-y-2 text-sm text-blue-700">
                                                    <li className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                                        Review technical concepts and fundamentals
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                                        Prepare questions about the company
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                                        Test your video and audio setup
                                                    </li>
                                                </ul>
                                            </div>

                                            {/* Action Button */}
                                            <div className="flex items-center justify-between">                           
                                                {canStart ? (
                                                    <button
                                                        onClick={() => handleJoinMeeting(interview.interviewId)}
                                                        className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-200 cursor-pointer"
                                                    >
                                                        <Play className="w-5 h-5" />
                                                        <span>Join Interview Now</span>
                                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                    </button>
                                                ) : (
                                                    <div className="text-sm text-gray-500">
                                                        Join button will activate at scheduled time
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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

                {/* Quick Tips */}
                <div className="mt-12 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Interview Preparation Checklist</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white/80 rounded-xl p-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <span className="text-blue-600 font-bold">1</span>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Research</h4>
                            <p className="text-gray-600 text-sm">Study the company and role requirements</p>
                        </div>
                        
                        <div className="bg-white/80 rounded-xl p-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <span className="text-blue-600 font-bold">2</span>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Practice</h4>
                            <p className="text-gray-600 text-sm">Rehearse common questions and scenarios</p>
                        </div>
                        
                        <div className="bg-white/80 rounded-xl p-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <span className="text-blue-600 font-bold">3</span>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Setup</h4>
                            <p className="text-gray-600 text-sm">Test your equipment and internet connection</p>
                        </div>
                        
                        <div className="bg-white/80 rounded-xl p-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <span className="text-blue-600 font-bold">4</span>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Review</h4>
                            <p className="text-gray-600 text-sm">Go through your portfolio and experience</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}