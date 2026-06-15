import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';
import subscriptionService from '../../services/subscriptionService.js';
import AppIcon from '../../components/ui/icons/AppIcon.vue';
import FormButton from '../../components/ui/FormButton.vue';
import { formatDate, formatDateTime } from '../../utils/date.js';

export default {
  name: 'SubscriptionUpgrade',
  components: {
    AppIcon,
    FormButton
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();
    
    const selectedPackageId = ref(null);
    const activePackages = ref([]);
    const currentRequest = ref(null);
    const status = ref(null);
    const requests = ref([]);
    const adminBankInfo = ref(null);
    
    const loadingStatus = ref(true);
    const loadingRequests = ref(true);
    const loadingPackages = ref(true);
    const submitting = ref(false);

    const loadAdminBankInfo = async () => {
      try {
        const response = await subscriptionService.getAdminBankInfo();
        adminBankInfo.value = response.data;
      } catch (err) {
      }
    };

    const loadStatus = async () => {
      loadingStatus.value = true;
      try {
        const response = await subscriptionService.getActiveStatus();
        status.value = response.data;
      } catch (err) {
      } finally {
        loadingStatus.value = false;
      }
    };

    const loadPackages = async () => {
      loadingPackages.value = true;
      try {
        const response = await subscriptionService.getActivePackages();
        activePackages.value = response.data;
        if (response.data && response.data.length > 0) {
          // Select the first active package by default
          selectedPackageId.value = response.data[0].id;
        }
      } catch (err) {
      } finally {
        loadingPackages.value = false;
      }
    };

    const loadRequests = async () => {
      loadingRequests.value = true;
      try {
        const response = await subscriptionService.getMyRequests();
        requests.value = response.data;
        
        // Find if there is any pending request, pre-populate payment info if so
        const pending = response.data.find(r => r.status === 'PENDING');
        if (pending) {
          currentRequest.value = pending;
        }
      } catch (err) {
      } finally {
        loadingRequests.value = false;
      }
    };

    const submitUpgradeRequest = async () => {
      if (!selectedPackageId.value) {
        alert('Vui lòng chọn gói nâng cấp!');
        return;
      }
      submitting.value = true;
      try {
        const response = await subscriptionService.createRequest(
          selectedPackageId.value,
          window.location.href,
          window.location.href
        );
        currentRequest.value = response.data;
        await loadRequests(); // Reload list
        
        if (response.data && response.data.checkoutUrl) {
          window.location.href = response.data.checkoutUrl;
        } else {
          alert('Yêu cầu thanh toán đã được tạo! Vui lòng thực hiện chuyển khoản theo thông tin hướng dẫn.');
        }
      } catch (err) {
        alert(err.response?.data?.error || 'Có lỗi xảy ra khi tạo yêu cầu thanh toán!');
      } finally {
        submitting.value = false;
      }
    };

    const loadingPayos = ref(false);

    const payPendingRequestWithPayos = async () => {
      if (!currentRequest.value) return;
      loadingPayos.value = true;
      try {
        const res = await subscriptionService.getPayosLink(currentRequest.value.id, {
          returnUrl: window.location.href,
          cancelUrl: window.location.href
        });
        if (res.data && res.data.checkoutUrl) {
          window.location.href = res.data.checkoutUrl;
        } else {
          throw new Error("Không nhận được link thanh toán từ hệ thống");
        }
      } catch (err) {
        alert(err.response?.data?.error || err.message || 'Lỗi kết nối cổng thanh toán PayOS');
      } finally {
        loadingPayos.value = false;
      }
    };

    const copyContent = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        alert('Đã sao chép nội dung chuyển khoản vào bộ nhớ tạm!');
      } catch (err) {
        alert('Không thể tự sao chép, vui lòng bôi đen và sao chép thủ công!');
      }
    };

    const goBack = () => {
      if (window.history.state && window.history.state.back) {
        router.back();
      } else {
        router.push('/landlord');
      }
    };

    // Computed properties

    const zaloUrl = computed(() => {
      const phone = adminBankInfo.value?.phone || '0365943254';
      if (!currentRequest.value) return `https://zalo.me/${phone}`;
      const username = authStore.username || '';
      const months = currentRequest.value.months;
      const content = currentRequest.value.paymentContent;
      const message = `Tôi muốn nâng cấp tài khoản ${username} gói ${months} tháng, mã yêu cầu đối soát: "${content}". Vui lòng hỗ trợ kích hoạt tài khoản giúp tôi!`;
      return `https://zalo.me/${phone}?text=${encodeURIComponent(message)}`;
    });

    // Formatting helpers
    const formatMoney = (val) => {
      if (!val) return '0';
      return new Intl.NumberFormat('vi-VN').format(val);
    };

    onMounted(() => {
      // Check query parameters from PayOS redirection
      if (route.query.status === 'PAID' || route.query.code === '00') {
        alert('Thanh toán nâng cấp gói thành công! Gói cước của bạn đã được kích hoạt.');
        router.replace({ query: {} });
      } else if (route.query.status === 'CANCELLED' || route.query.cancel === 'true') {
        alert('Giao dịch thanh toán nâng cấp gói đã được hủy.');
        router.replace({ query: {} });
      }

      loadStatus();
      loadRequests();
      loadPackages();
      loadAdminBankInfo();
    });

    return {
      selectedPackageId,
      activePackages,
      currentRequest,
      status,
      requests,
      adminBankInfo,
      loadingStatus,
      loadingRequests,
      loadingPackages,
      submitting,
      zaloUrl,
      submitUpgradeRequest,
      copyContent,
      goBack,
      formatMoney,
      formatDate,
      loadingPayos,
      payPendingRequestWithPayos
    };
  }
};
