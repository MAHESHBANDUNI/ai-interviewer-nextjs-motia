"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useRouter } from 'next/navigation';

const SocketContext = createContext(null);

export const SocketProvider = ({ children, user, interviewId, interviewSessionToken }) => {
  const router = useRouter();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user?.id || !interviewSessionToken) return;

    let socketInstance;

    try {
      socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket'],
        auth: {
          token: interviewSessionToken,
        },
      });

      const handleConnect = () => {
        try {
          console.log('Socket connected:', socketInstance.id);

          if (user?.role === 'Admin') {
            socketInstance.emit('join_admin', {});
          }

          if (user?.role === 'Candidate') {
            socketInstance.emit('join_candidate', {});
          }
        } catch (err) {
          console.error('Error during socket connect handler:', err);
        }
      };

      const handleDisconnect = (reason) => {
        console.log('Socket disconnected:', reason);
      };

      const handleConnectError = (error) => {
        console.error('Socket connection error:', error);
      };

      socketInstance.on('connect', handleConnect);
      socketInstance.on('disconnect', handleDisconnect);
      socketInstance.on('connect_error', handleConnectError);

      setSocket(socketInstance);
    } catch (error) {
      console.error('Failed to initialize socket:', error);
    }

    // Cleanup
    return () => {
      try {
        if (socketInstance) {
          socketInstance.off('connect');
          socketInstance.off('disconnect');
          socketInstance.off('connect_error');
          socketInstance.disconnect();
        }
      } catch (cleanupError) {
        console.error('Error during socket cleanup:', cleanupError);
      }
    };
  }, [user?.id, interviewSessionToken]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const socket = useContext(SocketContext);

  if (socket === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }

  return socket;
};
