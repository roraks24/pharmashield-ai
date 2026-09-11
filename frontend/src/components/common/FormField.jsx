import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateField } from '../../store/complaintSlice';
import { Sparkles } from 'lucide-react';

/**
 * Reusable FormField component for pharmaceutical complaint forms.
 *
 * Automatically connects to Redux store (`formData`, `dirtyFields`, `extractedData`).
 * Displays an AI indicator tag and sparkle icon (✦) whenever the field is AI-populated
 * and untouched by the user.
 */
const FormField = ({
  name,
  label,
  type = 'text',
  options = [],
  rows = 4,
  suffix = null,
  placeholder = 'Awaiting AI extraction...',
  className = '',
  disabled = false,
}) => {
  const dispatch = useDispatch();
  // Fine-grained selectors isolate re-renders strictly to this specific field
  const value = useSelector((state) => state.complaint.formData[name] ?? '');
  const isDirty = useSelector((state) => Boolean(state.complaint.dirtyFields[name]));
  const isExtracted = useSelector((state) => Boolean(state.analysis.extractedData?.[name]));

  // Field is AI populated if it was extracted by AI and not manually dirtied by the user
  const isAiPopulated = Boolean(isExtracted && !isDirty);

  const handleChange = (e) => {
    dispatch(updateField({ field: name, value: e.target.value, isAIPopulated: false }));
  };


  const baseInputStyle = `w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors ${
    isAiPopulated ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-300'
  } ${placeholder ? 'placeholder-slate-400 placeholder:italic' : ''}`;

  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
        <span>{label}</span>
        {isAiPopulated && (
          <span
            className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-indigo-600 bg-indigo-100/70 px-1.5 py-0.5 rounded"
            title="Auto-extracted by AI"
          >
            <Sparkles className="h-3 w-3 text-indigo-500" />
            AI
          </span>
        )}
      </label>

      <div className="relative">
        {type === 'select' ? (
          <select
            name={name}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={baseInputStyle}
          >
            <option value="" disabled>{placeholder}</option>
            {options.map((opt) => {
              const val = typeof opt === 'object' ? opt.value : opt;
              const lbl = typeof opt === 'object' ? opt.label : opt;
              return <option key={val} value={val}>{lbl}</option>;
            })}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            name={name}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className={`${baseInputStyle} resize-none`}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`${baseInputStyle} ${suffix ? 'pr-8' : ''}`}
          />
        )}

        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-slate-400 text-xs font-semibold">{suffix}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormField;
