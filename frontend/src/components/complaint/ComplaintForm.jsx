import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { saveComplaint, resetForm } from '../../store/complaintSlice';
import { clearAnalysis } from '../../store/analysisSlice';
import CustomerDetails from './CustomerDetails';
import ProductDetails from './ProductDetails';
import ComplaintDetails from './ComplaintDetails';
import AssessmentSection from './AssessmentSection';
import { Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const ComplaintForm = () => {
  const dispatch = useDispatch();
  const { formData, saveStatus, saveError } = useSelector((state) => state.complaint);
  const { risk, summary } = useSelector((state) => state.analysis);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Combine manual form data with current AI analysis payload
    const submissionData = {
      ...formData,
      ai_risk: risk,
      ai_summary: summary,
    };

    dispatch(saveComplaint(submissionData));
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear the form? All unsaved data will be lost.')) {
      dispatch(resetForm());
      dispatch(clearAnalysis());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm p-4">
      {/* Top Banner / Notification */}
      {saveStatus === 'success' && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-sm">
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <span>Complaint saved successfully to the registry.</span>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span>Failed to save complaint: {typeof saveError === 'string' ? saveError : 'Unknown error'}</span>
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
          className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 flex items-center gap-2 disabled:opacity-70 transition-colors shadow-sm"
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
