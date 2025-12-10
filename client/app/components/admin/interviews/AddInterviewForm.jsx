'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { z } from 'zod';
import CustomCalendarModal from './CustomCalenderModal';
import { useSession } from "next-auth/react";

const schema = z.object({
  candidate: z.string().min(1, 'Candidate is required'),
  date: z.date(),
  time: z.string().min(1, 'Time is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
});

export default function AddInterviewForm({
  isOpen,
  onClose,
  onSubmit,
  saving,
  setSaving,
  isRescheduling,
  interview
}) {
  // Candidate search
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [filteredCandidates, setFilterCandidates] = useState([]);
  const { data: session } = useSession();

  // Calendar
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  // After date selection
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(30);

  // errors
  const [errors, setErrors] = useState({});

  const searchAbort = useRef(null);

  useEffect(() => {
    return () => {
      if (searchAbort.current) searchAbort.current.abort();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCandidates();
    }
  }, [isOpen]);

  useEffect(() => {
    if (candidates.length === 0) {
      setFilterCandidates([]);
      return;
    }

    const filtered = candidates.filter((c) =>
      (c.firstName + ' ' + c.lastName)
        .toLowerCase()
        .includes(query.toLowerCase())
    );

    setFilterCandidates(filtered);
  }, [query, candidates]);


  useEffect(() => {
    if (!isRescheduling || !interview?.scheduledAt) return;

    const prev = new Date(interview?.scheduledAt);

    if (!isNaN(prev)) {
      // Set date
      setSelectedDate(prev);

      // Set time (HH:mm)
      const hours = prev.getHours().toString().padStart(2, "0");
      const minutes = prev.getMinutes().toString().padStart(2, "0");
      setSelectedTime(`${hours}:${minutes}`);
    }

    // Candidate
    const fullName = `${interview.candidate.firstName} ${interview.candidate.lastName}`;
    setQuery(fullName);
    setSelectedCandidate(interview.candidate);

    // Duration
    setDuration(interview.durationMin);
  }, [isRescheduling, interview]);

  const fetchCandidates = async () => {
    try {
      const response = await fetch('${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/candidates/list', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) return;

      const data = await response.json();
      setCandidates(data.candidates);
    } catch (error) {
      console.log("error", error);
    }
  };

  const onQueryChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setSelectedCandidate('');
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setCalendarOpen(false);
    setSelectedTime('');
  };

  const validateAndBuildPayload = () => {
    try {
      const parsed = schema.parse({
        candidate:
          selectedCandidate?.firstName + ' ' + selectedCandidate?.lastName,
        date: selectedDate,
        time: selectedTime,
        duration: Number(duration)
      });

      setErrors({});

      const [hour, minute] = parsed.time.split(':').map(Number);
      const dt = new Date(parsed.date);
      dt.setHours(hour, minute, 0, 0);

      return {
        candidateId: selectedCandidate.candidateId,
        datetime: dt.toISOString(),
        duration: parsed.duration,
        adminId: session?.user?.id
      };
    } catch (err) {
      if (err instanceof z.ZodError) {
        const formatted = {};
        err.issues.forEach((issue) => {
          formatted[issue.path[0]] = issue.message;
        });
        setErrors(formatted);
      }
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = validateAndBuildPayload();
    if (!payload) {
      setSaving(false);
      return;
    }

    try {
      await onSubmit(payload);
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSaving(false);
      setQuery('');
      setSelectedCandidate('');
      setFilterCandidates([]);
      setSelectedDate(null);
      setSelectedTime('');
      setDuration(30);
      onClose && onClose();
    }
  };

  const handleCloseModal = () => {
    setQuery('');
    setSelectedCandidate('');
    setFilterCandidates([]);
    setSelectedDate(null);
    setSelectedTime('');
    setDuration(30);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-40 flex items-center justify-center p-4 bg-[#00000082] backdrop-blur-[5px] z-[9999]">
      <div className="modal-content bg-white rounded-lg w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-xl text-white font-semibold">
            {isRescheduling ? 'Reschedule Interview' : 'Schedule Interview'}
          </h2>
          <button onClick={handleCloseModal} className="text-white p-1 cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Candidate search */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Candidate Name
            </label>

            <input
              value={
                isRescheduling
                  ? `${interview?.candidate.firstName} ${interview?.candidate.lastName}`
                  : query
              }
              onChange={isRescheduling ? undefined : onQueryChange}
              placeholder="Search candidates..."
              className="w-full p-2 border border-gray-300 rounded-lg mt-2"
              disabled={isRescheduling}
            />

            {/* Dropdown */}
            {!isRescheduling &&
              filteredCandidates &&
              !selectedCandidate &&
              query && (
                <div
                  className={`mt-2 rounded-lg max-h-36 overflow-y-auto ${
                    filteredCandidates.length > 0 ? 'border' : ''
                  }`}
                >
                  {filteredCandidates.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No results</div>
                  ) : (
                    filteredCandidates.map((c, i) => (
                      <div
                        key={c.candidateId ?? `${c.firstName}-${i}`}
                        onClick={() => {
                          setSelectedCandidate(c);
                          setQuery(c.firstName + ' ' + c.lastName);
                          setFilterCandidates([]);
                        }}
                        className="p-2 cursor-pointer hover:bg-blue-50"
                      >
                        {`${c.firstName} ${c.lastName}`}
                      </div>
                    ))
                  )}
                </div>
              )}

            {errors.candidate && (
              <p className="text-red-500 text-xs mt-1">{errors.candidate}</p>
            )}
          </div>

          {/* Date + Time */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCalendarOpen(true)}
                  className="px-4 py-2 border rounded-lg border-gray-300 cursor-pointer"
                >
                  {selectedDate
                    ? format(selectedDate, 'PPP')
                    : isRescheduling && interview?.scheduledAt
                      ? format(new Date(interview.scheduledAt), 'PPP')
                      : 'Choose date'}
                </button>
              </div>
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Timing</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                disabled={!selectedDate}
                className="w-full p-2 border border-gray-300 rounded-lg mt-2"
              />
              {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
            </div>

          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
            <input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-lg mt-2"
            />
            {errors.duration && (
              <p className="text-red-500 text-xs mt-1">{errors.duration}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 rounded-lg cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2 text-white rounded-lg cursor-pointer ${
                saving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
               {saving
                ? isRescheduling
                  ? 'Rescheduling...'
                  : 'Scheduling...'
                : isRescheduling
                ? 'Reschedule'
                : 'Schedule'}
            </button>
          </div>

        </form>
      </div>

      {/* Calendar Modal */}
      <CustomCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelect={handleDateSelect}
        bookings={bookings}
      />
    </div>
  );
}
