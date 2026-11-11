<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useAuth } from "../composables/useAuth"

const {
  user,
} = useAuth()

import Breadcrumbs from "../components/layout/Breadcrumbs.vue";
import AddCopyDialog from "../components/ui/AddCopyDialog.vue";
import CollectionContentsModal from "../components/ui/CollectionContentsModal.vue";
import PhysicalMediaVisual from "../components/ui/PhysicalMediaVisual.vue";
import { formatComicVolumesForCopy } from "../utils/comicVolumes.js";

import { getMedia } from "../api/mediaAPI.js";
import { getMyCopies } from "../api/copyAPI.js";
import EditCopy from "../components/ui/EditCopy.vue";
import ListMenu from "../components/ui/ListMenu.vue";
import { listStatusLabel as formatListStatusLabel } from "../services/listMenuState.js";
import {
    mediaListEntries,
    loadMyLists,
    resetMyLists,
    updateMediaList,
} from "../services/listsService.js";

const route = useRoute();
const router = useRouter();
const mediaDetails = ref(null);
const showAddCopy = ref(false);
const showTradeOffers = ref(false);
const showReviews = ref(false);
const collectionModalOpen = ref(false);
const showNoteReview = ref(false);
const descriptionExpanded = ref(false);
const ownedMediaIds = ref(new Set());
const progressDraft = ref("0");
const noteDraft = ref("");
const reviewDraft = ref(false);
const listProgressError = ref("");
const savingListProgress = ref(false);
const publicReviews = computed(() => mediaDetails.value?.publicReviews ?? []);

// Get the current context from where user came
const currentContext = computed(() => route.query.from || 'search');

async function loadMedia() {
    mediaDetails.value = await getMedia(route.params.id);
    console.log("Media details loaded:", mediaDetails.value);
}

function openOwnedCopy(copy) {
    if (copy.boxSet?.id) {
        router.push({
            name: "boxset",
            params: { id: copy.boxSet.id },
            query: { from: currentContext.value, edit: "true" },
        });
        return;
    }

    router.push({
        name: "EditCopy",
        params: { id: copy.id },
        query: { from: currentContext.value },
    });
}
function buyCopy(copy) {
    router.push({
        name: 'seller-listings',
        params: {
            username: copy.owner.username,
        },
        query: {
            copyId: copy.id,
        },
    });
}
function buyBoxSet(boxSet) {
    router.push({
        name: "seller-listings",
        params: {
            username: boxSet.owner.username,
        },
        query: {
            boxSetId: boxSet.boxSet.id,
        },
    });
}

function posterSource(poster, category) {
    if (poster) {
        return poster.startsWith("http")
            ? poster
            : `/posters/${poster}`;
    }

    if (category === "BOOK" || category === "COMIC" || category === "MUSIC") {
        return "/posters/book-placeholder.png";
    }

    return "/posters/movie-placeholder.png";
}

function categoryLabel(category) {
    return {
        BOOK: "Book",
        COMIC: "Comic",
        MUSIC: "Music",
        MOVIE: "Movie",
        TV_SHOW: "TV Show",
    }[category] ?? category;
}

onMounted(loadMedia);
watch(
    () => user.value?.id,
    (userId) => {
        if (!userId) {
            resetMyLists();
            ownedMediaIds.value = new Set();
            return;
        }

        loadMyLists().catch((error) => {
            listProgressError.value =
                error.message || "Unable to load your list status.";
        });
        getMyCopies().then((copies) => {
            if (Number(user.value?.id) !== Number(userId)) return;
            ownedMediaIds.value = new Set(
                copies.map((copy) => Number(copy.mediaId ?? copy.media?.id)),
            );
        }).catch((error) => {
            console.error("Unable to load owned media for collection rows:", error);
        });
    },
    { immediate: true },
);
watch(
    () => route.params.id,
    () => {
        descriptionExpanded.value = false;
        loadMedia();
    }
);

watch(mediaDetails, (details) => {
    if (details) {
        document.title = `Komu - ${details.media.title}`;
    }
});

const sortedCollectionMedias = computed(() => {
    if (!mediaDetails.value || !mediaDetails.value.collection || !Array.isArray(mediaDetails.value.collection.medias)) return [];
    return [...mediaDetails.value.collection.medias].sort((a, b) =>
        (a.collectionPosition ?? 9999) - (b.collectionPosition ?? 9999) ||
        (a.releaseYear ?? 9999) - (b.releaseYear ?? 9999) ||
        a.title.localeCompare(b.title),
    );
});

