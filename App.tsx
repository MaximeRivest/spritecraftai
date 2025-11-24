import React, { useState } from 'react';
import { ApiKeySelector } from './components/ApiKeySelector';
import { SpriteEditor } from './components/SpriteEditor';
import { refinePromptForSprite, generateSpriteSheet } from './services/geminiService';
import { GeneratedData, GenerationState } from './types';
import { Wand2, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [userImage, setUserImage] = useState<string | null>(null);
  
  const [state, setState] = useState<GenerationState>({
    isRefining: false,
    isGenerating: false,
    statusMessage: '',
    error: null
  });

  const [result, setResult] = useState<GeneratedData | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setUserImage(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;

    setResult(null);
    setState({
      isRefining: true,
      isGenerating: false,
      statusMessage: 'Consulting the Gemini Oracle for prompt refinement...',
      error: null
    });

    try {
      // Step 1: Refine Prompt
      const refined = await refinePromptForSprite(prompt);
      
      setState({
        isRefining: false,
        isGenerating: true,
        statusMessage: 'Generating Nano Banana Pro sprite sheet (this takes a moment)...',
        error: null
      });

      // Step 2: Generate Image
      const imageBase64 = await generateSpriteSheet(refined, userImage || undefined);

      setResult({
        originalPrompt: prompt,
        refinedPrompt: refined,
        imageBase64: imageBase64,
        imageUrl: `data:image/png;base64,${imageBase64}`
      });

      setState({
        isRefining: false,
        isGenerating: false,
        statusMessage: '',
        error: null
      });

    } catch (error: any) {
      console.error(error);
      setState({
        isRefining: false,
        isGenerating: false,
        statusMessage: '',
        error: error.message || "Something went wrong during generation."
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <ApiKeySelector onKeySelected={() => setApiKeyReady(true)} />
      
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-6 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SpriteCraft AI</h1>
              <p className="text-xs text-slate-400">Powered by Gemini 3 Pro & Nano Banana</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 pt-10">
        
        {/* Input Section */}
        <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800 shadow-xl backdrop-blur-sm">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left: Text Input */}
            <div className="md:col-span-2 space-y-4">
              <label className="block text-sm font-medium text-slate-300">
                Describe your Sprite <span className="text-indigo-400">*</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., A cyberpunk robot running animation, side view, neon colors..."
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Right: Image Upload */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-300">
                Reference Image (Optional)
              </label>
              <div className="relative group w-full h-32 bg-slate-800 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-slate-800/80 transition-all overflow-hidden">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {userImage ? (
                  <img src={userImage} alt="Ref" className="w-full h-full object-cover opacity-60" />
                ) : (
                  <>
                    <ImageIcon className="text-slate-500 mb-2 group-hover:text-indigo-400" />
                    <span className="text-xs text-slate-500 group-hover:text-slate-300">Upload Sketch</span>
                  </>
                )}
              </div>
              {userImage && (
                <button 
                  onClick={() => setUserImage(null)}
                  className="text-xs text-red-400 hover:text-red-300 underline w-full text-center"
                >
                  Remove Image
                </button>
              )}
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleGenerate}
              disabled={!prompt || state.isGenerating || state.isRefining || !apiKeyReady}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl
                ${!prompt || state.isGenerating || state.isRefining
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right text-white shadow-indigo-500/25'
                }`}
            >
              {state.isGenerating || state.isRefining ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Wand2 size={24} /> Generate Sprite Sheet
                </>
              )}
            </button>
          </div>

          {/* Status Display */}
          {(state.isGenerating || state.isRefining) && (
             <div className="mt-6 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg text-indigo-200 flex items-center justify-center text-center animate-pulse">
               {state.statusMessage}
             </div>
          )}
          
          {state.error && (
            <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-200 flex items-center justify-center gap-2">
              <AlertCircle size={20} />
              {state.error}
            </div>
          )}

          {/* Prompt Refinement Result */}
          {result && !state.isGenerating && (
             <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
               <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Refined Prompt used for Generation</h4>
               <p className="text-sm text-slate-300 italic">"{result.refinedPrompt}"</p>
             </div>
          )}
        </div>

        {/* Results Editor Section */}
        {result && (
          <div className="animate-fade-in-up">
            <SpriteEditor imageBase64={result.imageBase64} />
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
