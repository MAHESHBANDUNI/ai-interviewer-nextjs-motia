import { X } from "lucide-react";
import { useState } from "react";

export default function CloseJobModal({
  showCloseJobModal,
  setShowCloseJobModal,
  onCloseJob
}) {
  const [buttonClicked, setButtonClicked] = useState(false);
  return (
    <>
      {showCloseJobModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-500 flex items-center justify-center p-4"
          onClick={() => {
            setShowCloseJobModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Close Job Position
              </h3>
              <button
                onClick={() => setShowCloseJobModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <p className="text-md text-slate-900 dark:text-slate-300">
                Are you sure you want to close the job position?
              </p>
              <div className="flex flex-row justify-end gap-2 mt-5">
                <button
                  onClick={() => setShowCloseJobModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={()=>{setButtonClicked(true);onCloseJob();}}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  {buttonClicked ? 'Proceeding' : 'Proceed' }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}