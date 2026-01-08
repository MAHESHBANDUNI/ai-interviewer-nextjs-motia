"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "../../../providers/SocketProvider";
import { Room, RoomEvent, Track } from "livekit-client";
import { Camera, Monitor } from "lucide-react";

export default function LivePreview({ user, interview, onClose, interviewStreamToken, interviewStreamUrl }) {
  const socket = useSocket();
  const transcriptContainerRef = useRef();
  const videoRef = useRef(null);
  const screenRef = useRef(null);
  const roomRef = useRef(null);

  const conversationSample = [
    {
      id: "51aa5945-e43f-4fb6-b212-0c2fa1cc646b",
      role: "assistant",
      text: "Hi, thanks for joining today. Can you briefly introduce yourself as a frontend developer?",
      timestamp: "2025-12-15T05:00:00.000Z"
    },
    {
      id: "8b6c8c4f-9d63-4f47-8a1a-9c1c3bda1a01",
      role: "user",
      text: "Sure! I'm a frontend developer with experience in React, JavaScript, and modern CSS.",
      timestamp: "2025-12-15T05:00:05.000Z"
    },
    {
      id: "c7cfe3a6-41c3-4f63-bc68-2fdcbd4a1c12",
      role: "assistant",
      text: "Great. Can you explain the difference between `let`, `const`, and `var` in JavaScript?",
      timestamp: "2025-12-15T05:00:15.000Z"
    },
    {
      id: "e91a2b44-7f91-4c4f-9d7b-8e0b93c6f221",
      role: "user",
      text: "`var` is function-scoped, while `let` and `const` are block-scoped. `const` prevents reassignment.",
      timestamp: "2025-12-15T05:00:22.000Z"
    },
    {
      id: "3b9c7a7e-1c32-4f1e-a7c2-7c99b40df002",
      role: "assistant",
      text: "Good. How do you manage state in a React application?",
      timestamp: "2025-12-15T05:00:30.000Z"
    },
    {
      id: "9fdad1d1-b78b-4d61-a7f4-6f77a98bcb11",
      role: "user",
      text: "For local state I use useState and useReducer, and for global state I use Context or Redux.",
      timestamp: "2025-12-15T05:00:38.000Z"
    },
    {
      id: "1c8c5b4a-4f62-44dd-8e5f-0a1c87a3d333",
      role: "assistant",
      text: "How do you optimize performance in a frontend application?",
      timestamp: "2025-12-15T05:00:45.000Z"
    },
    {
      id: "6d9e2c5f-2a54-4c8a-8a66-7c9e6eaf9222",
      role: "user",
      text: "I use memoization, code splitting, lazy loading, and avoid unnecessary re-renders.",
      timestamp: "2025-12-15T05:00:52.000Z"
    },
    {
      id: "b84f17c1-9a3f-46d1-a3fd-3f6b0f1b1444",
      role: "assistant",
      text: "Can you explain how the browser rendering process works?",
      timestamp: "2025-12-15T05:01:00.000Z"
    },
    {
      id: "2a7c4e5d-1c25-4a9f-9e3a-7d9a6f88a555",
      role: "user",
      text: "The browser parses HTML and CSS, builds the DOM and CSSOM, creates the render tree, then paints.",
      timestamp: "2025-12-15T05:01:08.000Z"
    },
    {
      id: "7f3b1a9c-3b6d-4e42-8b7e-91b0c3a16666",
      role: "assistant",
      text: "Nice explanation. How do you handle API errors on the frontend?",
      timestamp: "2025-12-15T05:01:15.000Z"
    },
    {
      id: "4a6f9c8d-71e3-4c35-bf3e-9a8f14b97777",
      role: "user",
      text: "I use try/catch, show user-friendly messages, and log errors for debugging.",
      timestamp: "2025-12-15T05:01:22.000Z"
    },
    {
      id: "e1a3b4c6-9f44-4b9e-9d2a-3e6f8c2a8888",
      role: "assistant",
      text: "Do you have experience with testing frontend applications?",
      timestamp: "2025-12-15T05:01:30.000Z"
    },
    {
      id: "5c7a1f92-5c42-4f89-9d18-6f0c2d0a9999",
      role: "user",
      text: "Yes, I use Jest and React Testing Library for unit and integration tests.",
      timestamp: "2025-12-15T05:01:38.000Z"
    },
    {
      id: "9b2c1f44-0e67-4e32-bd41-7f2a1cbbbbbb",
      role: "assistant",
      text: "Excellent. That's all from my side. Thanks for your time!",
      timestamp: "2025-12-15T05:01:45.000Z"
    }
  ];

  const [liveConversation, setLiveConversation] = useState([]);
  const [isJoinedInterview, setIsJoinedInterview] = useState(false);
  const [isViewingVideo, setIsViewingVideo] = useState(true); // true = camera, false = screen
  const [isParticipantDisconnected, setIsParticipantDisconnected] = useState(false);
  const [isParticipantConnected, setIsParticipantConnected] = useState(false);

    /**
   * Handle incoming live transcript event
   * Works for BOTH partial and final messages
   */
  const handleNewConversation = useCallback((event) => {
    console.log('Event: ',event);
    const { payload } = event;
    console.log("recieved payload: ",payload);
    if(!payload) return;

    setLiveConversation((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      const {id, text, role, timestamp} = payload;
      const latestMessage = {id, text, role, timestamp};

      // Insert or update message
      map.set(payload.id, latestMessage);

      // Convert back to sorted array (IMPORTANT for HSET-only)
      return Array.from(map.values()).sort(
        (a, b) => a.timestamp - b.timestamp
      );
    });
  }, []);

  useEffect(() => {
    if (
      !user ||
      !socket ||
      !interview?.interviewId ||
      !interviewStreamUrl ||
      !interviewStreamToken
    ) {
      return;
    }

    socket.on("interview_snapshot", ({ messages }) => {
      if (messages?.length) {
        setLiveConversation(
          messages.sort((a, b) => a.timestamp - b.timestamp)
        );
      }
    });

    socket.on("live_transcript", handleNewConversation);

    joinInterviewStream();

    return () => {
      socket.off("interview_snapshot");
      socket.off("live_transcript", handleNewConversation);
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, [
    user,
    socket,
    interview?.interviewId,
    interviewStreamUrl,
    interviewStreamToken,
  ]);

  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop =
        transcriptContainerRef.current.scrollHeight;
    }
  }, [liveConversation]);

