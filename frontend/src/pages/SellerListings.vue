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

    <div v-if="loading" class="loading">
      Loading...
    </div>

    <div v-else-if="filteredItems.length === 0" class="empty">
      No available listings match your filters.
    </div>

    <template v-else>
      <section v-if="auth.user.value && auth.user.value.username !== sellerData?.seller?.username" class="request-panel">
        <h2>Request selected items</h2>

        <div class="request-controls">
          <label>
            Trade type
            <select v-model="tradeType">
              <option value="BUY">Buy</option>
              <option value="RENT">Rent</option>
            </select>
          </label>
        </div>

        <textarea
          v-model="requestMessage"
          rows="4"
          placeholder="Optional message for the seller..."
        />

        <button
          type="button"
          :disabled="selectedMediaIds.length === 0 || requestingTrade"
          @click="submitTradeRequest"
        >
          {{ requestingTrade ? "Requesting..." : `Request Selected Items (${selectedMediaIds.length})` }}
        </button>

        <p v-if="requestError" class="error">{{ requestError }}</p>
      </section>

      <p v-else-if="!auth.user.value" class="empty">
        Log in to request items from this seller.
      </p>

      <MediaList
        :mediaList="filteredItems"
        mode="seller"
        :selectable="Boolean(auth.user.value && auth.user.value.username !== sellerData?.seller?.username)"
        :selectedIds="selectedMediaIds"
        @toggle-select="toggleSelected"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import Breadcrumbs from "../components/layout/Breadcrumbs.vue";
import CategorySelector from "../components/ui/CategorySelector.vue";
import FilterBar from "../components/ui/FilterBar.vue";
import SearchBar from "../components/ui/SearchBar.vue";
import MediaList from "../components/media/MediaList.vue";
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
const selectedMediaIds = ref([]);
const tradeType = ref("BUY");
const requestMessage = ref("");
const requestingTrade = ref(false);
const requestError = ref("");

const categories = ["MOVIE", "BOOK", "GAME", "MUSIC"];

const pageTitle = computed(() => {
  return sellerData.value?.seller?.username
    ? `${sellerData.value.seller.username}'s listings`
    : "Seller listings";
});

function matchesFormat(item) {
  if (selectedFormat.value === "ALL") {
    return true;
  }

  const formats = {
    DVD: item.dvd,
    BLURAY: item.bluray,
    UHD_4K: item.fourk,
  };

  return Boolean(formats[selectedFormat.value]);
}

const filteredItems = computed(() => {
  const allItems = sellerData.value?.items ?? [];
  const searchValue = search.value.toLowerCase();

  return allItems.filter((item) => {
    return (
      item.category === selectedCategory.value &&
      matchesFormat(item) &&
      item.title.toLowerCase().includes(searchValue)
    );
  });
});

async function loadSellerListings() {
  loading.value = true;
  selectedMediaIds.value = [];
  requestMessage.value = "";
  requestError.value = "";
  if (auth.token.value && !auth.user.value) {
    await auth.loadUser();
  }
  sellerData.value = await getSellerListings(route.params.username);
  document.title = `Komu - ${pageTitle.value}`;
  loading.value = false;
}

function toggleSelected(item) {
  if (selectedMediaIds.value.includes(item.id)) {
    selectedMediaIds.value = selectedMediaIds.value.filter((id) => id !== item.id);
    return;
  }

  selectedMediaIds.value = [...selectedMediaIds.value, item.id];
}

async function submitTradeRequest() {
  requestError.value = "";

  const selectedItems = filteredItems.value.filter((item) => selectedMediaIds.value.includes(item.id));
  const copyIds = selectedItems
    .map((item) => item.availableCopyIds?.[0])
    .filter((id) => id != null);

  if (copyIds.length === 0) {
    requestError.value = "No available copies were selected.";
    return;
  }

  requestingTrade.value = true;
  try {
    const trade = await createTrade({
      type: tradeType.value,
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

.request-controls {
  margin-bottom: 0.75rem;
}

select,
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
  margin-top: 0.75rem;
}

.error {
  color: #ff9d9d;
}
</style>
