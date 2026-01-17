import React, { useState, useEffect, useCallback } from 'react';
import { Page } from './types.js';
import type { ChatThread, Message } from './types.js';
import LandingPage from './components/LandingPage.js';
import ChatPage from './components/ChatPage.js';

const STORAGE_KEY = 'golem_chat_history_v1';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isSwitchingThread, setIsSwitchingThread] = useState(false);

  // Initialize data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setThreads(parsed);
      } catch (e) { console.error(e); }
    }
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  }, [threads]);

  const handleNewChat = useCallback(() => {
    const newThread: ChatThread = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      updatedAt: Date.now()
    };
    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    return newThread.id;
  }, []);

  const handleStartChatting = () => {
    setCurrentPage(Page.CHAT);
    if (threads.length === 0) {
      handleNewChat();
    } else if (!activeThreadId) {
      // Jika ada thread tapi belum dipilih, pilih yang paling baru
      setActiveThreadId(threads[0].id);
    }
  };

  const handleDeleteThread = useCallback((id: string) => {
    setThreads(prev => {
        const newThreads = prev.filter(t => t.id !== id);
        if (activeThreadId === id) {
            setActiveThreadId(newThreads.length > 0 ? newThreads[0].id : null);
        }
        return newThreads;
    });
  }, [activeThreadId]);

  const handleDeleteAll = useCallback(() => {
    if (window.confirm("Are you sure you want to delete all history? This action is irreversible.")) {
      setThreads([]);
      setActiveThreadId(null);
      localStorage.removeItem(STORAGE_KEY);
      handleNewChat(); // Buat chat baru kosong
    }
  }, [handleNewChat]);

  const handleUpdateMessages = useCallback((threadId: string, messages: Message[]) => {
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        // Auto title jika ini pesan pertama user
        let newTitle = t.title;
        if (t.messages.length === 0 && messages.length > 0) {
            const firstUserMsg = messages.find(m => m.role === 'user');
            if (firstUserMsg && firstUserMsg.content) {
                newTitle = firstUserMsg.content.slice(0, 30);
                if (firstUserMsg.content.length > 30) newTitle += '...';
            }
        }
        return { ...t, messages, title: newTitle, updatedAt: Date.now() };
      }
      return t;
    }));
  }, []);

  const handleSelectThread = useCallback((id: string) => {
    if (id === activeThreadId) return;
    setIsSwitchingThread(true);
    setActiveThreadId(id);
    setTimeout(() => {
      setIsSwitchingThread(false);
    }, 300);
  }, [activeThreadId]);

  return (
    <div className="min-h-screen transition-colors duration-300 bg-slate-900 text-white font-sans">
      {currentPage === Page.LANDING ? (
        <LandingPage onStart={handleStartChatting} />
      ) : (
        <ChatPage 
          threads={threads}
          activeThreadId={activeThreadId}
          onNewChat={handleNewChat}
          onSelectThread={handleSelectThread}
          onDeleteThread={handleDeleteThread}
          onDeleteAll={handleDeleteAll}
          onUpdateMessages={handleUpdateMessages}
          onGoHome={() => setCurrentPage(Page.LANDING)}
          isSwitchingThread={isSwitchingThread}
        />
      )}
    </div>
  );
};

export default App;