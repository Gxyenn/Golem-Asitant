
import React from 'react';
import { Sparkles, MessageSquare, ShieldCheck, Zap, ArrowRight, Sun, Moon } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, isDarkMode, onToggleTheme }) => {
  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-slate-900 transition-transform group-hover:rotate-12">
            <Sparkles size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight">Golem</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onToggleTheme} className="p-2 rounded-full border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={onStart} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-all shadow-lg active:scale-95">
            Get Started
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-4xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-8 animate-bounce">
          <Zap size={14} className="text-yellow-500" />
          The Future of AI
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
          Golem – AI Assistant <br />
          <span className="text-slate-400 dark:text-slate-500">by Dev Stoky</span>
        </h1>
        
        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mb-12 leading-relaxed">
          Experience sophisticated, polite, and highly capable AI designed for elegance and precision.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <button onClick={onStart} className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl text-lg font-bold hover:scale-105 active:scale-95 shadow-xl transition-all">
            Start Chatting <ArrowRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {[
            { icon: <MessageSquare />, title: "Rich Formatting", text: "Golem supports Markdown, code blocks, and professional formatting." },
            { icon: <ShieldCheck />, title: "File Analysis", text: "Upload images or documents for Golem to analyze and explain." },
            { icon: <Zap />, title: "Dynamic Themes", text: "Switch between Light and Dark mode seamlessly for comfort." }
          ].map((feature, i) => (
            <div key={i} className={`p-8 rounded-3xl text-left border transition-all hover:shadow-md ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
              <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white mb-6 shadow-sm border dark:border-slate-600">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-slate-500 dark:text-slate-400">{feature.text}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="w-full py-10 border-t dark:border-slate-800 flex flex-col items-center gap-4">
        <div className="text-slate-400 text-sm font-medium">Developed by <span className="text-slate-900 dark:text-white font-bold">Dev Stoky</span></div>
      </footer>
    </div>
  );
};

export default LandingPage;
