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
  const router = useRouter();

  // useEffect(()=>{
  //   if(interviewDetails===null && session?.user){
  //     const interviewId = params?.interviewId;
  //     fetchInterviewDetails({interviewId});
  //   }
  // },[interviewDetails])

  useEffect(() => {
    if (!session?.user?.token) return;
      const interviewId = params?.interviewId;
      fetchInterviewDetails({interviewId});
  }, [session?.user?.token]);

  const handleStartInterview = (devices) => {
    setSelectedDevices(devices);
    setInterviewStarted(true);
    setIsModalOpen(false);
    
    // Initialize interview with selected devices
    initializeInterview(devices);
  };

  const initializeInterview = async (devices) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          deviceId: devices.audioDeviceId ? { exact: devices.audioDeviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: { 
          deviceId: devices.videoDeviceId ? { exact: devices.videoDeviceId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      });
      
      console.log('Interview stream started with proctored mode');
      // The stream will be managed by InterviewSession component
      
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Failed to start interview. Please check your devices and try again.');
      setInterviewStarted(false);
      setIsModalOpen(true);
    }
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
        console.log("Interview details fetched: ",data);
        setInterviewDetails(data.interview);
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
      {!isCheckingInterview && (
        <InterviewCheckModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onStartInterview={handleStartInterview}
        />
      )}
      
      {interviewStarted && selectedDevices && (
        <SocketProvider user={session?.user} interviewId={interviewDetails?.interviewId}>
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