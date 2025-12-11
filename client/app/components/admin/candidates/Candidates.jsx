'use client';

import AddCandidateForm from "./AddCandidateForm";
import CandidateTable from "./CandidateTable";
import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { successToast, errorToast } from "@/app/components/ui/toast";
import { useSession } from "next-auth/react";
import CandidateDetailsModal from "./CandidateDetailsModal";
import DeleteCandidateModal from "./DeleteCandidateModal";

export default function Candidates() {
  const [statusOpen, setStatusOpen] = useState(false);
  const [positionOpen, setPositionOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("Status");
  const [selectedPosition, setSelectedPosition] = useState("Position");
  const [candidatesList, setCandidatesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [candidateDetailsModalOpen, setCandidateDetailsModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState([]);
  const [showDeleteCandidateModal, setShowDeleteCandidateModal] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const statusRef = useRef(null);
  const positionRef = useRef(null);
  const formRef = useRef(null);
  const containerRef = useRef(null);

  // Filter candidates based on search and filters
  const filteredCandidates = candidatesList.filter(candidate => {
    const matchesSearch = candidate.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         candidate.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "Status" || candidate.status === selectedStatus;
    
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
    if (type === 'search') {
      setSearchQuery("");
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!session?.user?.token) return;

    fetchCandidates();
  }, [session?.user?.token]);


  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/candidate/list`,
        {
          method: 'GET',
          headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`}
        }
      );
      if (!response.ok) {
        errorToast('Failed to fetch candidates');
        setLoading(false);
        return;
      } else {
        const data = await response.json();
        setCandidatesList(data?.candidates);
        setLoading(false);
      }
    } catch (error) {
      console.log("error", error);
      errorToast('Failed to fetch candidates');
      setLoading(false);
    }
  };

  const handleResumeUpload = async(resume) => {
    try{
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/candidate/resume/upload`, {
          method: "POST",
          headers: {
            "Content-Type": file.type,
            "x-file-name": file.name
          },
          body: new Uint8Array(await file.arrayBuffer())
        });
        if(!response.ok){
          errorToast('Problem creating candidate');
          console.error(response?.error || 'Problem creating candidate');
          setSaving(false);
          setIsFormOpen(false);
          return;
        }
        if(response?.ok){
          const data = await response.json();
          return data.resumeUrl;
        }
      }
      catch(error){

      }
  }

  const handleSubmit = async (formData) => {
    try {
      const resumeData ={
        filename: formData.resume.name,
        type: formData.resume.type,
        data: await formData.resume.arrayBuffer().then(b => Buffer.from(b).toString("base64")),
      }
      const resumeUrl = await handleResumeUpload(resumeData);
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/candidate/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.token}`
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          resumeUrl: resumeUrl
          }),
      });

      const response = await res.json();

      if(!res.ok){
        errorToast('Problem creating candidate');
        console.error(response?.error || 'Problem creating candidate');
        setSaving(false);
        setIsFormOpen(false);
        return;
      }
      if(res?.ok){
        successToast('Candidate created successfully');
      }
    } catch (error) {
      console.log("error", error);
      errorToast('Problem creating candidate');
    } finally {
      await fetchCandidates();
      setIsFormOpen(false);
      setSaving(false);
    }
  };

  const handleUpdate = async (candidateId, status) => {
    try {
      // const response = await updateCandidateStatus(candidateId, status);
      const response = { status: 200 }; // Mock response
      if (response?.status === 200) {
        successToast('Candidate status updated successfully');
        fetchCandidates();
      } else if (response) {
        errorToast(response?.response?.data?.error || 'Failed to update candidate status');
      } else {
        errorToast('Failed to update candidate status');
      }
    } catch (error) {
      errorToast('Failed to update candidate status');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/candidate/delete`,
        {
          method: 'DELETE',
          headers: {'Content-type':'application/json','Authorization':`Bearer ${session?.user?.token}`},
          body: JSON.stringify({ candidateId: selectedCandidateId })
        }
      );
      if (response?.ok) {
        successToast('Candidate deleted successfully');
      } else if (!response?.ok) {
        errorToast(response?.data?.error || 'Failed to delete candidate');
      } else {
        errorToast('Failed to delete candidate');
      }
    } catch (error) {
      errorToast('Failed to delete candidate');
    }
    finally {
      setShowDeleteCandidateModal(false);
      setSelectedCandidateId(null);
      fetchCandidates();
    }
  };

  const handleResumeDownload = async (candidateId) => {
    try {
      // const response = await downloadResume(candidateId);
      const response = { status: 200, data: { data: { url: 'https://example.com/resume.pdf' } } }; // Mock response
      if (response?.status === 200) {
        window.open(response.data?.data?.url, '_blank');
        successToast('Resume downloaded successfully');
      } else if (response) {
        errorToast(response?.data?.error || 'Failed to download resume');
      } else {
        errorToast('Failed to download resume');
      }
    } catch (error) {
      errorToast('Failed to download resume');
    }
  };

  const handleCandidateDetailsClick = async (candidateId) => {
    setSelectedCandidateId(candidateId);
    setSelectedCandidate(candidatesList.find(c => c.candidateId === candidateId));
    setCandidateDetailsModalOpen(true);
  }

  const handleCandidateDeleteClick = async (candidateId) => {
    setSelectedCandidateId(candidateId);
    setShowDeleteCandidateModal(true);
  }

  return (
    <div className="max-w-screen-2xl mx-auto  bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 space-y-6" ref={containerRef}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="text-gray-600 mt-1">Manage and track candidate applications</p>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row">
          <div className="relative w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full lg:w-64 pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => clearFilter('search')}
                  className="cursor-pointer absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {candidatesList.length>0 && <button 
            onClick={() => setIsFormOpen(true)}
            className="cursor-pointer bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 px-6 rounded-full shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
          >
            Add Candidate
          </button>}
        </div>
        
      </div>

      {/* Results Count */}
      {candidatesList.length > 0 && <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredCandidates.length > 0
          ? <>Showing <span className="font-semibold">{filteredCandidates.length}</span> candidates</>
          : "No candidates found."}
        </p>
      </div>
    }

      {candidatesList && (
        <div className={`bg-white overflow-hidden ${candidatesList.length>0 && 'rounded-xl border border-gray-200 shadow-sm'}`}>
          <CandidateTable 
            candidates={filteredCandidates}
            loading={loading}
            error={error}
            onUpdate={handleUpdate}
            onDownload={handleResumeDownload}
            onClickCandidateDetails={handleCandidateDetailsClick}
            handleCandidateDeleteClick={handleCandidateDeleteClick}
            setIsFormOpen={setIsFormOpen}
            selectedCandidateId={selectedCandidateId}
            setSelectedCandidateId={setSelectedCandidateId}
          />
        </div>
      )}

      <AddCandidateForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        saving={saving}
        setSaving={setSaving}
      />

      {candidateDetailsModalOpen && 
        <CandidateDetailsModal 
          candidateDetailsModalOpen={candidateDetailsModalOpen}
          setCandidateDetailsModalOpen={setCandidateDetailsModalOpen}
          // candidateId={selectedCandidateId}
          candidate={selectedCandidate}
        />
      }

      {showDeleteCandidateModal && (
        <DeleteCandidateModal
          showDeleteCandidateModal={showDeleteCandidateModal}
          setShowDeleteCandidateModal={setShowDeleteCandidateModal}
          onDeleteCandidate={() => handleDelete()}
        />
      )}
    </div>
  );
}