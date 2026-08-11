'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { companyService, IAnnouncement } from '@/services/companyService';

export function AnnouncementsSection({ readOnly = false }: { readOnly?: boolean }) {
  const [items, setItems] = useState<IAnnouncement[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const load = async () => {
    try {
      const data = await companyService.getAnnouncements();
      setItems(data);
    } catch {
      toast.error('Unable to load announcements');
    }
  };

  useEffect(() => { void load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const item = await companyService.createAnnouncement({ title, content });
      setItems((cur) => [item, ...cur]);
      setTitle(''); setContent('');
      toast.success('Announcement published');
    } catch {
      toast.error('Unable to publish announcement');
    }
  };

  const remove = async (id: string) => {
    try {
      await companyService.deleteAnnouncement(id);
      setItems((cur) => cur.filter((it) => it._id !== id));
    } catch {
      toast.error('Unable to delete announcement');
    }
  };

  const markRead = async (id: string) => {
    try {
      await companyService.markAnnouncementRead(id);
      setItems((cur) => cur.map((it) => it._id === id ? { ...it, isRead: true } : it));
    } catch {
      toast.error('Unable to mark announcement as read');
    }
  };

  return (
    <section className="min-h-full space-y-5 overflow-y-auto bg-slate-950 p-6 text-slate-100">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white"><Bell className="h-6 w-6 text-amber-400" /> Announcements</h1>
        <p className="text-sm text-slate-400">{readOnly ? 'Company announcements.' : 'Publish messages that remain visible to employees until deleted.'}</p>
      </header>

      {!readOnly && (
        <form onSubmit={create} className="grid gap-3 rounded-xl border border-indigo-500/30 bg-slate-900 p-4">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          <textarea required value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write announcement..." className="min-h-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          <button className="flex w-fit items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-4 w-4" />Publish</button>
        </form>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <article key={item._id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-white">{item.title}</h2>
                  {item.isRead === false ? <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-300">Unread</span> : <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-400">Read</span>}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{item.content}</p>
                <time className="mt-3 block text-[11px] text-slate-500">{new Date(item.createdAt).toLocaleString()}</time>
              </div>
              <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                {item.isRead === false && <button type="button" onClick={() => void markRead(item._id)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white">Mark as read</button>}
                {!readOnly && <button type="button" title="Delete announcement" onClick={() => void remove(item._id)} className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white">Delete</button>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
