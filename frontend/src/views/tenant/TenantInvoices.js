import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import PageHeader from '../../components/ui/PageHeader.vue';
import DataTable from '../../components/ui/DataTable.vue';
import MoneyDisplay from '../../components/ui/MoneyDisplay.vue';
import DateDisplay from '../../components/ui/DateDisplay.vue';
import { useInvoiceStore } from '../../stores/invoice.js';

export default {
  name: 'TenantInvoices',
  components: {
    PageHeader,
    DataTable,
    MoneyDisplay,
    DateDisplay,
  },
  setup() {
    const router = useRouter();
    const invoiceStore = useInvoiceStore();

    const invoiceIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>`;

    const tableHeaders = [
      { label: 'Ngày xuất', key: 'invoiceDate', type: 'date', cellClass: 'text-text-sub' },
      {
        label: 'Kỳ thanh toán',
        key: 'billingPeriod',
        cellClass: 'text-xs text-text-sub',
      },
      { label: 'Tiền phòng', key: 'roomPrice', cellClass: 'text-text-main', hideOnMobile: true },
      { label: 'Tổng cộng', key: 'totalAmount', cellClass: 'font-semibold text-primary' },
      { label: 'Đã thanh toán', key: 'paidAmount', cellClass: 'font-semibold text-success', hideOnMobile: true },
      {
        label: 'Còn nợ',
        key: 'remainingAmount',
        cellClass: 'font-semibold text-rose-500',
      },
      {
        label: 'Trạng thái',
        key: 'status',
        type: 'badge',
        badgeColors: {
          PAID: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/35 dark:text-emerald-400',
          PARTIALLY_PAID: 'bg-amber-50 text-amber-600 dark:bg-amber-950/35 dark:text-amber-400',
          PENDING: 'bg-rose-50 text-rose-600 dark:bg-rose-950/35 dark:text-rose-400',
        },
        badgeLabels: {
          PAID: 'Đã thanh toán',
          PARTIALLY_PAID: 'Trả một phần',
          PENDING: 'Chưa đóng tiền',
        },
      },
    ];

    const invoices = computed(() => invoiceStore.invoices);
    const loading = computed(() => invoiceStore.loading);

    // Pagination
    const page = ref(0);
    const size = ref(10);
    const totalPages = computed(() => invoiceStore.totalPages);
    const totalElements = computed(() => invoiceStore.totalElements);

    const fetchInvoices = async () => {
      try {
        await invoiceStore.fetchInvoices({ page: page.value, size: size.value });
      } catch (err) {
      }
    };

    const viewDetails = (id) => {
      router.push({ name: 'TenantInvoiceDetail', params: { id } });
    };

    const changePage = (newPage) => {
      if (newPage >= 0 && newPage < totalPages.value) {
        page.value = newPage;
        fetchInvoices();
      }
    };

    onMounted(() => {
      fetchInvoices();
    });

    return {
      invoices,
      loading,
      page,
      totalPages,
      totalElements,
      invoiceIcon,
      tableHeaders,
      viewDetails,
      changePage,
    };
  },
};
