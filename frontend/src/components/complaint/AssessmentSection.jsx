import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateField } from '../../store/complaintSlice';
import { Sparkles } from 'lucide-react';

const AssessmentSection = () => {
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
      <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2 uppercase tracking-wide">4. INITIAL ASSESSMENT & PRIORITY</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
            Initial Severity
            {isAiPopulated('severity') && <Sparkles className="h-3 w-3 text-indigo-500" title="AI Populated" />}
          </label>
          <select
            name="severity"
            value={formData.severity || ''}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isAiPopulated('severity') ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-300'}`}
          >
            <option value="" disabled>Awaiting AI extraction...</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
            Priority
            {isAiPopulated('priority') && <Sparkles className="h-3 w-3 text-indigo-500" title="AI Populated" />}
          </label>
          <select
            name="priority"
            value={formData.priority || ''}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isAiPopulated('priority') ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-300'}`}
          >
            <option value="" disabled>Awaiting AI extraction...</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default AssessmentSection;
