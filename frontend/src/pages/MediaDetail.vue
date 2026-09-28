<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useAuth } from "../composables/useAuth"

const {
  user,
} = useAuth()

import Breadcrumbs from "../components/layout/Breadcrumbs.vue";
import AddCopyDialog from "../components/ui/AddCopyDialog.vue";
import { formatComicVolumesForCopy } from "../utils/comicVolumes.js";

import { getMedia } from "../api/mediaAPI.js";
import EditCopy from "../components/ui/EditCopy.vue";
import MediaList from "../components/media/MediaList.vue";
import MediaGrid from "../components/media/MediaGrid.vue";
import ListMenu from "../components/ui/ListMenu.vue";
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
const showEditCopy = ref(false);
const idEditCopy = ref(null);
const progressDraft = ref("0");
const noteDraft = ref("");
const listProgressError = ref("");
const savingListProgress = ref(false);

// Get the current context from where user came
const currentContext = computed(() => route.query.from || 'search');

async function loadMedia() {
    mediaDetails.value = await getMedia(route.params.id);
    console.log("Media details loaded:", mediaDetails.value);
}

function editCopy(id) {
    idEditCopy.value = id;
    showEditCopy.value = true;
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

onMounted(loadMedia);
watch(
    () => user.value?.id,
    (userId) => {
        if (!userId) {
            resetMyLists();
            return;
        }

        loadMyLists().catch((error) => {
            listProgressError.value =
                error.message || "Unable to load your list status.";
        });
    },
    { immediate: true },
);
watch(
    () => route.params.id,
    loadMedia
);

watch(mediaDetails, (details) => {
    if (details) {
        document.title = `Komu - ${details.media.title}`;
    }
});

const sortedCollectionMedias = computed(() => {
    if (!mediaDetails.value || !mediaDetails.value.collection || !Array.isArray(mediaDetails.value.collection.medias)) return [];
    return [...mediaDetails.value.collection.medias].sort((a, b) => (a.collectionPosition ?? 0) - (b.collectionPosition ?? 0));
});

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

const filteredCollectionMedias = computed(() => {
    return sortedCollectionMedias.value.filter((m) => mediaHasFormat(m, collectionFormat.value));
});

function comicVolumesLabel(copy) {
    return formatComicVolumesForCopy(copy);
}

const currentListEntry = computed(() =>
    mediaListEntries.value.find(
        (entry) => entry.mediaId === Number(route.params.id),
    ) ?? null,
);

const progressType = computed(() => {
    const category = mediaDetails.value?.media.category;
    if (category === "TV_SHOW") return "Episode";
    if (category === "BOOK" || category === "COMIC") return "Chapter";
    return null;
});

const listStatusLabel = computed(() => {
    const status = currentListEntry.value?.status;
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
}, { immediate: true });

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
    if (!currentListEntry.value) return;
    savingListProgress.value = true;
    listProgressError.value = "";
    try {
        await updateMediaList(Number(route.params.id), {
            status: currentListEntry.value.status,
            note: noteDraft.value.trim() || null,
        });
    } catch (error) {
        listProgressError.value =
            error.message || "Unable to save note.";
    } finally {
        savingListProgress.value = false;
    }
}

