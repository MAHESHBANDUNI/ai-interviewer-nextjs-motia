"use client"
import { motion } from "framer-motion";
import { Lightbulb, BarChart3, CalendarDays, Users, TrendingUp, FileText, ChevronRight, MoreHorizontal, Clock } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

export default function DashboardPage() {
  const {data: session}=useSession();
  const router = useRouter();
  const [candidatesCount, setCandidatesCount] = useState('');
  const [interviewsCount, setInterviewsCount] = useState('');
  const [completionRate, setCompletionRate] = useState('');
  const [thisWeekInterviewCount, setThisWeekInterviewCount] = useState('');
  const [thisWeekCandidateCount, setThisWeekCandidateCount] = useState('');
  const [avgCompletionMins, setAvgCompletionMins] = useState('');
  const [avgScheduledMins, setAvgScheduledMins] = useState('');
  const [topJobAreas, setTopJobAreas] = useState([]);
  const [totalInterviewsThisMonth, setTotalInterviewsThisMonth] = useState('');

  useEffect(() => {
    if (!session?.user?.token) return;

    fetchAnalytics();
  }, [session?.user?.token]);

  const fetchAnalytics = async() =>{
    try{
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/analytics`,{
        method: 'GET',
        headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`}
      })
      if(!response.ok){
        console.error('Error fetching analytics');
      }
      if(response.ok){
        const res = await response.json();
        setCandidatesCount(res?.analytics?.candidatesCount);
        setInterviewsCount(res?.analytics?.interviewsCount);
        setCompletionRate(res?.analytics?.completionRate);
        setThisWeekInterviewCount(res?.analytics?.thisWeekInterviewCount);
        setThisWeekCandidateCount(res?.analytics?.thisWeekCandidateCount);
        setAvgCompletionMins((res?.analytics?.avgCompletionMins)*60);
        setAvgScheduledMins((res?.analytics?.avgScheduledMins)*60);
        setTopJobAreas(res?.analytics?.topJobAreas);
        setTotalInterviewsThisMonth(res?.analytics?.totalInterviewsThisMonth);
      }
    }
    catch(err){
      console.error('Error fetching analytics:');
    }
  }

  // Find max count for bar scaling
  const maxCount = topJobAreas.length > 0 ? Math.max(...topJobAreas.map(j => j.count)) : 1;

  // Format completion time (e.g., "12m 34s")
  const formatCompletionTime = (seconds) => {
    if (seconds < 60) {
      return `${Math.floor(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}min`;
  };

  // Format duration time (e.g., "45m", "1h 30m")
  const formatDurationTime = (seconds) => {
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header Section */}
        <motion.div
          className="mb-6 sm:mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3 sm:mb-4">
                Admin Dashboard
              </h1>
              {/* <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Welcome to your AI Interviewer Dashboard. Track your progress, access personalized tips, 
                and get insights to ace your interviews.
              </p> */}
            </div>
            {/* <div className="flex gap-3">
              <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm">
                Export Report
              </button>
              <button className="px-4 py-2 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors text-sm">
                New Interview
              </button>
            </div> */}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Total Candidates Card */}
          <motion.div
            className="bg-white rounded-2xl p-5 sm:p-6 cursor-pointer border border-slate-100 relative overflow-hidden group h-full flex flex-col"
            variants={cardVariants}
            whileHover="hover"
            onClick={()=> router.push('/admin/candidates')}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-bl-full"/>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-slate-500 text-sm font-medium mb-2 truncate">Total Candidates</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">{candidatesCount || '--'}</h3>
              </div>
              <div className="p-2 sm:p-3 bg-blue-500/10 rounded-xl flex-shrink-0 ml-3">
                <Users className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="mt-auto pt-4">
              <div className="flex items-center text-sm text-slate-500">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="truncate">+{thisWeekCandidateCount || '--'} this week</span>
              </div>
            </div>
          </motion.div>
                    
          {/* Total Interviews Card */}
          <motion.div
            className="bg-white rounded-2xl p-5 sm:p-6 cursor-pointer border border-slate-100 relative overflow-hidden group h-full flex flex-col"
            variants={cardVariants}
            whileHover="hover"
            onClick={()=> router.push('/admin/interview')}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-bl-full" />
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-slate-500 text-sm font-medium mb-2 truncate">Total Interviews</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">{interviewsCount || '--'}</h3>
              </div>
              <div className="p-2 sm:p-3 bg-green-500/10 rounded-xl flex-shrink-0 ml-3">
                <BarChart3 className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="mt-auto pt-4">
              <div className="flex items-center text-sm text-slate-500">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="truncate">+{thisWeekInterviewCount || '--'} this week</span>
              </div>
            </div>
          </motion.div>
                    
          {/* Completion Rate Card */}
          <motion.div
            className="bg-white rounded-2xl p-5 sm:p-6 cursor-pointer border border-slate-100 relative overflow-hidden group h-full flex flex-col"
            variants={cardVariants}
            whileHover="hover"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-bl-full" />
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-slate-500 text-sm font-medium mb-2 truncate">Completion Rate</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">{completionRate || '--'}%</h3>
              </div>
              <div className="p-2 sm:p-3 bg-purple-500/10 rounded-xl flex-shrink-0 ml-3">
                <FileText className="text-purple-600 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="mt-auto pt-4">
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full w-11/12"></div>
              </div>
            </div>
          </motion.div>
                    
          {/* Combined Time Metrics Card */}
          <motion.div
            className="bg-white rounded-2xl p-5 sm:p-6 cursor-pointer border border-slate-100 relative overflow-hidden group h-full flex flex-col"
            variants={cardVariants}
            whileHover="hover"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-bl-full" />
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 min-w-0">
                <p className="text-slate-500 text-sm font-medium mb-1 truncate">Time Metrics</p>
                <p className="text-xs text-slate-400">Completion & Duration Time</p>
              </div>
              <div className="p-2 sm:p-3 bg-amber-500/10 rounded-xl flex-shrink-0 ml-3">
                <Clock className="text-amber-600 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
                    
            <div className="mt-auto pt-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Average Completion Time */}
                <div className="space-y-2">
                  <p className="text-slate-500 text-xs font-medium">Avg. Completion</p>
                  <div className="flex items-baseline">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
                      {formatCompletionTime(avgCompletionMins) || '--'}
                    </h3>
                  </div>
                </div>
                    
                {/* Average Duration Time */}
                <div className="space-y-2">
                  <p className="text-slate-500 text-xs font-medium">Avg. Duration</p>
                  <div className="flex items-baseline">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
                      {formatDurationTime(avgScheduledMins) || '--'}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
                    
        {/* Bottom Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Tips & Resources Card */}
