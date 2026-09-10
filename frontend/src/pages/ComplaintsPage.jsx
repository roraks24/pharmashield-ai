import React from 'react';
import ComplaintList from '../components/complaints/ComplaintList';

const ComplaintsPage = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Complaints Directory</h1>
        <p className="text-slate-500 text-sm mt-1">View and manage all registered customer complaints.</p>
      </div>
      <ComplaintList />
    </div>
  );
};

export default ComplaintsPage;
