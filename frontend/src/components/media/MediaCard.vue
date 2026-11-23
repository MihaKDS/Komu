<template>
<div class="media-card-shell">
    <component
        :is="props.readOnly ? 'div' : RouterLink"
        v-bind="props.readOnly ? {} : { to: mediaLink }"
        class="media-card-link"
    >
        <article :class="['media-card', { 'is-collection': media.isCollectionGroup }]">
        <div class="poster-wrap">
            <div v-if="media.isCollectionGroup" class="collection-visual-wrap">
                <PhysicalMediaVisual
                    variant="collection"
                    type="BOXSET"
                    format="BLURAY"
                    category="MOVIE"
                    :cover-image="posterSource(media.poster, media.category)"
                    :cover-alt="media.title"
                />
            </div>
            <img v-else :src="posterSource(props.media.poster, props.category)" :alt="props.media.title" class="media-poster">
            <span v-if="media.isCollectionGroup" class="collection-count">
                {{ collectionTitleCount }} {{ collectionTerm }}
            </span>
            <div v-if="coverStatuses.length" class="cover-statuses">
                <button v-for="status in coverStatuses" :key="status" type="button" class="cover-status" :class="{ 'is-action': status === 'For trade' && media.tradeId }" @click.stop.prevent="status === 'For trade' && media.tradeId ? openTrade(media.tradeId) : undefined">{{ status }}</button>
            </div>
        </div>

        <div class="content">

            <div class="card-meta">

                <h3>
                    {{ media.title }}
                </h3>

            </div>


            <p class="year">
                {{ releaseYearLabel }}
            </p>


        </div>

        </article>
    </component>

    <ListMenu
        v-if="!media.isCollectionGroup && !props.readOnly"
        class="card-list-menu"
        :media-id="media.id"
        :category="media.category"
    />

    <button
        v-else-if="media.isCollectionGroup"
        type="button"
        class="collection-open-trigger"
        :aria-label="`Open ${media.title} contents`"
        @click.stop.prevent="showCollectionContents = true"
    >
        <span v-if="collectionStatus" class="collection-status">
            {{ listStatusLabel(collectionStatus, media.category) }}
        </span>
        <span aria-hidden="true">›</span>
    </button>

    <CollectionContentsModal
        v-if="media.isCollectionGroup"
        v-model="showCollectionContents"
        :collection-name="media.title"
        :media-items="media.collectionMedias ?? []"
        :read-only="props.readOnly"
    />
</div>
</template>

<script setup>
import { RouterLink, useRouter } from "vue-router";
import { computed, ref, watch } from "vue";
import {
    collectComicVolumeValuesFromCopies,
    formatComicVolumes,
} from "../../utils/comicVolumes.js";
import ListMenu from "../ui/ListMenu.vue";
import CollectionContentsModal from "../ui/CollectionContentsModal.vue";
import PhysicalMediaVisual from "../ui/PhysicalMediaVisual.vue";
import { useAuth } from "../../composables/useAuth.js";
import { listStatusLabel } from "../../services/listMenuState.js";
import { loadMyLists, mediaListEntries } from "../../services/listsService.js";

const router = useRouter();
const showCollectionContents = ref(false);
const { user } = useAuth();

const props = defineProps({
    media: {
        type: Object,
        required: true,
    },

    mode: {
        type: String,
        default: null,
    },

    category: {
        type: String,
        default: null,
    },

    fromContext: {
        type: String,
        default: null,
    },
    readOnly: {
        type: Boolean,
        default: false,
    },

});

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
const mediaLink = computed(() => {
    let breadcrumbContext = props.fromContext;

    // Search uses category as breadcrumb context
    if (props.mode === 'search') {
        breadcrumbContext = props.category;
    }

    return {
        name: 'media',
        params: {
            id: props.media.id,
        },
        query: {
            from: breadcrumbContext || 'search',
        },
    };
});

function openTrade(tradeId) {
    router.push({
        name: "trade-detail",
        params: {
            id: tradeId,
        },
        query: {
            from: "collection",
        },
    });
}

const comicVolumesSummary = computed(() => {
    if (
        props.media.category !== "COMIC" ||
        props.media.isCollectionGroup ||
        !Array.isArray(props.media.copies)
    ) {
        return "";
    }

    return formatComicVolumes(
        collectComicVolumeValuesFromCopies(
            props.media.copies,
        ),
    );
});

