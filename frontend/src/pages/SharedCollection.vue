<template>
    <main class="shared-collection-page">
        <h1 v-if="ownerUsername">Shared {{ ownerUsername }}'s collection</h1>
        <h1 v-else>Shared Collection</h1>

        <p v-if="loading" class="page-message">Loading collection...</p>
        <section v-else-if="unavailable" class="unavailable-state">
            <h2>Collection link unavailable</h2>
            <p>This collection sharing link is no longer available.</p>
        </section>
        <p v-else-if="error" class="page-error">{{ error }}</p>

        <template v-else>
            <CategorySelector
                :categories="categories"
                :selected="selectedCategory"
                :counts="categoryCounts"
                :labels="categoryLabels"
                @change="selectedCategory = $event"
            />

            <SearchBar
                placeholder="Search this collection..."
                @search="search = $event"
            />

            <div class="collection-controls">
                <div class="control-group" role="group" aria-label="Collection display">
                    <button
                        type="button"
                        :class="{ active: !groupByCollection }"
                        @click="groupByCollection = false"
                    >
                        Singles
                    </button>
                    <button
                        type="button"
                        :class="{ active: groupByCollection }"
                        @click="groupByCollection = true"
                    >
                        Collections
                    </button>
                </div>
                <div class="control-group" role="group" aria-label="Collection view">
                    <button
                        type="button"
                        :class="{ active: viewMode === 'grid' }"
                        @click="viewMode = 'grid'"
                    >
                        Grid
                    </button>
                    <button
                        type="button"
                        :class="{ active: viewMode === 'list' }"
                        @click="viewMode = 'list'"
                    >
                        List
                    </button>
                </div>
            </div>

            <h2>Media ({{ visibleCopyCount }} copies)</h2>
            <p v-if="filteredMedia.length === 0" class="page-message">
                No media matches this selection.
            </p>
            <component
                v-else
                :is="viewMode === 'list' ? MediaList : MediaGrid"
                :media-list="filteredMedia"
                mode="collection"
                from-context="search"
                :category="selectedCategory === 'ALL' ? null : selectedCategory"
                read-only
            />
        </template>
    </main>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { getSharedCollection } from "../api/collectionSharingAPI.js";
import MediaGrid from "../components/media/MediaGrid.vue";
import MediaList from "../components/media/MediaList.vue";
import CategorySelector from "../components/ui/CategorySelector.vue";
import SearchBar from "../components/ui/SearchBar.vue";

const route = useRoute();
const copies = ref([]);
const ownerUsername = ref("");
const loading = ref(true);
const unavailable = ref(false);
const error = ref("");
const search = ref("");
const selectedCategory = ref("ALL");
const groupByCollection = ref(false);
const viewMode = ref("grid");
const categories = ["ALL", "MOVIE", "TV_SHOW", "BOOK", "COMIC", "MUSIC"];
const categoryLabels = {
    ALL: "All",
    MOVIE: "Movies",
    TV_SHOW: "TV",
    BOOK: "Books",
    COMIC: "Comics",
    MUSIC: "Music",
};
let loadSequence = 0;

watch(
    () => route.params.token,
    async (token) => {
        const sequence = ++loadSequence;
        loading.value = true;
        unavailable.value = false;
        error.value = "";
        copies.value = [];
        ownerUsername.value = "";

        if (typeof token !== "string" || !token) {
            unavailable.value = true;
            loading.value = false;
            return;
        }

        try {
            const result = await getSharedCollection(token);
            if (!result || !Array.isArray(result.copies)) {
                throw new Error("The shared collection response was invalid.");
            }
            if (sequence === loadSequence) {
                copies.value = result.copies;
                ownerUsername.value =
                    typeof result.ownerUsername === "string"
                        ? result.ownerUsername
                        : "";
            }
        } catch (err) {
            if (sequence === loadSequence) {
                if (/not found|unavailable/i.test(err.message)) {
                    unavailable.value = true;
                } else {
                    error.value = err.message || "Unable to load this shared collection.";
                }
            }
        } finally {
            if (sequence === loadSequence) {
                loading.value = false;
            }
        }
    },
    { immediate: true },
);

const categoryCounts = computed(() => {
    const counts = { ALL: 0 };
    for (const category of categories.slice(1)) {
        counts[category] = 0;
    }
    for (const copy of copies.value) {
        counts.ALL += 1;
        if (Object.hasOwn(counts, copy.media.category)) {
            counts[copy.media.category] += 1;
        }
    }
    return counts;
});

