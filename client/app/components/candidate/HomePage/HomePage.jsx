'use client'
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CalendarClock, CalendarCheckIcon, XCircle, ArrowRight, TrendingUp, CalendarX, Laptop } from "lucide-react";
import { motion } from "framer-motion"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 12 }},
  hover: { 
    scale: 1.02, 
    y: -5,
    boxShadow: "0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.8)"
  }
}

export default function InterviewsPage() {
    const [loading, setLoading] = useState(false);
    const { data: session } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        upcoming: 0,
        cancelled: 0
    });

    useEffect(() => {
      if (!session?.user?.token) return;

      fetchInterviewAnalytics();
    }, [session?.user?.token]);
    

    const fetchInterviewAnalytics = async() => {
      setLoading(true);
        try{
            const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/candidate/interviews/analytics`,{
                method: 'GET',
                headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`}
            })
            if(!res.ok){
              console.error('Error fetching analytics');
            }
            if(res.ok){
              const response = await res.json();
              setStats({
                total:response?.analytics?.allInterviewsCount,
                completed:response?.analytics?.completedInterviewCount,
                upcoming:response?.analytics?.upcomingInterviewCount,
                cancelled:response?.analytics?.cancelledInterviewCount
              });
            }
        }
        catch(error){
            console.error('Error fetching analytics',error);
        }
        finally{
          setLoading(false);
        }
    }

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
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                                Interview Dashboard
                            </h1>
                            <p className="text-gray-600 text-lg">
                                Track and manage your interview journey
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {/* Total Interview Card */}
                  <motion.div
                    className="bg-white rounded-2xl p-5 sm:p-6 cursor-pointer border border-slate-100 relative overflow-hidden group h-full flex flex-col"
                    variants={cardVariants}
                    whileHover="hover"
                    onClick={()=> router.push('/candidate/interviews')}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-bl-full"/>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-500 text-sm font-medium mb-2 truncate">Total Interviews</p>
                        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">{loading ? '--' : stats.total > 0 ? stats.total : 0 }</h3>
                      </div>
                      <div className="p-2 sm:p-3 bg-orange-500/10 rounded-xl flex-shrink-0 ml-3">
                        <Laptop className="text-orange-600 w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    </div>
                    <div className="mt-auto pt-4">
                      <div className="flex items-center text-sm text-slate-500">
                        <TrendingUp className="w-4 h-4 text-orange-500 mr-1" />
                        <span className="truncate">+{'0' || '--'} this week</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Upcoming Interviews Card */}
                  <motion.div
                    className="bg-white rounded-2xl p-5 sm:p-6 cursor-pointer border border-slate-100 relative overflow-hidden group h-full flex flex-col"
                    variants={cardVariants}
                    whileHover="hover"
                    onClick={()=> router.push('/candidate/interviews/upcoming')}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-bl-full" />
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-500 text-sm font-medium mb-2 truncate">Upcoming</p>
                        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">{loading ? '--' : stats.upcoming > 0 ? stats.upcoming : 0 }</h3>
                      </div>
                      <div className="p-2 sm:p-3 bg-blue-500/10 rounded-xl flex-shrink-0 ml-3">
                        <CalendarClock className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    </div>
                    <div className="mt-auto pt-4">
                      <div className="flex items-center text-sm text-slate-500">
                        <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
                        <span className="truncate">+{'0' || '--'} this week</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Completed Interviews Card */}
                  <motion.div
                    className="bg-white rounded-2xl p-5 sm:p-6 cursor-pointer border border-slate-100 relative overflow-hidden group h-full flex flex-col"
                    variants={cardVariants}
                    whileHover="hover"
                    onClick={()=> router.push('/candidate/interviews/completed')}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-bl-full" />
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-500 text-sm font-medium mb-2 truncate">Completed</p>
                        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">{loading ? '--' : stats.completed > 0 ? stats.completed : 0 }</h3>
                      </div>
                      <div className="p-2 sm:p-3 bg-green-500/10 rounded-xl flex-shrink-0 ml-3">
                        <CalendarCheckIcon className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    </div>
                    <div className="mt-auto pt-4">
                      <div className="flex items-center text-sm text-slate-500">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        <span className="truncate">+{'0' || '--'} this week</span>
                      </div>
                    </div>
                  </motion.div>  

                {/* Cancelled Interviews Card */}
                  <motion.div
                    className="bg-white rounded-2xl p-5 sm:p-6 cursor-pointer border border-slate-100 relative overflow-hidden group h-full flex flex-col"
                    variants={cardVariants}
                    whileHover="hover"
                    onClick={()=> router.push('/candidate/interviews/cancelled')}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-bl-full" />
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-500 text-sm font-medium mb-2 truncate">Cancelled</p>
                        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">{loading ? '--' : stats.cancelled > 0 ? stats.cancelled : 0 }</h3>
                      </div>
                      <div className="p-2 sm:p-3 bg-red-500/10 rounded-xl flex-shrink-0 ml-3">
                        <CalendarX className="text-red-600 w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    </div>
                    <div className="mt-auto pt-4">
                      <div className="flex items-center text-sm text-slate-500">
                        <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                        <span className="truncate">+{'0' || '--'} this week</span>
                      </div>
                    </div>
                  </motion.div>  
                </motion.div>
            </div>
        </div>
    );
}