const pendingVideoTracks = useRef({
  camera: null,
  screen: null,
});


  // JOIN LIVEKIT ROOM
  const joinInterviewStream = async () => {
    if (roomRef.current) return;

    if (!interviewStreamUrl || !interviewStreamToken) return;

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    roomRef.current = room;

    /* ---------- ROOM EVENTS ---------- */
    room.on(RoomEvent.Connected, () => {
      console.log("✅ Room connected");
    });

    room.on(RoomEvent.ParticipantConnected, (p) => {
      console.log("👤 Participant connected:", p.identity);
      setIsParticipantConnected(true);
    });

    room.on(RoomEvent.ParticipantDisconnected, (p) => {
      console.log("👤 Participant disconnected:", p.identity);
      if (p.identity === `candidate-${interview?.candidate?.candidateId}`) {
        setIsParticipantDisconnected(true);
      }
    });

    /* ---------- TRACK PUBLISHED ---------- */
    room.on(RoomEvent.TrackPublished, (pub, participant) => {
      console.log("📤 Track published", {
        participant: participant.identity,
        kind: pub.kind,
        source: pub.source,
        muted: pub.isMuted,
      });
    });

    /* ---------- TRACK SUBSCRIBED ---------- */
room.on(RoomEvent.TrackSubscribed, (track, publication) => {
  if (track.kind === "video") {
    if (publication.trackName === "screen") {
      pendingVideoTracks.current.screen = track;
    } else {
      pendingVideoTracks.current.camera = track;
    }
  }

  if (track.kind === "audio") {
    track.attach();
  }
});

    room.on(
      RoomEvent.TrackSubscribed,
      (track, publication, participant) => {

        console.log("Track subscribed", {
          participant: participant.identity,
          kind: track.kind,
          source: publication.source,
          sid: track.sid,
          trackName: publication.trackName
        });

        if(track.kind === 'video'){
          if (publication.trackName === "screen") {
            console.log("Screen attached");
            track.attach(screenRef.current);
          }
          else{
            console.log("Video attached");
            track.attach(videoRef.current);
          }
        }

        if (track.kind === "audio") {
          console.log("Audio attached");
          track.attach();
        }
      }
    );

    /* ---------- TRACK UNSUBSCRIBED ---------- */
    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      track?.detach()?.forEach(el => el.remove());
    
      if (track === videoRef.current) {
        videoRef.current = null;
      }
      if (track === screenRef.current) {
        screenRef.current = null;
      }
    });

    await room.connect(interviewStreamUrl, interviewStreamToken);
    setIsJoinedInterview(true);

    /* ---------- MEDIA FLOW STATS ---------- */
    const statsInterval = setInterval(async () => {
      room.remoteParticipants?.forEach((participant) => {
        if (!participant?.tracks) return;
      
        participant.tracks.forEach(async (pub) => {
          if (!pub?.track?.getStats) return;
        
          const stats = await pub.track.getStats();
          if (!stats) return;
        
          stats.forEach((r) => {
            if (r.type === "inbound-rtp") {
              console.log("📊 Media flow", {
                kind: pub.kind,
                source: pub.source,
                packets: r.packetsReceived,
                frames: r.framesDecoded,
                bytes: r.bytesReceived,
              });
            }
          });
        });
      });
    }, 3000);

    room.on(RoomEvent.Disconnected, () => {
      clearInterval(statsInterval);
    });
  };

  useEffect(() => {
  if (!isJoinedInterview) return;

  if (videoRef.current && pendingVideoTracks.current.camera) {
    pendingVideoTracks.current.camera.attach(videoRef.current);
  }

  if (screenRef.current && pendingVideoTracks.current.screen) {
    pendingVideoTracks.current.screen.attach(screenRef.current);
  }
}, [isJoinedInterview]);

  return (
    <div className="fixed inset-0 z-[1000]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      {user && socket && interview?.interviewId && <>
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-2 sm:p-4">
        <div 
          className="pointer-events-auto relative w-full w-[95vw] rounded-xl shadow-2xl bg-white dark:bg-gray-900 flex flex-col h-[95vh] lg:h-[95vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-lg hover:scale-105 transition-transform"
            aria-label="Close preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Main Content - Responsive Layout */}
          <div className="flex flex-col lg:flex-row gap-4 p-4 sm:p-6">
            {/* Video Section */}
            { isJoinedInterview && !isParticipantDisconnected &&
            <>
            <div className="lg:w-2/3 w-full">
              {/* <div className="flex items-center justify-between pb-3 bg-white dark:bg-gray-800">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg px-2">
                    Admin Live Watch
                  </h3>
              </div> */}

              {/* Video container */}
              <div className="overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {isViewingVideo ? "Candidate Camera Feed" : "Candidate Screen Share"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Live {isViewingVideo ? "video" : "screen"} feed from candidate
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Status indicator */}
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                      <span className="text-sm text-red-600">Live</span>
                    </div>

                    {/* Switch button - more compact */}
                    <button
                      onClick={() => setIsViewingVideo(!isViewingVideo)}
                      className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm shadow-sm"
                      title={`Switch to ${isViewingVideo ? "screen" : "camera"} view`}
                    >
                      <span className="text-lg">{isViewingVideo ? <Monitor className="w-6 w-6" /> : <Camera className="w-6 w-6" />}</span>
                      <span className="hidden sm:inline">
                        {isViewingVideo ? "View Screen" : "View Camera"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="bg-black h-[30vh] md:h-[35vh] lg:h-[69vh] flex items-center relative">
                  {/* Camera */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={`absolute inset-0 lg:w-2/3 w-full h-[30vh] md:h-[35vh] lg:h-[69vh] object-contain pointer-events-none transition-opacity ${
                      isViewingVideo ? "opacity-100 z-10" : "opacity-0 z-0"
                    }`}
                  />
                  {/* Screen */}
                  <video
                    ref={screenRef}
                    autoPlay
                    playsInline
                    className={`absolute inset-0 lg:w-2/3 w-full h-[30vh] md:h-[35vh] lg:h-[69vh] object-contain pointer-events-none transition-opacity ${
                      !isViewingVideo ? "opacity-100 z-10" : "opacity-0 z-0"
                    }`}
                  />
                </div>
                
                {/* Video Info */}
                <div className="mt-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Interview Info</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 sm:justify-between gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Candidate:</span>
                          <span className="ml-1 font-medium truncate">{interview?.candidate?.firstName} {interview?.candidate?.lastName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Position:</span>
                          <span className="ml-1 font-medium truncate">{interview?.candidate?.resumeProfile?.profileTitle}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Status:</span>
                          <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-medium">
                            {interview?.status.charAt(0).toUpperCase()}{interview?.status?.slice(1).toLowerCase()}
                          </span>
                        </div>
                      </div>
                  </div>
                </div>
              </div>
            </div>
            </>
            }
            { (!isJoinedInterview || ((isParticipantDisconnected) && isJoinedInterview)) &&
            <div className="lg:w-2/3 w-full">
              <div className="bg-gray-800 dark:bg-gray-800 rounded-xl aspect-video flex items-center justify-center relative overflow-hidden">
                {/* Placeholder for Video */}
                <div className="text-center p-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-300 font-medium">Live Interview Preview</p>
                  <p className="text-sm text-gray-400 mt-1">{isParticipantDisconnected ? 'This interview has been ended.' : 'Candidate feed will appear here'}</p>
                </div>
                
                {/* Video Stats Overlay */}
                <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-lg">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    LIVE
                  </span>
                </div>
                
                {/* Timer */}
                {/* <div className="absolute top-4 right-4 bg-black/50 text-white text-sm px-3 py-1.5 rounded-lg font-mono">
                  15:42
                </div> */}
              </div>
              
              {/* Video Info */}
              <div className="mt-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Interview Info</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 sm:justify-between gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Candidate:</span>
                        <span className="ml-1 font-medium truncate">{interview?.candidate?.firstName} {interview?.candidate?.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Position:</span>
                        <span className="ml-1 font-medium truncate">{interview?.job?.jobPositionName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-medium">
                          {interview?.status.charAt(0).toUpperCase()}{interview?.status?.slice(1).toLowerCase()}
                        </span>
                      </div>
                    </div>
                </div>
              </div>
            </div>
            }

            {/* Conversation Section */}
            <div className="lg:w-1/3 w-full flex flex-col">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl flex-1 flex flex-col max-h-[45vh] sm:max-h-[10vh] md:max-h-[36vh] lg:max-h-[90vh]">
                <div className="flex items-center justify-between pb-3 bg-white dark:bg-gray-800">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg px-2">
                    Interview Conversation
                  </h3>
                  {/* <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                    {liveConversation.length} messages
                  </span> */}
                </div>
                
                {/* Scrollable Conversation Area */}
                <div 
                    ref={transcriptContainerRef}
                    className="flex-1 overflow-y-auto p-2 space-y-4">
                  {liveConversation.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm
                          ${
                            msg.role === "assistant"
                              ? "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                              : "bg-blue-600 text-white"
                          }
                          
                        `}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-2 h-2 rounded-full ${
                            msg.role === "assistant" 
                              ? "bg-blue-600" 
                              : "bg-white"
                          }`}></div>
                          <div className="text-xs font-semibold">
                            {msg.role === "assistant" ? "AI Assistant" : "Candidate"}
                          </div>
                          <div className="text-xs opacity-70 ml-auto">
                            {new Date(msg.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                        <div className={msg.role === "assistant" 
                          ? "text-gray-800 dark:text-gray-200" 
                          : ""}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))}

                  {liveConversation.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">Waiting for interview activity…</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Conversation will appear here</p>
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
      </>}
    </div>
  );
}