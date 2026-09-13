<template>
    <div ref="searchContainer" class="all-media-search">
        <div class="search-input-wrapper">
            <input
                v-model="query"
                type="text"
                placeholder="Search media..."
                @input="search"
                @focus="showResults = true"
            />

            <button
                v-if="query"
                type="button"
                class="clear-search"
                aria-label="Clear search"
                @click="clearSearch"
            >
                ×
            </button>
        </div>

        <div
            v-if="showResults && (results.length > 0 || searching || noResults)"
            class="search-results"
        >
            <div v-if="searching" class="search-message">
                Searching...
            </div>

            <template v-else-if="results.length > 0">
                <div
                    v-for="(group, index) in groupedResults"
                    :key="group.category"
                    class="category-group"
                >
                    <div
                        v-if="index > 0"
                        class="category-divider"
                    ></div>

                    <div class="category-title">
                        {{ categoryName(group.category) }}
                    </div>

                    <div
                        v-for="media in group.items"
                        :key="media.id"
                        class="search-result"
                        @click="select(media)"
                    >
                        <img
                            v-if="media.poster"
                            :src="media.poster"
                            :alt="media.title"
                            class="result-poster"
                        />

                        <div class="result-info">
                            <div class="result-title">
                                {{ media.title }}
                            </div>

                            <div class="result-meta">
                                <span v-if="media.releaseYear">
                                    {{ media.releaseYear }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <div v-else-if="noResults" class="no-results">
                <div>No media found.</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import { searchMedia } from "../../api/mediaAPI.js";

const router = useRouter();

const query = ref("");
const results = ref([]);
const searching = ref(false);
const showResults = ref(false);
const searchContainer = ref(null);

let searchTimeout = null;

const noResults = computed(() => {
    return (
        !searching.value &&
        query.value.trim().length >= 2 &&
        results.value.length === 0
    );
});

const groupedResults = computed(() => {
    const groups = {};

    for (const media of results.value) {
        const category = media.category || "OTHER";

        if (!groups[category]) {
            groups[category] = [];
        }

        groups[category].push(media);
    }

    return Object.entries(groups).map(([category, items]) => ({
        category,
        items,
    }));
});

function categoryName(category) {
    const names = {
        MOVIE: "Movies",
        TV: "TV Series",
        TV_SERIES: "TV Series",
        BOOK: "Books",
        COMIC: "Comics",
        MUSIC: "Music",
        ANIME: "Anime",
        MANGA: "Manga",
    };

    return names[category] || category;
}

function search() {
    clearTimeout(searchTimeout);

    const value = query.value.trim();

    if (value.length < 2) {
        results.value = [];
        searching.value = false;
        showResults.value = false;
        return;
    }

    showResults.value = true;
    searching.value = true;

    searchTimeout = setTimeout(async () => {
        try {
            results.value = await searchMedia(value);
        } catch (error) {
            console.error("Failed to search media:", error);
            results.value = [];
        } finally {
            searching.value = false;
        }
    }, 250);
}

function select(media) {
    query.value = "";
    results.value = [];
    showResults.value = false;

    router.push({
        name: "media",
        params: {
            id: media.id,
        },
    });
}

function clearSearch() {
    query.value = "";
    results.value = [];
    searching.value = false;
    showResults.value = false;
    clearTimeout(searchTimeout);
}

function handleClickOutside(event) {
    if (
        searchContainer.value &&
        !searchContainer.value.contains(event.target)
    ) {
        showResults.value = false;
    }
}

document.addEventListener("click", handleClickOutside);

onBeforeUnmount(() => {
    clearTimeout(searchTimeout);
    document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.all-media-search {
    position: relative;
    width: 300px;
}

.all-media-search input {
    width: 100%;
    box-sizing: border-box;
    padding: 8px 12px;
    border: 1px solid #555;
    border-radius: 6px;
    background: #111;
    color: white;
    outline: none;
}

.all-media-search input:focus {
    border-color: #888;
}

.search-results {
    position: absolute;
    top: calc(100% + 5px);
    left: 0;
    right: 0;
    max-height: 500px;
    overflow-y: auto;
    background: #111;
    border: 1px solid #444;
    border-radius: 6px;
    z-index: 1000;
}

.category-title {
    padding: 8px 12px 5px;
    font-size: 12px;
    font-weight: bold;
    color: #aaa;
    text-transform: uppercase;
}

.category-divider {
    height: 1px;
    background: #444;
    margin: 4px 0;
}

.search-result {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 10px;
    cursor: pointer;
}

.search-result:hover {
    background: #292929;
}

.result-poster {
    width: 35px;
    height: 52px;
    object-fit: cover;
    border-radius: 2px;
    flex-shrink: 0;
}

.result-info {
    min-width: 0;
}

.result-title {
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.result-meta {
    margin-top: 3px;
    font-size: 12px;
    color: #999;
}

.search-message,
.no-results {
    padding: 12px;
    font-size: 14px;
    color: #aaa;
}

.add-media-button {
    margin-top: 10px;
    padding: 7px 12px;
    border: 1px solid #555;
    border-radius: 5px;
    background: #222;
    color: white;
    cursor: pointer;
}

.search-input-wrapper {
    position: relative;
    width: 100%;
}

.search-input-wrapper input {
    padding-right: 40px;
}

.clear-search {
    position: absolute;
    top: 50%;
    right: 10px;

    width: 24px;
    height: 24px;

    display: flex;
    align-items: center;
    justify-content: center;

    transform: translateY(-50%);

    padding: 0;

    border: none;
    border-radius: 50%;

    background: transparent;
    color: var(--text-muted);

    font-size: 20px;
    line-height: 1;

    cursor: pointer;
}

.clear-search:hover {
    background: var(--bg-hover);
    color: var(--text-h);
}

.add-media-button:hover {
    background: #333;
}

@media (max-width: 700px) {
    .all-media-search {
        width: 100%;
    }

    .search-results {
        max-height: 400px;
    }
}
</style>