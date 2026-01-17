import { GoogleGenAI } from "@google/genai";
import type { Message, Attachment } from "./types.js";

const SYSTEM_INSTRUCTION = `You are Golem, a professional, elegant, and futuristic AI assistant.
Your personality is: polite, kind, cheerful, and friendly.
Developed by Dev Stoky.
Always respond using Markdown for better readability.`;

export const sendMessageToGolem = async (
  prompt: string, 
  history: Message[], 
  _useThinking: boolean = false, // Parameter ini kita abaikan dulu agar stabil
  attachments?: { data: string; mimeType: string }[]
) => {
  try {
    // 1. Ambil API Key
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) {
      throw new Error("API Key belum disetting di Vercel!");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // 2. Format History
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
    
    // 3. Tambahkan pesan baru
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

    // 4. Request ke Gemini (GUNAKAN MODEL STABIL & CONFIG SEDERHANA)
    // Hapus 'thinkingConfig' karena itu penyebab crash di model standar
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', // Model paling cepat dan stabil saat ini
      contents: contents as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error Detail:", error); // Cek Console browser (F12) untuk detail
    throw error;
  }
};