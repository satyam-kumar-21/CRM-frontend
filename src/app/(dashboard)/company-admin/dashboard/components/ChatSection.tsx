'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Check, CheckCheck, Hash, MoreVertical, Pencil, Plus, Search, Send, Trash2, UserRound, X, UserPlus, Image, FileText, Mic } from 'lucide-react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { companyService, ICompanyMessage, type ICompanyLead, type IRemoteSupportRecord, type LeadWorkflow } from '@/services/companyService';
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
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: string;
  isAdmin?: boolean;
  onCreateGroup?: () => void;
  onConversationRead?: (conversationId: string) => void;
};

function formatMessageDateLabel(dateString: string): string {
  const messageDate = getBusinessDateString(dateString);
  const today = getBusinessDateString(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = getBusinessDateString(yesterdayDate);

  if (messageDate === today) return 'Today';
  if (messageDate === yesterday) return 'Yesterday';
  return messageDate;
}

export function ChatSection(props: ChatSectionProps) {
  const { groups, employees, activeFilter, setActiveFilter, selectedChatId, setSelectedChatId, messageInput, setMessageInput, onSendMessage, onSendLead, currentUserId, currentUserName = 'Employee', currentUserRole, isAdmin = false, onCreateGroup, onConversationRead } = props;
  const [messages, setMessages] = useState<ICompanyMessage[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [chatSearch, setChatSearch] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [remoteSupportByLeadId, setRemoteSupportByLeadId] = useState<Record<string, IRemoteSupportRecord[]>>({});
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', country: '', system: '', contactNo: '', otherDetails: '' });
  const [saleForms, setSaleForms] = useState<Record<string, { amount: string; paymentMethod: NonNullable<LeadWorkflow['paymentMethod']> }>>({});
  const previousCount = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const dedupeMessages = (msgList: ICompanyMessage[]) => Array.from(new Map(msgList.map((m) => [m._id, m])).values());

  const selectedEmployee = employees.find((emp) => emp.id === selectedChatId);
  const selectedGroup = groups.find((grp) => grp.id === selectedChatId);
  const title = selectedEmployee?.name || selectedGroup?.name || 'Active Conversation';
  const query = chatSearch.trim().toLowerCase();

  const sortedGroups = [...groups].filter((g) => g.name.toLowerCase().includes(query)).sort((l, r) => new Date(r.latestChatAt || 0).getTime() - new Date(l.latestChatAt || 0).getTime());
  const sortedEmployees = [...employees].filter((e) => `${e.name} ${e.role}`.toLowerCase().includes(query)).sort((l, r) => new Date(r.latestChatAt || 0).getTime() - new Date(l.latestChatAt || 0).getTime());

  const conversations = [
    ...sortedGroups.map((g) => ({ ...g, type: 'group' as const })),
    ...sortedEmployees.map((e) => ({ ...e, type: 'employee' as const })),
  ].filter((c) => activeFilter === 'all' || c.type === (activeFilter === 'groups' ? 'group' : 'employee')).sort((l, r) => new Date(r.latestChatAt || 0).getTime() - new Date(l.latestChatAt || 0).getTime());

  useEffect(() => {
    if (!selectedChatId) return;
    let active = true;
    const load = async () => {
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
      if (!message.isMine) markRead();
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

    const reloadSupport = () => {
      const leadIds = Array.from(new Set(messages.map((message) => parseWorkflow(message.content)?.leadId).filter(Boolean) as string[]));
      if (leadIds.length) {
        Promise.all(leadIds.map(async (leadId) => [leadId, await companyService.getRemoteSupport({ leadId })] as const))
          .then((results) => setRemoteSupportByLeadId(Object.fromEntries(results)))
          .catch(() => undefined);
      }
    };

    socket.on('support:created', reloadSupport);
    socket.on('support:accepted', reloadSupport);
    socket.on('support:rejected', reloadSupport);
    socket.on('support:completed', reloadSupport);
    socket.on('support:updated', reloadSupport);

    return () => {
      active = false;
      socket.emit('conversation:leave', selectedChatId);
      socket.off('connect', joinConversation);
      socket.off('message:new');
      socket.off('message:updated');
      socket.off('message:deleted');
      socket.off('message:read');
      socket.off('support:created', reloadSupport);
      socket.off('support:accepted', reloadSupport);
      socket.off('support:rejected', reloadSupport);
      socket.off('support:completed', reloadSupport);
      socket.off('support:updated', reloadSupport);
      socket.disconnect();
    };
  }, [selectedChatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  useEffect(() => {
    const loadSupportData = async () => {
      const leadIds = Array.from(new Set(messages.map((message) => parseWorkflow(message.content)?.leadId).filter(Boolean) as string[]));
      if (!leadIds.length) {
        setRemoteSupportByLeadId({});
        return;
      }
      try {
        const results = await Promise.all(leadIds.map(async (leadId) => {
          const records = await companyService.getRemoteSupport({ leadId });
          return [leadId, records] as const;
        }));
        setRemoteSupportByLeadId(Object.fromEntries(results));
      } catch {
        setRemoteSupportByLeadId({});
      }
    };
    void loadSupportData();
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

    if (shortcutLead && Object.values(shortcutLead).slice(0, 4).some((v) => !v)) {
      toast.error('Use format: Lead Name, Country, System, Contact No, Other Details');
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
        ? onSendLead ? await onSendLead(shortcutLead) : undefined
        : await onSendMessage();
      if (sentMessage?._id) {
        setMessages((current) => [
          ...current.filter((msg) => msg._id !== optimisticId && msg._id !== sentMessage._id),
          { ...sentMessage, isMine: true },
        ]);
        setMessageInput('');
      }
    } catch (error: any) {
      setMessages((current) => current.filter((msg) => msg._id !== optimisticId));
      toast.error(error.response?.data?.message || 'Unable to send message');
    }
  };

  const uploadAttachment = async (file: File, type: 'IMAGE' | 'FILE' | 'AUDIO') => {
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
      formData.append('conversationId', selectedChatId);
      formData.append('messageType', type);

      const response = await companyService.uploadConversationAttachment(selectedChatId, formData, (progressEvent) => {
        if (progressEvent.total) {
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      });
      setMessages((current) => [
        ...current.filter((msg) => msg._id !== optimisticId && msg._id !== response._id),
        { ...response, isMine: true },
      ]);
    } catch (error: any) {
      setMessages((current) => current.filter((msg) => msg._id !== optimisticId));
      toast.error(error.response?.data?.message || 'Unable to upload file');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const editMessage = async (messageId: string) => {
    if (!editingText.trim()) return;
    try {
      const updated = await companyService.updateMessage(messageId, editingText.trim());
      setMessages((current) => current.map((item) => item._id === messageId ? { ...item, ...updated } : item));
      setEditingId(null);
      setEditingText('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to edit message');
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await companyService.deleteMessage(messageId);
      setMessages((current) => current.filter((item) => item._id !== messageId));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to delete message');
    }
  };

  const parseWorkflow = (content?: string): LeadWorkflow | null => {
    if (!content) return null;
    try {
      const parsed = JSON.parse(content);
      return parsed?.type === 'lead-workflow' ? (parsed as LeadWorkflow) : null;
    } catch {
      return null;
    }
  };

  const getRemoteSupportForLead = (leadId?: string) => {
    if (!leadId) return [];
    return remoteSupportByLeadId[leadId] || [];
  };

  const updateWorkflow = async (message: ICompanyMessage, workflow: LeadWorkflow) => {
    const updated = await companyService.updateMessage(message._id, JSON.stringify(workflow));
    setMessages((current) => current.map((item) => item._id === message._id ? { ...item, ...updated } : item));
  };

  const actOnWorkflow = async (message: ICompanyMessage, workflow: LeadWorkflow, action: 'accept' | 'decline') => {
    try {
      if (action === 'decline') return await updateWorkflow(message, { ...workflow, status: 'declined' });
      if (action === 'accept') {
        const lead = await companyService.createLead({
          name: workflow.lead.name,
          country: workflow.lead.country,
          system: workflow.lead.system,
          contactNo: workflow.lead.contactNo,
          otherDetails: workflow.lead.otherDetails,
          connected: 'no',
          connectedBy: currentUserName,
          isSale: 'no',
          workflowMessageId: message._id,
        });

        if (lead && lead._id) {
          await companyService.acceptLead(lead._id);
        }

        toast.success('Lead accepted successfully! Access lead details in Today\'s Report.');
        return await updateWorkflow(message, {
          ...workflow,
          status: 'accepted',
          leadId: lead._id,
          acceptedBy: currentUserName,
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to update lead workflow');
    }
  };

  const saleMessageId = Object.keys(saleForms)[0];
  const saleMessage = saleMessageId ? messages.find((msg) => msg._id === saleMessageId) : undefined;
  const saleWorkflow = saleMessage ? parseWorkflow(saleMessage.content) : null;

  return (
    <div className="grid h-full grid-cols-1 overflow-hidden md:grid-cols-[340px_1fr] bg-slate-950 font-sans">
      {/* Sidebar Channels List */}
      <aside className="flex flex-col border-r border-slate-800/80 bg-slate-900/40">
        <div className="space-y-3 border-b border-slate-800/80 bg-slate-900/60 p-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">Workspace Chat</h2>
            {onCreateGroup && (
              <button aria-label="Create group" onClick={onCreateGroup} className="rounded-lg bg-indigo-600/20 p-1.5 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all">
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-950/60 px-2.5">
            <Search className="h-3.5 w-3.5 text-slate-500" />
            <input value={chatSearch} onChange={(e) => setChatSearch(e.target.value)} placeholder="Search chats" className="min-w-0 flex-1 bg-transparent py-2 text-xs text-white outline-none placeholder:text-slate-500" />
          </div>
          <div className="flex gap-1">
            {(['all', 'groups', 'employees'] as ChatFilter[]).map((filter) => (
              <button key={filter} onClick={() => setActiveFilter(filter)} className={`rounded-full px-3 py-1 text-[11px] capitalize transition-colors ${activeFilter === filter ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-800/60 text-slate-400 hover:text-white'}`}>
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 divide-y divide-slate-800/40 overflow-y-auto">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedChatId(conversation.id)}
              className={`flex w-full items-center gap-3 p-3.5 text-left transition-all ${selectedChatId === conversation.id ? 'border-l-4 border-emerald-500 bg-emerald-500/10' : 'hover:bg-slate-800/30'}`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center ${conversation.type === 'group' ? 'rounded-xl bg-indigo-600' : `rounded-full bg-gradient-to-tr ${conversation.avatarBg}`} text-white font-bold`}>
                {conversation.type === 'group' ? <Hash className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
              </div>
              <span className="min-w-0 flex-1">
                <b className="block truncate text-xs text-slate-200">{conversation.name}</b>
                <small className="text-[11px] text-slate-400">{conversation.type === 'group' ? conversation.description : conversation.role}</small>
              </span>
              {conversation.unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-slate-950 shadow-sm">
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* WhatsApp-Style Main Chat Area */}
      <section className="flex min-h-0 flex-col bg-slate-950">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900/80 p-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400 font-bold">
              {selectedGroup ? <Hash className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{title}</h2>
              <p className="text-[11px] text-slate-400">
                {selectedEmployee ? `${selectedEmployee.role} · Direct Chat` : 'Workspace Group'}
              </p>
            </div>
          </div>
        </header>

        {/* Messages Feed */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6 bg-slate-950/90">
          {messages.length ? (
            messages.map((message, index) => {
              const prevMsg = messages[index - 1];
              const currentDateLabel = formatMessageDateLabel(message.createdAt);
              const prevDateLabel = prevMsg ? formatMessageDateLabel(prevMsg.createdAt) : null;
              const showDateHeader = currentDateLabel !== prevDateLabel;

              return (
                <div key={`${message._id}-${index}`} className="space-y-3">
                  {showDateHeader && (
                    <div className="my-3 flex justify-center">
                      <span className="rounded-full bg-slate-800/80 px-3.5 py-1 text-[10px] font-semibold tracking-wide text-slate-300 shadow-sm border border-slate-700/50">
                        {currentDateLabel}
                      </span>
                    </div>
                  )}

                  <div className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`relative max-w-[85%] sm:max-w-[72%] rounded-2xl px-4 py-2.5 text-sm shadow-md transition-all ${
                        message.isMine
                          ? 'bg-emerald-800/90 text-slate-100 rounded-tr-none border border-emerald-700/50'
                          : 'bg-slate-900 text-slate-100 rounded-tl-none border border-slate-800'
                      }`}
                    >
                      {!message.isMine && selectedGroup && (
                        <p className="mb-1 text-[11px] font-bold text-emerald-400">{message.senderName || 'Workspace Member'}</p>
                      )}

                      {editingId === message._id ? (
                        <div className="flex gap-2">
                          <input autoFocus value={editingText} onChange={(e) => setEditingText(e.target.value)} className="rounded bg-slate-950 px-2 py-1 text-white text-xs" />
                          <button aria-label="Save" onClick={() => void editMessage(message._id)}><Check className="h-4 w-4 text-emerald-400" /></button>
                          <button aria-label="Cancel" onClick={() => setEditingId(null)}><X className="h-4 w-4 text-rose-400" /></button>
                        </div>
                      ) : (
                        <>
                          {(() => {
                            if (message.messageType && message.objectKey) {
                              return <ChatAttachmentPreview message={message} conversationId={selectedChatId} />;
                            }
                            const workflow = parseWorkflow(message.content);
                            if (!workflow) return <p className="whitespace-pre-wrap break-words">{message.content}</p>;

                            const supportRecords = getRemoteSupportForLead(workflow.leadId);
                            const latestSupport = supportRecords[0];
                            const supportBadge = latestSupport ? (
                              <div className="mt-2 rounded-xl border border-slate-700/80 bg-slate-950/80 p-2.5 text-[11px] text-slate-300">
                                <p className="font-semibold text-cyan-300 flex items-center justify-between">
                                  <span>Remote Support</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${latestSupport.status === 'SUCCESSFUL' ? 'bg-emerald-500/20 text-emerald-300' : latestSupport.status === 'FAILED' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                    {latestSupport.status}
                                  </span>
                                </p>
                                {latestSupport.techSupportEmployeeName && (
                                  <p className="mt-1">Assigned: {latestSupport.techSupportEmployeeName}</p>
                                )}
                                {latestSupport.failedReason && <p className="mt-1 text-rose-300">Reason: {latestSupport.failedReason}</p>}
                                {latestSupport.rejectedReason && <p className="mt-1 text-amber-300">Reason: {latestSupport.rejectedReason}</p>}
                              </div>
                            ) : null;

                            const isAccepted = workflow.status !== 'pending' && workflow.status !== 'declined';
                            const displayContact = isAccepted ? workflow.lead.contactNo : '**********';

                            return (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-amber-300 flex items-center gap-1.5">📌 Lead Record</p>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isAccepted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : workflow.status === 'declined' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                                    {isAccepted ? 'ACCEPTED' : workflow.status.toUpperCase()}
                                  </span>
                                </div>

                                <div className="text-xs space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                                  <p><span className="text-slate-400">Customer:</span> <strong className="text-white">{workflow.lead.name}</strong></p>
                                  <p><span className="text-slate-400">Country:</span> {workflow.lead.country}</p>
                                  <p><span className="text-slate-400">System:</span> {workflow.lead.system}</p>
                                  <p><span className="text-slate-400">Contact:</span> <strong className={isAccepted ? "text-emerald-400 font-mono" : "text-amber-400 font-mono tracking-widest"}>{displayContact}</strong></p>
                                  {workflow.lead.otherDetails && <p><span className="text-slate-400">Other Details:</span> {workflow.lead.otherDetails}</p>}
                                </div>

                                {workflow.status === 'pending' && !message.isMine && (
                                  <div className="flex gap-2 pt-1">
                                    <button onClick={() => void actOnWorkflow(message, workflow, 'accept')} className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-500 transition-all">Accept</button>
                                    <button onClick={() => void actOnWorkflow(message, workflow, 'decline')} className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-rose-500 transition-all">Decline</button>
                                  </div>
                                )}
                                {workflow.status === 'pending' && message.isMine && <p className="text-xs text-slate-400 italic">Awaiting Sales employee acceptance...</p>}
                                {workflow.status === 'declined' && <p className="font-semibold text-rose-400 text-xs">Declined</p>}
                                {isAccepted && (
                                  <div className="rounded-xl bg-emerald-950/40 p-2.5 border border-emerald-500/20 text-xs text-emerald-200">
                                    <p className="font-semibold text-emerald-400">✅ Accepted by {workflow.acceptedBy}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Manage lead workflow & updates from Today&apos;s Report.</p>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* WhatsApp Timestamp & Blue Tick */}
                          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-300/80">
                            <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {message.isEdited && <span>· edited</span>}
                            {message.isMine && (
                              message.isSeen ? (
                                <CheckCheck className="h-3.5 w-3.5 text-sky-400" aria-label="Seen" />
                              ) : (
                                <CheckCheck className="h-3.5 w-3.5 text-slate-400" aria-label="Delivered" />
                              )
                            )}
                          </div>

                          {message.isMine && (
                            <div className="absolute -right-2 -top-2">
                              <button aria-label="Options" onClick={() => setOpenMenuId((cur) => cur === message._id ? null : message._id)} className="rounded-full bg-slate-800 p-1 text-slate-300 shadow hover:bg-slate-700">
                                <MoreVertical className="h-3 w-3" />
                              </button>
                              {openMenuId === message._id && (
                                <div className="absolute right-0 top-7 z-10 w-28 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 py-1 text-xs shadow-xl">
                                  <button className="flex w-full items-center gap-2 px-3 py-2 text-slate-200 hover:bg-slate-800" onClick={() => { setEditingId(message._id); setEditingText(message.content); setOpenMenuId(null); }}><Pencil className="h-3 w-3" /> Edit</button>
                                  <button className="flex w-full items-center gap-2 px-3 py-2 text-rose-300 hover:bg-slate-800" onClick={() => { setOpenMenuId(null); void deleteMessage(message._id); }}><Trash2 className="h-3 w-3" /> Delete</button>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-sm text-slate-500 py-12">No messages yet. Start the conversation!</p>
          )}
          <div ref={bottomRef} />
        </div>



        {/* Lead Form Bar */}
        {showLeadForm && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!onSendLead) return;
              try {
                await onSendLead(leadForm);
                setLeadForm({ name: '', country: '', system: '', contactNo: '', otherDetails: '' });
                setShowLeadForm(false);
              } catch (error: any) {
                toast.error(error.response?.data?.message || 'Unable to send lead');
              }
            }}
            className="grid gap-2 border-t border-slate-800 bg-slate-900/80 p-4 sm:grid-cols-5"
          >
            {(['name', 'country', 'system', 'contactNo', 'otherDetails'] as const).map((key) => (
              <input key={key} required={key !== 'otherDetails'} placeholder={key === 'contactNo' ? 'Contact No' : key === 'otherDetails' ? 'Other Details' : key.replace(/([A-Z])/g, ' $1')} value={leadForm[key]} onChange={(e) => setLeadForm((cur) => ({ ...cur, [key]: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white" />
            ))}
            <button className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white sm:col-span-5">Send Lead</button>
          </form>
        )}

        {/* Message Input Box */}
        <div className="border-t border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-start gap-3">
            {onSendLead && selectedEmployee?.role === 'SALES' && (
              <button aria-label="Send lead" title="Send lead" onClick={() => setShowLeadForm((cur) => !cur)} className="rounded-xl bg-amber-600 px-3 py-2 text-white hover:bg-amber-500 transition-colors shadow">
                <UserPlus className="h-4 w-4" />
              </button>
            )}
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
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
