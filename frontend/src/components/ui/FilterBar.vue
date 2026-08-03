<template>
  <section class="filter-bar">
    <div class="group">
      <label for="format-select">Format</label>
      <select
        id="format-select"
        v-model="selectedFormat"
        @change="emitFormat"
      >
        <option value="ALL">All formats</option>
        <option value="DVD">DVD</option>
        <option value="BLURAY">Blu-ray</option>
        <option value="UHD_4K">UHD</option>
      </select>
    </div>

    <div v-if="showCollectionFilter" class="group">
      <label for="collection-select">Collection</label>
      <select
        id="collection-select"
        v-model="selectedCollection"
        @change="emitCollection"
      >
        <option value="ALL">All movies</option>
        <option value="IN_COLLECTION">In collection</option>
        <option value="NOT_IN_COLLECTION">Not in collection</option>
      </select>
    </div>

    <div v-if="showViewToggle" class="view-toggle">
      <button
        type="button"
        :class="{ active: viewMode === 'grid' }"
        @click="setView('grid')"
      >
        Grid
      </button>
      <button
        type="button"
        :class="{ active: viewMode === 'list' }"
        @click="setView('list')"
      >
        List
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  format: {
    type: String,
    default: 'ALL',
  },
  collection: {
    type: String,
    default: 'ALL',
  },
  viewMode: {
    type: String,
    default: 'grid',
  },
  showCollectionFilter: {
    type: Boolean,
    default: true,
  },
  showViewToggle: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:format', 'update:collection', 'update:viewMode']);

const selectedFormat = ref(props.format);
const selectedCollection = ref(props.collection);

watch(
  () => props.format,
  (value) => {
    selectedFormat.value = value;
  }
);

watch(
  () => props.collection,
  (value) => {
    selectedCollection.value = value;
  }
);

function emitFormat() {
  emit('update:format', selectedFormat.value);
}

function emitCollection() {
  emit('update:collection', selectedCollection.value);
}

function setView(value) {
  emit('update:viewMode', value);
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
}

.group {
  display: flex;
  flex-direction: column;
  min-width: 180px;
}

label {
  font-size: 0.9rem;
  color: #ddd;
  margin-bottom: 0.25rem;
}

select {
  padding: 0.75rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #555;
  background: #1f1f1f;
  color: #fff;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

button {
  border: 1px solid #555;
  background: #2b2b2b;
  color: #ddd;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}

button.active {
  background: #fff;
  color: #222;
  border-color: #fff;
}
</style>
