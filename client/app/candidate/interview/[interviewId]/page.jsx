'use client';

import { useState, useEffect, useRef } from 'react';
import InterviewCheckModal from '../../../components/candidate/interviews/InterviewCheckModal';
import InterviewSession from '../../../components/candidate/interviews/InterviewSession';
import { errorToast } from '@/app/components/ui/toast';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SocketProvider } from '../../../providers/SocketProvider';

export default function InterviewPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const params = useParams();
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState(null);
  const [interviewDetails, setInterviewDetails] = useState(null);
  const {data: session} = useSession();
  const [isCheckingInterview, setIsCheckingInterview] = useState(true);
  const [interviewSessionToken, setInterviewSessionToken] = useState(null);
  const router = useRouter();
  useEffect(() => {
    if (!session?.user?.token) return;
      const interviewId = params?.interviewId;
      fetchInterviewDetails({interviewId});
  }, [session?.user?.token]);

  const handleStartInterview = (devices) => {
    setSelectedDevices(devices); // now includes screenStream
    setInterviewStarted(true);
    setIsModalOpen(false);
  };


  const handleCloseModal = () => {
    setIsModalOpen(false);
    window.location.href = '/candidate/interviews';
  };

  const handleInterviewEnd = () => {
    setInterviewStarted(false);
    setSelectedDevices(null);
    setIsModalOpen(true);
    // Add any cleanup or submission logic here
  };

  const fetchInterviewDetails = async({interviewId}) => {
    if(!interviewId || !session?.user) return ;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/candidate/interview/${interviewId}`,
       {
          method: 'GET',
          headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`}
        }
      );
      if(!response.ok){
        errorToast('Problem fetching interview details');
        router.push('/');
      }
      if(response.ok){
        const data = await response.json();
        const {interview, interviewSessionToken} = data.data;
        setInterviewDetails(interview);
        setInterviewSessionToken(interviewSessionToken);
      }
    }
    catch(err){
      console.error("Error fetching interview details: ",err);
    }
    finally{
      setIsCheckingInterview(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {isCheckingInterview && 
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-999" onClick={handleCloseModal}>
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col"
            >
              <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-2 sm:p-4">
                <div 
                  className="pointer-events-auto relative w-full max-w-7xl rounded-2xl shadow-2xl bg-white dark:bg-gray-900 flex flex-col h-auto max-h-[95vh] p-8 sm:p-12"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header Skeleton */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-48 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
                        <div className="h-3 w-32 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 animate-pulse rounded"></div>
                      </div>
                    </div>
                    <div className="h-10 w-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded-lg"></div>
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-1 flex flex-col lg:flex-row gap-6">
                    {/* Video Panel Skeleton */}
                    <div className="flex-1 space-y-4">
                      <div className="aspect-video rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse relative overflow-hidden">
                        {/* Animated video placeholder */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative">
                            <div className=" text-center">
                              <div className="inline-flex items-center gap-3">
                                <div className="relative">
                                  <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                                </div>
                                <div className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">
                                  Joining interview...
                                </div>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                                Please wait while we establish a secure connection
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Controls Skeleton */}
                      <div className="flex items-center justify-center gap-4 p-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div 
                            key={i}
                            className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse"
                          ></div>
                        ))}
                      </div>
                    </div>
                      
                    {/* Side Panel Skeleton */}
                    <div className="lg:w-80 space-y-6">
                      {/* Timer */}
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <div className="h-4 w-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded mb-2"></div>
                        <div className="h-8 w-32 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 animate-pulse rounded"></div>
                      </div>
                      
                      {/* Question */}
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <div className="h-4 w-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded mb-3"></div>
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
                          <div className="h-3 w-4/5 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
                          <div className="h-3 w-3/4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <div className="h-4 w-28 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded mb-3"></div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
                          <div className="h-3 w-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      }
      {!isCheckingInterview && (
        <InterviewCheckModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onStartInterview={handleStartInterview}
        />
      )}
      
      {interviewStarted && selectedDevices && (
        <SocketProvider user={session?.user} interviewId={interviewDetails?.interviewId} interviewSessionToken={interviewSessionToken}>
        <InterviewSession
          devices={selectedDevices}
          onInterviewEnd={handleInterviewEnd}
          onClose={handleCloseModal}
          interviewDetails={interviewDetails}
        />
        </SocketProvider>
      )}
    </div>
  );
}