<template>
  <div v-if="trade" class="page trade-detail-page">
    <Breadcrumbs :title="`Trade #${trade.id}`" />

    <div class="title-row">
      <h1>Trade #{{ trade.id }}</h1>
      <TradeStatus :status="trade.status" />
    </div>

    <section class="trade-info">
      <div class="info-item">
        <span class="info-label">Type</span>
        <span class="info-value">{{ trade.type }}</span>
      </div>

      <div class="info-item">
        <span class="info-label">Buyer</span>
        <span class="info-value">
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
        </span>
      </div>

      <div class="info-item">
        <span class="info-label">Seller</span>
        <span class="info-value">
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
        </span>
      </div>

      <div v-if="trade.cancelledReason" class="info-item info-item-full">
        <span class="info-label">Cancellation reason</span>
        <span class="info-value">{{ trade.cancelledReason }}</span>
      </div>
    </section>

    <section class="items-section">
      <h2>Items</h2>

      <div class="trade-items">
        <article
          v-for="group in groupedTradeItems"
          :key="group.key"
          class="trade-item"
          :class="{ 'item-unavailable': isGroupUnavailable(group), expanded: isExpanded(group) }"
        >
          <div
            class="item-row"
            @click="toggleExpand(group)"
          >
            <label
              v-if="canEditItems"
              class="item-checkbox"
              @click.stop
            >
              <input
                type="checkbox"
                :checked="isGroupSelected(group)"
                @change="toggleGroupSelection(group)"
              >
              <span class="sr-only">
                Include {{ groupTitle(group) }} in this trade
              </span>
            </label>

            <span class="item-title">{{ groupTitle(group) }}</span>

            <span v-if="group.items[0].edition" class="item-format">
              {{ editionLabel(group.items[0].edition) }}
            </span>

            <span
              v-if="isGroupUnavailable(group)"
              class="unavailable-tag"
            >
              No longer available
            </span>

            <span
              v-if="groupPrice(group) != null"
              class="item-price"
              :class="{ 'unavailable-price': isGroupUnavailable(group) }"
            >
              {{ groupPrice(group) }} €
            </span>

            <button
              type="button"
              class="expand-toggle"
              :aria-expanded="isExpanded(group)"
              aria-label="Toggle item details"
              @click.stop="toggleExpand(group)"
            >
              {{ isExpanded(group) ? '▲' : '▼' }}
            </button>
          </div>

          <div v-if="isExpanded(group)" class="item-expanded">
            <div v-if="!group.isBoxSet" class="expanded-grid">
              <div v-if="group.items[0].media.releaseYear" class="expanded-field">
                <span class="expanded-label">Release year</span>
                <span class="expanded-value">{{ group.items[0].media.releaseYear }}</span>
              </div>

              <div v-if="group.items[0].media.category" class="expanded-field">
                <span class="expanded-label">Category</span>
                <span class="expanded-value">{{ group.items[0].media.category }}</span>
              </div>

              <div v-if="tradeItemVolumes(group.items[0])" class="expanded-field">
                <span class="expanded-label">Volumes</span>
                <span class="expanded-value">{{ tradeItemVolumes(group.items[0]) }}</span>
              </div>

              <div v-if="group.items[0].media.mediaCollection" class="expanded-field">
                <span class="expanded-label">Collection</span>
                <span class="expanded-value">{{ group.items[0].media.mediaCollection.title }}</span>
              </div>
            </div>

            <div v-if="group.isBoxSet" class="boxset-contents">
              <p class="boxset-count">
                Contains {{ group.items.length }} items
              </p>

              <ol class="boxset-item-list">
                <li
                  v-for="boxItem in group.items"
                  :key="boxItem.id"
                >
                  {{ boxItem.media.title }}
                </li>
              </ol>
            </div>
          </div>
        </article>
      </div>

      <div class="items-footer">
        <button
          v-if="canEditItems"
          type="button"
          class="secondary-button save-selection"
          :disabled="savingItems"
          @click="saveTradeItems"
        >
          {{ savingItems ? "Saving..." : "Save selection" }}
        </button>

        <p class="trade-total">
          <span>Total</span>
          <strong>{{ tradeTotal }} €</strong>
        </p>
      </div>
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

    <section class="messages-section">
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
import { formatComicVolumes } from "../utils/comicVolumes.js";

