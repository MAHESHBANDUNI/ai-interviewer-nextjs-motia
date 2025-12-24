'use client';

import { Mic, Camera, Monitor } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';

const InterviewCheckModal = ({ isOpen, onClose, onStartInterview }) => {
  const [micPermission, setMicPermission] = useState('pending');
  const [cameraPermission, setCameraPermission] = useState('pending');
  const [screenPermission, setScreenPermission] = useState('pending');
  const [isChecking, setIsChecking] = useState(true);
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [selectedScreenSource, setSelectedScreenSource] = useState('entire-screen');
  const [isTestingMicrophone, setIsTestingMicrophone] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isScreenPreviewActive, setIsScreenPreviewActive] = useState(false);
  
  // Refs for streams and elements
  const videoStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const audioStreamRef = useRef(null);
  const videoRef = useRef(null);
  const screenPreviewRef = useRef(null);
  
  // Audio analysis refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState('devices');
  
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

  const screenSourceOptions = [
    { id: 'entire-screen', label: 'Entire Screen', icon: '🖥️', description: 'Share your entire screen' },
    { id: 'application-window', label: 'Application Window', icon: '📱', description: 'Share a specific application' },
    { id: 'browser-tab', label: 'Browser Tab', icon: '🌐', description: 'Share a single browser tab' },
  ];

  // ======================
  // Audio Analysis
  // ======================
  const initAudioAnalysis = useCallback(async (stream) => {
    try {
      // Clean up existing audio context
      if (audioContextRef.current) {
        try {
          await audioContextRef.current.close();
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn('Web Audio API not supported');
        return;
      }

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Resume context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const micSource = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = micSource;
      micSource.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);

      const updateAudioLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteTimeDomainData(buffer);
        let sum = 0;
        
        for (let i = 0; i < buffer.length; i++) {
          const amplitude = (buffer[i] - 128) / 128;
          sum += amplitude * amplitude;
        }
        
        const rms = Math.sqrt(sum / buffer.length);
        const level = Math.min(100, Math.round(rms * 100));
        setAudioLevel(level);
        
        if (isTestingMicrophone) {
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    } catch (err) {
      console.error('Audio analysis error:', err);
    }
  }, [isTestingMicrophone]);

  const stopAudioAnalysis = useCallback(async () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch (e) {
        // Ignore cleanup errors
      }
      audioContextRef.current = null;
    }

    setAudioLevel(0);
  }, []);

  // ======================
  // Permissions & Devices
  // ======================
  const checkPermissions = useCallback(async () => {
    setIsChecking(true);
    try {
      // Check microphone
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicPermission('granted');
        micStream.getTracks().forEach(track => track.stop());
      } catch (e) {
        setMicPermission('denied');
      }

      // Check camera
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraPermission('granted');
        camStream.getTracks().forEach(track => track.stop());
      } catch (e) {
        setCameraPermission('denied');
      }

      // Check screen sharing
      if (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
        setScreenPermission('granted');
      } else {
        setScreenPermission('denied');
      }
    } catch (err) {
      console.error('Permission check error:', err);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      const videoInputs = devices.filter(device => device.kind === 'videoinput');

      setAudioDevices(audioInputs);
      setVideoDevices(videoInputs);

      // Set defaults if not already selected
      if (!selectedAudioDevice && audioInputs.length > 0) {
        setSelectedAudioDevice(audioInputs[0].deviceId);
      }
      if (!selectedVideoDevice && videoInputs.length > 0) {
        setSelectedVideoDevice(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.error('Device enumeration error:', err);
    }
  }, [selectedAudioDevice, selectedVideoDevice]);

  // ======================
  // Camera Preview
  // ======================
  const startCameraPreview = useCallback(async () => {
    if (videoStreamRef.current) return;

    try {
      const constraints = selectedVideoDevice
        ? { 
            video: { 
              deviceId: { exact: selectedVideoDevice },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          }
        : { video: { width: { ideal: 1280 }, height: { ideal: 720 } } };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play().catch(console.warn);
      }
    } catch (err) {
      console.error('Camera preview error:', err);
      setCameraPermission('denied');
    }
  }, [selectedVideoDevice]);

  const stopCameraPreview = useCallback(() => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
      videoStreamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // ======================
  // Screen Share Preview
  // ======================
  const startScreenPreview = useCallback(async () => {
    if (screenStreamRef.current || !screenPreviewRef.current) return;

    try {
      const constraints = {
        video: {
          displaySurface: selectedScreenSource === 'entire-screen' ? 'monitor' :
                         selectedScreenSource === 'application-window' ? 'window' : 'browser',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      screenStreamRef.current = stream;
      setIsScreenPreviewActive(true);

      // Set stream to video element
      screenPreviewRef.current.srcObject = stream;
      screenPreviewRef.current.muted = true;
      screenPreviewRef.current.playsInline = true;
      
      // Ensure video plays
      await screenPreviewRef.current.play().catch(console.warn);

      // Handle when user stops sharing via browser UI
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.addEventListener('ended', () => {
        stopScreenPreview();
      });
    } catch (err) {
      console.error('Screen preview error:', err);
      // Don't set permission to denied for user cancellation
      if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
        setScreenPermission('denied');
      }
    }
  }, [selectedScreenSource]);

  const stopScreenPreview = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    if (screenPreviewRef.current) {
      screenPreviewRef.current.srcObject = null;
    }
    
    setIsScreenPreviewActive(false);
  }, []);

  // ======================
  // Microphone Test
  // ======================
  const startMicrophoneTest = useCallback(async () => {
    if (!selectedAudioDevice || isTestingMicrophone) return;

    try {
      // Stop existing test if any
      await stopAudioAnalysis();
      
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }

      const constraints = selectedAudioDevice
        ? { audio: { deviceId: { exact: selectedAudioDevice } } }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      audioStreamRef.current = stream;
      setIsTestingMicrophone(true);
      
      await initAudioAnalysis(stream);
    } catch (err) {
      console.error('Microphone test error:', err);
      setMicPermission('denied');
      setIsTestingMicrophone(false);
    }
  }, [selectedAudioDevice, isTestingMicrophone, initAudioAnalysis, stopAudioAnalysis]);

  const stopMicrophoneTest = useCallback(async () => {
    await stopAudioAnalysis();
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    setIsTestingMicrophone(false);
    setAudioLevel(0);
  }, [stopAudioAnalysis]);

  // ======================
  // Cleanup Functions
  // ======================
  const stopAllTests = useCallback(async () => {
    await stopMicrophoneTest();
    stopCameraPreview();
    stopScreenPreview();
  }, [stopMicrophoneTest, stopCameraPreview, stopScreenPreview]);

  const requestPermissions = useCallback(async () => {
    setIsChecking(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      });
      
      setMicPermission('granted');
      setCameraPermission('granted');
      
      stream.getTracks().forEach(track => track.stop());
      await getDevices();
    } catch (err) {
      console.warn('Permission request failed:', err);
      await checkPermissions();
    } finally {
      setIsChecking(false);
    }
  }, [getDevices, checkPermissions]);

  // ======================
  // Effects
  // ======================
  useEffect(() => {
    if (!isOpen) {
      stopAllTests();
      return;
    }

    checkPermissions();
    getDevices();

    const handleDeviceChange = () => {
      getDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      stopAllTests();
    };
  }, [isOpen, checkPermissions, getDevices, stopAllTests]);

  // Start camera preview when permission granted and device selected
  useEffect(() => {
    if (cameraPermission === 'granted' && selectedVideoDevice && isOpen) {
      startCameraPreview();
    }

    return () => {
      stopCameraPreview();
    };
  }, [cameraPermission, selectedVideoDevice, isOpen, startCameraPreview, stopCameraPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllTests();
    };
  }, [stopAllTests]);

  // ======================
  // Event Handlers
  // ======================
  const handleStartInterview = () => {
    stopAllTests();
    
    if (micPermission === 'granted' && cameraPermission === 'granted') {
      onStartInterview({
        audioDeviceId: selectedAudioDevice,
        videoDeviceId: selectedVideoDevice,
        screenSharingRequired: true,
        screenSourceType: selectedScreenSource,
      });
    }
  };

  const handleCloseModal = () => {
    stopAllTests();
    onClose();
  };

  // ======================
  // UI Helper Functions
  // ======================
  const allPermissionsGranted = micPermission === 'granted' && 
                                cameraPermission === 'granted' && 
                                screenPermission === 'granted';

  const getStatusColor = (status) => {
    switch (status) {
      case 'granted': return 'bg-green-100 text-green-700 border-green-200';
      case 'denied': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
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
    if (level > 70) return 'bg-red-500';
    if (level > 40) return 'bg-green-500';
    return 'bg-blue-500';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-5000" onClick={handleCloseModal}>
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
              className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <svg className="w-6 h-6 text-gray-500 hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center gap-4 mt-4">
            {['Microphone', 'Camera', 'Screen'].map((device) => (
              <div key={device} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  device === 'Microphone' 
                    ? micPermission === 'granted' ? 'bg-green-500' : micPermission === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
                    : device === 'Camera'
                    ? cameraPermission === 'granted' ? 'bg-green-500' : cameraPermission === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
                    : screenPermission === 'granted' ? 'bg-green-500' : screenPermission === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className="text-sm font-medium text-gray-700">{device}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-100 bg-white">
          <div className="flex">
            <button
              onClick={() => setActiveTab('devices')}
              className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'devices' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Device Setup
            </button>
            <button
              onClick={() => setActiveTab('instructions')}
              className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'instructions' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Camera Preview */}
                <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
                  <div className="p-4 bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Camera className='w-5 h-5' />
                        Camera Preview
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(cameraPermission)}`}>
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
                      className="w-full h-full object-cover"
                    />
                    {cameraPermission !== 'granted' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <div className="text-center p-6">
                          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-white text-sm font-medium mb-2">
                            Camera {cameraPermission === 'denied' ? 'Access Denied' : 'Not Active'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Microphone Test */}
                <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
                  <div className="p-4 bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Mic className='w-5 h-5' />
                        Microphone Test
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(micPermission)}`}>
                        {getStatusIcon(micPermission)} {getStatusText(micPermission)}
                      </span>
                    </div>
                  </div>
                  <div className="aspect-video bg-black flex items-center justify-center p-6">
                    {micPermission === 'granted' ? (
                      <div className="w-full max-w-md text-center">
                        <div className="mb-6">
                          <div className="w-32 h-32 mx-auto bg-gray-800 rounded-full flex items-center justify-center relative">
                            <div 
                              className="absolute inset-0 rounded-full transition-all duration-100"
                              style={{ 
                                backgroundColor: getAudioLevelColor(audioLevel).replace('bg-', 'bg-'),
                                transform: `scale(${0.7 + audioLevel / 200})`,
                                opacity: Math.max(0.3, audioLevel / 100)
                              }}
                            />
                            <Mic className='w-5 h-5' />
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <p className="text-white text-sm font-medium">
                            {isTestingMicrophone ? 'Speak to test your microphone' : 'Click "Start Test" to begin'}
                          </p>
                          
                          <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className={`h-2.5 rounded-full transition-all duration-100 ${getAudioLevelColor(audioLevel)}`}
                              style={{ width: `${Math.min(100, audioLevel)}%` }}
                            />
                          </div>
                          
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Quiet</span>
                            <span className="font-medium">Level: {audioLevel}%</span>
                            <span>Loud</span>
                          </div>
                          
                          <div className="flex gap-3">
                            <button
                              onClick={startMicrophoneTest}
                              disabled={!selectedAudioDevice || isTestingMicrophone}
                              className="flex-1 px-4 py-2.5 bg-blue-600 rounded-lg text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {isTestingMicrophone ? 'Testing...' : 'Start Test'}
                            </button>
                            <button
                              onClick={stopMicrophoneTest}
                              disabled={!isTestingMicrophone}
                              className="flex-1 px-4 py-2.5 bg-gray-600 rounded-lg text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Stop Test
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-6">
                        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Mic className='w-5 h-5' />
                        </div>
                        <p className="text-white text-sm font-medium">
                          Microphone {micPermission === 'denied' ? 'Access Denied' : 'Not Available'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Screen Sharing Preview */}
                <div className="lg:col-span-2 bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
                  <div className="p-4 bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Monitor className='w-5 h-5' />
                         Screen Share Preview
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(screenPermission)}`}>
                        {getStatusIcon(screenPermission)} {getStatusText(screenPermission)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="aspect-video bg-black relative">
                    <video
                      ref={screenPreviewRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain bg-black"
                    />
                    
                    {!isScreenPreviewActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-6">
                        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                          <span className="text-2xl"><Monitor className='w-5 h-5'/></span>
                        </div>
                        <p className="text-lg font-medium mb-2">Screen Preview</p>
                        <p className="text-sm text-gray-300 text-center max-w-md">
                          Click "Start Preview" to select and preview what you'll be sharing during the interview
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-gray-800 flex flex-col sm:flex-row gap-3">
                    {/* <div className="flex-1">
                      <label className="block text-sm font-medium text-white mb-2">
                        Share Source
                      </label>
                      <select
                        value={selectedScreenSource}
                        onChange={(e) => setSelectedScreenSource(e.target.value)}
                        className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                        disabled={isScreenPreviewActive}
                      >
                        {screenSourceOptions.map((source) => (
                          <option key={source.id} value={source.id}>
                            {source.icon} {source.label}
                          </option>
                        ))}
                      </select>
                    </div> */}
                    
                    <div className="flex gap-2 items-end">
                      <button
                        onClick={startScreenPreview}
                        disabled={screenPermission !== 'granted' || isScreenPreviewActive}
                        className="px-6 py-2.5 bg-blue-600 rounded-lg text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                      >
                        Start Preview
                      </button>
                      <button
                        onClick={stopScreenPreview}
                        disabled={!isScreenPreviewActive}
                        className="px-6 py-2.5 bg-gray-600 rounded-lg text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                      >
                        Stop Preview
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Device Configuration */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Device Configuration
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Camera Selection
                    </label>
                    <select
                      value={selectedVideoDevice}
                      onChange={(e) => setSelectedVideoDevice(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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

                {!allPermissionsGranted && (
                  <button
                    onClick={requestPermissions}
                    disabled={isChecking}
                    className="w-full mt-6 px-6 py-3.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 bg-blue-50 border-b border-gray-200">
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
                        className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
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
              className="px-8 py-3.5 bg-white text-gray-700 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 order-2 sm:order-1"
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
              className="px-8 py-3.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {activeTab === 'instructions' ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Interview
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Read Instructions
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewCheckModal;