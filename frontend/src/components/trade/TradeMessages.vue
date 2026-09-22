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
  gap: 0.75rem;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.message-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-small);
  padding: 0.55rem 0.7rem;
}

.message-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.3rem;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.message-header strong {
  color: var(--text-secondary);
}

.message-card p {
  margin: 0;
  color: var(--text);
  font-size: 0.88rem;
  white-space: pre-wrap;
}

.composer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

textarea {
  width: 100%;
  box-sizing: border-box;
  background: var(--field-bg);
  color: var(--field-text);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-small);
  padding: 0.5rem 0.6rem;
  font-size: 0.88rem;
}

textarea::placeholder {
  color: var(--field-placeholder);
}

textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.composer button {
  align-self: flex-end;
  padding: 0.4rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-small);
  cursor: pointer;
}

.composer button:hover:not(:disabled) {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.composer button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
