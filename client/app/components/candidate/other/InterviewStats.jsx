'use client'
import React from "react";
import { 
    Calendar, 
    CheckCircle, 
    Clock, 
    TrendingUp, 
    Users, 
    BarChart3,
    Target,
    Award,
    XCircle,
    Video,
    AlertCircle,
    Zap
} from "lucide-react";

const InterviewStats = ({ stats, type = "overview" }) => {
    // Default stats structure
    const defaultStats = {
        total: 0,
        completed: 0,
        upcoming: 0,
        cancelled: 0,
        averageScore: 0,
        completionRate: 0,
        accuracy: 0,
        improvement: 0,
        totalQuestions: 0,
        videoInterviews: 0,
        cancelledByAdmin: 0,
        cancelledByCandidate: 0,
        cancelledBySystem: 0
    };

    const statsData = { ...defaultStats, ...stats };

    // Configuration for different stat types
    const statConfigs = {
        overview: [
            {
                key: "total",
                title: "Total Interviews",
                value: statsData.total,
                icon: Calendar,
                color: "bg-blue-50",
                iconColor: "text-blue-600",
                trend: `${statsData.completionRate}% completion`,
                trendColor: "text-blue-700 bg-blue-50"
            },
            {
                key: "completed",
                title: "Completed",
                value: statsData.completed,
                icon: CheckCircle,
                color: "bg-green-50",
                iconColor: "text-green-600",
                trend: `${statsData.completionRate}%`,
                trendColor: "text-green-700 bg-green-50"
            },
            {
                key: "upcoming",
                title: "Upcoming",
                value: statsData.upcoming,
                icon: Clock,
                color: "bg-orange-50",
                iconColor: "text-orange-600"
            },
            {
                key: "averageScore",
                title: "Avg. Score",
                value: statsData.averageScore,
                icon: TrendingUp,
                color: "bg-purple-50",
                iconColor: "text-purple-600",
                suffix: "/10"
            }
        ],
        upcoming: [
            {
                key: "total",
                title: "Total Scheduled",
                value: statsData.total,
                icon: Calendar,
                color: "bg-blue-50",
                iconColor: "text-blue-600",
                description: "Interviews scheduled"
            },
            {
                key: "videoInterviews",
                title: "Video Interviews",
                value: statsData.videoInterviews,
                icon: Video,
                color: "bg-green-50",
                iconColor: "text-green-600",
                description: "Online meetings"
            },
            {
                key: "totalQuestions",
                title: "Questions Prepared",
                value: statsData.totalQuestions,
                icon: AlertCircle,
                color: "bg-purple-50",
                iconColor: "text-purple-600",
                description: "For upcoming interviews"
            },
            {
                key: "nextInterview",
                title: "Next Interview",
                value: statsData.nextInterview || "No upcoming",
                icon: Zap,
                color: "bg-indigo-50",
                iconColor: "text-indigo-600",
                isDate: true
            }
        ],
        completed: [
            {
                key: "averageScore",
                title: "Average Score",
                value: statsData.averageScore,
                icon: BarChart3,
                color: "bg-green-50",
                iconColor: "text-green-600",
                suffix: "/10",
                description: "Overall performance"
            },
            {
                key: "accuracy",
                title: "Accuracy",
                value: statsData.accuracy,
                icon: Target,
                color: "bg-blue-50",
                iconColor: "text-blue-600",
                suffix: "%",
                description: `${statsData.correctAnswers}/${statsData.totalQuestions} correct`
            },
            {
                key: "total",
                title: "Interviews",
                value: statsData.total,
                icon: Award,
                color: "bg-purple-50",
                iconColor: "text-purple-600",
                description: "Successfully completed"
            },
            {
                key: "improvement",
                title: "Improvement",
                value: statsData.improvement,
                icon: TrendingUp,
                color: "bg-amber-50",
                iconColor: "text-amber-600",
                suffix: "%",
                description: "Since last month"
            }
        ],
        cancelled: [
            {
                key: "total",
                title: "Total Cancelled",
                value: statsData.total,
                icon: XCircle,
                color: "bg-red-50",
                iconColor: "text-red-600",
                description: "All cancelled interviews"
            },
            {
                key: "cancelledByAdmin",
                title: "By Interviewer",
                value: statsData.cancelledByAdmin,
                icon: Users,
                color: "bg-blue-50",
                iconColor: "text-blue-600",
                description: "Cancelled by admin"
            },
            {
                key: "cancelledByCandidate",
                title: "By You",
                value: statsData.cancelledByCandidate,
                icon: Users,
                color: "bg-green-50",
                iconColor: "text-green-600",
                description: "Cancelled by candidate"
            },
            {
                key: "totalQuestions",
                title: "Questions Prepared",
                value: statsData.totalQuestions,
                icon: AlertCircle,
                color: "bg-purple-50",
                iconColor: "text-purple-600",
                description: "Before cancellation"
            }
        ]
    };

    const currentConfig = statConfigs[type] || statConfigs.overview;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {currentConfig.map((stat, index) => {
                const Icon = stat.icon;
                
                return (
                    <div 
                        key={stat.key} 
                        className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className="p-5 md:p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 ${stat.color} rounded-xl transition-transform group-hover:scale-110`}>
                                    <Icon className={`w-6 h-6 md:w-7 md:h-7 ${stat.iconColor}`} />
                                </div>
                                
                                {stat.trend && (
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.trendColor}`}>
                                        {stat.trend}
                                    </span>
                                )}
                            </div>

                            {/* Value */}
                            <div className="mb-2">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl md:text-3xl font-bold text-gray-900">
                                        {stat.value}
                                    </span>
                                    {stat.suffix && (
                                        <span className="text-gray-600 font-medium">
                                            {stat.suffix}
                                        </span>
                                    )}
                                </div>
                                
                                {/* Title */}
                                <h3 className="text-sm md:text-base font-semibold text-gray-900 mt-1">
                                    {stat.title}
                                </h3>
                            </div>

                            {/* Description */}
                            {stat.description && (
                                <p className="text-xs md:text-sm text-gray-600 mt-2">
                                    {stat.description}
                                </p>
                            )}

                            {/* Progress bar for accuracy */}
                            {stat.key === "accuracy" && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                                        <span>Accuracy</span>
                                        <span>{stat.value}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${
                                                stat.value >= 80 ? "bg-green-500" :
                                                stat.value >= 60 ? "bg-yellow-500" :
                                                "bg-red-500"
                                            }`}
                                            style={{ width: `${stat.value}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Score indicator */}
                            {stat.key === "averageScore" && stat.value > 0 && (
                                <div className="mt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${
                                                    stat.value >= 8 ? "bg-green-500" :
                                                    stat.value >= 6 ? "bg-yellow-500" :
                                                    "bg-red-500"
                                                }`}
                                                style={{ width: `${(stat.value / 10) * 100}%` }}
                                            />
                                        </div>
                                        <span className={`text-xs font-medium ${
                                            stat.value >= 8 ? "text-green-600" :
                                            stat.value >= 6 ? "text-yellow-600" :
                                            "text-red-600"
                                        }`}>
                                            {stat.value}/10
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Status indicator for dates */}
                            {stat.isDate && stat.value !== "No upcoming" && (
                                <div className="mt-4 flex items-center gap-2 text-xs text-blue-600">
                                    <Clock className="w-3 h-3" />
                                    <span>Upcoming date</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default InterviewStats;