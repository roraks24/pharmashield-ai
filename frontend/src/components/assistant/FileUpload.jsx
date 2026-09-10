import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { analyzeComplaint } from '../../store/analysisSlice';
import { Upload, FileText, Send, Clipboard, Sparkles } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const FileUpload = () => {
  const [isTextMode, setIsTextMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [file, setFile] = useState(null);
  
  const dispatch = useDispatch();
  const { extractionStatus } = useSelector((state) => state.analysis);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setIsTextMode(false);
      handleAnalyzeFile(e.target.files[0]);
    }
  };

  const handleAnalyzeFile = (selectedFile) => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      dispatch(analyzeComplaint(formData));
    }
  };

  const handleAnalyzeText = () => {
    if (textInput.trim()) {
      dispatch(analyzeComplaint({ text: textInput }));
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      
      {!isTextMode ? (
        <>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50">
            <Upload className="mx-auto h-10 w-10 text-slate-400 mb-3" />
            <p className="text-sm font-medium text-slate-700 mb-1">Drag & drop complaint document here</p>
            <div className="text-sm text-slate-500 mb-4">
              <span>or </span>
              <label htmlFor="file-upload" className="cursor-pointer text-indigo-600 hover:text-indigo-500 font-medium">
                click to browse
              </label>
            </div>
            
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.txt,.docx,.eml"
            />
            {file && (
              <div className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full font-medium">
                <FileText className="h-4 w-4" />
                {file.name}
              </div>
            )}
          </div>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs text-slate-400 bg-white px-2 uppercase font-medium">
              OR
            </div>
          </div>

          <button
            onClick={() => setIsTextMode(true)}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            <Clipboard className="h-4 w-4" />
            Paste Complaint Text / Email
          </button>
        </>
      ) : (
        <div className="mb-2">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-700">Paste Complaint Text</label>
            <button 
              onClick={() => setIsTextMode(false)}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              Back to file upload
            </button>
          </div>
          <textarea
            className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm mb-3"
            placeholder="Paste email or complaint description here..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
          />
          <button
            onClick={handleAnalyzeText}
            disabled={extractionStatus === 'processing' || !textInput.trim()}
            className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
          >
            {extractionStatus === 'processing' ? (
              <>
                <LoadingSpinner size="sm" className="text-white" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze with AI
              </>
            )}
          </button>
        </div>
      )}

      <div className="mt-4 bg-teal-50 border border-teal-100 rounded-lg p-3 text-sm text-teal-800 flex justify-between">
        <span>Supported formats: PDF, DOCX, TXT, EML</span>
        <span className="font-medium">Max file size: 10MB</span>
      </div>
    </div>
  );
};

export default FileUpload;
