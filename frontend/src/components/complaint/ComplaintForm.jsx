import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { saveComplaint, updateMultipleFields, resetForm } from '../../store/complaintSlice';
import { resetAnalysis } from '../../store/analysisSlice';
import CustomerDetails from './CustomerDetails';
import ProductDetails from './ProductDetails';
import ComplaintDetails from './ComplaintDetails';
import AssessmentSection from './AssessmentSection';
import { Save, RefreshCw, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const ComplaintForm = () => {
  const dispatch = useDispatch();
  const { formData, saveStatus, savedComplaintId } = useSelector((state) => state.complaint);
  const { extractedData, extractionStatus, rawAnalysis } = useSelector((state) => state.analysis);

  const [clientError, setClientError] = React.useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    setClientError(null);

    // Pharma complaint records require a non-empty description narrative
    if (!formData.description || !formData.description.trim()) {
      setClientError('Detailed Complaint Description is required before saving.');
      return;
    }

    dispatch(saveComplaint({ formData, analysis: rawAnalysis }));
  };

  const handleReset = () => {
    if (window.confirm('Reset all fields and analysis? This cannot be undone.')) {
      setClientError(null);
      dispatch(resetForm());
      dispatch(resetAnalysis());
    }
  };


  const getStatusBadge = () => {
    const status = formData.status || 'Draft';
    if (status === 'Draft') {
      return <span className="px-3 py-1 text-sm font-semibold text-yellow-700 bg-yellow-50 border border-yellow-300 rounded-full">Pending Triage</span>;
    }
    return <span className="px-3 py-1 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-300 rounded-full">{status}</span>;
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col h-full bg-slate-50 p-2 rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Log Customer Complaint</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            API & FDF Quality Assurance Module
          </p>
        </div>
        <div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Status banners */}
      {clientError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-300 text-amber-800 rounded-lg text-sm font-medium">
          {clientError}
        </div>
      )}

      {saveStatus === 'saved' && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Complaint saved successfully!
          {savedComplaintId && (
            <span className="ml-1 font-mono text-xs bg-emerald-100 px-2 py-0.5 rounded">
              ID: {savedComplaintId.slice(0, 8)}...
            </span>
          )}
        </div>
      )}


      {saveStatus === 'error' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          Error saving complaint. Please check required fields and try again.
        </div>
      )}

      {/* Form sections */}
      <div className="overflow-y-auto flex-grow px-2 space-y-6 custom-scrollbar pb-6">
        <CustomerDetails />
        <ProductDetails />
        <ComplaintDetails />
        <AssessmentSection />
      </div>

      {/* Bottom bar */}
      <div className="pt-4 mt-2 border-t border-slate-200 flex justify-between items-center px-2">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Reset Form
        </button>
        <button
          type="submit"
          disabled={saveStatus === 'saving'}
          className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center gap-2 disabled:opacity-70 transition-colors shadow-sm"
        >
          {saveStatus === 'saving' ? (
            <LoadingSpinner size="sm" className="text-white" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Complaint
        </button>
      </div>
    </form>
  );
};

export default ComplaintForm;
