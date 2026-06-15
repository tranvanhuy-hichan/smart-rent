<template>
  <span
    :class="[
      bold ? 'font-bold' : '',
      typeClass,
    ]"
  >
    {{ formattedValue }}<span v-if="suffix" class="text-[10px] ml-0.5" :class="suffixClass">{{ suffix }}</span>
  </span>
</template>

<script src="./MoneyDisplay.js"></script>
