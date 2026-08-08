<template>
  <div class="page">
    <Breadcrumbs :title="displayTitle" />

    <div v-if="!boxSet" class="loading">
      Loading box set...
    </div>

    <div v-else>
      <div class="title-row">
        <h1>{{ displayTitle }}</h1>
        <button
          v-if="canEdit"
          type="button"
          @click="toggleEditing"
        >
          {{ isEditing ? 'Done' : 'Edit' }}
        </button>
      </div>

      <p v-if="boxSet.listingNote">{{ boxSet.listingNote }}</p>

      <div class="boxset-summary">
        <p>Contains {{ boxSet.medias.length }} movies</p>
        <p v-if="boxSet.canSell">Selling whole box for €{{ boxSet.sellPrice }}</p>
        <p v-if="boxSet.canRent">Renting whole box for €{{ boxSet.rentPrice }} + deposit €{{ boxSet.deposit }}</p>
      </div>

      <div class="boxset-media">
        <h2>Movies</h2>
        <div v-for="media in boxSet.medias" :key="media.id" class="media-row">
          <RouterLink :to="{ name: 'media', params: { id: media.id }, query: { from: 'collection' } }">
            {{ media.collectionPosition ? `${media.collectionPosition}. ` : '' }}{{ media.title }}
          </RouterLink>
          <button
            v-if="canEdit && isEditing"
            type="button"
            class="danger-btn"
            :disabled="removingMediaId === media.id || addingMedia"
            @click="removeMedia(media.id)"
          >
            {{ removingMediaId === media.id ? 'Removing...' : 'Remove' }}
          </button>
        </div>
      </div>

      <section v-if="canEdit && isEditing" class="edit-section">
        <h2>Edit box set</h2>

        <div class="form-row">
          <label>Title</label>
          <input
            v-model="boxSetForm.name"
            type="text"
            placeholder="Optional box set title"
          >
        </div>

        <div class="form-row">
          <label>Listing note</label>
          <textarea
            v-model="boxSetForm.listingNote"
            rows="2"
            placeholder="Complete box set with slipcase"
          />
        </div>

        <div class="form-row">
          <label>
            <input type="checkbox" v-model="boxSetForm.canSell" />
            Sell entire box
          </label>
          <div v-if="boxSetForm.canSell" class="nested-fields">
            <label>Price</label>
            <input v-model.number="boxSetForm.sellPrice" type="number">
          </div>
        </div>

        <div class="form-row">
          <label>
            <input type="checkbox" v-model="boxSetForm.canRent" />
            Rent entire box
          </label>
          <div v-if="boxSetForm.canRent" class="nested-fields">
            <label>Price / month</label>
            <input v-model.number="boxSetForm.rentPrice" type="number">
            <label>Deposit</label>
            <input v-model.number="boxSetForm.deposit" type="number">
          </div>
        </div>

        <button
          type="button"
          :disabled="savingBoxSet"
          @click="saveBoxSet"
        >
          {{ savingBoxSet ? 'Saving...' : 'Save box set details' }}
        </button>

        <div class="form-row">
          <label>Edition</label>
          <select v-model="addForm.edition">
            <option value="DVD">DVD</option>
            <option value="BLURAY">Blu-ray</option>
            <option value="UHD_4K">4K UHD</option>
          </select>
        </div>

        <div class="form-row" v-if="is4K">
          <label>
            <input type="checkbox" v-model="addForm.includesBluRay" />
            Includes Blu-ray
          </label>
        </div>

        <div class="form-row">
          <h3>Add movies</h3>
          <MediaSearch
            :exclude-ids="excludeMediaIds"
            @selected="addItem"
          />
        </div>

        <div v-if="addForm.items.length" class="selected-items">
          <div v-for="item in addForm.items" :key="item.id" class="selected-item">
            <span>{{ item.title }} | {{ item.releaseYear }}</span>
            <button type="button" class="danger-btn" @click="removeItem(item.id)">Remove</button>
          </div>
        </div>

        <button
          type="button"
          :disabled="addForm.items.length === 0 || addingMedia"
          @click="saveAddedMedia"
        >
          {{ addingMedia ? 'Adding...' : 'Add selected movies' }}
        </button>
        <button
          type="button"
          class="danger-btn delete-boxset-btn"
          :disabled="deletingBoxSet || addingMedia || removingMediaId !== null"
          @click="removeBoxSet"
        >
          {{ deletingBoxSet ? 'Deleting...' : 'Delete box set (and all copies)' }}
        </button>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </section>
      <section v-else-if="auth.user.value" class="read-only-note">
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

import Breadcrumbs from '../components/layout/Breadcrumbs.vue';
import MediaSearch from '../components/media/MediaSearch.vue';
import { addBoxSetMedia, deleteBoxSet, getBoxSetById, removeBoxSetMedia, updateBoxSet } from '../api/boxsetAPI.js';

const route = useRoute();
const router = useRouter();
const auth = useAuth();
const boxSet = ref(null);
const isEditing = ref(false);
const savingBoxSet = ref(false);
const addingMedia = ref(false);
const removingMediaId = ref(null);
const deletingBoxSet = ref(false);
const errorMessage = ref('');

const boxSetForm = reactive({
  name: '',
  listingNote: '',
  canSell: false,
  sellPrice: null,
  canRent: false,
  rentPrice: null,
  deposit: null,
});

