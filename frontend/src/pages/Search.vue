<template>
    <div class="search-page">

        <Breadcrumbs />

        <header class="search-header">
            <h1>
                Search {{ selectedCategory.toLowerCase() }}s
            </h1>

            <SearchBar
                @search="searchMedia"
            />
        </header>


        <section
            class="search-controls"
        >
        <FilterBar
            :category="selectedCategory"
            :format="selectedFormat"
            :collection="collectionFilter"
            :viewMode="viewMode"
            :displayMode="displayMode"
            @update:format="selectedFormat = $event"
            @update:collection="collectionFilter = $event"
            @update:viewMode="viewMode = $event"
            @update:displayMode="displayMode = $event"
        />
        </section>


        <div
            v-if="collectionFilter !== 'ALL' && !auth.user.value"
            class="collection-note"
        >
            Login to filter by your collection.
        </div>

        <section class="search-results">

          <component
              :is="viewMode === 'list' ? MediaList : MediaGrid"
              :mediaList="displayedMedia"
              mode="search"
            :category="selectedCategory"
          />

        </section>

    </div>
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

const selectedCategory = ref(
    (route.query.category || "MOVIE")
        .toString()
        .toUpperCase()
);

const selectedFormat = ref("ALL");
const collectionFilter = ref("ALL");

const viewMode = ref("list");

/*
 * New FilterBar display mode.
 *
 * "singles"      = show individual media
 * "collections"  = group movies by collection
 */
const displayMode = ref("collections");

const displayedMedia = computed(() => {
    return displayMode.value === "collections"
        ? groupedMedia.value
        : filteredMedia.value;
});

const categories = [
    "MOVIE",
    "TV_SHOW",
    "BOOK",
    "COMIC",
];


/* =========================================================
   ROUTE
   ========================================================= */

watch(
    () => route.query.category,
    (category) => {
        selectedCategory.value = (
            category || "MOVIE"
        )
            .toString()
            .toUpperCase();

        /*
         * Format and collection filters currently
         * only apply to movies.
         *
         * Reset them when switching category.
         */
        if (selectedCategory.value !== "MOVIE") {
            selectedFormat.value = "ALL";
            collectionFilter.value = "ALL";
            displayMode.value = "singles";
        }
    }
);


/* =========================================================
   SEARCH
   ========================================================= */

function searchMedia(search) {
    searchText.value = search;
}


/* =========================================================
   FILTERING
   ========================================================= */

function shouldShowMedia(mediaItem) {

    /*
     * Category
     */

    if (
        selectedCategory.value &&
        mediaItem.category !== selectedCategory.value
    ) {
        return false;
    }


    /*
     * Format
     */

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


    /*
     * Collection ownership
     */

    if (
        collectionFilter.value ===
        "IN_COLLECTION"
    ) {
        return ownedMediaIds.value.has(
            mediaItem.id
        );
    }


    if (
        collectionFilter.value ===
        "NOT_IN_COLLECTION"
    ) {
        return !ownedMediaIds.value.has(
            mediaItem.id
        );
    }


    return true;
}


/* =========================================================
   FLAT FILTERED MEDIA
   ========================================================= */

const filteredMediaFlat = computed(() => {

    return media.value
        .filter((item) =>
            shouldShowMedia(item)
        )
        .map((item) => ({
            ...item,

            inCollection:
                ownedMediaIds.value.has(
                    item.id
                ),
        }));

});


/* =========================================================
   SEARCH FILTER
   ========================================================= */

const filteredMedia = computed(() => {

    const search =
        searchText.value
            .toLowerCase()
            .trim();

    if (!search) {
        return filteredMediaFlat.value;
    }

    return filteredMediaFlat.value.filter(
        (item) =>
            item.title
                .toLowerCase()
                .includes(search)
    );

});


/* =========================================================
   GROUP BY COLLECTION
   ========================================================= */

