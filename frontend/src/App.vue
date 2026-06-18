<template>
  <div v-if="isGuest" class="h-[100dvh] w-screen overflow-y-auto bg-bg-main">
    <router-view />
  </div>
  <div v-else class="flex h-screen h-[100dvh] overflow-hidden bg-bg-main">
    <Sidebar />
    <div class="flex flex-col flex-1 min-w-0">
      <!-- Status Bar Spacer on Mobile -->
      <div 
        class="lg:hidden w-full shrink-0 bg-bg-main" 
        :style="{ height: 'env(safe-area-inset-top, 20px)' }"
      ></div>
      <Header v-if="!isHeaderHidden" />
      <main
        ref="mainRef"
        class="flex-1 p-0 flex flex-col justify-between relative lg:rounded-2xl"
        :class="[
          isMainScrollDisabled ? 'overflow-hidden animate-fade-in' : 'overflow-y-auto',
          isHeaderInitiallyVisible ? 'pt-[4.5rem] lg:pt-0' : 'pt-2 lg:pt-0'
        ]"
        @touchstart.passive="onTouchStart"
        @touchmove.passive="onTouchMove"
        @touchend="onTouchEnd"
      >
        <!-- Pull to Refresh Indicator -->
        <div
          v-if="pullDistance > 0"
          class="flex items-center justify-center shrink-0 overflow-hidden transition-all duration-150"
          :style="{ height: Math.min(pullDistance, 70) + 'px' }"
        >
          <div class="flex items-center gap-2 text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="2.5"
              class="w-4 h-4 transition-transform duration-200"
              :class="{ 'rotate-180': pullDistance >= pullThreshold }"
              :style="{ transform: pullDistance < pullThreshold ? `rotate(${pullDistance * 3}deg)` : '' }"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
            </svg>
            <span class="text-xs font-semibold">
              {{ isRefreshing ? 'Đang tải lại...' : pullDistance >= pullThreshold ? 'Thả để tải lại' : 'Kéo xuống để tải lại' }}
            </span>
            <div v-if="isRefreshing" class="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>

        <div class="flex-grow" :class="{ 'h-full min-h-0 flex flex-col': isMainScrollDisabled }">
          <router-view :key="routerViewKey" />
        </div>
        <footer 
          v-if="!isMainScrollDisabled"
          class="hidden lg:block py-3 text-center text-xs text-text-sub border-t border-border-main/50 bg-card/60 backdrop-blur-xs shrink-0"
        >
          © 2026 Nhà Trọ Thông Minh. Hệ thống đang trong quá trình phát triển &amp; thử nghiệm.
        </footer>
        <!-- Bottom Safe Area Spacer to prevent content from being covered by BottomBar or device safe areas on mobile -->
        <div 
          v-if="!isMainScrollDisabled"
          class="w-full shrink-0 lg:hidden" 
          :style="{ height: isBottomBarHidden ? 'calc(0.5rem + env(safe-area-inset-bottom, 8px))' : 'calc(6.5rem + env(safe-area-inset-bottom, 16px))' }"
        ></div>
      </main>
    </div>
  </div>

  <BottomBar :hidden="isBottomBarHidden" />

  <!-- Click Blocker during API Saving -->
  <div v-if="isApiSaving" class="fixed inset-0 z-[9998] pointer-events-auto bg-black/5 dark:bg-black/15 backdrop-blur-[0.5px]"></div>

  <!-- Global Real-Time Dynamic Island Notification / Saving Pill -->
  <div class="fixed top-[calc(env(safe-area-inset-top,20px)+6px)] left-0 right-0 z-[99999] pointer-events-none flex justify-center">
    <div 
      class="dynamic-island pointer-events-auto flex items-center shadow-2xl border border-white/10"
      :class="dynamicIslandClasses"
      @click="clickIsland"
    >
      <!-- Saving State Content -->
      <div v-if="isApiSaving" class="flex items-center gap-3 w-full px-4 py-1.5 whitespace-nowrap overflow-hidden">
        <div class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin shrink-0"></div>
        <span class="text-xs font-semibold text-white/90 truncate">{{ savingMessage }}</span>
      </div>

      <!-- Toast State Content -->
      <div v-else-if="activeToast" class="flex gap-3 w-full p-3.5 relative overflow-hidden items-start">
        <!-- Icon based on type -->
        <div 
          class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
          :class="{
            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30': activeToast.type === 'PAYMENT_REPORTED' || activeToast.type === 'PAYMENT_CONFIRMED',
            'bg-blue-500/20 text-blue-400 border border-blue-500/30': activeToast.type === 'INVOICE_NEW',
            'bg-amber-500/20 text-amber-400 border border-amber-500/30': activeToast.type === 'SUBSCRIPTION_REQUEST' || activeToast.type === 'PAYMENT_REMINDER',
            'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30': activeToast.type === 'CONTRACT_ACTIVE' || activeToast.type === 'CHAT_MESSAGE',
            'bg-slate-500/20 text-slate-400 border border-slate-500/30': !['PAYMENT_REPORTED', 'PAYMENT_CONFIRMED', 'INVOICE_NEW', 'SUBSCRIPTION_REQUEST', 'PAYMENT_REMINDER', 'CONTRACT_ACTIVE', 'CHAT_MESSAGE'].includes(activeToast.type)
          }"
        >
          <!-- SVG Icons -->
          <svg v-if="activeToast.type === 'CHAT_MESSAGE'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.497c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
          <svg v-else-if="activeToast.type === 'PAYMENT_REPORTED' || activeToast.type === 'PAYMENT_CONFIRMED'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <svg v-else-if="activeToast.type === 'INVOICE_NEW'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <svg v-else-if="activeToast.type === 'SUBSCRIPTION_REQUEST' || activeToast.type === 'PAYMENT_REMINDER'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <svg v-else-if="activeToast.type === 'CONTRACT_ACTIVE'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0 pr-4 text-left">
          <h4 class="text-xs font-bold text-white mb-0.5 truncate">{{ activeToast.title }}</h4>
          <p class="text-[11px] leading-snug text-white/80 line-clamp-2">{{ activeToast.content }}</p>
        </div>

        <!-- Close Button -->
        <button 
          class="absolute top-3 right-3 text-white/50 hover:text-white transition cursor-pointer p-0.5"
          @click.stop="dismissToast"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Idle Notch Placeholder -->
      <div v-else class="w-24 h-5"></div>
    </div>
  </div>

  <!-- Modal yêu cầu quyền thông báo cho thiết bị mới -->
  <div v-if="showPushPrompt" class="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-[2px] z-[999999] flex items-center justify-center p-4">
    <div class="bg-card border border-border-main p-6 rounded-2xl shadow-2xl max-w-sm w-full space-y-5 animate-fade-in">
      <div class="flex items-center space-x-3.5">
        <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        </div>
        <div>
          <h3 class="text-base font-bold text-text-main">Nhận thông báo đẩy</h3>
          <p class="text-xs text-text-sub mt-0.5">Không bỏ lỡ tin nhắn & hóa đơn</p>
        </div>
      </div>
      <p class="text-xs text-text-sub leading-relaxed">
        Thiết bị này chưa được kích hoạt nhận thông báo. Bạn có muốn bật thông báo để nhận thông báo tức thời về tin nhắn mới, hóa đơn và hợp đồng trên thiết bị này không?
      </p>
      <div class="flex space-x-3">
        <button 
          @click="declinePushPrompt" 
          class="flex-1 px-4 py-2.5 rounded-xl border border-border-main text-text-main text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          Để sau
        </button>
        <button 
          @click="acceptPushPrompt" 
          class="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer hover:bg-primary-dark transition shadow-md"
        >
          Bật thông báo
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import Sidebar from './components/layout/Sidebar.vue';
import Header from './components/layout/Header.vue';
import BottomBar from './components/layout/BottomBar.vue';
import { isApiSaving } from './services/api';
import { useAuthStore, isTokenExpired } from './stores/auth.js';
import { useNotificationStore } from './stores/notification.js';
import { useChatStore } from './stores/chat.js';

