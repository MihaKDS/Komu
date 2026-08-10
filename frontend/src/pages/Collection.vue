<template>
    <div class="page">
        <Breadcrumbs />
        <h1>My Collection ({{ totalCopies }})</h1>

        <CategorySelector
            :categories="categories"
            :selected="selectedCategory"
            @change="changeCategory"
        />

        <SearchBar
            @search="search = $event"
            placeholder="Search your collection..."
        />

        <FilterBar
            :category="selectedCategory"
            :format="selectedFormat"
            :viewMode="viewMode"
            :showCollectionFilter="false"
            @update:format="selectedFormat = $event"
            @update:viewMode="viewMode = $event"
        />
        
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
            <component
                :is="viewMode === 'list' ? MediaList : MediaGrid"
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
import MediaList from "../components/media/MediaList.vue";
import CategorySelector from "../components/ui/CategorySelector.vue";
import FilterBar from "../components/ui/FilterBar.vue";
import SearchBar from "../components/ui/SearchBar.vue";
import AddMedia from "../components/ui/AddMedia.vue";

import { getMyCopies } from "../api/copyAPI.js";

const loading = ref(true);

const search = ref("");
const showAddMedia = ref(false);
const groupByCollection = ref(true);
const selectedFormat = ref("ALL");
const viewMode = ref("list");

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
  "TV_SHOW",
  "BOOK",
  "COMIC"
];

function changeCategory(category) {
  selectedCategory.value = category;
}

function tradePriority(status) {
    switch (status) {
        case "RENTING":
            return 2;
        case "REQUESTED":
        case "ACCEPTED":
            return 1;
        default:
            return 0;
    }
}

function pickTrade(primary, candidate) {
    if (!candidate) {
        return primary;
    }

    if (!primary) {
        return candidate;
    }

    return tradePriority(candidate.status) > tradePriority(primary.status) ? candidate : primary;
}

function tradeStatusLabel(activeTrade) {
    if (!activeTrade) {
        return "Available";
    }

    switch (activeTrade.status) {
        case "RENTING":
            return "Renting";
        case "REQUESTED":
        case "ACCEPTED":
            return "Reserved";
        default:
            return "Available";
    }
}

function matchesFormat(media) {
    if (selectedFormat.value === "ALL") {
        return true;
    }

    const formats = {
        DVD: media.dvd,
        BLURAY: media.bluray,
        UHD_4K: media.fourk,
    };

    return Boolean(formats[selectedFormat.value]);
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
                copies: [],
                activeTrade: null,
            });
        }

        const item = grouped.get(media.id);
        item.copies.push(copy);
        item.activeTrade = pickTrade(item.activeTrade, copy.activeTrade);

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

    const flat = [...grouped.values()].filter(matchesFormat);
    if (!groupByCollection.value) {
    return flat
      .map(m => ({
        ...m,
        hasSell: mediaMap.value.get(m.id)?.hasSell ?? false,
        hasRent: mediaMap.value.get(m.id)?.hasRent ?? false,
        tradeId: m.activeTrade?.id ?? null,
        tradeStatusLabel: tradeStatusLabel(m.activeTrade),
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
                activeTrade: g.medias.reduce((selected, media) => pickTrade(selected, media.activeTrade), null),
            };
            representative.tradeId = representative.activeTrade?.id ?? null;
            representative.tradeStatusLabel = tradeStatusLabel(representative.activeTrade);
            result.push(representative);
        } else {
            result.push(
                ...g.medias
                    .filter((media) =>
                        media.title.toLowerCase().includes(searchValue),
                    )
                    .map((media) => ({
                        ...media,
                        tradeId: media.activeTrade?.id ?? null,
                        tradeStatusLabel: tradeStatusLabel(media.activeTrade),
                    })),
            );
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
