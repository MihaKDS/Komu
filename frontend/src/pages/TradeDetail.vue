<template>
  <div v-if="trade" class="page">
    <Breadcrumbs :title="`Trade #${trade.id}`" />

    <div class="title-row">
      <h1>Trade #{{ trade.id }}</h1>
      <TradeStatus :status="trade.status" />
    </div>

    <section class="summary-card">
      <p><strong>Type:</strong> {{ trade.type }}</p>

      <p>
        <strong>Buyer:</strong>

        <RouterLink
          v-if="!isCurrentUser(trade.buyer.username)"
          :to="{
            name: 'seller-listings',
            params: { username: trade.buyer.username },
            query: { from: 'trade-detail' }
          }"
        >
          {{ trade.buyer.username }}
        </RouterLink>

        <span v-else>{{ trade.buyer.username }}</span>
      </p>

      <p>
        <strong>Seller:</strong>

        <RouterLink
          v-if="!isCurrentUser(trade.seller.username)"
          :to="{
            name: 'seller-listings',
            params: { username: trade.seller.username },
            query: { from: 'trade-detail' }
          }"
        >
          {{ trade.seller.username }}
        </RouterLink>

        <span v-else>{{ trade.seller.username }}</span>
      </p>

      <p v-if="trade.cancelledReason">
        <strong>Cancellation reason:</strong>
        {{ trade.cancelledReason }}
      </p>
    </section>

    <section>
      <div class="section-header">
        <h2>Items</h2>

        <button
          v-if="canEditItems"
          type="button"
          class="secondary-button"
          :disabled="savingItems"
          @click="saveTradeItems"
        >
          {{ savingItems ? "Saving..." : "Save selection" }}
        </button>
      </div>

      <div class="trade-items">
        <article
          v-for="item in trade.items"
          :key="item.id"
          class="trade-item"
          :class="{ 'item-unavailable': isItemUnavailable(item) }"
        >
          <div class="item-content">
            <label
              v-if="canEditItems"
              class="item-checkbox"
            >
              <input
                type="checkbox"
                :checked="isItemSelected(item)"
                @change="toggleTradeItem(item)"
              >
              <span class="sr-only">
                Include {{ item.media.title }} in this trade
              </span>
            </label>

            <div class="item-details">
              <h3>{{ item.media.title }}</h3>

              <p v-if="item.edition" class="item-edition">
                {{ item.edition }}
              </p>

              <p
                v-if="item.agreedPrice != null"
                class="item-price"
                :class="{ 'unavailable-price': isItemUnavailable(item) }"
              >
                {{ item.agreedPrice }} €
              </p>
            </div>
          </div>

          <span
            v-if="isItemUnavailable(item)"
            class="unavailable-tag"
          >
            No longer available
          </span>
        </article>
      </div>

      <p class="trade-total">
        <strong>Total:</strong> {{ tradeTotal }} €
      </p>
    </section>

    <section
      v-if="actionButtons.length"
      class="actions"
    >
      <button
        v-for="action in actionButtons"
        :key="action.label"
        type="button"
        :class="action.class"
        :disabled="action.disabled"
        @click="action.handler"
      >
        {{ action.label }}
      </button>
    </section>

    <div
      v-if="showCompleteModal"
      class="modal-backdrop"
      @click.self="closeCompleteModal"
    >
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-trade-title"
      >
        <div class="modal-header">
          <h2 id="complete-trade-title">Complete Trade</h2>

          <button
            type="button"
            class="close-button"
            :disabled="completingTrade"
            aria-label="Close"
            @click="closeCompleteModal"
          >
            ×
          </button>
        </div>

        <div class="modal-content">
          <p>
            You have selected
            <strong>{{ selectedTradeItemCount }}</strong>
            item(s).
          </p>

          <div class="complete-options">

            <button
              type="button"
              class="primary-button"
              :disabled="
                completingTrade ||
                selectedTradeItemCount === 0
              "
              @click="completeWithTransfer"
            >
              Transfer selected &amp; complete
            </button>
          </div>

          <p class="modal-note">
            Transferring copies immediately moves ownership to the buyer.
            The buyer can then accept or decline the transfer.
          </p>
        </div>
      </div>
    </div>

    <section>
      <h2>Messages</h2>

      <TradeMessages
        :messages="trade.messages"
        :sending="sendingMessage"
        @send="sendMessage"
      />
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuth } from "../composables/useAuth.js";

