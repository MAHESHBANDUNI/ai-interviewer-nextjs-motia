import { X } from "lucide-react";

export default function DeleteCandidateModal({
  showDeleteCandidateModal,
  setShowDeleteCandidateModal,
  onDeleteCandidate
}) {
  return (
    <>
      {showDeleteCandidateModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-500 flex items-center justify-center p-4"
          onClick={() => {
            setShowDeleteCandidateModal(false);
            setMenuOpen(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Delete Candidate
              </h3>
              <button
                onClick={() => setShowDeleteCandidateModal(false)}
                className="cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <p className="text-md text-slate-900 dark:text-slate-300">
                Are you sure you want to permanently delete this candidate?
              </p>
              <div className="flex flex-row justify-end gap-2 mt-5">
                <button
                  onClick={() => setShowDeleteCandidateModal(false)}
                  className="cursor-pointer px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={onDeleteCandidate}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}