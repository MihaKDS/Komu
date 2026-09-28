<template>
  <section class="media-list">
    <div
      v-for="media in mediaList"
      :key="media.id"
      :class="['media-list-item', { 'has-collection-control': media.isCollectionGroup }]"
    >
    <component
      :is="props.readOnly ? 'div' : RouterLink"
      v-bind="props.readOnly ? {} : { to: mediaLink(media) }"
      :class="['media-row', { compact: props.compact, current: media.id === props.currentId, selected: isSelected(media.id) }]"
      :fromContext="props.fromContext"
    >
      <img 
        v-if="media.poster"
        class="poster"
        :src="posterSource(media.poster, props.category)"
        :alt="media.title"
      />
      <img 
        v-else
        class="poster"
        :src="posterSource(media.poster, props.category)"
        :alt="media.title"
      />

      <div class="row-content">

          <div class="header-row">

              <label
                  v-if="props.selectable"
                  class="select-toggle"
                  @click.stop
              >
                  <input
                      type="checkbox"
                      :checked="isSelected(media.id)"
                      @change.stop.prevent="toggleSelect(media)"
                  />
              </label>

              <h3>
                  {{ media.title }}
              </h3>
              <span> {{ media.releaseYear }}</span>

              <span
                  v-if="media.inCollection && !props.compact"
                  class="badge collection-badge"
              >
                  In collection
              </span>

          </div>


          <p
              v-if="!props.compact"
              class="meta"
          >
              <template v-if="media.isCollectionGroup">
                  Collection
              </template>

              <template v-if="!media.isCollectionGroup">
                  {{ media.releaseYear }} • {{ media.category }}
              </template>
          </p>


          <p
              v-if="!props.compact && media.isCollectionGroup"
              class="collection-summary"
          >
              {{ media.collectionSize }}
              {{ media.collectionSize === 1 ? 'title' : 'titles' }}
              <span v-if="media.collectionCopies != null">· {{ media.collectionCopies }} copies</span>
          </p>

          <p
              v-else-if="!props.compact && props.mode === 'collection'"
              class="collection-summary"
          >
              {{ mediaCopyCount(media) }}
              {{ mediaCopyCount(media) === 1 ? 'physical copy' : 'physical copies' }}
          </p>

          <p
              v-if="
                  !props.compact &&
                  comicVolumesSummary(media)
              "
              class="comic-volumes"
          >
              {{ comicVolumesSummary(media) }}
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
              v-if="
                  !props.compact &&
                  !media.isCollectionGroup
              "
              class="format-row"
          >

              <span
                  v-if="media.category === 'MOVIE' || media.category === 'TV_SHOW'"
                  class="format"
              >
                  DVD
                  <strong>{{ media.dvd ?? 0 }}</strong>
              </span>

              <span
                  v-if="media.category === 'MOVIE' || media.category === 'TV_SHOW'"
                  class="format"
              >
                  Blu-ray
                  <strong>{{ media.bluray ?? 0 }}</strong>
              </span>

              <span
                  v-if="media.category === 'MOVIE' || media.category === 'TV_SHOW'"
                  class="format"
              >
                  UHD
                  <strong>{{ media.fourk ?? 0 }}</strong>
              </span>

              <span
                  v-if="media.category === 'MUSIC'"
                  class="format"
              >
                  CD
                  <strong>{{ media.cd ?? 0 }}</strong>
              </span>

              <span
                  v-if="media.category === 'MUSIC'"
                  class="format"
              >
                  Vinyl
                  <strong>{{ media.vinyl ?? 0 }}</strong>
              </span>

              <span
                  v-if="media.category === 'BOOK' || media.category === 'COMIC'"
                  class="format"
              >
                  Softcover
                  <strong>{{ media.softcover ?? 0 }}</strong>
              </span>

              <span
                  v-if="media.category === 'BOOK' || media.category === 'COMIC'"
                  class="format"
              >
                  Hardcover
                  <strong>{{ media.hardcover ?? 0 }}</strong>
              </span>

          </div>

      </div>
    </component>

    <button
      v-if="media.isCollectionGroup"
      type="button"
      class="collection-open-trigger"
      :aria-label="`Open ${media.title} contents`"
      @click.stop.prevent="openCollectionId = media.id"
    >
      <span aria-hidden="true">›</span>
    </button>

    <CollectionContentsModal
      v-if="media.isCollectionGroup"
      :model-value="openCollectionId === media.id"
      :collection-name="media.title"
      :media-items="media.collectionMedias ?? []"
      :read-only="props.readOnly"
      @close="openCollectionId = null"
    />
    </div>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { RouterLink, useRouter } from 'vue-router';
import {
  collectComicVolumeValuesFromCopies,
  formatComicVolumes,
} from "../../utils/comicVolumes.js";
import CollectionContentsModal from "../ui/CollectionContentsModal.vue";

const emit = defineEmits(['toggle-select']);
const router = useRouter();
const openCollectionId = ref(null);

