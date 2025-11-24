import React, { useEffect, useState } from 'react';
import { Key, Lock, ExternalLink } from 'lucide-react';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkKey = async () => {
    try {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
        if (selected) {
          onKeySelected();
        }
      }
    } catch (e) {
      console.error("Error checking API key", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkKey();
    // Periodically check if the key was selected in another tab or state updated
    const interval = setInterval(checkKey, 2000);
    return () => clearInterval(interval);
  }, [onKeySelected]);

  const handleSelectKey = async () => {
    try {
      if (window.aistudio && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
        // Optimistic update, actual verification happens in checkKey or next API call
        checkKey();
      } else {
        alert("AI Studio environment not detected. Please run this app in the Google IDX / AI Studio environment.");
      }
    } catch (e) {
      console.error("Failed to open key selector", e);
    }
  };

  if (loading) return null; // Or a subtle spinner
  if (hasKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
        <div className="mx-auto bg-indigo-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 text-indigo-400">
          <Key size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">API Key Required</h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          To generate high-quality sprites using Gemini 3 Pro Image (Nano Banana Pro), you need to select a paid API key.
        </p>
        
        <button
          onClick={handleSelectKey}
          className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 mb-4"
        >
          <Lock size={18} />
          Select API Key
        </button>

        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-slate-500 hover:text-indigo-400 flex items-center justify-center gap-1 transition-colors"
        >
          Read about Billing & API Keys <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
};
