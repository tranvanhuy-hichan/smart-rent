<template>
  <div class="p-4 bg-bg-main min-h-full">
    <!-- Page Header -->
    <PageHeader 
      title="Camera Giám Sát" 
      :subtitle="`Theo dõi an ninh trực tuyến tại dãy trọ của bạn (${cameras.length} camera)`"
      :icon="cameraIcon" 
      :showAdd="false" 
      :showSearch="false" 
    />

    <!-- Card Grid Skeleton Loader -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse select-none">
      <div v-for="i in 3" :key="'camera-loader-' + i" class="bg-card border border-border-main rounded-2xl overflow-hidden shadow-xs flex flex-col">
        <!-- Player Area (16:9 aspect ratio) -->
        <div class="aspect-video bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-slate-400 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <!-- Card Footer -->
        <div class="p-4 flex items-center justify-between gap-3 border-t border-border-main/40">
          <div class="space-y-1.5 flex-1 min-w-0">
            <div class="w-1/2 h-4 bg-slate-300 dark:bg-slate-700 rounded"></div>
            <div class="w-1/3 h-3 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
          <div class="w-16 h-5 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
        </div>
      </div>
    </div>

    <!-- Main List/Grid -->
    <template v-else>
      <div v-if="cameras.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CameraPlayer 
          v-for="cam in cameras" 
          :key="cam.id" 
          :camera="cam"
          :show-settings="false"
        />
      </div>

      <!-- Empty State -->
      <EmptyState 
        v-else 
        message="Dãy trọ của bạn chưa có camera giám sát nào được cấu hình."
      />
    </template>
  </div>
</template>

<script src="/src/views/tenant/Cameras.js"></script>
