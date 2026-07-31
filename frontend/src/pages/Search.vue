<template>
  <Breadcrumbs />

  <h1>Search</h1>

  <!--<CategorySelector
    :categories="categories"
    :selected="selectedCategory"
    @change="changeCategory"
  />-->

  <SearchBar
    @search="searchMedia"
  />

  <MediaGrid
    :mediaList="filteredMedia"
    mode="search"
  />
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

import Breadcrumbs from "../components/layout/Breadcrumbs.vue";
import MediaGrid from "../components/media/MediaGrid.vue";
import CategorySelector from "../components/ui/CategorySelector.vue";
import SearchBar from "../components/ui/SearchBar.vue";

import { getAllMedia } from "../api/mediaAPI.js";

const media = ref([]);

const searchText = ref("");
const selectedCategory = ref("MOVIE");

const categories = [
  "MOVIE",
  "BOOK",
  "GAME",
  "MUSIC"
];

function changeCategory(category) {
  selectedCategory.value = category;
}

function searchMedia(search) {
  searchText.value = search;
}

const filteredMedia = computed(() => {
  return media.value.filter(item => {
    const matchesTitle = item.title
      .toLowerCase()
      .includes(searchText.value.toLowerCase());

    const matchesCategory =
      item.category === selectedCategory.value;

    return matchesTitle && matchesCategory;
  });
});

onMounted(async () => {
  try {
    media.value = await getAllMedia();

  } catch (error) {
    console.error("Failed to load media:", error);
  }
});
</script>

<style scoped>
</style>