const route = useRoute();
const { user } = useAuth();

const trade = ref(null);
const sendingMessage = ref(false);
const savingItems = ref(false);
const completingTrade = ref(false);
const selectedTradeItems = ref({});
const showCompleteModal = ref(false);
const expandedItems = ref({});

/*
 * Group trade items that belong to the same BoxSet into a single display
 * row so the BoxSet is presented (and selected) as one trade unit, while
 * standalone media copies keep their own individual row.
 */
const groupedTradeItems = computed(() => {
  if (!trade.value?.items) {
    return [];
  }

  const groups = [];
  const boxSetGroups = new Map();

  for (const item of trade.value.items) {
    if (item.boxSet) {
      let group = boxSetGroups.get(item.boxSet.id);

      if (!group) {
        group = {
          key: `boxset-${item.boxSet.id}`,
          isBoxSet: true,
          boxSet: item.boxSet,
          items: [],
        };
        boxSetGroups.set(item.boxSet.id, group);
        groups.push(group);
      }

      group.items.push(item);
    } else {
      groups.push({
        key: `item-${item.id}`,
        isBoxSet: false,
        items: [item],
      });
    }
  }

  return groups;
});

function isExpanded(group) {
  return expandedItems.value[group.key] === true;
}

function toggleExpand(group) {
  expandedItems.value = {
    ...expandedItems.value,
    [group.key]: !isExpanded(group),
  };
}

function groupTitle(group) {
  if (group.isBoxSet) {
    return group.boxSet.name || group.boxSet.title || `Box Set #${group.boxSet.id}`;
  }

  return group.items[0].media.title;
}

/*
 * A BoxSet's agreed price is only stored on one of its underlying copies
 * (the rest are recorded as 0), so summing the group reproduces the
 * existing BoxSet/trade price without duplicating or inventing pricing
 * logic.
 */
function groupPrice(group) {
  const hasPrice = group.items.some((item) => item.agreedPrice != null);

  if (!hasPrice) {
    return null;
  }

  return group.items.reduce(
    (sum, item) => sum + Number(item.agreedPrice ?? 0),
    0,
  );
}

function isGroupSelected(group) {
  return group.items.every((item) => isItemSelected(item));
}

function toggleGroupSelection(group) {
  const next = !isGroupSelected(group);

  for (const item of group.items) {
    selectedTradeItems.value[item.id] = next;
  }
}

function isGroupUnavailable(group) {
  return group.items.some((item) => item.sellerAccepted === false) ||
    (canEditItems.value && !isGroupSelected(group));
}

const EDITION_LABELS = {
  DVD: "DVD",
  BLURAY: "Blu-ray",
  UHD_4K: "4K UHD",
  CD: "CD",
  VINYL: "Vinyl",
  SOFT_COVER: "Softcover",
  HARD_COVER: "Hardcover",
};

function editionLabel(edition) {
  return EDITION_LABELS[edition] || edition;
}

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

function tradeItemVolumes(item) {
  return formatComicVolumes(
    item.volumes ?? [],
  );
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
.trade-detail-page {
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  text-align: left;
}

.title-row,
.section-header,
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.title-row {
  margin-bottom: 0.85rem;
}

.title-row h1 {
  margin: 0;
  font-size: 1.3rem;
}

/* Trade information */

.trade-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.6rem 1.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-small);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.info-item-full {
  grid-column: 1 / -1;
}

