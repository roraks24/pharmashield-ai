import React from 'react';
import { useSelector } from 'react-redux';
import { Target } from 'lucide-react';

const CompletenessCheck = () => {
  const { completeness, extractionStatus } = useSelector((state) => state.analysis);

  if (extractionStatus !== 'success' || !completeness) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Target className="h-4 w-4 text-indigo-500" />
          Data Completeness
        </h3>
        <span className={`text-sm font-bold ${completeness.score >= 80 ? 'text-emerald-600' : completeness.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
          {completeness.score}%
        </span>
      </div>
      
      <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
        <div 
          className={`h-2 rounded-full ${completeness.score >= 80 ? 'bg-emerald-500' : completeness.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
          style={{ width: `${completeness.score}%` }}
        ></div>
      </div>

      {completeness.missing_fields && completeness.missing_fields.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Missing Key Fields</h4>
          <ul className="flex flex-wrap gap-2">
            {completeness.missing_fields.map((field, idx) => (
              <li key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                {field}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CompletenessCheck;
