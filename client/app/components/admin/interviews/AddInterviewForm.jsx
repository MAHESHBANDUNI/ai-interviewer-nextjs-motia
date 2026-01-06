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
  job: z
    .object({
      jobId: z.string(),
      jobPositionName: z.string()
    })
    .nullable()
    .refine(val => val !== null, {
      message: 'Job position is required',
    }),

  candidate: z
    .object({
      candidateId: z.string(),
      firstName: z.string(),
      lastName: z.string(),
    })
    .nullable()
    .refine(val => val !== null, {
      message: 'Candidate is required',
    }),

  date: z
    .date()
    .nullable()
    .refine(val => val !== null, {
      message: 'Date is required',
    }),

  time: z
    .string()
    .min(1, 'Time is required')
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format'),

  duration: z
    .number()
    .min(1, 'Duration must be at least 1 minute')
    .max(480, 'Duration cannot exceed 8 hours'),
}).refine((data) => {
  if (!data.date || !data.time) return true;

  const [h, m] = data.time.split(':').map(Number);
  const dt = new Date(data.date);
  dt.setHours(h, m, 0, 0);

  return dt > new Date();
}, {
  message: 'Interview time must be in the future',
  path: ['time'],
});

export default function AddInterviewForm({
  isOpen,
  onClose,
  onSubmit,
  saving,
  setSaving,
  isRescheduling,
  selectedInterviewId,
  interview
}) {
  // Candidate search
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [activeJobPositions, setActiveJobPositions] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [filteredCandidates, setFilterCandidates] = useState([]);
  // Job search
  const [jobQuery, setJobQuery] = useState('');
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

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
  const backdropRef = useRef(null);

  useEffect(() => {
    return () => {
      if (searchAbort.current) searchAbort.current.abort();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.token) return;

    if (isOpen && !selectedInterviewId) {
      fetchCandidates();
      fetchActiveJobPositions();
    }
  }, [isOpen, session?.user?.token]);

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
  if (!activeJobPositions.length) {
    setFilteredJobs([]);
    return;
  }

  const filtered = activeJobPositions.filter((job) =>
    job.jobPositionName.toLowerCase().includes(jobQuery.toLowerCase())
  );

  setFilteredJobs(filtered);
}, [jobQuery, activeJobPositions]);

const onJobQueryChange = (e) => {
  const value = e.target.value;
  setJobQuery(value);

  if (
    selectedJob &&
    value !== selectedJob.jobPositionName
  ) {
    setSelectedJob(null);
  }
};

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

    // Job
    setSelectedJob(interview.job);
    setJobQuery(interview.job.jobPositionName);

    // Candidate
    const fullName = `${interview.candidate.firstName} ${interview.candidate.lastName}`;
    setQuery(fullName);
    setSelectedCandidate(interview.candidate);

    // Duration
    setDuration(interview.durationMin);
  }, [isRescheduling, interview]);

  const fetchCandidates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/candidate/list`, {
        method: 'GET',
        headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`},
      });

      if (!response.ok) return;

      const data = await response.json();
      setCandidates(data.candidates);
    } catch (error) {
      console.log("error", error);
    }
  };

  const fetchActiveJobPositions = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/job/list?status=OPEN`, {
        method: 'GET',
        headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`},
      });

      if (!response.ok) return;

      const data = await response.json();
      setActiveJobPositions(data?.jobs);
    } catch (error) {
      console.log("error", error);
    }
  };

  // REMOVE clearError from onQueryChange
  const onQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (
      selectedCandidate &&
      value !== `${selectedCandidate.firstName} ${selectedCandidate.lastName}`
    ) {
      setSelectedCandidate(null);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setCalendarOpen(false);
    clearError('date');
  };

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
    clearError('time');
  };

  const handleDurationChange = (e) => {
    setDuration(Number(e.target.value));
    clearError('duration');
  };

  const validateAndBuildPayload = () => {
    const result = schema.safeParse({
      job: selectedJob || null,
      candidate: selectedCandidate || null,
      date: selectedDate,
      time: selectedTime,
      duration: Number(duration),
    });

    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path.join('.');
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return null;
    }

    setErrors({});

    const {
      job,
      candidate,
      date,
      time,
      duration: parsedDuration,
    } = result.data;

    const [hour, minute] = time.split(':').map(Number);
    const dt = new Date(date);
    dt.setHours(hour, minute, 0, 0);

    return {
      jobId: job.jobId, 
      candidateId: candidate.candidateId,
      datetime: dt.toISOString(),
      duration: parsedDuration,
      adminId: session?.user?.id,
    };
  };

  const clearError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;
    setSaving(true);

    const payload = validateAndBuildPayload();
    if (!payload) {
      setSaving(false);
      return;
    }

    try {
      await onSubmit(payload);
      handleCloseModal();
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    // Candidate
    setQuery('');
    setSelectedCandidate(null);
    setFilterCandidates([]);
  
    // Job
    setJobQuery('');
    setSelectedJob(null);
    setFilteredJobs([]);
  
    // Date & time
    setSelectedDate(null);
    setSelectedTime('');
    setDuration(30);
  
    setErrors({});
    onClose();
  };

