'use client';

import { useEffect } from 'react';
import { companyService, ICompanyMessage } from '@/services/companyService';

type WorkspaceNotificationWatcherProps = {
  dashboardPath: string;
};

export function WorkspaceNotificationWatcher({ dashboardPath }: WorkspaceNotificationWatcherProps) {
  useEffect(() => {
    let active = true;
    let knownMessageIds = new Set<string>();
    let initialized = false;

    const openWorkspace = () => {
      const existing = window.open('', '_self');
      if (existing) {
        existing.location.href = `${dashboardPath}?section=chat`;
        existing.focus();
      } else {
        window.open(dashboardPath, '_blank', 'noopener,noreferrer');
      }
    };

    const showNotification = async (message: ICompanyMessage) => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const claimKey = `crm-notified-message:${message._id}`;
      if (window.localStorage.getItem(claimKey)) return;
      window.localStorage.setItem(claimKey, '1');
      const title = message.senderName || 'New workspace message';
      const body = message.content.length > 120 ? `${message.content.slice(0, 117)}...` : message.content;
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          tag: claimKey,
          requireInteraction: true,
          actions: [{ action: 'open', title: 'Open workspace' }],
          data: { dashboardPath: `${dashboardPath}?section=chat` },
        } as NotificationOptions);
      } catch {
        const notification = new Notification(title, { body, tag: claimKey, requireInteraction: true });
        notification.onclick = openWorkspace;
      }
    };

    const poll = async () => {
      try {
        const dashboard = await companyService.getDashboard();
        if (!active) return;
        const messages = dashboard.recentMessages || [];
        if (!initialized) {
          knownMessageIds = new Set(messages.map((message) => message._id));
          initialized = true;
          return;
        }
        const incoming = messages.filter((message) => !knownMessageIds.has(message._id) && !message.isMine);
        knownMessageIds = new Set(messages.map((message) => message._id));
        for (const message of incoming.slice(-3)) await showNotification(message);
      } catch {
        // Dashboard polling must never interrupt the active workspace.
      }
    };

    if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission();
    if ('serviceWorker' in navigator) void navigator.serviceWorker.register('/notifications-sw.js');
    void poll();
    const timer = window.setInterval(() => void poll(), 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, [dashboardPath]);

  return null;
}
