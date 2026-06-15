<template>
  <div class="p-4 sm:p-6 md:p-8 bg-bg-main min-h-full flex flex-col gap-6">
    <!-- Header Block -->
    <div class="mb-2 pb-4 border-b border-border-main flex justify-between items-center flex-wrap gap-4">
      <div>
        <h2 class="text-base sm:text-lg font-bold text-text-main flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-primary">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Quản Lý Gói Nâng Cấp</span>
        </h2>
        <p class="text-[11px] text-text-sub mt-1">Tạo, sửa, xóa và cấu hình các gói gia hạn dịch vụ tài khoản của chủ trọ.</p>
      </div>

      <div>
        <FormButton
          @click="openCreateModal"
          variant="primary"
          size="md"
          class="flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Thêm gói mới
        </FormButton>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="bg-card border border-border-main rounded-2xl p-6 shadow-xs">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4 text-text-sub">
        <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span>Đang tải danh sách gói cước...</span>
      </div>

      <!-- Table Content -->
      <div v-else>
        <div class="overflow-x-auto border border-border-main/50 rounded-xl bg-card">
          <table class="w-full text-sm text-left text-text-main border-collapse">
            <thead class="bg-slate-50 dark:bg-slate-900/40 border-b border-border-main/60">
              <tr class="text-[11px] uppercase tracking-wider text-text-sub font-bold">
                <th class="py-3 px-4">Tên gói cước</th>
                <th class="py-3 px-4">Thời hạn (Tháng)</th>
                <th class="py-3 px-4">Giá tiền (VNĐ)</th>
                <th class="py-3 px-4">Mô tả</th>
                <th class="py-3 px-4">Trạng thái</th>
                <th class="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pack in packages" :key="pack.id" class="border-b border-border-main/30 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all duration-150 text-sm">
                <td class="py-3.5 px-4 font-bold text-primary">{{ pack.name }}</td>
                <td class="py-3.5 px-4 font-semibold text-text-main">{{ pack.months }} tháng</td>
                <td class="py-3.5 px-4 font-bold text-text-main"><MoneyDisplay :value="pack.price" /></td>
                <td class="py-3.5 px-4 text-text-sub max-w-[200px] truncate" :title="pack.description">
                  {{ pack.description || 'Chưa có mô tả' }}
                </td>
                <td class="py-3.5 px-4">
                  <span :class="['inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border',
                    pack.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  ]">
                    {{ pack.active ? 'Hoạt động' : 'Tắt' }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-right">
                  <div class="flex justify-end gap-2">
                    <button
                      @click="openEditModal(pack)"
                      class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-text-sub hover:text-primary transition duration-150 cursor-pointer"
                      title="Sửa"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 20.08a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button
                      @click="handleDeleteClick(pack)"
                      class="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-text-sub hover:text-rose-600 dark:hover:text-rose-400 transition duration-150 cursor-pointer"
                      title="Xóa"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="packages.length === 0">
                <td colspan="6" class="text-center text-text-sub py-16 italic text-xs">
                  Không tìm thấy gói cước nào. Vui lòng nhấn "Thêm gói mới" để bắt đầu.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- CREATE/UPDATE MODAL -->
    <Modal
      v-if="modal.show"
      :title="modal.isEdit ? 'Chỉnh sửa gói cước' : 'Thêm gói cước mới'"
      @close="closeModal"
      max-width="md"
    >
      <form @submit.prevent="savePackage" class="space-y-4">
        <FormInput
          type="text"
          label="Tên gói cước"
          v-model="modal.form.name"
          placeholder="Ví dụ: Gói Cơ Bản 3 Tháng, Premium Đặc Biệt..."
          required
        />

        <div class="grid grid-cols-2 gap-4">
          <FormInput
            type="number"
            label="Số tháng thời hạn"
            v-model.number="modal.form.months"
            placeholder="Nhập số tháng"
            min="1"
            required
          />
          <FormInput
            type="number"
            label="Giá tiền (VNĐ)"
            v-model.number="modal.form.price"
            placeholder="Nhập số tiền"
            min="0"
            required
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-text-sub uppercase">Mô tả chi tiết</label>
          <textarea
            v-model="modal.form.description"
            placeholder="Mô tả các ưu đãi của gói..."
            rows="3"
            class="w-full border border-border-main rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900 text-text-main outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-primary transition-all duration-150 text-sm resize-none"
          ></textarea>
        </div>

        <div class="pt-2">
          <Checkbox
            v-model="modal.form.active"
            label="Kích hoạt gói dịch vụ"
            description="Chủ trọ sẽ nhìn thấy và chọn được gói này nếu ở trạng thái hoạt động"
          />
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-border-main/60">
          <FormButton type="button" variant="secondary" @click="closeModal" :disabled="saving">
            Hủy bỏ
          </FormButton>
          <FormButton type="submit" variant="primary" :loading="saving">
            {{ modal.isEdit ? 'Cập nhật' : 'Thêm mới' }}
          </FormButton>
        </div>
      </form>
    </Modal>

    <!-- CONFIRM DELETE MODAL -->
    <ConfirmModal
      :show="confirmModal.show"
      :title="confirmModal.title"
      :message="confirmModal.message"
      :type="confirmModal.type"
      :confirm-text="confirmModal.confirmText"
      :cancel-text="confirmModal.cancelText"
      :show-cancel="confirmModal.showCancel"
      @confirm="onConfirmDelete"
      @cancel="closeConfirmModal"
    />
  </div>
</template>

<script src="./AdminPackages.js"></script>
