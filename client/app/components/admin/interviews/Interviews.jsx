'use client';

import AddInterviewForm from "./AddInterviewForm";
import InterviewTable from "./InterviewTable";
import { ChevronDown, Search, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, User2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { successToast, errorToast } from "@/app/components/ui/toast";
import { useSession } from "next-auth/react";
import CancelInterviewModal from "./CancelInterviewModal";
import InterviewDetailsModal from "./InterviewDetailsModal";
import LivePreview from "./LivePreview";
import { SocketProvider } from "@/app/providers/SocketProvider";

export default function Interviews() {
  const [selectedStatus, setSelectedStatus] = useState("Status");
  const [statusOpen, setStatusOpen] = useState(false);
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
  const [interviewStreamToken, setInterviewStreamToken] = useState(null);
  const [interviewStreamUrl, setInterviewStreamUrl] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const statusRef = useRef(null);
  const formRef = useRef(null);
  const containerRef = useRef(null);

  // Get unique statuses from interviews
  const statusOptions = ["All", ...new Set(interviewsList.map(interview => interview.status).filter(Boolean))];

  // Filter interviews based on search and filters
  const filteredInterviews = interviewsList.filter(interview => {
    const matchesSearch = interview.candidate.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         interview.candidate.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         interview.candidate.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "Status" || 
                         selectedStatus === "All" || 
                         interview.status === selectedStatus;
    
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
  };

  const clearFilter = (type) => {
    if (type === 'status') {
      setSelectedStatus("Status");
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/interviews/list`,
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
        body: JSON.stringify({jobId: formData.jobId, candidateId: formData.candidateId, datetime: formData.datetime, duration: formData.duration}),
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
    await joinInterviewStream(interviewId);
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

  const joinInterviewStream = async(interviewId) => {
    try{
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/interview/stream`, {
          method: "POST",
          headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`},
          body: JSON.stringify({
            interviewId,
          })
        });
      
        const data = await res.json();
        setInterviewStreamToken(data?.data?.token);
        setInterviewStreamUrl(data?.data?.url);
    }
    catch(error){
      console.error("Failed to join interview");
    }
  }

  return (
    <div className="max-w-screen-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 mx-auto p-4 sm:p-6 space-y-6" ref={containerRef}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
          <p className="text-gray-600 mt-1">Manage and track candidate interviews</p>
        </div>

        {!loading && <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search and Filter Bar */}

          {currentInterviews.length > 0 && <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search interviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all duration-200"
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

            {/* Status Filter */}
            <div className="relative" ref={statusRef}>
              <button
                onClick={() => setStatusOpen(!statusOpen)}
                className={`flex items-center justify-between w-full sm:w-auto px-4 py-2.5 border rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 ${
                  selectedStatus !== "Status" ? "border-blue-300 bg-blue-50/50" : "border-gray-200"
                } ${statusOpen ? "ring-2 ring-blue-100 border-blue-300" : ""}`}
              >
                <div className="flex items-center gap-2 pr-1.5">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    {selectedStatus === "Status" ? "Status" : `${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1).toLowerCase()}`}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${statusOpen ? "rotate-180" : ""}`} />
              </button>

              {statusOpen && (
                <div className="absolute z-50 mt-2 w-full sm:w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setSelectedStatus(status);
                        setStatusOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                        selectedStatus === status ? "bg-blue-50 text-blue-600" : "text-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>
                          {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                        </span>
                        {selectedStatus === status && (
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                    </button>
                  ))}
                  
                </div>
              )}
            </div>
          </div>}

          {/* Schedule Interview Button */}
          <button 
            onClick={() => setIsFormOpen(true)}
            className="cursor-pointer bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 px-6 rounded-full shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            Schedule Interview
          </button>
        </div>}
      </div>

      {/* Active Filters */}
      {/* {(selectedStatus !== "Status" || searchQuery) && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-xl border border-gray-200">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {selectedStatus !== "Status" && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
              <span>Status: {selectedStatus}</span>
              <button
                onClick={() => clearFilter('status')}
                className="ml-1 text-blue-500 hover:text-blue-700"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {searchQuery && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-sm">
              <span>Search: "{searchQuery}"</span>
              <button
                onClick={() => clearFilter('search')}
                className="ml-1 text-gray-500 hover:text-gray-700"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {(selectedStatus !== "Status" || searchQuery) && (
            <button
              onClick={() => {
                clearFilter('status');
                clearFilter('search');
              }}
              className="ml-2 text-sm text-red-600 hover:text-red-700 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      )} */}

      {/* Results Count */}
      {interviewsList.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <p className="text-sm text-gray-600">
              {filteredInterviews.length > 0
              ? <>Showing <span className="font-semibold">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)}</span> of <span className="font-semibold">{totalItems}</span> interviews</>
              : "No interviews found with current filters."}
            </p>
            
            {/* {selectedStatus !== "Status" && selectedStatus !== "All" && (
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  {filteredInterviews.length} {filteredInterviews.length === 1 ? 'interview' : 'interviews'} with status "{selectedStatus}"
                </span>
              </div>
            )} */}
          </div>
          
          {/* Items per page selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 hidden sm:inline">Show:</span>
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
            <span className="text-sm text-gray-600 hidden sm:inline">per page</span>
          </div>
        </div>
      )}

      {loading &&
      <div className="bg-white overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Loading Interviews
            </p>
            <p className="text-sm text-gray-500">Preparing your interview dashboard</p>
          </div>
        </div>
      </div>
      }

      {!loading && currentInterviews.length === 0 && 
        <div className="bg-white overflow-hidden rounded-xl border border-gray-200 shadow-sm">
           <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-gradient-to-br from-gray-50/80 to-blue-50/80 backdrop-blur-sm rounded-2xl border border-gray-200/60">
             <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200/50">
               <User2 className="w-12 h-12 text-blue-600/80" />
             </div>
             <h3 className="text-2xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
               No Interviews found
             </h3>
           </div>
        </div>
      }

      {!loading && currentInterviews.length>0 && (
        <div className={`bg-white overflow-hidden ${currentInterviews.length>0 && 'rounded-xl border border-gray-200 shadow-sm'}`}>
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

          {/* Page jump */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 hidden md:inline">Go to:</span>
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

      
      {showLivePreviewModal && (  
      <>
        {interviewSessionToken && session?.user && interviewStreamToken && interviewStreamUrl ? (
          <SocketProvider
            user={session?.user}
            interviewId={selectedInterviewId}
            interviewSessionToken={interviewSessionToken}
          >
            <LivePreview
              user={session?.user}
              interview={interviewDetails}
              interviewSessionToken={interviewSessionToken}
              interviewStreamToken={interviewStreamToken}
              interviewStreamUrl={interviewStreamUrl}
              onClose={() => {
                setShowLivePreviewModal(false);
                setInterviewDetails(null);
                setInterviewSessionToken(null);
                setSelectedInterviewId(null);
                setInterviewSessionToken(null);
                setInterviewStreamUrl(null);
              }}
            />
          </SocketProvider>
        ) : (
          <div className="fixed inset-0 z-[1000]">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={()=>{
                setShowLivePreviewModal(false);
                setInterviewDetails(null);
                setInterviewSessionToken(null);
                setSelectedInterviewId(null);
                setInterviewSessionToken(null);
                setInterviewStreamUrl(null);
              }}
            />
              <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-2 sm:p-4">
                <div
                  className="pointer-events-auto relative w-full max-w-7xl rounded-2xl shadow-2xl bg-white dark:bg-gray-900 flex flex-col h-auto max-h-[95vh] p-8 sm:p-12"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header Skeleton */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-48 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
                        <div className="h-3 w-32 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 animate-pulse rounded"></div>
                      </div>
                    </div>
                    <div className="h-10 w-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded-lg"></div>
                  </div>
            
                  {/* Main Content Area */}
                  <div className="flex-1 flex flex-col lg:flex-row gap-6">
                    {/* Video Panel Skeleton */}
                    <div className="flex-1 space-y-4">
                      <div className="aspect-video rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="inline-flex items-center gap-3">
                              <div className="relative">
                                <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                              </div>
                              <div className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">
                                Connecting to live interview...
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                              Please wait while we establish a secure connection
                            </p>
                          </div>
                        </div>
                      </div>
            
                      {/* Controls Skeleton */}
                      <div className="flex items-center justify-center gap-4 p-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse"
                          ></div>
                        ))}
                      </div>
                    </div>
                      
                    {/* Side Panel Skeleton */}
                    <div className="lg:w-80 space-y-6">
                      {/* Timer */}
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <div className="h-4 w-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded mb-2"></div>
                        <div className="h-8 w-32 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 animate-pulse rounded"></div>
                      </div>
                      
                      {/* Question */}
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <div className="h-4 w-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded mb-3"></div>
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
                          <div className="h-3 w-4/5 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
                          <div className="h-3 w-3/4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <div className="h-4 w-28 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded mb-3"></div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
                          <div className="h-3 w-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        )}
      </>
      )}

    </div>
  );
}