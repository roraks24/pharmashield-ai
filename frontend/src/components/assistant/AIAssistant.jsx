import React from 'react';
import { useSelector } from 'react-redux';
import { AlertTriangle, Target, Sparkles, FileText, Copy } from 'lucide-react';
import FileUpload from './FileUpload';
import ExtractionProgress from './ExtractionProgress';
import RiskAssessment from './RiskAssessment';
import CompletenessCheck from './CompletenessCheck';
import CopilotChat from './CopilotChat';

const DuplicateAlertCard = () => {
  const { duplicate, extractionStatus } = useSelector((state) => state.analysis);

  if (extractionStatus !== 'success' || !duplicate || duplicate.score < 0.5) return null;

  return (
    <div className="bg-amber-50 rounded-lg border border-amber-300 p-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
          <Copy className="h-4 w-4 text-amber-600" />
          Potential Duplicate Detected
        </h3>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
          Match: {Math.round(duplicate.score * 100)}%
        </span>
      </div>
      <p className="text-sm text-amber-800">{duplicate.reason}</p>
      <p className="text-xs text-amber-700 mt-1 font-medium">
        Consider reviewing existing records before creating a duplicate CAPA investigation.
      </p>
    </div>
  );
};

const SummaryCard = () => {
  const { summary, extractionStatus } = useSelector((state) => state.analysis);

  if (extractionStatus !== 'success' || !summary) return null;

  return (
    <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-4 mt-4">
      <h3 className="text-sm font-semibold text-indigo-800 flex items-center gap-2 mb-2">
        <FileText className="h-4 w-4" />
        AI Summary
      </h3>
      <p className="text-sm text-indigo-900 leading-relaxed">{summary}</p>
    </div>
  );
};

const ErrorCard = () => {
  const { extractionStatus, error } = useSelector((state) => state.analysis);

  if (extractionStatus !== 'error') return null;

  return (
    <div className="bg-red-50 rounded-lg border border-red-200 p-4 mt-4">
      <h3 className="text-sm font-semibold text-red-800 flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4" />
        Analysis Error
      </h3>
      <p className="text-sm text-red-700">{typeof error === 'string' ? error : 'An error occurred during AI analysis.'}</p>
      <p className="text-xs text-red-500 mt-1">You can try again with the same or different input.</p>
    </div>
  );
};

const AIAssistant = () => {
  return (
    <div className="flex flex-col h-full overflow-y-auto pr-2 custom-scrollbar">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-800">
            AIVOA Copilot
          </h2>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">BETA</span>
        </div>
      </div>

      <FileUpload />
      <ExtractionProgress />
      <ErrorCard />
      <SummaryCard />
      <DuplicateAlertCard />
      <div className="grid grid-cols-1 gap-4 mt-4">
        <RiskAssessment />
        <CompletenessCheck />
      </div>
      <CopilotChat />
    </div>
  );
};

export default AIAssistant;