.info-label {
  color: var(--text-muted);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-value {
  color: var(--text-h);
  font-size: 0.92rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.info-value a {
  color: var(--accent);
}

/* Items section */

.items-section h2,
.messages-section h2 {
  margin: 0 0 0.6rem;
  font-size: 1.05rem;
  color: var(--text-h);
}

.trade-items {
  display: grid;
  gap: 0.4rem;
}

.trade-item {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-small);
  transition: border-color 0.15s ease;
}

.trade-item.expanded {
  border-color: var(--border-light);
}

.trade-item.item-unavailable {
  background: var(--danger-bg);
  border-color: rgba(226, 118, 122, 0.45);
}

.item-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.65rem;
  cursor: pointer;
}

.item-checkbox {
  display: flex;
  flex: 0 0 auto;
  cursor: pointer;
}

.item-checkbox input {
  width: 15px;
  height: 15px;
  margin: 0;
}

.item-title {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-h);
  font-size: 0.95rem;
  font-weight: 600;
}

.item-format {
  flex: 0 0 auto;
  color: var(--text-secondary);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.item-price {
  flex: 0 0 auto;
  color: var(--text-h);
  font-size: 0.9rem;
  font-weight: 700;
  white-space: nowrap;
}

.unavailable-price {
  color: var(--danger);
  text-decoration: line-through;
  opacity: 0.85;
}

.unavailable-tag {
  flex: 0 0 auto;
  padding: 0.15rem 0.5rem;
  color: var(--danger);
  background: var(--danger-bg);
  border: 1px solid rgba(226, 118, 122, 0.5);
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
}

.expand-toggle {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  font-size: 0.7rem;
  cursor: pointer;
}

.expand-toggle:hover {
  color: var(--text-h);
}

.item-expanded {
  padding: 0.1rem 0.65rem 0.65rem 2rem;
  border-top: 1px solid var(--border);
}

.expanded-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.4rem 1rem;
  padding-top: 0.5rem;
}

.expanded-field {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.expanded-label {
  color: var(--text-muted);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.expanded-value {
  color: var(--text-secondary);
  font-size: 0.82rem;
  overflow-wrap: anywhere;
}

.boxset-contents {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border);
}

.boxset-count {
  margin: 0 0 0.3rem;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
}

.boxset-item-list {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--text-secondary);
  font-size: 0.82rem;
  display: grid;
  gap: 0.15rem;
}

.items-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
}

.save-selection {
  order: 1;
}

.trade-total {
  order: 2;
  margin: 0 0 0 auto;
  color: var(--text-h);
  font-size: 0.95rem;
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.trade-total span {
  color: var(--text-muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.trade-total strong {
  font-size: 1.05rem;
}

/* Actions */

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin: 1.5rem 0;
}

.section-header {
  margin-bottom: 1rem;
}

.section-header h2,
.modal-header h2 {
  margin: 0;
}

.primary-button,
.secondary-button {
  padding: 0.45rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: var(--radius-small);
  cursor: pointer;
  white-space: nowrap;
}

.primary-button {
  color: #fff;
  background: var(--accent);
  border: 1px solid var(--accent);
}

.primary-button:hover:not(:disabled) {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.secondary-button {
  color: var(--text-h);
  background: transparent;
  border: 1px solid var(--border-light);
}

.secondary-button:hover:not(:disabled) {
  background: var(--bg-hover);
}

.primary-button:disabled,
.secondary-button:disabled,
.close-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Modal */

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
  width: min(460px, 100%);
  padding: 1.1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-small);
}

.close-button {
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}

.modal-content {
  margin-top: 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.complete-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.25rem 0;
}

.modal-note {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.messages-section {
  margin-top: 1.5rem;
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
  .trade-info {
    grid-template-columns: 1fr 1fr;
  }

  .item-row {
    flex-wrap: wrap;
  }

  .item-title {
    white-space: normal;
    flex-basis: 100%;
    order: -1;
  }

  .item-expanded {
    padding-left: 0.65rem;
  }

  .items-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .trade-total {
    margin: 0;
    justify-content: flex-end;
  }
}
</style>