export default {
  name: 'App',
  components: {
    Sidebar,
    Header,
    BottomBar,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();
    const notificationStore = useNotificationStore();
    const chatStore = useChatStore();

    const showPushPrompt = ref(false);
    const hasDeclinedPush = ref(sessionStorage.getItem('declined_push_notifications') === 'true');

    const checkPushPermission = () => {
      if (
        authStore.isAuthenticated &&
        typeof Notification !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        Notification.permission === 'default' &&
        !hasDeclinedPush.value
      ) {
        showPushPrompt.value = true;
      } else {
        showPushPrompt.value = false;
      }
    };

    const acceptPushPrompt = async () => {
      showPushPrompt.value = false;
      try {
        await notificationStore.initPushNotifications();
      } catch (err) {
        console.error('Lỗi khi kích hoạt thông báo:', err);
      }
    };

    const declinePushPrompt = () => {
      showPushPrompt.value = false;
      hasDeclinedPush.value = true;
      sessionStorage.setItem('declined_push_notifications', 'true');
    };

    const applyFontSize = (size) => {
      let fontSizePx = '16px';
      if (size === 'small') fontSizePx = '14px';
      else if (size === 'medium') fontSizePx = '16px';
      else if (size === 'large') fontSizePx = '18px';
      else if (size === 'xlarge') fontSizePx = '20px';
      document.documentElement.style.fontSize = fontSizePx;
    };

    const isGuest = computed(() => {
      return !authStore.isAuthenticated || !!(route.meta && route.meta.guestOnly);
    });

    const hideHeaderOnMobile = computed(() => {
      return !!(route.meta && route.meta.hideHeaderOnMobile);
    });

    const isHeaderHidden = computed(() => {
      return authStore.isHeaderHidden || !!(route.meta && route.meta.hideHeader);
    });

    const isHeaderInitiallyVisible = computed(() => {
      if (isHeaderHidden.value || hideHeaderOnMobile.value) return false;
      const path = route.path.toLowerCase();
      return !path.includes('/chat');
    });

    const isMainScrollDisabled = computed(() => {
      return !!(route.meta && route.meta.disableMainScroll);
    });

    const isBottomBarHidden = computed(() => {
      if (route.meta && (route.meta.hideBottomBar || route.meta.hideHeaderOnMobile || route.meta.hideHeader)) return true;
      const path = route.path.toLowerCase();
      if (path.includes('/detail') || path.includes('/add') || path.includes('/create') || path.includes('/new') || route.params.id) return true;
      if (authStore.isBottomBarHidden) return true;
      return false;
    });

    const savingMessage = computed(() => {
      return route.path === '/login' ? 'Đang xác thực và tạo phiên làm việc...' : 'Đang xử lý dữ liệu...';
    });

    // ==================== Pull to Refresh ====================
    const routerViewKey = ref(0);
    const mainRef = ref(null);
    const pullDistance = ref(0);
    const isRefreshing = ref(false);
    const pullThreshold = 60;
    let touchStartY = 0;
    let isPulling = false;

    const onTouchStart = (e) => {
      if (isMainScrollDisabled.value) return;
      if (isRefreshing.value) return;
      const el = mainRef.value;
      // Chỉ kích hoạt khi scroll ở đầu trang
      if (el && el.scrollTop <= 0) {
        touchStartY = e.touches[0].clientY;
        isPulling = true;
      }
    };

    const onTouchMove = (e) => {
      if (isMainScrollDisabled.value) return;
      if (!isPulling || isRefreshing.value) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartY;
      if (diff > 0) {
        // Giảm dần lực kéo để tạo hiệu ứng "resistance"
        pullDistance.value = Math.min(diff * 0.45, 80);
      } else {
        pullDistance.value = 0;
        isPulling = false;
      }
    };

    const onTouchEnd = async () => {
      if (isMainScrollDisabled.value) return;
      if (!isPulling || isRefreshing.value) return;
      isPulling = false;

      if (pullDistance.value >= pullThreshold) {
        isRefreshing.value = true;
        pullDistance.value = pullThreshold; // Giữ indicator ở vị trí

        // Force re-render view bằng cách thay đổi key
        routerViewKey.value = Date.now();

        // Chờ một chút để dữ liệu load xong
        await new Promise(resolve => setTimeout(resolve, 600));
        isRefreshing.value = false;
      }

      pullDistance.value = 0;
    };

    // ==================== Status Bar Configuration ====================
    const updateStatusBar = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const isDark = currentTheme === 'dark';

        // Set status bar style (text/icons color)
        await StatusBar.setStyle({
          style: isDark ? Style.Dark : Style.Light,
        });

        // Set background color on Android
        let hexColor = '#ffffff';
        if (isDark) {
          hexColor = (hideHeaderOnMobile.value || isHeaderHidden.value) ? '#0f172a' : '#1e293b';
        } else {
          hexColor = (hideHeaderOnMobile.value || isHeaderHidden.value) ? '#f4f6f9' : '#ffffff';
        }

        await StatusBar.setBackgroundColor({ color: hexColor });
      } catch (err) {
      }
    };

    watch([hideHeaderOnMobile, isHeaderHidden], () => {
      updateStatusBar();
    });

    // Theo dõi trạng thái đăng nhập để kết nối/ngắt kết nối WebSocket
    watch(() => authStore.isAuthenticated, (isAuthenticated) => {
      if (isAuthenticated) {
        notificationStore.connectWebSocket();
        chatStore.connectWebSocket();
        setTimeout(checkPushPermission, 1500); // Kiểm tra và hỏi quyền thông báo đẩy
      } else {
        notificationStore.disconnectWebSocket();
        chatStore.disconnectWebSocket();
        showPushPrompt.value = false;
      }
    });

    // ==================== Session Check ====================
    let checkInterval = null;
    let themeObserver = null;

    const checkSession = () => {
      if (authStore.token && isTokenExpired(authStore.token)) {
        authStore.logout();
        if (route.name !== 'Login' && route.name !== 'Register') {
          router.push('/login');
        }
      }
    };

    onMounted(async () => {
      const savedTheme = localStorage.getItem('theme') || 'light';
      document.documentElement.setAttribute('data-theme', savedTheme);
      const savedFontSize = localStorage.getItem('fontSize') || 'medium';
      applyFontSize(savedFontSize);
      checkSession();

      // Khởi tạo và đồng bộ hóa Status Bar cho Capacitor
      if (Capacitor.isNativePlatform()) {
        updateStatusBar();
        themeObserver = new MutationObserver(() => {
          updateStatusBar();
        });
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['data-theme'],
        });
      }
      
      // Nếu là chủ trọ và đã đăng nhập, kiểm tra trạng thái gói dịch vụ để đồng bộ mới nhất
      if (authStore.isAuthenticated && authStore.role === 'LANDLORD') {
        try {
          await authStore.checkSubscription();
        } catch (err) {
        }
      }

      // Khởi động polling thông báo tại App root để luôn hoạt động dù Header bị ẩn
      if (authStore.isAuthenticated) {
        notificationStore.startPolling();
        chatStore.connectWebSocket();
      }
      
      // Lắng nghe sự kiện từ Service Worker để trả về phòng chat đang xem
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'GET_ACTIVE_ROOM') {
            if (event.ports && event.ports[0]) {
              event.ports[0].postMessage({ activeRoomId: chatStore.currentRoomId });
            }
          }
        });
      }
      
      // Kiểm tra định kỳ mỗi 10 giây xem phiên đăng nhập đã hết hạn chưa
      checkInterval = setInterval(checkSession, 10000);

      // Kiểm tra quyền thông báo trên thiết bị hiện tại
      setTimeout(checkPushPermission, 1500);
    });

    const activeToast = computed(() => notificationStore.activeToast);
    
    const dismissToast = () => {
      notificationStore.activeToast = null;
    };

    const clickToast = async () => {
      const notif = activeToast.value;
      if (!notif) return;
      
      dismissToast();
      
      if (notif.type === 'CHAT_MESSAGE') {
        if (authStore.role === 'LANDLORD') {
          router.push('/landlord/chat');
        } else if (authStore.role === 'TENANT') {
          router.push('/tenant/chat');
        }
        return;
      }
      
      await notificationStore.markAsRead(notif.id);
      
      if (notif.type === 'INVOICE_NEW' || notif.type === 'PAYMENT_CONFIRMED' || notif.type === 'PAYMENT_REMINDER' || notif.type === 'PAYMENT_REPORTED') {
        if (authStore.role === 'LANDLORD') {
          if (notif.referenceId) {
            router.push({ name: 'InvoiceDetail', params: { id: notif.referenceId } });
          } else {
            router.push('/landlord/invoices');
          }
        } else if (authStore.role === 'TENANT') {
          if (notif.referenceId) {
            router.push({ name: 'TenantInvoiceDetail', params: { id: notif.referenceId } });
          } else {
            router.push('/tenant/invoices');
          }
        }
      } else if (notif.type === 'CONTRACT_ACTIVE') {
        if (authStore.role === 'LANDLORD') {
          if (notif.referenceId) {
            router.push({ name: 'ContractDetail', params: { id: notif.referenceId } });
          } else {
            router.push('/landlord/contracts');
          }
        } else if (authStore.role === 'TENANT') {
          if (notif.referenceId) {
            router.push({ name: 'TenantContractDetail', params: { id: notif.referenceId } });
          } else {
            router.push('/tenant/contracts');
          }
        }
      } else if (notif.type === 'SUBSCRIPTION_REQUEST') {
        if (authStore.role === 'ADMIN') {
          router.push('/admin/landlords');
        }
      }
    };

    const dynamicIslandClasses = computed(() => {
      if (isApiSaving.value) {
        return 'w-[260px] h-[40px] rounded-full bg-slate-900/90 dark:bg-black/90 text-white backdrop-blur-xl scale-100 opacity-100 cursor-default';
      } else if (activeToast.value) {
        return 'w-[calc(100vw-2rem)] sm:w-[380px] h-auto min-h-[72px] rounded-[24px] bg-slate-900/90 dark:bg-black/90 text-white backdrop-blur-xl scale-100 opacity-100 cursor-pointer hover:bg-slate-950 dark:hover:bg-black';
      } else {
        return 'w-[100px] h-[30px] rounded-full bg-black/90 scale-90 opacity-0 pointer-events-none overflow-hidden';
      }
    });

    const clickIsland = () => {
      if (activeToast.value) {
        clickToast();
      }
    };

    onUnmounted(() => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      if (themeObserver) {
        themeObserver.disconnect();
      }
      notificationStore.stopPolling();
      chatStore.disconnectWebSocket();
    });

    return {
      isGuest,
      hideHeaderOnMobile,
      isApiSaving,
      isBottomBarHidden,
      isHeaderHidden,
      isHeaderInitiallyVisible,
      isMainScrollDisabled,
      savingMessage,
      // Pull to refresh
      mainRef,
      pullDistance,
      pullThreshold,
      isRefreshing,
      routerViewKey,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      activeToast,
      dismissToast,
      clickToast,
      // Push notifications prompt
      showPushPrompt,
      declinePushPrompt,
      acceptPushPrompt,
      // Dynamic Island
      dynamicIslandClasses,
      clickIsland,
    };
  },
};
</script>

<style scoped>
.dynamic-island {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.2);
  will-change: width, height, transform, opacity, border-radius;
}
</style>
