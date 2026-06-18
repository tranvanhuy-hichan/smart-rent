<template>
  <div class="auth-page">
    <!-- ─── Left brand panel ─── -->
    <div class="auth-brand-panel" aria-hidden="true">
      <!-- Decorative blobs -->
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>

      <div class="brand-content">
        <div class="brand-logo">
          <img src="/logo.ico" alt="Smart Rent Logo" width="56" height="56" style="border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.25);" />
        </div>
        <h1 class="brand-name">Smart Rent</h1>
        <p class="brand-tagline">Quản lý phòng trọ thông minh</p>

        <div class="brand-features">
          <div class="feature-item">
            <span class="feature-icon">🏠</span>
            <span>Quản lý đa dãy trọ</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📊</span>
            <span>Thống kê doanh thu realtime</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📄</span>
            <span>Hợp đồng & hóa đơn số</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🔔</span>
            <span>Nhắc nhở tự động</span>
          </div>
        </div>
      </div>

      <p class="brand-footer">© 2025 Smart Rent · Tin cậy từ hàng trăm chủ trọ</p>
    </div>

    <!-- ─── Right form panel ─── -->
    <div class="auth-form-panel">
      <!-- Mobile brand header -->
      <div class="mobile-brand">
        <div class="mobile-logo">
          <img src="/logo.ico" alt="Smart Rent Logo" width="32" height="32" style="border-radius: 8px;" />
        </div>
        <span>Smart Rent</span>
      </div>

      <div class="form-box">
        <div class="form-header">
          <h2 class="form-title">Chào mừng trở lại</h2>
          <p class="form-subtitle">Đăng nhập để tiếp tục quản lý</p>
        </div>

        <!-- Error -->
        <div v-if="error" class="alert alert-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ error }}
        </div>

        <!-- Attempts warning -->
        <div v-if="attemptsWarning" class="alert alert-warning" role="alert">
          ⚠️ {{ attemptsWarning }}
        </div>

        <form @submit.prevent="handleLogin" novalidate autocomplete="on" class="auth-form">
          <!-- Username -->
          <div class="field-group">
            <label class="field-label" for="login-username">Tên đăng nhập</label>
            <div class="input-wrapper">
              <span class="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <input
                id="login-username"
                type="text"
                class="premium-input"
                v-model="username"
                placeholder="Nhập tên đăng nhập"
                autocomplete="username"
                required
              />
            </div>
          </div>

          <!-- Password -->
          <div class="field-group">
            <div class="field-label-row">
              <label class="field-label" for="login-password">Mật khẩu</label>
            </div>
            <div class="input-wrapper">
              <span class="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input
                id="login-password"
                :type="showPassword ? 'text' : 'password'"
                class="premium-input"
                v-model="password"
                placeholder="Nhập mật khẩu"
                autocomplete="current-password"
                required
              />
              <button type="button" class="eye-btn" @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'">
                <svg v-if="showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Submit -->
          <button type="submit" class="btn-premium" :disabled="loading">
            <span v-if="loading" class="btn-loading">
              <span class="spinner-sm"></span>
              Đang xác thực...
            </span>
            <span v-else>Đăng Nhập</span>
          </button>
        </form>

        <!-- Divider + Google -->
        <div class="divider">
          <span>Hoặc đăng nhập bằng</span>
        </div>
        <div id="google-signin-btn" class="google-btn-wrap"></div>

        <!-- Footer links -->
        <p class="form-footer-link">
          Chưa có tài khoản?
          <router-link to="/register">Đăng ký miễn phí</router-link>
        </p>

        <!-- System notice -->
        <div class="system-notice-toggle">
          <button type="button" @click="showSystemNotice = !showSystemNotice" class="notice-btn">
            ⚙️ {{ showSystemNotice ? 'Ẩn' : 'Xem' }} thông báo hệ thống
          </button>
          <transition name="fade">
            <div v-if="showSystemNotice" class="notice-box">
              <strong>⚙️ THÔNG BÁO HỆ THỐNG</strong>
              <p>Hệ thống đang trong quá trình phát triển. Nếu gặp sự cố, xin vui lòng:</p>
              <router-link to="/contact" class="notice-link">✉️ Liên hệ Hỗ trợ &amp; Đóng góp ý kiến</router-link>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./Login.js"></script>

<style scoped>
/* ========================================================
   AUTH PAGE — PREMIUM SPLIT LAYOUT
   ======================================================== */

.auth-page {
  display: flex;
  min-height: 100vh;
  background: #f8f7ff;
}

/* ─── LEFT BRAND PANEL ─── */
.auth-brand-panel {
  position: relative;
  flex: 0 0 420px;
  background: linear-gradient(145deg, #4f46e5 0%, #7c3aed 45%, #a855f7 75%, #ec4899 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 3rem 2.5rem;
  overflow: hidden;
}

@media (max-width: 900px) {
  .auth-brand-panel { display: none; }
}

/* Decorative blobs */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.3;
  pointer-events: none;
}
.blob-1 {
  width: 320px; height: 320px;
  background: #818cf8;
  top: -80px; left: -80px;
}
.blob-2 {
  width: 260px; height: 260px;
  background: #f472b6;
  bottom: 60px; right: -60px;
}
.blob-3 {
  width: 180px; height: 180px;
  background: #34d399;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
}

.brand-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 1rem;
}

.brand-logo {
  display: inline-flex;
  margin-bottom: 1rem;
  filter: drop-shadow(0 8px 24px rgba(0,0,0,0.2));
}

.brand-name {
  font-size: 2.4rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.02em;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.brand-tagline {
  font-size: 1rem;
  color: rgba(255,255,255,0.8);
  font-weight: 400;
  margin-bottom: 2.5rem;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255,255,255,0.92);
  font-size: 0.9rem;
  font-weight: 500;
}

