import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateField } from '../../store/complaintSlice';
import { Sparkles } from 'lucide-react';

const ComplaintDetails = () => {
  const dispatch = useDispatch();
  const { formData, dirtyFields } = useSelector((state) => state.complaint);
  const { extractedData } = useSelector((state) => state.analysis);

  const handleChange = (e) => {
    dispatch(updateField({ field: e.target.name, value: e.target.value, isAIPopulated: false }));
  };

  const isAiPopulated = (field) => {
    return extractedData && extractedData[field] && !dirtyFields[field];
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 mb-4">
      <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2 uppercase tracking-wide">3. COMPLAINT DETAILS</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
            Complaint Type
            {isAiPopulated('complaint_type') && <Sparkles className="h-3 w-3 text-indigo-500" title="AI Populated" />}
          </label>
          <select
            name="complaint_type"
            value={formData.complaint_type || ''}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isAiPopulated('complaint_type') ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-300'}`}
          >
            <option value="" disabled>Awaiting AI extraction...</option>
            <option value="Foreign Matter">Foreign Matter</option>
            <option value="Contamination">Contamination</option>
            <option value="Packaging/Labeling">Packaging/Labeling</option>
            <option value="Potency/Efficacy">Potency/Efficacy</option>
            <option value="Stability">Stability</option>
            <option value="Adverse Reaction">Adverse Reaction</option>
            <option value="Documentation">Documentation</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
            Complaint Date
            {isAiPopulated('complaint_date') && <Sparkles className="h-3 w-3 text-indigo-500" title="AI Populated" />}
          </label>
          <input
            type="date"
            name="complaint_date"
            placeholder="Awaiting AI extraction..."
            value={formData.complaint_date || ''}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 placeholder:italic ${isAiPopulated('complaint_date') ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-300'}`}
          />
        </div>
        <div className="mb-4 md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
            Detailed Complaint Description
            {isAiPopulated('description') && <Sparkles className="h-3 w-3 text-indigo-500" title="AI Populated" />}
          </label>
          <textarea
            name="description"
            placeholder="Awaiting AI extraction..."
            value={formData.description || ''}
            onChange={handleChange}
            rows={4}
            className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 placeholder:italic ${isAiPopulated('description') ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-300'}`}
          />
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetails;