const currentCollectionIndex = computed(() =>
    sortedCollectionMedias.value.findIndex(
        (item) => Number(item.id) === Number(mediaDetails.value?.media.id),
    ),
);
const hasCollectionNavigation = computed(() => Boolean(mediaDetails.value?.collection));
const previousMediaDisabled = computed(() => currentCollectionIndex.value <= 0);
const nextMediaDisabled = computed(() =>
    currentCollectionIndex.value < 0 ||
    currentCollectionIndex.value >= sortedCollectionMedias.value.length - 1,
);

function navigateCollection(offset) {
    const target = sortedCollectionMedias.value[currentCollectionIndex.value + offset];
    if (!target) return;

    router.push({
        name: "media",
        params: { id: target.id },
        query: { ...route.query },
    });
}

function openCollectionContents() {
    collectionModalOpen.value = true;
}

// View and filter state for the collection block
const collectionFormat = ref('ALL'); // ALL, DVD, BLURAY, UHD_4K
const collectionViewMode = ref('list'); // 'list' or 'grid'

function mediaHasFormat(media, format) {
    if (format === 'ALL') return true;
    const map = {
        DVD: media.dvd,
        BLURAY: media.bluray,
        UHD_4K: media.fourk,
        CD: media.cd,
        VINYL: media.vinyl,
    };
    return Boolean(map[format]);
}

const filteredCollectionMedias = computed(() =>
    sortedCollectionMedias.value.filter((media) => mediaHasFormat(media, collectionFormat.value)),
);

function collectionListStatus(mediaId) {
    const entry = mediaListEntries.value.find((item) => item.mediaId === Number(mediaId));
    return entry ? formatListStatusLabel(entry.status, mediaDetails.value?.media.category) : "";
}

function comicVolumesLabel(copy) {
    return formatComicVolumesForCopy(copy);
}

function editionLabel(edition) {
    return {
        DVD: "DVD",
        BLURAY: "Blu-ray",
        UHD_4K: "4K UHD",
        CD: "CD",
        VINYL: "Vinyl",
    }[edition?.toUpperCase()] ?? edition;
}

const currentListEntry = computed(() =>
    mediaListEntries.value.find(
        (entry) => entry.mediaId === Number(route.params.id),
    ) ?? null,
);

const progressType = computed(() => {
    const category = mediaDetails.value?.media.category;
    if (category === "TV_SHOW") return "Episode";
    return null;
});

const listStatusLabel = computed(() => {
    const status = currentListEntry.value?.status;
    if (status === "COMPLETED") return "Completed";
    if (status === "TO_WATCH") {
        return ["BOOK", "COMIC"].includes(mediaDetails.value?.media.category)
            ? "To Read"
            : "To Watch";
    }
    return ["BOOK", "COMIC"].includes(mediaDetails.value?.media.category)
        ? "Reading"
        : "Watching";
});

watch(currentListEntry, (entry) => {
    progressDraft.value = String(entry?.progress ?? 0);
    noteDraft.value = entry?.note ?? "";
    reviewDraft.value = entry?.isReview ?? false;
}, { immediate: true });

function openNoteReview() {
    noteDraft.value = currentListEntry.value?.note ?? "";
    reviewDraft.value = currentListEntry.value?.isReview ?? false;
    showNoteReview.value = true;
}

function closeNoteReview() {
    noteDraft.value = currentListEntry.value?.note ?? "";
    reviewDraft.value = currentListEntry.value?.isReview ?? false;
    showNoteReview.value = false;
}

async function saveProgress(value = progressDraft.value) {
    const progress = Number(value);
    if (!currentListEntry.value || !Number.isInteger(progress) || progress < 0) {
        listProgressError.value = "Progress must be a whole number of 0 or more.";
        return;
    }

    savingListProgress.value = true;
    listProgressError.value = "";
    try {
        await updateMediaList(Number(route.params.id), {
            status: currentListEntry.value.status,
            progress,
        });
        progressDraft.value = String(progress);
    } catch (error) {
        listProgressError.value =
            error.message || "Unable to save progress.";
    } finally {
        savingListProgress.value = false;
    }
}

function changeProgress(amount) {
    const current = Number(progressDraft.value) || 0;
    const next = Math.max(0, current + amount);
    progressDraft.value = String(next);
    saveProgress(next);
}

async function saveListNote() {
    if (!currentListEntry.value) return false;
    savingListProgress.value = true;
    listProgressError.value = "";
    try {
        await updateMediaList(Number(route.params.id), {
            status: currentListEntry.value.status,
            note: noteDraft.value.trim() || null,
            ...(["WATCHING", "COMPLETED"].includes(currentListEntry.value.status)
                ? { isReview: reviewDraft.value }
                : {}),
        });
        return true;
    } catch (error) {
        listProgressError.value =
            error.message || "Unable to save note.";
        return false;
    } finally {
        savingListProgress.value = false;
    }
}

