<template>
  <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-5 border-t border-border-main/40 w-full select-none">
    <!-- Phía trái: Thông tin tổng quan -->
    <div class="text-xs text-text-sub font-medium">
      Trang <span class="text-text-main font-bold">{{ page + 1 }}</span> / <span class="text-text-sub font-semibold">{{ totalPages }}</span> 
      <span class="mx-1.5 text-border-main/50">|</span> 
      Tổng cộng <span class="text-primary font-bold">{{ totalElements }}</span> {{ unit }}
    </div>

    <!-- Phía phải: Bộ điều khiển phân trang -->
    <div class="flex items-center gap-1.5">
      <!-- Nút Trước -->
      <button
        class="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-border-main/60 text-text-sub hover:text-primary hover:border-primary/40 hover:bg-primary/5 disabled:opacity-40 disabled:hover:text-text-sub disabled:hover:border-border-main/60 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-all duration-200"
        :disabled="page === 0"
        @click="onPageChange(page - 1)"
        aria-label="Trang trước"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <!-- Các nút số trang -->
      <template v-for="(p, index) in pages" :key="index">
        <!-- Nếu là dấu chấm lửng -->
        <span 
          v-if="p === '...'" 
          class="w-8 h-8 flex items-center justify-center text-xs text-text-sub font-medium"
        >
          {{ p }}
        </span>
        <!-- Nếu là nút số trang -->
        <button
          v-else
          class="w-8 h-8 flex items-center justify-center text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer"
          :class="[
            page === p 
              ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105 border border-primary' 
              : 'border border-border-main/40 text-text-main hover:text-primary hover:border-primary/30 hover:bg-primary/5 active:scale-95'
          ]"
          @click="onPageChange(p)"
        >
          {{ p + 1 }}
        </button>
      </template>

      <!-- Nút Sau -->
      <button
        class="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-border-main/60 text-text-sub hover:text-primary hover:border-primary/40 hover:bg-primary/5 disabled:opacity-40 disabled:hover:text-text-sub disabled:hover:border-border-main/60 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-all duration-200"
        :disabled="page >= totalPages - 1"
        @click="onPageChange(page + 1)"
        aria-label="Trang sau"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script src="./Pagination.js"></script>
