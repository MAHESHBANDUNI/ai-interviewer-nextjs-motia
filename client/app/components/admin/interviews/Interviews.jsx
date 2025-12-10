'use client';

import AddInterviewForm from "./AddInterviewForm";
import InterviewTable from "./InterviewTable";
import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { successToast, errorToast } from "@/app/components/ui/toast";
import { useSession } from "next-auth/react";
import CancelInterviewModal from "./CancelInterviewModal";
import InterviewDetailsModal from "./InterviewDetailsModal";

export default function Interview() {
  const [selectedStatus, setSelectedStatus] = useState("Status");
  const [interviewsList, setInterviewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState(null);
  const [showCancelInterviewModal, setShowCancelInterviewModal] = useState(false);
  const [interviewDetailsModalOpen, setInterviewDetailsModalOpen] = useState(false);
  const [showRescheduleInterviewModalOpen, setShowRescheduleInterviewModalOpen] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const statusRef = useRef(null);
  const positionRef = useRef(null);
  const formRef = useRef(null);
  const containerRef = useRef(null);

  // Filter interviews based on search and filters
  const filteredInterviews = interviewsList.filter(interview => {
    const matchesSearch = interview.candidate.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         interview.candidate.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         interview.candidate.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "Status" || interview.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Handle clicks outside dropdowns
  const handleClickOutside = (event) => {
    if (statusRef.current && !statusRef.current.contains(event.target)) {
      setStatusOpen(false);
    }
    if (positionRef.current && !positionRef.current.contains(event.target)) {
      setPositionOpen(false);
    }
  };

  const clearFilter = (type) => {
    if (type === 'status') {
      setSelectedStatus("Status");
    } else if (type === 'position') {
      setSelectedPosition("Position");
    } else if (type === 'search') {
      setSearchQuery("");
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/interview/list`,
        {
          method: 'GET',
          headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`},
        }
      );
      if (!response.ok) {
        errorToast('Failed to fetch interviews');
        setLoading(false);
        return;
      } else {
        const data = await response.json();
        setInterviewsList(data?.interviews);
        setLoading(false);
      }
    } catch (error) {
      console.log("error", error);
      errorToast('Failed to fetch interviews');
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const submitData = new FormData();
      submitData.append('candidateId', formData.candidateId);
      submitData.append('datetime', formData.datetime);
      submitData.append('duration', formData.duration);
      submitData.append('adminId', session?.user?.id || '');

      const res = await fetch('${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/interviews/schedule', {
        method: 'POST',
        body: submitData,
      });

      const response = await res.json();

      if(!res.ok){
        errorToast('Problem scheduling interview');
        console.error(response?.error || 'Problem scheduling interview');
        setSaving(false);
        setIsFormOpen(false);
        return;
      }
      if(res?.ok){
        successToast('Interview scheduled successfully');
      }
    } catch (error) {
      console.log("error", error);
      errorToast('Problem scheduling interview');
    } finally {
      fetchInterviews();
      setIsFormOpen(false);
      setSaving(false);
    }
  };

  const handleCancelInterview = async () => {
    try {
      const response = await fetch('${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/interviews/cancel',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interviewId: selectedInterviewId })
        }
      );
      if (response?.ok) {
        successToast('Interview cancelled successfully');
      } else if (!response?.ok) {
        errorToast(response?.data?.error || 'Failed to cancel interview');
      } else {
        errorToast('Failed to cancel interview');
      }
    } catch (error) {
      errorToast('Failed to cancel interview');
    }
    finally {
      setShowCancelInterviewModal(false);
      setSelectedInterviewId(null);
      fetchInterviews();
    }
  };

  const handleCancelInterviewClick = async (interviewId) => {
    setSelectedInterviewId(interviewId);
    setShowCancelInterviewModal(true);
  }

  const handleInterviewDetailClick = async (interviewId) => {
    setSelectedInterviewId(interviewId);
    setInterviewDetailsModalOpen(true);
  }

  const handleRescheduleInterviewClick = async (interviewId) => {
    setSelectedInterviewId(interviewId);
    setShowRescheduleInterviewModalOpen(true);
  }

  const handleRescheduleInterview = async (formData) => {
    // Get old interview details
    const oldInterviewDetails = interviewsList.find(
      (i) => i.interviewId === selectedInterviewId
    );

    if (!oldInterviewDetails) {
      errorToast("Old interview details not found");
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append("candidateId", formData.candidateId);
      submitData.append("interviewId", selectedInterviewId);
      submitData.append("newDatetime", formData.datetime);

      // old datetime added properly
      submitData.append("oldDatetime", oldInterviewDetails?.scheduledAt);

      submitData.append("duration", formData.duration);
      submitData.append("adminId", session?.user?.id || "");

      const res = await fetch("${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/interviews/reschedule", {
        method: "PUT",
        body: submitData,
      });

      const response = await res.json();

      if (!res.ok) {
        errorToast("Problem rescheduling interview");
        console.error(response?.error || "Problem rescheduling interview");
        setSaving(false);
        setIsFormOpen(false);
        return;
      }

      successToast("Interview rescheduled successfully");

    } catch (error) {
      console.error("Error:", error);
      errorToast("Problem rescheduling interview");
    } finally {
      fetchInterviews();
      setIsFormOpen(false);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-screen-2xl  bg-gradient-to-br from-slate-50 to-blue-50/30 mx-auto p-6 space-y-6" ref={containerRef}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
          <p className="text-gray-600 mt-1">Manage and track candidate interviews</p>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row">
          <div className="relative w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search interviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full lg:w-64 pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => clearFilter('search')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="cursor-pointer bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 px-6 rounded-full shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
          >
            Schedule Interview
          </button>
        </div>
        
      </div>

      {/* Results Count */}
      {interviewsList.length > 0 && <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredInterviews.length > 0
          ? <>Showing <span className="font-semibold">{filteredInterviews.length}</span> interviews</>
          : "No interviews found."}
          {/* {hasActiveFilters && " (filtered)"} */}
        </p>
      </div>
    }

      {interviewsList && (
        <div className={`bg-white overflow-hidden ${interviewsList.length>0 && 'rounded-xl border border-gray-200 shadow-sm'}`}>
          <InterviewTable 
            interviews={filteredInterviews}
            loading={loading}
            error={error}
            handleCancelInterviewClick={(interviewId) => handleCancelInterviewClick(interviewId)}
            handleInterviewDetailClick={(interviewId) => handleInterviewDetailClick(interviewId)}
            handleRescheduleInterviewClick={(interviewId) => handleRescheduleInterviewClick(interviewId)}
            selectedInterviewId={selectedInterviewId}
            setSelectedInterviewId={setSelectedInterviewId}
          />
        </div>
      )}

      <AddInterviewForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        saving={saving}
        setSaving={setSaving}
      />

      {showCancelInterviewModal && (
        <CancelInterviewModal
          showCancelInterviewModal={showCancelInterviewModal}
          setShowCancelInterviewModal={setShowCancelInterviewModal}
          onCancelInterview={() => handleCancelInterview()}
        />
      )}

      {interviewDetailsModalOpen && 
        <InterviewDetailsModal 
          interviewDetailsModalOpen={interviewDetailsModalOpen}
          setInterviewDetailsModalOpen={setInterviewDetailsModalOpen}
          selectedInterviewId={selectedInterviewId}
          interview={interviewsList.find(i => i.interviewId === selectedInterviewId)}
        />
      }

      {showRescheduleInterviewModalOpen && <AddInterviewForm 
        isOpen={showRescheduleInterviewModalOpen} 
        onClose={() => setShowRescheduleInterviewModalOpen(false)}
        onSubmit={handleRescheduleInterview}
        saving={saving}
        setSaving={setSaving}
        selectedInterviewId={selectedInterviewId}
        isRescheduling='true'
        interview={interviewsList.find(i => i.interviewId === selectedInterviewId)}
      />}
    </div>
  );
}