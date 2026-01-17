import { GoogleGenAI } from ""@google/generative-ai";
import type { Message, Attachment } from "./types.js";

const SYSTEM_INSTRUCTION = `You are Golem, a professional, elegant, and futuristic AI assistant.
Your personality is: polite, kind, cheerful, and friendly.
Developed by Dev Stoky.
Always respond using Markdown for better readability.`;

// ... (bagian import dan variabel atas biarkan sama) ...

export const sendMessageToGolem = async (
  prompt: string, 
  history: Message[], 
  _useThinking: boolean = false, 
  attachments?: { data: string; mimeType: string }[]
) => {
  try {
    const apiKey = import.meta.env.VITE_API_KEY;
    
    // Debugging logs (Biarkan untuk cek error)
    if (!apiKey) {
      console.error("API Key is missing!");
      throw new Error("API Key belum terbaca oleh aplikasi.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // ... (bagian formatting contents biarkan sama) ...
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
    
    // Tambahkan prompt user
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

    console.log("Mengirim request...");

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: contents as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    console.log("Respon sukses!");

    // --- PERBAIKAN DI SINI ---
    // HAPUS tanda kurung (). Gunakan null coalescing (||) untuk jaga-jaga jika kosong.
    return response.text || "Maaf, saya tidak dapat menghasilkan respons."; 
    
  } catch (error: any) {
    console.error("ERROR GEMINI:", error);
    if (error.response) {
        console.error("DETAIL:", JSON.stringify(error.response, null, 2));
    }
    throw error;
  }
};