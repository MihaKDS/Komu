<template>
    <div class="page">
        <Breadcrumbs />
        <div class="collection-title-row">
            <h1>My Collection ({{ inventoryItems.length }})</h1>
            <RouterLink :to="{ path: '/collection/edit' }" class="collection-edit-button">Collection edit</RouterLink>
            <button type="button" class="collection-action" @click="showMediaPicker = true">Add Copy / BoxSet</button>
            <button type="button" class="collection-share-button" @click="showShareDialog = true">Share Collection</button>
        </div>

        <CategorySelector :categories="categories" :selected="selectedCategory" @change="selectedCategory = $event" />
        <SearchBar placeholder="Search your physical inventory..." @search="search = $event" />
        <FilterBar
            :category="selectedCategory"
            :format="selectedFormat"
            :show-collection-filter="false"
            :show-view-toggle="false"
            :show-display-toggle="false"
            show-on-sale
            @update:format="selectedFormat = $event"
        />

        <div v-if="loading" class="loading">Loading collection...</div>
        <div v-else-if="inventoryItems.length === 0" class="empty-state">
            <p>You have no physical copies or BoxSets yet.</p>
            <button type="button" class="collection-action" @click="showMediaPicker = true">Add Copy / BoxSet</button>
        </div>
        <div v-else-if="filteredItems.length === 0" class="empty-state">No physical items match your search or filters.</div>
        <section v-else class="inventory-grid" aria-label="Physical inventory">
            <button
                v-for="item in filteredItems"
                :key="item.key"
                type="button"
                class="inventory-card"
                :aria-label="`${item.isBoxSet ? 'Edit BoxSet' : 'Edit Copy'}: ${item.title}`"
                @click="openItem(item)"
            >
                <div class="visual-wrap">
                    <PhysicalMediaVisual
                        :type="item.isBoxSet ? 'BOXSET' : 'COPY'"
                        :format="item.copy.edition"
                        :category="item.copy.media.category"
                        :cover-image="posterSource(item.copy.media.poster, item.copy.media.category)"
                        :cover-alt="item.title"
                    />
                </div>
                <div class="item-info">
                    <strong>{{ item.title }}</strong>
                    <span>{{ editionLabel(item.copy.edition) }}<template v-if="item.copy.condition"> · {{ conditionLabel(item.copy.condition) }}</template></span>
                    <div class="item-statuses">
                        <span class="status-tag">Owned</span>
                        <span v-if="isCurrentlyForSale(item.copy)" class="status-tag is-sale">For sale</span>
                        <span v-if="item.copy.activeTrade?.type === 'TRADE'" class="status-tag">For trade</span>
                    </div>
                </div>
            </button>
        </section>
    </div>

    <div v-if="showMediaPicker" class="picker-overlay" @click.self="showMediaPicker = false">
        <section class="media-picker" role="dialog" aria-modal="true" aria-label="Choose media for your physical item">
            <div class="picker-heading">
                <h2>Choose media</h2>
                <button type="button" aria-label="Close" @click="showMediaPicker = false">×</button>
            </div>
            <p>Select the Media record for the copy or BoxSet you want to add.</p>
            <MediaSearch :category="selectedCategory" @selected="selectMedia" />
        </section>
    </div>
    <AddCopyDialog v-if="selectedMedia" :media="selectedMedia" @close="selectedMedia = null" @saved="loadCollection" />
    <ShareCollectionDialog v-model="showShareDialog" />
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter, RouterLink } from "vue-router";
import Breadcrumbs from "../components/layout/Breadcrumbs.vue";
import CategorySelector from "../components/ui/CategorySelector.vue";
import FilterBar from "../components/ui/FilterBar.vue";
import SearchBar from "../components/ui/SearchBar.vue";
import PhysicalMediaVisual from "../components/ui/PhysicalMediaVisual.vue";
import AddCopyDialog from "../components/ui/AddCopyDialog.vue";
import ShareCollectionDialog from "../components/ui/ShareCollectionDialog.vue";
import MediaSearch from "../components/media/MediaSearch.vue";
import { getMyCopies } from "../api/copyAPI.js";

const router = useRouter();
const loading = ref(true);
const copies = ref([]);
const search = ref("");
const showShareDialog = ref(false);
const showMediaPicker = ref(false);
const selectedMedia = ref(null);
const selectedFormat = ref("ALL");
const selectedCategory = ref("MOVIE");
const categories = ["MOVIE", "TV_SHOW", "BOOK", "COMIC", "MUSIC"];

async function loadCollection() {
    loading.value = true;
    try {
        copies.value = await getMyCopies();
    } catch (error) {
        console.error("Failed to load collection:", error);
        copies.value = [];
    } finally {
        loading.value = false;
    }
}

onMounted(loadCollection);

function selectMedia(media) {
    showMediaPicker.value = false;
    selectedMedia.value = media;
}