<motion.div
      className="bg-white rounded-2xl p-5 sm:p-6 border border-indigo-100 relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-4 sm:mb-6">
        <div className="flex-1 min-w-0">
          <p className="text-indigo-700 text-sm font-medium mb-1 truncate">Top Job Areas</p>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-800 truncate">Most Active Interviews</h3>
        </div>
        <div className="p-2 sm:p-3 bg-indigo-500/20 rounded-xl flex-shrink-0 ml-3">
          <TrendingUp className="text-indigo-600 w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {topJobAreas.map((job, index) => (
          <motion.div
            key={job.jobAreaId}
            className="flex items-center justify-between group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 bg-indigo-500`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{job.name}</p>

                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-indigo-100 rounded-full h-1.5 min-w-[40px]">
                    <motion.div 
                      className={`h-1.5 rounded-full bg-indigo-500`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(job.count / maxCount) * 85}%` }}
                      transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-medium flex-shrink-0">{job.count}</span>
                </div>

              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 sm:mt-6 pt-4 border-t border-indigo-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 truncate">Total interviews this month</span>
          <span className="font-semibold text-slate-800 flex-shrink-0 ml-2">
            {totalInterviewsThisMonth}
          </span>
        </div>
      </div>
    </motion.div>
        </div>
      </div>
    </div>
  )
}