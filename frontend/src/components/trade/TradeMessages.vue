<template>
  <section class="trade-messages">
    <div class="message-list">
      <article v-for="message in messages" :key="message.id" class="message-card">
        <div class="message-header">
          <strong>{{ message.sender.username }}</strong>
          <span>{{ formatDate(message.createdAt) }}</span>
        </div>
        <p>{{ message.message }}</p>
      </article>
    </div>

    <form class="composer" @submit.prevent="submitMessage">
      <textarea
        v-model="draft"
        rows="4"
        placeholder="Write a message..."
      />
      <button type="submit" :disabled="!draft.trim() || sending">
        {{ sending ? "Sending..." : "Send message" }}
      </button>
    </form>
  </section>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  messages: {
    type: Array,
    required: true,
  },
  sending: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["send"]);
const draft = ref("");

function submitMessage() {
  if (!draft.value.trim()) {
    return;
  }

  emit("send", draft.value.trim());
  draft.value = "";
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}
</script>

<style scoped>
.trade-messages {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.message-card {
  background: #222;
  border-radius: 12px;
  padding: 1rem;
}

.message-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
  color: #ccc;
}

.message-card p {
  margin: 0;
  white-space: pre-wrap;
}

.composer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

textarea {
  width: 100%;
  box-sizing: border-box;
  background: #1f1f1f;
  color: #fff;
  border: 1px solid #444;
  border-radius: 10px;
  padding: 0.75rem;
}

button {
  align-self: flex-end;
}
</style>
