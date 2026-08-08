<template>
  <span :class="['trade-status', normalizedStatus.toLowerCase()]">
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
});

const normalizedStatus = computed(() => props.status || "REQUESTED");

const label = computed(() => {
  switch (normalizedStatus.value) {
    case "REQUESTED":
      return "Pending";
    case "ACCEPTED":
      return "Reserved";
    case "RENTING":
      return "Renting";
    case "COMPLETED":
      return "Completed";
    case "REJECTED":
      return "Rejected";
    case "CANCELLED":
      return "Cancelled";
    default:
      return normalizedStatus.value;
  }
});
</script>

<style scoped>
.trade-status {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
}

.requested,
.accepted {
  background: rgba(255, 204, 0, 0.2);
  color: #ffd24d;
}

.renting {
  background: rgba(63, 140, 255, 0.2);
  color: #7acbff;
}

.completed {
  background: rgba(76, 175, 80, 0.2);
  color: #8de38d;
}

.rejected,
.cancelled {
  background: rgba(244, 67, 54, 0.2);
  color: #ff9d9d;
}
</style>
