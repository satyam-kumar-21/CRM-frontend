'use client';

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { ICompanyMessage } from '@/services/companyService';

type WorkspaceNotificationWatcherProps = { dashboardPath: string; onMessage?: (message: ICompanyMessage) => void };

export function WorkspaceNotificationWatcher({ dashboardPath, onMessage }: WorkspaceNotificationWatcherProps) {
  const onMessageRef = useRef(onMessage);
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: window.localStorage.getItem('companyAccessToken') || undefined },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });
    const onSocketMessage = async (message: ICompanyMessage) => {
      if (!message?._id || message.isMine) return;
      onMessageRef.current?.(message);
      const title = message.senderName || 'New workspace message';
      const body = message.content.length > 120 ? `${message.content.slice(0, 117)}...` : message.content;
      toast.info(title, { description: body, duration: 5000 });
      if (!('Notification' in window)) return;
      const key = `crm-notified-message:${message._id}`;
      if (window.localStorage.getItem(key)) return;
      const permission = Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;
      if (permission !== 'granted') return;
      window.localStorage.setItem(key, '1');
      const notification = new Notification(title, { body, tag: key, requireInteraction: true });
      notification.onclick = () => { window.focus(); window.location.href = `${dashboardPath}?section=chat&conversation=${message.conversationId || message.groupId || ''}`; notification.close(); };
    };
    socket.on('message:new', onSocketMessage);
    socket.on('companyNameUpdated', (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['companyDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['employeeDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['companySettings'] });
      toast.success('Company name updated');
    });
    socket.on('employeeLoginDisabled', (payload: any) => {
      // Force logout on client
      window.localStorage.removeItem('companyAccessToken');
      toast.error(payload?.message || 'Your access has been disabled by Admin.');
      router.replace('/company-admin/login');
    });
    socket.on('employeeLoginEnabled', (payload: any) => {
      toast.success(payload?.message || 'Employee login enabled');
    });
    socket.on('permissionsUpdated', (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['companyDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['employeeDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['companySettings'] });
      toast.info('Permissions updated');
    });
    socket.on('holidaysUpdated', (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Holidays updated');
    });
    socket.on('connect_error', () => toast.error('Chat connection lost. Reconnecting...'));
    if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission();
    return () => { socket.off('message:new', onSocketMessage); socket.disconnect(); };
  }, [dashboardPath]);
  return null;
}
