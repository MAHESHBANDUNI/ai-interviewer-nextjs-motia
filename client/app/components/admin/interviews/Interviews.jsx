'use client';

import AddInterviewForm from "./AddInterviewForm";
import InterviewTable from "./InterviewTable";
import { ChevronDown, Search, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { successToast, errorToast } from "@/app/components/ui/toast";
import { useSession } from "next-auth/react";
import CancelInterviewModal from "./CancelInterviewModal";
import InterviewDetailsModal from "./InterviewDetailsModal";
import LivePreview from "./LivePreview";
import { SocketProvider } from "@/app/providers/SocketProvider";

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
  const [showLivePreviewModal, setShowLivePreviewModal] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [interviewDetails, setInterviewDetails] = useState(null);
  const [interviewSessionToken, setInterviewSessionToken] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Pagination calculations
  const totalItems = filteredInterviews.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInterviews = filteredInterviews.slice(indexOfFirstItem, indexOfLastItem);
  
  // Generate page numbers for display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show limited pages with ellipsis
      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // In the middle
        pageNumbers.push(1);
        pageNumbers.push('...');
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus]);

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
    if (!session?.user?.token) return;

    fetchInterviews();
  }, [session?.user?.token]);

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/interview/schedule`, {
        method: 'POST',
        headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`},
        body: JSON.stringify({candidateId: formData.candidateId, datetime: formData.datetime, duration: formData.duration}),
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/interview/cancel`,
        {
          method: 'PUT',
          headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`},
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

  const handleLivePreviewClick = async (interviewId) => {
    setSelectedInterviewId(interviewId);
    setShowLivePreviewModal(true);
    await fetchInterviewDetails(interviewId);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/interview/reschedule`, {
        method: "PUT",
        headers: {'Content-type':'application/json', 'Authorization':`Bearer ${session?.user?.token}`},
        body: JSON.stringify({
          candidateId: formData.candidateId, interviewId: selectedInterviewId, newDatetime: formData.datetime, oldDatetime: oldInterviewDetails?.scheduledAt, duration: formData.duration}),
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

  // Pagination handlers
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
      setCurrentPage(pageNumber);
    }
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const fetchInterviewDetails = async(interviewId) => {
    if(!interviewId || !session?.user) return ;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/interview/${interviewId}`,
       {
          method: 'GET',
          headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`}
        }
      );
      if(!response.ok){
        errorToast('Problem fetching interview details');
        router.push('/');
      }
      if(response.ok){
        const data = await response.json();
        const {interview, interviewSessionToken} = data.data;
        console.log("Interview details fetched: ",interview);
        setInterviewDetails(interview);
        setInterviewSessionToken(interviewSessionToken);
      }
    }
    catch(err){
      console.error("Error fetching interview details: ",err);
    }
  }

  return (
    <div className="max-w-screen-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 mx-auto p-6 space-y-6" ref={containerRef}>
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
      {interviewsList.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {filteredInterviews.length > 0
            ? <>Showing <span className="font-semibold">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)}</span> of <span className="font-semibold">{totalItems}</span> interviews</>
            : "No interviews found."}
          </p>
          
          {/* Items per page selector - hidden on small screens */}
          <div className="hidden sm:flex items-center space-x-2">
            <span className="text-sm text-gray-600">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-sm text-gray-600">per page</span>
          </div>
        </div>
      )}

      {interviewsList && (
        <div className={`bg-white overflow-hidden ${interviewsList.length>0 && 'rounded-xl border border-gray-200 shadow-sm'}`}>
          <InterviewTable 
            interviews={currentInterviews}
            loading={loading}
            error={error}
            handleCancelInterviewClick={(interviewId) => handleCancelInterviewClick(interviewId)}
            handleInterviewDetailClick={(interviewId) => handleInterviewDetailClick(interviewId)}
            handleRescheduleInterviewClick={(interviewId) => handleRescheduleInterviewClick(interviewId)}
            handleLivePreviewClick={(interviewId) => handleLivePreviewClick(interviewId)}
            selectedInterviewId={selectedInterviewId}
            setSelectedInterviewId={setSelectedInterviewId}
          />
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Mobile items per page selector */}
          <div className="sm:hidden flex items-center space-x-2 w-full justify-center">
            <span className="text-sm text-gray-600">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-sm text-gray-600">per page</span>
          </div>

          <div className="text-sm text-gray-600">
            Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
          </div>

          <div className="flex items-center space-x-1">
            {/* First page button */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Previous page button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers */}
            <div className="flex items-center space-x-1">
              {getPageNumbers().map((pageNum, index) => (
                pageNum === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded-lg border transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              ))}
            </div>

            {/* Next page button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last page button */}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>

          {/* Page jump - hidden on small screens */}
          <div className="hidden md:flex items-center space-x-2">
            <span className="text-sm text-gray-600">Go to:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  handlePageChange(page);
                }
              }}
              className="w-16 text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </div>
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

      
      {showLivePreviewModal && 
        <SocketProvider user={session?.user} interviewId={selectedInterviewId} interviewSessionToken={interviewSessionToken}>
          <LivePreview
            user={session?.user}
            onClose={() => {setShowLivePreviewModal(false);setInterviewDetails(null);setInterviewSessionToken(null);setSelectedInterviewId(null);}}
            interview={interviewDetails}
            interviewSessionToken={interviewSessionToken}
          />
        </SocketProvider>
      }
    </div>
  );
}