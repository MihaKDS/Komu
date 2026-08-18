<template>
  <section class="media-list">
    <RouterLink
      v-for="media in mediaList"
      :key="media.id"
      :to="mediaLink(media)"
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

              <template v-else>
                  {{ media.releaseYear }} • {{ media.category }}
              </template>
          </p>


          <p
              v-if="!props.compact && media.isCollectionGroup"
              class="collection-summary"
          >
              {{ media.collectionSize }}
              {{ media.collectionSize === 1 ? 'title' : 'titles' }}
          </p>


          <p
              v-else-if="
                  !props.compact &&
                  media.availableCopies != null
              "
              class="available"
          >
              {{ media.availableCopies }}
              available for sale
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
                  v-if="media.dvd"
                  class="format"
              >
                  DVD
                  <strong>{{ media.dvd }}</strong>
              </span>

              <span
                  v-if="media.bluray"
                  class="format"
              >
                  Blu-ray
                  <strong>{{ media.bluray }}</strong>
              </span>

              <span
                  v-if="media.fourk"
                  class="format"
              >
                  UHD
                  <strong>{{ media.fourk }}</strong>
              </span>

          </div>

      </div>
    </RouterLink>
  </section>
</template>

<script setup>
import { RouterLink, useRouter } from 'vue-router';

const emit = defineEmits(['toggle-select']);
const router = useRouter();

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
});

function posterSource(poster, category) {
    if (poster) {
        return poster.startsWith("http")
            ? poster
            : `/posters/${poster}`;
    }

    if (category === "BOOK" || category === "COMIC") {
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
  grid-template-columns: 120px 1fr;
  gap: 1rem;
  padding: 1rem;
  background: var(--border);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  border: 2px solid rgba(104, 104, 104, 0.25);
}

.media-row:hover {
  background: var(--code-bg);
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
  box-shadow: 0 6px 16px rgba(0,0,0,0.45);
  border: 2px solid rgba(63,140,255,0.25);
}

.media-row.selected {
  border: 2px solid rgba(76, 175, 80, 0.65);
}

.poster {
  width: 90px;
  height: 140px;
  object-fit: cover;
  border-radius: 10px;
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


.available {
    margin: 7px 0 0;

    color: var(--text-secondary);

    font-size: 13px;
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
