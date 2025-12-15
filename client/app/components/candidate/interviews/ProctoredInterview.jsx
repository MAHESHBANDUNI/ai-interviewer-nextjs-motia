'use client';

import { Mic, MicOff, Shield, Clock, AlertCircle, Fullscreen, CheckCircle2, X, AlertTriangle , UserX, Timer, Phone, Maximize } from 'lucide-react';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { errorToast, successToast } from '../../ui/toast';

const ProctoredInterview = ({ devices, onInterviewEnd, onClose, interviewDetails }) => {
  const {data: session} = useSession();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timeRemainingRef = useRef(Number(interviewDetails.durationMin) * 60)
  const [timeRemaining, setTimeRemaining] = useState(timeRemainingRef.current)
  const [currentQuestion, setCurrentQuestion] = useState({});
  const [violations, setViolations] = useState([]);
  const [userAnswer, setUserAnswer] = useState({});
  const [micStream, setMicStream] = useState(null);
  const [micOpen, setMicOpen] = useState(false);
  const [questionsOver, setQuestionsOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logViolationModalOpen, setLogViolationModalOpen] = useState(false);
  const [showEndInterviewModal, setShowEndInterviewModal] = useState(false);
  const [isAutomaticallySubmitting, setIsAutomaticallySubmitting] = useState(false);
  const [fullscreenTimer, setFullscreenTimer] = useState(30);
  const [aiInterviewerInput, setAiInterviewerInput] = useState('');
  const audioRef = useRef(null);
  const voicePauseTimeout = useRef(null);
  const [loadingVoiceResponse, setLoadingVoiceResponse] = useState(false);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState('');
  const [assemblyAIToken, setAssemblyAIToken] = useState('');
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const containerRef = useRef(null);
  const timerRef = useRef(null);
  const hasSubmittedRef = useRef(false);

  const socket = useRef(null);
  const audioContext = useRef(null);
  const mediaStream = useRef(null);
  const processorRef = useRef(null);
  const cancelRecordingRef = useRef(false);

  const [transcript, setTranscript] = useState("");

  const startCalledRef = useRef(false);

  useEffect(() => {
    if (!startCalledRef.current && !isInterviewStarted) { 
      startCalledRef.current = true;
      startProctoring();
      handleStartInterview();
    }
  }, []);

  // Initialize fullscreen and proctoring
  useEffect(() => {
    enterFullscreen();
      // toggleMic();

    return () => {
      setMicOpen(false);
      exitFullscreen();
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (timeRemainingRef.current > 0) {
      timerRef.current = setInterval(() => {
      timeRemainingRef.current -= 1;

      if (timeRemainingRef.current <= 0) {
        clearInterval(timerRef.current);
        setTimeRemaining(0);
        handleAutoSubmit();
        return;
      }
    
      setTimeRemaining(timeRemainingRef.current);
    }, 1000);

    } else {
      handleAutoSubmit();
    }

    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(()=>{
    if(violations.length > 3){
      setIsFullscreen(true);
      setLogViolationModalOpen(false);
      setIsAutomaticallySubmitting(true);
      handleAutoSubmit();
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
      setIsAutomaticallySubmitting(true);
      handleAutoSubmit(); 
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

  // Enter fullscreen mode
  const enterFullscreen = useCallback(async () => {
    setFullscreenTimer(30);
    try {
      if (containerRef.current) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if (containerRef.current.webkitRequestFullscreen) {
          await containerRef.current.webkitRequestFullscreen();
        } else if (containerRef.current.msRequestFullscreen) {
          await containerRef.current.msRequestFullscreen();
        }
        setIsFullscreen(true);
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
    }
  }, []);

  // Exit fullscreen
  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    setIsFullscreen(false);
  }, []);

  useEffect(()=>{
    if(!candidateProfile){
      fetchCandidateResumeProfile();
    }
  },[])

  const fetchCandidateResumeProfile = async() => {
    if(!session.user) return ;
    try{
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/candidate/details`,{
        method: 'GET',
        headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`}
      })
      if(!response.ok){
        console.error('Error fetching candidate details');
      }
      if(response.ok){
        const res = await response.json();
        setCandidateProfile(res?.candidate);
      }
    }
    catch(err){
      console.error('Error fetching candidate details',err);
    }
  }

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

  const handleStartInterview = async() => {
    if (!session.user || !interviewDetails?.interviewId) return;
    try{
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/candidate/interview/session/start`, {
        method: 'POST',
        headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`},
        body: JSON.stringify({interviewId: interviewDetails?.interviewId})
      })
      if(!response.ok){
        console.error('Error starting interview');
      }
      else if(response.ok){
        setIsInterviewStarted(true);
        const res = await response.json();
        setCurrentQuestion(res.data);
        setTranscript('');
        setAiInterviewerInput(res?.data?.question);
      }
    }
    catch(err){
      console.error('Error starting interview',err);
    }
  }

  const handleEndInterview = async() => {
    if (!session.user || !interviewDetails?.interviewId) return;
      
    const remaining = timeRemainingRef.current;
    const completionMin = (
      interviewDetails.durationMin - (remaining / 60)
    ).toFixed(2);

    try{
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/candidate/interview/session/end`, {
        method: 'POST',
        headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`},
        body: JSON.stringify({interviewId: interviewDetails?.interviewId, candidateId: session?.user?.id, completionMin: completionMin})
      })
      if(!response.ok){
        console.error('Error ending interview');
      }
      else if(response.ok){
        successToast('Interview completed successfully');
      }
    }
    catch(err){
      console.error('Error ending interview',err);
    }
  }

  const handleQuestionGenerate = async(aiFeedback) => {
    const remaining = timeRemainingRef.current;
    const remainingDuration = (remaining / 60).toFixed(2);
    try{
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/candidate/interview/session/conversation/generate`, {
        method: 'POST',
        headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`},
        body: JSON.stringify({interviewId: interviewDetails.interviewId, candidate: candidateProfile, remainingDuration: remainingDuration, interviewDuration: interviewDetails?.durationMin})
      })
      if(!response.ok){
        console.error('Error generating question');
      }
      else if(response.ok){
        const res = await response.json();
        setCurrentQuestion({question: res?.data?.question, difficultyLevel: res?.data?.difficultyLevel, section: res?.data?.section});
        if(aiFeedback === false){
          setAiInterviewerInput(res?.data?.question);
        }
        else if(aiFeedback === true){
          setAiInterviewerInput(res?.data?.previousQuestionFeedback + '. Now lets move to the next question. ' + res?.data?.question);
        }
        setTranscript('');
      }
    }
    catch(err){
      console.error('Error generating question');
    }
  }

  const handleCandidateResponseModeration = async() =>{
    try{
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/candidate/interview/session/response`, {
        method: 'POST',
        headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`},
        body: JSON.stringify({interviewId: interviewDetails.interviewId, candidateId: session?.user?.id, question: currentQuestion['question'], candidateAnswer: transcript})
      })
      if(!response.ok){
        console.error('Error moderating candidate response');
      }
      else if(response.ok){
        const res = await response.json();
        return res;
      }
    }
    catch(err){
      console.error('Error moderating candidate response');
    }
  }

  const handleGenerateAiFeedback = async() => {
    console.log("Feedback generator: ",transcript);
    try{
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/candidate/interview/session/conversation/feedback`,
        {
          method: 'POST',
          headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`},
          body: JSON.stringify({question: currentQuestion['question'], candidateAnswer: transcript, difficultyLevel: currentQuestion['difficultyLevel'], section: currentQuestion['section'], interviewId: interviewDetails?.interviewId, resumeProfile: candidateProfile?.resumeProfile})
        }
      );
      if(!response.ok){
        console.error('Error generating feedback');
      }
      else if(response.ok){
        const res = await response.json();
        return res;
      }
    }
    catch(err){
      console.error('Error generating feedback: ',err);
    }
  }

  const stopMic = () => {
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      setMicStream(null);
    }
    setMicOpen(false);
    console.log('🔇 Microphone stopped');
  };

  // Get assembly ai token
  const getToken = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/assemblyai/token`);
      const data = await res.json();
      if (!data?.token) {
        errorToast('Failed to get token');
        await handleAutoSubmit();
        return null;
      }
      setAssemblyAIToken(data?.token);
      return data?.token;
    } catch (err) {
      console.error('Failed to fetch AssemblyAI token:', err);
      return null;
    }
  };

  // Transcript logger
  useEffect(()=>{
    if(transcript != []){
      console.log('Transcript: ',transcript);
    }
  },[transcript])

  // Call handle speak since AI interview input is non-empty
  useEffect(() => {
    if (aiInterviewerInput != '') {
      handleSpeak();
    }
  }, [aiInterviewerInput])

  // Call this whenever transcript updates
  useEffect(() => {
    if (!transcript.trim()) return;

    // Clear existing timeout
    if (voicePauseTimeout.current) clearTimeout(voicePauseTimeout.current);

    // Set new timeout (e.g., 7000ms after user stops speaking)
    voicePauseTimeout.current = setTimeout(() => {
      handleVoicePause();
    }, 7000);

    return () => clearTimeout(voicePauseTimeout.current);
  }, [transcript]);

  const handleSpeak = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/tts/audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiInterviewerInput}),
      });

      if (!res.ok) {
        console.error("TTS API error:", await res.text());
        // alert("Failed to generate speech.");
        // setAskingAiInterviewer(false);
        return;
      }

      // setAskingAiInterviewer(false);

      const blob = await res?.blob();
      const audioUrl = URL.createObjectURL(blob);

      // 🎧 Auto play (hidden audio element)
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play().catch(() => {
          console.warn("Autoplay blocked — user interaction needed.");
        });
        
        audioRef.current.onended = () => {
          startStreaming();
        };
      }

      // 🧹 Clean up
      setTimeout(() => URL.revokeObjectURL(audioUrl), 100000);
    } catch (err) {
      console.error("TTS Error:", err);
      // alert("Error generating speech.");
    } finally {
      //setTranscript('');
      // setAiInterviewerInput(null);
    }
  };

  const handleVoicePause = async() => {
    if (!transcript) return;
    let response='';
    setUserAnswer(transcript);
    stopStreaming();
    if (Object.keys(currentQuestion).length > 0) {
      response = await handleCandidateResponseModeration();
    }
    if(!response || response === null || response === ''){
      setAiInterviewerInput("I'm sorry, I couldn't process your request. Please try again.");
      return;
    }
    if(response?.data?.action){
      if(response.data.action === 'confirm'){
        setCurrentQuestion({question: response.data.message, difficultyLevel: 2});
        setAiInterviewerInput(response.data.message);
      }
      else if(response.data.action === 'next_step'){
        await handleGenerateAiFeedback();
        const aiFeedback= true;
        await handleQuestionGenerate(aiFeedback);
      }
      else if(response.data.action === 'proceed'){
        await handleQuestionGenerate();
      }
      }
  }

  const startAudioStream = async () => {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
  };

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

  // Start proctoring
  const startStreaming = useCallback(async () => {
    cancelRecordingRef.current = false; 
    const token = assemblyAIToken? assemblyAIToken : await getToken();
    if (!token) return;

    const wsUrl = `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&formatted_finals=true&token=${token}`;
    socket.current = new WebSocket(wsUrl);

    const turns = {};

    socket.current.onopen = async () => {
      if (cancelRecordingRef.current) {
        console.log("⛔ Recording canceled before WebSocket fully connected");
        socket.current.close();
        socket.current = null;
        return;
      }
      console.log('✅ WebSocket connected');
      setMicOpen(true);
      
      mediaStream.current = await startAudioStream();

      audioContext.current = new AudioContext({ sampleRate: 16000 });
      await audioContext.current.audioWorklet.addModule('/processor.js');

      const source = audioContext.current.createMediaStreamSource(mediaStream.current);
      const processor = new AudioWorkletNode(audioContext.current, 'processor');

      // Send each audio chunk to the websocket
      processor.port.onmessage = (event) => {
        const input = event.data;

        if (!socket.current || socket.current.readyState !== WebSocket.OPEN) return;

        const buffer = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          buffer[i] = Math.max(-1, Math.min(1, input[i])) * 0x7fff;
        }
        socket.current.send(buffer.buffer);
      };

      source.connect(processor);
      processor.connect(audioContext.current.destination);

      processorRef.current = processor;
    };

    socket.current.onmessage = (event) => {
      console.log('📡 WebSocket message received',micOpen);
      const message = JSON.parse(event.data);
      if (message.type === 'Turn') {
        const { turn_order, transcript } = message;
        turns[turn_order] = transcript;

        const ordered = Object.keys(turns)
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => turns[k])
          .join(' ');
        setTranscript(ordered);
        setUserAnswer(ordered);
      }
    };

    socket.current.onerror = (err) => {
      console.error('WebSocket error:', err);
      stopStreaming();
    };

    socket.current.onclose = (event) => {
      console.log('🔒 WebSocket closed');
      socket.current = null;
    };
  },[devices]);

  const startProctoring = useCallback(async () => {
    document.addEventListener('keydown', disableKeyboard);
    document.addEventListener('visibilitychange', detectTabSwitch);
    document.addEventListener('contextmenu', disableContextMenu);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
  },[disableKeyboard, detectTabSwitch, disableContextMenu]);

  // Stop proctoring
  const stopStreaming = useCallback(() => {
    setMicOpen(false);

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
    }

    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => {
        if (track.kind === "audio") track.stop();
      });
    }

    if (socket.current) {
      try {
        socket.current.send(JSON.stringify({ type: 'Terminate' }));
      } catch {}
      socket.current.close();
      socket.current = null;
    }
  },[devices]);

  const stopProctoring = useCallback(() => {
    document.removeEventListener('keydown', disableKeyboard);
    document.removeEventListener('visibilitychange', detectTabSwitch);
    document.removeEventListener('contextmenu', disableContextMenu);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
  },[disableKeyboard, detectTabSwitch, disableContextMenu]);

  // Handle fullscreen changes
  const handleFullscreenChange = useCallback(() => {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    setIsFullscreen(!!fullscreenElement);
    
    if (!fullscreenElement) {
      logViolation('Fullscreen exit attempted');
      enterFullscreen();
    }
  }, [enterFullscreen, logViolation]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    await handleEndInterview();
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate submission
    
    stopStreaming();
    stopProctoring();
    exitFullscreen();
    onInterviewEnd();
    setShowEndInterviewModal(false);
    onClose();
  }, [stopStreaming, exitFullscreen, onInterviewEnd]);

  // Auto submit when time ends
  const handleAutoSubmit = useCallback(async () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setIsAutomaticallySubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    await handleSubmit();
    setIsAutomaticallySubmitting(false);
  }, [handleSubmit]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMic = () => {
    setMicOpen((v) => !v);
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
                <div className={`px-1.5 py-0.5 xs:px-2 xs:py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] xs:text-xs sm:text-sm font-semibold border transition-all flex-shrink-0 ${
                  isInterviewStarted 
                    ? 'text-red-700 bg-red-50 border-red-200 shadow-sm' 
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                } hidden xs:flex ml-1 xs:ml-2`}>
                  {isInterviewStarted ? (
                    <span className="flex items-center space-x-1 xs:space-x-1.5">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                      <span className="hidden sm:inline">REC</span>
                      <span className="hidden md:inline">ORDING</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 xs:space-x-1.5">
                      <CheckCircle2 className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                      <span className="hidden sm:inline">SECURE</span>
                    </span>
                  )}
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
        <main className="flex-1 overflow-y-auto min-h-0">
          <div className="flex flex-col lg:flex-row gap-4 p-4 max-w-[100vw] lg:max-w-7xl mx-auto">
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

          {/* Right Column - Questions & Info */}
          <div className="w-full lg:w-2/5 flex flex-col gap-4 min-h-0">
            {/* Current Question */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 flex-1 min-h-0">
              <div>
                <h3 className="font-semibold text-slate-800 text-xs xs:text-sm sm:text-base md:text-lg mb-1 xs:mb-2 sm:mb-3">Asked Question</h3>
             
              {/* Question Box */}
              <div className="bg-slate-50 rounded-lg xs:rounded-xl p-2 xs:p-3 sm:p-4 border border-slate-200 mb-2 xs:mb-3 sm:mb-4 md:mb-6">
                <p className="text-slate-700 leading-relaxed text-xs sm:text-sm md:text-md h-16 xs:h-20 sm:h-24 md:h-32 overflow-y-auto">
                  {currentQuestion['question']}
                </p>
              </div>
               </div>

              {/* Answer Input */}
              <div>
                <label className="block text-xs xs:text-sm sm:text-base md:text-lg font-semibold text-slate-700 mb-1 xs:mb-2 sm:mb-3">
                  Your Response
                </label>
                <textarea
                  value={transcript}
                  readOnly
                  className="w-full h-16 xs:h-20 sm:h-32 md:h-40 p-2 xs:p-3 sm:p-4 text-xs sm:text-sm md:text-md bg-white border border-slate-300 rounded-lg xs:rounded-xl text-slate-700 placeholder-slate-400 resize-none shadow-sm overflow-y-auto leading-relaxed"
                  placeholder="Your response..."
                />
              </div>
            </div>
                

            {/* Guidelines & Alerts */}
            <div className="space-y-4 shrink-0">
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <h4 className="font-semibold text-slate-800 mb-2 xs:mb-3 flex items-center space-x-1 xs:space-x-2">
                  <Shield className="w-3 h-3 xs:w-4 xs:h-4 text-blue-600" />
                  <span className="text-sm xs:text-base sm:text-lg">Interview Guidelines</span>
                </h4>
                <div className="space-y-1 xs:space-y-2">
                  {[
                    "Keep your face visible in the camera",
                    "Do not switch tabs or applications",
                    "Avoid using keyboard shortcuts",
                    "Ensure stable internet connection",
                    "The interview will auto-submit when time ends"
                  ].map((guideline, index) => (
                    <div key={index} className="flex items-start space-x-1.5 xs:space-x-2 sm:space-x-3 text-xs xs:text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-blue-400 rounded-full flex-shrink-0 mt-0.5 xs:mt-1"></div>
                      <span className="leading-relaxed">{guideline}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* {violations.length > 0 && (
                <div className="bg-amber-50 rounded-xl xs:rounded-2xl shadow-lg border border-amber-200 p-3 xs:p-4 sm:p-5">
                  <h4 className="font-semibold text-amber-800 mb-2 xs:mb-3 flex items-center space-x-1 xs:space-x-2">
                    <AlertCircle className="w-3 h-3 xs:w-4 xs:h-4 text-amber-600" />
                    <span className="text-sm xs:text-base sm:text-lg">Proctoring Alerts</span>
                  </h4>
                  <div className="space-y-1 xs:space-y-2 max-h-24 xs:max-h-28 sm:max-h-32 overflow-y-auto">
                    {violations.slice(-3).map((violation, index) => (
                      <div key={index} className="text-xs xs:text-sm bg-amber-100/50 px-2 xs:px-3 py-1.5 xs:py-2 rounded-lg border border-amber-200">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-amber-800 truncate">{violation.type}</span>
                          <span className="text-[10px] xs:text-xs text-amber-600 opacity-75 flex-shrink-0 ml-2">
                            {new Date(violation.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )} */}
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
                    onClick={()=> {handleAutoSubmit();}}
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
        {isAutomaticallySubmitting && (
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

  export default ProctoredInterview;