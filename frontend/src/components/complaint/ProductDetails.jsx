import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateField } from '../../store/complaintSlice';
import { Sparkles } from 'lucide-react';

const ProductDetails = () => {
  const dispatch = useDispatch();
  const { formData, dirtyFields } = useSelector((state) => state.complaint);
  const { extractedData } = useSelector((state) => state.analysis);

  const handleChange = (e) => {
    dispatch(updateField({ field: e.target.name, value: e.target.value, isAIPopulated: false }));
  };

  const isAiPopulated = (field) => {
    return extractedData && extractedData[field] && !dirtyFields[field];
  };

  const renderField = (name, label, type = "text", suffix = null) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
        {label}
        {isAiPopulated(name) && <Sparkles className="h-3 w-3 text-indigo-500" title="AI Populated" />}
      </label>
      <div className="relative">
        <input
          type={type}
          name={name}
          placeholder="Awaiting AI extraction..."
          value={formData[name] || ''}
          onChange={handleChange}
          className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 placeholder:italic ${isAiPopulated(name) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-300'} ${suffix ? 'pr-8' : ''}`}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{suffix}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 mb-4">
      <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2 uppercase tracking-wide">2. PRODUCT & BATCH IDENTIFICATION</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderField('product_name', 'Product Name')}
        {renderField('product_strength_grade', 'Product Strength/Grade')}
        {renderField('batch_number', 'Batch/Lot Number')}
        {renderField('manufacturing_date', 'Manufacturing Date', 'date')}
        {renderField('expiry_date', 'Expiry Date', 'date')}
        {renderField('quantity_affected', 'Quantity Affected', 'text', 'kg')}
      </div>
    </div>
  );
};

export default ProductDetails;
