'use client';

import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TOAST_CONTAINER_ID = 'main-toast-container';

export default function ToastManager() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (document.querySelector(`.${TOAST_CONTAINER_ID}`)) return;
    
    setIsMounted(true);
    
    return () => {
      toast.dismiss();
      const container = document.querySelector(`.${TOAST_CONTAINER_ID}`);
      container?.remove();
    };
  }, []);

  if (!isMounted) return null;

  return (
    <ToastContainer
      className={TOAST_CONTAINER_ID}
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss={false}
      draggable
      pauseOnHover
      theme="light"
      limit={3}
      enableMultiContainer={false}
      toastId="unique-toast"
    />
  );
}