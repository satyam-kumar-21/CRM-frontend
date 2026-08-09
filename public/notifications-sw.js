self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const dashboardPath = event.notification.data?.dashboardPath || '/employee/dashboard?section=chat';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => 'focus' in client);
      if (existing) {
        return existing.focus().then(() => existing.navigate(dashboardPath));
      }
      return self.clients.openWindow(dashboardPath);
    })
  );
});
