<template>
  <Breadcrumbs />

  <h1>Search</h1>

  <!--<CategorySelector
    :categories="categories"
    :selected="selectedCategory"
    @change="changeCategory"
  />-->

  <SearchBar @search="searchMedia" />
  <FilterBar
    v-if="selectedCategory === 'MOVIE'"
    :format="selectedFormat"
    :collection="collectionFilter"
    :viewMode="viewMode"
    @update:format="selectedFormat = $event"
    @update:collection="collectionFilter = $event"
    @update:viewMode="viewMode = $event"
  />

  <div class="group-by-collection">
    <label>
      <input type="checkbox" v-model="groupByCollection" /> Group {{ selectedCategory.toLowerCase() }}
    </label>
  </div>

  <div v-if="collectionFilter !== 'ALL' && !auth.user.value" class="collection-note">
    Login to filter by your collection.
  </div>

  <template v-if="groupByCollection">
    <component
      :is="viewMode === 'list' ? MediaList : MediaGrid"
      :mediaList="groupedMedia"
      mode="search"
    />
  </template>

  <template v-else>
    <component
      :is="viewMode === 'list' ? MediaList : MediaGrid"
      :mediaList="filteredMedia"
      mode="search"
    />
  </template>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuth } from "../composables/useAuth";

import Breadcrumbs from "../components/layout/Breadcrumbs.vue";
import MediaGrid from "../components/media/MediaGrid.vue";
import MediaList from "../components/media/MediaList.vue";
import FilterBar from "../components/ui/FilterBar.vue";
import SearchBar from "../components/ui/SearchBar.vue";

import { getAllMedia } from "../api/mediaAPI.js";
import { getMyCopies } from "../api/copyAPI.js";

const route = useRoute();
const auth = useAuth();

const media = ref([]);
const ownedMediaIds = ref(new Set());
const searchText = ref("");
const selectedCategory = ref((route.query.category || "MOVIE").toString().toUpperCase());
const selectedFormat = ref("ALL");
const collectionFilter = ref("ALL");
const viewMode = ref("list");
const groupByCollection = ref(false);

const categories = ["MOVIE", "BOOK", "GAME", "MUSIC"];
watch(
  () => route.query.category,
  (category) => {
    selectedCategory.value = (category || "MOVIE").toString().toUpperCase();
  }
);

function searchMedia(search) {
  searchText.value = search;
}

function shouldShowMedia(mediaItem) {
  if (selectedCategory.value && mediaItem.category !== selectedCategory.value) {
    return false;
  }

  if (selectedFormat.value !== "ALL") {
    const map = {
      DVD: mediaItem.dvd,
      BLURAY: mediaItem.bluray,
      UHD_4K: mediaItem.fourk,
    };

    if (!map[selectedFormat.value]) {
      return false;
    }
  }

  if (collectionFilter.value === "IN_COLLECTION") {
    return ownedMediaIds.value.has(mediaItem.id);
  }

  if (collectionFilter.value === "NOT_IN_COLLECTION") {
    return !ownedMediaIds.value.has(mediaItem.id);
  }

  return true;
}

const filteredMediaFlat = computed(() => {
  return media.value
    .filter((item) => shouldShowMedia(item))
    .map((item) => ({
      ...item,
      inCollection: ownedMediaIds.value.has(item.id),
    }));
});

const filteredMedia = computed(() => {
  const search = searchText.value.toLowerCase();
  return filteredMediaFlat.value.filter((item) =>
    item.title.toLowerCase().includes(search),
  );
});

const groupedMedia = computed(() => {
  const search = searchText.value.toLowerCase();
  const groups = new Map();

  for (const item of filteredMediaFlat.value) {
    const col = item.movieCollection;
    const key = col ? `col-${col.id}` : `single-${item.id}`;
    const title = col ? col.title : null;

    if (!groups.has(key)) {
      groups.set(key, { key, title, medias: [], matchesSearch: false });
    }

    const group = groups.get(key);
    group.medias.push(item);
    if (item.title.toLowerCase().includes(search)) {
      group.matchesSearch = true;
    }
  }

  const result = [];
  for (const g of groups.values()) {
    g.medias.sort((a, b) => (a.collectionPosition ?? 0) - (b.collectionPosition ?? 0));
    if (g.title) {
      if (!g.matchesSearch) {
        continue;
      }
      const representative = {
        ...g.medias[0],
        title: g.title,
        isCollectionGroup: true,
        collectionSize: g.medias.length,
        id: g.medias[0].id,
      };
      result.push(representative);
    } else {
      result.push(...g.medias.filter((item) => item.title.toLowerCase().includes(search)));
    }
  }

  return result;
});

async function loadMedia() {
  try {
    media.value = await getAllMedia();
  } catch (error) {
    console.error("Failed to load media:", error);
  }
  console.log("Media loaded:", selectedCategory.value);
}

async function loadOwnedMedia() {
  if (!auth.token.value) {
    return;
  }

  try {
    const copies = await getMyCopies();
    ownedMediaIds.value = new Set(copies.map((copy) => copy.media.id));
  } catch (error) {
    ownedMediaIds.value = new Set();
  }
}

onMounted(async () => {
  await Promise.all([loadMedia(), loadOwnedMedia()]);
});
</script>

<style scoped>
</style>