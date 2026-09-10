import React from 'react';
import FormField from '../common/FormField';

const COMPLAINT_SOURCES = ['Email', 'Portal', 'Phone', 'Document', 'Other'];

const CustomerDetails = () => (
  <div className="bg-white p-4 rounded-lg border border-slate-200 mb-4">
    <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2 uppercase tracking-wide">
      1. ORIGIN & CUSTOMER DETAILS
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        name="complaint_source"
        label="Complaint Source"
        type="select"
        options={COMPLAINT_SOURCES}
      />
      <FormField name="customer_name" label="Customer Name" />
      <FormField name="customer_contact" label="Customer Contact" />
    </div>
  </div>
);

export default CustomerDetails;

