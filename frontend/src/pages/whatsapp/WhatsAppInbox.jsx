import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { MessageSquare, Send, CheckCheck, User, Phone, Bot, FileText } from 'lucide-react';

export default function WhatsAppInbox() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/whatsapp/conversations');
      if (res.success && res.conversations.length > 0) {
        setConversations(res.conversations);
        if (!activeConvId) setActiveConvId(res.conversations[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    if (!convId) return;
    try {
      const res = await api.get(`/whatsapp/messages/${convId}`);
      if (res.success) setMessages(res.messages);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
    api.get('/whatsapp/templates').then(res => res.success && setTemplates(res.templates)).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    }
  }, [activeConvId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConvId) return;

    const contentToSend = messageInput;
    setMessageInput('');

    try {
      await api.post('/whatsapp/send', {
        conversation_id: activeConvId,
        content: contentToSend
      });
      fetchMessages(activeConvId);
      fetchConversations();
    } catch (err) {
      alert(err.message || 'Send message failed');
    }
  };

  const handleApplyTemplate = (tmpl) => {
    setMessageInput(tmpl.body_content);
  };

  const activeConv = conversations.find(c => c.id === activeConvId);

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col glass-panel rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-teal-600" />
          <h1 className="text-base font-extrabold text-slate-900">WhatsApp Cloud API Inbox</h1>
        </div>
        <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
          Official Meta API Connected
        </span>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left: Conversations Sidebar */}
        <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/70">
          <div className="p-3 border-b border-slate-200 font-bold text-xs text-slate-500 uppercase tracking-wider">
            Active Chats ({conversations.length})
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                  activeConvId === conv.id ? 'bg-sky-50 border-l-4 border-sky-600' : 'hover:bg-slate-100/80'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-200">
                  {conv.contact_name ? conv.contact_name.charAt(0) : 'C'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-xs font-bold text-slate-900 truncate">{conv.contact_name || conv.contact_phone}</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{conv.last_message || 'Start conversation...'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Message Window */}
        <div className="flex-1 flex flex-col bg-slate-50/30">
          {/* Active Contact Bar */}
          <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold text-slate-900">{activeConv?.contact_name || activeConv?.contact_phone || 'Select Chat'}</span>
              <span className="text-[10px] text-slate-500 font-medium">{activeConv?.contact_phone}</span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-md ${msg.direction === 'OUTBOUND' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.direction === 'OUTBOUND'
                      ? 'bg-teal-600 text-white rounded-br-none shadow-sm'
                      : 'bg-white text-slate-900 rounded-bl-none border border-slate-200 shadow-xs'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.direction === 'OUTBOUND' && <CheckCheck className="w-3 h-3 text-teal-600" />}
                </span>
              </div>
            ))}
          </div>

          {/* Templates Quick Bar */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-slate-500 font-bold uppercase text-[9px] shrink-0 flex items-center gap-1">
              <Bot className="w-3 h-3 text-sky-600" /> Quick Templates:
            </span>
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => handleApplyTemplate(t)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium whitespace-nowrap shadow-2xs"
              >
                {t.template_name}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type WhatsApp message or select quick template..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