const props = defineProps({
  mediaList: {
    type: Array,
    required: true,
  },
  mode: String,
  compact: {
    type: Boolean,
    default: false,
  },
  currentId: {
    type: [String, Number],
    default: null,
  },
  selectable: {
    type: Boolean,
    default: false,
  },
  selectedIds: {
    type: Array,
    default: () => [],
  },
  fromContext: {
    type: String,
    default: 'search',
  },
  category: {
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

function mediaLink(media) {
  let tempFrom = props.fromContext;

  if(props.fromContext === 'search'){
    tempFrom =  props.category;
    console.log(props.category);
  }
  return {
    name: 'media',
    params: {
      id: media.id,
    },
    query: {
      from: tempFrom || 'search',
    },
  };
}

function isSelected(mediaId) {
  return props.selectedIds.includes(mediaId);
}

function toggleSelect(media) {
  emit('toggle-select', media);
}

function openTrade(tradeId) {
  router.push({
    name: 'trade-detail',
    params: {
      id: tradeId,
    },
    query: {
      from: 'collection',
    },
  });
}

function comicVolumesSummary(media) {
  if (
    media.category !== "COMIC" ||
    media.isCollectionGroup ||
    !Array.isArray(media.copies)
  ) {
    return "";
  }

  return formatComicVolumes(
    collectComicVolumeValuesFromCopies(
      media.copies,
    ),
  );
}

function mediaCopyCount(media) {
  if (Array.isArray(media.copies)) {
    return media.copies.filter((copy) => copy.isArchived !== true).length;
  }

  return [
    media.dvd,
    media.bluray,
    media.fourk,
    media.softcover,
    media.hardcover,
    media.cd,
    media.vinyl,
  ].reduce((total, count) => total + (Number(count) || 0), 0);
}
</script>

<style scoped>
.media-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

.media-row {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 12px;
  padding: 8px 10px;
  background: var(--bg-card);
  border-radius: var(--radius-small);
  text-decoration: none;
  color: inherit;
  border: 1px solid var(--border);
}

.media-list-item {
  position: relative;
  min-width: 0;
}

.media-list-item.has-collection-control .media-row {
  padding-right: 50px;
}

.collection-open-trigger {
  position: absolute;
  top: 50%;
  right: 7px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  color: var(--text-h);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-small);
  font-size: 26px;
  line-height: 1;
  transform: translateY(-50%);
  cursor: pointer;
}

.collection-open-trigger:hover,
.collection-open-trigger:focus-visible {
  background: var(--bg-hover);
  border-color: var(--border-light);
}

.media-row:hover {
  background: var(--bg-hover);
}

/* compact variant */
.media-row.compact {
  grid-template-columns: 80px 1fr;
  padding: 0.5rem;
  border-radius: 8px;
}

.media-row.compact .poster {
  width: 70px;
  height: 100px;
  border-radius: 8px;
}

.media-row.current {
  border-color: var(--accent-border);
}

.media-row.selected {
  border-color: var(--accent);
}

.poster {
  width: 48px;
  height: 68px;
  object-fit: cover;
  border-radius: 3px;
}
.row-content {
    min-width: 0;
    flex: 1;
}


.header-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;

    gap: 8px;
}


.header-row h3 {
    margin: 0;

    min-width: 0;

    color: var(--text-h);

    font-size: 17px;
    line-height: 1.3;
    font-weight: 600;

    overflow-wrap: anywhere;
}


.meta {
    margin: 5px 0 0;

    color: var(--text-muted);

    font-size: 13px;
}


.collection-summary {
    margin: 6px 0 0;

    color: var(--text-secondary);

    font-size: 14px;
    font-weight: 500;
}

.collection-summary span {
    color: var(--text-muted);
}


.available {
    margin: 7px 0 0;

    color: var(--text-secondary);

    font-size: 13px;
}

.copy-count {
    margin: 5px 0 0;
    color: var(--text-secondary);
    font-size: 12px;
}

.comic-volumes {
    margin: 7px 0 0;

    color: var(--text-secondary);

    font-size: 13px;
    font-weight: 500;
}


/* Collection / ownership */

.badge {
    display: inline-flex;
    align-items: center;

    padding: 3px 7px;

    color: var(--text-secondary);

    background: var(--accent-bg);

    border: 1px solid var(--accent-border);
    border-radius: 999px;

    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
}


/* Formats */

.format-row {
    display: flex;
    flex-wrap: wrap;

    gap: 6px;

    margin-top: 9px;
}


.format {
    display: inline-flex;
    align-items: center;

    gap: 4px;

    padding: 3px 7px;

    color: var(--text-secondary);
    background: var(--bg-secondary);

    border: 1px solid var(--border);
    border-radius: 5px;

    font-size: 11px;
}


.format strong {
    color: var(--text-h);

    font-weight: 600;
}


/* Trade */

.trade-status {
    margin-top: 8px;
}


.trade-status-link,
.trade-status span {
    display: inline-flex;
    align-items: center;

    padding: 4px 8px;

    color: var(--text-secondary);
    background: var(--bg-secondary);

    border: 1px solid var(--border);
    border-radius: 5px;

    font-size: 12px;
}


.trade-status-link {
    cursor: pointer;
}


.trade-status-link:hover {
    color: var(--text-h);
    background: var(--bg-hover);
}

</style>
