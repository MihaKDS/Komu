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
          <h3>Trade #{{ trade.id }}</h3>
          <TradeStatus :status="trade.status" />
        </div>

        <p class="relationship">
          {{ trade.viewerRole === "buyer" ? "Buying from" : "Selling to" }}:
          <strong>{{ trade.viewerRole === "buyer" ? trade.seller.username : trade.buyer.username }}</strong>
        </p>

        <div class="meta-row">
          <span>Type: <strong>{{ trade.type }}</strong></span>
          <span>Items: <strong>{{ trade.items.length }}</strong></span>
        </div>

        <p class="items-preview">
          {{ trade.items.map((item) => tradeItemPreview(item)).join(" · ") }}
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
import { formatComicVolumes } from "../utils/comicVolumes.js";

const loading = ref(true);
const trades = ref([]);

async function loadTrades() {
  loading.value = true;
  trades.value = await getTrades();
  loading.value = false;
}

onMounted(loadTrades);

function tradeItemPreview(item) {
  const volumes = formatComicVolumes(
    item.volumes ?? [],
  );

  return volumes
    ? `${item.title} (${volumes})`
    : item.title;
}
</script>

<style scoped>
.page {
  text-align: left;
}

.trade-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.trade-card {
  display: block;
  padding: 0.75rem 0.9rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-small);
  color: inherit;
  text-decoration: none;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.trade-card:hover {
  background: var(--bg-hover);
  border-color: var(--border-light);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.card-header h3 {
  margin: 0;
  font-size: 0.98rem;
  color: var(--text-h);
}

.relationship {
  margin: 0.35rem 0 0;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.relationship strong {
  color: var(--text-h);
  font-weight: 600;
}

.meta-row {
  display: flex;
  gap: 1.1rem;
  margin: 0.3rem 0 0;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.meta-row strong {
  color: var(--text-secondary);
  font-weight: 600;
}

.items-preview {
  margin: 0.35rem 0 0;
  color: var(--text-secondary);
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.last-message {
  margin: 0.35rem 0 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty {
  color: var(--text-muted);
}

@media (max-width: 600px) {
  .items-preview,
  .last-message {
    white-space: normal;
  }
}
</style>
