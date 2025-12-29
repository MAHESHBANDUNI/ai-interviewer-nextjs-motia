'use client'
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Calendar, BarChart3, XCircle, ArrowRight, TrendingUp } from "lucide-react";

export default function InterviewsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        upcoming: 0,
        cancelled: 0,
        averageScore: 0
    });

    // Mock stats - in real app, fetch from API
    React.useEffect(() => {
        setStats({
            total: 15,
            completed: 8,
            upcoming: 4,
            cancelled: 3,
            averageScore: 8.2
        });
    }, []);

    const tabs = [
        {
            key: "upcoming",
            label: "Upcoming Interviews",
            description: "View and manage your scheduled interviews",
            icon: Calendar,
            count: stats.upcoming,
            color: "from-blue-500 to-blue-600",
            hoverColor: "hover:from-blue-600 hover:to-blue-700",
            buttonColor: "bg-blue-600 hover:bg-blue-700",
            path: "/candidate/interviews/upcoming"
        },
        {
            key: "completed",
            label: "Completed Interviews",
            description: "Review past interviews and performance",
            icon: BarChart3,
            count: stats.completed,
            color: "from-green-500 to-green-600",
            hoverColor: "hover:from-green-600 hover:to-green-700",
            buttonColor: "bg-green-600 hover:bg-green-700",
            path: "/candidate/interviews/completed"
        },
        {
            key: "cancelled",
            label: "Cancelled Interviews",
            description: "View cancelled interviews history",
            icon: XCircle,
            count: stats.cancelled,
            color: "from-gray-500 to-gray-600",
            hoverColor: "hover:from-gray-600 hover:to-gray-700",
            buttonColor: "bg-gray-600 hover:bg-gray-700",
            path: "/candidate/interviews/cancelled"
        }
    ];

    if (!session) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                                Interview Management
                            </h1>
                            <p className="text-gray-600 text-lg">
                                Track and manage your interview journey
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm text-gray-600">Welcome back,</p>
                                <p className="font-semibold text-gray-900">{session?.user?.name || "Candidate"}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {session?.user?.name?.charAt(0) || "C"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <Calendar className="w-8 h-8 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                                {((stats.completed / stats.total) * 100).toFixed(0)}% completion
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</h3>
                        <p className="text-gray-600">Total Interviews</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-50 rounded-xl">
                                <BarChart3 className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.completed}</h3>
                        <p className="text-gray-600">Completed</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-orange-50 rounded-xl">
                                <Calendar className="w-8 h-8 text-orange-600" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.upcoming}</h3>
                        <p className="text-gray-600">Upcoming</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-50 rounded-xl">
                                <TrendingUp className="w-8 h-8 text-purple-600" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.averageScore}</h3>
                        <p className="text-gray-600">Avg. Score</p>
                    </div>
                </div>

                {/* Tabs Navigation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <div 
                                key={tab.key}
                                className={`group bg-gradient-to-br ${tab.color} rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer`}
                                onClick={() => router.push(tab.path)}
                            >
                                <div className="p-8 text-white">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                            <Icon className="w-8 h-8" />
                                        </div>
                                        <span className="text-4xl font-bold">{tab.count}</span>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold mb-3">{tab.label}</h3>
                                    <p className="text-white/80 mb-6">{tab.description}</p>
                                    
                                    <div className="flex items-center justify-between">
                                        <button className={`${tab.buttonColor} text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:shadow-lg transition-all duration-200`}>
                                            View All
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                        <div className="text-white/60 text-sm">
                                            Click to explore
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Tips */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 mt-12">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Interview Preparation Tips</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Research the Company</h4>
                            <p className="text-gray-600 text-sm">Understand their products, culture, and recent news before the interview.</p>
                        </div>
                        
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Practice Common Questions</h4>
                            <p className="text-gray-600 text-sm">Review frequently asked questions and prepare thoughtful responses.</p>
                        </div>
                        
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Be Punctual</h4>
                            <p className="text-gray-600 text-sm">Join the interview 5-10 minutes early to test your setup and prepare.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}