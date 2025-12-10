'use client';
import { SessionProvider } from 'next-auth/react';

export function UserProvider({ children }) {
  return (
    <SessionProvider>
        {children}
    </SessionProvider>
  );
}