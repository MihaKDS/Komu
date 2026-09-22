<template>
<RouterLink
    :to="mediaLink"
    class="media-card-link"
>
    <article
        :class="['media-card', { 'is-collection': media.isCollectionGroup }]"
    >

        <img
            :src="posterSource(props.media.poster, props.category)"
            :alt="props.media.title"
            class="media-poster"
        >

        <div class="content">

            <div class="card-meta">

                <h3>
                    {{ media.title }}
                </h3>

                <div class="badges">
                    <span
                        v-if="media.inCollection"
                        class="collection-badge"
                    >
                        In collection
                    </span>

                    <span
                        v-if="media.hasSell"
                        class="sell-badge"
                    >
                        Selling
                    </span>

                    <span
                        v-if="media.hasRent"
                        class="rent-badge"
                    >
                        Renting
                    </span>
                </div>

            </div>


            <p class="year">
                {{
                    media.isCollectionGroup
                        ? "Collection"
                        : media.releaseYear
                }}
            </p>


            <p
                v-if="media.isCollectionGroup"
                class="collection-summary"
            >
                {{ media.collectionSize }}
                {{ media.collectionSize === 1 ? "title" : "titles" }}
            </p>


            <p v-if="media.isCollectionGroup" class="copy-count">
                {{ media.isCollectionGroup ? media.collectionCopies : copyCount }}
                {{ (media.isCollectionGroup ? media.collectionCopies : copyCount) === 1 ? "physical copy" : "physical copies" }}
            </p>

            <p
                v-if="comicVolumesSummary"
                class="comic-volumes"
            >
                {{ comicVolumesSummary }}
            </p>


            <div
                v-if="media.tradeStatusLabel"
                class="trade-status"
            >
                <button
                    v-if="media.tradeId"
                    type="button"
                    class="trade-status-link"
                    @click.stop.prevent="openTrade(media.tradeId)"
                >
                    {{ media.tradeStatusLabel }}
                </button>

                <span v-else>
                    {{ media.tradeStatusLabel }}
                </span>
            </div>


            <div
                v-if="!media.isCollectionGroup && (media.category === 'MOVIE' || media.category === 'TV_SHOW' || media.category === 'MUSIC' || media.category === 'BOOK' || media.category === 'COMIC')"
                class="media-formats"
            >
                <div v-if="media.category === 'MOVIE' || media.category === 'TV_SHOW'" class="format">
                    <span>DVD</span>
                    <strong>{{ media.dvd ?? 0 }}</strong>
                </div>

                <div v-if="media.category === 'MOVIE' || media.category === 'TV_SHOW'" class="format">
                    <span>BR</span>
                    <strong>{{ media.bluray ?? 0 }}</strong>
                </div>

                <div v-if="media.category === 'MOVIE' || media.category === 'TV_SHOW'" class="format">
                    <span>UHD</span>
                    <strong>{{ media.fourk ?? 0 }}</strong>
                </div>

                <div v-if="media.category === 'MUSIC'" class="format">
                    <span>CD</span>
                    <strong>{{ media.cd ?? 0 }}</strong>
                </div>

                <div v-if="media.category === 'MUSIC'" class="format">
                    <span>VINYL</span>
                    <strong>{{ media.vinyl ?? 0 }}</strong>
                </div>

                <div v-if="media.category === 'BOOK' || media.category === 'COMIC'" class="format">
                    <span>SOFT</span>
                    <strong>{{ media.softcover ?? 0 }}</strong>
                </div>

                <div v-if="media.category === 'BOOK' || media.category === 'COMIC'" class="format">
                    <span>HARD</span>
                    <strong>{{ media.hardcover ?? 0 }}</strong>
                </div>
            </div>

        </div>

    </article>
</RouterLink>
</template>

<script setup>
import { useRouter } from "vue-router";
import { computed } from "vue";
import {
    collectComicVolumeValuesFromCopies,
    formatComicVolumes,
} from "../../utils/comicVolumes.js";

const router = useRouter();

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
</script>

<style scoped>
.media-card-link {
    display: block;

    color: inherit;
    text-decoration: none;
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

    aspect-ratio: 5 / 6;

    object-fit: contain;

    background: var(--bg-secondary);
}


/* Content */

.content {
    padding: 10px;
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
    margin: 6px 0 0;

    color: var(--text-muted);

    font-size: 13px;
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