function isCurrentlyForSale(copy) {
    const reserved = ["ACCEPTED", "RENTING"].includes(copy.activeTrade?.status);
    return copy.isArchived !== true && !reserved && Boolean(copy.canSell || copy.boxSet?.canSell);
}

const inventoryItems = computed(() => {
    const items = [];
    const seenBoxSets = new Set();
    for (const copy of copies.value) {
        if (copy.isArchived || copy.media?.category !== selectedCategory.value) continue;
        if (copy.boxSet?.id) {
            if (seenBoxSets.has(copy.boxSet.id)) continue;
            seenBoxSets.add(copy.boxSet.id);
            const contents = copies.value.filter((entry) => entry.boxSet?.id === copy.boxSet.id && !entry.isArchived);
            items.push({
                key: `boxset-${copy.boxSet.id}`,
                id: copy.boxSet.id,
                isBoxSet: true,
                copy: { ...copy, boxSet: { ...copy.boxSet, canSell: contents.some((entry) => entry.boxSet?.canSell) } },
                title: copy.boxSet.name || copy.boxSet.title || `${copy.media.title} BoxSet`,
                contents,
            });
        } else {
            items.push({ key: `copy-${copy.id}`, id: copy.id, isBoxSet: false, copy, title: copy.media?.title || copy.title || "Untitled" });
        }
    }
    return items;
});

const filteredItems = computed(() => {
    const needle = search.value.trim().toLowerCase();
    return inventoryItems.value.filter((item) => {
        const formatMatches = selectedFormat.value === "ALL"
            || (selectedFormat.value === "ON_SALE" ? isCurrentlyForSale(item.copy) : item.copy.edition === selectedFormat.value);
        const searchable = [item.title, item.copy.media?.title, item.copy.edition, item.copy.condition, item.copy.listingNote, item.copy.id, ...(item.contents?.map((copy) => copy.media?.title) ?? [])].filter(Boolean).join(" ").toLowerCase();
        return formatMatches && (!needle || searchable.includes(needle));
    });
});

function openItem(item) {
    router.push(item.isBoxSet
        ? { name: "boxset", params: { id: item.id }, query: { from: "collection", edit: "true" } }
        : { name: "EditCopy", params: { id: item.id }, query: { from: "collection" } });
}

function posterSource(poster, category) {
    if (!poster) return ["BOOK", "COMIC", "MUSIC"].includes(category) ? "/posters/book-placeholder.png" : "/posters/movie-placeholder.png";
    return poster.startsWith("http") ? poster : `/posters/${poster}`;
}

function editionLabel(edition) {
    return ({ BLURAY: "Blu-ray", UHD_4K: "4K UHD", SOFT_COVER: "Soft cover", HARD_COVER: "Hard cover", VINYL: "Vinyl" })[edition] || edition || "Physical copy";
}

function conditionLabel(condition) {
    return condition.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
</script>

<style scoped>
.collection-title-row { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
.collection-title-row h1 { margin: 0 auto 0 0; }
.collection-edit-button, .collection-action, .collection-share-button { display: inline-flex; align-items: center; min-height: 32px; padding: 6px 9px; color: var(--text-h); background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-small); font-size: 12px; text-decoration: none; cursor: pointer; }
.collection-action, .collection-share-button { background: var(--accent-bg); border-color: var(--accent-border); }
.inventory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-top: 16px; }
.inventory-card { min-width: 0; padding: 0; overflow: hidden; color: inherit; text-align: left; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-small); cursor: pointer; }
.inventory-card:hover, .inventory-card:focus-visible { border-color: var(--accent-border); background: var(--bg-hover); }
.visual-wrap { display: grid; place-items: center; height: 190px; background: var(--bg-secondary); }
.visual-wrap :deep(.physical-media-visual) { transform: scale(1.35); }
.item-info { display: grid; gap: 5px; padding: 10px; }
.item-info strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-info > span { color: var(--text-muted); font-size: 12px; }
.item-statuses { display: flex; flex-wrap: wrap; gap: 4px; }
.status-tag { padding: 4px 6px; color: #fff; background: rgba(20, 24, 32, .78); border: 1px solid var(--border-light); border-radius: 999px; font-size: 10px; line-height: 1; }
.status-tag.is-sale { border-color: var(--accent-border); }
.empty-state { display: grid; justify-items: center; gap: 8px; padding: 32px 12px; color: var(--text-secondary); text-align: center; }
.picker-overlay { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; padding: 20px; background: rgb(0 0 0 / 65%); }
.media-picker { width: min(560px, 100%); max-height: 85vh; overflow: auto; padding: 20px; color: var(--text); background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-small); }
.picker-heading { display: flex; align-items: center; justify-content: space-between; }
.picker-heading h2 { margin: 0; }
.picker-heading button { color: inherit; background: none; border: 0; font-size: 24px; cursor: pointer; }
@media (max-width: 600px) { .inventory-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; } .visual-wrap { height: 170px; } .visual-wrap :deep(.physical-media-visual) { transform: scale(1.2); } }
</style>