async function saveAndCloseNoteReview() {
    if (await saveListNote()) {
        showNoteReview.value = false;
    }
}

async function markListCompleted() {
    if (!currentListEntry.value) return;
    savingListProgress.value = true;
    listProgressError.value = "";
    try {
        await updateMediaList(Number(route.params.id), {
            status: "COMPLETED",
            note: noteDraft.value.trim() || null,
            isReview: reviewDraft.value,
        });
    } catch (error) {
        listProgressError.value =
            error.message || "Unable to mark this media completed.";
    } finally {
        savingListProgress.value = false;
    }
}
</script>

<template>

<main v-if="mediaDetails">

<Breadcrumbs :title="mediaDetails.media.title" />

<div class="media-detail">

    <!-- =====================================================
         MEDIA HEADER
         ===================================================== -->

    <div class="media-header-layout">

    <section class="media-header">

        <div class="poster">
            <img
                :src="posterSource(mediaDetails.media.poster, mediaDetails.media.category)"
                :alt="mediaDetails.media.title"
            >
        </div>

        <div class="summary">

            <h1>
                {{ mediaDetails.media.title }}
            </h1>

            <div class="media-meta">
                <span>
                    {{ mediaDetails.media.releaseYear }}
                </span>

                <span>•</span>

                <span>
                    {{ categoryLabel(mediaDetails.media.category) }}
                </span>
            </div>

            <p
                v-if="mediaDetails.media.description"
                :class="['description', { expanded: descriptionExpanded }]"
            >
                {{ mediaDetails.media.description }}
            </p>

            <button
                v-if="mediaDetails.media.description"
                type="button"
                class="description-toggle"
                :aria-expanded="descriptionExpanded"
                @click="descriptionExpanded = !descriptionExpanded"
            >
                {{ descriptionExpanded ? 'Hide description ↑' : 'Show description ↓' }}
            </button>

            <div v-if="user" class="media-actions">
                <div
                    v-if="mediaDetails.media.category === 'TV_SHOW' && currentListEntry && currentListEntry.status !== 'COMPLETED'"
                    class="progress-controls episode-tracker"
                >
                    <span class="episode-label">Episode</span>
                    <button
                        type="button"
                        class="progress-stepper"
                        :disabled="savingListProgress || Number(progressDraft) <= 0"
                        aria-label="Decrease episode progress"
                        @click="changeProgress(-1)"
                    >−</button>
                    <input
                        :id="`media-progress-${mediaDetails.media.id}`"
                        v-model="progressDraft"
                        type="number"
                        min="0"
                        step="1"
                        :disabled="savingListProgress"
                        aria-label="Episode progress"
                        @change="saveProgress()"
                    >
                    <button
                        type="button"
                        class="progress-stepper"
                        :disabled="savingListProgress"
                        aria-label="Increase episode progress"
                        @click="changeProgress(1)"
                    >+</button>
                    <button
                        v-if="currentListEntry.status === 'WATCHING'"
                        type="button"
                        class="complete-list-button"
                        :disabled="savingListProgress"
                        @click="markListCompleted"
                    >
                        Completed
                    </button>
                </div>

            </div>

        </div>

    </section>

    </div>

    <div class="media-toolbar">
        <div v-if="hasCollectionNavigation" class="collection-toolbar-nav" aria-label="Collection navigation">
            <button type="button" class="toolbar-arrow" :disabled="previousMediaDisabled" aria-label="Previous media" @click="navigateCollection(-1)">‹</button>
            <button type="button" class="collection-position" @click="openCollectionContents">{{ currentCollectionIndex + 1 }}/{{ sortedCollectionMedias.length }}</button>
            <button type="button" class="toolbar-arrow" :disabled="nextMediaDisabled" aria-label="Next media" @click="navigateCollection(1)">›</button>
        </div>
        <ListMenu v-if="user" :media-id="mediaDetails.media.id" :category="mediaDetails.media.category" empty-label="Add to list" />
        <button v-if="user && currentListEntry" type="button" class="toolbar-button" @click="openNoteReview">Note / Review</button>
    </div>
    <hr class="section-divider toolbar-divider">

    <section class="owned-copies-section detail-section" aria-labelledby="owned-copies-title">
        <div class="owned-copies-heading">
            <h2 id="owned-copies-title">Owned copies ({{ mediaDetails.myCopies.length }})</h2>
            <button v-if="user" type="button" class="add-copy-button" @click="showAddCopy = true">+ Add copy</button>
        </div>
        <div class="copy-list owned-copy-list">
            <p v-if="mediaDetails.myCopies.length === 0" class="empty">No physical copies owned</p>
            <article v-for="copy in mediaDetails.myCopies" :key="copy.id" class="copy-card own-copy">
                <div class="copy-visual-column">
                    <span class="boxset-visual-label" :class="{ 'is-empty': !copy.boxSet }">{{ copy.boxSet ? `BoxSet #${copy.boxSet.id}` : '' }}</span>
                    <button type="button" class="physical-media-trigger" :aria-label="copy.boxSet ? `Edit BoxSet ${copy.boxSet.name || copy.boxSet.title || ''}` : `Edit copy ${copy.id}`" @click="openOwnedCopy(copy)">
                        <PhysicalMediaVisual :type="copy.boxSet ? 'BOXSET' : 'COPY'" :format="copy.edition" :category="mediaDetails.media.category" :cover-image="posterSource(mediaDetails.media.poster, mediaDetails.media.category)" :cover-alt="mediaDetails.media.title" />
                    </button>
                    <span class="copy-visual-format">{{ editionLabel(copy.edition) }}<span v-if="copy.includesBluRay"> · Includes Blu-ray</span></span>
                    <span v-if="copy.canSell || copy.boxSet?.canSell" class="copy-sale-label">On sale</span>
                </div>
            </article>
        </div>
    </section>
    <hr class="section-divider">

    <section class="collapsible-section">
        <button type="button" class="collapsible-heading" :aria-expanded="showTradeOffers" @click="showTradeOffers = !showTradeOffers"><span>For trade ({{ mediaDetails.otherOwnersCount }})</span><span class="section-chevron" :class="{ expanded: showTradeOffers }">⌄</span></button>
        <div v-if="showTradeOffers" class="collapsible-content">
            <div class="trade-list">
                <article v-for="copy in mediaDetails.otherCopies" :key="copy.id" class="copy-card seller-copy">
                    <div class="seller-header">
                        <strong><RouterLink :to="{ name: 'seller-listings', params: { username: copy.owner.username }, query: { from: currentContext } }">{{ copy.owner.username }}</RouterLink></strong>
                        <span>{{ copy.edition }}</span>
                    </div>
                    <p v-if="comicVolumesLabel(copy)" class="comic-volumes">{{ comicVolumesLabel(copy) }}</p>
                    <div class="seller-offers">
                        <span v-if="copy.canSell"><button type="button" @click="buyCopy(copy)">Buy</button><p v-if="copy.listingNote" class="listing-note">{{ copy.listingNote }}</p>For sale: <strong>{{ copy.sellPrice }} €</strong></span>
                    </div>
                    <div v-if="copy.boxSet && (copy.boxSet.canSell || copy.boxSet.canRent)" class="boxset-offer">
                        <button type="button" @click="buyBoxSet(copy)">Buy</button>
                        <p>Part of <RouterLink :to="{ name: 'boxset', params: { id: copy.boxSet.id }, query: { from: currentContext } }">Box Set #{{ copy.boxSet.id }}</RouterLink></p>
                        <p v-if="copy.boxSet.listingNote" class="listing-note">{{ copy.boxSet.listingNote }}</p>
                        <span v-if="copy.boxSet.canSell">Box set for sale: <strong>{{ copy.boxSet.sellPrice }} €</strong></span>
                        <span v-if="copy.boxSet.canRent">Deposit: <strong>{{ copy.boxSet.deposit }} €</strong></span>
                    </div>
                </article>
                <p v-if="mediaDetails.otherCopies.length === 0" class="empty">Nobody is currently selling or renting this title.</p>
            </div>
        </div>
    </section>
    <hr class="section-divider">

    <section class="collapsible-section">
        <button type="button" class="collapsible-heading" :aria-expanded="showReviews" @click="showReviews = !showReviews"><span>Reviews ({{ publicReviews.length }})</span><span class="section-chevron" :class="{ expanded: showReviews }">⌄</span></button>
        <div v-if="showReviews" class="collapsible-content">
            <p v-if="publicReviews.length === 0" class="empty">No public reviews yet.</p>
            <article v-for="review in publicReviews" :key="review.id" class="public-review"><strong>{{ review.username }}</strong><p>{{ review.note }}</p></article>
        </div>
    </section>
    <hr class="section-divider">
    <section
        v-if="mediaDetails.collection"
        class="collection-block detail-section"
    >
        <div class="section-header">
            <h2>Part of</h2>
        </div>
        <div class="collection-list-container">
            <RouterLink
                v-for="item in filteredCollectionMedias"
                :key="item.id"
                :to="{ name: 'media', params: { id: item.id }, query: { ...route.query } }"
                class="collection-media-row"
                :class="{ selected: Number(item.id) === Number(mediaDetails.media.id) }"
            >
                <img :src="posterSource(item.poster, mediaDetails.media.category)" :alt="item.title">
                <span class="collection-row-title">{{ item.title }}</span>
                <span class="collection-row-year">{{ item.releaseYear }}</span>
                <span v-if="ownedMediaIds.has(Number(item.id))" class="collection-row-badge">In collection</span>
                <span v-if="collectionListStatus(item.id)" class="collection-row-status">{{ collectionListStatus(item.id) }}</span>
            </RouterLink>
        </div>
    </section>

    <!-- Dialogs -->

