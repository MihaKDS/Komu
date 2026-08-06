<template>
  <div class="page">
    <Breadcrumbs :title="pageTitle" />
    <h1>{{ pageTitle }}</h1>

    <p v-if="sellerData?.seller?.city" class="seller-city">
      {{ sellerData.seller.city }}
    </p>

    <SearchBar @search="search = $event" />

    <CategorySelector
      :categories="categories"
      :selected="selectedCategory"
      @change="selectedCategory = $event"
    />

    <FilterBar
      :format="selectedFormat"
      :viewMode="'list'"
      :showCollectionFilter="false"
      :showViewToggle="false"
      @update:format="selectedFormat = $event"
    />
        <div class="trade-tabs">
      <button
        type="button"
        :class="{ active: activeMode === 'SELL' }"
        @click="switchMode('SELL')"
      >
        For Sale ({{ saleCount }})
      </button>
      <button
        type="button"
        :class="{ active: activeMode === 'RENT' }"
        @click="switchMode('RENT')"
      >
        For Rent ({{ rentCount }})
      </button>
    </div>

    <div v-if="loading" class="loading">
      Loading...
    </div>

    <div v-else-if="filteredListings.length === 0" class="empty">
      No {{ activeMode === 'SELL' ? 'sale' : 'rental' }} listings match your filters.
    </div>

    <template v-else>
      <section v-if="canRequest" class="request-panel">
        <h2>Request selected items</h2>

        <textarea
          v-model="requestMessage"
          rows="4"
          placeholder="Optional message for the seller..."
        />

        <button
          type="button"
          :disabled="selectedListingKeys.length === 0 || requestingTrade"
          @click="submitTradeRequest"
        >
          {{ requestingTrade ? "Requesting..." : `Request Selected Items (${selectedListingKeys.length})` }}
        </button>

        <p v-if="requestError" class="error">{{ requestError }}</p>
      </section>

      <p v-else-if="!auth.user.value" class="empty">
        Log in to request items from this seller.
      </p>

      <section class="listing-list">
        <article
          v-for="listing in filteredListings"
          :key="listing.key"
          :class="['seller-listing-card', { selected: isSelected(listing.key) }]"
        >
          <label v-if="canRequest" class="selection-box" @click.stop>
            <input
              type="checkbox"
              :checked="isSelected(listing.key)"
              @change="toggleSelected(listing)"
            >
          </label>

          <img
            class="poster"
            :src="posterSource(listing.poster)"
            :alt="listing.title"
          >

          <div class="listing-content">
            <div class="listing-header">
              <h3>{{ listing.title }}</h3>
              <span class="kind-badge">{{ listing.type === 'boxSet' ? 'Box Set' : listing.edition }}</span>
            </div>

            <p class="listing-meta">
              {{ listing.type === 'boxSet' ? `${listing.boxSet.copyCount} movies` : `${listing.edition} • ${listing.condition}` }}
            </p>

            <p v-if="listing.type === 'boxSet' && listing.boxSet.listingNote" class="listing-note">
              {{ listing.boxSet.listingNote }}
            </p>

            <p class="listing-price">
              {{ activeMode === 'SELL' ? `${listing.price} €` : `${listing.price} €/month` }}
            </p>

            <p v-if="listing.type === 'boxSet'" class="listing-subtitle">
              {{ listing.mediaTitles.join(' • ') }}
            </p>

            <RouterLink
              :to="listing.type === 'boxSet'
                ? { name: 'boxset', params: { id: listing.boxSetId }, query: { from: 'seller' } }
                : { name: 'media', params: { id: listing.mediaId }, query: { from: 'seller' } }"
              class="listing-link"
            >
              View details
            </RouterLink>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import Breadcrumbs from "../components/layout/Breadcrumbs.vue";
import CategorySelector from "../components/ui/CategorySelector.vue";
import FilterBar from "../components/ui/FilterBar.vue";
import SearchBar from "../components/ui/SearchBar.vue";
import { getSellerListings } from "../api/mediaAPI.js";
import { createTrade } from "../api/tradeAPI.js";
import { useAuth } from "../composables/useAuth";

const route = useRoute();
const router = useRouter();
const auth = useAuth();

const loading = ref(true);
const sellerData = ref(null);
const search = ref("");
const selectedCategory = ref("MOVIE");
const selectedFormat = ref("ALL");
const activeMode = ref("SELL");
const selectedListingKeys = ref([]);
const requestMessage = ref("");
const requestingTrade = ref(false);
const requestError = ref("");

const categories = ["MOVIE", "BOOK", "GAME", "MUSIC"];

const pageTitle = computed(() => {
  return sellerData.value?.seller?.username
    ? `${sellerData.value.seller.username}'s listings`
    : "Seller listings";
});

const saleCount = computed(() => sellerData.value?.saleItems?.length ?? 0);
const rentCount = computed(() => sellerData.value?.rentItems?.length ?? 0);

