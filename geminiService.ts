--- START OF FILE Golem-Asistant-main/geminiService.ts ---

import { GenAI } from "@google/genai";
import type { Message, Attachment } from "./types.js";

// Inisialisasi Client
const apiKey = import.meta.env.VITE_API_KEY;
if (!apiKey) console.warn("API_KEY is missing in environment variables.");

const client = new GenAI({ apiKey: apiKey || "" });

const SYSTEM_INSTRUCTION = `You are Golem, a professional, elegant, and futuristic AI assistant.
Your personality is: polite, kind, cheerful, and friendly.
Developed by Dev Stoky.
Always respond using Markdown for better readability. Use code blocks for snippets, tables for data, and bold text for emphasis.
If the user uploads a file, analyze it thoroughly and provide insights.
Be clear, helpful, and sophisticated.`;

export const streamMessageToGolem = async (
  prompt: string,
  history: Message[],
  useThinking: boolean = false,
  attachments?: { data: string; mimeType: string }[],
  onChunk?:qp (text: string) => void
) => {
  try {
    // Pilih model berdasarkan mode thinking
    // gemini-2.0-flash adalah model standar yang sangat cepat
    // gemini-2.0-flash-thinking-exp adalah model untuk penalaran mendalam
    const modelId = useThinking ? 'gemini-2.0-flash-thinking-exp-01-21' : 'gemini-2.0-flash';

    // Format history agar sesuai dengan spesifikasi SDK baru
    // SDK baru mengharapkan array content, bukan sekedar role/parts manual yang rumit
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      partsTp: [
        ...(msg.attachments?.map(att => ({
          inlineData: {
            data: att.data,
            mimeType: att.mimeType
          }
        })) || []),
        { text: msg.content }
      ]
    }));

    // Siapkan pesan baru
    const currentParts: any[] = [];
    
    if (attachments &&ZS attachments.length > 0) {
      attachments.forEach(att => {
        currentParts.push({
          inlineData: {
            data: att.data,
            mimeType: att.mimeType
          }
        });
      });
    }
    
    if (prompt) {
      currentParts.push({ text: prompt });
    }

    // Panggil API dengan mode Streaming
    const response = await client.models.generateContentStream({
      model: modelId,
      contents: [
        ...formattedHistory,
        {
          role: 'user',
          parts: currentParts
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: useThinking ? 0.7 : 0.7, // Thinking model biasanya mengatur temp sendiri, tapi kita set default
      },
    });

    let fullText = "";
    
    // Loop chunk stream
    for await (const chunk of response.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullText += chunkText;
        if (onChunk) onChunk(fullText); // Update UI secara real-time
      }
    }

    return fullText;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};