
import React, { useState, useEffect, useCallback } from 'react';
import { Page, ChatThread, Message } from './types';
import LandingPage from './components/LandingPage';
import ChatPage from './components/ChatPage';

const STORAGE_KEY = 'golem_chat_history_v1';
const THEME_KEY = 'golem_theme_v1';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize data and theme
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setThreads(JSON.parse(saved));
      } catch (e) { console.error(e); }
    }
    
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  }, [threads]);

  const handleStartChatting = () => {
    setCurrentPage(Page.CHAT);
    if (threads.length === 0) {
      handleNewChat();
    } else {
      setActiveThreadId(threads[0].id);
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
        const newTitle = firstUserMsg 
          ? (firstUserMsg.content.length > 30 ? firstUserMsg.content.substring(0, 30) + '...' : firstUserMsg.content)
          : t.title;

        return { ...t, messages, title: newTitle, updatedAt: Date.now() };
      }
      return t;
    }));
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
      {currentPage === Page.LANDING ? (
        <LandingPage onStart={handleStartChatting} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
      ) : (
        <ChatPage 
          threads={threads}
          activeThreadId={activeThreadId}
          onNewChat={handleNewChat}
          onSelectThread={setActiveThreadId}
          onDeleteThread={handleDeleteThread}
          onDeleteAll={handleDeleteAll}
          onUpdateMessages={handleUpdateMessages}
          onGoHome={() => setCurrentPage(Page.LANDING)}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />
      )}
    </div>
  );
};

export default App;
