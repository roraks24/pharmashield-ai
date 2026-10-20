import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchComplaints } from '../../store/complaintsSlice';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import RiskBadge from '../common/RiskBadge';
import LoadingSpinner from '../common/LoadingSpinner';

const ComplaintList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, listStatus, error } = useSelector((state) => state.complaints);

  useEffect(() => {
    if (listStatus === 'idle') {
      dispatch(fetchComplaints());
    }
  }, [listStatus, dispatch]);

  if (listStatus === 'loading') {
    return <div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>;
  }

  if (listStatus === 'failed') {
    return <div className="text-red-500 p-4">Error loading complaints: {error}</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID / Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer / Product</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Risk / Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {items.map((complaint) => (
            <tr 
              key={complaint.id} 
              onClick={() => navigate(`/complaints/${complaint.id}`)}
              className="hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-teal-600 font-mono">{String(complaint.id).slice(0, 8)}…</div>
                <div className="text-sm text-slate-500">{complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : '—'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-slate-900">{complaint.customer_name}</div>
                <div className="text-sm text-slate-500">{complaint.product_name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {complaint.complaint_type}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col gap-2 items-start">
                  <RiskBadge level={complaint.severity} />
                  <StatusBadge status={complaint.status} />
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                No complaints found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ComplaintList;
