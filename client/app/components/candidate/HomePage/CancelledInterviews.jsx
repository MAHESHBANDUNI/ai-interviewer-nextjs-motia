'use client'
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { XCircle, Calendar, Clock, Timer, AlertCircle, Users, ArrowLeft, RefreshCw, ChevronRight, Info, CalendarX } from "lucide-react";
import Pagination from "../other/Pagination";

export default function CancelledInterviewsPage() {
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/candidate/interviews/list?status=cancelled`, {
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
            console.error("Failed in fetching cancelled interviews.")
        }
        }
        catch(error){
            console.error("Failed in fetching cancelled interviews.",error)
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

    const getTimeSinceCancelled = (dateString) => {
        const now = new Date();
        const cancelledTime = new Date(dateString);
        const diffMs = now - cancelledTime;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return "Recently";
    };

    // Calculate stats
    const stats = React.useMemo(() => {
        const cancelledByAdmin = interviews.filter(i => i.cancelledBy === 'admin').length;
        const cancelledByCandidate = interviews.filter(i => i.cancelledBy === 'candidate').length;
        const cancelledBySystem = interviews.filter(i => i.cancelledBy === 'system').length;
        
        const totalQuestions = interviews.reduce((acc, i) => acc + (i.questions?.length || 0), 0);
        
        return {
            total: interviews.length,
            cancelledByAdmin,
            cancelledByCandidate,
            cancelledBySystem,
            totalQuestions,
            avgCancellationTime: interviews.length > 0 
                ? Math.round(interviews.reduce((acc, i) => {
                    const scheduled = new Date(i.scheduledAt);
                    const cancelled = new Date(i.cancelledAt);
                    return acc + ((scheduled - cancelled) / (1000 * 60 * 60 * 24));
                }, 0) / interviews.length)
                : 0
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
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                                Cancelled Interviews
                            </h1>
                            <p className="text-gray-600 text-lg">
                                Review cancelled interviews and rescheduling options
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4">
                                <div className="text-sm text-red-700 font-medium mb-1">Total Cancelled</div>
                                <div className="text-lg font-bold text-red-900">
                                    {stats.total}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-red-50 rounded-xl">
                                <XCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                                <div className="text-gray-600">Total Cancelled</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">{stats.cancelledByAdmin}</div>
                                <div className="text-gray-600">By Interviewer</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-green-50 rounded-xl">
                                <Users className="w-8 h-8 text-green-600" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">{stats.cancelledByCandidate}</div>
                                <div className="text-gray-600">By You</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-purple-50 rounded-xl">
                                <AlertCircle className="w-8 h-8 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">{stats.totalQuestions}</div>
                                <div className="text-gray-600">Questions Prepared</div>
                            </div>
                        </div>
                    </div>
                </div> */}

                {/* Interview List */}
                {interviews.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
                        <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-12 h-12 text-red-400" />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Cancelled Interviews</h3>
                        <p className="text-gray-600 max-w-md mx-auto mb-8">
                            Great! All your interviews have proceeded as scheduled.
                        </p>
                        <button 
                            onClick={() => router.push('/candidate/interviews/upcoming')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                            View Upcoming Interviews
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {currentInterviews.map((interview) => (
                                <div key={interview.interviewId} className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:border-blue-200 hover:shadow-xl transition-all duration-300">
                                    <div className="p-6">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                                    {/* {interview.admin?.firstName?.charAt(0)}{interview.admin?.lastName?.charAt(0)} */}
                                                    <CalendarX className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900">Technical Interview</h3>
                                                    <span className="text-gray-800 mr-1">Position:</span>
                                                    <span className="text-gray-800">{interview?.job?.jobPositionName}</span>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 bg-red-50 text-red-700 text-sm font-medium rounded-full">
                                                Cancelled
                                            </span>
                                        </div>

                                        {/* Details */}
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="text-sm">Original Date</span>
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
                                                    <XCircle className="w-4 h-4" />
                                                    <span className="text-sm">Cancelled On</span>
                                                </div>
                                                <p className="font-semibold text-gray-800">{formatDate(interview.cancelledAt)}</p>
                                            </div>
                                        </div>

                                        {/* Cancellation Reason */}
                                        {interview.cancellationReason && (
                                            <div className="bg-white rounded-xl p-0 mb-6 mt-2 border-2 border-gray-100 px-2 py-3">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                                    <h4 className="font-semibold text-red-800">Cancellation Reason</h4>
                                                </div>
                                                <p className="text-red-700">{interview.cancellationReason}</p>
                                            </div>
                                        )}

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

                {/* Information Section */}
                <div className="mt-12 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">About Cancelled Interviews</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Why interviews get cancelled</h4>
                            <ul className="space-y-3 text-gray-600">
                                <li className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                                    <span>Interviewer or candidate emergencies</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                                    <span>Technical issues with video platforms</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                                    <span>Scheduling conflicts</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                                    <span>Role requirements change</span>
                                </li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">What to do next</h4>
                            <ul className="space-y-3 text-gray-600">
                                <li className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                    <span>Check your email for rescheduling options</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                    <span>Contact your recruiter for updates</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                    <span>Keep preparing for the interview topics</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                    <span>Monitor your dashboard for new schedules</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}