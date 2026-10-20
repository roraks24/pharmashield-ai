import React from 'react';
import { useSelector } from 'react-redux';
import RiskBadge from '../common/RiskBadge';
import { AlertTriangle, Info } from 'lucide-react';

const RiskAssessment = () => {
  const { risk, extractionStatus } = useSelector((state) => state.analysis);

  if (extractionStatus !== 'success' || !risk) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Risk Assessment & Triage
        </h3>
        <RiskBadge level={risk.level} />
      </div>
      <div className="bg-slate-50 p-3 rounded-md border border-slate-100 mb-3">
        <p className="text-sm text-slate-700">{risk.reason}</p>
      </div>
      {risk.next_action && (
        <div className="flex items-start gap-2 mt-2 text-sm text-teal-900 bg-teal-50 p-3 rounded-md border border-teal-200">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-teal-700" />
          <div>
            <strong className="text-teal-950">Recommended Action:</strong> {risk.next_action}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskAssessment;
