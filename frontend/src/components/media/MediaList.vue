<template>
  <section class="media-list">
    <RouterLink
      v-for="media in mediaList"
      :key="media.id"
      :to="mediaLink(media)"
      class="media-row"
    >
      <img
        class="poster"
        :src="posterSource(media.poster)"
        :alt="media.title"
      />

      <div class="row-content">
        <div class="header-row">
          <h3>{{ media.title }}</h3>
          <span v-if="media.inCollection" class="badge">In collection</span>
        </div>

        <p class="meta">
          {{ media.isCollectionGroup ? 'Collection' : `${media.releaseYear} • ${media.category}` }}
        </p>

        <p v-if="media.isCollectionGroup" class="collection-summary">
          {{ media.collectionSize }} titles
        </p>

        <p v-else-if="media.availableCopies != null" class="available">
          {{ media.availableCopies }} available for sale or rent
        </p>

        <div class="format-row" v-if="!media.isCollectionGroup">
          <span class="format" v-if="media.dvd">DVD {{ media.dvd }}</span>
          <span class="format" v-if="media.bluray">Blu-ray {{ media.bluray }}</span>
          <span class="format" v-if="media.fourk">UHD {{ media.fourk }}</span>
        </div>
      </div>
    </RouterLink>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router';

defineProps({
  mediaList: {
    type: Array,
    required: true,
  },
  mode: String,
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
      from: 'search',
    },
  };
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

.poster {
  width: 120px;
  height: 170px;
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
