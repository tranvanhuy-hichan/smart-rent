// Service Worker for Smart Rent PWA Notifications
self.addEventListener('push', function(event) {
  if (!event.data) {
    console.log('[Service Worker] Push event received with no data.');
    return;
  }

  let data = {};
  try {
    data = event.data.json();
  } catch (err) {
    console.warn('[Service Worker] Push data is not JSON:', event.data.text());
    data = {
      title: 'Thông báo mới',
      body: event.data.text()
    };
  }

  const title = data.title || 'Smart Rent';
  const options = {
    body: data.body || '',
    icon: data.icon || '/logo.ico',
    badge: data.badge || '/favicon.svg',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    // Trình duyệt hỗ trợ thì sẽ phát âm thanh tùy chỉnh, ngược lại phát âm mặc định hệ điều hành
    sound: data.sound || '/assets/sounds/notification.mp3',
    actions: [
      { action: 'open', title: 'Xem chi tiết' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked.');
  event.notification.close();

  const urlToOpen = event.notification.data ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Tìm xem có tab nào đang mở sẵn trang web không
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(location.host) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }
      // Nếu không tìm thấy, mở tab mới
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
