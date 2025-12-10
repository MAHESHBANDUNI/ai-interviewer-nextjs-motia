'use client';

import { Download, Trash2, MoreVertical, ChevronDown, Eye, Trash, Mail, Phone, FileText, Calendar, Star, MapPin, Briefcase, Clock, X, User2, CalendarClock, Ellipsis } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import React from 'react';
import { format } from 'date-fns';

export default function InterviewTable({ interviews, loading, error, handleCancelInterviewClick, handleInterviewDetailClick, handleRescheduleInterviewClick, selectedInterviewId, setSelectedInterviewId }) {
  const [hoveredRow, setHoveredRow] = useState(null);

  const handleInterviewCancel = (candidateId, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    handleCancelInterviewClick(candidateId);
  };

  const handleInterviewDetail = (candidateId, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    handleInterviewDetailClick(candidateId);
  };

  const handleRescheduleInterview = (candidateId, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    handleRescheduleInterviewClick(candidateId);
  }

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'from-blue-500/10 to-blue-600/10 text-blue-700 border-blue-200/50',
      'CANCELLED': 'from-red-500/10 to-red-600/10 text-red-700 border-red-200/50',
      'COMPLETED': 'from-green-500/10 to-green-600/10 text-green-700 border-green-200/50',
      'SCHEDULED': 'from-amber-500/10 to-amber-600/10 text-amber-700 border-amber-200/50',
      'RESCHEDULED': 'from-indigo-500/10 to-indigo-600/10 text-indigo-700 border-indigo-200/50',
      'ONGOING': 'from-purple-500/10 to-purple-600/10 text-purple-700 border-purple-200/50'
    };
    return colors[status] || 'from-gray-500/10 to-gray-600/10 text-gray-700 border-gray-200/50';
  };

  const getStatusGradient = (status) => {
    const gradients = {
      'PENDING': 'from-blue-500 to-blue-600',
      'CANCELLED': 'from-red-500 to-red-600',
      'COMPLETED': 'from-green-500 to-green-600',
      'SCHEDULED': 'from-amber-500 to-amber-600',
      'RESCHEDULED': 'from-indigo-500 to-indigo-600',
      'ONGOING': 'from-purple-500 to-purple-600'
    };
    return gradients[status] || 'from-gray-500 to-gray-600';
  };

  const formatStatus = (status) => {
    const statusMap = {
      'PENDING': 'Pending',
      'CANCELLED': 'Cancelled',
      'COMPLETED': 'Completed',
      'SCHEDULED': 'Scheduled',
      'RESCHEDULED': 'Rescheduled',
      'ONGOING': 'Ongoing'
    };
    return statusMap[status] || status;
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: format(date, 'dd-MM-yyyy'),
      time: format(date, 'hh:mm a'),
      full: format(date, 'dd-MM-yyyy, hh:mm a')
    };
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <>
      {!loading && interviews.length === 0 && (
        <EmptyState />
      )}
      {!loading && interviews.length > 0 && (
        <div className="w-full">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm shadow-sm">
            <div className="overflow-x-auto md:max-h-[500px] xl:max-h-[600px] overflow-y-auto block">
              <table className="w-full">
                <thead className='sticky top-0 z-10'>
                  <tr className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    <TableHeader>Candidate</TableHeader>
                    <TableHeader>Scheduled At</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Duration</TableHeader>
                    <TableHeader>Created On</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </tr>
                </thead>
                <tbody className="bg-white/50">
                  {interviews.map((interview, index) => (
                    <TableRow 
                      key={interview.interviewId} 
                      index={index}
                      onMouseEnter={() => setHoveredRow(interview.interviewId)}
                      onMouseLeave={() => setHoveredRow(null)}
                      isHovered={hoveredRow === interview.interviewId}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-blue-500/25">
                              {getInitials(interview.candidate.firstName, interview.candidate.lastName)}
                            </div>
                            <div className={`absolute -bottom-0.25 -right-0.25 w-3 h-3 rounded-full border-2 border-white bg-gradient-to-r ${getStatusGradient(interview.status)} shadow-sm`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-base font-semibold text-gray-900 truncate">
                                {interview.candidate.firstName} {interview.candidate.lastName}
                              </p>
                              {interview.candidate.rating && (
                                <div className="flex items-center space-x-1 bg-amber-50 px-2 py-1 rounded-full">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  <span className="text-xs font-medium text-amber-700">{interview.candidate.rating}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Briefcase className="w-3 h-3" />
                                <span>{interview.candidate.position || 'Full Stack Developer'}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border border-gray-200/50">
                              <Calendar className="w-3.5 h-3.5 text-gray-500" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{formatDateTime(interview.scheduledAt).date}</div>
                              <div className="text-xs text-gray-500">{formatDateTime(interview.scheduledAt).time}</div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`group inline-flex items-center space-x-3 px-4 py-2.5 rounded-xl border backdrop-blur-sm text-sm font-semibold transition-all duration-300 bg-gradient-to-r ${getStatusColor(interview.status)}`}
                        >
                          <div className="flex items-center space-x-2">
                            <span>{formatStatus(interview.status)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {/* <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border border-gray-200/50">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                          </div> */}
                          <span className='text-base text-gray-700 font-medium'>{interview.durationMin} min</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {/* <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border border-gray-200/50">
                            <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          </div> */}
                          <span className='text-base text-gray-700'>{format(new Date(interview.createdAt), 'dd-MM-yyyy')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => handleInterviewDetail(interview.interviewId, e)}
                            disabled={['PENDING','RESCHEDULED', 'CANCELLED'].includes(interview.status)}
                            className="cursor-pointer group relative p-2.5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/60 text-gray-600 
                              hover:text-white hover:from-blue-500 hover:to-blue-600 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/25 
                              transition-all duration-300
                              disabled:opacity-50 disabled:pointer-events-none disabled:saturate-0 disabled:cursor-not-allowed disabled:shadow-none"
                            title="View Performance"
                          >
                            <Eye className="w-4 h-4" />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                          </button>

                          <button
                            onClick={(e) => handleRescheduleInterview(interview.interviewId, e)}
                            disabled={
                              interview.status !== 'PENDING' || new Date(interview.scheduledAt) >= new Date()
                            }
                            className="cursor-pointer group relative p-2.5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/60 text-gray-600 
                              hover:text-white hover:from-green-500 hover:to-green-600 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/25 
                              transition-all duration-300
                              disabled:opacity-50 disabled:pointer-events-none disabled:saturate-0 disabled:cursor-not-allowed disabled:shadow-none"
                            title="Reschedule Interview"
                          >
                            <CalendarClock className="w-4 h-4" />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-500 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                          </button>

                          <button
                            onClick={(e) => handleInterviewCancel(interview.interviewId, e)}
                            disabled={['COMPLETED', 'CANCELLED'].includes(interview.status)}
                            className="cursor-pointer group relative p-2.5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/60 text-gray-600 
                              hover:text-white hover:from-red-500 hover:to-red-600 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/25 
                              transition-all duration-300 
                              disabled:opacity-50 disabled:pointer-events-none disabled:saturate-0 disabled:cursor-not-allowed disabled:shadow-none"
                            title="Cancel Interview"
                          >
                            <X className="w-4 h-4" />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                          </button>
                        </div>
                      </td>
                    </TableRow>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4 p-4">
            {interviews.map((interview) => (
              <MobileCard 
                key={interview.interviewId} 
                interview={interview}
                getStatusColor={getStatusColor}
                getStatusGradient={getStatusGradient}
                formatStatus={formatStatus}
                handleInterviewCancel={handleInterviewCancel}
                handleInterviewDetail={handleInterviewDetail}
                handleRescheduleInterview={handleRescheduleInterview}
                getInitials={getInitials}
                formatDateTime={formatDateTime}
                selectedInterviewId={selectedInterviewId}
                setSelectedInterviewId={setSelectedInterviewId}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// Component Parts
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-20 space-y-6">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
    </div>
    <div className="text-center space-y-2">
      <p className="text-lg font-semibold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
        Loading Interviews
      </p>
      <p className="text-sm text-gray-500">Preparing your interview dashboard</p>
    </div>
  </div>
);

const ErrorState = ({ error }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-gradient-to-br from-red-50/80 to-red-100/80 backdrop-blur-sm rounded-2xl border border-red-200/60">
    <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-red-200/50">
      <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h3 className="text-xl font-bold text-red-900 mb-2 bg-gradient-to-r from-red-900 to-red-700 bg-clip-text text-transparent">
      Unable to Load Interviews
    </h3>
    <p className="text-red-700/80 text-sm max-w-sm">{error}</p>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-gradient-to-br from-gray-50/80 to-blue-50/80 backdrop-blur-sm rounded-2xl border border-gray-200/60">
    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200/50">
      <Calendar className="w-12 h-12 text-blue-600/80" />
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
      No Interviews Yet
    </h3>
    <p className="text-gray-600/80 text-sm max-w-sm mb-8 leading-relaxed">
      Schedule your first interview to see them listed here.
    </p>
  </div>
);

const TableHeader = ({ children }) => (
  <th className="px-5 py-4 text-left text-md font-semibold text-white tracking-wider">
    {children}
  </th>
);

const TableCell = ({ children, className = '' }) => (
  <td className={`px-5 py-4 whitespace-nowrap text-sm ${className}`}>
    {children}
  </td>
);

const TableRow = ({ children, index, isHovered, onMouseEnter, onMouseLeave }) => (
  <tr 
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    className={`transition-all duration-300 border-b border-gray-100/50 last:border-b-0 ${
      isHovered 
        ? 'bg-gradient-to-r from-blue-50/30 to-purple-50/20 shadow-lg shadow-blue-500/5' 
        : index % 2 === 0 
          ? 'bg-white/30' 
          : 'bg-gray-50/20'
    }`}
  >
    {children}
  </tr>
);

// Mobile Card Component
const MobileCard = ({
  interview,
  getStatusColor,
  getStatusGradient,
  formatStatus,
  handleInterviewCancel,
  getInitials,
  formatDateTime,
  handleInterviewDetail,
  handleRescheduleInterview,
  setSelectedInterviewId,
  selectedInterviewId
  }) => {
    const ellipsisRef = useRef(null);
    const dropdownRef = useRef(null);
  
    const toggleOptions = (interviewId) =>{
      if(selectedInterviewId){
        setSelectedInterviewId('');
      }
      else{
        setSelectedInterviewId(interviewId);
      }
    }
  
    useEffect(() => {
      function handleClickOutside(event) {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target) &&
          ellipsisRef.current &&
          !ellipsisRef.current.contains(event.target)
        ) {
          setSelectedInterviewId(null);
        }
      }
  
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    return(
      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-200/60 transition-all duration-300 hover:shadow-lg">
        {/* Header */}
        <div className="flex flex-col sm:flex-col mb-4">
          <div className='flex flex-row justify-between'>
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-blue-500/20">
                {getInitials(interview.candidate.firstName, interview.candidate.lastName)}
              </div>
              <div className={`absolute -bottom-0.25 -right-0.25 w-3 h-3 rounded-full border-2 border-white bg-gradient-to-r ${getStatusGradient(interview.status)} shadow-sm`} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 mb-1">
                <h3 className="text-base font-bold text-gray-900 truncate">
                  {interview.candidate.firstName} {interview.candidate.lastName}
                </h3>
                {interview.candidate.rating && (
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full border border-amber-200/50 w-fit">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-700">{interview.candidate.rating}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Briefcase className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
                <span className="font-medium truncate">{interview.candidate.position || 'Full Stack Developer'}</span>
              </div>
            </div>
          </div>
          <div>
            {/* Ellipsis button */}
            <div
              ref={ellipsisRef}
              className="rotate-90 cursor-pointer"
              onClick={() => toggleOptions(interview.interviewId)}
            >
              <Ellipsis />
            </div>

            {/* Dropdown */}
            {selectedInterviewId === interview.interviewId && (
              <div className="relative">
                <div
                  ref={dropdownRef}
                  className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200/60 shadow-lg rounded-lg absolute right-3 z-50"
                >
                  {/* View Profile */}
                  <button
                    onClick={(e) => handleInterviewDetail(interview.interviewId, e)}
                    disabled={['PENDING', 'CANCELLED'].includes(interview.status)}
                    className="cursor-pointer group relative flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-200 transition-all duration-300 min-h-11 w-full disabled:opacity-50 disabled:pointer-events-none disabled:saturate-0 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <User2 className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-semibold whitespace-nowrap">View Performance</span>
                  </button>

                  <button
                    onClick={(e) => handleRescheduleInterview(interview.interviewId, e)}
                    disabled={interview.status !== 'PENDING' || new Date(interview.scheduledAt) >= new Date()}
                    className="cursor-pointer group relative flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-200 transition-all duration-300 min-h-11 w-full disabled:opacity-50 disabled:pointer-events-none disabled:saturate-0 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <CalendarClock className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-semibold whitespace-nowrap">Reschedule Interview</span>
                  </button>
            
                  {/* Delete */}
                  <button
                    onClick={(e) => handleInterviewCancel(interview.interviewId, e)}
                    disabled={['COMPLETED', 'CANCELLED'].includes(interview.status)}
                    className="cursor-pointer group relative flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-200 transition-all duration-300 min-h-11 w-full disabled:opacity-50 disabled:pointer-events-none disabled:saturate-0 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <X className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-semibold whitespace-nowrap">Cancel Interview</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
              
        {/* Status & Duration */}
        <div className='flex flex-col sm:flex-row gap-2 mb-4'>
          <div
            className={`inline-flex items-center justify-center px-3 py-2 rounded-lg border backdrop-blur-sm text-sm font-semibold transition-all duration-300 bg-gradient-to-r ${getStatusColor(interview.status)}`}
          >
            <span className="text-xs sm:text-sm">{formatStatus(interview.status)}</span>
          </div>
              
          <div className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-gray-200/60 bg-gray-50/80 text-sm font-semibold">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-800 font-medium">{interview.durationMin} min</span>
            </div>
          </div>
        </div>
              
        {/* Schedule Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center p-2.5 rounded-lg bg-blue-50/80 border border-blue-200/30">
            <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0 mr-3" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-blue-900">Scheduled</div>
              <div className="text-xs text-blue-700">{formatDateTime(interview.scheduledAt).full}</div>
            </div>
          </div>
          <div className="flex items-center p-2.5 rounded-lg bg-gray-50/80 border border-gray-200/30">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0 mr-3" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">Created</div>
              <div className="text-xs text-gray-700">{format(new Date(interview.createdAt), 'dd-MM-yyyy')}</div>
            </div>
          </div>
        </div>
              
      </div>
  );
}