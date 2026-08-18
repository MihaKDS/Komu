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
        :counts="categoryCounts"
        @change="selectedCategory = $event"
    />

    <FilterBar
      :category="selectedCategory"
      :format="selectedFormat"
      :viewMode="'list'"
      :showCollectionFilter="false"
      :showViewToggle="false"
      @update:format="selectedFormat = $event"
    />

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
            v-if="listing.poster"
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
              {{ activeMode === 'SELL' ? `${listing.price} €` : `Deposit: ${listing.price} €` }}
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

const categories = ["MOVIE", "TV_SHOW", "BOOK"];

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

const categoryCounts = computed(() => {
    const counts = {};

    for (const category of categories) {
        counts[category] = (sellerData.value?.saleItems ?? [])
            .filter(item => item.category === category)
            .length;
    }

    return counts;
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

function autoSelectFromQuery() {
    const copyId = route.query.copyId
        ? Number(route.query.copyId)
        : null;

    const boxSetId = route.query.boxSetId
        ? Number(route.query.boxSetId)
        : null;

    if (!copyId && !boxSetId) {
        return;
    }

    const listing = activeListings.value.find((item) => {
        if (copyId) {
            return (
                item.type === "copy" &&
                item.copyIds?.includes(copyId)
            );
        }

        if (boxSetId) {
            return (
                item.type === "boxSet" &&
                item.boxSetId === boxSetId
            );
        }

        return false;
    });

    if (!listing) {
        return;
    }

    selectedCategory.value = listing.category;
    selectedListingKeys.value = [listing.key];
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

    autoSelectFromQuery();
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
/* =========================================================
   SELLER LISTINGS
   ========================================================= */

.seller-listings {
    width: min(100%, 900px);
    margin: 0 auto;
}


/* =========================================================
   SELLER HEADER
   ========================================================= */

.seller-city {
    margin: -4px 0 14px;

    color: var(--text-muted);

    font-size: 13px;
}


/* =========================================================
   SEARCH / FILTERS
   ========================================================= */

.seller-listings > .search-bar,
.seller-listings > .category-selector {
    margin-bottom: 10px;
}


/* Keep the filter controls compact */

.seller-listings .filter-bar {
    margin-top: 8px;
}


/* =========================================================
   TRADE TABS
   ========================================================= */

.trade-tabs {
    display: flex;

    gap: 4px;

    margin: 18px 0;

    padding: 4px;

    background: var(--bg-secondary);

    border: 1px solid var(--border);
    border-radius: var(--radius);
}

.trade-tabs button {
    flex: 1;

    min-height: 38px;

    padding: 7px 14px;

    color: var(--text-secondary);
    background: transparent;

    border: 0;
    border-radius: var(--radius-small);

    font: inherit;
    font-size: 13px;
    font-weight: 600;

    cursor: pointer;

    transition:
        background 0.15s ease,
        color 0.15s ease;
}

.trade-tabs button:hover {
    color: var(--text-h);
    background: var(--bg-hover);
}

.trade-tabs button.active {
    color: var(--text-h);
    background: var(--bg-card);

    box-shadow: var(--shadow);
}


/* =========================================================
   REQUEST PANEL
   ========================================================= */

.request-panel {
    margin-bottom: 18px;
    padding: 16px;

    background: var(--bg-secondary);

    border: 1px solid var(--accent-border);
    border-radius: var(--radius);
}

.request-panel h2 {
    margin: 0 0 10px;

    color: var(--text-h);

    font-size: 17px;
}

.request-panel textarea {
    width: 100%;

    min-height: 75px;

    padding: 9px 11px;

    color: var(--text-h);
    background: var(--bg-card);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);

    resize: vertical;

    font: inherit;
}

.request-panel textarea:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
}

.request-panel button {
    margin-top: 10px;

    min-height: 38px;

    padding: 8px 13px;

    color: #fff;
    background: var(--accent);

    border: 1px solid var(--accent);
    border-radius: var(--radius-small);

    font: inherit;
    font-size: 13px;
    font-weight: 600;

    cursor: pointer;
}

.request-panel button:hover {
    background: var(--accent-hover);
}

.request-panel button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}


