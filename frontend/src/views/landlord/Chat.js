import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useChatStore } from '../../stores/chat.js';
import { useAuthStore } from '../../stores/auth.js';
import { formatDateTime, formatDate } from '../../utils/date.js';

export default {
  name: 'LandlordChat',
  setup() {
    const chatStore = useChatStore();
    const authStore = useAuthStore();

    const newMessageText = ref('');
    const selectedRoom = ref(null);
    const messageContainerRef = ref(null);
    const isSending = ref(false);
    const mobileShowChat = ref(false);
    const isKeyboardOpen = ref(false);
    const viewportHeight = ref('100%');

    const updateViewportHeight = () => {
      if (window.visualViewport) {
        viewportHeight.value = `${window.visualViewport.height}px`;
        if (window.visualViewport.height < window.innerHeight) {
          nextTick(() => {
            scrollToBottom();
          });
        }
      }
    };

    const rooms = computed(() => chatStore.rooms);
    const currentRoomMessages = computed(() => chatStore.currentRoomMessages);
    const loadingRooms = computed(() => chatStore.loadingRooms);
    const loadingMessages = computed(() => chatStore.loadingMessages);
    const hasMore = computed(() => chatStore.hasMore);

    const currentUser = computed(() => authStore.user);

    const selectRoom = async (room) => {
      selectedRoom.value = room;
      mobileShowChat.value = true;
      await chatStore.fetchRoomMessages(room.id);
      await chatStore.markAsRead(room.id);
      await nextTick();
      scrollToBottom();
    };

    const loadMoreMessages = async () => {
      if (loadingMessages.value || !hasMore.value) return;
      
      // Save scroll height before loading more
      const container = messageContainerRef.value;
      const previousScrollHeight = container ? container.scrollHeight : 0;
      
      const nextPage = chatStore.currentPage + 1;
      await chatStore.fetchRoomMessages(selectedRoom.value.id, nextPage, true);
      
      await nextTick();
      
      // Restore scroll position
      if (container) {
        container.scrollTop = container.scrollHeight - previousScrollHeight;
      }
    };

    const handleSendMessage = async () => {
      if (!newMessageText.value.trim() || isSending.value || !selectedRoom.value) return;

      const text = newMessageText.value.trim();
      newMessageText.value = '';
      isSending.value = true;

      try {
        await chatStore.sendMessage(selectedRoom.value.id, text);
        await nextTick();
        scrollToBottom();
      } catch (error) {
        newMessageText.value = text; // Restore text on error
      } finally {
        isSending.value = false;
      }
    };

    const handleFocus = () => {
      isKeyboardOpen.value = true;
      // Khóa scroll body triệt để bằng fixed để tránh bị đẩy layout lên trên iOS
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.overflow = 'hidden';
      
      document.documentElement.style.position = 'fixed';
      document.documentElement.style.width = '100%';
      document.documentElement.style.height = '100%';
      document.documentElement.style.overflow = 'hidden';

      setTimeout(() => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        scrollToBottom();
      }, 50);
      
      // Secondary check to override delayed OS keyboard layout transitions
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
      }, 250);
    };

    const handleBlur = () => {
      isKeyboardOpen.value = false;
      
      // Trở lại trạng thái bình thường
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
      
      document.documentElement.style.position = '';
      document.documentElement.style.width = '';
      document.documentElement.style.height = '';
      document.documentElement.style.overflow = '';

      setTimeout(() => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
      }, 100);
    };

    const scrollToBottom = () => {
      const container = messageContainerRef.value;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    };

    // Watch for new messages in current room to auto scroll to bottom
    watch(
      () => currentRoomMessages.value.length,
      (newVal, oldVal) => {
        // Only scroll if we are appending a new message at the bottom (newVal > oldVal)
        // and we aren't loading page (> 0 increment and not loading older messages)
        if (newVal > oldVal && chatStore.currentPage === 0) {
          nextTick(() => {
            scrollToBottom();
          });
        }
      }
    );

    // Watch selectedRoom to keep chatStore.currentRoomId in sync
    watch(selectedRoom, (newRoom) => {
      chatStore.currentRoomId = newRoom ? newRoom.id : null;
    });

    const formatTimeOnly = (dateTimeStr) => {
      if (!dateTimeStr) return '';
      const date = new Date(dateTimeStr);
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const formatMessageTime = (dateTimeStr) => {
      if (!dateTimeStr) return '';
      const date = new Date(dateTimeStr);
      const now = new Date();
      
      // If today, return time only
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      }
      
      // Otherwise return date and time
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    onMounted(async () => {
      // Connect WebSocket if authenticated
      if (authStore.isAuthenticated) {
        chatStore.connectWebSocket();
      }
      
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateViewportHeight);
        window.visualViewport.addEventListener('scroll', updateViewportHeight);
      }
      updateViewportHeight();
    });

    onUnmounted(() => {
      // Clear currentRoomId when leaving Chat page
      chatStore.currentRoomId = null;
      
      // Đảm bảo mở khóa scroll trang chính khi chuyển màn hình
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
      
      document.documentElement.style.position = '';
      document.documentElement.style.width = '';
      document.documentElement.style.height = '';
      document.documentElement.style.overflow = '';

      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
        window.visualViewport.removeEventListener('scroll', updateViewportHeight);
      }
    });

    return {
      rooms,
      selectedRoom,
      currentRoomMessages,
      loadingRooms,
      loadingMessages,
      hasMore,
      newMessageText,
      messageContainerRef,
      isSending,
      currentUser,
      mobileShowChat,
      selectRoom,
      isKeyboardOpen,
      viewportHeight,
      loadMoreMessages,
      handleSendMessage,
      handleFocus,
      handleBlur,
      formatTimeOnly,
      formatMessageTime,
      formatDateTime,
      formatDate
    };
  }
};
