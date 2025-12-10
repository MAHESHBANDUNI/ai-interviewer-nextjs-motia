'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { isBefore, isSameDay, eachDayOfInterval, parseISO, format, subDays, addDays } from 'date-fns';
import { X } from 'lucide-react';
import { z } from 'zod';

export default function CustomCalendarModal({ isOpen, onClose, selectedDate, onSelect, bookings = [], onConfirm }) {
  const modalRef = useRef(null);
  const today = new Date();
  const tomorrow = addDays(new Date(), 1);

  const disabledDates = useMemo(() => {
    const dates = [];
    bookings.forEach((booking) => {
      try {
        const range = eachDayOfInterval({
          start: parseISO(booking.checkInDate),
          end: subDays(parseISO(booking.checkOutDate), 1),
        });
        dates.push(...range);
      } catch (e) {
        // ignore bad booking entries
      }
    });
    return dates;
  }, [bookings]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.modal-content')) {
        onClose();
      }
    };

    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      document.addEventListener('click', handleClickOutside, true);

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
        document.removeEventListener('click', handleClickOutside, true);
      };
    }
  }, [isOpen, onClose]);

  const isDateDisabled = (date) => {
    return (
      date < new Date().setHours(0,0,0,0)
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-content fixed inset-0 backdrop-blur-xs bg-black/30 flex items-center z-[5555] justify-center">
      <div ref={modalRef} className="calendar-modal bg-white z-[1100] rounded-lg shadow-xl lg:p-6.5 p-4 sm:mx-auto mx-8 max-w-full">
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={(date) => { if (date) onSelect(date); }}
          fromDate={today}
          defaultMonth={selectedDate ? new Date(selectedDate) : today}
          formatters={{
            formatWeekdayName: (day) => {
              const label = format(day, 'EEE');
              return (
                <span className={day.getDay() === 0 || day.getDay() === 6 ? 'text-[#F44336] text-[16px]' : 'text-[16px]'}>
                  {label}
                </span>
              );
            },
          }}
          modifiers={{
            weekend: (date) => date.getDay() === 0 || date.getDay() === 6,
            booked: (date) => disabledDates.some((d) => isSameDay(d, date)),
            disabled: (date) =>
              date < new Date().setHours(0, 0, 0, 0) ||
              disabledDates.some((booked) => isSameDay(booked, date)),
          }}
          modifiersClassNames={{
            booked: 'pointer-events-none opacity-[0.4]',
            selected: 'bg-black text-white rounded-md',
            disabled: 'pointer-events-none opacity-[0.4]',
            weekend: 'text-[#F44336]',
          }}
        />

        <div className="mt-4 flex justify-end gap-4">
          <button onClick={onClose} className="text-gray-800 font-bold cursor-pointer py-2.5 px-5.5 hover:text-gray-500">Cancel</button>
          <button onClick={onConfirm ? onConfirm : onClose} disabled={!selectedDate} className="bg-black text-white py-2.5 px-5.5 rounded-full cursor-pointer disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed">Select</button>
        </div>
      </div>
    </div>
  );
}