<CollectionContentsModal
    v-if="mediaDetails.collection"
    v-model="collectionModalOpen"
    :collection-name="mediaDetails.collection.title || 'Collection'"
    :media-items="sortedCollectionMedias"
/>

<div
    v-if="showAddCopy"
    class="dialog-overlay"
    @click.self="showAddCopy = false"
>
    <AddCopyDialog
        :media="mediaDetails.media"
        :media-collection="mediaDetails.collection"
        @close="showAddCopy = false"
        @saved="loadMedia"
    />
</div>

<div v-if="showNoteReview" class="dialog-overlay" @click.self="closeNoteReview">
    <section class="detail-modal-content note-review-modal" role="dialog" aria-modal="true" aria-labelledby="note-review-title">
        <header class="detail-modal-header">
            <h2 id="note-review-title">Note / Review</h2>
            <button type="button" class="modal-close" :disabled="savingListProgress" @click="closeNoteReview" aria-label="Close note and review">×</button>
        </header>
        <label class="list-note">
            Note
            <textarea
                v-model="noteDraft"
                maxlength="500"
                rows="5"
                :disabled="savingListProgress"
                placeholder="Optional note"
            />
        </label>
        <label
            v-if="currentListEntry && ['WATCHING', 'COMPLETED'].includes(currentListEntry.status)"
            class="review-toggle"
        >
            <input v-model="reviewDraft" type="checkbox" :disabled="savingListProgress || !noteDraft.trim()">
            {{ currentListEntry.status === 'WATCHING' ? 'Save note as a review' : 'Show note as a review' }}
        </label>
        <p v-if="listProgressError" class="list-progress-error">{{ listProgressError }}</p>
        <div class="note-review-actions">
            <button type="button" class="modal-secondary" :disabled="savingListProgress" @click="closeNoteReview">Cancel</button>
            <button type="button" :disabled="savingListProgress" @click="saveAndCloseNoteReview">Save</button>
        </div>
    </section>
