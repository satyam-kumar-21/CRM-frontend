'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Check, CheckCheck, Hash, MoreVertical, Pencil, Plus, Search, Send, Trash2, UserRound, X, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { companyService, ICompanyMessage, type ICompanyLead, type LeadWorkflow } from '@/services/companyService';
import { getBusinessDateString } from '@/lib/businessDate';
import { ChatAttachmentInput } from './ChatAttachmentInput';
import { ChatAttachmentPreview } from './ChatAttachmentPreview';
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
  onSendMessage: () => ICompanyMessage | void | Promise<ICompanyMessage | void>;
  onSendLead?: (lead: Omit<ICompanyLead, '_id' | 'connected' | 'connectedBy' | 'isSale'> & { workflowMessageId?: string }) => Promise<ICompanyMessage>;
  currentUserName?: string;
  isAdmin?: boolean;
  onCreateGroup?: () => void;
  onConversationRead?: (conversationId: string) => void;
};

export function ChatSection(props: ChatSectionProps) {
  const { groups, employees, activeFilter, setActiveFilter, selectedChatId, setSelectedChatId, messageInput, setMessageInput, onSendMessage, onSendLead, currentUserName = 'Employee', isAdmin = false, onCreateGroup, onConversationRead } = props;
  const [messages, setMessages] = useState<ICompanyMessage[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [chatSearch, setChatSearch] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', country: '', system: '', contactNo: '', otherDetails: '' });
  const [saleForms, setSaleForms] = useState<Record<string, { amount: string; paymentMethod: NonNullable<LeadWorkflow['paymentMethod']> }>>({});
  const previousCount = useRef(0);

  const dedupeMessages = (messages: ICompanyMessage[]) => Array.from(new Map(messages.map((message) => [message._id, message])).values());
  const bottomRef = useRef<HTMLDivElement>(null);
  const selectedEmployee = employees.find((employee) => employee.id === selectedChatId);
  const selectedGroup = groups.find((group) => group.id === selectedChatId);
  const title = selectedEmployee?.name || selectedGroup?.name || 'Active Conversation';
  const query = chatSearch.trim().toLowerCase();
  const sortedGroups = [...groups].filter((group) => group.name.toLowerCase().includes(query)).sort((left, right) => new Date(right.latestChatAt || 0).getTime() - new Date(left.latestChatAt || 0).getTime());
  const sortedEmployees = [...employees].filter((employee) => `${employee.name} ${employee.role}`.toLowerCase().includes(query)).sort((left, right) => new Date(right.latestChatAt || 0).getTime() - new Date(left.latestChatAt || 0).getTime());
  const conversations = [
    ...sortedGroups.map((group) => ({ ...group, type: 'group' as const })),
    ...sortedEmployees.map((employee) => ({ ...employee, type: 'employee' as const })),
  ].filter((conversation) => activeFilter === 'all' || conversation.type === (activeFilter === 'groups' ? 'group' : 'employee')).sort((left, right) => new Date(right.latestChatAt || 0).getTime() - new Date(left.latestChatAt || 0).getTime());

  useEffect(() => {
    if (!selectedChatId) return;
    let active = true;
    const load = async () => {
      if (document.hidden || !document.hasFocus()) return;
      try {
        const next = await companyService.getConversationMessages(selectedChatId);
        if (!active) return;
        previousCount.current = next.length;
        setMessages(dedupeMessages(next));
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
    const markRead = () => {
      socket.emit('conversation:read', selectedChatId);
      void companyService.markConversationRead(selectedChatId).catch(() => undefined);
      onConversationRead?.(selectedChatId);
    };
    const joinConversation = () => socket.emit('conversation:join', selectedChatId, (allowed: boolean) => { if (allowed) markRead(); });
    socket.on('connect', joinConversation);
    socket.on('message:new', (message: ICompanyMessage) => {
      if (!active || !message?._id) return;
      const messageConversationId = message.conversationId || message.groupId;
      if (messageConversationId !== selectedChatId) return;
      setMessages((current) => dedupeMessages([...current, message]));
      if (!message.isMine) {
        markRead();
      }
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
      socket.off('connect', joinConversation);
      socket.disconnect();
    };
  }, [selectedChatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const sendMessage = async () => {
    const optimisticContent = messageInput.trim();
    if (!optimisticContent) return;
    const leadValues = optimisticContent.split(',');
    const shortcutLead = onSendLead && leadValues.length >= 5 ? {
      name: leadValues[0].trim(),
      country: leadValues[1].trim(),
      system: leadValues[2].trim(),
      contactNo: leadValues[3].trim(),
      otherDetails: leadValues.slice(4).join(',').trim(),
    } : null;
    if (shortcutLead && Object.values(shortcutLead).slice(0, 4).some((value) => !value)) {
      toast.error('Use: Lead Name, Country, System, Contact No, Other Details');
      return;
    }
    const optimisticId = `pending-${Date.now()}`;
    const optimisticMessage: ICompanyMessage = {
      _id: optimisticId,
      senderId: 'pending',
      content: shortcutLead ? JSON.stringify({ type: 'lead-workflow', status: 'pending', lead: shortcutLead }) : optimisticContent,
      createdAt: new Date().toISOString(),
      isMine: true,
      isSeen: false,
      conversationId: selectedChatId,
    };
    setMessages((current) => [...current, optimisticMessage]);

    try {
      const sentMessage = shortcutLead
        ? onSendLead
          ? await onSendLead(shortcutLead)
          : undefined
        : await onSendMessage();
      if (sentMessage?._id) {
        setMessages((current) => [
          ...current.filter((message) => message._id !== optimisticId && message._id !== sentMessage._id),
          { ...sentMessage, isMine: true },
        ]);
        setMessageInput('');
      }
    } catch (error: any) {
      setMessages((current) => current.filter((message) => message._id !== optimisticId));
      toast.error(error.response?.data?.message || 'Unable to send message');
    }
  };

  const uploadAttachment = async (file: File, type: 'IMAGE' | 'FILE' | 'AUDIO', duration?: number) => {
    if (!selectedChatId) {
      toast.error('Select a conversation first.');
      return;
    }

    const optimisticId = `upload-${Date.now()}`;
    const optimisticMessage: ICompanyMessage = {
      _id: optimisticId,
      senderId: 'pending',
      content: file.name,
      messageType: type,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      createdAt: new Date().toISOString(),
      isMine: true,
      isSeen: false,
      conversationId: selectedChatId,
    };

    setMessages((current) => [...current, optimisticMessage]);
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('attachment', file);
      if (typeof duration === 'number') {
        formData.append('duration', String(duration));
      }

      const sentMessage = await companyService.uploadConversationAttachment(selectedChatId, formData, (progressEvent) => {
        if (progressEvent.total) {
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      });
      setMessages((current) => dedupeMessages(current.map((message) => message._id === optimisticId ? { ...sentMessage, isMine: true } : message)));
    } catch (error: any) {
      setMessages((current) => current.filter((message) => message._id !== optimisticId));
      toast.error(error.response?.data?.message || 'Unable to upload attachment');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
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

  const parseWorkflow = (content: string): LeadWorkflow | null => {
    try { const value = JSON.parse(content); return value?.type === 'lead-workflow' ? value : null; } catch { return null; }
  };
  const updateWorkflow = async (message: ICompanyMessage, workflow: LeadWorkflow) => {
    const updated = await companyService.updateMessage(message._id, JSON.stringify(workflow));
    setMessages((current) => current.map((item) => item._id === message._id ? { ...item, ...updated } : item));
  };
  const actOnWorkflow = async (message: ICompanyMessage, workflow: LeadWorkflow, action: 'accept' | 'decline' | 'connected-yes' | 'connected-no' | 'sale-no' | 'sale-yes', saleForm?: { amount: string; paymentMethod: NonNullable<LeadWorkflow['paymentMethod']> }) => {
    try {
      if (action === 'decline') return await updateWorkflow(message, { ...workflow, status: 'declined' });
      if (action === 'accept') {
        const lead = await companyService.createLead({ ...workflow.lead, connected: 'no', connectedBy: currentUserName, isSale: 'no', workflowMessageId: message._id } as Omit<ICompanyLead, '_id'>);
        return await updateWorkflow(message, { ...workflow, status: 'accepted', leadId: lead._id, acceptedBy: currentUserName });
      }
      if (!workflow.leadId) return;
      if (action === 'connected-yes' || action === 'connected-no') {
        const connected = action === 'connected-yes' ? 'yes' : 'no';
        await companyService.updateLead(workflow.leadId, { ...workflow.lead, connected, connectedBy: workflow.acceptedBy || currentUserName, isSale: workflow.isSale || 'no' });
        return await updateWorkflow(message, { ...workflow, status: 'connected', connected });
      }
      if (action === 'sale-no') {
        await companyService.updateLead(workflow.leadId, { ...workflow.lead, connected: workflow.connected || 'no', connectedBy: workflow.acceptedBy || currentUserName, isSale: 'no' });
        return await updateWorkflow(message, { ...workflow, status: 'connected', isSale: 'no' });
      }
      if (action === 'sale-yes' && !saleForm) {
        setSaleForms((current) => ({ ...current, [message._id]: { amount: '', paymentMethod: 'Other' } }));
        return;
      }
      const confirmedAmount = Number(saleForm?.amount || '');
      if (!Number.isFinite(confirmedAmount) || confirmedAmount < 0) return;
      if (!saleForm?.paymentMethod) return;
      await companyService.createSale({ leadId: workflow.leadId, ...workflow.lead, connectedBy: currentUserName, amount: confirmedAmount, paymentMethod: saleForm.paymentMethod, saleDate: getBusinessDateString() });
      await companyService.updateLead(workflow.leadId, { ...workflow.lead, connected: workflow.connected || 'no', connectedBy: workflow.acceptedBy || currentUserName, isSale: 'yes' });
      return await updateWorkflow(message, { ...workflow, status: 'sale', isSale: 'yes', saleAmount: confirmedAmount, paymentMethod: saleForm.paymentMethod, closedBy: currentUserName });
    } catch (error: any) { toast.error(error.response?.data?.message || 'Unable to update lead workflow'); }
  };
  const saleMessageId = Object.keys(saleForms)[0];
  const saleMessage = saleMessageId ? messages.find((message) => message._id === saleMessageId) : undefined;
  const saleWorkflow = saleMessage ? parseWorkflow(saleMessage.content) : null;

  return <div className="grid h-full grid-cols-1 overflow-hidden md:grid-cols-[340px_1fr]">
    <aside className="flex flex-col border-r border-slate-800/80 bg-slate-900/40">
      <div className="space-y-3 border-b border-slate-800/80 bg-slate-900/60 p-3.5">
        <div className="flex items-center justify-between"><h2 className="text-base font-bold text-white">Chat Workspace</h2>{onCreateGroup && <button aria-label="Create group" onClick={onCreateGroup} className="rounded-lg bg-indigo-600/20 p-1.5 text-indigo-400 hover:bg-indigo-600 hover:text-white"><Plus className="h-4 w-4" /></button>}</div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-950/60 px-2.5"><Search className="h-3.5 w-3.5 text-slate-500" /><input value={chatSearch} onChange={(event) => setChatSearch(event.target.value)} placeholder="Search chats" className="min-w-0 flex-1 bg-transparent py-2 text-xs text-white outline-none placeholder:text-slate-500" /></div>
        <div className="flex gap-1">{(['all', 'groups', 'employees'] as ChatFilter[]).map((filter) => <button key={filter} onClick={() => setActiveFilter(filter)} className={`rounded-full px-3 py-1 text-[11px] capitalize ${activeFilter === filter ? 'bg-indigo-600 text-white' : 'bg-slate-800/60 text-slate-400'}`}>{filter}</button>)}</div>
      </div>
      <div className="flex-1 divide-y divide-slate-800/40 overflow-y-auto">
        {conversations.map((conversation) => <button key={conversation.id} onClick={() => setSelectedChatId(conversation.id)} className={`flex w-full items-center gap-3 p-3.5 text-left ${selectedChatId === conversation.id ? 'border-l-4 border-indigo-500 bg-indigo-600/10' : 'hover:bg-slate-800/30'}`}><div className={`flex h-10 w-10 shrink-0 items-center justify-center ${conversation.type === 'group' ? 'rounded-xl bg-indigo-600' : `rounded-full bg-gradient-to-tr ${conversation.avatarBg}`} text-white`}>{conversation.type === 'group' ? <Hash className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}</div><span className="min-w-0 flex-1"><b className="block truncate text-xs text-slate-200">{conversation.name}</b><small className="text-[11px] text-slate-400">{conversation.type === 'group' ? conversation.description : conversation.role}</small></span>{conversation.unreadCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1.5 text-[10px] font-bold text-white">{conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}</span>}</button>)}
      </div>
    </aside>
    <section className="flex min-h-0 flex-col bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/60 p-4"><p className="text-[10px] uppercase tracking-widest text-indigo-400">Encrypted Enterprise Channel</p><h2 className="mt-1 text-base font-bold text-white">{title}</h2><p className="text-xs text-slate-500">{selectedEmployee ? `${selectedEmployee.role} · Direct conversation` : 'Workspace group conversation'}</p></header>
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.length ? messages.map((message, index) => <div key={`${message._id}-${index}`} className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}>
          <div className={`relative max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${message.isMine ? 'bg-indigo-600/80 text-white' : 'bg-slate-900 text-slate-200'}`}>
            {editingId === message._id ? <div className="flex gap-2"><input autoFocus value={editingText} onChange={(event) => setEditingText(event.target.value)} className="rounded bg-slate-950 px-2 py-1 text-white" /><button aria-label="Save message" onClick={() => void editMessage(message._id)}><Check className="h-4 w-4" /></button><button aria-label="Cancel editing" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></button></div> : <>
              {(() => {
                if (message.messageType && message.objectKey) {
                  return <ChatAttachmentPreview message={message} conversationId={selectedChatId} />;
                }
                const workflow = parseWorkflow(message.content);
                if (!workflow) return <p>{message.content}</p>;
                return <div className="space-y-2"><p className="font-bold">📌 Lead</p><p>Lead Name: {workflow.lead.name}<br />Country: {workflow.lead.country}<br />System: {workflow.lead.system}<br />Contact: {workflow.lead.contactNo}{workflow.lead.otherDetails && <><br />Details: {workflow.lead.otherDetails}</>}</p>{workflow.status === 'pending' && !message.isMine && <div className="flex gap-2"><button onClick={() => void actOnWorkflow(message, workflow, 'accept')} className="rounded bg-emerald-600 px-2 py-1 text-xs">Accept</button><button onClick={() => void actOnWorkflow(message, workflow, 'decline')} className="rounded bg-rose-600 px-2 py-1 text-xs">Decline</button></div>}{workflow.status === 'pending' && message.isMine && <p className="text-xs text-slate-300">Awaiting response</p>}{workflow.status === 'declined' && <p className="font-semibold text-rose-300">Declined</p>}{workflow.status !== 'pending' && workflow.status !== 'declined' && <><p>Accepted By: {workflow.acceptedBy}</p>{workflow.status === 'accepted' && !message.isMine && <div><p className="mb-1">Connected?</p><div className="flex gap-2"><button onClick={() => void actOnWorkflow(message, workflow, 'connected-yes')} className="rounded bg-emerald-600 px-2 py-1 text-xs">Yes</button><button onClick={() => void actOnWorkflow(message, workflow, 'connected-no')} className="rounded bg-slate-600 px-2 py-1 text-xs">No</button></div></div>}{workflow.status !== 'accepted' && <p>Connected: {workflow.connected === 'yes' ? 'Yes' : 'No'}</p>}{workflow.status === 'connected' && workflow.isSale === undefined && !message.isMine && <div><p className="mb-1">Is Sale?</p><div className="flex gap-2"><button onClick={() => void actOnWorkflow(message, workflow, 'sale-yes')} className="rounded bg-emerald-600 px-2 py-1 text-xs">Yes</button><button onClick={() => void actOnWorkflow(message, workflow, 'sale-no')} className="rounded bg-slate-600 px-2 py-1 text-xs">No</button></div></div>}{workflow.isSale === 'no' && <p>Sale: No</p>}{workflow.isSale === 'yes' && <p>Sale: Yes<br />Sale Amount: {workflow.saleAmount?.toLocaleString()}<br />Closed By: {workflow.closedBy}<br /><b>✅ Sale Completed</b></p>}</>}</div>; })()}
              <time className="mt-1 flex items-center gap-1 text-[10px] text-slate-400"><span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>{message.isEdited && <span>· edited</span>}{message.isMine && (message.isSeen ? <CheckCheck className="h-3.5 w-3.5 text-sky-300" aria-label="Seen" /> : <Check className="h-3.5 w-3.5 text-slate-300" aria-label="Sent" />)}</time>
              {!message.isMine && <p className="mt-0.5 text-[10px] text-slate-400">{message.senderName || 'Workspace member'}</p>}
              {message.isMine && <div className="absolute -right-2 -top-2"><button aria-label="Message options" title="Message options" onClick={() => setOpenMenuId((current) => current === message._id ? null : message._id)} className="rounded-full bg-slate-700 p-1 text-slate-200 shadow hover:bg-slate-600"><MoreVertical className="h-3.5 w-3.5" /></button>{openMenuId === message._id && <div className="absolute right-0 top-7 z-10 w-28 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 py-1 text-xs shadow-xl"><button className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-200 hover:bg-slate-800" onClick={() => { setEditingId(message._id); setEditingText(message.content); setOpenMenuId(null); }}><Pencil className="h-3.5 w-3.5" /> Edit</button><button className="flex w-full items-center gap-2 px-3 py-2 text-left text-rose-300 hover:bg-slate-800" onClick={() => { setOpenMenuId(null); void deleteMessage(message._id); }}><Trash2 className="h-3.5 w-3.5" /> Delete</button></div>}</div>}
            </>}
          </div>
        </div>) : <p className="text-center text-sm text-slate-500">No messages yet. Start the conversation.</p>}<div ref={bottomRef} />
      </div>
      {saleMessage && saleWorkflow && saleForms[saleMessage._id] && <form onSubmit={async (event) => { event.preventDefault(); const form = saleForms[saleMessage._id]; if (!form.amount) { toast.error('Enter a sale amount'); return; } await actOnWorkflow(saleMessage, saleWorkflow, 'sale-yes', form); setSaleForms((current) => { const next = { ...current }; delete next[saleMessage._id]; return next; }); }} className="border-t border-emerald-500/20 bg-slate-900/95 p-4"><div className="mx-auto flex max-w-2xl flex-col gap-3 rounded-xl border border-slate-700 bg-slate-950 p-4 shadow-lg"><div><p className="text-sm font-semibold text-white">Complete Sale</p><p className="mt-1 text-xs text-slate-400">{saleWorkflow.lead.name} · enter the final amount and payment mode.</p></div><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-xs text-slate-400"><span>Sale Amount</span><input required min="0" step="0.01" type="number" value={saleForms[saleMessage._id].amount} onChange={(event) => setSaleForms((current) => ({ ...current, [saleMessage._id]: { ...current[saleMessage._id], amount: event.target.value } }))} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" placeholder="0.00" /></label><label className="space-y-1 text-xs text-slate-400"><span>Payment Mode</span><select required value={saleForms[saleMessage._id].paymentMethod} onChange={(event) => setSaleForms((current) => ({ ...current, [saleMessage._id]: { ...current[saleMessage._id], paymentMethod: event.target.value as NonNullable<LeadWorkflow['paymentMethod']> } }))} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"><option value="Card">Card</option><option value="Check">Check</option><option value="Wire Transfer">Wire Transfer</option><option value="Cash">Cash</option><option value="Other">Other</option></select></label></div><div className="flex justify-end gap-2"><button type="button" onClick={() => setSaleForms({})} className="rounded-lg bg-slate-700 px-3 py-2 text-xs text-white">Cancel</button><button className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"><Check className="mr-1 inline h-3.5 w-3.5" />Confirm Sale</button></div></div></form>}
      {showLeadForm && <form onSubmit={async (event) => { event.preventDefault(); if (!onSendLead) return; try { await onSendLead(leadForm); setLeadForm({ name: '', country: '', system: '', contactNo: '', otherDetails: '' }); setShowLeadForm(false); } catch (error: any) { toast.error(error.response?.data?.message || 'Unable to send lead'); } }} className="grid gap-2 border-t border-slate-800 bg-slate-900/80 p-4 sm:grid-cols-5">{(['name', 'country', 'system', 'contactNo', 'otherDetails'] as const).map((key) => <input key={key} required={key !== 'otherDetails'} placeholder={key === 'contactNo' ? 'Contact No' : key === 'otherDetails' ? 'Other Details' : key.replace(/([A-Z])/g, ' $1')} value={leadForm[key]} onChange={(event) => setLeadForm((current) => ({ ...current, [key]: event.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-white" />)}<button className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white sm:col-span-5">Send Lead</button></form>}
      <div className="border-t border-slate-800 bg-slate-900/40 p-4">
        <div className="flex items-start gap-3">
          {onSendLead && selectedEmployee?.role === 'SALES' && <button aria-label="Send lead" title="Send lead" onClick={() => setShowLeadForm((current) => !current)} className="rounded-xl bg-amber-600 px-3 py-2 text-white"><UserPlus className="h-4 w-4" /></button>}
          <div className="flex-1">
            <ChatAttachmentInput
              isDisabled={!selectedChatId || uploading}
              onSendText={sendMessage}
              onFileSelected={uploadAttachment}
              messageInput={messageInput}
              setMessageInput={setMessageInput}
            />
            {uploading && uploadProgress !== null && (
              <div className="mt-3 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300">
                Uploading attachment: {uploadProgress}%
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  </div>;
}
