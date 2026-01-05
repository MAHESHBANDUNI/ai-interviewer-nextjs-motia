'use client';

import AddJobForm from "./AddJobForm";
import JobTable from "./JobTable";
import { ChevronDown, Search, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { successToast, errorToast } from "@/app/components/ui/toast";
import { useSession } from "next-auth/react";
import CloseJobModal from "./CloseJobModal";
import JobDetailsModal from "./JobDetailsModal";

export default function Jobs() {
  const [selectedStatus, setSelectedStatus] = useState("Status");
  const [statusOpen, setStatusOpen] = useState(false);
  const [jobsList, setJobsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [showCloseJobModal, setShowCloseJobModal] = useState(false);
  const [jobDetailsModalOpen, setJobDetailsModalOpen] = useState(false);
  const [showEditJobDetailsModalOpen, setShowEditJobDetailsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [jobDetails, setJobDetails] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const statusRef = useRef(null);
  const formRef = useRef(null);
  const containerRef = useRef(null);

  // Get unique statuses from jobs
  const statusOptions = ["All", ...new Set(jobsList.map(job => job.jobStatus).filter(Boolean))];

  // Filter jobs based on search and filters
  const filteredJobs = jobsList.filter(job => {
    const matchesSearch = job.jobPositionName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "Status" || 
                         selectedStatus === "All" || 
                         job.jobStatus === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalItems = filteredJobs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstItem, indexOfLastItem);
  
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

    fetchJobs();
  }, [session?.user?.token]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/job/list`,
        {
          method: 'GET',
          headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`},
        }
      );
      if (!response.ok) {
        errorToast('Failed to fetch jobs');
        setLoading(false);
        return;
      } else {
        const data = await response.json();
        setJobsList(data?.jobs);
        setLoading(false);
      }
    } catch (error) {
      console.log("error", error);
      errorToast('Failed to fetch jobs');
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/job/create`, {
        method: 'POST',
        headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`},
        body: JSON.stringify({jobPositionName: formData.jobPositionName, jobDescription: formData.jobDescription}),
      });

      const response = await res.json();

      if(!res.ok){
        errorToast('Problem creating job');
        console.error(response?.error || 'Problem creating job');
        setSaving(false);
        setIsFormOpen(false);
        return;
      }
      if(res?.ok){
        successToast('Jobs scheduled successfully');
      }
    } catch (error) {
      console.log("error", error);
      errorToast('Problem creating job');
    } finally {
      fetchJobs();
      setIsFormOpen(false);
      setSaving(false);
    }
  };

  const handleCloseJob = async () => {
    console.log("reached: ",selectedJobId);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/job/status`,
        {
          method: 'PUT',
          headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`},
          body: JSON.stringify({ jobId: selectedJobId })
        }
      );
      if (response?.ok) {
        successToast('Jobs status changed successfully');
      } else if (!response?.ok) {
        errorToast(response?.data?.error || 'Failed to change job status');
      } else {
        errorToast('Failed to change job status');
      }
    } catch (error) {
      errorToast('Failed to change job status');
    }
    finally {
      setShowCloseJobModal(false);
      setSelectedJobId(null);
      fetchJobs();
    }
  };

  const handleCloseJobClick = async (jobId) => {
    setSelectedJobId(jobId);
    setShowCloseJobModal(true);
  }

  const handleJobDetailsClick = async (jobId) => {
    setSelectedJobId(jobId);
    setJobDetailsModalOpen(true);
  }

  const handleEditJobClick = async (jobId) => {
    setSelectedJobId(jobId);
    setShowEditJobDetailsModalOpen(true);
  }

  const handleEditJob = async (formData) => {
    // Get old job details
    const oldJobDetails = jobsList.find(
      (i) => i.jobId === selectedJobId
    );

    if (!oldJobDetails) {
      errorToast("Old job details not found");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/job/update`, {
        method: "PUT",
        headers: {'Content-type':'application/json', 'Authorization':`Bearer ${session?.user?.token}`},
        body: JSON.stringify({
          jobId: selectedJobId, jobPositionName: formData.jobPositionName, jobDescription: formData.jobDescription}),
      });

      const response = await res.json();

      if (!res.ok) {
        errorToast("Problem creating job");
        console.error(response?.error || "Problem creating job");
        setSaving(false);
        setIsFormOpen(false);
        return;
      }

      successToast("Job created successfully");

    } catch (error) {
      console.error("Error:", error);
      errorToast("Problem creating job");
    } finally {
      fetchJobs();
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

  const fetchJobDetails = async(jobId) => {
    if(!jobId || !session?.user) return ;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/job/${jobId}`,
       {
          method: 'GET',
          headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`}
        }
      );
      if(!response.ok){
        errorToast('Problem fetching job details');
        router.push('/');
      }
      if(response.ok){
        const data = await response.json();
        const {job, jobSessionToken} = data.data;
        console.log("Job details fetched: ",job);
        setJobDetails(job);
      }
    }
    catch(err){
      console.error("Error fetching job details: ",err);
    }
  }

  return (
    <div className="max-w-screen-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 mx-auto p-4 sm:p-6 space-y-6" ref={containerRef}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-600 mt-1">Manage and track job positions</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
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
                        <span>{status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}</span>
                        {selectedStatus === status && (
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Create Jobs Button */}
          <button 
            onClick={() => setIsFormOpen(true)}
            className="cursor-pointer bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 px-6 rounded-full shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            Post New Job
          </button>
        </div>
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
      {jobsList.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <p className="text-sm text-gray-600">
              {filteredJobs.length > 0
              ? <>Showing <span className="font-semibold">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)}</span> of <span className="font-semibold">{totalItems}</span> jobs</>
              : "No jobs found with current filters."}
            </p>
            
            {/* {selectedStatus !== "Status" && selectedStatus !== "All" && (
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} with status "{selectedStatus}"
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

      {jobsList && (
        <div className={`bg-white overflow-hidden ${jobsList.length>0 && 'rounded-xl border border-gray-200 shadow-sm'}`}>
          <JobTable 
            jobs={currentJobs}
            loading={loading}
            error={error}
            handleCloseJobClick={(jobId) => handleCloseJobClick(jobId)}
            handleJobDetailsClick={(jobId) => handleJobDetailsClick(jobId)}
            handleEditJobClick={(jobId) => handleEditJobClick(jobId)}
            selectedJobId={selectedJobId}
            setSelectedJobId={setSelectedJobId}
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

      <AddJobForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        saving={saving}
        setSaving={setSaving}
      />

      {showCloseJobModal && (
        <CloseJobModal
          showCloseJobModal={showCloseJobModal}
          setShowCloseJobModal={setShowCloseJobModal}
          onCloseJob={() => handleCloseJob()}
        />
      )}

      {jobDetailsModalOpen && 
        <JobDetailsModal 
          jobDetailsModalOpen={jobDetailsModalOpen}
          setJobDetailsModalOpen={setJobDetailsModalOpen}
          selectedJobId={selectedJobId}
          jobDetails={jobsList.find(i => i.jobId === selectedJobId)}
        />
      }

      {setShowEditJobDetailsModalOpen && <AddJobForm 
        isOpen={showEditJobDetailsModalOpen} 
        onClose={() => setShowEditJobDetailsModalOpen(false)}
        onSubmit={handleEditJob}
        saving={saving}
        setSaving={setSaving}
        selectedJobId={selectedJobId}
        isEditing='true'
        job={jobsList.find(i => i.jobId === selectedJobId)}
      />}

    </div>
  );
}