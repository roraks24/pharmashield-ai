import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendCopilotMessage, addMessage } from '../../store/copilotSlice';
import { Send, Bot, User } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const CopilotChat = () => {
  const [input, setInput] = useState('');
  const dispatch = useDispatch();
  const { messages, loading } = useSelector((state) => state.copilot);
  const { formData } = useSelector((state) => state.complaint);
  const { extractedData, risk, summary } = useSelector((state) => state.analysis);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    dispatch(addMessage({ role: 'user', content: input }));

    // Build context from current complaint state
    const complaintContext = {
      ...formData,
      ai_risk: risk,
      ai_summary: summary,
    };

    dispatch(sendCopilotMessage({ message: input, complaintContext }));
    setInput('');
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 flex flex-col h-[400px] mt-4 mb-2 shadow-sm">
      <div className="p-3 border-b border-slate-200 bg-white rounded-t-lg">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <Bot className="h-4 w-4 text-teal-600" />
          PHARMASHIELD COPILOT
        </h3>
      </div>
      
      <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
        {/* Initial bot message */}
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-lg p-3 text-sm bg-slate-100 text-slate-800 rounded-bl-none">
            Upload a complaint document or paste text above. I will automatically extract the details, evaluate risk, check compliance, and populate the form for you.
          </div>
        </div>

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm whitespace-pre-wrap ${
              msg.role === 'user' 
                ? 'bg-teal-600 text-white rounded-br-none shadow-sm' 
                : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-lg rounded-bl-none p-3 text-sm text-slate-600 flex items-center gap-2 border border-slate-200">
              <LoadingSpinner size="sm" /> PharmaShield AI is analyzing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-slate-200 bg-white">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about this complaint, CAPA, or risk..."
            className="flex-grow p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-70 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="text-[10px] text-center text-slate-400 mt-2">
          AI responses may contain errors. Please verify clinical and batch information.
        </p>
      </div>
    </div>
  );
};

export default CopilotChat;
