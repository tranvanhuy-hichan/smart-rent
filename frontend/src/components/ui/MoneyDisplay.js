import { computed } from 'vue';
import { formatMoney, formatMoneyShort } from '../../utils/money.js';

export default {
  name: 'MoneyDisplay',
  props: {
    value: {
      type: [Number, String],
      required: true,
      default: 0,
    },
    type: {
      type: String,
      default: 'default', // 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'sub'
    },
    suffix: {
      type: String,
      default: 'đ',
    },
    bold: {
      type: Boolean,
      default: true,
    },
    short: {
      type: Boolean,
      default: false,
    },
    showSign: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const formattedValue = computed(() => {
      const num = Number(props.value) || 0;
      let result = props.short ? formatMoneyShort(num) : formatMoney(num);
      
      if (props.showSign && num > 0) {
        result = '+' + result;
      }
      return result;
    });

    const typeClass = computed(() => {
      switch (props.type) {
        case 'primary':
          return 'text-primary';
        case 'success':
          return 'text-emerald-600 dark:text-emerald-400';
        case 'danger':
          return 'text-rose-500 dark:text-rose-400';
        case 'warning':
          return 'text-amber-500 dark:text-amber-400';
        case 'sub':
          return 'text-text-sub';
        default:
          return 'text-text-main';
      }
    });

    const suffixClass = computed(() => {
      // Suffix color matches type except when default or primary (should match text color opacity)
      if (props.type === 'default' || props.type === 'primary') {
        return 'text-text-sub';
      }
      return '';
    });

    return {
      formattedValue,
      typeClass,
      suffixClass,
    };
  },
};
