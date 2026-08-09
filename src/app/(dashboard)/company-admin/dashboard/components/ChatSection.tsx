'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Check, CheckCheck, Hash, MoreVertical, Pencil, Plus, Send, Trash2, UserRound, X } from 'lucide-react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { companyService, ICompanyMessage } from '@/services/companyService';
import type { ChatFilter, IEmployee, IGroupChannel } from '../types';

type ChatSectionProps = {
  groups: IGroupChannel[];
  employees: IEmployee[];
  activeFilter: ChatFilter;
  setActiveFilter: Dispatch<SetStateAction<ChatFilter>>;
  selectedChatId: string;
  setSelectedChatId: Dispatch<SetStateAction<string>>;
  messageInput: string;
  setMessageInput: Dispatch<SetStateAction<string>>;
  onSendMessage: () => void | Promise<void>;
  onCreateGroup?: () => void;
};

export function ChatSection(props: ChatSectionProps) {
  const { groups, employees, activeFilter, setActiveFilter, selectedChatId, setSelectedChatId, messageInput, setMessageInput, onSendMessage, onCreateGroup } = props;
  const [messages, setMessages] = useState<ICompanyMessage[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const previousCount = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const selectedEmployee = employees.find((employee) => employee.id === selectedChatId);
  const selectedGroup = groups.find((group) => group.id === selectedChatId);
  const title = selectedEmployee?.name || selectedGroup?.name || 'Active Conversation';

  useEffect(() => {
    if (!selectedChatId) return;
    let active = true;
    const load = async () => {
      if (document.hidden || !document.hasFocus()) return;
      try {
        const next = await companyService.getConversationMessages(selectedChatId);
        if (!active) return;
        previousCount.current = next.length;
        setMessages(next);
      } catch {
        if (active) setMessages([]);
      }
    };
    previousCount.current = 0;
    void load();
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: window.localStorage.getItem('companyAccessToken') || undefined },
      withCredentials: true,
    });
    socket.on('connect', () => socket.emit('conversation:join', selectedChatId, (allowed: boolean) => { if (allowed) socket.emit('conversation:read', selectedChatId); }));
    socket.on('message:new', (message: ICompanyMessage) => {
      if (!active || !message?._id) return;
      setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message]);
      if (!message.isMine) socket.emit('conversation:read', selectedChatId);
    });
    socket.on('message:updated', (message: ICompanyMessage) => {
      setMessages((current) => current.map((item) => item._id === message._id ? { ...item, ...message } : item));
    });
    socket.on('message:deleted', (message: { id: string }) => {
      setMessages((current) => current.filter((item) => item._id !== message.id));
    });
    socket.on('message:read', (receipt: { messageIds: string[] }) => {
      setMessages((current) => current.map((message) => receipt.messageIds.includes(message._id) ? { ...message, isSeen: true } : message));
    });
    return () => {
      active = false;
      socket.emit('conversation:leave', selectedChatId);
      socket.disconnect();
    };
  }, [selectedChatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const sendMessage = async () => {
    await onSendMessage();
  };

  const editMessage = async (messageId: string) => {
    if (!editingText.trim()) return;
    try {
      const updated = await companyService.updateMessage(messageId, editingText.trim());
      setMessages((current) => current.map((message) => message._id === messageId ? updated : message));
      setEditingId(null);
      setEditingText('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to edit message');
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await companyService.deleteMessage(messageId);
      setMessages((current) => current.filter((message) => message._id !== messageId));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to delete message');
    }
  };

  return <div className="grid h-full grid-cols-1 overflow-hidden md:grid-cols-[340px_1fr]">
    <aside className="flex flex-col border-r border-slate-800/80 bg-slate-900/40">
      <div className="space-y-3 border-b border-slate-800/80 bg-slate-900/60 p-3.5">
        <div className="flex items-center justify-between"><h2 className="text-base font-bold text-white">Chat Workspace</h2>{onCreateGroup && <button aria-label="Create group" onClick={onCreateGroup} className="rounded-lg bg-indigo-600/20 p-1.5 text-indigo-400 hover:bg-indigo-600 hover:text-white"><Plus className="h-4 w-4" /></button>}</div>
        <div className="flex gap-1">{(['all', 'groups', 'employees'] as ChatFilter[]).map((filter) => <button key={filter} onClick={() => setActiveFilter(filter)} className={`rounded-full px-3 py-1 text-[11px] capitalize ${activeFilter === filter ? 'bg-indigo-600 text-white' : 'bg-slate-800/60 text-slate-400'}`}>{filter}</button>)}</div>
      </div>
      <div className="flex-1 divide-y divide-slate-800/40 overflow-y-auto">
        {(activeFilter === 'all' || activeFilter === 'groups') && groups.map((group) => <button key={group.id} onClick={() => setSelectedChatId(group.id)} className={`flex w-full items-center gap-3 p-3.5 text-left ${selectedChatId === group.id ? 'border-l-4 border-indigo-500 bg-indigo-600/10' : 'hover:bg-slate-800/30'}`}><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"><Hash className="h-5 w-5" /></div><span className="min-w-0 flex-1"><b className="block truncate text-xs text-slate-200">{group.name}</b><small className="text-[11px] text-slate-400">{group.description}</small></span></button>)}
        {(activeFilter === 'all' || activeFilter === 'employees') && employees.map((employee) => <button key={employee.id} onClick={() => setSelectedChatId(employee.id)} className={`flex w-full items-center gap-3 p-3.5 text-left ${selectedChatId === employee.id ? 'border-l-4 border-indigo-500 bg-indigo-600/10' : 'hover:bg-slate-800/30'}`}><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr ${employee.avatarBg} text-white`}><UserRound className="h-5 w-5" /></div><span className="min-w-0 flex-1"><b className="block truncate text-xs text-slate-200">{employee.name}</b><small className="text-[11px] text-slate-400">{employee.role}</small></span></button>)}
      </div>
    </aside>
    <section className="flex min-h-0 flex-col bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/60 p-4"><p className="text-[10px] uppercase tracking-widest text-indigo-400">Encrypted Enterprise Channel</p><h2 className="mt-1 text-base font-bold text-white">{title}</h2><p className="text-xs text-slate-500">{selectedEmployee ? `${selectedEmployee.role} · Direct conversation` : 'Workspace group conversation'}</p></header>
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.length ? messages.map((message) => <div key={message._id} className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}>
          <div className={`relative max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${message.isMine ? 'bg-indigo-600/80 text-white' : 'bg-slate-900 text-slate-200'}`}>
            {editingId === message._id ? <div className="flex gap-2"><input autoFocus value={editingText} onChange={(event) => setEditingText(event.target.value)} className="rounded bg-slate-950 px-2 py-1 text-white" /><button aria-label="Save message" onClick={() => void editMessage(message._id)}><Check className="h-4 w-4" /></button><button aria-label="Cancel editing" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></button></div> : <>
              <p>{message.content}</p>
              <time className="mt-1 flex items-center gap-1 text-[10px] text-slate-400"><span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>{message.isEdited && <span>· edited</span>}{message.isMine && (message.isSeen ? <CheckCheck className="h-3.5 w-3.5 text-sky-300" aria-label="Seen" /> : <Check className="h-3.5 w-3.5 text-slate-300" aria-label="Sent" />)}</time>
              {!message.isMine && <p className="mt-0.5 text-[10px] text-slate-400">{message.senderName || 'Workspace member'}</p>}
              {message.isMine && <div className="absolute -right-2 -top-2"><button aria-label="Message options" title="Message options" onClick={() => setOpenMenuId((current) => current === message._id ? null : message._id)} className="rounded-full bg-slate-700 p-1 text-slate-200 shadow hover:bg-slate-600"><MoreVertical className="h-3.5 w-3.5" /></button>{openMenuId === message._id && <div className="absolute right-0 top-7 z-10 w-28 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 py-1 text-xs shadow-xl"><button className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-200 hover:bg-slate-800" onClick={() => { setEditingId(message._id); setEditingText(message.content); setOpenMenuId(null); }}><Pencil className="h-3.5 w-3.5" /> Edit</button><button className="flex w-full items-center gap-2 px-3 py-2 text-left text-rose-300 hover:bg-slate-800" onClick={() => { setOpenMenuId(null); void deleteMessage(message._id); }}><Trash2 className="h-3.5 w-3.5" /> Delete</button></div>}</div>}
            </>}
          </div>
        </div>) : <p className="text-center text-sm text-slate-500">No messages yet. Start the conversation.</p>}<div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t border-slate-800 bg-slate-900/40 p-4"><input value={messageInput} onChange={(event) => setMessageInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void sendMessage(); }} placeholder={`Message ${title}`} className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500" disabled={!selectedChatId} /><button aria-label="Send message" onClick={() => void sendMessage()} className="rounded-xl bg-indigo-600 px-4 text-white hover:bg-indigo-500" disabled={!selectedChatId || !messageInput.trim()}><Send className="h-4 w-4" /></button></div>
    </section>
  </div>;
}
