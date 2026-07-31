<template>
    <div class="page">
        <Breadcrumbs />
        <h1>My Collection</h1>

        <!--<CategorySelector
            :categories="categories"
            :selected="selectedCategory"
            @change="changeCategory"
        />-->

        <SearchBar
            v-model="search"
            placeholder="Search your collection..."
        />
        
        <hr class="section-divider">

        <h2>Owned Media</h2>

        <div
            v-if="loading"
            class="loading"
        >
            Loading...
        </div>

        <div
            v-else-if="copies.length === 0"
            class="empty"
        >
            Your collection is empty.
        </div>

        <div
            v-else-if="filteredMedia.length === 0"
            class="empty"
        >
            No media matches your search.
        </div>

        <div
            v-else
            class="media-grid"
        >
            <MediaGrid
                :mediaList="filteredMedia"
                mode="collection"
            
            />
        </div>

        <!--
        Future sections

        <hr class="section-divider">

        <h2>Wishlist</h2>

        ...

        <hr class="section-divider">

        <h2>Watchlist</h2>

        ...
        -->

    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

import Breadcrumbs from "../components/layout/Breadcrumbs.vue";
import MediaGrid from "../components/media/MediaGrid.vue";
import CategorySelector from "../components/ui/CategorySelector.vue";
import SearchBar from "../components/ui/SearchBar.vue";

import { getMyCopies } from "../api/copyAPI.js";

const loading = ref(true);

const search = ref("");

const selectedCategory = ref("MOVIE");

const copies = ref([]);

onMounted(async () => {
    copies.value = await getMyCopies();
    loading.value = false;
});

const categories = [
  "MOVIE",
  "BOOK",
  "GAME",
  "MUSIC"
];

function changeCategory(category) {
  selectedCategory.value = category;
}

const filteredMedia = computed(() => {

    const grouped = new Map();

    for (const copy of copies.value) {

        const media = copy.media;

        const matchesCategory =
            media.category === selectedCategory.value;

        const matchesSearch =
            media.title
                .toLowerCase()
                .includes(search.value.toLowerCase());

        if (!matchesCategory || !matchesSearch) {
            continue;
        }

        if (!grouped.has(media.id)) {

            grouped.set(media.id, {
                ...media,
                dvd: 0,
                bluray: 0,
                fourk: 0,
                copies: []
            });

        }

        const item = grouped.get(media.id);

        item.copies.push(copy);

        switch (copy.edition) {

            case "DVD":
                item.dvd++;
                break;

            case "BLURAY":
                item.bluray++;
                break;

            case "UHD_4K":
                item.fourk++;
                break;
        }
    }
    return [...grouped.values()];
});
function openMedia(filteredMedia) {

    router.push({
        name: "media",
        params: {
            id: filteredMedia.id
        },
        query: {
            from: "collection",
            title: filteredMedia.title
        }
    });

}
</script>

<style scoped>


</style>