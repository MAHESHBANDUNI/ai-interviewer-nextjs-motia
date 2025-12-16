'use client'
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import PerformanceModal from "./PerformanceModal";
import { useRouter } from "next/navigation";
import { Eye, Calendar, Timer, Clock, Scale, Check } from "lucide-react";

export default function HomePage() {
    const [upcomingInterviews, setUpcomingInterviews] = useState([]);
    const [pastInterviews, setPastInterviews] = useState([]);
    const [cancelledInterviews, setCancelledInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("upcoming");
    const [selectedInterview, setSelectedInterview] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data: session } = useSession();
    const router = useRouter();
    const today = new Date();

    useEffect(() => {
      if (!session?.user?.token) return;

      fetchCandidateInterviewsList();
    }, [session?.user?.token]);

    const mockInterviewData = {
    upcoming: [
        {
            interviewId: "1",
            candidateId: "candidate-1",
            adminId: "admin-1",
            scheduledAt: "2024-12-20T14:30:00Z",
            durationMin: 60,
            meetingLink: "https://meet.google.com/abc-def-ghi",
            status: "PENDING",
            createdAt: "2024-12-15T10:00:00Z",
            admin: {
                firstName: "Sarah",
                lastName: "Johnson",
                email: "sarah.johnson@techvista.com"
            },
            questions: [
                {
                    interviewQuestionId: "q1",
                    interviewId: "1",
                    content: "Explain the difference between let, const, and var in JavaScript",
                    difficultyLevel: 2,
                    askedAt: "2024-12-15T10:00:00Z",
                    candidateAnswer: null,
                    aiFeedback: null,
                    correct: null
                },
                {
                    interviewQuestionId: "q2",
                    interviewId: "1",
                    content: "How would you optimize a React application that's experiencing slow rendering?",
                    difficultyLevel: 4,
                    askedAt: "2024-12-15T10:00:00Z",
                    candidateAnswer: null,
                    aiFeedback: null,
                    correct: null
                }
            ],
            interviewProfile: null
        },
        {
            interviewId: "2",
            candidateId: "candidate-1",
            adminId: "admin-2",
            scheduledAt: "2024-12-22T11:00:00Z",
            durationMin: 90,
            meetingLink: "https://teams.microsoft.com/l/meetup-join/xyz",
            status: "PENDING",
            createdAt: "2024-12-16T09:30:00Z",
            admin: {
                firstName: "Mike",
                lastName: "Chen",
                email: "mike.chen@innotech.com"
            },
            questions: [
                {
                    interviewQuestionId: "q3",
                    interviewId: "2",
                    content: "Design a database schema for an e-commerce platform",
                    difficultyLevel: 5,
                    askedAt: "2024-12-16T09:30:00Z",
                    candidateAnswer: null,
                    aiFeedback: null,
                    correct: null
                }
            ],
            interviewProfile: null
        }
    ],
    past: [
        {
            interviewId: "3",
            candidateId: "candidate-1",
            adminId: "admin-3",
            scheduledAt: "2024-12-10T15:00:00Z",
            durationMin: 45,
            meetingLink: null,
            status: "COMPLETED",
            createdAt: "2024-12-05T14:20:00Z",
            admin: {
                firstName: "David",
                lastName: "Kim",
                email: "david.kim@webcraft.com"
            },
            questions: [
                {
                    interviewQuestionId: "q4",
                    interviewId: "3",
                    content: "Reverse a linked list in-place",
                    difficultyLevel: 3,
                    askedAt: "2024-12-10T15:00:00Z",
                    candidateAnswer: "I would use two pointers to traverse the list and reverse the links between nodes",
                    aiFeedback: "Good approach. You correctly identified the two-pointer technique. Consider mentioning time complexity (O(n)) and space complexity (O(1)) for completeness.",
                    correct: true
                },
                {
                    interviewQuestionId: "q5",
                    interviewId: "3",
                    content: "Explain the concept of promises in JavaScript",
                    difficultyLevel: 2,
                    askedAt: "2024-12-10T15:05:00Z",
                    candidateAnswer: "Promises represent eventual completion of asynchronous operations with states like pending, fulfilled, and rejected",
                    aiFeedback: "Accurate definition. Good understanding of promise states. You could mention .then() and .catch() methods for handling results.",
                    correct: true
                }
            ],
            interviewProfile: {
                interviewProfileId: "profile-1",
                candidateId: "candidate-1",
                interviewId: "3",
                performanceScore: 8.5,
                techStackFit: ["React", "Node.js", "PostgreSQL"],
                recommendedRoles: ["Senior Frontend Developer", "Full Stack Developer"],
                strengths: ["Problem-solving skills", "JavaScript knowledge", "Communication"],
                weaknesses: ["System design depth", "Database optimization"],
                analytics: {
                    totalQuestions: 5,
                    correctAnswers: 4,
                    averageDifficulty: 3.2,
                    timePerQuestion: 8.5
                },
                createdAt: "2024-12-10T16:30:00Z"
            }
        },
        {
            interviewId: "4",
            candidateId: "candidate-1",
            adminId: "admin-4",
            scheduledAt: "2024-12-08T10:30:00Z",
            durationMin: 30,
            meetingLink: null,
            status: "COMPLETED",
            createdAt: "2024-12-01T11:15:00Z",
            admin: {
                firstName: "Lisa",
                lastName: "Wang",
                email: "lisa.wang@techvista.com"
            },
            questions: [
                {
                    interviewQuestionId: "q6",
                    interviewId: "4",
                    content: "What motivates you to work in tech?",
                    difficultyLevel: 1,
                    askedAt: "2024-12-08T10:30:00Z",
                    candidateAnswer: "I'm passionate about solving real-world problems through technology and continuous learning",
                    aiFeedback: "Authentic and well-articulated response. Shows genuine interest in the field.",
                    correct: true
                },
                {
                    interviewQuestionId: "q7",
                    interviewId: "4",
                    content: "Describe your experience working in a team environment",
                    difficultyLevel: 2,
                    askedAt: "2024-12-08T10:35:00Z",
                    candidateAnswer: "I've collaborated with cross-functional teams using Agile methodology and participated in code reviews",
                    aiFeedback: "Good examples of teamwork. Consider mentioning specific collaboration tools you've used.",
                    correct: true
                }
            ],
            interviewProfile: {
                interviewProfileId: "profile-2",
                candidateId: "candidate-1",
                interviewId: "4",
                performanceScore: 9.0,
                techStackFit: ["Communication", "Teamwork", "Adaptability"],
                recommendedRoles: ["Team Lead", "Senior Developer"],
                strengths: ["Communication skills", "Cultural fit", "Professional attitude"],
                weaknesses: [],
                analytics: {
                    totalQuestions: 3,
                    correctAnswers: 3,
                    averageDifficulty: 1.5,
                    timePerQuestion: 6.2
                },
                createdAt: "2024-12-08T11:15:00Z"
            }
        }
    ],
    cancelled: [
        {
            interviewId: "5",
            candidateId: "candidate-1",
            adminId: "admin-5",
            scheduledAt: "2024-11-25T13:00:00Z",
            durationMin: 60,
            meetingLink: null,
            status: "CANCELLED",
            createdAt: "2024-11-20T16:45:00Z",
            admin: {
                firstName: "Alex",
                lastName: "Rodriguez",
                email: "alex.rodriguez@startupco.com"
            },
            questions: [],
            interviewProfile: null,
            cancelledAt: "2024-11-22T10:30:00Z",
            cancellationReason: "Interviewer unavailable due to emergency"
        },
        {
            interviewId: "6",
            candidateId: "candidate-1",
            adminId: "admin-6",
            scheduledAt: "2024-11-18T09:00:00Z",
            durationMin: 45,
            meetingLink: "https://meet.google.com/cancelled-meeting",
            status: "CANCELLED",
            createdAt: "2024-11-15T14:20:00Z",
            admin: {
                firstName: "Maria",
                lastName: "Garcia",
                email: "maria.garcia@techsolutions.com"
            },
            questions: [
                {
                    interviewQuestionId: "q8",
                    interviewId: "6",
                    content: "Explain REST API principles",
                    difficultyLevel: 2,
                    askedAt: null,
                    candidateAnswer: null,
                    aiFeedback: null,
                    correct: null
                }
            ],
            interviewProfile: null,
            cancelledAt: "2024-11-17T15:45:00Z",
            cancellationReason: "Rescheduled by candidate request"
        }
    ]
};
    // Modal handler functions
    const openPerformanceModal = (interview) => {
        setSelectedInterview(interview);
        setIsModalOpen(true);
    };

    const closePerformanceModal = () => {
        setSelectedInterview(null);
        setIsModalOpen(false);
    };

    const fetchCandidateInterviewsList = async () => {
        if(!session?.user?.id) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/candidate/interviews/list`, {
                method: 'GET',
                headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`}
            });

            if (res.ok) {
                const data = await res.json();
                const interviews = data.interviews || [];
                
                const sortByDate = (a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt);

                setUpcomingInterviews(
                  interviews
                    .filter(interview =>
                      interview.status === "PENDING" ||
                      interview.status === "RESCHEDULED"
                    )
                    .sort(sortByDate)
                );

                setPastInterviews(
                  interviews
                    .filter(interview => interview.status === "COMPLETED")
                    .sort(sortByDate)
                );

                setCancelledInterviews(
                  interviews
                    .filter(interview => interview.status === "CANCELLED")
                    .sort(sortByDate)
                );

                } else {
                    console.error('Failed to fetch interviews');
                    // Fallback to mock data
                    setUpcomingInterviews(mockInterviewData.upcoming);
                    setPastInterviews(mockInterviewData.past);
                    setCancelledInterviews(mockInterviewData.cancelled);
                }
        } catch (error) {
            console.error('Error fetching interviews:', error);
            // Fallback to mock data
            setUpcomingInterviews(mockInterviewData.upcoming);
            setPastInterviews(mockInterviewData.past);
            setCancelledInterviews(mockInterviewData.cancelled);
        } finally {
            setLoading(false);
        }
    };

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

    const getStatusConfig = (status) => {
        const config = {
            PENDING: { 
                label: "Scheduled", 
                color: "bg-blue-50 text-blue-700 border-blue-200",
                badgeColor: "bg-blue-100 text-blue-800"
            },
            COMPLETED: { 
                label: "Completed", 
                color: "bg-green-50 text-green-700 border-green-200",
                badgeColor: "bg-green-100 text-green-800"
            },
            CANCELLED: { 
                label: "Cancelled", 
                color: "bg-red-50 text-red-700 border-red-200",
                badgeColor: "bg-red-100 text-red-800"
            }
        };
        return config[status] || config.PENDING;
    };

    const StatusBadge = ({ status }) => {
        const config = getStatusConfig(status);
        return (
            <span className={`px-3 py-2 text-sm font-semibold border rounded-lg ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const PerformanceScore = ({ score }) => {
        if (!score) return null;
        
        const getScoreColor = (score) => {
            if (score >= 8) return "text-green-600 bg-green-50 border-green-200";
            if (score >= 6) return "text-yellow-600 bg-yellow-50 border-yellow-200";
            return "text-red-600 bg-red-50 border-red-200";
        };

        return (
            <div className={`px-3 py-2 rounded-lg border ${getScoreColor(score)} text-sm font-semibold`}>
                Score: {score}/100
            </div>
        );
    };

    const handleJoinMeeting =(interviewId) =>{
      router.push(`/candidate/interview/${interviewId}`);
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {[1, 2, 3].map(item => (
                                <div key={item} className="bg-white rounded-lg shadow p-6">
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                            {[1, 2].map(item => (
                                <div key={item} className="pt-4 mt-4">
                                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:justify-between w-full lg:content-center lg:items-center">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Interviews
                    </h1>
                    <p className="text-gray-600">
                        Manage your interview schedule and review past performances
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-8 w-full h-full lg:max-w-md">
                    <div className="flex">
                        {[
                            { key: "upcoming", label: "Upcoming", count: upcomingInterviews.length },
                            { key: "past", label: "Past", count: pastInterviews.length },
                            { key: "cancelled", label: "Cancelled", count: cancelledInterviews.length }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                                    activeTab === tab.key
                                        ? "bg-blue-600 text-white shadow"
                                        : "text-gray-800 hover:text-blue-700"
                                }`}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>
                </div>
            </div>

                {/* Interview Content */}
                <div>
                    {activeTab === "upcoming" && (
                        <div className="space-y-4">
                            {upcomingInterviews.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Interviews</h3>
                                    <p className="text-gray-600 max-w-sm mx-auto">
                                        You don't have any scheduled interviews. New interviews will appear here once scheduled.
                                    </p>
                                </div>
                            ) : (
                                upcomingInterviews.map((interview) => (
                                    <div key={interview.interviewId} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                        <div className="p-6">
                                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                                Technical Interview
                                                            </h3>
                                                            <p className="text-gray-700 font-medium">
                                                                With {interview.admin?.firstName} {interview.admin?.lastName}
                                                            </p>
                                                        </div>
                                                        <StatusBadge status={interview.status} />
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 text-sm text-gray-600">
                                                        <div className="flex items-center">
                                                            <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                                                            <p className="text-gray-500 font-semibold mr-1">Date:</p>
                                                            {formatDate(interview.scheduledAt)}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Clock className="w-4 h-4 text-gray-500 mr-2" />
                                                            <p className="text-gray-500 font-semibold mr-1">Timing:</p>
                                                            {formatTime(interview.scheduledAt)} 
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Timer className="w-4 h-4 text-gray-500 mr-2" />                             
                                                              <p className="text-gray-500 font-semibold mr-1">Duration:</p> 
                                                              {getDuration(interview.durationMin)}
                                                            </div>
                                                        <div className="flex items-center">
                                                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                                                            </svg>
                                                            <p className="text-gray-500 font-semibold mr-1">Mode:</p>
                                                            Video Call
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {(() => {
                                                    const now = new Date();
                                                    const interviewTime = new Date(interview.scheduledAt);
                                                                                                    
                                                    const diffInMinutes = (interviewTime - now) / 1000 / 60;
                                                                                                    
                                                    // Allow between 0 minutes (start time) and +60 minutes after
                                                    const canStart = diffInMinutes <= 0 && diffInMinutes >= -60;
                                               
                                                    return (
                                                        canStart && (
                                                            <div className="lg:ml-6 mt-4 lg:mt-0">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedInterview(interview);
                                                                        handleJoinMeeting(interview.interviewId);
                                                                    }}
                                                                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                                                >
                                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                                        />
                                                                    </svg>
                                                                    Start Interview
                                                                </button>
                                                            </div>
                                                        )
                                                    );
                                                })()}
                                            </div>

                                            {/* Interview Preparation Instructions */}
                                            {interview && (
                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                    <h4 className="text-sm font-medium text-gray-600 mb-3">Interview Preparation Instructions: </h4>
                                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                                        <div className="flex items-start">
                                                            <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <div>
                                                                <p className="text-sm font-medium text-blue-800 mb-2">
                                                                    This interview is scheduled to assess your skills and experience, so please:
                                                                </p>
                                                                <ul className="text-sm text-blue-700 space-y-1">
                                                                    <li>• Review your field-specific knowledge and recent work experiences</li>
                                                                    <li>• Prepare examples that demonstrate your skills and achievements</li>
                                                                    <li>• Be ready to discuss your career goals and interests</li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === "past" && (
                        <div className="space-y-4">
                            {pastInterviews.length === 0 ? (
                               <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Past Interviews</h3>
                                    <p className="text-gray-600 max-w-sm mx-auto">
                                        Your completed interview records will appear here for future reference.
                                    </p>
                                </div>
                            ) : (
                                pastInterviews.map((interview) => (
                                    <div key={interview.interviewId} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                        <div className="p-6">
                                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                                Technical Interview
                                                            </h3>
                                                            <p className="text-gray-700 font-medium">
                                                                With {interview.admin?.firstName} {interview.admin?.lastName}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <StatusBadge status={interview.status} />
                                                            {/* {interview.interviewProfile?.performanceScore && (
                                                                <PerformanceScore score={interview.interviewProfile.performanceScore} />
                                                            )} */}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 text-sm text-gray-600">
                                                        <div className="flex items-center">
                                                            <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                                                            <p className="text-gray-500 font-semibold mr-1">Date:</p>
                                                            {formatDate(interview.scheduledAt)}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Clock className="w-4 h-4 text-gray-500 mr-2" />
                                                            <p className="text-gray-500 font-semibold mr-1">Timing:</p>
                                                            {formatTime(interview.scheduledAt)} 
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Timer className="w-4 h-4 text-gray-500 mr-2" />
                                                              <p className="text-gray-500 font-semibold mr-1">Duration:</p> 
                                                              {getDuration(interview.durationMin)}
                                                            </div>
                                                        {/* <div className="flex items-center">
                                                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                                                            </svg>
                                                            <p className="text-gray-500 font-semibold mr-1">Mode:</p>
                                                            Video Call
                                                        </div> */}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Performance Preview with View Details Button */}
                                            {interview.interviewProfile && (
                                                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                                                                Performance Summary
                                                            </h4>
                                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                                <span className="inline-flex items-center">
                                                                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                                    </svg>
                                                                    Score: 
                                                                    <strong className="text-gray-900 ml-1">{interview.interviewProfile.performanceScore}/100</strong>
                                                                </span>
                                                                <span className="inline-flex items-center">< Check className="w-4 h-4 text-gray-500 mr-2"/>Correct: <strong className="text-gray-900 ml-1">{interview.interviewProfile.analytics?.correctAnswers}/{interview.interviewProfile.analytics?.totalQuestions}</strong></span>
                                                                <span className="inline-flex items-center">< Scale className="w-4 h-4 text-gray-500 mr-2"/>Avg Difficulty: <strong className="text-gray-900 ml-1">{interview.interviewProfile.analytics?.averageDifficulty?.toFixed(1)}</strong></span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => openPerformanceModal(interview)}
                                                            className="cursor-pointer inline-flex gap-3 items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                                        >
                                                            <Eye className="w-5 h-5 " />
                                                            View Full Details
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === "cancelled" && (
                        <div className="space-y-4">
                            {cancelledInterviews.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Cancelled Interviews</h3>
                                    <p className="text-gray-600 max-w-sm mx-auto">
                                        You don't have any cancelled interviews in your history.
                                    </p>
                                </div>
                            ) : (
                                cancelledInterviews.map((interview) => (
                                    <div key={interview.interviewId} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                        <div className="p-6">
                                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                                Technical Interview
                                                            </h3>
                                                            <p className="text-gray-700 font-medium">
                                                                With {interview.admin?.firstName} {interview.admin?.lastName}
                                                            </p>
                                                        </div>
                                                        <StatusBadge status={interview.status} />
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 text-sm text-gray-600">
                                                        <div className="flex items-center">
                                                            <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                                                            <p className="text-gray-500 font-semibold mr-1">Date:</p>
                                                            {formatDate(interview.scheduledAt)}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Clock className="w-4 h-4 text-gray-500 mr-2" />
                                                            <p className="text-gray-500 font-semibold mr-1">Timing:</p>
                                                            {formatTime(interview.scheduledAt)} 
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Timer className="w-4 h-4 text-gray-500 mr-2" />

                                                              <p className="text-gray-500 font-semibold mr-1">Duration:</p> 
                                                              {getDuration(interview.durationMin)}
                                                            </div>
                                                        {interview.cancelledAt && (
                                                            <div className="flex items-center">
                                                                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <p className="text-gray-500 font-semibold mr-1">Cancelled on:</p>
                                                                {formatDate(interview.cancelledAt)}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Cancellation Reason */}
                                                    {interview.cancellationReason && (
                                                        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                                                            <div className="flex items-start">
                                                                <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                </svg>
                                                                <div>
                                                                    <p className="text-sm font-medium text-red-800">Cancellation Reason</p>
                                                                    <p className="text-sm text-red-700 mt-1">{interview.cancellationReason}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Interview Questions Preview (if any were prepared) */}
                                            {interview.questions && interview.questions.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Prepared Questions: {interview.questions.length}</h4>
                                                    <p className="text-sm text-gray-600">
                                                        This interview was cancelled but had {interview.questions.length} question{interview.questions.length === 1 ? '' : 's'} prepared.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

             <PerformanceModal 
                interview={selectedInterview} 
                isOpen={isModalOpen} 
                onClose={closePerformanceModal} 
                formatDate={formatDate}
            />
        </div>
    );
}