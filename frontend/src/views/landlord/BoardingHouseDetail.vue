<template>
  <div class="p-4 bg-bg-main min-h-full">
    <!-- Header Block -->
    <div class="mb-6 pb-4 border-b border-border-main flex flex-col gap-4">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-2">
          <FormButton @click="goBack" variant="secondary" class="!p-1.5">
            <AppIcon name="arrow-left" class="text-text-sub !w-4 !h-4" />
          </FormButton>
          <h2 class="text-base sm:text-xl font-bold text-text-main flex items-center gap-2 flex-wrap">
            <span v-if="house" class="text-primary">{{ house.name }}</span>
          </h2>
        </div>
      </div>

      <!-- Tab Switcher -->
      <div v-if="house" class="flex flex-row items-center justify-between gap-2 w-full flex-nowrap">
        <div class="flex border border-border-main rounded-lg p-0.5 bg-slate-50 dark:bg-slate-900/60 w-fit shrink-0">
          <button type="button" @click="activeTab = 'info'"
            :class="['px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer', activeTab === 'info' ? 'bg-white dark:bg-slate-800 text-primary shadow-xs' : 'text-text-sub hover:text-text-main']">
            Thông tin<span class="hidden sm:inline"> chung</span>
          </button>
          <button type="button" @click="activeTab = 'fees'"
            :class="['px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer', activeTab === 'fees' ? 'bg-white dark:bg-slate-800 text-primary shadow-xs' : 'text-text-sub hover:text-text-main']">
            Dịch vụ<span class="hidden sm:inline"> &amp; Phí</span>
            <span v-if="form.extraFees.length > 0"
              class="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/15 text-primary text-[9px] font-bold">
              {{ form.extraFees.length }}
            </span>
          </button>
          <button type="button" @click="activeTab = 'rules'"
            :class="['px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer', activeTab === 'rules' ? 'bg-white dark:bg-slate-800 text-primary shadow-xs' : 'text-text-sub hover:text-text-main']">
            Nội quy<span class="hidden sm:inline"> dãy trọ</span>
          </button>
        </div>

        <!-- Action buttons on header -->
        <div class="flex items-center gap-1.5 shrink-0">
          <FormButton type="button" @click="handleDelete" variant="danger" size="sm"
            class="!px-2.5 !py-1.5 flex items-center gap-1.5">
            <AppIcon name="trash" class="!w-4 !h-4" />
            <span class="hidden sm:inline">Xóa dãy trọ</span>
          </FormButton>
          <FormButton type="button" @click="handleSave" variant="primary" size="sm"
            class="!px-2.5 !py-1.5 flex items-center gap-1.5">
            <AppIcon name="check-circle" class="!w-4 !h-4" />
            <span class="hidden sm:inline">Lưu thay đổi</span>
          </FormButton>
        </div>
      </div>
    </div>

    <!-- Loading Spinner -->
    <LoadingState v-if="loading" message="Đang tải dữ liệu dãy trọ..." />

    <!-- Main Content Area -->
    <div v-else-if="house">
      <div class="bg-card border border-border-main rounded-2xl shadow-xs overflow-hidden">
        <form @submit.prevent="handleSave">

          <!-- TAB 1: THONG TIN CHUNG -->
          <div v-show="activeTab === 'info'" class="p-6 space-y-5">
            <h3
              class="text-sm font-bold text-text-main border-b border-border-main pb-3 mb-4 flex items-center gap-2">
              <AppIcon name="coin" class="text-primary !w-4 !h-4" />
              <span>Thông tin cơ bản &amp; Giá mặc định</span>
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormInput type="text" label="Tên dãy trọ" v-model="form.name"
                  placeholder="Ví dụ: Nhà trọ Green House" required />
              </div>
              <div>
                <FormInput type="text" label="Địa chỉ" v-model="form.address"
                  placeholder="Nhập địa chỉ chi tiết" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <FormInput type="number" label="Giá điện mặc định (đ/kWh)" v-model="form.defaultElectricityRate"
                  min="0" required />
              </div>
              <div>
                <FormInput type="number" label="Giá nước mặc định" v-model="form.defaultWaterRate" min="0"
                  required />
              </div>
              <div>
                <FormSelect label="Cách tính tiền nước" v-model="form.waterBillingType" required>
                  <option value="BY_INDEX">Tính theo chỉ số đồng hồ</option>
                  <option value="FIXED_PER_PERSON">Cố định theo đầu người</option>
                </FormSelect>
              </div>
              <div>
                <FormInput type="number" label="Ngày tính tiền cố định" v-model="form.fixedBillingDay" min="1"
                  max="31" />
              </div>
            </div>

            <!-- Cau hinh thanh toan PayOS -->
            <div class="pt-4 border-t border-border-main">
              <h4 class="text-xs font-bold text-text-main uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>Cấu Hình Thanh Toán Tự Động PayOS</span>
                <span
                  class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                  Khuyên dùng
                </span>
              </h4>

              <!-- Huong dan (collapsible) -->
              <div class="mb-4">
                <button type="button" @click="showPayosGuide = !showPayosGuide"
                  class="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline cursor-pointer mb-2">
                  <span>{{ showPayosGuide ? '▾' : '▸' }}</span>
                  <span>{{ showPayosGuide ? 'Ẩn hướng dẫn' : 'Xem hướng dẫn tích hợp PayOS' }}</span>
                </button>

                <div v-if="showPayosGuide"
                  class="p-4 bg-slate-50 dark:bg-slate-900 border border-border-main rounded-xl text-xs text-text-sub space-y-2">
                  <p class="leading-relaxed">Khách thuê quét mã QR chuyển khoản để thanh toán tiền phòng. Tiền
                    chuyển thẳng về tài khoản ngân hàng của bạn ngay lập tức, hệ thống tự động gạch nợ hóa đơn mà
                    không cần xác nhận thủ công.</p>
                  <div class="flex flex-col gap-2 pt-1">
                    <span class="font-semibold text-text-main text-[11px]">Các bước thực hiện:</span>
                    <ol class="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                      <li>Truy cập <a href="https://my.payos.vn/" target="_blank"
                          class="text-primary hover:underline font-bold">my.payos.vn</a> đăng ký tài khoản và liên
                        kết ngân hàng nhận tiền của bạn.</li>
                      <li>Vào mục <strong>"Kết nối kênh thanh toán"</strong> trên Dashboard PayOS để tạo một kênh
                        mới.</li>
                      <li>Cấu hình địa chỉ Webhook: <code
                          class="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[10px]">https://[domain-cua-ban]/api/payment/payos-webhook</code>
                      </li>
                      <li>Sao chép 3 tham số: <strong>Client ID</strong>, <strong>API Key</strong>,
                        <strong>Checksum Key</strong> và điền vào ô bên dưới.</li>
                    </ol>
                  </div>
                  <div class="pt-2">
                    <a href="https://my.payos.vn/" target="_blank"
                      class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-hover active:scale-95 transition-all">
                      Đăng ký &amp; Cấu hình tại my.payos.vn ↗
                    </a>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <FormInput type="text" label="Client ID" v-model="form.payosClientId"
                    placeholder="Nhập Client ID từ PayOS" />
                </div>
                <div>
                  <FormInput type="password" label="API Key" v-model="form.payosApiKey"
                    placeholder="Nhập API Key từ PayOS" />
                </div>
                <div>
                  <FormInput type="password" label="Checksum Key" v-model="form.payosChecksumKey"
                    placeholder="Nhập Checksum Key từ PayOS" />
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: DICH VU & PHI DINH KY -->
          <div v-show="activeTab === 'fees'" class="p-6">
            <div class="flex items-center justify-between border-b border-border-main pb-3 mb-5">
              <h3 class="text-sm font-bold text-text-main m-0 flex items-center gap-2">
                <span>Dịch vụ &amp; Phụ phí định kỳ</span>
                <span v-if="form.extraFees.length > 0"
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {{ form.extraFees.length }} dịch vụ
                </span>
              </h3>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Add form -->
              <div
                class="bg-slate-50/60 dark:bg-slate-900/30 border border-border-main/60 rounded-xl p-5 h-fit">
                <p class="text-[10px] font-semibold text-text-sub uppercase tracking-wider mb-3">Thêm dịch vụ
                  mới</p>
                <div class="flex flex-col gap-3">
                  <FormInput type="text" v-model="newFee.name"
                    placeholder="Tên dịch vụ (Wifi, rác, gửi xe...)" size="sm" />
                  <div class="flex gap-2">
                    <FormInput type="number" v-model="newFee.defaultPrice" placeholder="Đơn giá (đ)" min="0"
                      size="sm" class="flex-1" />
                    <FormSelect v-model="newFee.unitType" size="sm" class="flex-1">
                      <option value="FIXED_PER_ROOM">đ / phòng</option>
                      <option value="FIXED_PER_PERSON">đ / người</option>
                    </FormSelect>
                  </div>
                  <FormButton type="button" @click="addExtraFeeRow" variant="primary" size="sm"
                    class="w-full !py-2 flex items-center justify-center gap-1.5"
                    :disabled="!newFee.name || !newFee.defaultPrice">
                    <span class="text-base leading-none">+</span>
                    <span>Thêm dịch vụ</span>
                  </FormButton>
                </div>
                <div class="mt-4 pt-4 border-t border-border-main/40">
                  <p class="text-[11px] text-text-sub leading-relaxed">
                    Các dịch vụ cấu hình ở đây sẽ được áp dụng mặc định cho tất cả phòng trong dãy trọ.
                  </p>
                </div>
              </div>

              <!-- Fee list -->
              <div>
                <div v-if="form.extraFees.length === 0"
                  class="flex flex-col items-center justify-center py-12 text-center gap-2.5 border border-dashed border-border-main rounded-xl">
                  <span class="text-3xl opacity-40">📋</span>
                  <p class="text-xs text-text-sub leading-relaxed">
                    Chưa có dịch vụ nào.<br />
                    <span class="text-[11px]">Ví dụ: Wifi 100.000đ/phòng, Rác 20.000đ/người...</span>
                  </p>
                </div>

                <div v-else class="flex flex-col gap-0 border border-border-main rounded-xl overflow-hidden">
                  <div v-for="(ef, index) in form.extraFees" :key="index"
                    class="flex items-start gap-2 px-4 py-3 group border-b border-border-main/40 last:border-b-0 hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors">
                    <span
                      class="mt-1 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                      {{ index + 1 }}
                    </span>
                    <div class="flex-1 flex flex-col gap-1.5 min-w-0">
                      <FormInput type="text" v-model="ef.name" placeholder="Tên dịch vụ" size="sm" />
                      <div class="flex gap-1.5">
                        <FormInput type="number" v-model="ef.defaultPrice" placeholder="Đơn giá" min="0"
                          size="sm" class="flex-1" />
                        <FormSelect v-model="ef.unitType" size="sm" class="flex-1">
                          <option value="FIXED_PER_ROOM">đ/phòng</option>
                          <option value="FIXED_PER_PERSON">đ/người</option>
                        </FormSelect>
                      </div>
                    </div>
                    <FormButton type="button" @click="removeExtraFeeRow(index)" variant="danger" size="sm"
                      class="!p-1.5 mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <AppIcon name="trash" size="sm" />
                    </FormButton>
                  </div>

                  <!-- Footer total -->
                  <div
                    class="flex justify-between items-center px-4 py-3 bg-primary/5 border-t border-primary/20">
                    <span class="text-xs text-text-sub font-medium">Tổng phí/phòng/tháng:</span>
                    <span class="text-sm font-bold text-primary">
                      <MoneyDisplay
                        :value="form.extraFees.filter(f => f.unitType === 'FIXED_PER_ROOM').reduce((s, f) => s + (Number(f.defaultPrice) || 0), 0)"
                        type="primary" suffix="đ" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 3: NOI QUY DAY TRO -->
          <div v-show="activeTab === 'rules'" class="p-6 space-y-5">
            <div class="flex justify-between items-center border-b border-border-main pb-3 mb-4">
              <h3 class="text-sm font-bold text-text-main m-0 flex items-center gap-2">
                <AppIcon name="contract" class="text-primary !w-4 !h-4" />
                <span>Quy định &amp; Nội quy lưu trú</span>
              </h3>
              <FormButton type="button" @click="showRuleBuilder = !showRuleBuilder" variant="secondary" size="sm"
                class="!px-2.5 !py-1 text-xs">
                {{ showRuleBuilder ? 'Ẩn bộ tạo mẫu' : '🪄 Tạo nhanh theo mẫu' }}
              </FormButton>
            </div>

            <!-- Quick rule template builder panel -->
            <div v-if="showRuleBuilder"
              class="mb-4 p-4 bg-slate-50 dark:bg-slate-900 border border-border-main rounded-xl space-y-3 text-xs">
              <div class="font-semibold text-text-main mb-2">Chọn các quy định &amp; thiết lập thông số:</div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- Curfew -->
                <div class="space-y-1.5">
                  <label class="flex items-center gap-2 font-medium text-text-main cursor-pointer">
                    <input type="checkbox" v-model="ruleTemplate.enabledCurfew"
                      class="rounded border-border-main text-primary focus:ring-primary/25" />
                    <span>Giờ giới nghiêm (Curfew)</span>
                  </label>
                  <div v-if="ruleTemplate.enabledCurfew"
                    class="flex gap-2 items-center pl-5 text-[11px] text-text-sub">
                    <span>Khóa cổng từ</span>
                    <input type="text" v-model="ruleTemplate.curfewStart"
                      class="w-14 px-1.5 py-0.5 border border-border-main bg-card text-text-main rounded text-center" />
                    <span>đến</span>
                    <input type="text" v-model="ruleTemplate.curfewEnd"
                      class="w-14 px-1.5 py-0.5 border border-border-main bg-card text-text-main rounded text-center" />
                  </div>
                  <div v-if="ruleTemplate.enabledCurfew" class="pl-5">
                    <label class="flex items-center gap-1.5 font-normal text-text-sub cursor-pointer text-[11px]">
                      <input type="checkbox" v-model="ruleTemplate.selfUnlock"
                        class="rounded border-border-main text-primary focus:ring-primary/25" />
                      <span>Về trễ tự mở khóa (vân tay/khóa riêng)</span>
                    </label>
                  </div>
                </div>

                <!-- Drying area -->
                <div class="space-y-1.5">
                  <label class="flex items-center gap-2 font-medium text-text-main cursor-pointer">
                    <input type="checkbox" v-model="ruleTemplate.enabledDryingArea"
                      class="rounded border-border-main text-primary focus:ring-primary/25" />
                    <span>Sân phơi đồ tự do</span>
                  </label>
                </div>

                <!-- Quiet hours -->
                <div class="space-y-1.5">
                  <label class="flex items-center gap-2 font-medium text-text-main cursor-pointer">
                    <input type="checkbox" v-model="ruleTemplate.enabledNoised"
                      class="rounded border-border-main text-primary focus:ring-primary/25" />
                    <span>Hạn chế tiếng ồn</span>
                  </label>
                  <div v-if="ruleTemplate.enabledNoised"
                    class="flex gap-2 items-center pl-5 text-[11px] text-text-sub">
                    <span>Yêu cầu yên lặng sau</span>
                    <input type="text" v-model="ruleTemplate.noisedStart"
                      class="w-14 px-1.5 py-0.5 border border-border-main bg-card text-text-main rounded text-center" />
                  </div>
                </div>

                <!-- Overnight guests -->
                <div class="space-y-1.5">
                  <label class="flex items-center gap-2 font-medium text-text-main cursor-pointer">
                    <input type="checkbox" v-model="ruleTemplate.enabledOvernight"
                      class="rounded border-border-main text-primary focus:ring-primary/25" />
                    <span>Khách ở qua đêm</span>
                  </label>
                  <div v-if="ruleTemplate.enabledOvernight"
                    class="flex gap-1.5 items-center pl-5 text-[11px] text-text-sub">
                    <span>Phí lưu trú</span>
                    <input type="number" v-model="ruleTemplate.overnightFee"
                      class="w-20 px-1.5 py-0.5 border border-border-main bg-card text-text-main rounded text-right" />
                    <span>đ/đêm</span>
                  </div>
                </div>

                <!-- Trash hours -->
                <div class="space-y-1.5">
                  <label class="flex items-center gap-2 font-medium text-text-main cursor-pointer">
                    <input type="checkbox" v-model="ruleTemplate.enabledTrash"
                      class="rounded border-border-main text-primary focus:ring-primary/25" />
                    <span>Quy định đổ rác</span>
                  </label>
                  <div v-if="ruleTemplate.enabledTrash"
                    class="flex gap-2 items-center pl-5 text-[11px] text-text-sub">
                    <span>Đổ rác trước</span>
                    <input type="text" v-model="ruleTemplate.trashTime"
                      class="w-14 px-1.5 py-0.5 border border-border-main bg-card text-text-main rounded text-center" />
                  </div>
                </div>

                <!-- Pets policy -->
                <div class="space-y-1.5">
                  <label class="flex items-center gap-2 font-medium text-text-main cursor-pointer">
                    <input type="checkbox" v-model="ruleTemplate.enabledPets"
                      class="rounded border-border-main text-primary focus:ring-primary/25" />
                    <span>Chính sách nuôi thú cưng</span>
                  </label>
                  <div v-if="ruleTemplate.enabledPets" class="pl-5 text-[11px]">
                    <select v-model="ruleTemplate.petsPolicy"
                      class="px-2 py-0.5 border border-border-main bg-card text-text-main rounded outline-none focus:border-primary">
                      <option value="NO_PETS">Nghiêm cấm hoàn toàn</option>
                      <option value="ALLOWED_CONDITIONAL">Cho phép (có điều kiện)</option>
                    </select>
                  </div>
                </div>

                <!-- PCCC -->
                <div class="space-y-1.5">
                  <label class="flex items-center gap-2 font-medium text-text-main cursor-pointer">
                    <input type="checkbox" v-model="ruleTemplate.enabledPccc"
                      class="rounded border-border-main text-primary focus:ring-primary/25" />
                    <span>Tuân thủ an toàn PCCC</span>
                  </label>
                </div>

                <!-- Vehicles -->
                <div class="space-y-1.5">
                  <label class="flex items-center gap-2 font-medium text-text-main cursor-pointer">
                    <input type="checkbox" v-model="ruleTemplate.enabledVehicle"
                      class="rounded border-border-main text-primary focus:ring-primary/25" />
                    <span>Đỗ xe đúng quy định</span>
                  </label>
                </div>

                <!-- Register -->
                <div class="space-y-1.5">
                  <label class="flex items-center gap-2 font-medium text-text-main cursor-pointer">
                    <input type="checkbox" v-model="ruleTemplate.enabledRegister"
                      class="rounded border-border-main text-primary focus:ring-primary/25" />
                    <span>Nghĩa vụ đăng ký tạm trú</span>
                  </label>
                </div>

                <!-- Social evils -->
                <div class="space-y-1.5">
                  <label class="flex items-center gap-2 font-medium text-text-main cursor-pointer">
                    <input type="checkbox" v-model="ruleTemplate.enabledSocialEvils"
                      class="rounded border-border-main text-primary focus:ring-primary/25" />
                    <span>Cấm tệ nạn xã hội (ma túy, cờ bạc...)</span>
                  </label>
                </div>

                <!-- Common hygiene -->
                <div class="space-y-1.5">
                  <label class="flex items-center gap-2 font-medium text-text-main cursor-pointer">
                    <input type="checkbox" v-model="ruleTemplate.enabledCommonHygiene"
                      class="rounded border-border-main text-primary focus:ring-primary/25" />
                    <span>Giữ gìn vệ sinh khu vực chung</span>
                  </label>
                </div>

                <!-- Room equipments -->
                <div class="space-y-1.5">
                  <label class="flex items-center gap-2 font-medium text-text-main cursor-pointer">
                    <input type="checkbox" v-model="ruleTemplate.enabledRoomEquipments"
                      class="rounded border-border-main text-primary focus:ring-primary/25" />
                    <span>Bảo quản vật dụng trong phòng</span>
                  </label>
                </div>
              </div>

              <!-- Apply button -->
              <div class="flex justify-end pt-2 border-t border-border-main/40 mt-3">
                <FormButton type="button" @click="applyRulesTemplate" variant="primary" size="sm"
                  class="!px-3 !py-1 text-xs">
                  Áp dụng mẫu này
                </FormButton>
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-xs font-semibold text-text-main mb-1.5">Nội quy chi tiết (Dạng văn
                bản):</label>
              <textarea v-model="form.rules" rows="16" placeholder="Nhập nội quy của dãy trọ tại đây..."
                class="w-full px-3 py-2.5 text-xs border border-border-main bg-card text-text-main rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 leading-relaxed font-mono"></textarea>
            </div>
          </div>

        </form>
      </div>
    </div>

    <!-- CONFIRM MODAL -->
    <ConfirmModal :show="confirmModal.show" :title="confirmModal.title" :message="confirmModal.message"
      :type="confirmModal.type" :confirm-text="confirmModal.confirmText" :cancel-text="confirmModal.cancelText"
      :show-cancel="confirmModal.showCancel" @confirm="onConfirmModal" @cancel="closeConfirmModal" />
  </div>
</template>

<script src="./BoardingHouseDetail.js"></script>
