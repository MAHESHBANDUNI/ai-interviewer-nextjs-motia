'use client';

import { toast } from 'react-toastify';

const toastConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "light",
};

export const showToast = (type, message) => {
  if (typeof window !== 'undefined') {
    toast[type](message, {
      ...toastConfig,
      toastId: `${type}-${message}`,
    });
  }
};

export const successToast = (message) => showToast('success', message);
export const errorToast = (message) => showToast('error', message);
export const warningToast = (message) => showToast('warning', message);
export const infoToast = (message) => showToast('info', message);