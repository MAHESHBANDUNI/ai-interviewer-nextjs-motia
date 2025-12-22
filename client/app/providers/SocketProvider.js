"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useRouter } from 'next/navigation';

const SocketContext = createContext(null);

export const SocketProvider = ({ children, user, interviewId }) => {
  const router= useRouter();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket'],
    });

    const handleConnect = () => {
      console.log('Socket connected:', socketInstance.id);
      if(user?.role === 'Admin'){
        socketInstance.emit('join_admin', { adminId: user.id, interviewId });
      }
      if(user?.role === 'Candidate'){
        socketInstance.emit('join_candidate', { candidateId: user.id, interviewId });
      }
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);

    setSocket(socketInstance);

    // Cleanup
    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.disconnect();
    };
  }, [user?.id]);

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
