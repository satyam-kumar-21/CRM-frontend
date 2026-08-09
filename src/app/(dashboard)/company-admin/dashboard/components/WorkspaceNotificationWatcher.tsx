'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import type { ICompanyMessage } from '@/services/companyService';

type WorkspaceNotificationWatcherProps = { dashboardPath: string; onMessage?: (message: ICompanyMessage) => void };

export function WorkspaceNotificationWatcher({ dashboardPath, onMessage }: WorkspaceNotificationWatcherProps) {
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: window.localStorage.getItem('companyAccessToken') || undefined },
      withCredentials: true,
    });
    const onSocketMessage = (message: ICompanyMessage) => {
      if (!message?._id || message.isMine) return;
      onMessage?.(message);
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const key = `crm-notified-message:${message._id}`;
      if (window.localStorage.getItem(key)) return;
      window.localStorage.setItem(key, '1');
      const title = message.senderName || 'New workspace message';
      const body = message.content.length > 120 ? `${message.content.slice(0, 117)}...` : message.content;
      const notification = new Notification(title, { body, tag: key, requireInteraction: true });
      notification.onclick = () => { window.focus(); window.location.href = `${dashboardPath}?section=chat&conversation=${message.conversationId || message.groupId || ''}`; notification.close(); };
    };
    socket.on('message:new', onSocketMessage);
    if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission();
    return () => { socket.off('message:new', onSocketMessage); socket.disconnect(); };
  }, [dashboardPath, onMessage]);
  return null;
}
