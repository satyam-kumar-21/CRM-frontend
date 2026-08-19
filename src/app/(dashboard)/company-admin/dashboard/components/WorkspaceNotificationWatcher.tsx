'use client';

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import type { ICompanyMessage, LeadWorkflow } from '@/services/companyService';

type WorkspaceNotificationWatcherProps = { dashboardPath: string; onMessage?: (message: ICompanyMessage) => void };

const getNotificationContent = (message: ICompanyMessage) => {
  try {
    const workflow = JSON.parse(message.content) as Partial<LeadWorkflow>;
    if (workflow.type !== 'lead-workflow' || !workflow.lead) return null;

    const lead = workflow.lead;
    const details = [lead.name, lead.country, lead.system].filter(Boolean).join(' · ');
    const contact = lead.contactNo ? `Contact: ${lead.contactNo}` : '';
    const status = workflow.status ? `Status: ${workflow.status}` : '';
    return {
      title: 'New lead from Company Admin',
      body: [details, contact, status].filter(Boolean).join(' · '),
    };
  } catch {
    return null;
  }
};

const playMelodyPipSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Pleasant WhatsApp / Slack style melody pip (E5 -> B5 chime)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.08); // B5
    gain2.gain.setValueAtTime(0.22, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  } catch (e) {
    console.error('Audio chime error:', e);
  }
};

const triggerDesktopNotification = (title: string, body: string, tag: string, onClickUrl?: string) => {
  playMelodyPipSound();

  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body,
        tag,
      });
      notification.onclick = () => {
        window.focus();
        if (onClickUrl) window.location.href = onClickUrl;
        notification.close();
      };
    } catch (e) {
      console.error('Desktop Notification error:', e);
    }
  }
};

export function WorkspaceNotificationWatcher({ dashboardPath, onMessage }: WorkspaceNotificationWatcherProps) {
  const onMessageRef = useRef(onMessage);
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        setShowPermissionBanner(true);
      }
    }

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: window.localStorage.getItem('companyAccessToken') || undefined },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    const refreshDashboards = () => {
      queryClient.refetchQueries({ queryKey: ['companyDashboard'] });
      queryClient.refetchQueries({ queryKey: ['employeeDashboard'] });
      queryClient.refetchQueries({ queryKey: ['remoteSupport'] });
      queryClient.refetchQueries({ queryKey: ['leads'] });
      queryClient.refetchQueries({ queryKey: ['sales'] });
    };

    const onSocketMessage = (message: ICompanyMessage) => {
      if (!message?._id || message.isMine) return;
      onMessageRef.current?.(message);

      const notificationContent = getNotificationContent(message);
      const title = notificationContent?.title || message.senderName || 'New workspace message';
      const rawBody = notificationContent?.body || message.content;
      const body = rawBody.length > 120 ? `${rawBody.slice(0, 117)}...` : rawBody;

      toast.info(title, { description: body, duration: 5000 });
      refreshDashboards();

      const key = `crm-msg-${message._id}`;
      triggerDesktopNotification(title, body, key, `${dashboardPath}?section=chat&conversation=${message.conversationId || message.groupId || ''}`);
    };

    socket.on('message:new', onSocketMessage);

    socket.on('support:created', (payload: any) => {
      refreshDashboards();
      const title = '🚨 New Tech Support Request';
      const body = `Customer: ${payload.customerName || 'Lead'} · System: ${payload.system || 'N/A'}`;
      toast.info(title, { description: body });
      triggerDesktopNotification(title, body, `supp-created-${payload._id || Date.now()}`, `${dashboardPath}?section=remote-support`);
    });

    socket.on('support:accepted', (payload: any) => {
      refreshDashboards();
      const title = '✅ Tech Support Accepted';
      const body = `Assigned to ${payload.techSupportEmployeeName || 'Tech Support'}`;
      toast.success(title, { description: body });
      triggerDesktopNotification(title, body, `supp-acc-${payload._id || Date.now()}`, `${dashboardPath}?section=remote-support`);
    });

    socket.on('support:rejected', (payload: any) => {
      refreshDashboards();
      const title = '❌ Tech Support Rejected';
      const body = `Reason: ${payload.rejectedReason || 'N/A'}`;
      toast.error(title, { description: body });
      triggerDesktopNotification(title, body, `supp-rej-${payload._id || Date.now()}`, `${dashboardPath}?section=remote-support`);
    });

    socket.on('support:completed', (payload: any) => {
      refreshDashboards();
      const isSuccess = payload.status === 'SUCCESSFUL';
      const title = isSuccess ? '✅ Tech Support Completed Successfully' : '❌ Tech Support Failed';
      const body = isSuccess ? `Completed by ${payload.techSupportEmployeeName || 'Tech Support'}` : `Reason: ${payload.failedReason || 'N/A'}`;
      if (isSuccess) toast.success(title, { description: body });
      else toast.error(title, { description: body });
      triggerDesktopNotification(title, body, `supp-comp-${payload._id || Date.now()}`, `${dashboardPath}?section=remote-support`);
    });

    socket.on('support:updated', () => refreshDashboards());

    socket.on('companyNameUpdated', () => {
      refreshDashboards();
      toast.success('Company name updated');
    });

    socket.on('employeeLoginDisabled', (payload: any) => {
      window.localStorage.removeItem('companyAccessToken');
      toast.error(payload?.message || 'Your access has been disabled by Admin.');
      router.replace('/company-admin/login');
    });

    socket.on('employeeLoginEnabled', (payload: any) => {
      toast.success(payload?.message || 'Employee login enabled');
    });

    socket.on('permissionsUpdated', () => {
      refreshDashboards();
      toast.info('Permissions updated');
    });

    socket.on('holidaysUpdated', () => {
      queryClient.refetchQueries({ queryKey: ['attendance'] });
      toast.success('Holidays updated');
    });

    socket.on('connect_error', () => {
      toast.error('Chat connection lost. Reconnecting...');
    });

    return () => {
      socket.off('message:new', onSocketMessage);
      socket.off('support:created');
      socket.off('support:accepted');
      socket.off('support:rejected');
      socket.off('support:completed');
      socket.off('support:updated');
      socket.disconnect();
    };
  }, [dashboardPath, queryClient, router]);

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        toast.success('Windows Desktop Notifications enabled!');
        setShowPermissionBanner(false);
        triggerDesktopNotification('Notifications Active', 'You will receive Windows desktop notifications for new messages and support tickets.', 'test-notif');
      } else {
        toast.error('Desktop notifications blocked in browser settings.');
        setShowPermissionBanner(false);
      }
    }
  };

  if (!showPermissionBanner) return null;

  return (
    <div className="bg-indigo-600 px-4 py-2 text-white flex items-center justify-between text-xs font-medium shadow-md">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 animate-bounce" />
        <span>Enable Windows Desktop Notifications to get real-time popups like WhatsApp.</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={requestPermission} className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors shadow">
          Allow Notifications
        </button>
        <button onClick={() => setShowPermissionBanner(false)} className="text-indigo-200 hover:text-white px-1">
          ✕
        </button>
      </div>
    </div>
  );
}
