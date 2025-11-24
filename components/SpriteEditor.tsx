import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, Download, Grid, Layers, Sliders } from 'lucide-react';
import { SpriteConfig } from '../types';

interface SpriteEditorProps {
  imageBase64: string;
}

export const SpriteEditor: React.FC<SpriteEditorProps> = ({ imageBase64 }) => {
  // Canvas refs
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // State
  const [config, setConfig] = useState<SpriteConfig>({
    rows: 4,
    cols: 4,
    fps: 8,
    scale: 1,
    removeBackground: false,
    tolerance: 10,
  });
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [frames, setFrames] = useState<string[]>([]); // Data URLs of frames
  const [isExporting, setIsExporting] = useState(false);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);

  // Load image object once
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setSourceImage(img);
    };
    img.src = `data:image/png;base64,${imageBase64}`;
  }, [imageBase64]);

  // Slicing Logic
  useEffect(() => {
    if (!sourceImage || !sourceCanvasRef.current) return;
    
    const canvas = sourceCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas dimensions to match image
    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;
    
    // Draw original
    ctx.drawImage(sourceImage, 0, 0);

    // If remove background is enabled, do a simple pass (assuming top-left pixel is bg color)
    // NOTE: In a real app, this would be more complex. Here we just prepare the buffer.
    
    // Slice
    const frameWidth = canvas.width / config.cols;
    const frameHeight = canvas.height / config.rows;
    const newFrames: string[] = [];

    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        // Create a temp canvas for this frame
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = frameWidth;
        frameCanvas.height = frameHeight;
        const fCtx = frameCanvas.getContext('2d');
        if (fCtx) {
          fCtx.drawImage(
            canvas,
            c * frameWidth, r * frameHeight, frameWidth, frameHeight, // Source
            0, 0, frameWidth, frameHeight // Dest
          );
          newFrames.push(frameCanvas.toDataURL('image/png'));
        }
      }
    }
    setFrames(newFrames);
    setCurrentFrame(0);

  }, [sourceImage, config.rows, config.cols, config.removeBackground]);

  // Animation Loop
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;

    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % frames.length);
    }, 1000 / config.fps);

    return () => clearInterval(interval);
  }, [isPlaying, frames, config.fps]);

  // Render Preview
  useEffect(() => {
    if (!previewCanvasRef.current || frames.length === 0) return;
    
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frameImg = new Image();
    frameImg.onload = () => {
      canvas.width = frameImg.width;
      canvas.height = frameImg.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frameImg, 0, 0);
    };
    frameImg.src = frames[currentFrame];
    
  }, [currentFrame, frames]);

  const handleExportGif = useCallback(() => {
    if (frames.length === 0 || !window.gifshot) return;
    setIsExporting(true);

    window.gifshot.createGIF({
      images: frames,
      interval: 1 / config.fps,
      gifWidth: sourceImage ? sourceImage.width / config.cols : 200,
      gifHeight: sourceImage ? sourceImage.height / config.rows : 200,
      numWorkers: 2,
    }, (obj: any) => {
      if (!obj.error) {
        const link = document.createElement('a');
        link.href = obj.image;
        link.download = `sprite-animation-${Date.now()}.gif`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.error("GIF Export failed", obj.error);
        alert("Failed to export GIF.");
      }
      setIsExporting(false);
    });
  }, [frames, config.fps, sourceImage, config.cols, config.rows]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl mx-auto mt-8">
      
      {/* LEFT: Editor & Grid View */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Grid size={20} className="text-indigo-400" /> Source Sprite Sheet
          </h3>
          <div className="text-xs text-slate-400">
            Original: {sourceImage?.width}x{sourceImage?.height}px
          </div>
        </div>

        <div className="relative w-full overflow-hidden bg-slate-900 rounded-lg border border-slate-600 flex items-center justify-center p-4">
          {/* Container for image + grid overlay */}
          <div className="relative inline-block">
            <canvas 
              ref={sourceCanvasRef} 
              className="max-w-full h-auto block" 
              style={{ maxHeight: '400px' }}
            />
            {/* CSS Grid Overlay */}
            <div 
              className="absolute inset-0 pointer-events-none border border-indigo-500/50"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
                gridTemplateRows: `repeat(${config.rows}, 1fr)`
              }}
            >
              {Array.from({ length: config.rows * config.cols }).map((_, i) => (
                <div key={i} className="border border-indigo-500/30" />
              ))}
            </div>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Columns (X)</label>
            <input 
              type="range" min="1" max="10" step="1"
              value={config.cols}
              onChange={(e) => setConfig({...config, cols: parseInt(e.target.value)})}
              className="w-full accent-indigo-500"
            />
            <div className="text-right text-xs font-mono">{config.cols}</div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Rows (Y)</label>
            <input 
              type="range" min="1" max="10" step="1"
              value={config.rows}
              onChange={(e) => setConfig({...config, rows: parseInt(e.target.value)})}
              className="w-full accent-indigo-500"
            />
            <div className="text-right text-xs font-mono">{config.rows}</div>
          </div>
        </div>
      </div>

      {/* RIGHT: Preview & Export */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Layers size={20} className="text-purple-400" /> Animation Preview
          </h3>
          <div className="flex gap-2">
             <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>
        </div>

        <div className="flex-grow flex items-center justify-center bg-slate-900 rounded-lg border border-slate-600 min-h-[300px] p-8">
           <canvas 
             ref={previewCanvasRef} 
             className="pixelated max-w-full max-h-[300px]" 
             style={{ imageRendering: 'pixelated' }}
           />
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
             <label className="text-sm text-slate-400 flex justify-between">
               <span>Animation Speed</span>
               <span className="font-mono text-xs">{config.fps} FPS</span>
             </label>
             <input 
               type="range" min="1" max="24" step="1"
               value={config.fps}
               onChange={(e) => setConfig({...config, fps: parseInt(e.target.value)})}
               className="w-full accent-purple-500"
             />
          </div>

          <button 
            onClick={handleExportGif}
            disabled={isExporting}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-green-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <span className="animate-pulse">Rendering GIF...</span>
            ) : (
              <>
                <Download size={20} /> Download GIF
              </>
            )}
          </button>
          
          <a 
            href={`data:image/png;base64,${imageBase64}`}
            download="sprite-sheet-raw.png"
            className="block text-center text-sm text-slate-500 hover:text-slate-300 underline"
          >
            Download Raw Sprite Sheet (PNG)
          </a>
        </div>
      </div>
    </div>
  );
};
