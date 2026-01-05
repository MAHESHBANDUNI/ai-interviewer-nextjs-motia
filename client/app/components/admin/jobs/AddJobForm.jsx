'use client';

import { X, Upload, Loader } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { z } from 'zod';
import RichTextEditor from '../../ui/RichTextEditor';

const lettersOnlyRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;

const schema = z.object({
  jobPositionName: z
    .string()
    .trim()
    .min(1, 'Job position name is required')
    .max(50, 'Job position name must be at most 50 characters')
    .refine(val => lettersOnlyRegex.test(val), {
      message: 'Job position name must only contain letters',
    }),

  jobDescription: z
    .string()
    .trim()
    .min(50, 'Job description is required')
    .max(10000, 'Job description must be at most 10,000 characters'),
});

const AddJobForm = ({
  isOpen,
  onClose,
  onSubmit,
  saving,
  setSaving,
  isEditing,
  job,
}) => {
  const backdropRef = useRef(null);

  const [formData, setFormData] = useState({
    jobPositionName: '',
    jobDescription: '',
  });

  const [errors, setErrors] = useState({});

  // Prefill when editing (same idea as rescheduling interview)
useEffect(() => {
  if (!isEditing || !job) return;

  setFormData({
    jobPositionName: job.jobPositionName ?? '',
    jobDescription: job.jobDescription ?? '',
  });
}, [isEditing, job]);

  const clearError = (field) => {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    clearError(name);
  };

  const handleDescriptionChange = (value) => {
    setFormData(prev => ({
      ...prev,
      jobDescription: value,
    }));

    clearError('jobDescription');
  };

  const validateAndBuildPayload = () => {
    const result = schema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      return null;
    }

    setErrors({});
    return result.data;
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
    setFormData({
      jobPositionName: '',
      jobDescription: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) {
          handleCloseModal();
        }
      }}
      className="fixed inset-0 bg-[#00000082] backdrop-blur-[5px] z-[9999]
                 flex items-center justify-center p-4"
    >
      <div
        className="modal-content bg-white rounded-lg w-full max-w-4xl
                   max-h-[95vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b p-4 bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-xl text-white font-semibold">
            {isEditing ? 'Edit Job Position' : 'Post New Job'}
          </h2>
          <button onClick={handleCloseModal} className="text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Job Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Job Position
            </label>
            <input
              name="jobPositionName"
              value={formData.jobPositionName}
              onChange={handleChange}
              disabled={saving}
              className="w-full p-3 border border-gray-300 rounded-lg mt-2"
            />
            {errors.jobPositionName && (
              <p className="text-red-500 text-xs mt-1">
                {errors.jobPositionName}
              </p>
            )}
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Job Description
            </label>
            <RichTextEditor
              value={formData.jobDescription}
              onChange={handleDescriptionChange}
              error={errors.jobDescription}
            />
            {errors.jobDescription && (
              <p className="text-red-500 text-xs mt-1">
                {errors.jobDescription}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={saving}
              className="px-4 py-2 bg-gray-200 rounded-lg"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2 text-white rounded-lg flex items-center gap-2
                ${saving
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4" />
                  Saving...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {isEditing ? 'Update Job' : 'Post Job'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddJobForm;