.feature-icon {
  font-size: 1.1rem;
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(8px);
}

.brand-footer {
  position: relative;
  z-index: 2;
  color: rgba(255,255,255,0.55);
  font-size: 0.75rem;
  text-align: center;
}

/* ─── RIGHT FORM PANEL ─── */
.auth-form-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  overflow-y: auto;
}

/* Mobile brand header (only visible when left panel hidden) */
.mobile-brand {
  display: none;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.25rem;
  font-weight: 800;
  color: #4f46e5;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #4f46e5, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.mobile-logo {
  display: flex;
  align-items: center;
  justify-content: center;
}
@media (max-width: 900px) {
  .mobile-brand { display: flex; }
}

/* ─── FORM BOX ─── */
.form-box {
  width: 100%;
  max-width: 400px;
  background: rgba(255,255,255,0.92);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  box-shadow:
    0 4px 6px -1px rgba(79, 70, 229, 0.06),
    0 24px 48px -8px rgba(79, 70, 229, 0.12);
  backdrop-filter: blur(20px);
}

@media (max-width: 480px) {
  .form-box {
    padding: 2rem 1.25rem;
    border-radius: 20px;
  }
}

.form-header {
  text-align: center;
  margin-bottom: 1.75rem;
}

.form-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #1e1b4b;
  letter-spacing: -0.025em;
  margin-bottom: 0.35rem;
}

.form-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
}

/* ─── ALERTS ─── */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.84rem;
  line-height: 1.5;
  margin-bottom: 1.25rem;
}

.alert-error {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #b91c1c;
}

.alert-warning {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  color: #92400e;
}

/* ─── FORM FIELDS ─── */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
  letter-spacing: 0.01em;
}

.field-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 0.9rem;
  color: #9ca3af;
  display: flex;
  pointer-events: none;
  z-index: 1;
}

.premium-input {
  width: 100%;
  padding: 0.72rem 2.75rem 0.72rem 2.6rem;
  border-radius: 12px;
  border: 1.5px solid #e5e7eb;
  background: #fafafa;
  color: #111827;
  font-family: inherit;
  font-size: 0.925rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.premium-input::placeholder {
  color: #c4c4cc;
  font-size: 0.88rem;
}

.premium-input:focus {
  border-color: #7c3aed;
  background: #fff;
  box-shadow: 0 0 0 3.5px rgba(124, 58, 237, 0.14);
}

.eye-btn {
  position: absolute;
  right: 0.9rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  display: flex;
  align-items: center;
  padding: 0;
  transition: color 0.15s;
}
.eye-btn:hover { color: #7c3aed; }

/* ─── SUBMIT BUTTON ─── */
.btn-premium {
  width: 100%;
  padding: 0.85rem;
  margin-top: 0.5rem;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #fff;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  letter-spacing: 0.01em;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
}

.btn-premium:hover:not(:disabled) {
  background: linear-gradient(135deg, #4338ca, #6d28d9);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.45);
  transform: translateY(-1px);
}

.btn-premium:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
}

.btn-premium:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.spinner-sm {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ─── DIVIDER ─── */
.divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.25rem 0 1rem;
  color: #9ca3af;
  font-size: 0.78rem;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

/* ─── GOOGLE BUTTON ─── */
.google-btn-wrap {
  display: flex;
  justify-content: center;
  min-height: 42px;
  margin-bottom: 0.5rem;
}

/* ─── FOOTER LINKS ─── */
.form-footer-link {
  margin-top: 1.25rem;
  text-align: center;
  font-size: 0.85rem;
  color: #6b7280;
}

.form-footer-link a {
  color: #7c3aed;
  font-weight: 700;
  text-decoration: none;
  transition: color 0.15s;
}

.form-footer-link a:hover { color: #4f46e5; }

/* ─── SYSTEM NOTICE ─── */
.system-notice-toggle {
  margin-top: 1rem;
}

.notice-btn {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: rgba(79, 70, 229, 0.04);
  border: 1px dashed rgba(79, 70, 229, 0.25);
  border-radius: 10px;
  color: #6d28d9;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.notice-btn:hover {
  background: rgba(79, 70, 229, 0.08);
  border-color: rgba(79, 70, 229, 0.4);
}

.notice-box {
  margin-top: 0.75rem;
  padding: 0.875rem 1rem;
  background: rgba(79, 70, 229, 0.04);
  border: 1px dashed rgba(79, 70, 229, 0.2);
  border-radius: 12px;
  font-size: 0.78rem;
  color: #4b5563;
  line-height: 1.6;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.notice-box strong {
  color: #4f46e5;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.notice-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: #4f46e5;
  font-weight: 700;
  font-size: 0.8rem;
  text-decoration: none;
  padding: 0.3rem 0.75rem;
  border: 1px solid rgba(79, 70, 229, 0.3);
  border-radius: 8px;
  transition: all 0.15s;
  align-self: flex-start;
}

.notice-link:hover {
  background: rgba(79, 70, 229, 0.08);
}

/* ─── TRANSITIONS ─── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ─── MOBILE OVERRIDES ─── */
@media (max-width: 767px) {
  .auth-page {
    background: linear-gradient(155deg, #c7e3fa 0%, #ddd6fe 40%, #fbcfe8 80%, #bfdbfe 100%);
    min-height: 100vh;
  }
  .auth-form-panel {
    justify-content: flex-start;
    padding: 1.25rem 1rem 2rem;
  }
  .form-box {
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(24px) saturate(180%);
    border-color: rgba(167, 139, 250, 0.3);
    box-shadow: 0 8px 32px rgba(109, 40, 217, 0.15);
    max-width: 100%;
  }
}
</style>
