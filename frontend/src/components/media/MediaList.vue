<template>
  <section class="media-list">
    <RouterLink
      v-for="media in mediaList"
      :key="media.id"
      :to="mediaLink(media)"
      :class="['media-row', { compact: props.compact, current: media.id === props.currentId, selected: isSelected(media.id) }]"
    >
      <img
        class="poster"
        :src="posterSource(media.poster)"
        :alt="media.title"
      />

      <div class="row-content">
        <div class="header-row">
          <label v-if="props.selectable" class="select-toggle" @click.stop>
            <input
              type="checkbox"
              :checked="isSelected(media.id)"
              @change.stop.prevent="toggleSelect(media)"
            />
          </label>
          <h3>{{ media.title }}</h3>
          <span v-if="media.inCollection && !props.compact" class="badge">In collection</span>
        </div>

        <p v-if="!props.compact" class="meta">
          {{ media.isCollectionGroup ? 'Collection' : `${media.releaseYear} • ${media.category}` }}
        </p>

        <p v-if="!props.compact && media.isCollectionGroup" class="collection-summary">
          {{ media.collectionSize }} titles
        </p>

        <p v-else-if="!props.compact && media.availableCopies != null" class="available">
          {{ media.availableCopies }} available for sale or rent
        </p>

        <div v-if="media.tradeStatusLabel" class="trade-status">
          <button
            v-if="media.tradeId"
            type="button"
            class="trade-status-link"
            @click.stop.prevent="openTrade(media.tradeId)"
          >
            {{ media.tradeStatusLabel }}
          </button>
          <span v-else>{{ media.tradeStatusLabel }}</span>
        </div>

        <div v-if="!props.compact && !media.isCollectionGroup" class="format-row">
          <span class="format" v-if="media.dvd">DVD {{ media.dvd }}</span>
          <span class="format" v-if="media.bluray">Blu-ray {{ media.bluray }}</span>
          <span class="format" v-if="media.fourk">UHD {{ media.fourk }}</span>
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
});

function posterSource(poster) {
  return poster?.startsWith('http') ? poster : `/posters/${poster}`;
}

function mediaLink(media) {
  return {
    name: 'media',
    params: {
      id: media.id,
    },
    query: {
      from: (props && props.mode) || 'search',
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
  background: #222;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
}

.media-row:hover {
  background: #2f2f2f;
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.75rem;
}

.header-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.header-row h3 {
  margin: 0;
  color: #fff;
}

.select-toggle {
  display: flex;
  align-items: center;
}

.select-toggle input {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.badge {
  background: #3f8cff;
  color: #fff;
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
}
.badge.sell {
  background: #ff9f3f;
}
.badge.rent {
  background: #ffd24d;
}

.meta {
  margin: 0;
  color: #aaa;
}

.collection-summary {
  margin: 0;
  color: #ccc;
  font-size: 0.95rem;
}

.available {
  color: #fff;
  font-weight: 600;
}

.trade-status {
  margin: 0;
  color: #ddd;
  font-weight: 600;
}

.trade-status-link {
  border: none;
  background: none;
  color: #7acbff;
  padding: 0;
  cursor: pointer;
  font: inherit;
  text-decoration: underline;
}

.format-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.format {
  color: #ddd;
  background: #333;
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  font-size: 0.85rem;
}
</style>