async function markListCompleted() {
    if (!currentListEntry.value) return;
    savingListProgress.value = true;
    listProgressError.value = "";
    try {
        await updateMediaList(Number(route.params.id), {
            status: "COMPLETED",
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

    <section class="media-header">

        <div
            v-if="mediaDetails.media.poster"
            class="poster"
        >
            <img
                :src="posterSource(mediaDetails.media.poster, mediaDetails.media.category)"
                :alt="mediaDetails.media.title"
            >
        </div>
        <div v-else>
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
                    {{ mediaDetails.media.category }}
                </span>
            </div>

            <p
                v-if="mediaDetails.media.description"
                class="description"
            >
                {{ mediaDetails.media.description }}
            </p>

            <div v-if="user" class="media-actions">
                <button
                    type="button"
                    class="add-copy-button"
                    @click="showAddCopy = true"
                >
                    Add to collection
                </button>
                <ListMenu
                    :media-id="mediaDetails.media.id"
                    :category="mediaDetails.media.category"
                />
            </div>

        </div>

    </section>


    <!-- =====================================================
         YOUR COPIES
         ===================================================== -->

<section
    v-if="currentListEntry && ['TO_WATCH', 'WATCHING'].includes(currentListEntry.status)"
    class="detail-section list-progress-section"
>
    <h2>{{ listStatusLabel }}</h2>

    <div v-if="progressType" class="progress-controls">
        <label :for="`media-progress-${mediaDetails.media.id}`">
            {{ progressType }}
        </label>
        <button
            type="button"
            class="progress-stepper"
            :disabled="savingListProgress || Number(progressDraft) <= 0"
            aria-label="Decrease progress"
            @click="changeProgress(-1)"
        >
            −
        </button>
        <input
            :id="`media-progress-${mediaDetails.media.id}`"
            v-model="progressDraft"
            type="number"
            min="0"
            step="1"
            :disabled="savingListProgress"
            @change="saveProgress()"
        >
        <button
            type="button"
            class="progress-stepper"
            :disabled="savingListProgress"
            aria-label="Increase progress"
            @click="changeProgress(1)"
        >
            +
        </button>
    </div>

    <label class="list-note">
        Note
        <textarea
            v-model="noteDraft"
            maxlength="500"
            rows="2"
            :disabled="savingListProgress"
            placeholder="Optional note"
        />
    </label>

    <div class="list-progress-actions">
        <button
            type="button"
            class="save-list-note"
            :disabled="savingListProgress"
            @click="saveListNote"
        >
            Save Note
        </button>
        <button
            v-if="currentListEntry.status === 'WATCHING'"
            type="button"
            class="complete-list-button"
            :disabled="savingListProgress"
            @click="markListCompleted"
        >
            Completed ✓
        </button>
    </div>
    <p v-if="listProgressError" class="list-progress-error">
        {{ listProgressError }}
    </p>
</section>

<section
    v-if="user"
    class="detail-section copies-section"
>
    <details>

        <summary>
            Your copies

            <span class="section-count">
                {{ mediaDetails.myCopies.length }}
            </span>
        </summary>


        <div class="copy-list">

            <div
                v-if="mediaDetails.myCopies.length === 0"
                class="empty"
            >
                You don't own this media yet.
            </div>


            <div
                v-for="copy in mediaDetails.myCopies"
                :key="copy.id"
                class="copy-card own-copy"
            >

                <div class="copy-header">

                    <div>
                        <h3 v-if="mediaDetails.media.category === 'COMIC'">
                            {{ mediaDetails.media.title }}
                        </h3>

                        <p
                            v-if="comicVolumesLabel(copy)"
                            class="comic-volumes"
                        >
                            {{ comicVolumesLabel(copy) }}
                        </p>

                        <span class="copy-edition">
                            {{ copy.edition }}

                            <span v-if="copy.includesBluRay">
                                · Includes Blu-ray
                            </span>
                        </span>
                    </div>

                    <span class="condition">
                        {{ copy.condition }}
                    </span>

                </div>


                <div class="copy-info">

                    <p v-if="copy.activeTrade">
                        <strong>Status:</strong>

                        <RouterLink
                            :to="{
                                name: 'trade-detail',
                                params: {
                                    id: copy.activeTrade.id
                                },
                                query: {
                                    from: currentContext
                                }
                            }"
                        >
                            {{
                                copy.activeTrade.status === 'RENTING'
                                    ? 'Renting'
                                    : 'Reserved'
                            }}
                        </RouterLink>
                    </p>

                    <p v-else>
                        <strong>Status:</strong>

                        <span class="status-available">
                            Available
                        </span>
                    </p>


                    <p v-if="copy.boxSet">
                        <strong>Box set:</strong>

                        <RouterLink
                            :to="{
                                name: 'boxset',
                                params: {
                                    id: copy.boxSet.id
                                },
                                query: {
                                    from: currentContext
                                }
                            }"
                        >
                            Box Set #{{ copy.boxSet.id }}
                        </RouterLink>
                    </p>


                    <p v-if="copy.listingNote">
                        {{ copy.listingNote }}
                    </p>

                </div>


                <div class="copy-footer">

                    <div class="listing-status">

                        <span v-if="copy.canSell">
                            💰 For sale
                        </span>

                        <span v-if="copy.canRent">
                            🎬 For rent
                        </span>

                        <template v-if="copy.boxSet">

                            <span v-if="copy.boxSet.canSell">
                                💰 Box set for sale
                            </span>

                            <span v-if="copy.boxSet.canRent">
                                🎬 Box set for rent
                            </span>

                        </template>

                    </div>


                    <RouterLink
                        :to="{
                            name: 'EditCopy',
                            params: {
                                id: copy.id
                            },
                            query: {
                                from: currentContext
                            }
                        }"
                        class="edit-button"
                    >
                        Edit
                    </RouterLink>

                </div>

            </div>

        </div>

    </details>
</section>
    <!-- =====================================================
         TRADE OFFERS
         ===================================================== -->

    <section class="detail-section trade-section">

        <details>

            <summary>
                Trade offers
                <span class="section-count">
                    {{ mediaDetails.otherOwnersCount }}
                </span>
            </summary>


            <div class="trade-list">

                <div
                    v-for="copy in mediaDetails.otherCopies"
                    :key="copy.id"
                    class="copy-card seller-copy"
                >

                    <div class="seller-header">

                        <strong>
                            <RouterLink
                                :to="{
                                    name: 'seller-listings',
                                    params: {
                                        username: copy.owner.username
                                    },
                                    query: {
                                        from: currentContext
                                    }
                                }"
                            >
                                {{ copy.owner.username }}
                            </RouterLink>
                        </strong>

                        <span>
                            {{ copy.edition }}
                        </span>
                    </div>

                    <p
                        v-if="comicVolumesLabel(copy)"
                        class="comic-volumes"
                    >
                        {{ comicVolumesLabel(copy) }}
                    </p>
                    

                    <div class="seller-offers">

                        <span v-if="copy.canSell">
                            <!-- Individual copy -->
                            <button
                                type="button"
                                @click="buyCopy(copy)"
                            >
                                Buy
                            </button>
                            <p
                                v-if="copy.listingNote"
                                class="listing-note"
                            >
                                {{ copy.listingNote }}
                            </p>
                            💰 For sale:
                            <strong>
                                {{ copy.sellPrice }} €
                            </strong>
                        </span>

                    </div>


                    <div
                        v-if="copy.boxSet &&
                            (copy.boxSet.canSell ||
                             copy.boxSet.canRent)"
                        class="boxset-offer"
                    >
                    <!-- Box set -->
                        <button
                            type="button"
                            @click="buyBoxSet(copy)"
                        >
                            Buy
                        </button>
                        <p>
                            Part of

                            <RouterLink
                                :to="{
                                    name: 'boxset',
                                    params: {
                                        id: copy.boxSet.id
                                    },
                                    query: {
                                        from: currentContext
                                    }
                                }"
                            >
                                Box Set #{{ copy.boxSet.id }}
                            </RouterLink>
                        </p>
                        <p
                            v-if="copy.boxSet.listingNote"
                            class="listing-note"
                        >
                            {{ copy.boxSet.listingNote }}
                        </p>
                        <span v-if="copy.boxSet.canSell">
                            💰 Box set for sale:
                            <strong>
                                {{ copy.boxSet.sellPrice }} €
                            </strong>
                        </span>

                        <span v-if="copy.boxSet.canRent">
                            Deposit:
                            <strong>
                                {{ copy.boxSet.deposit }} €
                            </strong>
                        </span>

                    </div>

                </div>


                <div
                    v-if="mediaDetails.otherCopies.length === 0"
                    class="empty"
                >
                    Nobody is currently selling or renting this title.
                </div>

            </div>

        </details>

    </section>

    <!-- =====================================================
         PART OF
         ===================================================== -->

    <section
        v-if="mediaDetails.collection"
        class="collection-block detail-section"
    >

        <div class="section-header">
            <h2>Part of collection</h2>
        </div>


        <div class="collection-list-container">

            <component
                :is="
                    collectionViewMode === 'grid'
                        ? MediaGrid
                        : MediaList
                "
                :mediaList="
                    filteredCollectionMedias.map(
                        m => ({
                            ...m,
                            inCollection: true
                        })
                    )
                "
                mode="collection"
                :compact="
                    collectionViewMode === 'list'
                "
                :currentId="
                    mediaDetails.media.id
                "
                :fromContext="currentContext"
                :category="mediaDetails.media.category"
            />

        </div>

    </section>


    <!-- Dialogs -->

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

