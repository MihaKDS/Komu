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

          <span v-else>
              {{ trade.buyer.username }}
          </span>
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

          <span v-else>
              {{ trade.seller.username }}
          </span>
      </p>
      <p><strong>Seller confirmed transfer:</strong> {{ trade.sellerConfirmedTransfer ? "Yes" : "No" }}</p>
      <p><strong>Buyer confirmed transfer:</strong> {{ trade.buyerConfirmedTransfer ? "Yes" : "No" }}</p>
      <p v-if="trade.type === 'RENT'"><strong>Return requested:</strong> {{ trade.returnRequested ? "Yes" : "No" }}</p>
      <p v-if="trade.cancelledReason"><strong>Cancellation reason:</strong> {{ trade.cancelledReason }}</p>
    </section>

    <section>
      <h2>Items</h2>
      <TradeItems :items="trade.items" :tradeType="trade.type" />
    </section>

    <section class="actions" v-if="actionButtons.length">
      <button
        v-for="action in actionButtons"
        :key="action.label"
        type="button"
        @click="action.handler"
      >
        {{ action.label }}
      </button>
    </section>

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
import TradeItems from "../components/trade/TradeItems.vue";
import TradeMessages from "../components/trade/TradeMessages.vue";
import TradeStatus from "../components/trade/TradeStatus.vue";
import {
  acceptTradeReturn,
  addTradeMessage,
  acceptTrade,
  confirmBuyerTransfer,
  confirmSellerTransfer,
  getTrade,
  rejectTrade,
  requestTradeReturn,
} from "../api/tradeAPI.js";

function isCurrentUser(username) {
    return username === useAuth().user.value?.username;
}

const route = useRoute();

const trade = ref(null);
const sendingMessage = ref(false);

const actionButtons = computed(() => {
  if (!trade.value) {
    return [];
  }

  const buttons = [];

  if (trade.value.viewerRole === "seller" && trade.value.status === "REQUESTED") {
    buttons.push(
      { label: "Accept", handler: () => runAction(() => acceptTrade(trade.value.id)) },
      { label: "Reject", handler: () => runAction(() => rejectTrade(trade.value.id)) },
    );
  }

  if (
    trade.value.status === "ACCEPTED" &&
    trade.value.viewerRole === "seller" &&
    !trade.value.sellerConfirmedTransfer
  ) {
    buttons.push({
      label: "Confirm transfer as seller",
      handler: () => runAction(() => confirmSellerTransfer(trade.value.id)),
    });
  }

  if (
    trade.value.status === "ACCEPTED" &&
    trade.value.viewerRole === "buyer" &&
    !trade.value.buyerConfirmedTransfer
  ) {
    buttons.push({
      label: "Confirm transfer as buyer",
      handler: () => runAction(() => confirmBuyerTransfer(trade.value.id)),
    });
  }

  if (
    trade.value.status === "RENTING" &&
    trade.value.viewerRole === "buyer" &&
    !trade.value.returnRequested
  ) {
    buttons.push({
      label: "Return",
      handler: () => runAction(() => requestTradeReturn(trade.value.id)),
    });
  }

  if (
    trade.value.status === "RENTING" &&
    trade.value.viewerRole === "seller" &&
    trade.value.returnRequested
  ) {
    buttons.push({
      label: "Accept return",
      handler: () => runAction(() => acceptTradeReturn(trade.value.id)),
    });
  }

  return buttons;
});

async function loadTrade() {
  trade.value = await getTrade(route.params.id);
}

async function sendMessage(message) {
  sendingMessage.value = true;
  try {
    trade.value = await addTradeMessage(trade.value.id, message);
  } finally {
    sendingMessage.value = false;
  }
}

async function runAction(action) {
  trade.value = await action();
}

onMounted(loadTrade);

watch(
  () => route.params.id,
  loadTrade,
);
</script>

<style scoped>
.title-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}

.summary-card {
  background: #222;
  border-radius: 12px;
  padding: 1rem;
}

.summary-card p {
  margin: 0.35rem 0;
}

.actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin: 1.5rem 0;
}
</style>
