<template>
  <div class="bg-card border border-border-main rounded-2xl p-6 shadow-xs space-y-6 animate-pulse select-none w-full">
    <!-- Header/Title Skeleton -->
    <div class="flex items-center justify-between pb-4 border-b border-border-main/40">
      <div class="w-1/3 h-7 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
      <div class="w-20 h-7 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
    </div>

    <!-- Details Grid Skeleton -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="'field-' + i" class="space-y-2">
        <div class="w-20 h-4 bg-slate-300 dark:bg-slate-700 rounded"></div>
        <div class="w-full h-9 bg-slate-200 dark:bg-slate-800 rounded-lg border border-border-main/30"></div>
      </div>
    </div>

    <!-- Paragraph/Notes Skeleton -->
    <div class="space-y-2.5 pt-4">
      <div class="w-32 h-4 bg-slate-300 dark:bg-slate-700 rounded"></div>
      <div class="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
      <div class="w-5/6 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
    </div>
  </div>
</template>

<script src="./LoadingState.js"></script>
