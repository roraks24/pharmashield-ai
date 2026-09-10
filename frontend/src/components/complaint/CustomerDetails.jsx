import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateField } from '../../store/complaintSlice';
import { Sparkles } from 'lucide-react';

const CustomerDetails = () => {
  const dispatch = useDispatch();
  const { formData, dirtyFields } = useSelector((state) => state.complaint);
  const { extractedData } = useSelector((state) => state.analysis);

  const handleChange = (e) => {
    dispatch(updateField({ field: e.target.name, value: e.target.value, isAIPopulated: false }));
  };

  const isAiPopulated = (field) => {
    return extractedData && extractedData[field] && !dirtyFields[field];
  };

  const renderField = (name, label, type = "text") => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
        {label}
        {isAiPopulated(name) && <Sparkles className="h-3 w-3 text-indigo-500" title="AI Populated" />}
      </label>
      <input
        type={type}
        name={name}
        placeholder="Awaiting AI extraction..."
        value={formData[name] || ''}
        onChange={handleChange}
        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 placeholder:italic ${isAiPopulated(name) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-300'}`}
      />
    </div>
  );

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 mb-4">
      <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2 uppercase tracking-wide">1. ORIGIN & CUSTOMER DETAILS</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
            Complaint Source
            {isAiPopulated('complaint_source') && <Sparkles className="h-3 w-3 text-indigo-500" title="AI Populated" />}
          </label>
          <select
            name="complaint_source"
            value={formData.complaint_source || ''}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isAiPopulated('complaint_source') ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-300'}`}
          >
            <option value="" disabled>Awaiting AI extraction...</option>
            <option value="Email">Email</option>
            <option value="Portal">Portal</option>
            <option value="Phone">Phone</option>
            <option value="Document">Document</option>
            <option value="Other">Other</option>
          </select>
        </div>
        {renderField('customer_name', 'Customer Name')}
        {renderField('customer_contact', 'Customer Contact')}
      </div>
    </div>
  );
};

export default CustomerDetails;
