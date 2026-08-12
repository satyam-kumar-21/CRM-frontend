'use client';

import { useEffect, useState } from 'react';
import { Download, Image, Loader2, Play, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { companyService, type ICompanyMessage } from '@/services/companyService';

const formatBytes = (bytes = 0) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

interface ChatAttachmentPreviewProps {
  message: ICompanyMessage;
  conversationId: string;
}

export function ChatAttachmentPreview({ message, conversationId }: ChatAttachmentPreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadAttachment = async () => {
    try {
      setDownloading(true);
      const blob = await companyService.downloadConversationAttachment(conversationId, message._id);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = message.fileName || message.content;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      toast.success('Attachment downloaded successfully.');
    } catch {
      setError('Unable to download attachment');
      toast.error('Unable to download attachment.');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!message.objectKey) return;
    let active = true;
    setLoading(true);
    setError(null);
    companyService.getAttachmentUrl(conversationId, message._id)
      .then((fetchedUrl) => { if (!active) return; setUrl(fetchedUrl); })
      .catch(() => { if (!active) return; setError('Unable to load attachment'); })
      .finally(() => { if (!active) return; setLoading(false); });
    return () => { active = false; };
  }, [conversationId, message._id, message.objectKey]);

  if (!message.objectKey) return <p>{message.content}</p>;
  if (loading) return <p className="text-sm text-slate-400">Loading attachment…</p>;
  if (error) return <p className="text-sm text-rose-400">{error}</p>;

  const fileName = message.fileName || message.content;
  const type = message.messageType || 'FILE';

  if (type === 'IMAGE') {
    return url ? (
      <div className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-left shadow-sm transition hover:border-indigo-600">
        <img src={url} alt={fileName} className="w-full max-h-48 object-cover transition duration-200 group-hover:opacity-90" />
        <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-slate-300">
          <span className="truncate">{fileName}</span>
          <span>{formatBytes(message.fileSize)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-800 px-3 py-2">
          <span className="text-[11px] text-slate-400">Image</span>
          <button type="button" onClick={downloadAttachment} className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-2.5 py-1 text-xs text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60" disabled={downloading}>
            {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} {downloading ? 'Downloading...' : 'Download'}
          </button>
        </div>
      </div>
    ) : <p className="text-sm text-slate-400">Image unavailable</p>;
  }

  if (type === 'AUDIO') {
    return url ? (
      <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-slate-200"><Play className="h-4 w-4" /> Voice message</span>
          <span className="text-xs text-slate-400">{message.duration ? `${Math.floor(message.duration / 60)}:${String(message.duration % 60).padStart(2, '0')}` : formatBytes(message.fileSize)}</span>
        </div>
        <audio controls src={url} className="w-full rounded-xl bg-slate-900" preload="none" />
        <div className="flex justify-end pt-2">
          <button type="button" onClick={downloadAttachment} className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-2.5 py-1 text-xs text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60" disabled={downloading}>
            {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} {downloading ? 'Downloading...' : 'Download'}
          </button>
        </div>
      </div>
    ) : <p className="text-sm text-slate-400">Audio unavailable</p>;
  }

  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-200 hover:border-indigo-600">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-slate-200">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{fileName}</p>
        <p className="text-xs text-slate-400">{formatBytes(message.fileSize)}</p>
      </div>
      <button
        type="button"
        onClick={downloadAttachment}
        disabled={downloading}
        className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-2.5 py-1 text-xs text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} {downloading ? 'Downloading...' : 'Download'}
      </button>
    </div>
  );
}