const visibleCopyCount = computed(() =>
    filteredMedia.value.reduce((total, media) => {
        if (media.isCollectionGroup) return total + media.collectionCopies;
        return total + media.copies.length;
    }, 0),
);

const filteredMedia = computed(() => {
    const byMediaId = new Map();
    const query = search.value.trim().toLocaleLowerCase();

    for (const copy of copies.value) {
        const media = copy.media;
        if (selectedCategory.value !== "ALL" && media.category !== selectedCategory.value) {
            continue;
        }

        if (!byMediaId.has(media.mediaKey)) {
            byMediaId.set(media.mediaKey, {
                ...media,
                id: media.mediaKey,
                dvd: 0,
                bluray: 0,
                fourk: 0,
                softcover: 0,
                hardcover: 0,
                cd: 0,
                vinyl: 0,
                copies: [],
            });
        }
        const groupedMedia = byMediaId.get(media.mediaKey);
        groupedMedia.copies.push(copy);
        switch (copy.edition) {
            case "DVD":
                groupedMedia.dvd += 1;
                break;
            case "BLURAY":
                groupedMedia.bluray += 1;
                break;
            case "UHD_4K":
                groupedMedia.fourk += 1;
                break;
            case "SOFT_COVER":
                groupedMedia.softcover += 1;
                break;
            case "HARD_COVER":
                groupedMedia.hardcover += 1;
                break;
            case "CD":
                groupedMedia.cd += 1;
                break;
            case "VINYL":
                groupedMedia.vinyl += 1;
                break;
        }
    }

    const mediaItems = [...byMediaId.values()];
    if (!groupByCollection.value) {
        return mediaItems.filter((media) =>
            media.title.toLocaleLowerCase().includes(query),
        );
    }

    const grouped = new Map();
    for (const media of mediaItems) {
        const collection = media.mediaCollection;
        const key = collection ? `collection-${collection.collectionKey}` : `media-${media.id}`;
        if (!grouped.has(key)) {
            grouped.set(key, {
                collection,
                mediaItems: [],
                matchesSearch: false,
            });
        }
        const group = grouped.get(key);
        group.mediaItems.push(media);
        if (media.title.toLocaleLowerCase().includes(query)) {
            group.matchesSearch = true;
        }
    }

    const result = [];
    for (const group of grouped.values()) {
        group.mediaItems.sort(
            (left, right) => (left.collectionPosition ?? 0) - (right.collectionPosition ?? 0),
        );
        if (group.collection) {
            if (query && !group.matchesSearch && !group.collection.title.toLocaleLowerCase().includes(query)) {
                continue;
            }
            const first = group.mediaItems[0];
            result.push({
                ...first,
                id: `collection-${group.collection.collectionKey}`,
                title: group.collection.title,
                isCollectionGroup: true,
                collectionSize: group.mediaItems.length,
                collectionCopies: group.mediaItems.reduce(
                    (total, media) => total + media.copies.length,
                    0,
                ),
                collectionMedias: group.mediaItems,
            });
        } else {
            result.push(
                ...group.mediaItems.filter((media) =>
                    media.title.toLocaleLowerCase().includes(query),
                ),
            );
        }
    }
    return result;
});
</script>

<style scoped>
.shared-collection-page {
    width: min(100%, 1200px);
    margin: 0 auto;
}

.shared-collection-page h1 {
    margin-top: 0;
}

.shared-collection-page h2 {
    margin: 18px 0 8px;
    font-size: 18px;
}

.page-message,
.page-error {
    color: var(--text-secondary);
}

.page-error,
.unavailable-state {
    padding: 16px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-small);
}

.page-error {
    color: var(--danger);
}

.unavailable-state h2 {
    margin: 0 0 8px;
    color: var(--text-h);
}

.unavailable-state p {
    margin: 0;
    color: var(--text-secondary);
}

.collection-controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 10px;
}

.control-group {
    display: inline-flex;
    gap: 2px;
    padding: 2px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-small);
}

.control-group button {
    min-height: 32px;
    padding: 5px 9px;
    color: var(--text-secondary);
    background: transparent;
    border: 0;
    border-radius: var(--radius-small);
    font-size: 12px;
    cursor: pointer;
}

.control-group button.active {
    color: var(--text-h);
    background: var(--accent);
}

@media (max-width: 480px) {
    .collection-controls {
        justify-content: space-between;
    }
}
</style>
