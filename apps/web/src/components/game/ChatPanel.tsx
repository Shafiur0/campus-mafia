'use client';

import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Send } from 'lucide-react';

export interface ChatMessage {
  senderId: string;
  senderName: string;
  avatar: string | null;
  message: string;
  timestamp: string;
}

interface ChatPanelProps {
  allMessages: ChatMessage[];
  mafiaMessages: ChatMessage[];
  systemLogs: string[];
  isMafia: boolean;
  onSendMessage: (msg: string, isMafiaChannel: boolean) => void;
  isDead: boolean;
}

export function ChatPanel({
  allMessages,
  mafiaMessages,
  systemLogs,
  isMafia,
  onSendMessage,
  isDead,
}: ChatPanelProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'mafia' | 'system'>('all');
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), activeTab === 'mafia');
    setInputText('');
  };

  return (
    <GlassCard className="h-full flex flex-col p-4 bg-[#12142B]/60 border-white/[0.08] relative">
      {/* Tabs */}
      <div className="flex border-b border-white/[0.05] mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex-grow py-2 text-xs font-mono tracking-wider uppercase border-b-2 cursor-pointer ${
            activeTab === 'all'
              ? 'border-[#7C3AED] text-white font-bold'
              : 'border-transparent text-textMuted hover:text-white'
          }`}
        >
          All Chat
        </button>
        {isMafia && (
          <button
            type="button"
            onClick={() => setActiveTab('mafia')}
            className={`flex-grow py-2 text-xs font-mono tracking-wider uppercase border-b-2 cursor-pointer ${
              activeTab === 'mafia'
                ? 'border-[#F43F5E] text-white font-bold'
                : 'border-transparent text-textMuted hover:text-white'
            }`}
          >
            Mafia Chat
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`flex-grow py-2 text-xs font-mono tracking-wider uppercase border-b-2 cursor-pointer ${
            activeTab === 'system'
              ? 'border-[#22D3EE] text-white font-bold'
              : 'border-transparent text-textMuted hover:text-white'
          }`}
        >
          Logs
        </button>
      </div>

      {/* Messages Window */}
      <div className="flex-grow overflow-y-auto space-y-3 pr-1 max-h-[350px] min-h-[200px]">
        {activeTab === 'all' &&
          allMessages.map((msg, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              <img
                src={msg.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(msg.senderName)}`}
                className="w-6 h-6 rounded-full border border-white/10"
                alt=""
              />
              <div className="bg-white/[0.03] p-2 rounded-xl border border-white/[0.03] flex-grow">
                <span className="font-semibold text-white mr-1.5">{msg.senderName}</span>
                <span className="text-white/80">{msg.message}</span>
              </div>
            </div>
          ))}

        {activeTab === 'mafia' &&
          mafiaMessages.map((msg, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              <img
                src={msg.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(msg.senderName)}`}
                className="w-6 h-6 rounded-full border border-white/10"
                alt=""
              />
              <div className="bg-[#F43F5E]/5 p-2 rounded-xl border border-[#F43F5E]/10 flex-grow">
                <span className="font-semibold text-danger mr-1.5">{msg.senderName}</span>
                <span className="text-white/80">{msg.message}</span>
              </div>
            </div>
          ))}

        {activeTab === 'system' &&
          systemLogs.map((log, idx) => (
            <div key={idx} className="text-[11px] font-mono text-textMuted leading-relaxed">
              <span className="text-[#22D3EE] mr-1.5">&gt;</span>
              {log}
            </div>
          ))}
      </div>

      {/* Input panel (only for chat tabs, disabled if dead) */}
      {activeTab !== 'system' && (
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isDead}
            placeholder={isDead ? 'Eliminated players cannot speak...' : 'Type a message...'}
            className="flex-grow bg-[#1A1C38] border border-white/[0.08] focus:border-[#7C3AED] rounded-xl px-3 py-2 text-white text-xs outline-none transition-all placeholder-white/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isDead || !inputText.trim()}
            className="w-8 h-8 rounded-xl bg-[#7C3AED] hover:bg-[#7C3AED]/80 flex items-center justify-center text-white transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </GlassCard>
  );
}
