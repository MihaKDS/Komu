<template>
  <section class="trade-items-wrapper">
    <section v-if="items.length === 1" class="trade-items">
      <article v-for="item in items" :key="item.id || item.copyId" class="trade-item">
        <img
          class="poster"
          :src="posterSource(item.media.poster)"
          :alt="item.media.title"
        >

        <div class="content">
          <RouterLink
            :to="{ name: 'media', params: { id: item.media.id }, query: { from: 'trades' } }"
            class="title-link"
          >
            {{ item.media.title }}
          </RouterLink>

          <p>{{ item.media.releaseYear }} • {{ item.media.category }}</p>
          <p>{{ item.edition }}</p>

          <p v-if="item.boxSet">
            Part of
            <RouterLink :to="{ name: 'boxset', params: { id: item.boxSet.id }, query: { from: 'trades' } }" class="boxset-link">
              Box Set #{{ item.boxSet.id }}
            </RouterLink>
          </p>

          <p class="price">{{ priceLabel(item) }}</p>
        </div>
      </article>
    </section>

    <details v-else class="items-collapse">
      <summary>Items ({{ items.length }})</summary>

      <section class="trade-items">
        <article v-for="item in items" :key="item.id || item.copyId" class="trade-item">
          <img
            class="poster"
            :src="posterSource(item.media.poster)"
            :alt="item.media.title"
          >

          <div class="content">
            <RouterLink
              :to="{ name: 'media', params: { id: item.media.id }, query: { from: 'trades' } }"
              class="title-link"
            >
              {{ item.media.title }}
            </RouterLink>

            <p>{{ item.media.releaseYear }} • {{ item.media.category }}</p>
            <p>{{ item.edition }}</p>

            <p v-if="item.boxSet">
              Part of
              <RouterLink :to="{ name: 'boxset', params: { id: item.boxSet.id }, query: { from: 'trades' } }" class="boxset-link">
                Box Set #{{ item.boxSet.id }}
              </RouterLink>
            </p>

            <p class="price">{{ priceLabel(item) }}</p>
          </div>
        </article>
      </section>
    </details>

    <div class="total-row">
      <strong>{{ totalLabel }}</strong>
      <strong>{{ totalPrice }} €</strong>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  tradeType: {
    type: String,
    required: true,
  },
});

const totalPrice = computed(() => {
  return props.items.reduce((sum, item) => sum + (item.agreedPrice || 0), 0);
});

const totalLabel = computed(() => {
  return props.tradeType === "RENT" ? "Total Deposit" : "Total";
});

function posterSource(poster) {
  return poster?.startsWith("http") ? poster : `/posters/${poster}`;
}

function priceLabel(item) {
  if (item.agreedPrice === 0 && item.boxSet) {
    return "Included in box set total";
  }

  return props.tradeType === "RENT"
    ? `Deposit: ${item.agreedPrice} €`
    : `${item.agreedPrice} €`;
}
</script>

<style scoped>
.trade-items-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.trade-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.items-collapse summary {
  cursor: pointer;
  font-weight: 700;
}

.items-collapse[open] summary {
  margin-bottom: 1rem;
}

.trade-item {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  background: #222;
}

.poster {
  width: 90px;
  height: 135px;
  object-fit: cover;
  border-radius: 10px;
}

.content p {
  margin: 0.25rem 0;
  color: #bbb;
}

.title-link {
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}

.title-link:hover,
.boxset-link:hover {
  text-decoration: underline;
}

.boxset-link {
  color: #7acbff;
}

.price {
  color: #fff !important;
  font-weight: 700;
}

.total-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  background: #1b1b1b;
}
</style>