import Breadcrumbs from "../components/layout/Breadcrumbs.vue";
import TradeMessages from "../components/trade/TradeMessages.vue";
import TradeStatus from "../components/trade/TradeStatus.vue";

import {
  addTradeMessage,
  cancelTrade,
  completeTrade,
  confirmBuyerTransfer,
  declineTradeTransfer,
  getTrade,
  rejectTrade,
  updateTradeItems,
} from "../api/tradeAPI.js";

const route = useRoute();
const { user } = useAuth();

const trade = ref(null);
const sendingMessage = ref(false);
const savingItems = ref(false);
const completingTrade = ref(false);
const selectedTradeItems = ref({});
const showCompleteModal = ref(false);

const canEditItems = computed(() =>
  trade.value?.viewerRole === "seller" &&
  trade.value?.status === "REQUESTED"
);

const selectedTradeItemCount = computed(() =>
  Object.values(selectedTradeItems.value).filter(Boolean).length
);

const tradeTotal = computed(() => {
  if (!trade.value?.items) {
    return 0;
  }

  return trade.value.items
    .filter((item) => item.sellerAccepted === true)
    .reduce((sum, item) => sum + Number(item.agreedPrice ?? 0), 0);
});

const actionButtons = computed(() => {
  if (!trade.value) {
    return [];
  }

  const buttons = [];

  if (
    trade.value.viewerRole === "seller" &&
    trade.value.status === "REQUESTED"
  ) {
    buttons.push({
      label: "Complete trade",
      class: "primary-button",
      disabled:
        savingItems.value ||
        selectedTradeItemCount.value === 0,
      handler: openCompleteModal,
    });

    buttons.push({
      label: "Cancel trade",
      class: "secondary-button",
      disabled: savingItems.value,
      handler: () =>
        confirmAction(
          "Cancel this trade?",
          () => rejectTrade(trade.value.id),
        ),
    });
  }

  if (
    trade.value.viewerRole === "buyer" &&
    trade.value.status === "REQUESTED"
  ) {
    buttons.push({
      label: "Cancel trade",
      class: "secondary-button",
      disabled: false,
      handler: () =>
        confirmAction(
          "Cancel this trade?",
          () => cancelTrade(trade.value.id),
        ),
    });
  }

  if (
    trade.value.viewerRole === "buyer" &&
    trade.value.status === "ACCEPTED"
  ) {
    buttons.push({
      label: "Accept transfer",
      class: "primary-button",
      disabled: false,
      handler: () =>
        confirmAction(
          "Accept the transferred copies into your collection?",
          () => confirmBuyerTransfer(trade.value.id),
        ),
    });

    buttons.push({
      label: "Decline transfer",
      class: "secondary-button",
      disabled: false,
      handler: () =>
        confirmAction(
          "Decline this transfer? The transferred copies will be removed from your ownership.",
          () => declineTradeTransfer(trade.value.id),
        ),
    });
  }

  return buttons;
});

function isCurrentUser(username) {
  return username === user.value?.username;
}

function syncSelectedItems() {
  selectedTradeItems.value = {};

  for (const item of trade.value?.items ?? []) {
    selectedTradeItems.value[item.id] = item.sellerAccepted === true;
  }
}

async function loadTrade() {
  trade.value = await getTrade(route.params.id);
  syncSelectedItems();
}

function isItemSelected(item) {
  return selectedTradeItems.value[item.id] === true;
}

function isItemUnavailable(item) {
  /*
   * For the buyer, this reflects the saved backend value.
   * For the seller, it also previews a currently deselected item.
   */
  return item.sellerAccepted === false ||
    (canEditItems.value && !isItemSelected(item));
}

function toggleTradeItem(item) {
  selectedTradeItems.value[item.id] = !isItemSelected(item);
}

