import { ref, reactive, onMounted } from 'vue';
import subscriptionService from '../../services/subscriptionService.js';
import FormInput from '../../components/ui/FormInput.vue';
import FormButton from '../../components/ui/FormButton.vue';
import Checkbox from '../../components/ui/Checkbox.vue';
import Modal from '../../components/ui/Modal.vue';
import ConfirmModal from '../../components/ui/ConfirmModal.vue';
import MoneyDisplay from '../../components/ui/MoneyDisplay.vue';

export default {
  name: 'AdminPackages',
  components: {
    FormInput,
    FormButton,
    Checkbox,
    Modal,
    ConfirmModal,
    MoneyDisplay
  },
  setup() {
    const loading = ref(true);
    const saving = ref(false);
    const packages = ref([]);

    // Create/Edit Modal state
    const modal = reactive({
      show: false,
      isEdit: false,
      editingId: null,
      form: {
        name: '',
        months: null,
        price: null,
        description: '',
        active: true
      }
    });

    // Delete confirmation modal state
    const confirmModal = reactive({
      show: false,
      title: '',
      message: '',
      type: 'danger',
      confirmText: 'Xác nhận xóa',
      cancelText: 'Hủy bỏ',
      showCancel: true,
      packageToDelete: null
    });

    // Load all packages for admin
    const loadPackages = async () => {
      loading.value = true;
      try {
        const res = await subscriptionService.getAdminPackages();
        packages.value = res.data;
      } catch (err) {
        alert(err.response?.data?.error || 'Lỗi khi tải danh sách gói cước!');
      } finally {
        loading.value = false;
      }
    };

    // Open create package modal
    const openCreateModal = () => {
      modal.isEdit = false;
      modal.editingId = null;
      modal.form.name = '';
      modal.form.months = null;
      modal.form.price = null;
      modal.form.description = '';
      modal.form.active = true;
      modal.show = true;
    };

    // Open edit package modal
    const openEditModal = (pack) => {
      modal.isEdit = true;
      modal.editingId = pack.id;
      modal.form.name = pack.name;
      modal.form.months = pack.months;
      modal.form.price = pack.price;
      modal.form.description = pack.description || '';
      modal.form.active = pack.active;
      modal.show = true;
    };

    // Close create/edit modal
    const closeModal = () => {
      modal.show = false;
    };

    // Save package (create or update)
    const savePackage = async () => {
      // Basic validations
      if (!modal.form.name || modal.form.name.trim() === '') {
        alert('Tên gói cước không được để trống!');
        return;
      }
      if (!modal.form.months || modal.form.months <= 0) {
        alert('Số tháng phải lớn hơn 0!');
        return;
      }
      if (modal.form.price === null || modal.form.price < 0) {
        alert('Giá tiền không được nhỏ hơn 0!');
        return;
      }

      saving.value = true;
      try {
        if (modal.isEdit) {
          await subscriptionService.updatePackage(modal.editingId, modal.form);
          alert('Cập nhật gói cước thành công!');
        } else {
          await subscriptionService.createPackage(modal.form);
          alert('Thêm gói cước mới thành công!');
        }
        closeModal();
        await loadPackages();
      } catch (err) {
        alert(err.response?.data?.error || 'Không thể lưu thông tin gói cước!');
      } finally {
        saving.value = false;
      }
    };

    // Confirm deletion request
    const handleDeleteClick = (pack) => {
      confirmModal.packageToDelete = pack;
      confirmModal.title = 'Xóa gói cước';
      confirmModal.message = `Bạn có chắc chắn muốn xóa gói cước "${pack.name}"? Hành động này không thể hoàn tác.`;
      confirmModal.show = true;
    };

    // Action on confirm deletion
    const onConfirmDelete = async () => {
      const pack = confirmModal.packageToDelete;
      if (!pack) return;

      try {
        await subscriptionService.deletePackage(pack.id);
        alert('Xóa gói cước thành công!');
        closeConfirmModal();
        await loadPackages();
      } catch (err) {
        alert(err.response?.data?.error || 'Xóa gói cước thất bại!');
      }
    };

    // Close deletion confirm modal
    const closeConfirmModal = () => {
      confirmModal.show = false;
      confirmModal.packageToDelete = null;
    };

    onMounted(() => {
      loadPackages();
    });

    return {
      loading,
      saving,
      packages,
      modal,
      confirmModal,
      openCreateModal,
      openEditModal,
      closeModal,
      savePackage,
      handleDeleteClick,
      onConfirmDelete,
      closeConfirmModal
    };
  }
};
