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
              <span> {{ releaseYearLabels.get(media.id) }}</span>

          </div>

          <div v-if="rowStatuses(media).length || collectionStatus(media) || media.isCollectionGroup" class="row-statuses">
              <span v-for="status in rowStatuses(media)" :key="status" class="status-tag">{{ status }}</span>
              <button
                  v-if="media.tradeId"
                  type="button"
                  class="status-tag status-action"
                  @click.stop.prevent="openTrade(media.tradeId)"
              >For trade</button>
              <span v-else-if="media.isCollectionGroup && collectionStatus(media)" class="status-tag list-status">
                  {{ listStatusLabel(collectionStatus(media), media.category) }}
              </span>
              <span v-if="media.isCollectionGroup" class="collection-summary-inline">
                  {{ collectionTitleCount(media) }} {{ collectionTitleTerm(media) }}
                  <template v-if="media.collectionCopies != null">· {{ media.collectionCopies }} {{ media.collectionCopies === 1 ? 'copy' : 'copies' }}</template>
              </span>
          </div>

      </div>
    </component>

    <ListMenu
      v-if="!media.isCollectionGroup && !props.readOnly"
      class="media-list-menu"
      :media-id="media.id"
      :category="media.category"
      empty-label="+ Add to list"
      @click.stop
    />

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
import { computed, ref, watch } from "vue";
import { RouterLink, useRouter } from 'vue-router';
import CollectionContentsModal from "../ui/CollectionContentsModal.vue";
import ListMenu from "../ui/ListMenu.vue";
import { useAuth } from "../../composables/useAuth.js";
import { listStatusLabel } from "../../services/listMenuState.js";
import { loadMyLists, mediaListEntries } from "../../services/listsService.js";

const emit = defineEmits(['toggle-select']);
const router = useRouter();
const openCollectionId = ref(null);
const { user } = useAuth();

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

const releaseYearLabels = computed(() =>
  new Map(props.mediaList.map((media) => [media.id, releaseYearLabel(media)])),
);

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

function collectionTitleCount(media) {
  return Array.isArray(media.collectionMedias) ? media.collectionMedias.length : media.collectionSize;
}

function collectionTitleTerm(media) {
  const terms = { MOVIE: "movies", TV_SHOW: "seasons", MUSIC: "albums", BOOK: "books", COMIC: "comics" };
  const term = terms[media.category] ?? "titles";
  return collectionTitleCount(media) === 1 ? term.replace(/s$/, "") : term;
}

function releaseYearLabel(media) {
  if (!media.isCollectionGroup || !Array.isArray(media.collectionMedias)) {
    return media.releaseYear;
  }

  const years = media.collectionMedias
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
    return media.releaseYear;
  }

  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  return firstYear === lastYear ? String(firstYear) : `${firstYear} - ${lastYear}`;
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

function rowStatuses(media) {
  const children = media.isCollectionGroup && Array.isArray(media.collectionMedias)
    ? media.collectionMedias
    : [media];
  const owned = media.inCollection || mediaCopyCount(media) > 0 || children.some((item) =>
    item.inCollection || (Array.isArray(item.copies) && item.copies.some((copy) => copy.isArchived !== true)),
  );
  const forSale = media.hasSell || children.some((item) =>
    item.hasSell || item.copies?.some((copy) => copy.isArchived !== true && (copy.canSell || copy.boxSet?.canSell)),
  );
  const forTrade = media.activeTrade || media.tradeStatusLabel || children.some((item) => item.activeTrade || item.tradeStatusLabel);
  return [
    ...(owned ? ["Owned"] : []),
    ...(forSale ? ["For sale"] : []),
    ...(!media.tradeId && forTrade ? ["For trade"] : []),
  ];
}

function collectionStatus(media) {
  if (!user.value || props.readOnly || !Array.isArray(media.collectionMedias) || media.collectionMedias.length === 0) {
    return null;
  }

  const statuses = media.collectionMedias.map((child) =>
    mediaListEntries.value.find((entry) => entry.mediaId === child.id)?.status,
  );

  return statuses[0] && statuses.every((status) => status === statuses[0])
    ? statuses[0]
    : null;
}

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

.media-list-menu {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
}

.collection-open-trigger {
  position: absolute;
  top: 50%;
  right: 7px;
  z-index: 2;
  display: grid;
  place-items: center;
  min-width: 36px;
  height: 36px;
  padding: 0 9px;
  color: var(--text-h);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-small);
  font-size: 12px;
  font-weight: 600;
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

.row-statuses {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 7px;
}

.status-tag {
    display: inline-flex;
    align-items: center;
    padding: 3px 6px;
    color: #fff;
    background: rgba(20, 24, 32, 0.78);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 999px;
    font-size: 10px;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
}

.status-action {
    font-family: inherit;
    cursor: pointer;
}

.status-action:hover {
    background: rgba(20, 24, 32, 0.96);
}

.row-statuses :deep(.list-menu) {
    display: inline-flex;
}

.row-statuses :deep(.list-menu-trigger) {
    min-height: 0;
    padding: 3px 6px;
    color: #fff;
    background: rgba(20, 24, 32, 0.78);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 999px;
    font-size: 10px;
    font-weight: 600;
    line-height: 1;
}


.collection-summary-inline {
    color: var(--text-secondary);
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
}

</style>
