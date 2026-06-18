import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import PageHeader from '../../components/ui/PageHeader.vue';
import { useContractStore } from '../../stores/contract.js';
import { useAuthStore } from '../../stores/auth.js';
import { useInvoiceStore } from '../../stores/invoice.js';
import AppIcon from '../../components/ui/icons/AppIcon.vue';
import MoneyDisplay from '../../components/ui/MoneyDisplay.vue';
import DateDisplay from '../../components/ui/DateDisplay.vue';
import ReportSkeleton from '../../components/ui/ReportSkeleton.vue';

export default {
  name: 'TenantDashboard',
  components: {
    PageHeader,
    AppIcon,
    MoneyDisplay,
    DateDisplay,
    ReportSkeleton,
  },
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const contractStore = useContractStore();
    const invoiceStore = useInvoiceStore();

    const currentDate = computed(() => {
      const d = new Date();
      const formatter = new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        weekday: 'long',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(d);
    });

    const greeting = computed(() => {
      const d = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: 'numeric',
        hour12: false
      });
      const hour = Number(formatter.format(d));
      const name = authStore.user?.fullName || authStore.user?.username || 'Người dùng';
      if (hour < 12) return `Chào buổi sáng, ${name}`;
      if (hour < 18) return `Chào buổi chiều, ${name}`;
      return `Chào buổi tối, ${name}`;
    });

    const tenantDashboardIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>`;



    const activeContract = ref(null);
    const loading = ref(true);

    const unpaidInvoices = computed(() => {
      return invoiceStore.invoices.filter(inv => inv.status !== 'PAID');
    });

    const viewInvoiceDetails = (id) => {
      router.push({ name: 'TenantInvoiceDetail', params: { id } });
    };

    const loadTenantData = async () => {
      loading.value = true;
      try {
        const [contractsList] = await Promise.all([
          contractStore.fetchContracts(),
          invoiceStore.fetchInvoices({ size: 100 })
        ]);
        activeContract.value = contractsList.find(c => c.status === 'ACTIVE') || null;
      } catch (err) {
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      loadTenantData();
    });

    return {
      tenantDashboardIcon,
      activeContract,
      loading,
      greeting,
      currentDate,
      unpaidInvoices,
      viewInvoiceDetails,
    };
  },
};