</div>

</div>

</main>

</template>

<style scoped>
.media-detail {
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    padding-bottom: 50px;
}

.media-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 42px;
    margin: -8px 0 8px;
}

.collection-toolbar-nav {
    display: inline-flex;
    align-items: center;
    gap: 2px;
}

.toolbar-arrow,
.collection-position {
    min-width: 32px;
    min-height: 32px;
    padding: 4px 8px;
    color: var(--text-h);
    background: transparent;
    border-color: transparent;
}

.collection-position {
    color: var(--accent);
    font-size: 15px;
}

.toolbar-arrow:disabled {
    opacity: .35;
    cursor: default;
}

.toolbar-button {
    min-height: 34px;
}

.section-divider {
    height: 0;
    margin: 14px 0;
    border: 0;
    border-top: 1px solid var(--border);
}

.toolbar-divider {
    margin-top: 4px;
    margin-bottom: 20px;
}

.owned-copies-section > h2 {
    margin: 0 0 12px;
    color: var(--text-h);
    font-size: 18px;
}

.owned-copies-heading {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 12px;
}

.owned-copies-heading h2 {
    margin: 0;
    color: var(--text-h);
    font-size: 18px;
}

.owned-copies-heading .add-copy-button {
    min-height: 32px;
    margin: 0;
    padding: 7px 11px;
}

.owned-copy-list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 10px;
}

.owned-copy-list .copy-card {
    display: flex;
    flex: 0 0 150px;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    height: 228px;
    gap: 12px;
    padding: 12px;
    background: transparent;
    border: 0;
    box-sizing: border-box;
}

.owned-copy-list .copy-card:hover {
    background: transparent;
}

.copy-visual-column {
    display: flex;
    flex: 1;
    width: 100%;
    min-height: 0;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
    text-align: center;
}

.boxset-visual-label {
    display: flex;
    flex: 0 0 30px;
    width: 100%;
    align-items: center;
    justify-content: center;
    color: var(--text-h);
    font-size: 13px;
    font-weight: 600;
}

.boxset-visual-label.is-empty {
    visibility: hidden;
}

.copy-visual-format {
    color: var(--text-secondary);
    font-size: 13px;
}

.copy-sale-label {
    color: var(--accent);
    font-size: 14px;
    font-weight: 700;
}

.owned-copy-list .physical-media-trigger {
    flex: 0 0 auto;
    min-height: 0;
    padding: 0;
    background: transparent;
    border: 0;
}

