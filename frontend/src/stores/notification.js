import { defineStore } from 'pinia';
import notificationService from '../services/notificationService';
import pushSubscriptionService from '../services/pushSubscriptionService';
import { useAuthStore } from './auth';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    socket: null,
    reconnectTimeout: null,
    reconnectDelay: 2000,
    currentPage: 0,
    hasMore: false,
    activeToast: null,
    toastTimeout: null,
  }),
  actions: {
    async fetchNotifications(page = 0, size = 10, append = false) {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) return;
      
      this.loading = true;
      try {
        const response = await notificationService.getNotifications(page, size);
        const newNotifs = response.data.content || [];
        if (append) {
          const existingIds = new Set(this.notifications.map(n => n.id));
          const filteredNewNotifs = newNotifs.filter(n => !existingIds.has(n.id));
          this.notifications = [...this.notifications, ...filteredNewNotifs];
        } else {
          this.notifications = newNotifs;
        }
        this.currentPage = page;
        this.hasMore = !response.data.last;
      } catch (error) {
      } finally {
        this.loading = false;
      }
    },
    async fetchUnreadCount() {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) return;

      try {
        const response = await notificationService.getUnreadCount();
        this.unreadCount = response.data;
      } catch (error) {
      }
    },
    async markAsRead(id) {
      try {
        await notificationService.markAsRead(id);
        const index = this.notifications.findIndex(n => n.id === id);
        if (index !== -1 && !this.notifications[index].isRead) {
          this.notifications[index].isRead = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
      } catch (error) {
      }
    },
    async markAllAsRead() {
      try {
        await notificationService.markAllAsRead();
        this.notifications.forEach(n => {
          n.isRead = true;
        });
        this.unreadCount = 0;
      } catch (error) {
      }
    },
    connectWebSocket() {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated || !authStore.token) return;

      // Tránh tạo kết nối lặp nếu đã mở hoặc đang kết nối
      if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
        return;
      }

      // Xóa các timeout kết nối lại trước đó
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      // Tải dữ liệu ban đầu
      this.fetchUnreadCount();
      this.fetchNotifications(0, 10);

      // Khởi tạo thông báo đẩy chạy ngầm (Web Push)
      this.initPushNotifications();

      // Xác định URL WebSocket
      let apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        const host = window.location.hostname;
        apiUrl = `http://${host}:8080`;
      }
      
      // Thay thế http bằng ws, https bằng wss
      const wsUrl = apiUrl.replace(/^http/, 'ws') + '/ws/notifications?token=' + authStore.token;

      logWebSocket('Đang kết nối WebSocket đến: ' + wsUrl.split('?')[0]);
      
      const socket = new WebSocket(wsUrl);
      this.socket = socket;

      socket.onopen = () => {
        logWebSocket('Kết nối WebSocket thành công.');
        this.reconnectDelay = 2000; // Reset độ trễ reconnection
      };

      socket.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          logWebSocket('Nhận thông báo mới từ WebSocket:', notification);
          
          // Thêm thông báo mới vào đầu danh sách nếu chưa tồn tại
          const exists = this.notifications.some(n => n.id === notification.id);
          if (!exists) {
            this.notifications.unshift(notification);
            this.unreadCount++;
            
            // Kiểm tra quyền thông báo để quyết định hiển thị Native hoặc Toast Popup
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              this.showNativeNotification(notification);
            } else {
              // Hiển thị Toast Popup trên màn hình (dự phòng)
              this.activeToast = notification;
              if (this.toastTimeout) {
                clearTimeout(this.toastTimeout);
              }
              this.toastTimeout = setTimeout(() => {
                this.activeToast = null;
              }, 6000); // Tự động ẩn sau 6 giây
            }
            
            // Phát âm báo hiệu
            this.playNotificationSound();
          }
        } catch (e) {
        }
      };

      socket.onerror = (error) => {
      };

      socket.onclose = (event) => {
        logWebSocket(`Kết nối WebSocket đã bị đóng. Code: ${event.code}, Lý do: ${event.reason}`);
        this.socket = null;

        // Nếu người dùng vẫn đăng nhập thì tự động reconnect với cơ chế exponential backoff
        if (authStore.isAuthenticated) {
          logWebSocket(`Sẽ thử kết nối lại sau ${this.reconnectDelay}ms...`);
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Tối đa 30 giây
            this.connectWebSocket();
          }, this.reconnectDelay);
        }
      };
    },
    disconnectWebSocket() {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
      logWebSocket('Đã đóng kết nối WebSocket.');
    },
    startPolling() {
      this.connectWebSocket();
    },
    stopPolling() {
      this.disconnectWebSocket();
    },
    playNotificationSound() {
      try {
        const audio = new Audio('/assets/sounds/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Bỏ qua lỗi tự động phát âm thanh bị trình duyệt chặn
        });
      } catch (e) {
        // Bỏ qua lỗi nạp âm thanh
      }
    },
    async initPushNotifications() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        logWebSocket('Web Push Notifications không được hỗ trợ trên trình duyệt này.');
        return;
      }

      try {
        // Đăng ký Service Worker sw.js
        const registration = await navigator.serviceWorker.register('/sw.js');
        logWebSocket('Service Worker đăng ký thành công:', registration);

        // Lấy VAPID public key từ Backend
        const keyResponse = await pushSubscriptionService.getPublicKey();
        const vapidPublicKey = keyResponse.data.publicKey;
        if (!vapidPublicKey) {
          logWebSocket('Không lấy được VAPID public key từ Backend.');
          return;
        }

        // Yêu cầu quyền thông báo
        let permission = Notification.permission;
        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }

        if (permission !== 'granted') {
          logWebSocket('Người dùng từ chối quyền thông báo.');
          return;
        }

        // Đăng ký/Lấy Subscription từ PushManager
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        });

        // Gửi subscription lên Backend
        const subJson = subscription.toJSON();
        const p256dh = subJson.keys ? subJson.keys.p256dh : '';
        const auth = subJson.keys ? subJson.keys.auth : '';

        await pushSubscriptionService.subscribe({
          endpoint: subscription.endpoint,
          p256dh: p256dh,
          auth: auth
        });
        
        logWebSocket('Thiết lập Web Push Notification thành công.');
      } catch (error) {
        logWebSocket('Lỗi thiết lập Web Push Notification:', error);
      }
    },
    async showNativeNotification(notification) {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

      try {
        const registration = await navigator.serviceWorker.ready.catch(() => null);
        const subscription = registration ? await registration.pushManager.getSubscription().catch(() => null) : null;
        const isPushActive = !!subscription;

        // Nếu Web Push đang hoạt động, Service Worker đã nhận và tự hiển thị push notification.
        // Ta chỉ hiển thị từ client khi Web Push không hoạt động (lỗi hoặc chưa đăng ký).
        if (!isPushActive) {
          let url = '/';
          if (notification.type) {
            switch (notification.type) {
              case "CHAT_MESSAGE":
                url = useAuthStore().role === "LANDLORD" ? "/landlord/chat" : "/tenant/chat";
                break;
              case "INVOICE_NEW":
              case "PAYMENT_CONFIRMED":
              case "PAYMENT_REMINDER":
              case "PAYMENT_REPORTED":
                url = useAuthStore().role === "LANDLORD" 
                  ? (notification.referenceId ? `/landlord/invoices/detail/${notification.referenceId}` : "/landlord/invoices")
                  : (notification.referenceId ? `/tenant/invoices/detail/${notification.referenceId}` : "/tenant/invoices");
                break;
              case "CONTRACT_ACTIVE":
                url = useAuthStore().role === "LANDLORD"
                  ? (notification.referenceId ? `/landlord/contracts/detail/${notification.referenceId}` : "/landlord/contracts")
                  : (notification.referenceId ? `/tenant/contracts/detail/${notification.referenceId}` : "/tenant/contracts");
                break;
              case "SUBSCRIPTION_REQUEST":
                if (useAuthStore().role === "ADMIN") {
                  url = "/admin/landlords";
                }
                break;
            }
          }

          if (registration && 'showNotification' in registration) {
            registration.showNotification(notification.title || 'Thông báo mới', {
              body: notification.content || notification.body || '',
              icon: '/logo.ico',
              badge: '/favicon.svg',
              data: { url: url }
            });
          }
        }
      } catch (e) {
        console.error('Lỗi hiển thị Native Notification:', e);
      }
    }
  }
});

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function logWebSocket(...args) {
  if (import.meta.env.DEV) {
    console.log('[WebSocket Notifications]', ...args);
  }
}
