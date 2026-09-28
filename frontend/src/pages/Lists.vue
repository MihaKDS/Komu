<template>
    <div class="page lists-page">
        <Breadcrumbs />
        <h1>My Lists</h1>

        <p v-if="loading" class="loading">Loading lists...</p>
        <p v-else-if="error" class="lists-error">{{ error }}</p>
        <p v-else-if="mediaListEntries.length === 0" class="empty">
            Your lists are empty.
        </p>

        <section
            v-for="section in sections"
            :key="section.status"
            class="list-section"
        >
            <h2>{{ section.title }}</h2>
            <p v-if="!entriesByStatus[section.status].length" class="empty-section">
                No media in this list.
            </p>

            <div
                v-for="entry in entriesByStatus[section.status]"
                :key="entry.id"
                class="list-row"
            >
                <img
                    class="list-poster"
                    :src="posterSource(entry.media)"
                    :alt="entry.media.title"
                >
                <div class="list-row-content">
                    <RouterLink
                        :to="{ name: 'media', params: { id: entry.mediaId }, query: { from: 'lists' } }"
                        class="media-title"
                    >
                        {{ entry.media.title }}
                        <span v-if="entry.media.releaseYear" class="release-year">
                            ({{ entry.media.releaseYear }})
                        </span>
                    </RouterLink>
                    <p
                        v-if="entry.status === 'WATCHING' && progressLabel(entry)"
                        class="progress-label"
                    >
                        {{ progressLabel(entry) }}
                    </p>
                    <p v-if="entry.note" class="list-note-preview">
                        {{ entry.note }}
                    </p>
                </div>
                <button
                    type="button"
                    class="remove-list-button"
                    :disabled="removingId === entry.mediaId"
                    @click="removeEntry(entry.mediaId)"
                >
                    {{ removingId === entry.mediaId ? "Removing..." : "Remove" }}
                </button>
            </div>
        </section>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import Breadcrumbs from "../components/layout/Breadcrumbs.vue";
import {
    deleteMediaList,
    loadMyLists,
    mediaListEntries,
} from "../services/listsService.js";

const loading = ref(true);
const error = ref("");
const removingId = ref(null);

const sections = [
    { status: "WISHLIST", title: "Wishlist" },
    { status: "TO_WATCH", title: "To Watch / To Read" },
    { status: "WATCHING", title: "Watching / Reading" },
    { status: "COMPLETED", title: "Completed" },
];

const entriesByStatus = computed(() => {
    const grouped = {
        WISHLIST: [],
        TO_WATCH: [],
        WATCHING: [],
        COMPLETED: [],
    };
    for (const entry of mediaListEntries.value) {
        grouped[entry.status]?.push(entry);
    }
    return grouped;
});

onMounted(async () => {
    try {
        await loadMyLists(true);
    } catch (err) {
        error.value = err.message || "Unable to load your lists.";
    } finally {
        loading.value = false;
    }
});

function posterSource(media) {
    if (media.poster) {
        return media.poster.startsWith("http")
            ? media.poster
            : `/posters/${media.poster}`;
    }
    return ["BOOK", "COMIC", "MUSIC"].includes(media.category)
        ? "/posters/book-placeholder.png"
        : "/posters/movie-placeholder.png";
}

function progressLabel(entry) {
    const progressType = entry.media.category === "TV_SHOW"
        ? "Episode"
        : ["BOOK", "COMIC"].includes(entry.media.category)
            ? "Chapter"
            : null;
    return progressType && entry.progress != null
        ? `${progressType} ${entry.progress}`
        : "";
}

async function removeEntry(mediaId) {
    removingId.value = mediaId;
    error.value = "";
    try {
        await deleteMediaList(mediaId);
    } catch (err) {
        error.value = err.message || "Unable to remove media from your list.";
    } finally {
        removingId.value = null;
    }
}
</script>

<style scoped>
.lists-page {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
}

.list-section {
    margin-top: 24px;
}

.list-section h2 {
    margin: 0 0 8px;
    padding-bottom: 7px;
    color: var(--text-h);
    border-bottom: 1px solid var(--border);
    font-size: 17px;
}

.list-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 70px;
    padding: 8px 2px;
    border-bottom: 1px solid var(--border);
}

.list-poster {
    flex: 0 0 40px;
    width: 40px;
    height: 54px;
    object-fit: cover;
    background: var(--bg-secondary);
    border-radius: 2px;
}

.list-row-content {
    flex: 1;
    min-width: 0;
}

.media-title {
    color: var(--text-h);
    font-weight: 600;
    text-decoration: none;
    overflow-wrap: anywhere;
}

.media-title:hover {
    color: var(--accent-hover);
}

.release-year,
.progress-label,
.list-note-preview,
.empty-section {
    color: var(--text-muted);
    font-size: 12px;
}

.progress-label,
.list-note-preview {
    margin: 3px 0 0;
}

.list-note-preview {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.remove-list-button {
    flex: 0 0 auto;
    min-height: 34px;
    padding: 6px 10px;
    color: var(--text-secondary);
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-small);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
}

.remove-list-button:hover {
    color: var(--text-h);
    background: var(--bg-hover);
}

.remove-list-button:disabled {
    opacity: 0.6;
}

.lists-error {
    color: var(--danger);
}

@media (max-width: 600px) {
    .list-row {
        gap: 8px;
    }

    .list-poster {
        flex-basis: 34px;
        width: 34px;
        height: 48px;
    }

    .remove-list-button {
        padding: 6px 8px;
    }
}
</style>
