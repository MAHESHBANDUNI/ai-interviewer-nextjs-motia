'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const InterviewCheckModal = ({ isOpen, onClose, onStartInterview }) => {
  const [micPermission, setMicPermission] = useState('pending');
  const [cameraPermission, setCameraPermission] = useState('pending');
  const [isChecking, setIsChecking] = useState(true);
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [videoStream, setVideoStream] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [activeTab, setActiveTab] = useState('devices');

  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationFrameRef = useRef(null);

  const interviewInstructions = [
    "Ensure you are in a quiet, well-lit environment",
    "Make sure your face is clearly visible in the camera",
    "Test your microphone and camera before starting",
    "The interview will consist of several questions",
    "You cannot pause or re-record your answers",
    "Proctored violations activities:- Switching tabs or applications, escaping the fullscreen, keyboard shortcuts and right click",
    "Ensure you have a stable internet connection",
    "Close all unnecessary applications on your device",
    "Be careful, after exceeding three proctored alerts limit, the interview will be submitted automatically"
  ];

 // -------------------------
  // Audio analysis
  // -------------------------
  const initAudioAnalysis = useCallback(async (stream) => {
    try {
      console.log('initAudioAnalysis');

      // close existing audio context if present (fresh start)
      if (audioContextRef.current) {
        try {
          await audioContextRef.current.close();
        } catch (e) {
          // ignore
        }
        audioContextRef.current = null;
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        console.warn('Web Audio API not supported in this browser.');
        return;
      }

      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;

      // resume (necessary on some browsers until user gesture)
      if (audioContext.state === 'suspended') {
        try {
          await audioContext.resume();
        } catch (err) {
          console.warn('audioContext resume failed:', err);
        }
      }
      console.log('audioContext state after resume:', audioContext.state);

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const micSource = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = micSource;

      // connect source -> analyser (do NOT connect analyser to destination to avoid echo)
      micSource.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);

      const update = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(buffer);

        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          const v = (buffer[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buffer.length);
        // scale to 0..100
        const level = Math.min(100, Math.round(rms * 100));
        setAudioLevel(level);

        animationFrameRef.current = requestAnimationFrame(update);
      };

      // start loop
      animationFrameRef.current = requestAnimationFrame(update);
    } catch (err) {
      console.error('initAudioAnalysis error', err);
    }
  }, []);

  const stopAudioAnalysis = useCallback(async () => {
    console.log('stopAudioAnalysis');

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (microphoneRef.current) {
      try {
        microphoneRef.current.disconnect();
      } catch (e) {}
      microphoneRef.current = null;
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (e) {}
      analyserRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        // closing releases resources
        await audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }

    setAudioLevel(0);
  }, []);

  // -------------------------
  // Permissions & devices
  // -------------------------
  const checkPermissions = useCallback(async () => {
    setIsChecking(true);
    try {
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicPermission('granted');
        micStream.getTracks().forEach(t => t.stop());
      } catch (e) {
        setMicPermission('denied');
      }

      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraPermission('granted');
        camStream.getTracks().forEach(t => t.stop());
      } catch (e) {
        setCameraPermission('denied');
      }
    } catch (err) {
      console.error('checkPermissions error', err);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      const videoInputs = devices.filter(d => d.kind === 'videoinput');

      setAudioDevices(audioInputs);
      setVideoDevices(videoInputs);

      // set defaults only if not already selected
      if (!selectedAudioDevice && audioInputs.length > 0) {
        setSelectedAudioDevice(audioInputs[0].deviceId);
      }
      if (!selectedVideoDevice && videoInputs.length > 0) {
        setSelectedVideoDevice(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.error('getDevices error', err);
    }
  }, [selectedAudioDevice, selectedVideoDevice]);

  // -------------------------
  // Camera preview
  // -------------------------
  const startCameraPreview = useCallback(async () => {
    // If no video device selected, try to get any camera
    try {
      // stop old stream if present
      if (videoStream) {
        videoStream.getTracks().forEach(t => t.stop());
        setVideoStream(null);
      }

      // Build constraints: if deviceId exists, try it, otherwise allow default
      const videoConstraints = selectedVideoDevice
        ? { deviceId: { exact: selectedVideoDevice }, width: { min: 320, ideal: 1280, max: 1920 }, height: { min: 240, ideal: 720, max: 1080 } }
        : { width: { min: 320, ideal: 1280, max: 1920 }, height: { min: 240, ideal: 720, max: 1080 } };

      const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });

      setVideoStream(stream);

      if (videoRef.current) {
        try {
          videoRef.current.srcObject = stream;
          // ensure playsInline + autoplay + muted (muted to allow autoplay in browsers)
          // call play() because sometimes autoPlay is blocked
          await videoRef.current.play().catch(err => {
            // If play() is blocked it will be caught here. We'll still have srcObject set and user click can start.
            console.warn('Video play() blocked:', err);
          });
        } catch (err) {
          console.warn('videoRef assignment/play error:', err);
        }
      }
    } catch (err) {
      console.error('startCameraPreview error:', err);
      setCameraPermission('denied');
    }
  }, [selectedVideoDevice, videoStream]);

  // -------------------------
  // Microphone test
  // -------------------------
  const startMicrophoneTest = useCallback(async () => {
    if (!selectedAudioDevice) {
      console.warn('No selectedAudioDevice');
      return;
    }

    try {
      if (audioStream) {
        audioStream.getTracks().forEach(t => t.stop());
        setAudioStream(null);
        await stopAudioAnalysis();
      }

      // build audio constraint defensively
      const audioConstraints = selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice }, echoCancellation: true, noiseSuppression: true } : { echoCancellation: true, noiseSuppression: true };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      setAudioStream(stream);

      // Log track info for debugging
      console.log('audio track settings:', stream.getAudioTracks()[0]?.getSettings());
      console.log('audio track label:', stream.getAudioTracks()[0]?.label);

      await initAudioAnalysis(stream);
      setIsTesting(true);
    } catch (err) {
      console.error('startMicrophoneTest error:', err);
      setMicPermission('denied');
    }
  }, [selectedAudioDevice, audioStream, initAudioAnalysis, stopAudioAnalysis]);

  // -------------------------
  // Stop all tests / cleanup
  // -------------------------
  const stopAllTests = useCallback(async () => {
    console.log('stopAllTests');

    // if (videoStream) {
    //   try {
    //     videoStream.getTracks().forEach(t => t.stop());
    //   } catch (e) {}
    //   setVideoStream(null);
    //   if (videoRef.current) {
    //     try {
    //       videoRef.current.srcObject = null;
    //     } catch (e) {}
    //   }
    // }

    if (audioStream) {
      try {
        audioStream.getTracks().forEach(t => t.stop());
      } catch (e) {}
      setAudioStream(null);
    }

    await stopAudioAnalysis();
    setIsTesting(false);
  }, [audioStream, stopAudioAnalysis]);

  // -------------------------
  // Request permissions button helper
  // -------------------------
  const requestPermissions = useCallback(async () => {
    setIsChecking(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      // if we get here, both granted
      setMicPermission('granted');
      setCameraPermission('granted');
      stream.getTracks().forEach(t => t.stop());
      await getDevices();
    } catch (err) {
      console.warn('requestPermissions failed:', err);
      await checkPermissions();
    } finally {
      setIsChecking(false);
    }
  }, [getDevices, checkPermissions]);

  // -------------------------
  // Effects
  // -------------------------
  useEffect(() => {
    if (!isOpen) {
      (async () => { await stopAllTests(); })();
      return;
    }

    (async () => {
      await checkPermissions();
      await getDevices();
    })();
    
    // listen for devicechange (user plugs/unplugs camera/mic)
    const onDeviceChange = () => {
      // refresh device list
      getDevices();
    };
    navigator.mediaDevices.addEventListener('devicechange', onDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', onDeviceChange);
    };
  }, [isOpen, checkPermissions, getDevices, stopAllTests]);

  // When camera permission + selected device change -> start preview
  useEffect(() => {
    if (cameraPermission === 'granted' && selectedVideoDevice) {
      startCameraPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraPermission, selectedVideoDevice]);

  // When selected audio device changed while testing -> restart test
  useEffect(() => {
    if (isTesting) {
      // intentionally not awaiting here; startMicrophoneTest handles cleanup
      startMicrophoneTest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAudioDevice]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      (async () => {
        await stopAllTests();
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------
  // Handlers
  // -------------------------
  const handleStartInterview = () => {
    // Stop local tests, then pass selected device ids to parent
    stopAllTests();
    if (micPermission === 'granted' && cameraPermission === 'granted') {
      onStartInterview({
        audioDeviceId: selectedAudioDevice,
        videoDeviceId: selectedVideoDevice,
      });
    }
  };

  const handleCloseModal = () => {
    stopAllTests();
    onClose();
  };

  const allPermissionsGranted = micPermission === 'granted' && cameraPermission === 'granted';

  const getStatusColor = (status) => {
    switch (status) {
      case 'granted': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'denied': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'granted': return '✓';
      case 'denied': return '✗';
      default: return '⏳';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'granted': return 'Ready';
      case 'denied': return 'Access Denied';
      default: return 'Checking...';
    }
  };

  const getAudioLevelColor = (level) => {
    if (level > 60) return 'bg-red-500';
    if (level > 30) return 'bg-blue-500';
    return 'bg-blue-500';
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-999" onClick={handleCloseModal}>
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Environment Check</h2>
              <p className="text-gray-600 mt-1">Verify your setup before starting the interview</p>
            </div>
            <button
              onClick={handleCloseModal}
              className="p-2 hover:bg-white/50 rounded-xl transition-all duration-200 group cursor-pointer"
            >
              <svg className="w-6 h-6 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${micPermission === 'granted' ? 'bg-blue-500' : micPermission === 'denied' ? 'bg-red-500' : 'bg-amber-500'}`} />
              <span className="text-sm font-medium text-gray-700">Microphone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${cameraPermission === 'granted' ? 'bg-blue-500' : cameraPermission === 'denied' ? 'bg-red-500' : 'bg-amber-500'}`} />
              <span className="text-sm font-medium text-gray-700">Camera</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-100 bg-white">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('devices')}
              className={`flex-1 min-w-0 px-6 py-4 text-sm font-medium border-b-2 cursor-pointer transition-colors ${
                activeTab === 'devices' 
                  ? 'm-1 rounded-md text-white bg-blue-600 font-semibold' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 font-semibold'
              }`}
            >
              Device Setup
            </button>
            <button
              onClick={() => setActiveTab('instructions')}
              className={`flex-1 min-w-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'instructions' 
                  ? 'm-1 rounded-md text-white bg-blue-600 font-semibold' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 font-semibold'
              }`}
            >
              Instructions
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {activeTab === 'devices' && (
            <div className="p-6 space-y-6">
              {/* Media Previews Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Camera Preview */}
                <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-lg">
                  <div className="p-4 bg-gray-800/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Camera Preview
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(cameraPermission)}`}>
                        {getStatusIcon(cameraPermission)} {getStatusText(cameraPermission)}
                      </span>
                    </div>
                  </div>
                  <div className="aspect-video bg-black relative">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted
                      style={{ width: "100%", height: "100%" }}
                    />
                    {cameraPermission !== 'granted' && (
                      <div className="flex items-center justify-center absolute inset-0 text-white bg-black/80">
                        <div className="text-center p-6">
                          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium mb-2">Camera {cameraPermission === 'denied' ? 'Access Denied' : 'Not Active'}</p>
                          <p className="text-xs text-gray-400">Please grant camera permissions to continue</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Microphone Test */}
                <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-lg">
                  <div className="p-4 bg-gray-800/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        Microphone Test
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(micPermission)}`}>
                        {getStatusIcon(micPermission)} {getStatusText(micPermission)}
                      </span>
                    </div>
                  </div>
                  <div className="aspect-video bg-black flex items-center justify-center p-6">
                    {micPermission === 'granted' ? (
                      <div className="w-full max-w-sm text-center">
                        <div className="mb-6">
                          <div className="w-32 h-32 mx-auto bg-gray-800 rounded-full flex items-center justify-center relative shadow-lg">
                            {/* Audio visualization rings */}
                            <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping" />
                            <div 
                              className="absolute inset-4 rounded-full transition-all duration-75"
                              style={{ 
                                backgroundColor: getAudioLevelColor(audioLevel).replace('bg-', 'bg-'),
                                transform: `scale(${0.8 + audioLevel / 150})`,
                                opacity: Math.max(0.2, audioLevel / 100)
                              }}
                            />
                            <svg className="w-12 h-12 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <p className="text-white text-sm font-medium">Speak to test your microphone</p>
                          
                          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                            <div 
                              className={`h-3 rounded-full transition-all duration-75 ${getAudioLevelColor(audioLevel)}`}
                              style={{ width: `${Math.min(100, audioLevel)}%` }}
                            />
                          </div>
                          
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Quiet</span>
                            <span className="font-medium">Level: {Math.round(audioLevel)}%</span>
                            <span>Loud</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-white p-6">
                        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium mb-1">Microphone {micPermission === 'denied' ? 'Access Denied' : 'Not Active'}</p>
                        <p className="text-xs text-gray-400">Please grant microphone permissions to test</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Device Configuration */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Device Configuration
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Camera Selection
                    </label>
                    <select
                      value={selectedVideoDevice}
                      onChange={(e) => setSelectedVideoDevice(e.target.value)}
                      className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                      disabled={cameraPermission !== 'granted'}
                    >
                      {videoDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Microphone Selection
                    </label>
                    <select
                      value={selectedAudioDevice}
                      onChange={(e) => setSelectedAudioDevice(e.target.value)}
                      className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                      disabled={micPermission !== 'granted'}
                    >
                      {audioDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={startMicrophoneTest}
                    disabled={micPermission !== 'granted' || !selectedAudioDevice || isTesting}
                    className="cursor-pointer flex-1 px-6 py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    {isTesting ? 'Testing...' : 'Start Microphone Test'}
                  </button>
                  
                  <button
                    onClick={stopAllTests}
                    className="cursor-pointer px-6 py-3.5 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    Stop Tests
                  </button>
                </div>

                {!allPermissionsGranted && (
                  <button
                    onClick={requestPermissions}
                    disabled={isChecking}
                    className="cursor-pointer w-full mt-4 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    {isChecking ? 'Requesting Permissions...' : 'Grant Camera & Microphone Access'}
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="p-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Interview Instructions
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {interviewInstructions.map((instruction, index) => (
                      <div 
                        key={index} 
                        className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors duration-200 group"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                          <span className="text-blue-600 text-sm font-bold">{index + 1}</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed text-sm">{instruction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={handleCloseModal}
              disabled={isChecking}
              className="cursor-pointer px-8 py-3.5 bg-white text-gray-700 rounded-xl font-semibold border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 order-2 sm:order-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              onClick={() => {
                if (activeTab === 'devices') {
                  setActiveTab('instructions');
                } else {
                  handleStartInterview();
                }
              }}
              disabled={!allPermissionsGranted || isChecking}
              className="cursor-pointer px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {activeTab === 'instructions' ?
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              :
              <svg
                className="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7c2 1 4 2 9 2s7-1 9-2v10c-2 1-4 2-9 2s-7-1-9-2V7z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v12" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 10h3M6 13h3M6 16h3" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10h3M15 13h3M15 16h3" />
              </svg>
              }
              {isChecking ? 'Checking Environment...' : activeTab === 'devices' ? 'Read Instructions' : 'Start Interview'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewCheckModal;