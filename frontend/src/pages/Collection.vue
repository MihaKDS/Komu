<template>
    <div class="page">
        <Breadcrumbs />
        <h1>My Collection ({{ totalCopies }})</h1>

        <!--<CategorySelector
            :categories="categories"
            :selected="selectedCategory"
            @change="changeCategory"
        />-->

        <SearchBar
            v-model="search"
            placeholder="Search your collection..."
        />

            <div class="group-by-collection">
              <label>
                <input type="checkbox" v-model="groupByCollection" /> Group by collection
              </label>
            </div>

            <button
                class="add-media-button"
                @click="showAddMedia = true"
            >
                Add New Media.
            </button>
        
            <hr class="section-divider">

            <h2>Owned Media ({{ filteredMedia.length }})</h2>

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

        <div v-else>
            <MediaGrid :mediaList="filteredMedia" mode="collection" />
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

    <AddMedia
        v-if="showAddMedia"
        @close="showAddMedia = false"
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
import AddMedia from "../components/ui/AddMedia.vue";

import { getMyCopies } from "../api/copyAPI.js";

const loading = ref(true);

const search = ref("");
const showAddMedia = ref(false);
const groupByCollection = ref(true);

const selectedCategory = ref("MOVIE");

const copies = ref([]);
const mediaMap = ref(new Map());

onMounted(async () => {
    copies.value = await getMyCopies();
    // also load global media counts to detect if any title (or collection group) is being sold or rented
    try {
        const all = await import('../api/mediaAPI.js').then(m => m.getAllMedia());
        // build a map by media id
        mediaMap.value = new Map(all.map(item => [item.id, item]));
    } catch (err) {
        mediaMap.value = new Map();
    }
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
    const searchValue = search.value.toLowerCase();

    for (const copy of copies.value) {
        const media = copy.media;
        if (media.category !== selectedCategory.value) {
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

    const flat = [...grouped.values()];
    if (!groupByCollection.value) {
    return flat
      .map(m => ({
        ...m,
        hasSell: mediaMap.value.get(m.id)?.hasSell ?? false,
        hasRent: mediaMap.value.get(m.id)?.hasRent ?? false,
      }))
      .filter((media) =>
        media.title.toLowerCase().includes(searchValue),
    );
    }

    const byCollection = new Map();

    for (const media of flat) {
        const col = media.movieCollection;
        const key = col ? `col-${col.id}` : `single-${media.id}`;
        const title = col ? col.title : null;

        if (!byCollection.has(key)) {
            byCollection.set(key, {
                key,
                title,
                medias: [],
                matchesSearch: false,
            });
        }

        const group = byCollection.get(key);
        group.medias.push(media);
        if (media.title.toLowerCase().includes(searchValue)) {
            group.matchesSearch = true;
        }
    }

    const result = [];
    for (const g of byCollection.values()) {
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
                hasSell: g.medias.some(m => mediaMap.value.get(m.id)?.hasSell) || false,
                hasRent: g.medias.some(m => mediaMap.value.get(m.id)?.hasRent) || false,
            };
            result.push(representative);
        } else {
            result.push(...g.medias.filter((media) =>
                media.title.toLowerCase().includes(searchValue),
            ));
        }
    }

    return result;
});

const totalCopies = computed(() => copies.value.length);

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
.add-media-button {
    margin-top: 1rem;
}


</style>