const isFormValid = React.useMemo(() => {
  const result = schema.safeParse({
    job: selectedJob || null,
    candidate: selectedCandidate || null,
    date: selectedDate,
    time: selectedTime,
    duration: Number(duration),
  });

  return result.success;
}, [selectedJob, selectedCandidate, selectedDate, selectedTime, duration]);

  const disabledStyles =
  "disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed disabled:opacity-70";


  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 bg-opacity-40 flex items-center justify-center p-4 bg-[#00000082] backdrop-blur-[5px] z-[9999]"   ref={backdropRef}
        onClick={(e) => {
          if (e.target === backdropRef.current) {
            handleCloseModal();
          }
        }}
      >
        {activeJobPositions.length === 0 && candidates.length === 0 && (
          <div className="modal-content bg-white rounded-lg w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl p-8 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-center space-y-4">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-lg font-medium text-gray-900">Loading...</p>
            </div>
          </div>
        )}

        {activeJobPositions.length !== 0 && candidates.length !== 0 && 
        <>
          <div className="modal-content bg-white rounded-lg w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl" onClick={(e) =>e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-gradient-to-r from-blue-600 to-blue-700">
              <h2 className="text-xl text-white font-semibold">
                {isRescheduling ? 'Reschedule Interview' : 'Schedule Interview'}
              </h2>
              <button onClick={() => {if (!isCalendarOpen) {handleCloseModal()};}} className="text-white p-1 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>
          
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Job search */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Job Position
                </label>
          
                <input
                  value={
                    isRescheduling
                      ? interview?.job?.jobPositionName
                      : jobQuery
                  }
                  onChange={isRescheduling ? undefined : onJobQueryChange}
                  placeholder="Search job positions..."
                  className={`w-full p-2 border border-gray-300 rounded-lg mt-2 ${disabledStyles}`}
                  disabled={isRescheduling || saving}
                />

                {!isRescheduling &&
                  filteredJobs &&
                  !selectedJob &&
                  jobQuery && (
                    <div
                      className={`mt-2 rounded-lg max-h-36 overflow-y-auto ${
                        filteredJobs.length > 0 ? 'border' : ''
                      }`}
                    >
                      {filteredJobs.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">No results</div>
                      ) : (
                        filteredJobs.map((job) => (
                          <div
                            key={job.jobId}
                            onClick={() => {
                              setSelectedJob(job);
                              setJobQuery(job.jobPositionName);
                              setFilteredJobs([]);
                              clearError('job');
                            }}
                            className="p-2 cursor-pointer hover:bg-blue-50"
                          >
                            {job.jobPositionName}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                {errors.job && (
                  <p className="text-red-500 text-xs mt-1">{errors.job}</p>
                )}
              </div>
              
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
                  className={`w-full p-2 border border-gray-300 rounded-lg mt-2 ${disabledStyles}`}
                  disabled={isRescheduling || saving}
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
                              clearError('candidate');
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
                      disabled={saving}
                      onClick={() => setCalendarOpen(true)}
                      className={`px-4 py-2 border rounded-lg border-gray-300 cursor-pointer ${disabledStyles}`}
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
                    onChange={(e) => handleTimeChange(e)}
                    disabled={!selectedDate || saving}
                    className={`w-full p-2 border border-gray-300 rounded-lg mt-2 ${disabledStyles}`}
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
                  disabled={saving}
                  onChange={(e) => handleDurationChange(e)}
                  className={`w-full p-2 border border-gray-300 rounded-lg mt-2 ${disabledStyles}`}
                />
                {errors.duration && (
                  <p className="text-red-500 text-xs mt-1">{errors.duration}</p>
                )}
              </div>
              
              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" disabled={saving}  onClick={() => {if (!isCalendarOpen) {handleCloseModal()};}} className={`px-4 py-2 bg-gray-200 rounded-lg cursor-pointer ${disabledStyles}`}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-6 py-2 text-white rounded-lg ${
                    saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  } `}
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
        </>
        }
    </div>
  );
}