const copyCount = computed(() => {
    if (Array.isArray(props.media.copies)) {
        return props.media.copies.filter((copy) => copy.isArchived !== true).length;
    }

    return [
        props.media.dvd,
        props.media.bluray,
        props.media.fourk,
        props.media.softcover,
        props.media.hardcover,
        props.media.cd,
        props.media.vinyl,
    ].reduce((total, count) => total + (Number(count) || 0), 0);
});

const collectionTerm = computed(() => {
    const terms = { MOVIE: "movies", TV_SHOW: "seasons", MUSIC: "albums", BOOK: "books", COMIC: "comics" };
    const term = terms[props.media.category] ?? "titles";
    return `${collectionTitleCount.value === 1 ? term.replace(/s$/, "") : term}`;
});

const collectionTitleCount = computed(() =>
    Array.isArray(props.media.collectionMedias)
        ? props.media.collectionMedias.length
        : props.media.collectionSize,
);

const releaseYearLabel = computed(() => {
    if (!props.media.isCollectionGroup || !Array.isArray(props.media.collectionMedias)) {
        return props.media.releaseYear;
    }

    const years = props.media.collectionMedias
        .map((item) => {
            const value = item.releaseYear;
            if (value == null || (typeof value === "string" && value.trim() === "")) {
                return null;
            }

            const year = Number(value);
            return Number.isInteger(year) && year >= 1000 && year <= 9999 ? year : null;
        })
        .filter((year) => year !== null);

    if (years.length === 0) {
        return props.media.releaseYear;
    }

    const firstYear = years[0];
    const lastYear = years[years.length - 1];
    return firstYear === lastYear ? String(firstYear) : `${firstYear} - ${lastYear}`;
});

const owned = computed(() => {
    return Boolean(props.media.inCollection);
});

const coverStatuses = computed(() => [
    ...(owned.value ? ["Owned"] : []),
    ...((props.media.hasSell || props.media.collectionMedias?.some((item) => item.hasSell || item.copies?.some((copy) => copy.isArchived !== true && (copy.canSell || copy.boxSet?.canSell)))) ? ["For sale"] : []),
    ...((props.media.activeTrade || props.media.tradeStatusLabel || props.media.collectionMedias?.some((item) => item.activeTrade || item.tradeStatusLabel)) ? ["For trade"] : []),
]);

const collectionStatus = computed(() => {
    if (!user.value || props.readOnly || !Array.isArray(props.media.collectionMedias) || props.media.collectionMedias.length === 0) {
        return null;
    }

    const statuses = props.media.collectionMedias.map((child) =>
        mediaListEntries.value.find((entry) => entry.mediaId === child.id)?.status,
    );

    return statuses[0] && statuses.every((status) => status === statuses[0])
        ? statuses[0]
        : null;
});

watch(
    () => user.value?.id,
    (userId) => {
        if (userId) {
        loadMyLists().catch(() => {});
        }
    },
    { immediate: true },
);
</script>

<style scoped>
.media-card-link {
    display: block;

    color: inherit;
    text-decoration: none;
}

.media-card-shell {
    position: relative;
    min-width: 0;
}

.card-list-menu {
    position: absolute;
    top: 7px;
    right: 7px;
}

.collection-open-trigger {
    position: absolute;
    top: 7px;
    right: 7px;
    z-index: 3;
    display: grid;
    place-items: center;
    min-width: 38px;
    height: 38px;
    padding: 0 9px;
    color: #fff;
    background: rgba(20, 24, 32, 0.72);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-small);
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
}

.collection-open-trigger:hover,
.collection-open-trigger:focus-visible {
    background: rgba(20, 24, 32, 0.94);
}

.collection-open-trigger:has(.collection-status) > span:not(.collection-status) {
    display: none;
}

.media-card {
    width: 100%;
    overflow: hidden;

    background: var(--bg-card);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);

    transition: border-color 0.15s ease, background 0.15s ease;
    text-align: left;
}

.poster-wrap {
    position: relative;
    isolation: isolate;
}

.media-card.is-collection .poster-wrap::before,
.media-card.is-collection .poster-wrap::after {
    position: absolute;
    z-index: -1;
    inset: 5px -4px 5px 4px;
    content: "";
    border: 1px solid #3a465b;
    border-radius: 3px;
    background: #222b3b;
}

.media-card.is-collection .poster-wrap::after {
    inset: 9px -7px 9px 7px;
    background: #1e2737;
}

.media-card:hover {
    color: inherit;

    border-color: var(--border-light);

    background: var(--bg-hover);
}

.media-card.is-collection {
    background: #1b2130;
    border-color: #2c3a52;
}

.media-card.is-collection:hover {
    background: #212940;
    border-color: var(--accent-border);
}


