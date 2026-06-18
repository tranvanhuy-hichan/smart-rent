<template>
  <!-- DESKTOP HEADER (100% original layout, styling, and experience) -->
  <header
    class="hidden lg:flex sticky top-0 left-0 right-0 w-full bg-card border-b border-border-main shadow-xs h-16 px-6 z-40 items-center justify-between"
  >
    <div class="flex items-center">
      <!-- Breadcrumbs -->
      <nav class="hidden lg:flex items-center gap-1.5 sm:gap-2 text-[0.8rem] sm:text-[0.85rem] font-medium truncate">
        <span class="text-text-sub">{{ parentRoute }}</span>
        <span class="text-border-main">/</span>
        <span class="text-primary font-semibold">{{ currentRoute }}</span>
      </nav>
    </div>
    
    <div class="flex items-center gap-2 sm:gap-4 shrink-0">
      <!-- Chat Button -->
      <router-link v-if="role === 'LANDLORD' || role === 'TENANT'"
        :to="role === 'LANDLORD' ? '/landlord/chat' : '/tenant/chat'"
        class="text-text-sub cursor-pointer p-1.5 relative flex items-center justify-center transition-all duration-150 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-text-main rounded-lg"
        title="Trò chuyện">
        <div v-if="chatUnreadCount > 0"
          class="absolute top-[1px] right-[1px] min-w-[14px] h-[14px] px-1 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center border border-white dark:border-slate-900 leading-none shadow-xs">
          {{ chatUnreadCount }}
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.497c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
      </router-link>

      <!-- Notifications Dropdown -->
      <div class="relative notifications-dropdown-container flex items-center">
        <button @click="toggleNotifications"
          class="bg-transparent border-0 text-text-sub cursor-pointer p-1.5 relative flex items-center justify-center transition-all duration-150 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-text-main rounded-lg"
          title="Thông báo">
          <div v-if="unreadCount > 0"
            class="absolute top-[1px] right-[1px] min-w-[14px] h-[14px] px-1 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center border border-white dark:border-slate-900 leading-none shadow-xs">
            {{ unreadCount }}
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        <div v-if="showNotificationsDropdown"
          class="absolute right-0 top-12 w-96 bg-card border border-border-main rounded-2xl shadow-xl py-3 z-50 text-xs mt-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <div class="px-4 pb-2 border-b border-border-main flex items-center justify-between">
            <span class="font-bold text-[0.85rem] text-text-main">Thông báo</span>
            <button v-if="unreadCount > 0" @click="markAllAsRead"
              class="text-primary hover:underline font-semibold bg-transparent border-0 cursor-pointer">
              Đánh dấu tất cả đã đọc
            </button>
          </div>

          <div class="max-h-[360px] overflow-y-auto pr-0.5">
            <div v-if="loadingNotifications" class="flex justify-center items-center py-8">
              <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>

            <div v-else-if="notifications.length === 0"
              class="flex flex-col items-center justify-center py-8 text-center text-text-sub">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" class="w-8 h-8 text-slate-300 dark:text-slate-700 mb-1">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <span>Không có thông báo nào</span>
            </div>

            <div v-else class="divide-y divide-border-main/50">
              <div v-for="notif in notifications" :key="notif.id" @click="handleNotificationClick(notif)"
                class="px-4 py-3 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors relative"
                :class="{ 'bg-primary/5 dark:bg-primary/5': !notif.isRead }">
                <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  :class="getIconClass(notif.type)">
                  <svg v-if="notif.type === 'INVOICE_NEW'" xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <svg v-else-if="notif.type === 'PAYMENT_CONFIRMED'" xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <svg v-else-if="notif.type === 'CONTRACT_ACTIVE'" xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>

                <div class="flex-1 min-w-0 pr-2">
                  <div class="font-bold text-text-main text-[0.8rem] truncate">{{ notif.title }}</div>
                  <div class="text-[0.75rem] text-text-sub mt-0.5 leading-relaxed"
                    :class="{ 'line-clamp-2': !expandedNotifications[notif.id] }">
                    {{ notif.content }}
                  </div>
                  <button v-if="notif.content && notif.content.length > 80" @click.stop="toggleExpand(notif.id)"
                    class="text-primary hover:text-primary-dark hover:underline font-bold text-[0.7rem] bg-transparent border-0 p-0 mt-1 cursor-pointer block">
                    {{ expandedNotifications[notif.id] ? 'Thu gọn' : 'Xem thêm' }}
                  </button>
                  <div class="text-[0.675rem] text-slate-400 mt-1.5 font-medium">{{ formatTime(notif.createdAt) }}</div>
                </div>

                <div v-if="!notif.isRead"
                  class="w-2 h-2 rounded-full bg-primary absolute right-3 top-1/2 -translate-y-1/2 shrink-0"></div>
              </div>

              <div v-if="hasMore"
                class="p-2 border-t border-border-main/40 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                <button @click.stop="loadMoreNotifications"
                  class="w-full py-2 text-primary hover:text-primary-dark font-bold bg-transparent border-0 cursor-pointer flex items-center justify-center gap-1.5 text-[0.75rem]"
                  :disabled="loadingNotifications">
                  <span v-if="loadingNotifications"
                    class="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin"></span>
                  <span>Xem thêm thông báo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Profile Dropdown -->
      <div class="relative profile-dropdown-container flex items-center border-l border-border-main pl-4">
        <div @click="showDropdown = !showDropdown"
          class="flex items-center gap-3 cursor-pointer py-1.5 px-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-all duration-150 select-none border border-transparent hover:border-border-main/50">
          <div
            class="w-8 h-8 rounded-full bg-sky-100 text-primary flex items-center justify-center font-bold text-[0.85rem] shrink-0 border border-primary/20">
            <span>{{ userInitial }}</span>
          </div>
          <div class="flex flex-col text-left">
            <span class="text-[0.825rem] font-semibold text-text-main truncate leading-snug">{{ username }}</span>
            <span class="text-[0.675rem] text-text-sub uppercase font-bold tracking-wide truncate mt-0.5">{{ roleLabel }}</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5"
            stroke="currentColor" class="w-3 h-3 text-text-sub transition-transform duration-200"
            :class="{ 'rotate-180': showDropdown }">
            <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>

        <div v-if="showDropdown"
          class="absolute right-0 top-12 w-48 bg-card border border-border-main rounded-xl shadow-lg py-1.5 z-50 text-xs mt-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <button @click="navigateToSettings"
            class="w-full text-left px-4 py-2.5 text-text-main hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-2 border-0 bg-transparent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
              stroke="currentColor" class="w-4 h-4 text-text-sub">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
            <span class="font-medium">Cài đặt & Quyền riêng tư</span>
          </button>

          <button v-if="role === 'LANDLORD'" @click="navigateToUpgrade"
            class="w-full text-left px-4 py-2.5 text-text-main hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-2 border-0 bg-transparent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
              stroke="currentColor" class="w-4 h-4 text-text-sub">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="font-medium">Gói dịch vụ</span>
          </button>

          <button v-if="role === 'LANDLORD'" @click="navigateToTenants"
            class="w-full text-left px-4 py-2.5 text-text-main hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-2 border-0 bg-transparent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
              stroke="currentColor" class="w-4 h-4 text-text-sub">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span class="font-medium">Khách thuê</span>
          </button>

          <button v-if="role === 'LANDLORD'" @click="navigateToRevenue"
            class="w-full text-left px-4 py-2.5 text-text-main hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-2 border-0 bg-transparent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
              stroke="currentColor" class="w-4 h-4 text-text-sub">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span class="font-medium">Doanh thu</span>
          </button>

          <button v-if="role === 'LANDLORD'" @click="navigateToTax"
            class="w-full text-left px-4 py-2.5 text-text-main hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-2 border-0 bg-transparent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
              stroke="currentColor" class="w-4 h-4 text-text-sub">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span class="font-medium">Báo cáo thuế</span>
          </button>

          <button v-if="role === 'LANDLORD' || role === 'TENANT'" @click="navigateToCameras"
            class="w-full text-left px-4 py-2.5 text-text-main hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-2 border-0 bg-transparent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
              stroke="currentColor" class="w-4 h-4 text-text-sub">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span class="font-medium">{{ role === 'LANDLORD' ? 'Hệ thống Camera' : 'Camera giám sát' }}</span>
          </button>

          <div class="border-t border-border-main my-1"></div>

          <button @click="handleLogout"
            class="w-full text-left px-4 py-2.5 text-danger hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer flex items-center gap-2 border-0 bg-transparent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span class="font-bold">Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- MOBILE SPLIT FLOATING TOPBAR -->
  <div class="lg:hidden" v-if="!shouldHideMobileHeader">
    <div 
      class="fixed top-[calc(8px+env(safe-area-inset-top,20px))] left-2 right-2 z-40 liquid-glass rounded-full px-4 h-14 flex items-center justify-between shadow-lg transition-all duration-300 ease-out animate-spring mobile-top-capsule"
      :class="isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0 pointer-events-none'"
    >
      <!-- Left part: Logo & Brand + Greeting -->
      <div @click="goToOverview" class="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform shrink-0">
        <img src="/logo.ico" alt="Logo" class="w-7 h-7 rounded object-contain shrink-0" />
        <div class="flex flex-col text-left">
          <span class="text-[12px] font-extrabold text-primary tracking-wide leading-tight">SMART RENT</span>
          <span class="text-[9px] text-text-sub font-semibold leading-none mt-0.5">Xin chào, {{ username }}</span>
        </div>
      </div>

      <!-- Right part: Actions & Profile -->
      <div class="flex items-center gap-3">
        <!-- Chat Button -->
        <router-link v-if="role === 'LANDLORD' || role === 'TENANT'"
          :to="role === 'LANDLORD' ? '/landlord/chat' : '/tenant/chat'"
          class="text-text-sub cursor-pointer p-1 relative flex items-center justify-center transition-all duration-150 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-text-main rounded-full"
          title="Trò chuyện"
        >
          <div v-if="chatUnreadCount > 0"
            class="absolute -top-[2px] -right-[2px] min-w-[12px] h-3 px-0.5 rounded-full bg-danger text-white text-[8px] font-black flex items-center justify-center border border-white dark:border-slate-900 leading-none">
            {{ chatUnreadCount }}
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.497c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
        </router-link>

        <!-- Notification Bell -->
        <div class="relative notifications-dropdown-container flex items-center">
          <button @click="toggleNotifications"
            class="bg-transparent border-0 text-text-sub cursor-pointer p-1 relative flex items-center justify-center transition-all duration-150 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-text-main rounded-full"
            title="Thông báo"
          >
            <div v-if="unreadCount > 0"
              class="absolute -top-[2px] -right-[2px] min-w-[12px] h-3 px-0.5 rounded-full bg-danger text-white text-[8px] font-black flex items-center justify-center border border-white dark:border-slate-900 leading-none">
              {{ unreadCount }}
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          <!-- Dropdown Popover on Mobile -->
          <div v-if="showNotificationsDropdown"
            class="fixed right-4 left-4 top-[88px] bg-card border border-border-main rounded-[24px] shadow-2xl py-3 z-50 text-xs mt-1 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div class="px-4 pb-2 border-b border-border-main flex items-center justify-between">
              <span class="font-bold text-[0.85rem] text-text-main">Thông báo</span>
              <button v-if="unreadCount > 0" @click="markAllAsRead"
                class="text-primary hover:underline font-semibold bg-transparent border-0 cursor-pointer">
                Đánh dấu đã đọc
              </button>
            </div>

            <div class="max-h-[320px] overflow-y-auto pr-0.5">
              <div v-if="loadingNotifications" class="flex justify-center items-center py-6">
                <div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>

              <div v-else-if="notifications.length === 0"
                class="flex flex-col items-center justify-center py-6 text-center text-text-sub">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                  stroke="currentColor" class="w-7 h-7 text-slate-300 dark:text-slate-700 mb-1">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                <span>Không có thông báo nào</span>
              </div>

              <div v-else class="divide-y divide-border-main/50">
                <div v-for="notif in notifications" :key="notif.id" @click="handleNotificationClick(notif)"
                  class="px-4 py-2.5 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors relative"
                  :class="{ 'bg-primary/5 dark:bg-primary/5': !notif.isRead }">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    :class="getIconClass(notif.type)">
                    <svg v-if="notif.type === 'INVOICE_NEW'" xmlns="http://www.w3.org/2000/svg" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <svg v-else-if="notif.type === 'PAYMENT_CONFIRMED'" xmlns="http://www.w3.org/2000/svg" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <svg v-else-if="notif.type === 'CONTRACT_ACTIVE'" xmlns="http://www.w3.org/2000/svg" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>

                  <div class="flex-1 min-w-0 pr-2">
                    <div class="font-bold text-text-main text-[0.8rem] truncate">{{ notif.title }}</div>
                    <div class="text-[0.75rem] text-text-sub mt-0.5 leading-relaxed"
                      :class="{ 'line-clamp-2': !expandedNotifications[notif.id] }">
                      {{ notif.content }}
                    </div>
                    <button v-if="notif.content && notif.content.length > 80" @click.stop="toggleExpand(notif.id)"
                      class="text-primary hover:text-primary-dark hover:underline font-bold text-[0.7rem] bg-transparent border-0 p-0 mt-1 cursor-pointer block">
                      {{ expandedNotifications[notif.id] ? 'Thu gọn' : 'Xem thêm' }}
                    </button>
                    <div class="text-[0.675rem] text-slate-400 mt-1.5 font-medium">{{ formatTime(notif.createdAt) }}</div>
                  </div>

                  <div v-if="!notif.isRead"
                    class="w-2 h-2 rounded-full bg-primary absolute right-3 top-1/2 -translate-y-1/2 shrink-0"></div>
                </div>

                <div v-if="hasMore"
                  class="p-2 border-t border-border-main/40 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <button @click.stop="loadMoreNotifications"
                    class="w-full py-2 text-primary hover:text-primary-dark font-bold bg-transparent border-0 cursor-pointer flex items-center justify-center gap-1.5 text-[0.75rem]"
                    :disabled="loadingNotifications">
                    <span v-if="loadingNotifications"
                      class="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin"></span>
                    <span>Xem thêm thông báo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Avatar / Profile -->
        <div class="relative profile-dropdown-container flex items-center border-l border-border-main/50 pl-2">
          <div @click="showDropdown = !showDropdown"
            class="w-7 h-7 rounded-full bg-sky-100 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20 cursor-pointer select-none active:scale-95 transition-transform"
          >
            <span>{{ userInitial }}</span>
          </div>

          <!-- Profile Dropdown on Mobile -->
          <div v-if="showDropdown"
            class="absolute right-0 top-11 w-48 bg-card border border-border-main rounded-2xl shadow-xl py-1.5 z-50 text-xs mt-1 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <button @click="navigateToSettings"
              class="w-full text-left px-4 py-2.5 text-text-main hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-2 border-0 bg-transparent">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                stroke="currentColor" class="w-4 h-4 text-text-sub">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              <span class="font-medium">Cài đặt & Quyền riêng tư</span>
            </button>

            <button v-if="role === 'LANDLORD'" @click="navigateToUpgrade"
              class="w-full text-left px-4 py-2.5 text-text-main hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-2 border-0 bg-transparent">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                stroke="currentColor" class="w-4 h-4 text-text-sub">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="font-medium">Gói dịch vụ</span>
            </button>

            <button v-if="role === 'LANDLORD'" @click="navigateToTenants"
              class="w-full text-left px-4 py-2.5 text-text-main hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-2 border-0 bg-transparent">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                stroke="currentColor" class="w-4 h-4 text-text-sub">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span class="font-medium">Khách thuê</span>
            </button>

            <button v-if="role === 'LANDLORD'" @click="navigateToRevenue"
              class="w-full text-left px-4 py-2.5 text-text-main hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-2 border-0 bg-transparent">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                stroke="currentColor" class="w-4 h-4 text-text-sub">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span class="font-medium">Doanh thu</span>
            </button>

            <button v-if="role === 'LANDLORD'" @click="navigateToTax"
              class="w-full text-left px-4 py-2.5 text-text-main hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-2 border-0 bg-transparent">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                stroke="currentColor" class="w-4 h-4 text-text-sub">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span class="font-medium">Báo cáo thuế</span>
            </button>

            <button v-if="role === 'LANDLORD' || role === 'TENANT'" @click="navigateToCameras"
              class="w-full text-left px-4 py-2.5 text-text-main hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-2 border-0 bg-transparent">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                stroke="currentColor" class="w-4 h-4 text-text-sub">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span class="font-medium">Camera</span>
            </button>

            <div class="border-t border-border-main my-1"></div>

            <button @click="handleLogout"
              class="w-full text-left px-4 py-2.5 text-danger hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer flex items-center gap-2 border-0 bg-transparent">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                stroke-width="2" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span class="font-bold">Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- CONFIRM MODAL (Universal) -->
  <ConfirmModal :show="confirmModal.show" :title="confirmModal.title" :message="confirmModal.message"
    :type="confirmModal.type" :confirm-text="confirmModal.confirmText" :cancel-text="confirmModal.cancelText"
    :show-cancel="confirmModal.showCancel" @confirm="onConfirmModal" @cancel="closeConfirmModal" />

</template>

<script src="./Header.js"></script>