const groupedMedia = computed(() => {

    const search =
        searchText.value
            .toLowerCase()
            .trim();

    const groups = new Map();


    for (
        const item
        of filteredMediaFlat.value
    ) {

        const collection =
            item.mediaCollection;

        const key = collection
            ? `col-${collection.id}`
            : `single-${item.id}`;

        const title =
            collection
                ? collection.title
                : null;


        if (!groups.has(key)) {

            groups.set(key, {
                key,
                title,
                medias: [],
                matchesSearch: false,
            });

        }


        const group =
            groups.get(key);

        group.medias.push(item);


        if (
            item.title
                .toLowerCase()
                .includes(search)
        ) {
            group.matchesSearch = true;
        }

    }


    const result = [];


    for (
        const group
        of groups.values()
    ) {

        /*
         * Sort movies inside a collection
         * by collectionPosition.
         */

        group.medias.sort(
            (a, b) =>
                (
                    a.collectionPosition ?? 0
                ) -
                (
                    b.collectionPosition ?? 0
                )
        );


        /*
         * Collection
         */

        if (group.title) {

            /*
             * If searching, only show the
             * collection if one of its movies
             * matches the search.
             */

            if (
                search &&
                !group.matchesSearch
            ) {
                continue;
            }


            const representative = {

                ...group.medias[0],

                title: group.title,

                isCollectionGroup: true,

                collectionSize:
                    group.medias.length,

                id: group.medias[0].id,
            };


            result.push(
                representative
            );

        }

        /*
         * Individual media
         */

        else {

            result.push(
                ...group.medias.filter(
                    (item) =>
                        !search ||
                        item.title
                            .toLowerCase()
                            .includes(search)
                )
            );

        }

    }


    return result;

});


/* =========================================================
   LOAD MEDIA
   ========================================================= */

async function loadMedia() {

    try {

        media.value =
            await getAllMedia();

    } catch (error) {

        console.error(
            "Failed to load media:",
            error
        );

    }

}


/* =========================================================
   LOAD USER COLLECTION
   ========================================================= */

async function loadOwnedMedia() {

    if (!auth.token.value) {
        return;
    }

    try {

        const copies =
            await getMyCopies();

        ownedMediaIds.value =
            new Set(
                copies.map(
                    (copy) =>
                        copy.media.id
                )
            );

    } catch (error) {

        console.error(
            "Failed to load owned media:",
            error
        );

        ownedMediaIds.value =
            new Set();

    }

}


/* =========================================================
   INITIAL LOAD
   ========================================================= */

onMounted(async () => {

    await Promise.all([
        loadMedia(),
        loadOwnedMedia(),
    ]);

});
</script>

<style scoped>

.search-page {
    width: 100%;
    max-width: 1000px;

    margin: 0 auto;

    text-align: left;
}


/* =========================================================
   HEADER
   ========================================================= */

.search-header {
    display: flex;
    flex-direction: column;
    align-items: center;

    gap: 16px;

    margin: 20px 0 24px;

    text-align: center;
}

.search-header h1 {
    margin: 0;

    color: var(--text-h);

    font-size: 24px;
    font-weight: 600;
}


/* =========================================================
   SEARCH / FILTER AREA
   ========================================================= */

.search-controls {
    width: 100%;

    padding: 2px;

    background: var(--bg-secondary);

    border: 1px solid var(--border);
    border-radius: var(--radius);

    margin-bottom: 2px;
}


/* Group checkbox */

.search-options {
    display: flex;
    justify-content: center;

    margin-top: 14px;
}

.group-option {
    display: inline-flex;
    align-items: center;

    gap: 6px;

    color: var(--text-secondary);

    cursor: pointer;
}

.group-option input {
    width: auto;

    margin: 0;

    accent-color: var(--accent);
}

.group-option span {
    font-size: 14px;
}


/* =========================================================
   LOGIN NOTE
   ========================================================= */

.collection-note {
    margin: 0 0 20px;

    padding: 10px 14px;

    color: var(--text-secondary);

    background: var(--accent-bg);

    border: 1px solid var(--accent-border);
    border-radius: var(--radius-small);

    text-align: center;
}


/* =========================================================
   RESULTS
   ========================================================= */

.search-results {
    width: 100%;

    margin-top: 20px;
}


/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 600px) {

    .search-header {
        margin-top: 16px;
        margin-bottom: 18px;
    }

    .search-header h1 {
        font-size: 22px;
    }

    .search-controls {
        padding: 4px;
    }

}

</style>