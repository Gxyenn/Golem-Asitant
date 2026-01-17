--- START OF FILE Golem-Asistant-main/components/ChatPage.tsx ---

import React, { useState, useRef, useEffect, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Sparkles, Plus,KZEq Trash2, Home, Send, 
  User, Bot,TJ BrainCircuit, Menu, X, 
  Paperclip, FileText, Image as ImageIcon,
  SqStopCircle // Menambahkan icon stop
} from 'lucide-react';
import type { ChatThread, Message, Attachment } from '../types.js';
import { streamMessageToGolem } from '../geminiService.js';

// Typewriter Component hanya untuk history lama/load page
const TypewriterText = memo(({ content, speed = 2, onComplete }: { content: string, speed?: number, onComplete?: () => void }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Jika konten sangat panjang, langsung tampilkan sisanya agar tidak terlalu lama
    if (index < content.length) {
      const timeout = setTimeout(() => {
        setDisplayedContent((prev) => prev + content[index]);
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, content, speed, onComplete]);

  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedContent}</ReactMarkdown>;
});

interface ChatPageProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  onNewChat: () => void;
  onSelectThread: (id: string) => void;
  onDeleteThread: (id: string) => void;
  onDeleteAll: () => void;
  onUpdateMessages: (threadId: string, messages: Message[]) => void;
  onGoHome: () => void;
  isSwitchingThread: boolean;
}

