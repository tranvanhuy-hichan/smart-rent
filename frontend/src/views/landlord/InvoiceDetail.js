import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useInvoiceStore } from '../../stores/invoice.js';
import { useAuthStore } from '../../stores/auth.js';
import FormButton from '../../components/ui/FormButton.vue';
import FormInput from '../../components/ui/FormInput.vue';
import Modal from '../../components/ui/Modal.vue';
import ConfirmModal from '../../components/ui/ConfirmModal.vue';
import AppIcon from '../../components/ui/icons/AppIcon.vue';
import DetailField from '../../components/ui/DetailField.vue';
import LoadingState from '../../components/ui/LoadingState.vue';
import MoneyDisplay from '../../components/ui/MoneyDisplay.vue';
import DateDisplay from '../../components/ui/DateDisplay.vue';
import { useConfirmModal } from '../../composables/useConfirmModal.js';
import { formatMoney } from '../../utils/money.js';
import { formatDate } from '../../utils/date.js';
import invoiceService from '../../services/invoiceService.js';

export default {
  name: 'InvoiceDetail',
  components: {
    FormButton,
    FormInput,
    Modal,
    ConfirmModal,
    AppIcon,
    DetailField,
    LoadingState,
    MoneyDisplay,
    DateDisplay
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const invoiceStore = useInvoiceStore();
    const authStore = useAuthStore();
    const { confirmModal, showAlert, showConfirm, onConfirmModal, closeConfirmModal } = useConfirmModal();

    const invoice = ref(null);
    const invoiceItems = computed(() => invoiceStore.currentInvoiceItems);
    const loading = computed(() => invoiceStore.loading);
    
    const showPayModal = ref(false);
    const payForm = ref({
      paidAmount: 0
    });

    const isLandlord = computed(() => authStore.role === 'LANDLORD');
    const activeTab = ref('summary'); // 'summary' or 'receipt'
    const showPreviewModal = ref(false);



    const fetchInvoiceDetail = async () => {
      try {
        const invoiceId = route.params.id;
        const res = await invoiceStore.fetchInvoiceDetail(invoiceId);
        invoice.value = res.invoice;
      } catch (err) {
        showAlert('Lỗi', err.response?.data?.error || 'Không thể tải thông tin chi tiết hóa đơn', 'danger');
        goBack();
      }
    };

    const goBack = () => {
      if (window.history.state && window.history.state.back) {
        router.back();
      } else {
        if (isLandlord.value) {
          router.push({ name: 'Invoices' });
        } else {
          router.push({ name: 'TenantDashboard' });
        }
      }
    };

    const openPayModal = () => {
      if (!invoice.value) return;
      payForm.value.paidAmount = invoice.value.totalAmount - invoice.value.paidAmount;
      showPayModal.value = true;
    };

    const closePayModal = () => {
      showPayModal.value = false;
    };

    const submitPayment = async () => {
      if (!invoice.value) return;
      const remaining = invoice.value.totalAmount - invoice.value.paidAmount;
      if (payForm.value.paidAmount > remaining) {
        showAlert('Lỗi nhập liệu', `Số tiền thanh toán không được vượt quá số tiền còn lại (${formatMoney(remaining)} đ)`, 'warning');
        return;
      }
      try {
        await invoiceStore.payInvoice(invoice.value.id, payForm.value.paidAmount);
        showAlert('Thành công', 'Ghi nhận thanh toán thành công!', 'success');
        closePayModal();
        await fetchInvoiceDetail();
      } catch (err) {
        showAlert('Lỗi', err.response?.data?.error || 'Ghi nhận thanh toán thất bại', 'danger');
      }
    };

    const quickPayInvoice = async () => {
      if (!invoice.value) return;
      const remaining = invoice.value.totalAmount - invoice.value.paidAmount;
      showConfirm(
        'Xác nhận thanh toán',
        `Xác nhận ghi nhận đã thu đủ số tiền còn lại: ${formatMoney(remaining)} đ?`,
        'info',
        async () => {
          try {
            await invoiceStore.payInvoice(invoice.value.id, remaining);
            showAlert('Thành công', 'Ghi nhận thanh toán thành công!', 'success');
            await fetchInvoiceDetail();
          } catch (err) {
            showAlert('Lỗi', err.response?.data?.error || 'Ghi nhận thanh toán thất bại', 'danger');
          }
        }
      );
    };

    const paymentNotified = ref(localStorage.getItem(`notified_pay_${route.params.id}`) === 'true');

    const sendPaymentNotification = async () => {
      if (!invoice.value) return;
      try {
        await invoiceStore.notifyPayment(invoice.value.id);
        localStorage.setItem(`notified_pay_${invoice.value.id}`, 'true');
        paymentNotified.value = true;
        await fetchInvoiceDetail();
        showAlert('Thành công', 'Đã gửi thông báo chuyển khoản tiền phòng tới chủ trọ. Vui lòng chờ đối soát!', 'success');
      } catch (err) {
        showAlert('Lỗi', err.response?.data?.error || 'Gửi thông báo thanh toán thất bại', 'danger');
      }
    };

    const printInvoice = () => {
      if (!invoice.value) return;
      const printElement = document.getElementById("invoice-print-area");
      if (!printElement) return;
      
      const printContent = printElement.innerHTML;
      const printWindow = window.open("", "_blank");
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Phiếu thanh toán tiền phòng & dịch vụ - Phòng ${invoice.value.contract?.room?.roomNumber}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap');
              body {
                font-family: 'Lora', 'Times New Roman', Times, serif;
                color: #000;
                background-color: #fff;
                line-height: 1.25;
                padding: 6mm 12mm 5mm 12mm;
                margin: 0;
                font-size: 12px !important;
              }
              @page {
                size: A4;
                margin: 0;
              }
              .text-center { text-align: center !important; }
              .text-justify { text-align: justify !important; }
              .font-bold { font-weight: bold !important; }
              .font-semibold { font-weight: 600 !important; }
              .uppercase { text-transform: uppercase !important; }
              .tracking-widest { letter-spacing: 0.1em !important; }
              .tracking-wide { letter-spacing: 0.05em !important; }
              .my-4, .my-8 { margin-top: 5px !important; margin-bottom: 5px !important; }
              .mb-4, .mb-8 { margin-bottom: 5px !important; }
              .mb-6 { margin-bottom: 0.3rem !important; }
              .mb-1 { margin-bottom: 0.1rem !important; }
              .mt-1 { margin-top: 0.1rem !important; }
              .mt-2 { margin-top: 0.2rem !important; }
              .mt-6, .mt-8 { margin-top: 0.4rem !important; }
              .mt-12 { margin-top: 0.8rem !important; }
              .pb-4, .pb-8 { padding-bottom: 0.2rem !important; }
              .pt-2.5, .pt-4 { padding-top: 0.2rem !important; }
              .pt-1.5, .pt-2 { padding-top: 0.1rem !important; }
              .space-y-3 > * + *, .space-y-4 > * + * { margin-top: 0.25rem !important; }
              .space-y-1.5 > * + *, .space-y-2 > * + * { margin-top: 0.12rem !important; }
              .space-y-1 > * + * { margin-top: 0.08rem !important; }
              .grid { display: grid !important; }
              .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
              .gap-2 { gap: 0.15rem !important; }
              .pl-4 { padding-left: 0.75rem !important; }
              .border-t { border-top: 1px solid #cbd5e1 !important; }
              .border-b { border-bottom: 1px solid #cbd5e1 !important; }
              .border-dashed { border-style: dashed !important; }
              .text-xs { font-size: 11.5px !important; }
              .text-[10px] { font-size: 9px !important; }
              .italic { font-style: italic !important; }
              .block { display: block !important; }
              .mt-0\\.5 { margin-top: 0.08rem !important; }
              .mb-10, .mb-16 { margin-bottom: 1rem !important; }
              .overflow-x-auto { overflow: visible !important; }
              .w-full { width: 100% !important; }
              .w-32 { width: 8rem !important; }
              .h-\\[1px\\] { height: 1px !important; }
              .bg-black { background-color: #000 !important; }
              .mx-auto { margin-left: auto !important; margin-right: auto !important; }
              
              /* Table styling */
              table {
                width: 100% !important;
                border-collapse: collapse !important;
                margin-top: 5px !important;
                margin-bottom: 6px !important;
                border: 1px solid #000 !important;
              }
              th {
                background-color: #f8fafc !important;
                border-bottom: 1px solid #000 !important;
                font-weight: bold !important;
                padding: 4px 6px !important;
                font-size: 11.5px !important;
                text-align: left;
                color: #000 !important;
              }
              th:first-child {
                text-align: left;
              }
              th.text-center, td.text-center {
                text-align: center !important;
              }
              th.text-right, td.text-right {
                text-align: right !important;
              }
              td {
                padding: 4px 6px !important;
                border-bottom: 1px solid #ddd !important;
                font-size: 11.5px !important;
                color: #000 !important;
              }
              
              /* Signature section formatting */
              .signature-section {
                display: flex !important;
                flex-direction: row !important;
                flex-wrap: nowrap !important;
                justify-content: space-between !important;
                align-items: flex-start !important;
                width: 100% !important;
                margin-top: 1rem !important;
                page-break-inside: avoid !important;
              }
              .signature-section > div {
                width: 45% !important;
                min-width: 45% !important;
                text-align: center !important;
                display: block !important;
              }
              
              /* Force grid double columns inside print */
              .grid-cols-1.sm\\:grid-cols-2 {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              }
              .sm\\:col-span-2 {
                grid-column: span 2 / span 2 !important;
              }
            </style>
          </head>
          <body>
            <div class="print-contract-container">
              ${printContent}
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            <\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    };

    const copyAndShareZalo = async () => {
      if (!invoice.value) return;
      const inv = invoice.value;
      const tenantName = inv.contract?.tenant?.fullName || 'Khách thuê';
      const roomNum = inv.contract?.room?.roomNumber || '';
      const bhName = inv.contract?.room?.boardingHouse?.name || '';
      const start = formatDate(inv.billingPeriodStart);
      const end = formatDate(inv.billingPeriodEnd);

      let msg = `[HÓA ĐƠN TIỀN PHÒNG & DỊCH VỤ]\n`;
      msg += `Kính gửi Anh/Chị ${tenantName},\n`;
      msg += `Thông tin hóa đơn tiền phòng (Kỳ tính tiền: ${start} - ${end}):\n`;
      msg += `- Phòng: Phòng ${roomNum} (${bhName})\n`;
      msg += `- Tiền phòng: ${formatMoney(inv.roomPrice)} đ\n`;

      const elecUsage = inv.newElectricityIndex - inv.oldElectricityIndex;
      msg += `- Tiền điện: ${formatMoney(elecUsage * inv.electricityRate)} đ (Chỉ số: ${inv.oldElectricityIndex} -> ${inv.newElectricityIndex} kWh, Tiêu thụ: ${elecUsage} kWh)\n`;

      // Use snapshot water billing type from invoice
      const waterBillingType = inv.waterBillingType || inv.contract?.room?.boardingHouse?.waterBillingType;
      if (waterBillingType === 'BY_INDEX') {
        const waterUsage = inv.newWaterIndex - inv.oldWaterIndex;
        msg += `- Tiền nước: ${formatMoney(waterUsage * inv.waterRate)} đ (Chỉ số: ${inv.oldWaterIndex} -> ${inv.newWaterIndex} m³, Tiêu thụ: ${waterUsage} m³)\n`;
      } else { // FIXED_PER_PERSON
        const tenants = inv.numberOfTenants || inv.contract?.numberOfTenants || 1;
        msg += `- Tiền nước: ${formatMoney(tenants * inv.waterRate)} đ (Cố định: ${tenants} người)\n`;
      }

      if (invoiceItems.value && invoiceItems.value.length > 0) {
        msg += `- Phụ phí & Dịch vụ đi kèm:\n`;
        invoiceItems.value.forEach(item => {
          msg += `  + ${item.name}: ${formatMoney(item.subtotal)} đ (${formatMoney(item.price)} đ x ${item.quantity})\n`;
        });
      }

      if (inv.discount > 0) {
        msg += `- Giảm giá: -${formatMoney(inv.discount)} đ\n`;
      }

      msg += `-----------------------------------\n`;
      msg += `TỔNG CỘNG CẦN ĐÓNG: ${formatMoney(inv.totalAmount)} đ\n`;
      msg += `Đã đóng: ${formatMoney(inv.paidAmount)} đ\n`;
      msg += `Còn nợ: ${formatMoney(inv.totalAmount - inv.paidAmount)} đ\n`;

      const bh = inv.contract?.room?.boardingHouse;
      if (bh && bh.payosClientId) {
        msg += `\n- Hình thức thanh toán: Thanh toán trực tuyến qua cổng PayOS (Vui lòng truy cập hệ thống để thanh toán).\n`;
      } else {
        msg += `\n- Hình thức thanh toán: Vui lòng thanh toán trực tiếp bằng tiền mặt cho chủ trọ.\n`;
      }

      msg += `\nAnh/Chị vui lòng kiểm tra và thanh toán sớm. Xin cảm ơn!`;

      try {
        await navigator.clipboard.writeText(msg);
        showAlert('Đã sao chép', 'Đã sao chép nội dung hóa đơn vào bộ nhớ tạm! Hệ thống sẽ mở Zalo để gửi cho khách thuê.', 'success');
      } catch (err) {
      }

      const phone = inv.contract?.tenant?.phone;
      if (phone) {
        let cleanPhone = phone.replace(/[\s.-]/g, '');
        if (cleanPhone.startsWith('+84')) {
          cleanPhone = '0' + cleanPhone.substring(3);
        } else if (cleanPhone.startsWith('84') && cleanPhone.length > 9) {
          cleanPhone = '0' + cleanPhone.substring(2);
        }
        window.open(`https://zalo.me/${cleanPhone}`, '_blank');
      } else {
        showAlert('Thiếu thông tin', 'Khách thuê chưa đăng ký số điện thoại trên hệ thống!', 'warning');
      }
    };

    const navigateToTenant = (tenantId) => {
      if (isLandlord.value && tenantId) {
        router.push(`/landlord/tenants/${tenantId}`);
      }
    };

    const loadingPayos = ref(false);

    const payWithPayos = async () => {
      if (!invoice.value) return;
      loadingPayos.value = true;
      try {
        const res = await invoiceService.getPayosLink(invoice.value.id, {
          returnUrl: window.location.href,
          cancelUrl: window.location.href
        });
        if (res.data && res.data.checkoutUrl) {
          window.location.href = res.data.checkoutUrl;
        } else {
          throw new Error("Không nhận được link thanh toán từ hệ thống");
        }
      } catch (err) {
        showAlert('Lỗi', err.response?.data?.error || err.message || 'Lỗi kết nối cổng thanh toán PayOS', 'danger');
      } finally {
        loadingPayos.value = false;
      }
    };

    onMounted(() => {
      fetchInvoiceDetail();
      
      // Kiểm tra tham số từ cổng thanh toán PayOS chuyển hướng về
      if (route.query.status === 'PAID' || route.query.code === '00') {
        showAlert('Thành công', 'Thanh toán tiền phòng qua cổng PayOS thành công!', 'success');
        router.replace({ query: {} });
      } else if (route.query.status === 'CANCELLED' || route.query.cancel === 'true') {
        showAlert('Thông tin', 'Giao dịch thanh toán qua PayOS đã được hủy.', 'info');
        router.replace({ query: {} });
      }
    });

    return {
      invoice,
      invoiceItems,
      loading,
      isLandlord,
      showPayModal,
      payForm,
      navigateToTenant,
      formatMoney,
      formatDate,
      goBack,
      openPayModal,
      closePayModal,
      submitPayment,
      quickPayInvoice,
      printInvoice,
      copyAndShareZalo,
      activeTab,
      showPreviewModal,
      confirmModal,
      onConfirmModal,
      closeConfirmModal,
      paymentNotified,
      sendPaymentNotification,
      loadingPayos,
      payWithPayos,
    };
  }
};
