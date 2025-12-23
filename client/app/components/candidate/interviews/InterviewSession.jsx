'use client';
import Vapi from '@vapi-ai/web';

import { Mic, MicOff, Shield, Clock, AlertCircle, Fullscreen, CheckCircle2, X, AlertTriangle , UserX, Timer, Phone, Maximize } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { errorToast, successToast } from '../../ui/toast';
import { useSocket } from '../../../providers/SocketProvider';

const InterviewSession = ({ devices, onInterviewEnd, onClose, interviewDetails }) => {
  const {data: session} = useSession();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timeRemainingRef = useRef(Number(interviewDetails.durationMin) * 60)
  const [timeRemaining, setTimeRemaining] = useState(timeRemainingRef.current)
  const [violations, setViolations] = useState([]);
  const [micOpen, setMicOpen] = useState(false);
  const [logViolationModalOpen, setLogViolationModalOpen] = useState(false);
  const [showEndInterviewModal, setShowEndInterviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullscreenTimer, setFullscreenTimer] = useState(30);
  const audioRef = useRef(null);
  const liveTranscriptRef = useRef([]);
  const socket = useSocket();
  const lastEmittedMessageRef = useRef(null);

const conversationSample = [
  {
    id: "51aa5945-e43f-4fb6-b212-0c2fa1cc646b",
    speaker: "assistant",
    text: "Hi, thanks for joining today. Can you briefly introduce yourself as a frontend developer?",
    timestamp: "2025-12-15T05:00:00.000Z"
  },
  {
    id: "8b6c8c4f-9d63-4f47-8a1a-9c1c3bda1a01",
    speaker: "user",
    text: "Sure! I’m a frontend developer with experience in React, JavaScript, and modern CSS.",
    timestamp: "2025-12-15T05:00:05.000Z"
  },
  {
    id: "c7cfe3a6-41c3-4f63-bc68-2fdcbd4a1c12",
    speaker: "assistant",
    text: "Great. Can you explain the difference between `let`, `const`, and `var` in JavaScript?",
    timestamp: "2025-12-15T05:00:15.000Z"
  },
  {
    id: "e91a2b44-7f91-4c4f-9d7b-8e0b93c6f221",
    speaker: "user",
    text: "`var` is function-scoped, while `let` and `const` are block-scoped. `const` prevents reassignment.",
    timestamp: "2025-12-15T05:00:22.000Z"
  },
  {
    id: "3b9c7a7e-1c32-4f1e-a7c2-7c99b40df002",
    speaker: "assistant",
    text: "Good. How do you manage state in a React application?",
    timestamp: "2025-12-15T05:00:30.000Z"
  },
  {
    id: "9fdad1d1-b78b-4d61-a7f4-6f77a98bcb11",
    speaker: "user",
    text: "For local state I use useState and useReducer, and for global state I use Context or Redux.",
    timestamp: "2025-12-15T05:00:38.000Z"
  },
  {
    id: "1c8c5b4a-4f62-44dd-8e5f-0a1c87a3d333",
    speaker: "assistant",
    text: "How do you optimize performance in a frontend application?",
    timestamp: "2025-12-15T05:00:45.000Z"
  },
  {
    id: "6d9e2c5f-2a54-4c8a-8a66-7c9e6eaf9222",
    speaker: "user",
    text: "I use memoization, code splitting, lazy loading, and avoid unnecessary re-renders.",
    timestamp: "2025-12-15T05:00:52.000Z"
  },
  {
    id: "b84f17c1-9a3f-46d1-a3fd-3f6b0f1b1444",
    speaker: "assistant",
    text: "Can you explain how the browser rendering process works?",
    timestamp: "2025-12-15T05:01:00.000Z"
  },
  {
    id: "2a7c4e5d-1c25-4a9f-9e3a-7d9a6f88a555",
    speaker: "user",
    text: "The browser parses HTML and CSS, builds the DOM and CSSOM, creates the render tree, then paints.",
    timestamp: "2025-12-15T05:01:08.000Z"
  },
  {
    id: "7f3b1a9c-3b6d-4e42-8b7e-91b0c3a16666",
    speaker: "assistant",
    text: "Nice explanation. How do you handle API errors on the frontend?",
    timestamp: "2025-12-15T05:01:15.000Z"
  },
  {
    id: "4a6f9c8d-71e3-4c35-bf3e-9a8f14b97777",
    speaker: "user",
    text: "I use try/catch, show user-friendly messages, and log errors for debugging.",
    timestamp: "2025-12-15T05:01:22.000Z"
  },
  {
    id: "e1a3b4c6-9f44-4b9e-9d2a-3e6f8c2a8888",
    speaker: "assistant",
    text: "Do you have experience with testing frontend applications?",
    timestamp: "2025-12-15T05:01:30.000Z"
  },
  {
    id: "5c7a1f92-5c42-4f89-9d18-6f0c2d0a9999",
    speaker: "user",
    text: "Yes, I use Jest and React Testing Library for unit and integration tests.",
    timestamp: "2025-12-15T05:01:38.000Z"
  },
  {
    id: "9b2c1f44-0e67-4e32-bd41-7f2a1cbbbbbb",
    speaker: "assistant",
    text: "Excellent. That’s all from my side. Thanks for your time!",
    timestamp: "2025-12-15T05:01:45.000Z"
  }
];
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const timerRef = useRef(null);
  const hasSubmittedRef = useRef(false);

  const vapiRef = useRef(null);
  const interviewStartedRef = useRef(false);

  const [liveTranscript, setLiveTranscript] = useState([]);
  const transcriptContainerRef = useRef(null);

  const startCalledRef = useRef(false);

  const startVideoStream = async () => {
    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = videoStream;
    }
    return videoStream;
  };

  useEffect(() => {
    startVideoStream();
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!startCalledRef.current) { 
      startCalledRef.current = true;
      enterFullscreen();
      startProctoring();
      handleStartInterview();
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (timeRemainingRef.current > 0) {
      timerRef.current = setInterval(() => {
      timeRemainingRef.current -= 1;

      if (timeRemainingRef.current <= 0) {
        clearInterval(timerRef.current);
        setTimeRemaining(0);
        handleSubmit();
        return;
      }
    
      setTimeRemaining(timeRemainingRef.current);
    }, 1000);

    } else {
      handleSubmit();
    }

    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(()=>{
    if(violations.length > 3){
      setIsFullscreen(true);
      setLogViolationModalOpen(false);
      setIsSubmitting(true);
      handleSubmit();
    }
  },[violations])

  useEffect(() => {
    if (!isFullscreen && fullscreenTimer > 0) {
      const interval = setInterval(() => {
        setFullscreenTimer(prev => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
    if (fullscreenTimer === 0) {
      setIsFullscreen(true);
      setLogViolationModalOpen(false);
      setIsSubmitting(true);
      handleSubmit(); 
    }
  }, [isFullscreen, fullscreenTimer]);

  useEffect(() => {
    const setVH = () => {
      document.documentElement.style.setProperty("--vh", window.innerHeight * 0.01 + "px");
    };
    setVH();
    window.addEventListener("resize", setVH);
    return () => window.removeEventListener("resize", setVH);
  }, []);

  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop =
        transcriptContainerRef.current.scrollHeight;
    }
  }, [liveTranscript]);

  // Enter fullscreen mode
  const enterFullscreen = useCallback(async () => {
    setFullscreenTimer(30);
    try {
      if (containerRef.current) {
        // if (containerRef.current.requestFullscreen) {
        //   await containerRef.current.requestFullscreen();
        // } else if (containerRef.current.webkitRequestFullscreen) {
        //   await containerRef.current.webkitRequestFullscreen();
        // } else if (containerRef.current.msRequestFullscreen) {
        //   await containerRef.current.msRequestFullscreen();
        // }
        setIsFullscreen(true);
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
    }
  }, []);

  // Exit fullscreen
  const exitFullscreen = useCallback(() => {
    // if (document.exitFullscreen) {
    //   document.exitFullscreen();
    // } else if (document.webkitExitFullscreen) {
    //   document.webkitExitFullscreen();
    // } else if (document.msExitFullscreen) {
    //   document.msExitFullscreen();
    // }
    setIsFullscreen(false);
  }, []);

  // Disable keyboard shortcuts
  const disableKeyboard = useCallback((event) => {
    const allowedKeys = [
      'Tab', 'Enter', 'Backspace', 'Delete', 
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
    ];
    
    if (event.ctrlKey || event.metaKey || event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      logViolation('Keyboard shortcut attempted');
      return false;
    }

    if (!allowedKeys.includes(event.key) && event.key.length === 1) {
      return true;
    }

    return true;
  }, []);

  // Detect tab switching
  const detectTabSwitch = useCallback(() => {
    if (document.hidden) {
      logViolation('Tab switch detected');
    }
  }, []);

  // Detect right-click
  const disableContextMenu = useCallback((event) => {
    event.preventDefault();
    logViolation('Right-click attempted');
  }, []);

  // Log violations
  const logViolation = useCallback((violation) => {
    setViolations(prev => [...prev, {
      type: violation,
      timestamp: new Date().toISOString(),
      severity: 'medium'
    }]);
    setLogViolationModalOpen(true);
  }, []);

  const startProctoring = useCallback(async () => {
    document.addEventListener('keydown', disableKeyboard);
    document.addEventListener('visibilitychange', detectTabSwitch);
    document.addEventListener('contextmenu', disableContextMenu);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
  },[disableKeyboard, detectTabSwitch, disableContextMenu]);

  const stopProctoring = useCallback(() => {
    document.removeEventListener('keydown', disableKeyboard);
    document.removeEventListener('visibilitychange', detectTabSwitch);
    document.removeEventListener('contextmenu', disableContextMenu);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
  },[disableKeyboard, detectTabSwitch, disableContextMenu]);

  const ensureMicPermission = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
  };

  const handleStartInterview = async () => {
    try{
      if (interviewStartedRef.current) return;
      interviewStartedRef.current = true;

      // 1. Get Vapi assistantId
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/candidate/interview/start`, {
        method: "POST",
        headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`},
        body: JSON.stringify({
          interviewId: interviewDetails?.interviewId
        })
      });

      if (!response.ok) {
        console.error("Failed to start interview session");
      }
      const res = await response.json();
      const assistantId = res?.data?.assistantId;
      await ensureMicPermission();

      // 2. Init Vapi
      const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);
      vapiRef.current = vapi;

      registerVapiListeners();

      vapiRef.current.start(assistantId);
    }
    catch(error){
      console.error("Failed to start interview:", err);
      handleVapiFailure();
    }
  };

  const registerVapiListeners = () => {
    const vapi = vapiRef.current;

    vapi.on("speech-start", () => setMicOpen(false));
    vapi.on("speech-end", () => setMicOpen(true));

    vapi.on("message", (message) => {
      if (message.type !== "transcript") return;
      if (message.transcriptType !== "final") return;
    
      setLiveTranscript((prev) => {
        let updated = [];
        const now = Date.now();
      
        if (prev.length === 0) {
          updated = [
            {
              id: now,
              speaker: message.role,
              text: message.transcript,
              timestamp: now,
            },
          ];
        } else {
          const lastItem = prev[prev.length - 1];
        
          if (lastItem.speaker === message.role) {
            updated = [
              ...prev.slice(0, -1),
              {
                ...lastItem,
                text: `${lastItem.text} ${message.transcript}`,
                timestamp: now,
              },
            ];
          } else {
            updated = [
              ...prev,
              {
                id: now,
                speaker: message.role,
                text: message.transcript,
                timestamp: now,
              },
            ];
          }
        }
      
        // 🔐 keep ref in sync
        liveTranscriptRef.current = updated;
      
        return updated;
      });
    });

    vapi.on("message", (message) => {
      console.log('Message: ',message);
      if (message.type !== "tool-calls") return;
    
      if(message.toolCallList[0].function.name === 'end_interview_session'){
        handleSubmit();
      }
    });

    // ❌ Handle disconnect / error
    vapi.on("disconnect", handleVapiFailure);
    vapi.on("error", handleVapiFailure);

    // 🧠 Optional: detect natural end
    vapi.on("end", () => {
      handleSubmit();
    });

  };

  useEffect(() => {
    console.log('socket', socket);
    if (!socket?.connected) return;
    if (!liveTranscriptRef.current.length) return;

    const last = liveTranscriptRef.current.at(-1);
    // if (last.text === lastEmittedMessageRef.current) return;

    // lastEmittedMessageRef.current = last.text;
    console.log("KKKKKK", last);

    socket.emit("transcript_event", {
      interviewId: interviewDetails?.interviewId,
      interviewDuration: interviewDetails?.durationMin,
      id: last.id,
      text: last.text,
      role: last.speaker,
      timestamp: last.timestamp,
    });
  }, [liveTranscript, socket, liveTranscriptRef.current]);

  const handleEndInterview = async () => {
    const completionMin =
      (interviewDetails?.durationMin * 60 - timeRemainingRef.current) / 60;

    try{
      // 1. End interview session
      const response =await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/candidate/interview/end`, {
        method: "POST",
        headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`},
        body: JSON.stringify({
          interviewId: interviewDetails?.interviewId,
          completionMin,
          interviewConversation: liveTranscriptRef.current
        })
      });
      if (!response.ok){
        console.error("Failed to end interview session");
      }
      const res = await response.json();
      successToast('Interview ended successfully');
    }
    catch(error){
      console.error("Failed to end interview:", error);
    }
  };

  const handleVapiFailure = async () => {
    if (hasSubmittedRef.current) return;
  
    console.error("Vapi disconnected — auto ending interview");
  
    await handleSubmit();
  };
  
  // Handle fullscreen changes
  const handleFullscreenChange = useCallback(() => {
    // const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    // setIsFullscreen(!!fullscreenElement);
    
    // if (!fullscreenElement) {
    //   logViolation('Fullscreen exit attempted');
    //   enterFullscreen();
    // }
  }, [enterFullscreen, logViolation]);

  // Handle submit
  const handleSubmit = async() => {
    setShowEndInterviewModal(false);
    setIsSubmitting(true);
    if (vapiRef.current) {
      console.log("Stopping Vapi call...");
      vapiRef.current.stop();
      vapiRef.current = null;
    }
    await handleEndInterview();
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate submission
    
    stopProctoring();
    setIsSubmitting(false);
    exitFullscreen();
    onInterviewEnd();
    onClose();
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining < 300) return 'text-red-600 bg-red-50 border-red-200';
    if (timeRemaining < 600) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-gray-700 bg-gray-50 border-gray-200';
  };

  return (
      <div 
        ref={containerRef}
        className="fixed inset-0 bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden z-[6666]"
        style={{ height: 'calc(var(--vh) * 100)' }}
      >
        {/* Header */}
        <header className="sticky top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-200 z-10">
          <div className="flex flex-row justify-between items-center gap-1 xs:gap-2 sm:gap-3 px-2 xs:px-3 sm:px-4 lg:px-6 py-2 xs:py-3 sm:py-4 max-w-[100vw] overflow-hidden">
            {/* Left section */}
            <div className="flex items-center flex-1 min-w-0">
              <div className="flex items-center space-x-1 xs:space-x-2 sm:space-x-3 min-w-0 flex-1">
                {/* Logo */}
                <div className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Shield className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-white" />
                </div>

                {/* Title and subtitle */}
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-slate-800 truncate leading-tight">
                    Proctored Interview
                  </h1>
                  <p className="text-[10px] xs:text-xs sm:text-sm text-slate-600 hidden xs:block truncate">
                    AI-powered assessment
                  </p>
                </div>

                {/* Status badge - responsive visibility */}
                <div className={`px-1.5 py-0.5 xs:px-2 xs:py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] xs:text-xs sm:text-sm font-semibold border transition-all flex-shrink-0 
                  text-red-700 bg-red-50 border-red-200 shadow-sm hidden xs:flex ml-1 xs:ml-2`}>
                    <span className="flex items-center space-x-1 xs:space-x-1.5">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                      <span className="hidden sm:inline">REC</span>
                      <span className="hidden md:inline">ORDING</span>
                    </span>
                </div>
              </div>
            </div>
                
            {/* Right section */}
            <div className="flex items-center space-x-1 xs:space-x-2 sm:space-x-3 md:space-x-4 flex-shrink-0">
              {/* Timer */}
              <div className={`flex items-center space-x-0.5 xs:space-x-1 sm:space-x-2 px-1.5 py-0.5 xs:px-2 xs:py-1 sm:px-4 sm:py-2 rounded-lg border ${getTimeColor()} transition-all`}>
                <Clock className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="font-mono font-semibold text-sm xs:text-base sm:text-lg whitespace-nowrap">
                  {formatTime(timeRemaining)}
                </span>
              </div>
                
              {/* Alerts - responsive visibility */}
              <div className={`px-1.5 py-1 xs:px-2 xs:py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-all hidden xs:flex ${
                violations.length > 0 
                  ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm' 
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                <span className="flex items-center space-x-1 xs:space-x-1.5">
                  <AlertCircle className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-xs xs:text-sm">
                    <span className="hidden md:inline">{violations.length} Alert</span>
                    <span className="md:hidden">{violations.length}</span>
                    {violations.length !== 1 && <span className="hidden md:inline">s</span>}
                  </span>
                </span>
              </div>
            
              {/* Fullscreen button - responsive visibility */}
              <button
                onClick={enterFullscreen}
                className="cursor-pointer hidden sm:inline p-1.5 xs:p-2 sm:p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                title="Enter Fullscreen"
              >
                <Fullscreen className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-4 p-4 max-w-[100vw] lg:max-w-7xl mx-auto h-full min-h-0">
          {/* Left Column - Video & AI */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Video Section */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 flex-1 min-h-0">
              <div className="relative h-full bg-slate-900 rounded-xl xs:rounded-2xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Recording Indicator */}
                <div className="absolute top-2 xs:top-3 sm:top-4 left-2 xs:left-3 sm:left-4 flex items-center space-x-1 xs:space-x-2 bg-black/80 backdrop-blur-sm px-2 xs:px-3 py-1 xs:py-2 rounded-lg border border-slate-700">
                  <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs xs:text-sm text-white font-medium">Live</span>
                </div>

                {/* Controls */}
                <div className="absolute bottom-2 xs:bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 xs:gap-3 sm:gap-4">
                  {/* Mic Button */}
                  <button
                    onClick={() => setMicOpen(!micOpen)}
                    className={`cursor-pointer rounded-full p-2 xs:p-2.5 sm:p-3 md:p-4 transition-all duration-200 shadow-lg backdrop-blur-sm
                      ${
                        micOpen
                          ? "bg-white/20 hover:bg-white/30 text-white border border-white/30"
                          : "bg-red-500/90 hover:bg-red-600 text-white border border-red-400"
                      }
                    `}
                    aria-label={micOpen ? "Mute microphone" : "Unmute microphone"}
                  >
                    {micOpen ? 
                      <Mic className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" /> : 
                      <MicOff className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                    }
                    <audio ref={audioRef} autoPlay hidden />
                  </button>

                  {/* Phone Button - only small screens */}
                  <button
                    onClick={() => setShowEndInterviewModal(true)}
                    className="cursor-pointer rounded-full p-2 xs:p-2.5 sm:p-3 md:p-4 transition-all duration-200 shadow-lg backdrop-blur-sm bg-red-500/90 hover:bg-red-600 text-white border border-red-400"
                  >
                    <Phone className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rotate-135" />
                  </button>
                </div>

                {/* Status Bar - responsive visibility */}
                <div className="hidden sm:flex absolute bottom-2 xs:bottom-3 sm:bottom-4 right-2 xs:right-3 sm:right-4 bg-black/80 backdrop-blur-sm px-2 xs:px-3 py-1 xs:py-2 rounded-lg border border-slate-700">
                  <div className="text-[10px] xs:text-xs text-slate-300 space-y-0.5 xs:space-y-1">
                    <div className="flex items-center space-x-1 xs:space-x-2">
                      <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-emerald-500 rounded-full"></div>
                      <span>Camera</span>
                    </div>
                    <div className="flex items-center space-x-1 xs:space-x-2">
                      <div className={`w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full ${micOpen ? "bg-emerald-500" : "bg-red-500"}`}></div>
                      <span className="text-[10px] xs:text-xs">Mic {micOpen ? "On" : "Off"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Section */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 shrink-0">
              <div className="flex flex-row items-center space-x-2 xs:space-x-3 sm:space-x-4">
                <div className="relative">
                  <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl xs:rounded-2xl flex items-center justify-center shadow-lg">
                    <div className="flex space-x-0.5 xs:space-x-1">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 h-3 xs:h-4 sm:h-5 md:h-6 bg-white rounded-full animate-wave"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-1 h-1 xs:w-1.5 xs:h-1.5 bg-white rounded-full"></div>
                  </div>
                </div>
                    
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 text-sm xs:text-base sm:text-lg md:text-xl">AI Interview Assistant</h3>
                  <p className="text-xs xs:text-sm sm:text-base text-slate-600 mt-0.5 xs:mt-1 truncate">
                    {micOpen ? "Listening to your response..." : "Ready for your answer"}
                  </p>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 xs:h-2 mt-1 xs:mt-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 xs:h-2 rounded-full transition-all duration-500"
                      style={{ width: micOpen ? '85%' : '30%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-2/5 flex flex-col gap-4 min-h-0">

            {/* Full Conversation */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 flex-1 min-h-0 flex flex-col">

              <h3 className="font-semibold text-slate-800 text-sm sm:text-base mb-3">
                Interview Conversation
              </h3>

              {/* Scrollable Conversation Area */}
              <div
                ref={transcriptContainerRef}
                className="overflow-y-auto space-y-3 pr-2 min-h-[400px] max-h-[400px]"
              >
                {liveTranscriptRef.current.map((item, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      item.speaker === "assistant"
                        ? "justify-start"
                        : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-xs sm:text-sm leading-relaxed ${
                        item.speaker === "assistant"
                          ? "bg-slate-100 text-slate-800"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      <p>{item.text}</p>
                      <span className="block text-[10px] opacity-60 mt-1 text-right">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
              
            {/* Guidelines */}
            <div className="space-y-4 shrink-0">
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-sm sm:text-base">Interview Guidelines</span>
                </h4>
              
                <div className="space-y-2">
                  {[
                    "Keep your face visible in the camera",
                    "Do not switch tabs or applications",
                    "Avoid using keyboard shortcuts",
                    "Ensure stable internet connection",
                    "The interview will auto-submit when time ends"
                  ].map((guideline, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-xs sm:text-sm text-slate-600"
                    >
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-1" />
                      <span>{guideline}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
                
          </div>
                
        </div>
      </main>

        {/* Footer Controls */}
        {/* <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-lg border-t border-slate-200 p-2 xs:p-3 sm:p-4 z-10">
          <div className="flex flex-col xs:flex-row justify-between items-center gap-2 xs:gap-3 sm:gap-4 max-w-[100vw] lg:max-w-7xl mx-auto">
            <div className="flex items-center space-x-1 xs:space-x-2 text-xs xs:text-sm sm:text-base text-slate-600 w-full xs:w-auto justify-center xs:justify-start">
              <Shield className="w-3 h-3 xs:w-4 xs:h-4 text-blue-600 flex-shrink-0" />
              <span className="text-center xs:text-left truncate">This interview is being recorded and monitored for security purposes</span>
            </div>

            <div className="flex flex-row gap-2 xs:gap-3 w-full xs:w-auto justify-center xs:justify-end">
              {questionsOver && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-4 xs:px-6 sm:px-8 py-2 xs:py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg xs:rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg flex items-center space-x-1 xs:space-x-2 justify-center flex-1 xs:flex-none text-xs xs:text-sm sm:text-base"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3 h-3 xs:w-4 xs:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 xs:w-4 xs:h-4" />
                      <span>Submit Interview</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => setShowEndInterviewModal(true)}
                className="cursor-pointer px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 text-xs xs:text-sm sm:text-base bg-red-600 text-white rounded-lg xs:rounded-xl font-semibold hover:bg-red-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-1 xs:space-x-2 justify-center flex-1 xs:flex-none"
              >
                <Phone className="w-3 h-3 xs:w-4 xs:h-4 rotate-135 hidden xs:inline" />
                <span>End Interview</span>
              </button>
            </div>
          </div>
        </footer> */}

        {/* Fullscreen Modal */}
        {!isFullscreen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[99] p-2 xs:p-3 sm:p-4">
            <div className="bg-white backdrop-blur-xl rounded-lg xs:rounded-xl sm:rounded-2xl p-4 xs:p-6 sm:p-8 max-w-xs xs:max-w-sm sm:max-w-md w-full shadow-xl border border-slate-200">
        
              <div className="w-12 h-12 xs:w-16 xs:h-16 sm:w-20 sm:h-20 bg-blue-50 rounded-lg xs:rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 xs:mb-6 shadow-inner">
                <Maximize className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-blue-600" />
              </div>
        
              <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-slate-900 mb-1 xs:mb-2 text-center">
                Fullscreen Required
              </h2>
        
              <p className="text-slate-600 mb-3 xs:mb-4 text-center text-xs xs:text-sm sm:text-base leading-relaxed">
                Please enable fullscreen mode to continue your secure interview session.
              </p>
        
              <p className="text-red-600 font-semibold text-center mb-4 xs:mb-6 text-sm xs:text-base">
                Returning in: <span className="text-red-700">{fullscreenTimer}</span>s
              </p>
        
              <button
                onClick={enterFullscreen}
                className="cursor-pointer w-full py-2.5 xs:py-3 sm:py-3.5 bg-blue-600 text-white rounded-lg xs:rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm xs:text-base"
              >
                Enter Fullscreen
              </button>
            </div>
          </div>
        )}

        {/* Violation Warning */}
        {logViolationModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 xs:p-3 sm:p-4">
            <div className="bg-white backdrop-blur-md rounded-lg xs:rounded-xl sm:rounded-2xl p-4 xs:p-6 sm:p-8 max-w-xs xs:max-w-sm sm:max-w-md w-full shadow-xl border border-slate-200">
              <div className="w-12 h-12 xs:w-16 xs:h-16 sm:w-20 sm:h-20 bg-red-50 rounded-lg xs:rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 xs:mb-6 shadow-inner">
                <AlertTriangle className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-red-500" />
              </div>
        
              <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-slate-800 mb-1 xs:mb-2 text-center">
                Violation Detected
              </h2>
              <p className="text-slate-600 mb-3 xs:mb-4 text-center text-xs xs:text-sm sm:text-base">
                Violations:{" "}
                <span className="font-semibold text-red-500">
                  {violations.length}
                </span>
              </p>
        
              <div className="bg-red-50 text-red-700 text-xs xs:text-sm px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg border border-red-200 text-center mb-4 xs:mb-6">
                {violations.length < 3 ? 'After 3 violations, the interview will auto-terminate.' : 'Now onwards, any violation will auto-terminate the interview.'}
              </div>
        
              <button
                onClick={()=>{setLogViolationModalOpen(false); enterFullscreen();}}
                className="cursor-pointer w-full py-2.5 xs:py-3 sm:py-4 bg-blue-600 text-white rounded-lg xs:rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm xs:text-base sm:text-lg"
              >
                Continue
              </button>
            </div>
          </div>
        )}

         {/* End Interview Modal */}
        {showEndInterviewModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 xs:p-3 sm:p-4">
            <div className="bg-white/90 backdrop-blur-md rounded-lg xs:rounded-xl sm:rounded-2xl max-w-xs xs:max-w-sm sm:max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">

              <div className="px-3 xs:px-4 py-2 xs:py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1 xs:gap-2">
                  <UserX className="w-4 h-4 xs:w-5 xs:h-5 text-slate-700" />
                  <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-slate-900">
                    End Interview
                  </h3>
                </div>
        
                <button
                  onClick={() => setShowEndInterviewModal(false)}
                  className="cursor-pointer p-1 xs:p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-4 h-4 xs:w-5 xs:h-5" />
                </button>
              </div>
        
              <div className="p-3 xs:p-4 sm:p-6 bg-white">
                <p className="text-sm xs:text-base sm:text-lg font-medium text-slate-900 leading-relaxed mb-4 xs:mb-6">
                  Are you sure you want to end the interview & submit your responses?
                </p>
        
                <div className="flex flex-row justify-end gap-2 xs:gap-3">
                  <button
                    onClick={() => setShowEndInterviewModal(false)}
                    className="cursor-pointer px-3 xs:px-4 py-1.5 xs:py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition-colors text-xs xs:text-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={()=> {handleSubmit();}}
                    className="cursor-pointer px-3 xs:px-4 py-1.5 xs:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs xs:text-sm"
                  >
                    Proceed
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Automatic submission */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 xs:p-3 sm:p-4 cursor-progress">
            <div className="bg-white backdrop-blur-md rounded-lg xs:rounded-xl sm:rounded-2xl p-4 xs:p-6 sm:p-8 max-w-xs xs:max-w-sm sm:max-w-md w-full shadow-xl border border-slate-200">
              <div className="w-12 h-12 xs:w-16 xs:h-16 sm:w-20 sm:h-20 bg-blue-50 rounded-lg xs:rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 xs:mb-6 shadow-inner animate-pulse">
                <Timer className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-blue-600" />
              </div>
              <h2 className="text-lg xs:text-xl sm:text-2xl font-semibold text-slate-800 mb-2 xs:mb-3 text-center">
                Submitting responses…
              </h2>
              <p className="text-slate-600 text-center text-xs xs:text-sm sm:text-base">
                Please wait
              </p>
            </div>
          </div>
        )}
        </div>
    );
  }

  export default InterviewSession;