<template>
  <div class="page">
    <Breadcrumbs :title="boxSet?.name || boxSet?.title || 'Box Set'" />

    <div v-if="!boxSet" class="loading">
      Loading box set...
    </div>

    <div v-else>
      <h1>{{ boxSet.name || boxSet.title || 'Box Set' }}</h1>

      <p v-if="boxSet.listingNote">{{ boxSet.listingNote }}</p>

      <div class="boxset-summary">
        <p>Contains {{ boxSet.medias.length }} movies</p>
        <p v-if="boxSet.canSell">Selling whole box for €{{ boxSet.sellPrice }}</p>
        <p v-if="boxSet.canRent">Renting whole box for €{{ boxSet.rentPrice }} + deposit €{{ boxSet.deposit }}</p>
      </div>

      <div class="boxset-media">
        <h2>Movies</h2>
        <div v-for="media in boxSet.medias" :key="media.id" class="media-row">
          <RouterLink :to="{ name: 'media', params: { id: media.id } }">
            {{ media.collectionPosition ? `${media.collectionPosition}. ` : '' }}{{ media.title }}
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import Breadcrumbs from '../components/layout/Breadcrumbs.vue';
import { getBoxSetById } from '../api/boxsetAPI.js';

const route = useRoute();
const boxSet = ref(null);

async function loadBoxSet() {
  boxSet.value = await getBoxSetById(route.params.id);
}

onMounted(loadBoxSet);
</script>

<style scoped>
.media-row {
  margin-bottom: 0.75rem;
}
.copy-card {
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}
.boxset-summary {
  margin-bottom: 1.5rem;
}
</style>