const addForm = reactive({
  edition: 'BLURAY',
  includesBluRay: false,
  items: [],
});

const displayTitle = computed(() => {
  if (!boxSet.value) {
    return 'Box Set';
  }
  return boxSet.value.name || boxSet.value.title || `Box Set #${boxSet.value.id}`;
});

const canEdit = computed(() => {
  if (!boxSet.value || !auth.user.value) {
    return false;
  }
  return boxSet.value.ownerId === auth.user.value.id;
});

const is4K = computed(() => addForm.edition === 'UHD_4K');

const excludeMediaIds = computed(() => {
  const existing = boxSet.value ? boxSet.value.medias.map((media) => media.id) : [];
  const selected = addForm.items.map((item) => item.id);
  return [...existing, ...selected];
});

async function loadBoxSet() {
  boxSet.value = await getBoxSetById(route.params.id);
  syncBoxSetForm();
}

function addItem(media) {
  addForm.items.push(media);
}

function removeItem(mediaId) {
  const index = addForm.items.findIndex((item) => item.id === mediaId);
  if (index !== -1) {
    addForm.items.splice(index, 1);
  }
}

async function saveAddedMedia() {
  if (!canEdit.value || addForm.items.length === 0) {
    return;
  }

  addingMedia.value = true;
  errorMessage.value = '';
  try {
    boxSet.value = await addBoxSetMedia(route.params.id, {
      edition: addForm.edition,
      includesBluRay: addForm.includesBluRay,
      mediaIds: addForm.items.map((item) => item.id),
    });
    addForm.items.splice(0, addForm.items.length);
    syncBoxSetForm();
  } catch (error) {
    errorMessage.value = error.message || 'Failed to add movies to box set';
  } finally {
    addingMedia.value = false;
  }
}

async function removeMedia(mediaId) {
  if (!canEdit.value) {
    return;
  }

  removingMediaId.value = mediaId;
  errorMessage.value = '';
  try {
    boxSet.value = await removeBoxSetMedia(route.params.id, mediaId);
    syncBoxSetForm();
  } catch (error) {
    errorMessage.value = error.message || 'Failed to remove movie from box set';
  } finally {
    removingMediaId.value = null;
  }
}

function syncBoxSetForm() {
  if (!boxSet.value) {
    return;
  }
  boxSetForm.name = boxSet.value.name || boxSet.value.title || '';
  boxSetForm.listingNote = boxSet.value.listingNote || '';
  boxSetForm.canSell = Boolean(boxSet.value.canSell);
  boxSetForm.sellPrice = boxSet.value.sellPrice;
  boxSetForm.canRent = Boolean(boxSet.value.canRent);
  boxSetForm.rentPrice = boxSet.value.rentPrice;
  boxSetForm.deposit = boxSet.value.deposit;
}

function toggleEditing() {
  isEditing.value = !isEditing.value;
  errorMessage.value = '';
  if (isEditing.value) {
    syncBoxSetForm();
  }
}

async function saveBoxSet() {
  if (!canEdit.value) {
    return;
  }

  savingBoxSet.value = true;
  errorMessage.value = '';
  try {
    boxSet.value = await updateBoxSet(route.params.id, {
      name: boxSetForm.name.trim() || null,
      listingNote: boxSetForm.listingNote.trim() || null,
      canSell: boxSetForm.canSell,
      sellPrice: boxSetForm.canSell ? boxSetForm.sellPrice : null,
      canRent: boxSetForm.canRent,
      rentPrice: boxSetForm.canRent ? boxSetForm.rentPrice : null,
      deposit: boxSetForm.canRent ? boxSetForm.deposit : null,
    });
    syncBoxSetForm();
  } catch (error) {
    errorMessage.value = error.message || 'Failed to update box set';
  } finally {
    savingBoxSet.value = false;
  }
}

async function removeBoxSet() {
  if (!canEdit.value || deletingBoxSet.value) {
    return;
  }

  const confirmed = window.confirm('Delete this box set and all of its copies from your collection? This cannot be undone.');
  if (!confirmed) {
    return;
  }

  deletingBoxSet.value = true;
  errorMessage.value = '';
  try {
    await deleteBoxSet(route.params.id);
    router.push({ name: 'Collection' });
  } catch (error) {
    errorMessage.value = error.message || 'Failed to delete box set';
  } finally {
    deletingBoxSet.value = false;
  }
}

onMounted(loadBoxSet);
</script>

<style scoped>
.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.media-row {
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
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

.edit-section {
  margin-top: 2rem;
  padding: 1rem;
  border: 1px solid #333;
  border-radius: 10px;
  background: #1d1d1d;
}

.form-row {
  margin-bottom: 1rem;
}

.form-row input[type="text"],
.form-row input[type="number"],
.form-row select,
.form-row textarea {
  width: 100%;
  box-sizing: border-box;
  margin-top: 0.35rem;
}

.nested-fields {
  margin-top: 0.5rem;
}

.selected-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.selected-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
}

.danger-btn {
  background: #8f2828;
  border: none;
  color: #fff;
  border-radius: 6px;
  padding: 0.35rem 0.65rem;
  cursor: pointer;
}

.danger-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-boxset-btn {
  margin-left: 0.75rem;
}

.error-message {
  margin-top: 0.75rem;
  color: #ff8c8c;
}

.read-only-note {
  margin-top: 1.5rem;
  color: #bbb;
}
</style>
