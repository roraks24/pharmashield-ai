import React from 'react';
import FormField from '../common/FormField';

const COMPLAINT_TYPES = [
  'Foreign Matter',
  'Contamination',
  'Packaging/Labeling',
  'Potency/Efficacy',
  'Stability',
  'Adverse Reaction',
  'Documentation',
  'Other',
];

const ComplaintDetails = () => (
  <div className="bg-white p-4 rounded-lg border border-slate-200 mb-4">
    <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2 uppercase tracking-wide">
      3. COMPLAINT DETAILS
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        name="complaint_type"
        label="Complaint Type"
        type="select"
        options={COMPLAINT_TYPES}
      />
      <FormField name="complaint_date" label="Complaint Date" type="date" />
      <FormField
        name="description"
        label="Detailed Complaint Description"
        type="textarea"
        rows={4}
        className="md:col-span-2"
      />
    </div>
  </div>
);

export default ComplaintDetails;