.owned-copy-list :deep(.case-front) {
    transition: transform 0.16s ease;
}

.owned-copy-list .physical-media-trigger:hover :deep(.case-front) {
    transform: scale(1.08);
    transform-origin: center;
}

.owned-copy-list .owned-copy-details {
    width: 100%;
    min-width: 0;
}

.collapsible-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 48px;
    padding: 8px 12px;
    color: var(--text-h);
    background: transparent;
    border: 0;
    text-align: left;
    font-size: 17px;
}

.section-chevron {
    color: var(--text-muted);
    font-size: 20px;
    transition: transform .15s ease;
}

.section-chevron.expanded {
    transform: rotate(180deg);
}

.collapsible-content {
    padding: 4px 8px 10px;
}

.public-review {
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
}

.public-review p {
    margin: 6px 0 0;
}

/* =========================================================
   LINKS
   ========================================================= */

a,
:deep(a) {
    color: var(--accent);
    font-weight: 600;
    text-decoration: none;
}

a:hover,
:deep(a:hover) {
    text-decoration: underline;
}

/* =========================================================
   MEDIA HEADER
   ========================================================= */

.media-header {
    display: grid;
    grid-template-columns: 110px minmax(0, 1fr);
    gap: 14px;
    margin: 0;
}

.media-header-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    margin: 24px 0 28px;
}

.collection-nav-arrow {
    flex: 1;
    width: 0;
    height: 32px;
    padding: 0;
    color: var(--text-muted);
    font-size: 20px;
    background: transparent;
    border-color: transparent;
}

.collection-nav-buttons {
    display: flex;
    gap: 6px;
    margin-top: 6px;
}

.collection-nav-arrow:disabled {
    opacity: 0.35;
    cursor: default;
    box-shadow: none;
    transform: none;
}

.poster {
    width: 110px;
}

.poster img,
.media-header > div:not(.summary) img {
    display: block;
    width: 100%;
    aspect-ratio: 2 / 3;
    object-fit: cover;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow-small);
}

.summary {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.summary h1 {
    margin: 0 0 8px;
    color: var(--text-h);
    font-size: clamp(20px, 2.4vw, 24px);
    line-height: 1.15;
}

.media-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 7px;
    margin-bottom: 8px;
    color: var(--text-muted);
    font-size: 14px;
}

.media-meta :deep(.list-menu) {
    margin-left: 2px;
}

.description {
    display: -webkit-box;
    max-width: 100%;
    margin: 0;
    color: var(--text);
    line-height: 1.4;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
}

.description.expanded {
    display: block;
    overflow: visible;
}

.description-toggle {
    min-height: 0;
    padding: 4px 0;
    color: var(--accent);
    background: transparent;
    border: 0;
    font-size: 13px;
    font-weight: 500;
}

.description-toggle:hover {
    box-shadow: none;
    text-decoration: underline;
}

/* =========================================================
   BUTTONS
   ========================================================= */

button,
.add-copy-button,
.edit-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 34px;
    padding: 8px 14px;
    color: var(--button-text, #fff);
    background: var(--accent);
    border: 1px solid var(--accent);
    border-radius: 6px;
    font-size: 13px;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    text-decoration: none;
    transition:
        filter 0.15s ease,
        transform 0.15s ease,
        box-shadow 0.15s ease;
}

button:hover,
.add-copy-button:hover,
.edit-button:hover {
    filter: brightness(1.06);
    text-decoration: none;
    box-shadow: var(--shadow-small);
}

button:active,
.add-copy-button:active,
.edit-button:active {
    transform: translateY(1px);
}

.add-copy-button {
    margin-top: auto;
}

.media-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: auto;
}

.media-actions .add-copy-button {
    margin-top: 0;
}

.episode-tracker {
    margin: 0;
    padding: 4px 7px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-small);
}

.episode-label {
    color: var(--text-secondary);
    font-size: 13px;
}

.note-review-button {
    min-height: 38px;
}

.collection-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 0 0 24px;
}

.collection-actions button {
    flex: 1 1 160px;
}

.list-progress-section {
    padding: 14px 16px;
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
}

.list-progress-section h2 {
    margin: 0 0 12px;
    color: var(--text-h);
    font-size: 17px;
}

.progress-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.progress-controls label {
    margin-right: auto;
    color: var(--text-secondary);
    font-size: 13px;
}

.progress-controls input {
    width: 76px;
    min-height: 36px;
    padding: 6px 8px;
    color: var(--field-text);
    background: var(--field-bg);
    border: 1px solid #b8c0ca;
    border-radius: var(--radius-small);
    font: inherit;
}