<div
    v-if="showEditCopy"
    class="dialog-overlay"
    @click.self="showEditCopy = false"
>
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
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 28px;
    margin: 24px 0 40px;
}

.poster {
    width: 220px;
}

.poster img,
.media-header > div:not(.summary) img {
    display: block;
    width: 100%;
    aspect-ratio: 2 / 3;
    object-fit: cover;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius);
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
    font-size: clamp(26px, 4vw, 36px);
    line-height: 1.15;
}

.media-meta {
    display: flex;
    gap: 7px;
    margin-bottom: 18px;
    color: var(--text-muted);
    font-size: 14px;
}

.description {
    max-width: 700px;
    margin-bottom: 22px;
    color: var(--text);
    line-height: 1.6;
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
    align-items: center;
    gap: 8px;
    margin-top: auto;
}

.media-actions .add-copy-button {
    margin-top: 0;
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
    justify-content: space-between;
    gap: 8px;
    margin-top: 10px;
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
    background: var(--social-bg);
    overflow-y: auto;
    overscroll-behavior: contain;
}

/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 700px) {
    .media-detail {
        padding-bottom: 30px;
    }

    .media-header {
        grid-template-columns: 130px minmax(0, 1fr);
        gap: 16px;
        margin-top: 18px;
        margin-bottom: 28px;
    }

    .poster {
        width: 130px;
    }

    .summary h1 {
        font-size: 23px;
    }

    .media-meta {
        margin-bottom: 10px;
        font-size: 12px;
    }

    .description {
        margin-bottom: 14px;
        font-size: 13px;
        line-height: 1.5;
    }

    .add-copy-button {
        width: 100%;
        padding: 8px 10px;
    }

    .detail-section {
        margin-top: 26px;
    }

    .copy-card {
        padding: 12px;
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