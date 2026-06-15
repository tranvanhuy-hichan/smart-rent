import { computed } from 'vue';
import { formatDate, formatDateTime } from '../../utils/date.js';

export default {
  name: 'DateDisplay',
  props: {
    value: {
      type: [String, Date],
      required: true,
      default: '',
    },
    type: {
      type: String,
      default: 'date', // 'date' | 'datetime'
    },
    icon: {
      type: Boolean,
      default: false,
    },
    bold: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const formattedValue = computed(() => {
      if (!props.value) return '—';
      if (props.type === 'datetime') {
        return formatDateTime(props.value);
      }
      return formatDate(props.value);
    });

    return {
      formattedValue,
    };
  },
};
