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
        setThreads(JSON.parse(saved));
      } catch (e) { console.error(e); }
    }
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  }, [threads]);

  const handleStartChatting = () => {
    setCurrentPage(Page.CHAT);
    if (threads.length === 0) {
      handleNewChat();
    } else {
      if (threads.length > 0 && threads[0]) {
      setActiveThreadId(threads[0].id);
    }
    }
  };

  const handleNewChat = useCallback(() => {
    const newThread: ChatThread = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      updatedAt: Date.now()
    };
    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
  }, []);

  const handleDeleteThread = useCallback((id: string) => {
    setThreads(prev => prev.filter(t => t.id !== id));
    if (activeThreadId === id) setActiveThreadId(null);
  }, [activeThreadId]);

  const handleDeleteAll = useCallback(() => {
    if (window.confirm("Are you sure you want to delete all history? This action is irreversible.")) {
      setThreads([]);
      setActiveThreadId(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const handleUpdateMessages = useCallback((threadId: string, messages: Message[]) => {
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        const firstUserMsg = messages.find(m => m.role === 'user');
        let newTitle = t.title;
        if (firstUserMsg && firstUserMsg.content) {
            newTitle = firstUserMsg.content.slice(0, 25);
            if (firstUserMsg.content.length > 25) newTitle += '...';
        }

        return { ...t, messages, title: newTitle, updatedAt: Date.now() };
      }
      return t;
    }));
  }, []);

  const handleSelectThread = useCallback((id: string) => {
    setIsSwitchingThread(true);
    setActiveThreadId(id);
    setTimeout(() => {
      setIsSwitchingThread(false);
    }, 500);
  }, []);

  return (
    <div className="min-h-screen transition-colors duration-300 bg-slate-900 text-white">
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
