<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useRoute } from "vue-router";

import { useAuth } from "../composables/useAuth"

const {
  user,
} = useAuth()

import Breadcrumbs from "../components/layout/Breadcrumbs.vue";
import AddCopyDialog from "../components/ui/AddCopyDialog.vue";

import { getMedia } from "../api/mediaAPI.js";
import EditCopy from "../components/ui/EditCopy.vue";
import MediaList from "../components/media/MediaList.vue";
import MediaGrid from "../components/media/MediaGrid.vue";

const route = useRoute();
const mediaDetails = ref(null);
const showAddCopy = ref(false);
const showEditCopy = ref(false);
const idEditCopy = ref(null);

// Get the current context from where user came
const currentContext = computed(() => route.query.from || 'search');

async function loadMedia() {
    mediaDetails.value = await getMedia(route.params.id);
    console.log(mediaDetails.value)
}

function editCopy(id) {
    idEditCopy.value = id;
    showEditCopy.value = true;
}

function posterSource(poster) {
    return poster?.startsWith("http") ? poster : `/posters/${poster}`;
}

onMounted(loadMedia);
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
    };
    return Boolean(map[format]);
}

const filteredCollectionMedias = computed(() => {
    return sortedCollectionMedias.value.filter((m) => mediaHasFormat(m, collectionFormat.value));
});
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
                :src="posterSource(mediaDetails.media.poster)"
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

            <button
                v-if="user"
                type="button"
                class="add-copy-button"
                @click="showAddCopy = true"
            >
                Add to collection
            </button>

        </div>

    </section>


    <!-- =====================================================
         YOUR COPIES
         ===================================================== -->

    <section
        v-if="user"
        class="detail-section"
    >

        <div class="section-header">
            <h2>Your copies</h2>

            <span class="section-count">
                {{ mediaDetails.myCopies.length }}
            </span>
        </div>


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
                        {{ mediaDetails.media.title }}: {{ copy.title }}
                    </h3>

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
                                from: 'collection'
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
                                from: 'collection'
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


                <button
                    type="button"
                    class="secondary-button"
                    @click="
                        showEditCopy = true;
                        idEditCopy = copy.id
                    "
                >
                    Edit
                </button>

            </div>

        </div>

    </section>

    <!-- =====================================================
         TRADE OFFERS
         ===================================================== -->

    <section class="detail-section trade-section">

        <details open>

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
                        v-if="copy.listingNote"
                        class="listing-note"
                    >
                        {{ copy.listingNote }}
                    </p>


                    <div class="seller-offers">

                        <span v-if="copy.canSell">
                            💰 For sale:
                            <strong>
                                {{ copy.sellPrice }} €
                            </strong>
                        </span>

                        <span v-if="copy.canRent">
                            Deposit:
                            <strong>
                                {{ copy.deposit }} €
                            </strong>
                        </span>

                    </div>


                    <div
                        v-if="copy.boxSet &&
                            (copy.boxSet.canSell ||
                             copy.boxSet.canRent)"
                        class="boxset-offer"
                    >

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
         COLLECTION
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
        @close="showAddCopy = false"
        @saved="loadMedia"
    />
</div>

<div
    v-if="showEditCopy"
    class="dialog-overlay"
    @click.self="showEditCopy = false"
>
    <EditCopy
        :media="mediaDetails.media"
        :copy="
            mediaDetails.myCopies.find(
                copy => copy.id === idEditCopy
            )
        "
        @close="showEditCopy = false"
        @saved="loadMedia"
    />
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
   MEDIA HEADER
   ========================================================= */

.media-header {
    display: grid;

    grid-template-columns:
        220px minmax(0, 1fr);

    gap: 28px;

    margin: 24px 0 40px;
}

.poster {
    width: 220px;
}

.poster img {
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

.add-copy-button {
    margin-top: auto;
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


/* =========================================================
   COPY CARDS
   ========================================================= */

.copy-card {
    margin-bottom: 12px;

    padding: 16px;

    background: var(--social-bg);

    border: 1px solid var(--border);
    border-radius: var(--radius);

    transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
}

.copy-card:hover {
    border-color: var(--border-light);
    box-shadow: var(--shadow-small);
}

.copy-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    gap: 12px;

    margin-bottom: 10px;
}

.copy-header h3 {
    margin: 0 0 4px;

    color: var(--text-h);

    font-size: 17px;
}

.copy-edition {
    color: var(--text-muted);

    font-size: 13px;
}

.condition {
    flex-shrink: 0;

    padding: 4px 7px;

    color: var(--text-secondary);
    background: var(--bg-secondary);

    border: 1px solid var(--border);

    border-radius: 5px;

    font-size: 11px;
}

.copy-info p {
    margin: 6px 0;

    color: var(--text-secondary);

    font-size: 13px;
}

.copy-info strong {
    color: var(--text);
}

.copy-info a {
    color: var(--accent);
}

.status-available {
    color: var(--success);
}


.copy-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 12px;

    margin-top: 14px;

    padding-top: 12px;

    border-top: 1px solid var(--border);
}

.listing-status {
    display: flex;
    flex-wrap: wrap;

    gap: 7px;
}

.listing-status span {
    padding: 4px 7px;

    color: var(--text-secondary);
    background: var(--bg-secondary);

    border: 1px solid var(--border);

    border-radius: 5px;

    font-size: 11px;
}


/* =========================================================
   TRADE OFFERS
   ========================================================= */

.trade-section details {
    background: var(--code-bg);

    border: 1px solid var(--border);
    border-radius: var(--radius);
}

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
}

.trade-section summary::-webkit-details-marker {
    display: none;
}

.trade-section summary::after {
    content: "▼";

    margin-left: auto;

    color: var(--text-muted);

    font-size: 10px;
}

.trade-section details[open] summary::after {
    content: "▲";
}

.trade-list {
    padding: 0 12px 12px;
}

.seller-copy {
    background: var(--bg-card);
}

.seller-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 10px;
}

.seller-header strong {
    font-size: 15px;
}

.seller-header > span {
    color: var(--text-muted);

    font-size: 12px;
}

.listing-note {
    margin: 8px 0;

    color: var(--text-secondary);

    font-size: 13px;
}

.seller-offers {
    display: flex;
    flex-wrap: wrap;

    gap: 8px;

    margin-top: 10px;
}

.seller-offers span,
.boxset-offer span {
    padding: 5px 8px;

    color: var(--text);

    background: var(--bg-secondary);

    border: 1px solid var(--border);

    border-radius: 5px;

    font-size: 12px;
}

.boxset-offer {
    margin-top: 12px;
    padding-top: 12px;

    border-top: 1px solid var(--border);
}

.boxset-offer p {
    margin-bottom: 8px;

    color: var(--text-secondary);

    font-size: 13px;
}

.boxset-offer span {
    display: inline-block;

    margin-right: 6px;
}


/* =========================================================
   EMPTY STATE
   ========================================================= */

.empty {
    padding: 20px;

    color: var(--text-muted);

    background: var(--bg-secondary);

    border: 1px dashed var(--border);

    border-radius: var(--radius);

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
}

/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 700px) {

    .media-detail {
        padding-bottom: 30px;
    }

    .media-header {
        grid-template-columns:
            130px minmax(0, 1fr);

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
        font-size: 13px;
        line-height: 1.5;

        margin-bottom: 14px;
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

    .copy-header h3 {
        font-size: 15px;
    }

    .copy-footer {
        align-items: stretch;
        flex-direction: column;
    }

    .copy-footer .secondary-button {
        width: 100%;
    }

    .seller-offers {
        flex-direction: column;
    }

    .seller-offers span {
        width: 100%;
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
