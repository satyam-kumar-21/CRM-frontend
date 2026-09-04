'use client';

import { useMemo, useState } from 'react';
import { Hash, Plus, Search, UserRound, X } from 'lucide-react';
import { companyService, type ICompanyLead, type ICompanyMessage } from '@/services/companyService';
import { ChatSection } from './ChatSection';
import type { ChatFilter, IEmployee, IGroupChannel } from '../types';

type MultiChatSectionProps = {
  groups: IGroupChannel[];
  employees: IEmployee[];
  openChatIds: string[];
  setOpenChatIds: (ids: string[]) => void;
  onCreateGroup?: () => void;
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: string;
  isAdmin?: boolean;
  onConversationRead?: (conversationId: string) => void;
};

export function MultiChatSection({
  groups,
  employees,
  openChatIds,
  setOpenChatIds,
  onCreateGroup,
  currentUserId,
  currentUserName,
  currentUserRole,
  isAdmin,
  onConversationRead,
}: MultiChatSectionProps) {
  const [showConversationList, setShowConversationList] = useState(openChatIds.length === 0);
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
  const [chatSearch, setChatSearch] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const query = chatSearch.trim().toLowerCase();
  const conversations = useMemo(() => [
    ...groups.filter((group) => group.name.toLowerCase().includes(query)).map((group) => ({ ...group, type: 'group' as const })),
    ...employees.filter((employee) => `${employee.name} ${employee.role}`.toLowerCase().includes(query)).map((employee) => ({ ...employee, type: 'employee' as const })),
  ].filter((conversation) => activeFilter === 'all' || conversation.type === (activeFilter === 'groups' ? 'group' : 'employee'))
    .sort((left, right) => new Date(right.latestChatAt || 0).getTime() - new Date(left.latestChatAt || 0).getTime()), [activeFilter, employees, groups, query]);

  const openChat = (conversationId: string) => {
    setShowConversationList(false);
    if (openChatIds.includes(conversationId)) return;
    if (openChatIds.length >= 3) {
      setOpenChatIds([...openChatIds.slice(1), conversationId]);
      return;
    }
    setOpenChatIds([...openChatIds, conversationId]);
  };

  const closeChat = (conversationId: string) => {
    const next = openChatIds.filter((id) => id !== conversationId);
    setOpenChatIds(next);
    if (!next.length) setShowConversationList(true);
    setDrafts((current) => {
      const copy = { ...current };
      delete copy[conversationId];
      return copy;
    });
  };

  const sendMessage = (conversationId: string) => async () => {
    const content = drafts[conversationId]?.trim();
    if (!content) return;
    const message = await companyService.postConversationMessage(conversationId, { content });
    setDrafts((current) => ({ ...current, [conversationId]: '' }));
    return message;
  };

  const sendLead = (conversationId: string) => async (lead: Omit<ICompanyLead, '_id' | 'connected' | 'connectedBy' | 'isSale'> & { workflowMessageId?: string }) => (
    companyService.postConversationMessage(conversationId, { content: JSON.stringify({ type: 'lead-workflow', status: 'pending', lead }) })
  );
  const chatGridColumns = openChatIds.length === 1
    ? 'grid-cols-1'
    : openChatIds.length === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

  return (
    <div className="grid h-full min-h-0 grid-cols-1 overflow-hidden bg-slate-950 font-sans md:grid-cols-[280px_minmax(0,1fr)]">
      <aside className={`${showConversationList ? 'flex' : 'hidden'} min-h-0 flex-col border-r border-slate-800/80 bg-slate-900/50 md:flex`}>
        <div className="space-y-3 border-b border-slate-800/80 bg-slate-900/70 p-3.5">
          <div className="flex items-center justify-between">
            <div><h2 className="text-base font-bold tracking-tight text-white">Workspace Chat</h2><p className="mt-0.5 text-[11px] text-slate-500">Open up to 3 chats</p></div>
            {onCreateGroup && <button aria-label="Create group" onClick={onCreateGroup} className="rounded-lg bg-indigo-600/20 p-1.5 text-indigo-400 transition hover:bg-indigo-600 hover:text-white"><Plus className="h-4 w-4" /></button>}
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-950/60 px-2.5"><Search className="h-3.5 w-3.5 text-slate-500" /><input value={chatSearch} onChange={(event) => setChatSearch(event.target.value)} placeholder="Search chats" className="min-w-0 flex-1 bg-transparent py-2 text-xs text-white outline-none placeholder:text-slate-500" /></div>
          <div className="flex gap-1">{(['all', 'groups', 'employees'] as ChatFilter[]).map((filter) => <button key={filter} onClick={() => setActiveFilter(filter)} className={`rounded-full px-3 py-1 text-[11px] capitalize transition-colors ${activeFilter === filter ? 'bg-indigo-600 font-semibold text-white' : 'bg-slate-800/60 text-slate-400 hover:text-white'}`}>{filter}</button>)}</div>
        </div>
        <div className="flex-1 divide-y divide-slate-800/40 overflow-y-auto">
          {conversations.map((conversation) => <button key={conversation.id} onClick={() => openChat(conversation.id)} className={`flex w-full items-center gap-3 p-3 text-left transition ${openChatIds.includes(conversation.id) ? 'border-l-4 border-emerald-500 bg-emerald-500/10' : 'hover:bg-slate-800/30'}`}>
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center text-white ${conversation.type === 'group' ? 'rounded-xl bg-indigo-600' : `rounded-full bg-gradient-to-tr ${conversation.avatarBg}`}`}>{conversation.type === 'group' ? <Hash className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}</div>
            <span className="min-w-0 flex-1"><b className="block truncate text-xs text-slate-200">{conversation.name}</b><small className="text-[11px] text-slate-400">{conversation.type === 'group' ? conversation.description : conversation.role}</small></span>
            {conversation.unreadCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-slate-950">{conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}</span>}
          </button>)}
        </div>
      </aside>
      <div className={`${showConversationList ? 'hidden' : 'grid'} min-h-0 min-w-0 gap-2 overflow-auto bg-slate-950 p-2 md:grid ${chatGridColumns}`}>
        {openChatIds.map((conversationId) => <div key={conversationId} className="relative min-h-[520px] overflow-hidden rounded-xl border border-slate-800 shadow-lg"><button aria-label="Close chat" title="Close chat" onClick={() => closeChat(conversationId)} className="absolute right-2 top-2 z-20 rounded-full bg-slate-950/80 p-1.5 text-slate-400 transition hover:bg-rose-600 hover:text-white"><X className="h-3.5 w-3.5" /></button><ChatSection groups={groups} employees={employees} activeFilter={activeFilter} setActiveFilter={setActiveFilter} selectedChatId={conversationId} setSelectedChatId={() => undefined} messageInput={drafts[conversationId] || ''} setMessageInput={(value) => setDrafts((current) => ({ ...current, [conversationId]: typeof value === 'function' ? value(current[conversationId] || '') : value }))} onSendMessage={sendMessage(conversationId)} onSendLead={sendLead(conversationId)} currentUserId={currentUserId} currentUserName={currentUserName} currentUserRole={currentUserRole} isAdmin={isAdmin} hideSidebar onShowSidebar={() => setShowConversationList(true)} onConversationRead={onConversationRead} /></div>)}
        {!openChatIds.length && <div className="col-span-full grid place-items-center text-sm text-slate-500">Select a conversation to open a chat window.</div>}
      </div>
    </div>
  );
}