/* =========================================================
   LISTINGS
   ========================================================= */

.listing-list {
    display: flex;
    flex-direction: column;

    gap: 10px;
}

.seller-listing-card {
    display: flex;
    align-items: center;

    position: relative;

    min-width: 0;

    gap: 12px;

    padding: 12px;

    background: var(--bg-card);

    border: 1px solid var(--border);
    border-radius: var(--radius);

    transition:
        border-color 0.15s ease,
        background 0.15s ease,
        transform 0.15s ease;
}

.seller-listing-card:hover {
    border-color: var(--accent-border);
    background: var(--bg-hover);
}

.seller-listing-card.selected {
    border-color: var(--accent);
    background: var(--accent-bg);
}


/* =========================================================
   SELECTION
   ========================================================= */

.selection-box {
    display: flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;

    cursor: pointer;
}

.selection-box input {
    width: 18px;
    height: 18px;

    margin: 0;

    accent-color: var(--accent);

    cursor: pointer;
}


/* =========================================================
   POSTER
   ========================================================= */

.seller-listing-card .poster {
    width: 64px;
    height: 92px;

    flex-shrink: 0;

    object-fit: cover;

    background: var(--bg-secondary);

    border-radius: 5px;
}


/* =========================================================
   LISTING CONTENT
   ========================================================= */

.listing-content {
    flex: 1;

    min-width: 0;

    display: flex;
    flex-direction: column;
}

.listing-header {
    display: flex;
    align-items: center;

    gap: 8px;

    margin-bottom: 3px;
}

.listing-header h3 {
    min-width: 0;

    margin: 0;

    overflow: hidden;

    color: var(--text-h);

    font-size: 15px;
    line-height: 1.3;

    text-overflow: ellipsis;
    white-space: nowrap;
}

.kind-badge {
    flex-shrink: 0;

    padding: 3px 7px;

    color: var(--text-secondary);
    background: var(--bg-secondary);

    border: 1px solid var(--border);
    border-radius: 4px;

    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
}

.listing-meta {
    margin: 0;

    color: var(--text-muted);

    font-size: 12px;
}

.listing-note {
    margin: 6px 0 0;

    color: var(--text-secondary);

    font-size: 12px;

    line-height: 1.4;
}

.listing-price {
    margin: 7px 0 0;

    color: var(--text-h);

    font-size: 15px;
    font-weight: 700;
}

.listing-subtitle {
    margin: 5px 0 0;

    overflow: hidden;

    color: var(--text-muted);

    font-size: 11px;

    text-overflow: ellipsis;
    white-space: nowrap;
}


/* =========================================================
   DETAILS LINK
   ========================================================= */

.listing-link {
    align-self: flex-start;

    margin-top: 7px;

    color: var(--accent);

    font-size: 12px;
    font-weight: 600;

    text-decoration: none;
}

.listing-link:hover {
    text-decoration: underline;
}


/* =========================================================
   EMPTY / LOADING
   ========================================================= */

.loading,
.empty {
    padding: 30px 15px;

    color: var(--text-muted);

    text-align: center;

    font-size: 13px;
}

.error {
    margin-top: 10px;
}


/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 600px) {

    .trade-tabs {
        margin: 12px 0;
    }

    .trade-tabs button {
        min-height: 36px;

        padding: 6px 8px;

        font-size: 12px;
    }

    .request-panel {
        padding: 13px;
    }

    .seller-listing-card {
        align-items: flex-start;

        gap: 9px;

        padding: 9px;
    }

    .seller-listing-card .poster {
        width: 50px;
        height: 72px;
    }

    .listing-header {
        align-items: flex-start;
        flex-wrap: wrap;

        gap: 5px;
    }

    .listing-header h3 {
        width: 100%;

        font-size: 14px;

        white-space: normal;
    }

    .kind-badge {
        font-size: 9px;
    }

    .listing-price {
        font-size: 14px;
    }

    .listing-link {
        margin-top: 6px;
    }

}
</style>
