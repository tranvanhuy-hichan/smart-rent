import { computed } from 'vue';

export default {
  name: "Pagination",
  props: {
    page: {
      type: Number,
      required: true,
    },
    totalPages: {
      type: Number,
      required: true,
    },
    totalElements: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: "mục",
    },
  },
  emits: ["change-page"],
  setup(props, { emit }) {
    const onPageChange = (newPage) => {
      if (newPage >= 0 && newPage < props.totalPages) {
        emit("change-page", newPage);
      }
    };

    // Tạo mảng hiển thị trang tối ưu cho cả di động và desktop
    const pages = computed(() => {
      const current = props.page; // 0-indexed
      const total = props.totalPages;
      if (total <= 1) return [0];

      const result = [];
      const delta = 1; // Chỉ hiển thị 1 trang lân cận để vừa màn hình di động

      // Luôn thêm trang đầu
      result.push(0);

      const left = current - delta;
      const right = current + delta;
      
      const range = [];
      for (let i = 1; i < total - 1; i++) {
        if (i >= left && i <= right) {
          range.push(i);
        }
      }

      if (range.length > 0) {
        if (range[0] > 1) {
          result.push('...');
        }
        result.push(...range);
        if (range[range.length - 1] < total - 2) {
          result.push('...');
        }
      } else {
        if (total > 2) {
          result.push('...');
        }
      }

      // Luôn thêm trang cuối
      result.push(total - 1);

      return result;
    });

    return {
      onPageChange,
      pages,
    };
  },
};
