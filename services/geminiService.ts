import { GoogleGenAI } from "@google/genai";

// Helper to get client with current key
const getClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const refinePromptForSprite = async (userPrompt: string): Promise<string> => {
  const ai = getClient();
  const model = "gemini-3-pro-preview";
  
  const systemInstruction = `You are a pixel art expert and technical artist. 
  Your goal is to take a user's idea and convert it into a strict prompt for a sprite sheet generator.
  
  Guidelines:
  1. The output MUST describe a sprite sheet with a solid, uniform background (preferably bright green or magenta for easy keying).
  2. Specify a grid layout (e.g., "arranged in a 4x4 grid" or "5x5 grid").
  3. Ensure the character/object is centered in each cell.
  4. Describe the action clearly (e.g., "running cycle", "idle animation", "explosion").
  5. Keep the style consistent (e.g., "16-bit pixel art", "high-res vector style").
  
  Return ONLY the refined prompt text. Do not add conversational filler.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 1024 } // Use thinking for better prompt adherence
      }
    });

    return response.text || userPrompt;
  } catch (error) {
    console.error("Prompt refinement failed:", error);
    throw error;
  }
};

export const generateSpriteSheet = async (
  prompt: string, 
  referenceImageBase64?: string
): Promise<string> => {
  const ai = getClient();
  const model = "gemini-3-pro-image-preview"; // Nano Banana Pro

  const parts: any[] = [{ text: prompt }];

  if (referenceImageBase64) {
    // Strip prefix if present for API
    const base64Data = referenceImageBase64.split(',')[1] || referenceImageBase64;
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: "image/png" // Assuming PNG/JPEG, API is flexible usually but best to be specific if known. 
        // For simplicity in this demo we assume standard image types.
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        imageConfig: {
            aspectRatio: "1:1",
            imageSize: "2K" // Higher res for better slicing
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("No image data returned from Gemini.");
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};
