
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ContentSuggestionRequest, SuggestedItem } from '../types';
import { GEMINI_TEXT_MODEL } from '../constants';
import { cleanGeminiJsonResponse } from '../utils/helpers';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("Gemini API key not found. Please set the process.env.API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const getPackageContentSuggestions = async (
  request: ContentSuggestionRequest
): Promise<SuggestedItem[]> => {
  if (!API_KEY) {
    console.error("Gemini API key not available, skipping suggestions.");
    return [];
  }

  const prompt = `
    You are a helpful moving assistant.
    A user is packing a ${request.packageType.toLowerCase()} for their move.
    The room of origin for this package is "${request.roomOfOrigin}".
    ${request.existingContent ? `They have already listed these items: "${request.existingContent}".` : ""}
    Suggest 3-5 common items that are typically packed in a ${request.packageType.toLowerCase()} from a ${request.roomOfOrigin}.
    Consider items that might be overlooked.
    Provide your response as a JSON array of objects, where each object has a "name" (string) and an optional "reason" (string, brief).
    Example: [{"name": "Item 1", "reason": "Often forgotten"}, {"name": "Item 2"}]
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    });

    const rawJson = cleanGeminiJsonResponse(response.text);
    const suggestions: SuggestedItem[] = JSON.parse(rawJson);
    
    if (Array.isArray(suggestions) && suggestions.every(item => typeof item.name === 'string')) {
      return suggestions;
    }
    console.error("Gemini response was not in the expected format:", suggestions);
    return [];

  } catch (error) {
    console.error("Error fetching content suggestions from Gemini:", error);
    // You could potentially parse more specific Gemini errors here if needed
    // if (error instanceof GoogleGenAIError) { ... }
    throw new Error("Failed to get suggestions from AI assistant.");
  }
};

export const getGeneralMovingTip = async (): Promise<string> => {
  if (!API_KEY) {
    return "Remember to label your boxes clearly! (API key not configured)";
  }

  const prompt = "Provide one concise, actionable moving tip for someone planning a house move. Keep it under 150 characters.";

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        temperature: 0.8,
      }
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error fetching moving tip from Gemini:", error);
    return "Plan ahead and declutter before you pack! (Error fetching tip)";
  }
};
