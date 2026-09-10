import React from 'react';

const StatusBadge = ({ status }) => {
  const getStyles = () => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'under review':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'closed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'draft':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyles()}`}>
      {status || 'Unknown'}
    </span>
  );
};

export default StatusBadge;
