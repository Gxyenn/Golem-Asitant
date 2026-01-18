import { GoogleGenAI } from "@google/genai";
import type { Message, Attachment } from "./types.js";

const SYSTEM_INSTRUCTION = `You are Golem, a professional, elegant, and futuristic AI assistant.
Your personality is: polite, kind, cheerful, and friendly.
Developed by Dev Stoky.
Always respond using Markdown for better readability. Use code blocks for snippets, tables for data, and bold text for emphasis.
If the user uploads a file, analyze it thoroughly and provide insights.
Be clear, helpful, and sophisticated.`;

export const sendMessageToGolem = async (
  prompt: string, 
  history: Message[], 
  useThinking: boolean = false,
  attachments?: { data: string; mimeType: string }[]
) => {
  try {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY is not set in environment variables.");
    }
    const ai = new GoogleGenAI({ apiKey });
    
    // Format history
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [
        { text: msg.content },
        ...(msg.attachments?.map((att: Attachment) => ({
          inlineData: {
            data: att.data,
            mimeType: att.mimeType
          }
        })) || [])
      ]
    }));
    
    // Tambahkan pesan user saat ini
    const currentParts: any[] = [{ text: prompt }];
    if (attachments) {
      attachments.forEach(att => {
        currentParts.push({
          inlineData: {
            data: att.data,
            mimeType: att.mimeType
          }
        });
      });
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    // PENTING: Gunakan model yang valid. 
    // 'gemini-3' belum ada, gunakan 'gemini-2.0-flash-exp'
    const modelName = useThinking ? 'gemini-2.0-flash-thinking-exp-1219' : 'gemini-2.0-flash-exp';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        ...(useThinking ? { thinkingConfig: { thinkingBudget: 1024 } } : {})
      },
    });

    // --- BAGIAN PERBAIKAN DI SINI ---
    // Hapus tanda kurung (). Ambil nilai properti secara langsung.
    // Pastikan kita mengembalikan string kosong jika null/undefined
    return response.text || "No response text generated."; 
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};