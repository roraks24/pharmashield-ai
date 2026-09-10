import React from 'react';
import ComplaintForm from '../components/complaint/ComplaintForm';
import AIAssistant from '../components/assistant/AIAssistant';

const IntakePage = () => {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      {/* Left Column - Form */}
      <div className="w-full md:w-[60%] flex flex-col min-h-0">
        <ComplaintForm />
      </div>

      {/* Right Column - AI Assistant */}
      <div className="w-full md:w-[40%] flex flex-col min-h-0 border-l md:pl-6 border-slate-200 mt-6 md:mt-0">
        <AIAssistant />
      </div>
    </div>
  );
};

export default IntakePage;