.progress-stepper {
    width: 36px;
    min-height: 36px;
    padding: 0;
    font-size: 18px;
}

.list-note {
    display: flex;
    flex-direction: column;
    gap: 5px;
    color: var(--text-secondary);
    font-size: 13px;
}

.list-note textarea {
    width: 100%;
    min-height: 54px;
    resize: vertical;
    padding: 8px 10px;
    color: var(--field-text);
    background: var(--field-bg);
    border: 1px solid #b8c0ca;
    border-radius: var(--radius-small);
    font: inherit;
    box-sizing: border-box;
}

.list-progress-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 10px;
}

.review-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--text-secondary);
    font-size: 13px;
}

.save-list-note {
    color: var(--text-h);
    background: var(--bg-secondary);
    border-color: var(--border);
}

.complete-list-button {
    color: #fff;
    background: var(--accent);
}

.list-progress-error {
    margin: 8px 0 0;
    color: var(--danger);
    font-size: 12px;
}

/* =========================================================
   SECTIONS
   ========================================================= */

.detail-section {
    margin-top: 32px;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 14px;
}

.section-header h2 {
    margin: 0;
}

.section-count {
    display: inline-flex;
    min-width: 24px;
    height: 24px;
    align-items: center;
    justify-content: center;
    padding: 0 7px;
    color: var(--text-secondary);
    background: var(--accent-bg);
    border: 1px solid var(--accent-border);
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
}

.copies-section details,
.trade-section details {
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
}

.copies-section summary,
.trade-section summary {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 14px 16px;
    color: var(--text-h);
    cursor: pointer;
    font-size: 18px;
    font-weight: 600;
    list-style: none;
    border-bottom: 1px solid var(--border);
}

.copies-section summary::-webkit-details-marker,
.trade-section summary::-webkit-details-marker {
    display: none;
}

.copies-section summary::after,
.trade-section summary::after {
    content: "▼";
    margin-left: auto;
    color: var(--text-muted);
    font-size: 10px;
}

.copies-section details[open] summary::after,
.trade-section details[open] summary::after {
    content: "▲";
}

/* =========================================================
   LINE-BASED LISTS
   ========================================================= */

.copy-list,
.trade-list {
    padding: 0;
}

.copy-card {
    margin: 0;
    padding: 12px 16px;
    background: var(--social-bg);
    border: 0;
    margin-bottom: 0.3em;
    border-bottom: 1px solid var(--border);
    border-radius: 0;
    transition:
        background 0.15s ease,
        border-color 0.15s ease;
}

.copy-card:last-child {
    border-bottom: 0;
}

.copy-card.own-copy {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    align-items: center;
    gap: 14px;
}

.owned-copy-list .copy-card.own-copy {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.physical-media-trigger {
    min-height: 0;
    padding: 0;
    background: transparent;
    border: 0;
    line-height: 0;
}

.physical-media-trigger:hover {
    background: transparent;
    box-shadow: none;
    filter: brightness(1.08);
}

.physical-media-trigger:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 4px;
}

.owned-copy-details {
    min-width: 0;
}

.copy-card:hover {
    background: var(--bg-secondary);
}

.copy-header,
.seller-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
}

.copy-header h3 {
    margin: 0 0 3px;
    color: var(--text-h);
    font-size: 15px;
}

.copy-edition,
.seller-header > span {
    color: var(--text-muted);
    font-size: 13px;
}

.condition {
    flex-shrink: 0;
    padding: 4px 8px;
    color: var(--text-secondary);
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 5px;
    font-size: 11px;
    font-weight: 600;
}

.copy-info {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 18px;
    margin-top: 4px;
}

.copy-info p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 13px;
}

.copy-info strong {
    color: var(--text);
}

.comic-volumes {
    margin: 0 0 6px;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 600;
}

.status-available {
    color: var(--success);
    font-weight: 700;
}

.media-actions {
    width: 100%;
}

.media-actions .add-copy-button {
    flex: 1;
}

.list-progress-actions {
    flex-direction: column;
}

.list-progress-actions button {
    width: 100%;
}

.copy-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 10px;
    padding-top: 0;
    border-top: 0;
}

.listing-status {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.listing-status span {
    padding: 4px 7px;
    color: var(--text-secondary);
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 5px;
    font-size: 11px;
    font-weight: 600;
}

/* =========================================================
   TRADE OFFERS
   ========================================================= */

.seller-copy {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px 16px;
    align-items: center;
}

.seller-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    margin: 0;
}

.seller-header strong {
    font-size: 14px;
}

.seller-offers,
.boxset-offer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 0;
}

.seller-offers span,
.boxset-offer {
    padding: 0;
    color: var(--text);
    background: transparent;
    border: 0;
    border-radius: 0;
    font-size: 13px;
}

