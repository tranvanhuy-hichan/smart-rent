<template>
  <div class="w-full bg-card border border-border-main rounded-2xl p-6 shadow-xs space-y-6 animate-pulse select-none">
    <!-- Header Skeleton -->
    <div class="flex items-center justify-between">
      <div class="w-1/4 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      <div class="w-24 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg opacity-80"></div>
    </div>

    <!-- Filters Bar Skeleton -->
    <div class="flex flex-wrap items-center gap-3">
      <div 
        v-for="i in filterCount" 
        :key="'filter-' + i" 
        class="w-48 h-10 bg-slate-200 dark:bg-slate-800 rounded-md"
      ></div>
    </div>

    <!-- Chart Area Skeleton -->
    <div class="w-full bg-slate-200 dark:bg-slate-800 rounded-xl flex items-center justify-center relative overflow-hidden" :class="chartHeight">
      <!-- Simulated grid lines in the chart area for enhanced visuals -->
      <div class="absolute inset-0 flex flex-col justify-around p-6 opacity-25">
        <div class="w-full h-px bg-slate-300 dark:bg-slate-700"></div>
        <div class="w-full h-px bg-slate-300 dark:bg-slate-700"></div>
        <div class="w-full h-px bg-slate-300 dark:bg-slate-700"></div>
        <div class="w-full h-px bg-slate-300 dark:bg-slate-700"></div>
      </div>
      <!-- Center chart icon placeholder -->
      <div class="z-10 flex flex-col items-center gap-2 opacity-35">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      </div>
    </div>

    <!-- Table Data Skeleton -->
    <div class="space-y-4 pt-2">
      <!-- Simulated Table Header -->
      <div class="flex items-center gap-4 pb-2 border-b border-border-main/40">
        <div class="w-8 h-4 bg-slate-300 dark:bg-slate-700 rounded"></div>
        <div class="flex-1 h-4 bg-slate-300 dark:bg-slate-700 rounded"></div>
        <div class="w-24 h-4 bg-slate-300 dark:bg-slate-700 rounded"></div>
        <div class="w-32 h-4 bg-slate-300 dark:bg-slate-700 rounded"></div>
      </div>
      
      <!-- Simulated Table Rows -->
      <div class="space-y-3">
        <div 
          v-for="r in rowCount" 
          :key="'row-' + r" 
          class="flex items-center gap-4 py-2"
        >
          <div class="w-8 h-5 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div class="flex-1 h-5 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div class="w-24 h-5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
          <div class="w-32 h-5 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  chartHeight: {
    type: String,
    default: 'h-64'
  },
  filterCount: {
    type: Number,
    default: 3
  },
  rowCount: {
    type: Number,
    default: 5
  }
});
</script>
