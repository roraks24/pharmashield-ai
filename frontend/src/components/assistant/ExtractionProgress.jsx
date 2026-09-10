import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';

const ExtractionProgress = () => {
  const { extractionStatus } = useSelector((state) => state.analysis);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (extractionStatus === 'processing') {
      setProgress(10);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 500);
      return () => clearInterval(interval);
    } else if (extractionStatus === 'success') {
      setProgress(100);
    } else {
      setProgress(0);
    }
  }, [extractionStatus]);

  if (extractionStatus === 'idle') return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 mt-4">
      <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">EXTRACTION PROGRESS</h3>
      
      {extractionStatus === 'processing' && (
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600 font-medium">Extracting...</span>
            <span className="text-indigo-600 font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Analyzing document content and extracting key details...
            <br />Please wait, this may take a few moments.
          </p>
        </div>
      )}

      {extractionStatus === 'success' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <span className="text-sm text-slate-600">
              Extracting entities...
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <span className="text-sm text-slate-600">
              Running risk assessment...
            </span>
          </div>

          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <span className="text-sm text-slate-600">
              Evaluating completeness...
            </span>
          </div>
        </div>
      )}

      {extractionStatus === 'error' && (
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-sm text-red-600">
            Extraction failed. Please try again.
          </span>
        </div>
      )}
    </div>
  );
};

export default ExtractionProgress;