const activeListings = computed(() => {
  if (!sellerData.value) {
    return [];
  }

  return activeMode.value === "SELL"
    ? sellerData.value.saleItems ?? []
    : sellerData.value.rentItems ?? [];
});

function matchesFormat(item) {
  if (selectedFormat.value === "ALL") {
    return true;
  }

  if (item.type === "boxSet") {
    return Boolean(item.formats?.[selectedFormat.value]);
  }

  return Boolean(item.formats?.[selectedFormat.value]);
}

const filteredListings = computed(() => {
  const searchValue = search.value.toLowerCase();

  return activeListings.value.filter((item) => {
    return (
      item.category === selectedCategory.value &&
      matchesFormat(item) &&
      item.title.toLowerCase().includes(searchValue)
    );
  });
});

const canRequest = computed(() => {
  return Boolean(auth.user.value && auth.user.value.username !== sellerData.value?.seller?.username);
});

function posterSource(poster) {
  return poster?.startsWith("http") ? poster : `/posters/${poster}`;
}

function isSelected(key) {
  return selectedListingKeys.value.includes(key);
}

function switchMode(mode) {
  if (activeMode.value === mode) {
    return;
  }

  activeMode.value = mode;
  selectedListingKeys.value = [];
  requestError.value = "";
  requestMessage.value = "";
}

function toggleSelected(listing) {
  if (isSelected(listing.key)) {
    selectedListingKeys.value = selectedListingKeys.value.filter((key) => key !== listing.key);
    return;
  }

  selectedListingKeys.value = [...selectedListingKeys.value, listing.key];
}

function flattenSelectedCopyIds() {
  return filteredListings.value
    .filter((item) => selectedListingKeys.value.includes(item.key))
    .flatMap((item) => item.copyIds || []);
}

async function loadSellerListings() {
  loading.value = true;
  selectedListingKeys.value = [];
  requestMessage.value = "";
  requestError.value = "";

  if (auth.token.value && !auth.user.value) {
    await auth.loadUser();
  }

  sellerData.value = await getSellerListings(route.params.username);
  document.title = `Komu - ${pageTitle.value}`;
  loading.value = false;
}

async function submitTradeRequest() {
  requestError.value = "";

  const copyIds = flattenSelectedCopyIds();

  if (copyIds.length === 0) {
    requestError.value = "No items were selected.";
    return;
  }

  requestingTrade.value = true;
  try {
    const trade = await createTrade({
      type: activeMode.value === "SELL" ? "BUY" : "RENT",
      copyIds,
      message: requestMessage.value.trim() || undefined,
    });

    router.push({
      name: "trade-detail",
      params: {
        id: trade.id,
      },
      query: {
        from: "seller",
      },
    });
  } catch (error) {
    requestError.value = error.message || "Unable to create trade request.";
  } finally {
    requestingTrade.value = false;
  }
}

onMounted(loadSellerListings);

watch(
  () => route.params.username,
  loadSellerListings,
);
</script>

<style scoped>
.seller-city {
  color: #aaa;
  margin-bottom: 1rem;
}

.trade-tabs {
  display: flex;
  gap: 0.75rem;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.trade-tabs button {
  border: 1px solid #444;
  background: #222;
  color: #ddd;
  padding: 0.7rem 1rem;
  border-radius: 10px;
  cursor: pointer;
}

.trade-tabs button.active {
  background: #3f8cff;
  color: #fff;
  border-color: rgba(63, 140, 255, 0.7);
}

.loading,
.empty {
  margin-top: 1.5rem;
  color: #aaa;
}

.request-panel {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  border-radius: 12px;
  background: #222;
}

.request-panel textarea {
  width: 100%;
  box-sizing: border-box;
  background: #1f1f1f;
  color: #fff;
  border: 1px solid #444;
  border-radius: 10px;
  padding: 0.75rem;
}

.request-panel button {
  margin-top: 0.75rem;
}

.listing-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.seller-listing-card {
  display: grid;
  grid-template-columns: 28px 90px 1fr;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  background: #222;
  align-items: start;
}

.seller-listing-card.selected {
  border: 2px solid rgba(76, 175, 80, 0.65);
}

.selection-box {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 0.2rem;
}

.selection-box input {
  width: 1rem;
  height: 1rem;
}

.poster {
  width: 90px;
  height: 135px;
  border-radius: 10px;
  object-fit: cover;
}

.listing-content {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}

.listing-header {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.listing-header h3 {
  margin: 0;
}

.kind-badge {
  background: #3f8cff;
  color: #fff;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  font-size: 0.8rem;
}

.listing-meta,
.listing-note,
.listing-subtitle {
  color: #bbb;
}

.listing-price {
  color: #fff;
  font-weight: 700;
}

.listing-link {
  color: #7acbff;
  text-decoration: underline;
  width: fit-content;
}

.error {
  color: #ff9d9d;
}

@media (max-width: 768px) {
  .seller-listing-card {
    grid-template-columns: 24px 72px 1fr;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .poster {
    width: 72px;
    height: 108px;
  }
}
</style>
