'use client';

import { useEffect, useState } from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { companyService, IAnnouncement } from '@/services/companyService';

export function AnnouncementsSection({ readOnly = false }: { readOnly?: boolean }) {
  const [items, setItems] = useState<IAnnouncement[]>([]); const [title, setTitle] = useState(''); const [content, setContent] = useState('');
  const load = () => companyService.getAnnouncements().then(setItems).catch(() => toast.error('Unable to load announcements'));
  useEffect(() => { void load(); }, []);
  const create = async (event: React.FormEvent) => { event.preventDefault(); try { const item = await companyService.createAnnouncement({ title, content }); setItems((current) => [item, ...current]); setTitle(''); setContent(''); toast.success('Announcement published'); } catch { toast.error('Unable to publish announcement'); } };
  const remove = async (id: string) => { try { await companyService.deleteAnnouncement(id); setItems((current) => current.filter((item) => item._id !== id)); } catch { toast.error('Unable to delete announcement'); } };
  return <section className="min-h-full space-y-5 overflow-y-auto bg-slate-950 p-6 text-slate-100"><header className="border-b border-slate-800 pb-4"><h1 className="flex items-center gap-2 text-2xl font-bold text-white"><Bell className="h-6 w-6 text-amber-400" /> Announcements</h1><p className="text-sm text-slate-400">{readOnly ? 'Company announcements.' : 'Publish messages that remain visible to employees until deleted.'}</p></header>{!readOnly && <form onSubmit={create} className="grid gap-3 rounded-xl border border-indigo-500/30 bg-slate-900 p-4"><input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Announcement title" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /><textarea required value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write announcement..." className="min-h-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /><button className="flex w-fit items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-4 w-4" />Publish</button></form>}<div className="space-y-3">{items.map((item) => <article key={item._id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-white">{item.title}</h2><p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{item.content}</p><time className="mt-3 block text-[11px] text-slate-500">{new Date(item.createdAt).toLocaleString()}</time></div>{!readOnly && <button title="Delete announcement" onClick={() => void remove(item._id)} className="text-rose-400"><Trash2 className="h-4 w-4" /></button>}</div></article>)}</div></section>;
}
