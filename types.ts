export interface SpriteConfig {
  rows: number;
  cols: number;
  fps: number;
  scale: number;
  removeBackground: boolean;
  tolerance: number; // For background removal
}

export interface GenerationState {
  isRefining: boolean;
  isGenerating: boolean;
  statusMessage: string;
  error: string | null;
}

export interface GeneratedData {
  originalPrompt: string;
  refinedPrompt: string;
  imageUrl: string;
  imageBase64: string; // Keep for processing
}

declare global {
  // Fix: Move AIStudio to global scope to allow merging with existing definitions and avoid "Subsequent property declarations must have the same type" error.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // Fix: Make aistudio optional to resolve "identical modifiers" error with existing environment types.
    aistudio?: AIStudio;
    gifshot: any; // External library
  }
}
