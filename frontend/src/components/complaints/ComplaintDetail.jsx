import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchComplaintById, clearSelectedComplaint } from '../../store/complaintsSlice';
import { ArrowLeft, FileText, AlertTriangle, Target, Lightbulb, Shield } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import RiskBadge from '../common/RiskBadge';
import LoadingSpinner from '../common/LoadingSpinner';

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedComplaint, detailStatus, error } = useSelector((state) => state.complaints);

  useEffect(() => {
    dispatch(fetchComplaintById(id));
    return () => dispatch(clearSelectedComplaint());
  }, [dispatch, id]);

  if (detailStatus === 'loading') {
    return <div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>;
  }

  if (detailStatus === 'failed') {
    return <div className="text-red-500 p-4">Error loading detail: {JSON.stringify(error)}</div>;
  }

  if (!selectedComplaint) return null;

  // Backend returns { complaint: {...}, analysis: {...} }
  const complaint = selectedComplaint.complaint || selectedComplaint;
  const analysis = selectedComplaint.analysis;

  const Field = ({ label, value }) => (
    <div>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value || '—'}</dd>
    </div>
  );

  return (
    <div>
      <button
        onClick={() => navigate('/complaints')}
        className="mb-4 flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to List
      </button>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <FileText className="h-6 w-6 text-indigo-600" />
              Complaint Record
            </h1>
            <p className="text-sm font-mono text-slate-500 mb-2">{complaint.id}</p>
            <div className="flex gap-3">
              <StatusBadge status={complaint.status} />
              {complaint.severity && <RiskBadge level={complaint.severity} />}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">Created</div>
            <div className="font-medium text-sm">
              {complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : '—'}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Customer Details</h3>
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Name" value={complaint.customer_name} />
              <Field label="Contact" value={complaint.customer_contact} />
              <Field label="Source" value={complaint.complaint_source} />
              <Field label="Complaint Date" value={complaint.complaint_date} />
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Product Details</h3>
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Product" value={complaint.product_name} />
              <Field label="Strength/Grade" value={complaint.product_strength_grade} />
              <Field label="Batch" value={complaint.batch_number} />
              <Field label="Quantity Affected" value={complaint.quantity_affected} />
              <Field label="Mfg Date" value={complaint.manufacturing_date} />
              <Field label="Expiry" value={complaint.expiry_date} />
            </dl>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Complaint Description</h3>
          <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-200">
            {complaint.description || '—'}
          </p>
        </div>

        {/* Classification */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="text-xs font-medium text-slate-500 uppercase mb-1">Type</div>
            <div className="text-sm font-medium">{complaint.complaint_type || '—'}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="text-xs font-medium text-slate-500 uppercase mb-1">Severity</div>
            <div className="text-sm font-medium">{complaint.severity || '—'}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="text-xs font-medium text-slate-500 uppercase mb-1">Priority</div>
            <div className="text-sm font-medium">{complaint.priority || '—'}</div>
          </div>
        </div>

        {/* AI Analysis */}
        {analysis && (
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              AI Analysis
            </h3>

            {/* Summary */}
            {analysis.summary && (
              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg mb-4">
                <div className="text-xs font-semibold text-indigo-600 uppercase mb-1">AI Summary</div>
                <p className="text-sm text-indigo-900">{analysis.summary}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Risk */}
              {analysis.risk_level && (
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-semibold">Risk Assessment</span>
                    <RiskBadge level={analysis.risk_level} />
                  </div>
                  <p className="text-sm text-slate-600">{analysis.risk_reason}</p>
                  {analysis.recommended_next_action && (
                    <p className="text-sm text-indigo-700 mt-2 bg-indigo-50 p-2 rounded">
                      <strong>Next Step:</strong> {analysis.recommended_next_action}
                    </p>
                  )}
                </div>
              )}

              {/* Completeness */}
              {analysis.completeness_score != null && (
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm font-semibold">Completeness</span>
                    <span className={`text-sm font-bold ${analysis.completeness_score >= 80 ? 'text-emerald-600' : analysis.completeness_score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {analysis.completeness_score}%
                    </span>
                  </div>
                  {analysis.missing_fields?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {analysis.missing_fields.map((f, i) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Root Cause & CAPA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.root_cause_hypotheses?.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <div className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-500" />
                    Root Cause Hypotheses
                  </div>
                  <ul className="space-y-1">
                    {analysis.root_cause_hypotheses.map((h, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-amber-500 font-medium">•</span> {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.capa_recommendations?.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <div className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-500" />
                    CAPA Recommendations
                  </div>
                  <ul className="space-y-1">
                    {analysis.capa_recommendations.map((c, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-emerald-500 font-medium">•</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintDetail;
