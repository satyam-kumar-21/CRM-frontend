'use client';

import { useMemo, useRef, useState } from 'react';
import { FilePlus, ImagePlus, Mic2, Paperclip, Send, X } from 'lucide-react';
import { toast } from 'sonner';

export type AttachmentType = 'IMAGE' | 'FILE' | 'DOCUMENT';

const acceptedFileTypes = {
  image: 'image/jpeg,image/jpg,image/png,image/webp,image/gif',
  document: '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.ppt,.pptx',
  file: 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.ppt,.pptx,.webm,.ogg,.mp4,.mp3',
};

interface ChatAttachmentInputProps {
  isDisabled?: boolean;
  onSendText: () => void;
  onFileSelected: (file: File, type: 'IMAGE' | 'FILE' | 'AUDIO', duration?: number) => void;
  messageInput: string;
  setMessageInput: (value: string) => void;
}

export function ChatAttachmentInput({ isDisabled, onSendText, onFileSelected, messageInput, setMessageInput }: ChatAttachmentInputProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  const recordingLabel = useMemo(() => {
    const minutes = Math.floor(recordingTime / 60).toString().padStart(2, '0');
    const seconds = (recordingTime % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [recordingTime]);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Audio recording is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType });
        setRecordedBlob(blob);
        if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
        setRecordingTime(0);
        setIsRecording(false);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      recordingTimerRef.current = window.setInterval(() => setRecordingTime((current) => current + 1), 1000);
    } catch (error) {
      toast.error('Unable to start recording. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  };

  const cancelRecording = () => {
    stopRecording();
    setRecordedBlob(null);
    setRecordingTime(0);
    setIsRecording(false);
  };

  const sendRecording = () => {
    if (!recordedBlob) return;
    const file = new File([recordedBlob], `voice-${Date.now()}.webm`, { type: recordedBlob.type || 'audio/webm' });
    onFileSelected(file, 'AUDIO', recordingTime);
    setRecordedBlob(null);
    setRecordingTime(0);
  };

  const handleAttachmentClick = () => setMenuOpen((current) => !current);
  const handleSelectImage = () => { setMenuOpen(false); fileInputRef.current?.setAttribute('accept', acceptedFileTypes.image); fileInputRef.current?.click(); };
  const handleSelectDocument = () => { setMenuOpen(false); fileInputRef.current?.setAttribute('accept', acceptedFileTypes.document); fileInputRef.current?.click(); };
  const handleSelectFile = () => { setMenuOpen(false); fileInputRef.current?.setAttribute('accept', acceptedFileTypes.file); fileInputRef.current?.click(); };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('image/') ? 'IMAGE' : file.type.startsWith('audio/') ? 'AUDIO' : 'FILE';
    onFileSelected(file, type);
    event.target.value = '';
  };

  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onFileSelected(file, 'AUDIO');
    event.target.value = '';
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2.5">
        <button type="button" aria-label="Add attachment" onClick={handleAttachmentClick} className="rounded-full bg-slate-800 p-2 text-slate-200 shadow-sm hover:bg-slate-700">
          <Paperclip className="h-4 w-4" />
        </button>
        <div className="relative flex-1">
          <input value={messageInput} onChange={(event) => setMessageInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onSendText(); } }} placeholder="Type a message" className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500" disabled={isDisabled} />
          {menuOpen && (
            <div className="absolute left-0 bottom-full mb-2 w-56 rounded-2xl border border-slate-700 bg-slate-950 p-2 shadow-xl z-50">
              <button type="button" onClick={handleSelectImage} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white hover:bg-slate-900">
                <ImagePlus className="h-4 w-4" /> Photos & Videos
              </button>
              <button type="button" onClick={handleSelectDocument} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white hover:bg-slate-900">
                <FilePlus className="h-4 w-4" /> Document
              </button>
              <button type="button" onClick={handleSelectFile} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white hover:bg-slate-900">
                <FilePlus className="h-4 w-4" /> File
              </button>
            </div>
          )}
        </div>
        <button type="button" aria-label="Record voice" onClick={() => { if (isRecording) return; startRecording(); }} className="rounded-full bg-slate-800 p-2 text-slate-200 hover:bg-slate-700">
          <Mic2 className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Send message" onClick={onSendText} className="rounded-full bg-indigo-600 p-2 text-white hover:bg-indigo-500">
          <Send className="h-4 w-4" />
        </button>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      <input type="file" ref={audioInputRef} accept="audio/*" onChange={handleAudioFileChange} className="hidden" />
      {isRecording && (
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-rose-500 bg-rose-950/80 px-4 py-3 text-sm text-white">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-3.5 w-3.5 animate-pulse rounded-full bg-rose-500" />
            <span>Recording • {recordingLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={cancelRecording} className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-200 hover:bg-slate-700">Cancel</button>
            <button type="button" onClick={stopRecording} className="rounded-lg bg-rose-600 px-3 py-1 text-xs text-white hover:bg-rose-500">Stop</button>
          </div>
        </div>
      )}
      {recordedBlob && (
        <div className="mt-3 rounded-2xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /> Voice message ready
            </div>
            <button type="button" onClick={sendRecording} className="rounded-xl bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-500">Send</button>
          </div>
          <p className="mt-2 text-xs text-slate-400">Recorded audio will be uploaded securely when sent.</p>
        </div>
      )}
    </div>
  );
}
