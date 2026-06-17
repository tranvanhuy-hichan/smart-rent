import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import userService from '../services/userService.js';
import { formatDateTime } from '../utils/date.js';
import AppIcon from '../components/ui/icons/AppIcon.vue';
import FormInput from '../components/ui/FormInput.vue';
import FormButton from '../components/ui/FormButton.vue';
import ConfirmModal from '../components/ui/ConfirmModal.vue';
import { useConfirmModal } from '../composables/useConfirmModal.js';
import { useNotificationStore } from '../stores/notification.js';
import pushSubscriptionService from '../services/pushSubscriptionService.js';

export default {
  name: 'Settings',
  components: {
    AppIcon,
    FormInput,
    FormButton,
    ConfirmModal,
  },
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const { confirmModal, showAlert, showConfirm, onConfirmModal, closeConfirmModal } = useConfirmModal();

    const getErrorMessage = (err, defaultMsg) => {
      return err.response?.data?.error || err.message || (typeof err === 'string' ? err : defaultMsg);
    };

    const activeTab = ref(authStore.user?.mustChangePassword ? 'security' : 'profile'); // 'profile' | 'security' | 'preferences' | 'imou'
    const theme = ref(localStorage.getItem('theme') || 'light');
    const fontSize = ref(localStorage.getItem('fontSize') || 'medium');
    const isLandlord = computed(() => authStore.role === 'LANDLORD');

    const setFontSize = (size) => {
      fontSize.value = size;
      localStorage.setItem('fontSize', size);
      let fontSizePx = '16px';
      if (size === 'small') fontSizePx = '14px';
      else if (size === 'medium') fontSizePx = '16px';
      else if (size === 'large') fontSizePx = '18px';
      else if (size === 'xlarge') fontSizePx = '20px';
      document.documentElement.style.fontSize = fontSizePx;
    };

    // Profile state variables
    const loadingProfile = ref(true);
    const savingProfile = ref(false);
    const rawUserProfile = ref(null);
    const profileForm = ref({
      fullName: '',
      username: '',
      email: '',
      phone: '',
      identityCard: '',
      idCardIssueDate: '',
      idCardIssuePlace: '',
      permanentAddress: '',
    });

    // Password state variables
    const savingPassword = ref(false);
    const passwordForm = ref({
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    // Sessions state variables
    const sessions = ref([]);
    const loadingSessions = ref(true);

    const fetchSessions = async () => {
      loadingSessions.value = true;
      try {
        const res = await userService.getLoginHistory();
        sessions.value = res.data || [];
      } catch (err) {
        showAlert('Lỗi', getErrorMessage(err, 'Không thể tải danh sách phiên đăng nhập. Vui lòng thử lại!'), 'danger');
      } finally {
        loadingSessions.value = false;
      }
    };

    const confirmRevoke = (id) => {
      showConfirm(
        'Xác nhận đăng xuất',
        'Bạn có chắc chắn muốn đăng xuất khỏi thiết bị này? Phiên làm việc trên thiết bị đó sẽ bị hủy bỏ ngay lập tức.',
        'warning',
        async () => {
          try {
            await userService.revokeSession(id);
            showAlert('Thành công', 'Đã đăng xuất thiết bị thành công!', 'success');
            fetchSessions();
          } catch (err) {
            showAlert('Lỗi', getErrorMessage(err, 'Không thể đăng xuất thiết bị'), 'danger');
          }
        }
      );
    };

    const formatUA = (ua) => {
      if (!ua) return 'Không rõ';
      let browser = 'Không rõ';
      let os = 'Không rõ';
      const uaLower = ua.toLowerCase();

      if (uaLower.includes('firefox')) browser = 'Firefox';
      else if (uaLower.includes('edge')) browser = 'Edge';
      else if (uaLower.includes('opera') || uaLower.includes('opr')) browser = 'Opera';
      else if (uaLower.includes('chrome') || uaLower.includes('crios')) browser = 'Chrome';
      else if (uaLower.includes('safari')) browser = 'Safari';

      if (uaLower.includes('windows')) os = 'Windows';
      else if (uaLower.includes('macintosh') || uaLower.includes('mac os')) os = 'macOS';
      else if (uaLower.includes('iphone') || uaLower.includes('ipad')) os = 'iOS';
      else if (uaLower.includes('android')) os = 'Android';
      else if (uaLower.includes('linux')) os = 'Linux';

      return `${browser} (${os})`;
    };

    watch(activeTab, (newTab) => {
      if (newTab === 'sessions') {
        fetchSessions();
      }
    });

    // Imou config state variables
    const savingImou = ref(false);
    const imouForm = ref({
      imouAppId: '',
      imouAppSecret: '',
    });

    const fetchUserProfile = async () => {
      loadingProfile.value = true;
      try {
        const res = await userService.getProfile();
        rawUserProfile.value = res.data;
        resetProfileForm();
        resetImouForm();
      } catch (err) {
        showAlert('Lỗi', getErrorMessage(err, 'Không thể tải thông tin cá nhân. Vui lòng thử lại!'), 'danger');
      } finally {
        loadingProfile.value = false;
      }
    };

    const resetProfileForm = () => {
      if (rawUserProfile.value) {
        profileForm.value = {
          fullName: rawUserProfile.value.fullName || '',
          username: rawUserProfile.value.username || '',
          email: rawUserProfile.value.email || '',
          phone: rawUserProfile.value.phone || '',
          identityCard: rawUserProfile.value.identityCard || '',
          idCardIssueDate: rawUserProfile.value.idCardIssueDate || '',
          idCardIssuePlace: rawUserProfile.value.idCardIssuePlace || '',
          permanentAddress: rawUserProfile.value.permanentAddress || '',
        };
      }
    };

    const resetImouForm = () => {
      if (rawUserProfile.value) {
        imouForm.value = {
          imouAppId: rawUserProfile.value.imouAppId || '',
          imouAppSecret: rawUserProfile.value.imouAppSecret || '',
        };
      }
    };

    const saveImouSettings = async () => {
      savingImou.value = true;
      try {
        const payload = {
          imouAppId: imouForm.value.imouAppId,
          imouAppSecret: imouForm.value.imouAppSecret,
        };
        const res = await userService.updateImouSettings(payload);
        rawUserProfile.value = res.data;
        resetImouForm();
        showAlert('Thành công', 'Cập nhật cấu hình Imou Cloud thành công!', 'success');
      } catch (err) {
        showAlert('Lỗi', getErrorMessage(err, 'Cập nhật cấu hình thất bại'), 'danger');
      } finally {
        savingImou.value = false;
      }
    };

    const saveProfile = async () => {
      savingProfile.value = true;
      try {
        const payload = {
          fullName: profileForm.value.fullName,
          email: profileForm.value.email,
          phone: profileForm.value.phone,
          identityCard: profileForm.value.identityCard,
          idCardIssueDate: profileForm.value.idCardIssueDate || null,
          idCardIssuePlace: profileForm.value.idCardIssuePlace,
          permanentAddress: profileForm.value.permanentAddress,
        };
        const res = await userService.updateProfile(payload);
        rawUserProfile.value = res.data;
        // Cập nhật tên hiển thị ở authStore và localStorage
        if (authStore.user) {
          authStore.user.fullName = res.data.fullName;
          localStorage.setItem('user', JSON.stringify(authStore.user));
        }
        showAlert('Thành công', 'Cập nhật thông tin cá nhân thành công!', 'success');
      } catch (err) {
        showAlert('Lỗi', getErrorMessage(err, 'Cập nhật thông tin thất bại'), 'danger');
      } finally {
        savingProfile.value = false;
      }
    };

    const savePassword = async () => {
      if (passwordForm.value.newPassword.length < 6) {
        showAlert('Cảnh báo', 'Mật khẩu mới phải có tối thiểu 6 ký tự!', 'warning');
        return;
      }
      if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
        showAlert('Cảnh báo', 'Mật khẩu mới và xác nhận mật khẩu không trùng khớp!', 'warning');
        return;
      }

      savingPassword.value = true;
      try {
        await userService.changePassword({
          oldPassword: passwordForm.value.oldPassword,
          newPassword: passwordForm.value.newPassword,
        });
        showAlert('Thành công', 'Thay đổi mật khẩu thành công!', 'success');
        // Reset form password
        passwordForm.value = {
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        };
        // Cập nhật trạng thái đổi mật khẩu trong authStore và localStorage
        if (authStore.user) {
          authStore.user.mustChangePassword = false;
          localStorage.setItem('user', JSON.stringify(authStore.user));
        }
      } catch (err) {
        showAlert('Lỗi', getErrorMessage(err, 'Thay đổi mật khẩu thất bại'), 'danger');
      } finally {
        savingPassword.value = false;
      }
    };

    const setTheme = (newTheme) => {
      theme.value = newTheme;
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    };

    const goBack = () => {
      if (window.history.state && window.history.state.back) {
        router.back();
      } else {
        if (authStore.role === 'ADMIN') {
          router.push('/admin');
        } else if (authStore.role === 'LANDLORD') {
          router.push('/landlord');
        } else if (authStore.role === 'TENANT') {
          router.push('/tenant');
        } else {
          router.push('/login');
        }
      }
    };

    // Push notification handling
    const notificationStore = useNotificationStore();
    const pushPermission = ref(typeof Notification !== 'undefined' ? Notification.permission : 'default');

    const updatePermissionState = () => {
      if (typeof Notification !== 'undefined') {
        pushPermission.value = Notification.permission;
      }
    };

    const pushPermissionLabel = computed(() => {
      if (typeof Notification === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        return 'Không hỗ trợ trên trình duyệt này';
      }
      if (pushPermission.value === 'granted') return 'Đã bật';
      if (pushPermission.value === 'denied') return 'Đã bị chặn (Vui lòng đặt lại quyền trên trình duyệt)';
      return 'Chưa bật';
    });

    const pushPermissionClass = computed(() => {
      if (pushPermission.value === 'granted') return 'text-emerald-600 dark:text-emerald-400';
      if (pushPermission.value === 'denied') return 'text-danger';
      return 'text-text-sub';
    });

    const showEnablePushButton = computed(() => {
      return typeof Notification !== 'undefined' && pushPermission.value !== 'granted' && pushPermission.value !== 'denied';
    });

    const showDisablePushButton = computed(() => {
      return typeof Notification !== 'undefined' && pushPermission.value === 'granted';
    });

    const enablePushNotifications = async () => {
      if (typeof Notification === 'undefined') return;
      try {
        await notificationStore.initPushNotifications();
        updatePermissionState();
        if (Notification.permission === 'granted') {
          showAlert('Thành công', 'Đã bật nhận thông báo đẩy thành công!', 'success');
        } else if (Notification.permission === 'denied') {
          showAlert('Cảnh báo', 'Bạn đã chặn quyền thông báo. Vui lòng đặt lại quyền trong cài đặt trình duyệt để tiếp tục.', 'warning');
        }
      } catch (err) {
        showAlert('Lỗi', 'Không thể bật thông báo: ' + err.message, 'danger');
      }
    };

    const disablePushNotifications = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await pushSubscriptionService.unsubscribe(subscription.endpoint);
            await subscription.unsubscribe();
          }
        }
        showAlert('Thành công', 'Đã tắt nhận thông báo đẩy.', 'success');
        updatePermissionState();
      } catch (err) {
        showAlert('Lỗi', 'Không thể tắt thông báo: ' + err.message, 'danger');
      }
    };

    onMounted(() => {
      fetchUserProfile();
      updatePermissionState();
    });

    const mustChangePassword = computed(() => authStore.user?.mustChangePassword || false);

    return {
      activeTab,
      mustChangePassword,
      theme,
      isLandlord,
      loadingProfile,
      savingProfile,
      profileForm,
      resetProfileForm,
      saveProfile,
      savingPassword,
      passwordForm,
      savePassword,
      savingImou,
      imouForm,
      resetImouForm,
      saveImouSettings,
      setTheme,
      fontSize,
      setFontSize,
      goBack,
      confirmModal,
      onConfirmModal,
      closeConfirmModal,
      sessions,
      loadingSessions,
      fetchSessions,
      confirmRevoke,
      formatDateTime,
      formatUA,
      // Push notifications
      pushPermissionLabel,
      pushPermissionClass,
      showEnablePushButton,
      showDisablePushButton,
      enablePushNotifications,
      disablePushNotifications,
    };
  },
};
