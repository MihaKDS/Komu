<template>
  <div class="page">
    <Breadcrumbs title="Trades" />
    <h1>Trades</h1>

    <div v-if="loading" class="empty">
      Loading...
    </div>

    <div v-else-if="trades.length === 0" class="empty">
      You have no trades yet.
    </div>

    <section v-else class="trade-list">
      <RouterLink
        v-for="trade in trades"
        :key="trade.id"
        :to="{ name: 'trade-detail', params: { id: trade.id }, query: { from: 'trades' } }"
        class="trade-card"
      >
        <div class="card-header">
          <div>
            <h3>Trade #{{ trade.id }}</h3>
            <p>
              {{ trade.viewerRole === "buyer" ? "Buying from" : "Selling to" }}
              {{ trade.viewerRole === "buyer" ? trade.seller.username : trade.buyer.username }}
            </p>
          </div>

          <TradeStatus :status="trade.status" />
        </div>

        <p class="meta">{{ trade.type }} • {{ trade.items.length }} item(s)</p>

        <p class="items-preview">
          {{ trade.items.map((item) => item.title).join(", ") }}
        </p>

        <p v-if="trade.lastMessage" class="last-message">
          {{ trade.lastMessage.sender.username }}: {{ trade.lastMessage.message }}
        </p>
      </RouterLink>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import Breadcrumbs from "../components/layout/Breadcrumbs.vue";
import TradeStatus from "../components/trade/TradeStatus.vue";
import { getTrades } from "../api/tradeAPI.js";

const loading = ref(true);
const trades = ref([]);

async function loadTrades() {
  loading.value = true;
  trades.value = await getTrades();
  loading.value = false;
}

onMounted(loadTrades);
</script>

<style scoped>
.trade-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.trade-card {
  display: block;
  padding: 1rem;
  background: var(--code-bg);
  border-radius: 12px;
  color: inherit;
  text-decoration: none;
}

.trade-card:hover {
  background: var(--accent-bg);
}

.card-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.card-header h3 {
  margin: 0 0 0.35rem;
}

.card-header p,
.meta,
.items-preview,
.last-message {
  margin: 0.35rem 0 0;
}

.meta,
.last-message {
  color: #bbb;
}

.empty {
  color: #aaa;
}
</style>
