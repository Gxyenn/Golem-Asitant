
import React, { useState, useRef, useEffect, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Sparkles, Plus, Trash2, Home, Send, 
  User, Bot, BrainCircuit, Menu, X, 
  Clock, MoreVertical, Paperclip, 
  FileText, Image as ImageIcon
} from 'lucide-react';
import type { ChatThread, Message, Attachment } from '../types.js';
import { sendMessageToGolem } from '../geminiService.js';

// Typewriter Component for Live Typing Feel
const TypewriterText = memo(({ content, speed = 2, onComplete }: { content: string, speed?: number, onComplete?: () => void }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
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

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { 
    if (!isSwitchingThread) {
      scrollToBottom(); 
    }
  }, [activeThread?.messages, isLoading, isSwitchingThread]);

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

  const handleSend = async () => {
    if ((!inputText.trim() && attachments.length === 0) || !activeThreadId || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? [...attachments] : []
    };

    const currentMessages = activeThread?.messages || [];
    const updatedMessages = [...currentMessages, userMessage];
    
    onUpdateMessages(activeThreadId, updatedMessages);
    setInputText('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const apiAttachments = userMessage.attachments?.map((a: Attachment) => ({ data: a.data, mimeType: a.mimeType }));
      const response = await sendMessageToGolem(inputText, currentMessages, useThinking, apiAttachments);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || "I'm sorry, I couldn't process that.",
        timestamp: Date.now(),
        isThinking: useThinking
      };

      onUpdateMessages(activeThreadId, [...updatedMessages, assistantMessage]);
    } catch (error) {
      onUpdateMessages(activeThreadId, [...updatedMessages, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered an error. Please verify your connection or API key.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-300 relative bg-slate-900 text-slate-100">
      {/* Sidebar */}
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
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight leading-none">Golem</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Neural AI</span>
            </div>
          </div>
          <button className="lg:hidden p-2 text-slate-500 hover:text-white" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
        </div>

        <button onClick={onNewChat} className="mx-4 mb-6 flex items-center justify-center gap-2 bg-white text-slate-900 p-3.5 rounded-2xl font-bold hover:shadow-xl transition-all active:scale-95 group">
          <Plus size={18} className="group-hover:rotate-90 transition-transform" /> New Chat
        </button>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 mb-3 flex justify-between items-center">
            <span>Conversations</span>
            <button onClick={onDeleteAll} className="hover:text-red-500 transition-colors p-1" title="Clear all history"><Trash2 size={14} /></button>
          </div>
          
          {threads.length === 0 ? (
            <div className="text-center py-10 px-6 opacity-40 italic text-sm">Empty history</div>
          ) : threads.map(thread => (
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
              <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Are you sure you want to delete this thread?')) onDeleteThread(thread.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 transition-all text-slate-400"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-700 space-y-4 bg-slate-800/50 backdrop-blur-sm">
          <div className="text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] pb-2">By Dev Stoky</div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="px-6 py-4 border-b flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-slate-700 shadow-lg">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 bg-slate-800 rounded-lg" onClick={() => setIsSidebarOpen(true)}><Menu size={20} /></button>
            <div className="flex flex-col">
              <h2 className="text-sm font-black uppercase tracking-widest text-white">{activeThread?.title || 'Golem AI'}</h2>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online & Active
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setUseThinking(!useThinking)} className={`p-2.5 rounded-xl transition-all border-2 ${useThinking ? 'bg-indigo-50 border-indigo-400 text-indigo-600 shadow-inner ring-4 ring-indigo-500/10' : 'bg-slate-800 border-slate-700 text-slate-400'}`} title="Neural Thinking Engine"><BrainCircuit size={18} /></button>
            <button onClick={onGoHome} className="p-2.5 border-2 rounded-xl transition-all border-slate-700 hover:bg-slate-800"><Home size={18} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12 transition-all bg-slate-900">
          {!activeThread || activeThread.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
              <div className="w-24 h-24 bg-gradient-to-br from-white to-slate-400 rounded-[2.5rem] flex items-center justify-center text-slate-900 shadow-2xl mb-8 rotate-6 animate-pulse">
                <Sparkles size={48} />
              </div>
              <h3 className="text-3xl font-black mb-4">Golem AI Neural Core</h3>
              <p className="max-w-md text-slate-400 font-medium">Greetings. I am Golem, your elite neural assistant. How may I assist your inquiries today?</p>
            </div>
          ) : activeThread.messages.map((msg: Message, index: number) => {
            const isLastMessage = index === activeThread.messages.length - 1;
            const isAssistant = msg.role === 'assistant';

            return (
              <div key={msg.id} className={`flex gap-4 md:gap-8 ${!isSwitchingThread ? 'animate-in slide-in-from-bottom-4 duration-300' : ''} ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl border-2 transition-all hover:scale-105 ${msg.role === 'user' ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200 overflow-hidden'}`}>
                    {msg.role === 'user' ? (
                      <User size={24} className="text-indigo-400" />
                    ) : (
                      <img 
                        src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Golem&backgroundColor=ffffff&eyes=happy&mouth=smile&baseColor=indigo" 
                        alt="Golem Logo" 
                        className="w-full h-full p-1"
                      />
                    )}
                  </div>
                  {isAssistant && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 shadow-sm">Golem AI</span>
                  )}
                  {!isAssistant && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">User</span>
                  )}
                </div>

                <div className={`flex flex-col max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {msg.attachments.map((att: Attachment, i: number) => (
                        <div key={i} className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold shadow-sm">
                          {att.mimeType.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                          <span className="max-w-[120px] truncate">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={`markdown-content p-5 md:p-7 rounded-[2rem] text-[15px] leading-relaxed shadow-xl border-2 transition-all 
                    ${msg.role === 'user' 
                      ? 'bg-indigo-950/30 border-indigo-900/50 text-white rounded-tr-none'
                      : 'bg-slate-800/80 border-slate-700 text-slate-100 rounded-tl-none backdrop-blur-md'}`}>
                    
                    {isAssistant && isLastMessage && !isLoading && !isSwitchingThread ? (
                      <TypewriterText content={msg.content} />
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    )}

                    {msg.isThinking && (
                      <div className="mt-5 flex items-center gap-2.5 text-[9px] font-black text-indigo-300 uppercase tracking-[0.4em] border-t border-slate-700 pt-4">
                        <BrainCircuit size={14} className="animate-pulse" /> Neural Processing Layer Active
                      </div>
                    )}
                  </div>
                  <span className="mt-2.5 text-[9px] text-slate-400 font-black tracking-widest px-4 uppercase opacity-50">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex gap-4 md:gap-8 animate-pulse">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center opacity-40">
                  <Bot size={24} className="text-slate-900" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing...</span>
              </div>
              <div className="flex flex-col items-start max-w-[85%]">
                <div className="p-6 rounded-[2rem] rounded-tl-none flex items-center gap-4 border-2 bg-slate-800/50 border-slate-700">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Golem is thinking</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 md:p-10 relative transition-all bg-slate-900">
          <div className="max-w-4xl mx-auto space-y-4">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2.5 pb-2 animate-in fade-in slide-in-from-bottom-2">
                {attachments.map((att, i) => (
                  <div key={i} className="group relative flex items-center gap-3 px-4 py-2.5 border-2 rounded-2xl text-xs shadow-lg transition-all bg-slate-800 border-slate-700">
                    {att.mimeType.startsWith('image/') ? <ImageIcon size={16} className="text-indigo-500" /> : <FileText size={16} className="text-indigo-500" />}
                    <span className="font-bold">{att.name}</span>
                    <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-700 p-1 rounded-md"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="relative group shadow-2xl rounded-[1.75rem] overflow-hidden border-2 transition-all border-slate-700 bg-slate-800">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
              <button onClick={() => fileInputRef.current?.click()} className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 text-slate-400 hover:text-indigo-500 transition-all rounded-xl hover:bg-slate-700"><Paperclip size={22} /></button>
              <input 
                type="text" 
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                placeholder="Message Golem..." 
                className="w-full bg-transparent py-6 pl-16 pr-16 text-sm focus:outline-none transition-all placeholder:text-slate-400 font-bold text-white" 
              />
              <button onClick={handleSend} disabled={isLoading || (!inputText.trim() && attachments.length === 0)} className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl shadow-2xl active:scale-90 transition-all ${isLoading || (!inputText.trim() && attachments.length === 0) ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50' : 'bg-white text-slate-900 hover:shadow-indigo-500/30'}`}>
                <Send size={22} />
              </button>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.6em] opacity-30">
              Neural Assistant Protocol • Dev Stoky
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
