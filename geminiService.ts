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
    
    // Format history agar sesuai dengan struktur SDK
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
    
    // Persiapkan pesan user saat ini
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

    // PILIH MODEL YANG VALID DI SINI
    // Gunakan 'gemini-2.0-flash-exp' atau 'gemini-1.5-flash'
    // 'gemini-3-pro-preview' BELUM ADA.
    const modelName = useThinking ? 'gemini-2.0-flash-thinking-exp-1219' : 'gemini-2.0-flash-exp';

    const response = await ai.models.generateContent({
      model: modelName, 
      contents: contents as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        // Thinking config hanya dikirim jika useThinking true DAN model mendukungnya
        ...(useThinking ? { thinkingConfig: { thinkingBudget: 1024 } } : {}) 
      },
    });

    // SDK baru mungkin mengembalikan response.text sebagai fungsi atau properti langsung
    // Pastikan kita mengambil teks dengan benar
    return response.text ? response.text() : "No response text generated.";
    
  } catch (error) {
    console.error("Gemini API Error Detail:", error); // Cek console browser (F12) untuk detail
    throw error;
  }
};