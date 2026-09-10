import React from 'react';
import FormField from '../common/FormField';

const SEVERITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const AssessmentSection = () => (
  <div className="bg-white p-4 rounded-lg border border-slate-200 mb-4">
    <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2 uppercase tracking-wide">
      4. INITIAL ASSESSMENT & PRIORITY
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        name="severity"
        label="Initial Severity"
        type="select"
        options={SEVERITY_OPTIONS}
      />
      <FormField
        name="priority"
        label="Priority"
        type="select"
        options={PRIORITY_OPTIONS}
      />
    </div>
  </div>
);

export default AssessmentSection;

