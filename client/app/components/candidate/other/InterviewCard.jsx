'use client'
import React from "react";
import { 
    Calendar,
    Clock,
    Timer,
    Users,
    Video,
    AlertCircle,
    Zap,
    CheckCircle,
    XCircle,
    ChevronRight,
    Play,
    Eye,
    BarChart3,
    Target,
    Award,
    MessageSquare,
    ExternalLink
} from "lucide-react";
import { useRouter } from "next/navigation";

const InterviewCard = ({ 
    interview, 
    type = "upcoming",
    onViewDetails,
    onJoinMeeting,
    onReschedule,
    showActions = true
}) => {
    const router = useRouter();

    // Helper functions
    const formatDate = (dateString) => {
        if (!dateString) return "Date not set";
        const options = { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const formatTime = (dateString) => {
        if (!dateString) return "Time not set";
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getDuration = (minutes) => {
        if (!minutes) return "Duration not set";
        if (minutes < 60) return `${minutes} mins`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    const getTimeUntil = (dateString) => {
        if (!dateString) return "N/A";
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

    const getScoreColor = (score) => {
        if (score >= 8) return "bg-green-50 text-green-700 border-green-200";
        if (score >= 6) return "bg-yellow-50 text-yellow-700 border-yellow-200";
        return "bg-red-50 text-red-700 border-red-200";
    };

    const getStatusConfig = (status) => {
        const config = {
            PENDING: {
                label: "Scheduled",
                color: "bg-blue-50 text-blue-700 border-blue-200",
                icon: Clock,
                iconColor: "text-blue-500"
            },
            COMPLETED: {
                label: "Completed",
                color: "bg-green-50 text-green-700 border-green-200",
                icon: CheckCircle,
                iconColor: "text-green-500"
            },
            CANCELLED: {
                label: "Cancelled",
                color: "bg-red-50 text-red-700 border-red-200",
                icon: XCircle,
                iconColor: "text-red-500"
            },
            RESCHEDULED: {
                label: "Rescheduled",
                color: "bg-purple-50 text-purple-700 border-purple-200",
                icon: Calendar,
                iconColor: "text-purple-500"
            }
        };
        return config[status] || config.PENDING;
    };

    // Handler functions
    const handleViewDetails = () => {
        if (onViewDetails) {
            onViewDetails(interview);
        }
    };

    const handleJoinMeeting = () => {
        if (onJoinMeeting) {
            onJoinMeeting(interview.interviewId);
        } else {
            router.push(`/candidate/interview/${interview.interviewId}`);
        }
    };

    const handleReschedule = () => {
        if (onReschedule) {
            onReschedule(interview);
        }
    };

    // Render different card types
    const renderUpcomingCard = () => {
        const now = new Date();
        const interviewTime = new Date(interview.scheduledAt);
        const diffInMinutes = (interviewTime - now) / 1000 / 60;
        const canStart = diffInMinutes <= 0 && diffInMinutes >= -60;
        const statusConfig = getStatusConfig(interview.status);

        return (
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-100 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                {interview.admin?.firstName?.charAt(0)}{interview.admin?.lastName?.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Technical Interview</h3>
                                <div className="flex items-center gap-2 text-gray-600 mt-1">
                                    <Users className="w-4 h-4" />
                                    <span>With {interview.admin?.firstName} {interview.admin?.lastName}</span>
                                </div>
                            </div>
                        </div>
                        <span className={`px-3 py-2 text-sm font-semibold border rounded-lg ${statusConfig.color} flex items-center gap-2`}>
                            <statusConfig.icon className={`w-4 h-4 ${statusConfig.iconColor}`} />
                            {statusConfig.label}
                        </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm">Date</span>
                            </div>
                            <p className="font-semibold text-gray-900">{formatDate(interview.scheduledAt)}</p>
                        </div>
                        
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">Time</span>
                            </div>
                            <p className="font-semibold text-gray-900">{formatTime(interview.scheduledAt)}</p>
                        </div>
                        
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Timer className="w-4 h-4" />
                                <span className="text-sm">Duration</span>
                            </div>
                            <p className="font-semibold text-gray-900">{getDuration(interview.durationMin)}</p>
                        </div>
                        
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-600">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">Starts</span>
                            </div>
                            <p className="font-semibold text-gray-900">{getTimeUntil(interview.scheduledAt)}</p>
                        </div>
                    </div>

                    {/* Preparation Tips */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Zap className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold text-blue-800">Preparation Required</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-blue-700">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                Review technical fundamentals
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                Prepare project examples
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    {showActions && (
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                {interview.questions?.length || 0} questions prepared
                            </div>
                            
                            {canStart ? (
                                <button
                                    onClick={handleJoinMeeting}
                                    className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-200 cursor-pointer"
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
                    )}
                </div>
            </div>
        );
    };

    const renderCompletedCard = () => {
        const profile = interview.interviewProfile;
        const statusConfig = getStatusConfig(interview.status);

        return (
            <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl border border-green-100 shadow-sm hover:shadow-lg hover:border-green-300 transition-all duration-300">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                {interview.admin?.firstName?.charAt(0)}{interview.admin?.lastName?.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Completed Interview</h3>
                                <div className="flex items-center gap-2 text-gray-600 mt-1">
                                    <Users className="w-4 h-4" />
                                    <span>With {interview.admin?.firstName} {interview.admin?.lastName}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-2 text-sm font-semibold border rounded-lg ${statusConfig.color} flex items-center gap-2`}>
                                <statusConfig.icon className={`w-4 h-4 ${statusConfig.iconColor}`} />
                                {statusConfig.label}
                            </span>
                            {profile?.performanceScore && (
                                <span className={`px-3 py-2 text-sm font-semibold border rounded-lg ${getScoreColor(profile.performanceScore)}`}>
                                    Score: {profile.performanceScore}/10
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    {profile && (
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <BarChart3 className="w-4 h-4" />
                                    <span className="text-sm">Score</span>
                                </div>
                                <p className={`font-semibold ${getScoreColor(profile.performanceScore)} px-3 py-1 rounded-lg inline-block`}>
                                    {profile.performanceScore}/10
                                </p>
                            </div>
                            
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Target className="w-4 h-4" />
                                    <span className="text-sm">Accuracy</span>
                                </div>
                                <p className="font-semibold text-gray-900">
                                    {profile.analytics?.correctAnswers}/{profile.analytics?.totalQuestions} correct
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
                    {profile?.strengths && profile.strengths.length > 0 && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-3 mb-3">
                                <Award className="w-5 h-5 text-green-600" />
                                <h4 className="font-semibold text-green-800">Key Strengths</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {profile.strengths.slice(0, 3).map((strength, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                                        {strength}
                                    </span>
                                ))}
                                {profile.strengths.length > 3 && (
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                                        +{profile.strengths.length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    {showActions && (
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Completed on {formatDate(interview.scheduledAt)}
                            </div>
                            
                            <button
                                onClick={handleViewDetails}
                                className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-200 cursor-pointer"
                            >
                                <Eye className="w-5 h-5" />
                                <span>View Full Report</span>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderCancelledCard = () => {
        const statusConfig = getStatusConfig(interview.status);

        return (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                {interview.admin?.firstName?.charAt(0)}{interview.admin?.lastName?.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Cancelled Interview</h3>
                                <div className="flex items-center gap-2 text-gray-600 mt-1">
                                    <Users className="w-4 h-4" />
                                    <span>With {interview.admin?.firstName} {interview.admin?.lastName}</span>
                                </div>
                            </div>
                        </div>
                        <span className={`px-3 py-2 text-sm font-semibold border rounded-lg ${statusConfig.color} flex items-center gap-2`}>
                            <statusConfig.icon className={`w-4 h-4 ${statusConfig.iconColor}`} />
                            {statusConfig.label}
                        </span>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm">Original Date</span>
                            </div>
                            <p className="font-semibold text-gray-900">{formatDate(interview.scheduledAt)}</p>
                        </div>
                        
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">Time</span>
                            </div>
                            <p className="font-semibold text-gray-900">{formatTime(interview.scheduledAt)}</p>
                        </div>
                        
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Timer className="w-4 h-4" />
                                <span className="text-sm">Duration</span>
                            </div>
                            <p className="font-semibold text-gray-900">{getDuration(interview.durationMin)}</p>
                        </div>
                        
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-600">
                                <XCircle className="w-4 h-4" />
                                <span className="text-sm">Cancelled</span>
                            </div>
                            <p className="font-semibold text-gray-900">
                                {interview.cancelledAt ? formatDate(interview.cancelledAt) : "Date not set"}
                            </p>
                        </div>
                    </div>

                    {/* Cancellation Reason */}
                    {interview.cancellationReason && (
                        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-3 mb-3">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <h4 className="font-semibold text-red-800">Cancellation Reason</h4>
                            </div>
                            <p className="text-red-700">{interview.cancellationReason}</p>
                            <div className="mt-2 text-sm text-red-600">
                                Cancelled by: {interview.cancelledBy === 'admin' ? 'Interviewer' : 'You'}
                            </div>
                        </div>
                    )}

                    {/* Questions Info */}
                    {interview.questions && interview.questions.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 text-gray-700 mb-2">
                                <MessageSquare className="w-4 h-4" />
                                <span className="font-medium">Questions Prepared</span>
                            </div>
                            <div className="text-sm text-gray-600">
                                This interview had {interview.questions.length} question{interview.questions.length === 1 ? '' : 's'} prepared before cancellation.
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    {showActions && (
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                {interview.cancelledBy === 'admin' ? 'Cancelled by interviewer' : 'Cancelled by you'}
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleReschedule}
                                    className="group flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span>Reschedule</span>
                                </button>
                                
                                <button
                                    onClick={handleViewDetails}
                                    className="group flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                                >
                                    <span>View Details</span>
                                    <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Render based on type
    switch (type) {
        case "upcoming":
            return renderUpcomingCard();
        case "completed":
            return renderCompletedCard();
        case "cancelled":
            return renderCancelledCard();
        default:
            return renderUpcomingCard();
    }
};

export default InterviewCard;