.seller-offers span {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
}

.boxset-offer {
    grid-column: 1 / -1;
    padding-top: 10px;
    border-top: 1px solid var(--border);
}

.boxset-offer p,
.listing-note {
    margin: 0;
    color: var(--text-secondary);
    font-size: 13px;
}

.boxset-offer span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-right: 4px;
    color: var(--text);
    font-size: 13px;
}

/* =========================================================
   EMPTY STATE
   ========================================================= */

.empty {
    padding: 18px;
    color: var(--text-muted);
    background: var(--bg-secondary);
    border: 0;
    text-align: center;
}

/* =========================================================
   COLLECTION
   ========================================================= */

.collection-block {
    margin-top: 40px;
}

.collection-list-container {
    width: 100%;
}

.dialog-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: var(--code-bg);
    overflow-y: auto;
    overscroll-behavior: contain;
}

.detail-modal-content {
    width: min(760px, 100%);
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    color: var(--text);
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
}

.note-review-modal {
    width: min(520px, 100%);
    padding: 16px;
}

.detail-modal-header {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    background: var(--code-bg);
    border-bottom: 1px solid var(--border);
}

.detail-modal-header h2 {
    margin: 0;
    color: var(--text-h);
    font-size: 18px;
}

.modal-close {
    flex: 0 0 36px;
    width: 36px;
    min-height: 36px;
    padding: 0;
    font-size: 22px;
}

.note-review-modal .review-toggle {
    margin-top: 12px;
}

.note-review-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
}

.note-review-actions .modal-secondary {
    color: var(--text-h);
    background: var(--bg-secondary);
    border-color: var(--border);
}

.collection-media-row {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr) auto auto auto;
    grid-template-areas: "poster title year owned status";
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    color: var(--text-h);
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-small);
    text-decoration: none;
}

.collection-media-row + .collection-media-row {
    margin-top: 6px;
}

.collection-media-row:hover,
.collection-media-row.selected {
    background: var(--accent-bg);
    border-color: var(--accent-border);
}

.collection-media-row:hover {
    text-decoration: none;
}

.collection-media-row img {
    grid-area: poster;
    display: block;
    width: 48px;
    aspect-ratio: 2 / 3;
    object-fit: cover;
    border-radius: 3px;
}

.collection-row-title {
    grid-area: title;
    min-width: 0;
    font-weight: 600;
}

.collection-row-year {
    grid-area: year;
    color: var(--text-muted);
}

.collection-row-badge {
    grid-area: owned;
}

.collection-row-status {
    grid-area: status;
}

.collection-row-badge,
.collection-row-status {
    padding: 4px 7px;
    color: var(--text-secondary);
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: 11px;
    white-space: nowrap;
}

/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 700px) {
    .media-detail {
        padding-bottom: 30px;
    }

    .media-header {
        grid-template-columns: 84px minmax(0, 1fr);
        gap: 12px;
    }

    .collection-nav-arrow {
        height: 30px;
    }

    .poster {
        width: 84px;
    }

    .summary h1 {
        font-size: 19px;
    }

    .media-meta {
        margin-bottom: 6px;
        font-size: 12px;
    }

    .description {
        font-size: 13px;
        line-height: 1.5;
    }

    .add-copy-button {
        width: 100%;
        padding: 8px 10px;
    }

    .media-actions .episode-tracker {
        flex-wrap: wrap;
        justify-content: center;
    }

    .collection-actions {
        gap: 8px;
    }

    .collection-actions button {
        flex: 1 1 130px;
    }

    .collection-media-row {
        grid-template-columns: 42px minmax(0, 1fr) auto;
        grid-template-areas:
            "poster title year"
            "poster owned status";
        gap: 7px;
    }

    .collection-media-row img {
        width: 42px;
    }

    .collection-row-badge,
    .collection-row-status {
        justify-self: start;
    }

    .detail-section {
        margin-top: 26px;
    }

    .copy-card {
        padding: 12px;
    }

    .owned-copy-list .copy-card {
        flex-basis: min(45%, 150px);
        align-items: center;
        gap: 12px;
    }

    .copy-header,
    .seller-copy {
        grid-template-columns: 1fr;
    }

    .copy-header h3 {
        font-size: 15px;
    }

    .copy-footer {
        align-items: stretch;
        flex-direction: column;
    }

    .edit-button,
    .seller-offers button,
    .boxset-offer button {
        width: 100%;
    }

    .seller-offers,
    .seller-offers span,
    .boxset-offer {
        align-items: stretch;
        flex-direction: column;
    }

    .dialog-overlay {
        align-items: flex-start;
        padding: 10px;
    }

    .edit-copy {
        width: 100%;
        padding: 18px;
    }
}
</style>