/* Poster */

.media-poster {
    display: block;

    width: 100%;

    aspect-ratio: 3 / 4;

    object-fit: cover;

    background: var(--bg-secondary);
}

.collection-visual-wrap {
    position: relative;
    display: grid;
    place-items: center;
    width: 100%;
    aspect-ratio: 3 / 4;
    background: var(--bg-secondary);
}

.collection-visual-wrap :deep(.physical-media-visual) {
    width: 76%;
    height: 86%;
}

.collection-count,
.cover-status {
    color: #fff;
    background: rgba(20, 24, 32, 0.78);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 999px;
    font-size: 10px;
    font-weight: 600;
    line-height: 1;
}

.collection-count {
    position: absolute;
    top: 8px;
    left: 8px;
    padding: 5px 7px;
}

.cover-statuses {
    position: absolute;
    right: 7px;
    bottom: 7px;
    left: 7px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.cover-status {
    padding: 4px 6px;
    font-family: inherit;
    cursor: default;
}

.cover-status.is-action {
    cursor: pointer;
}

.cover-status.is-action:hover {
    background: rgba(20, 24, 32, 0.96);
}


/* Content */

.content {
    padding: 10px;
    min-height: 72px;
}

.card-meta {
    min-width: 0;
}

.card-meta h3 {
    margin: 0;

    color: var(--text-h);

    font-size: 16px;
    line-height: 1.3;
    font-weight: 600;

    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    min-height: 2.6em;
}

.badges {
    display: flex;
    flex-wrap: wrap;

    gap: 5px;

    margin-top: 7px;
}

.collection-badge,
.sell-badge,
.rent-badge {
    display: inline-flex;

    padding: 3px 6px;

    border-radius: 999px;

    font-size: 10px;
    font-weight: 600;

    white-space: nowrap;
}

.collection-badge {
    color: var(--text-secondary);
    background: var(--accent-bg);
    border: 1px solid var(--accent-border);
}

.sell-badge {
    color: var(--text-h);
    background: var(--bg-hover);
    border: 1px solid var(--border-light);
}

.rent-badge {
    color: var(--text-h);
    background: var(--bg-hover);
    border: 1px solid var(--border-light);
}


/* Metadata */

.year {
    margin: 2px 0 0;

    color: var(--text-muted);

    font-size: 13px;
    min-height: 1em;
}

.collection-summary,
.copy-count {
    margin: 6px 0 0;

    color: var(--text-secondary);

    font-size: 12px;
}

.comic-volumes {
    margin: 6px 0 0;

    color: var(--text-secondary);

    font-size: 12px;
    font-weight: 600;
}


/* Formats */

.media-formats {
    display: grid;

    grid-template-columns:
        repeat(3, minmax(0, 1fr));

    gap: 5px;

    margin-top: 10px;
}

.format {
    display: flex;
    align-items: center;
    justify-content: space-between;

    min-width: 0;

    padding: 4px 6px;

    color: var(--text-muted);
    background: var(--bg-secondary);

    border: 1px solid var(--border);
    border-radius: 4px;

    font-size: 10px;
}

.format strong {
    color: var(--text-h);

    font-size: 11px;
}


/* Trade */

.trade-status {
    margin-top: 7px;
}

.trade-status-link,
.trade-status span {
    display: inline-flex;

    padding: 4px 7px;

    color: var(--text-secondary);
    background: var(--bg-secondary);

    border: 1px solid var(--border);
    border-radius: 4px;

    font-size: 11px;
}

.trade-status-link {
    cursor: pointer;
}

.trade-status-link:hover {
    color: var(--text-h);
    background: var(--bg-hover);
}
@media (max-width: 600px) {

    .content {
        padding: 9px;
    }

    .media-poster {
        /*
         * Don't let the poster become enormous
         * on small screens.
         */
        aspect-ratio: 2 / 3;
    }

    .collection-visual-wrap {
        aspect-ratio: 2 / 3;
    }

    .card-meta h3 {
        font-size: 14px;
    }

    .badges {
        gap: 4px;
        margin-top: 5px;
    }

    .collection-badge,
    .sell-badge,
    .rent-badge {
        padding: 2px 5px;
        font-size: 9px;
    }

    .year {
        font-size: 11px;
    }

    .collection-summary,
    .copy-count {
        font-size: 11px;
    }

    .media-formats {
        gap: 3px;
        margin-top: 7px;
    }

    .format {
        padding: 3px 4px;
        font-size: 9px;
    }

    .format strong {
        font-size: 10px;
    }
}
</style>