const ChatPage: React.FC<ChatPageProps> = ({
  threads, activeThreadId, onNewChat, onSelectThread, 
  onDeleteThread, onDeleteAll, onUpdateMessages, onGoHome,
  isSwitchingThread
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeThread = threads.find(t => t.id === activeThreadId);

  // Auto scroll logic yang lebih baik
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => { 
    scrollToBottom();
  }, [activeThread?.messages.length, isLoading]); 

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string)?.split(',')[1];
        if (base64) {
          setAttachments(prev => [...prev, {
            name: file.name,
            mimeType: file.type,
            data: base64
          }]);
        }
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

    const handleAnimationComplete = (messageId: string) => {
      // Tandai pesan sudah dianimasikan agar tidak render ulang typewriter saat pindah chat
      const updatedMessages = activeThread?.messages.map(msg => {
        if (msg.id === messageId) {
          return { ...msg, hasAnimated: true };
        }
        return msg;
      });
      
      if (activeThreadId && updatedMessages) {
        onUpdateMessages(activeThreadId, updatedMessages);
      }
    };
    
  const handleSend = async () => {
    if ((!inputText.trim() && attachments.length === 0) || !activeThreadId || isLoading) return;

    const currentText = inputText;
    const currentAttachments = [...attachments];
    
    // Reset input segera
    setInputText('');
    setAttachments([]);
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentText,
      timestamp: Date.now(),
      attachments: currentAttachments
    };

    // Placeholder untuk pesan assistant yang akan di-stream
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessagePlaceholder: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '', // Mulai kosong
      timestamp: Date.now(),
      isThinking: useThinking,
      hasAnimated: true // Kita set true karena streaming langsung render text
    };

    const currentMessages = activeThread?.messages || [];
    const newMessages = [...currentMessages, userMessage, assistantMessagePlaceholder];
    
    // Update state awal
    onUpdateMessages(activeThreadId, newMessages);

    try {
      const apiAttachments = userMessage.attachments?.map((a: Attachment) => ({ data: a.data, mimeType: a.mimeType }));
      
      // Panggil service streaming
      await streamMessageToGolem(
        currentText, 
        currentMessages, 
        useThinking, 
        apiAttachments,
        (streamedText) => {
            // Callback ini dipanggil setiap kali ada potongan text baru
            onUpdateMessages(activeThreadId, [
                ...currentMessages, 
                userMessage, 
                { ...assistantMessagePlaceholder, content: streamedText }
            ]);
            // Auto scroll saat streaming (opsional, kadang mengganggu jika user sedang baca ke atas)
             messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }
      );
      
    } catch (error) {
      console.error(error);
      // Ganti pesan terakhir dengan error message
      onUpdateMessages(activeThreadId, [
          ...currentMessages, 
          userMessage,
          {
            ...assistantMessagePlaceholder,
            content: "**Error:** Failed to connect to Golem Neural Core. Please check your internet or API Key."
          }
      ]);
    } finally {
      setIsLoading(false);
      // Simpan scroll terakhir
      setTimeout(scrollToBottom, 100);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-300 relative bg-slate-900 text-slate-100">
      {/* Sidebar (Sama seperti sebelumnya, tidak diubah logic-nya, hanya styling konsistensi) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 border-r flex flex-col transition-all duration-300 ease-in-out
        bg-slate-800 border-slate-700 shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={onGoHome}>
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-slate-900 shadow-lg group-hover:scale-110 transition-transform">
              <Sparkles size={20} />
            </div>
            <div className="flex flex-col min-w-0 overflow-hidden"> 
              <h2 className="text-sm font-black uppercase tracking-widest text-white truncate max-w-[200px] md:max-w-md">
                {activeThread?.title || 'Golem AI'}
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online & Active
              </div>
            </div>
          </div>
          <button className="lg:hidden p-2 text-slate-500 hover:text-white" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
        </div>

        <button onClick={onNewChat} className="mx-4 mb-6 flex items-center justify-center gap-2 bg-white text-slate-900 p-3.5 rounded-2xl font-bold hover:shadow-xl transition-all active:scale-95 group">
          <Plus size={18} className="group-hover:rotate-90 transition-transform" /> New Chat
        </button>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {threads.map(thread => (
            <div key={thread.id} onClick={() => { onSelectThread(thread.id); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} 
                 className={`group flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all border 
                 ${activeThreadId === thread.id 
                   ? 'bg-slate-700 border-slate-600 shadow-lg'
                   : 'bg-transparent border-transparent hover:bg-slate-700/50'}`}>
              <div className={`w-2 h-2 rounded-full ${activeThreadId === thread.id ? 'bg-indigo-500 animate-pulse' : 'bg-slate-600'}`}></div>
              <div className="flex-1 truncate">
                <p className={`text-sm font-bold truncate ${activeThreadId === thread.id ? 'text-white' : 'text-slate-400'}`}>{thread.title}</p>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">{new Date(thread.updatedAt).toLocaleDateString()}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete this thread?')) onDeleteThread(thread.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 transition-all text-slate-400"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        
         <div className="p-4 border-t border-slate-700">
            <button onClick={onDeleteAll} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                <Trash2 size={14} /> Clear All History
            </button>
         </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="px-6 py-4 border-b flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-slate-700 shadow-lg">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 bg-slate-800 rounded-lg" onClick={() => setIsSidebarOpen(true)}><Menu size={20} /></button>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">{useThinking ? 'Golem 2.0 (Thinking)' : 'Golem 2.0 (Flash)'}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
                onClick={() => setUseThinking(!useThinking)} 
                className={`p-2.5 rounded-xl transition-all border-2 flex items-center gap-2 ${useThinking ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-800 border-slate-700 text-slate-400'}`} 
                title={useThinking ? "Thinking Model Active" : "Enable Thinking Model"}
            >
                <BrainCircuit size={18} className={useThinking ? "animate-pulse" : ""} />
                <span className="text-xs font-bold hidden md:inline">{useThinking ? 'THINKING ON' : 'THINKING OFF'}</span>
            </button>
            <button onClick={onGoHome} className="p-2.5 border-2 rounded-xl transition-all border-slate-700 hover:bg-slate-800 text-slate-400"><Home size={18} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 transition-all bg-slate-900 scroll-smooth">
          {!activeThread || activeThread.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-slate-700 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xlMb-8 rotate-6 animate-pulse mb-6">
                <Sparkles size={48} />
              </div>
              <h3 className="text-3xl font-black mb-4 text-white">Golem Neural Core</h3>
              <p className="max-w-md text-slate-400 font-medium">Ready to process complex queries using Gemini 2.0 Flash architecture.</p>
            </div>
          ) : activeThread.messages.map((msg: Message, index: number) => {
            const isLastMessage = index === activeThread.messages.length - 1;
            const isAssistant = msg.role === 'assistant';

            return (
              <div key={msg.id} className={`flex gap-4 md:gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border ${msg.role === 'user' ? 'bg-slate-800 border-slate-600' : 'bg-indigo-600 border-indigo-400'}`}>
                    {msg.role === 'user' ? <User size={20} className="text-indigo-300" /> : <Bot size={24} className="text-white" />}
                </div>

                <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {msg.attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 borderkz border-slate-700 rounded-lg text-xs font-bold">
                          {att.mimeType.startsWith('image/') ? <ImageIcon size={12} /> : <FileText size={12} />}
                          <span className="truncate max-w-[100px]">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className={`markdown-content px-5 py-4 rounded-2xl text-[15px] leading-relaxed shadow-md border 
                    ${msg.role === 'user' 
                      ? 'bg-indigo-900/20 border-indigo-500/30 text-indigo-50 rounded-tr-sm'
                      : 'bg-slate-800 border-slate-700 text-slate-200 rounded-tl-sm'}`}>
                    
                    {/* Logika render: Jika history lama dan belum animasi, pakai Typewriter. Jika sedang loading/streaming, pakai text biasa (karena streaming sudah efek ketik) */}
                    {isAssistant && !msg.hasAnimated && !isSwitchingThread && !isLoading ? (
                      <TypewriterText content={msg.content} onComplete={() => handleAnimationComplete(msg.id)} />
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content + (isAssistant && isLastMessage && isLoading ? ' ▍' : '')} 
                      </ReactMarkdown>
                    )}

                    {msg.isThinking && (
                        <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-wider opacity-70">
                            <BrainCircuit size={12} /> Thinking Process
                        </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* Invisible div untuk scroll anchor */}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-slate-900">
          <div className="max-w-4xl mx-auto">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 animate-in fade-in slide-in-from-bottom-2">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs">
                    <span className="text-indigo-400 font-bold">{att.name}</span>
                    <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-400"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="relative group bg-slate-800 rounded-2xl border border-slate-700 shadow-xl focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
              
              <button onClick={() => fileInputRef.current?.click()} className="absolute left-3 bottom-3 p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded-xl transition-all" title="Upload File">
                <Paperclip size={20} />
              </button>
              
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                placeholder="Message Golem..." 
                className="w-full bg-transparent py-4 pl-14 pr-14 text-sm focus:outline-none placeholder:text-slate-500 font-medium text-white resize-none max-h-32 min-h-[56px]"
                rows={1}
                style={{ height: 'auto', minHeight: '56px' }} 
              />
              
              <button 
                onClick={handleSend} 
                disabled={isLoading || (!inputText.trim() && attachments.length === 0)} 
                className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all ${
                    isLoading 
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                    : (!inputText.trim() && attachments.length === 0) 
                        ? 'bg-slate-700 text-slate-500' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
                }`}
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <Send size={20} />}
              </button>
            </div>
            <div className="text-center mt-3">
                 <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Powered by Google Gemini 2.0 Flash</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;