'use client';

import { X, Upload, FileText, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { z } from 'zod';

const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/;

const phoneRegex =
  /^(\+?\d{1,3}[- ]?)?\(?\d{2,4}\)?[- ]?\d{3,4}[- ]?\d{3,6}$/;

const allowedFileTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const fileSchema = z
  .instanceof(File, { message: "Resume is required" })
  .refine((file) => file && file.size > 0, "Resume is required")
  .refine((file) => allowedFileTypes.includes(file.type), {
    message: "Invalid file format (PDF, DOC, DOCX only)",
  })
  .refine((file) => file.size <= 5 * 1024 * 1024, {
    message: "File must be under 5MB",
  });

export const candidateSchema = z.object({
  firstName: z.string().trim().min(1, "First Name is required").regex(nameRegex, "Invalid name format"),
  lastName: z.string().trim().min(1, "Last Name is required").regex(nameRegex, "Invalid name format"),
  phoneNumber: z.string().trim().min(1, "Phone Number is required").regex(phoneRegex, "Invalid phone number"),
  email: z.string().trim().min(1, "Email is required").email("Invalid email format"),
  resume: fileSchema,
  declaration: z.boolean().refine(val => val === true, "You must accept the declaration")
});

const AddCandidateForm = ({ isOpen, onClose, onSubmit, saving, setSaving }) => {

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    resume: null,
    declaration: false
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (!e.target.closest('.modal-content')) onClose();
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  // ✔ LIVE VALIDATION (safe)
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    const updatedValue = type === "checkbox" ? checked : type === "file" ? files[0] : value;

    const updatedForm = { ...formData, [name]: updatedValue };
    setFormData(updatedForm);

    // mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));

    // VALIDATE ONLY THIS FIELD
    try {
      const fieldSchema = candidateSchema.pick({ [name]: true });
      fieldSchema.parse({ [name]: updatedValue });

      // clear field error
      setErrors(prev => ({ ...prev, [name]: undefined }));
    } catch (err) {
      if (err instanceof z.ZodError) {
        const issue = err.issues?.[0]?.message || "Invalid value";
        setErrors(prev => ({ ...prev, [name]: issue }));
      }
    }
  };

  // ✔ Full validation on submit
  const validateForm = () => {
    try {
      candidateSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      const formatted = {};
      err.issues.forEach(error => {
        formatted[error.path[0]] = error.message;
      });
      setErrors(formatted);
      return false;
    }
  };

  const isFormValid = () => {
    try {
      candidateSchema.parse(formData);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    setSaving(true);

    if (!validateForm()) {
      setSaving(false);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setFormData({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        email: '',
        resume: null,
        declaration: false,
      });
      setTouched({});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-40 flex items-center justify-center p-4 bg-[#00000082] backdrop-blur-[5px] z-[9999]">
      <div className="modal-content bg-white rounded-lg w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-xl text-white font-semibold">Add New Candidate</h2>
          <button onClick={onClose} className="text-white p-1 cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Name */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name*</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                disabled={saving}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg ${touched.firstName && errors.firstName ? "border-red-500" : "border-gray-300"}`}
                placeholder="Jane"
              />
              {touched.firstName && errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name*</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                disabled={saving}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg ${touched.lastName && errors.lastName ? "border-red-500" : "border-gray-300"}`}
                placeholder="Copper"
              />
              {touched.lastName && errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address*</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled={saving}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg ${touched.email && errors.email ? "border-red-500" : "border-gray-300"}`}
                placeholder="example@mail.com"
              />
              {touched.email && errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number*</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                disabled={saving}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg ${touched.phoneNumber && errors.phoneNumber ? "border-red-500" : "border-gray-300"}`}
                placeholder="(704) 555-0127"
              />
              {touched.phoneNumber && errors.phoneNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
              )}
            </div>
          </div>

          {/* Resume */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Resume*</label>
            <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${touched.resume && errors.resume ? "border-red-500" : "border-gray-300"}`}>
              <label className="cursor-pointer block">
                <input type="file" name="resume" disabled={saving} accept=".pdf,.doc,.docx" onChange={handleChange} className="hidden" />
                {formData.resume ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="text-sm">{formData.resume.name}</span>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-600 mt-2">Click to upload resume</p>
                  </div>
                )}
              </label>
            </div>

            {touched.resume && errors.resume && (
              <p className="text-red-500 text-xs mt-1">{errors.resume}</p>
            )}
          </div>

          {/* Declaration */}
          <div className="flex gap-3">
            <input type="checkbox" name="declaration" checked={formData.declaration} disabled={saving} onChange={handleChange} />
            <label className="text-sm text-gray-700">
              I hereby declare that the above information is true.
            </label>
          </div>
          {touched.declaration && errors.declaration && (
            <p className="text-red-500 text-xs">{errors.declaration}</p>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!isFormValid() || saving}
              className={`px-6 py-2 text-white rounded-lg flex items-center gap-2 cursor-pointer
                ${!isFormValid() || saving ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {saving ? <><Loader className="w-4 h-4" /><p>Saving...</p></> : <><Upload className="w-4 h-4" /><p>Save Candidate</p></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCandidateForm;