async function saveTradeItems() {
  savingItems.value = true;

  try {
    const items = trade.value.items.map((item) => ({
      tradeItemId: item.id,
      sellerAccepted: isItemSelected(item),
    }));

    trade.value = await updateTradeItems(trade.value.id, items);
    syncSelectedItems();
  } finally {
    savingItems.value = false;
  }
}

function openCompleteModal() {
  if (selectedTradeItemCount.value === 0) {
    return;
  }

  showCompleteModal.value = true;
}

function closeCompleteModal() {
  if (!completingTrade.value) {
    showCompleteModal.value = false;
  }
}

async function completeWithoutTransfer() {
  if (selectedTradeItemCount.value === 0) {
    return;
  }

  completingTrade.value = true;

  try {
    await saveTradeItems();
    trade.value = await completeTrade(trade.value.id, false);
    syncSelectedItems();
    showCompleteModal.value = false;
  } finally {
    completingTrade.value = false;
  }
}

async function completeWithTransfer() {
  if (selectedTradeItemCount.value === 0) {
    return;
  }

  const confirmed = window.confirm(
    "Transfer the selected copies to the buyer? Ownership will immediately change to the buyer.",
  );

  if (!confirmed) {
    return;
  }

  completingTrade.value = true;

  try {
    await saveTradeItems();
    trade.value = await completeTrade(trade.value.id, true);
    syncSelectedItems();
    showCompleteModal.value = false;
  } finally {
    completingTrade.value = false;
  }
}

async function sendMessage(message) {
  sendingMessage.value = true;

  try {
    trade.value = await addTradeMessage(trade.value.id, message);
  } finally {
    sendingMessage.value = false;
  }
}

async function confirmAction(message, action) {
  if (window.confirm(message)) {
    await runAction(action);
  }
}

async function runAction(action) {
  trade.value = await action();
  syncSelectedItems();
}

onMounted(loadTrade);

watch(
  () => route.params.id,
  loadTrade,
);
</script>

<style scoped>
.title-row,
.section-header,
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.summary-card,
.trade-selection,
.modal {
  background: var(--code-bg);
  border-radius: 12px;
  padding: 1rem;
}

.summary-card p {
  margin: 0.35rem 0;
}

.section-header {
  margin-bottom: 1rem;
}

.section-header h2,
.modal-header h2 {
  margin: 0;
}

.trade-items {
  display: grid;
  gap: 0.85rem;
}

.trade-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  background: var(--code-bg);
  border: 1px solid transparent;
  border-radius: 12px;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.trade-item.item-unavailable {
  background: rgba(180, 40, 40, 0.16);
  border-color: #b83a3a;
}

.item-content {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  min-width: 0;
}

.item-checkbox {
  display: flex;
  padding-top: 0.2rem;
  cursor: pointer;
}

.item-checkbox input {
  width: 18px;
  height: 18px;
}

.item-details h3 {
  margin: 0;
}

.item-edition,
.item-price {
  margin: 0.35rem 0 0;
}

.item-edition {
  opacity: 0.7;
}

.item-price {
  font-weight: 700;
}

.unavailable-price {
  color: #f08a8a;
  text-decoration: line-through;
  opacity: 0.8;
}

.unavailable-tag {
  flex: 0 0 auto;
  padding: 0.3rem 0.6rem;
  color: #ffd0d0;
  background: rgba(180, 40, 40, 0.32);
  border: 1px solid #d85a5a;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}

.trade-total {
  margin: 1rem 0 0;
  font-size: 1.1rem;
  text-align: right;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1.5rem 0;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.65);
}

.modal {
  width: min(500px, 100%);
  padding: 1.25rem;
}

.close-button {
  border: 0;
  background: transparent;
  font-size: 1.75rem;
  cursor: pointer;
}

.modal-content {
  margin-top: 1rem;
}

.complete-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.25rem 0;
}

.modal-note {
  color: #aaa;
  font-size: 0.9rem;
}

.primary-button,
.secondary-button {
  cursor: pointer;
}

.primary-button:disabled,
.secondary-button:disabled,
.close-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 600px) {
  .trade-item {
    flex-direction: column;
  }

  .unavailable-tag {
    align-self: flex-start;
  }
}
</style>