<template>
  <div class="flex items-center justify-between gap-4 mt-5 pt-4 border-t border-border-main/40 w-full select-none">
    <!-- Phía trái: Tổng số mục (chỉ hiển thị gọn nhẹ) -->
    <div class="text-xs text-text-sub font-semibold">
      Tổng <span class="text-primary font-black">{{ totalElements }}</span> {{ unit }}
    </div>

    <!-- Phía phải: Bộ điều khiển gọn nhẹ [ < ] X / Y [ > ] -->
    <div class="flex items-center gap-3">
      <!-- Nút Trước -->
      <button
        class="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-main/60 text-text-sub hover:text-primary hover:border-primary/40 hover:bg-primary/5 disabled:opacity-35 disabled:hover:text-text-sub disabled:hover:border-border-main/60 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-all duration-150"
        :disabled="page === 0"
        @click="onPageChange(page - 1)"
        aria-label="Trang trước"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <!-- Hiển thị trang dạng X / Y -->
      <span class="text-xs text-text-main font-bold min-w-[3.5rem] text-center">
        {{ page + 1 }} <span class="text-text-sub/50 font-normal">/</span> {{ totalPages }}
      </span>

      <!-- Nút Sau -->
      <button
        class="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-main/60 text-text-sub hover:text-primary hover:border-primary/40 hover:bg-primary/5 disabled:opacity-35 disabled:hover:text-text-sub disabled:hover:border-border-main/60 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-all duration-150"
        :disabled="page >= totalPages - 1"
        @click="onPageChange(page + 1)"
        aria-label="Trang sau"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script src="./Pagination.js"></script>
