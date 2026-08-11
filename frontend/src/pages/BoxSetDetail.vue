<template>
  <div class="boxset-details">
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
        <p>Contains {{ boxSet.medias.length }} items</p>
        <p v-if="boxSet.canSell">Selling whole box for €{{ boxSet.sellPrice }}</p>
      </div>

      <div class="boxset-media">
        <h2>Items</h2>
        <div v-for="media in boxSet.medias" :key="media.id" class="media-row">
          <RouterLink :to="{ name: 'media', params: { id: media.id }, query: { from: 'collection' } }">
            {{ media.collectionPosition ? `${media.collectionPosition}. ` : '' }}{{ media.title }}|{{ media.releaseYear }}
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
        <div class="form-row" v-if="canEdit">
          <div class="nested-fields">
          <label>
            <input type="checkbox" v-model="boxSetForm.canSell" />
            Sell entire box
          </label>
            <label>Price</label>
            <input v-model.number="boxSetForm.sellPrice" type="number" min="0.01">
            <button
          type="button"
          :disabled="savingBoxSet"
          @click="saveBoxSet"
        >
          {{ savingBoxSet ? 'Saving...' : 'Save box set details' }}
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

        <button
          type="button"
          :disabled="savingBoxSet"
          @click="saveBoxSet"
        >
          {{ savingBoxSet ? 'Saving...' : 'Save box set details' }}
        </button>

        <div class="form-row" v-if="is4K">
          <label>
            <input type="checkbox" v-model="addForm.includesBluRay" />
            Includes Blu-ray
          </label>
        </div>

        <div class="form-row">
          <h3>Add movies</h3>
          <MediaSearch
              :category="boxSetCategory"
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
        <div class="form-row">
          <label>Edition</label>
          <select v-model="addForm.edition">
            <option value="DVD">DVD</option>
            <option value="BLURAY">Blu-ray</option>
            <option value="UHD_4K">4K UHD</option>
          </select>
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

const boxSetCategory = computed(() => {
    return boxSet.value?.medias?.[0]?.category || null;
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

  if (boxSetForm.canSell && (!boxSetForm.sellPrice || boxSetForm.sellPrice <= 0)) {
    errorMessage.value = 'Sell price must be greater than 0.';
    return;
  }

  if (boxSetForm.canRent && (!boxSetForm.rentPrice || boxSetForm.rentPrice <= 0)) {
    errorMessage.value = 'Rent price must be greater than 0.';
    return;
  }

  if (boxSetForm.canRent && (!boxSetForm.deposit || boxSetForm.deposit <= 0)) {
    errorMessage.value = 'Deposit must be greater than 0.';
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
    alert('Box set saved successfully.');
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
/* =========================================================
   BOX SET DETAILS
   ========================================================= */

.boxset-details {
    width: min(100%, 850px);
    margin: 0 auto;
}


/* =========================================================
   TITLE
   ========================================================= */

.title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 15px;

    margin-bottom: 8px;
}

.title-row h1 {
    margin: 0;

    color: var(--text-h);

    font-size: clamp(26px, 5vw, 38px);
}

.title-row > button {
    flex-shrink: 0;
}


/* =========================================================
   GENERAL BUTTONS
   ========================================================= */

.boxset-details button {
    min-height: 36px;

    padding: 7px 12px;

    color: var(--text);
    background: var(--accent-bg);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);

    font: inherit;
    font-size: 13px;
    font-weight: 500;

    cursor: pointer;

    transition:
        background 0.15s ease,
        border-color 0.15s ease,
        color 0.15s ease;
}

.boxset-details button:hover {
    color: var(--text-h);
    background: var(--accent-bg);
    border-color: var(--accent-border);
}

.boxset-details button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}


/* =========================================================
   LISTING NOTE
   ========================================================= */

.boxset-details > div > p:first-of-type {
    color: var(--text-secondary);

    font-size: 13px;
    line-height: 1.5;
}


/* =========================================================
   SUMMARY
   ========================================================= */

.boxset-summary {
    display: flex;
    flex-wrap: wrap;

    gap: 8px;

    margin: 18px 0;
}

.boxset-summary p {
    margin: 0;

    padding: 7px 10px;

    color: var(--text-secondary);
    background: var(--bg-secondary);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);

    font-size: 12px;
}

.boxset-summary p:first-child {
    color: var(--text-h);
    font-weight: 600;
}

.boxset-summary p:has(+ p) {
    /* keeps summary pills visually consistent */
}


/* =========================================================
   MEDIA LIST
   ========================================================= */

.boxset-media {
    margin-top: 22px;
}

.boxset-media h2 {
    margin: 0 0 10px;

    color: var(--text-h);

    font-size: 20px;
}

.media-row {
    display: flex;
    align-items: center;

    gap: 10px;

    min-width: 0;

    padding: 9px 11px;

    background: var(--bg-card);

    border: 1px solid var(--border);
    border-bottom: 0;
}

.media-row:first-of-type {
    border-radius: var(--radius-small) var(--radius-small) 0 0;
}

.media-row:last-child {
    border-bottom: 1px solid var(--border);
    border-radius: 0 0 var(--radius-small) var(--radius-small);
}

.media-row:only-of-type {
    border-radius: var(--radius-small);
}

.media-row:hover {
    background: var(--bg-hover);
}

.media-row a {
    flex: 1;

    min-width: 0;

    overflow: hidden;

    color: var(--text);

    font-size: 13px;
    text-decoration: none;

    text-overflow: ellipsis;
    white-space: nowrap;
}

.media-row a:hover {
    color: var(--accent);
}

.media-row .danger-btn {
    flex-shrink: 0;
}


/* =========================================================
   EDIT SECTION
   ========================================================= */

.edit-section {
    display: flex;
    flex-direction: column;

    gap: 14px;

    margin-top: 24px;
    padding: 18px;

    background: var(--bg-secondary);

    border: 1px solid var(--border);
    border-radius: var(--radius);
}

.edit-section h2 {
    margin: 0;

    color: var(--text-h);

    font-size: 20px;
}

.edit-section h3 {
    margin: 0 0 8px;

    color: var(--text-h);

    font-size: 15px;
}


/* =========================================================
   FORM ROW
   ========================================================= */

.form-row {
    display: flex;
    flex-direction: column;

    gap: 6px;
}

.form-row > label {
    color: var(--text-secondary);

    font-size: 13px;
    font-weight: 500;
}

.form-row input[type="text"],
.form-row input[type="number"],
.form-row textarea,
.form-row select {
    width: 100%;

    min-height: 40px;

    padding: 8px 10px;

    color: var(--text-h);
    background: var(--bg);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);

    font: inherit;
}

.form-row textarea {
    min-height: 65px;

    resize: vertical;
}

.form-row input:focus,
.form-row textarea:focus,
.form-row select:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
}


/* =========================================================
   CHECKBOX
   ========================================================= */

.form-row label:has(input[type="checkbox"]) {
    display: flex;
    align-items: center;

    gap: 8px;

    cursor: pointer;
}

.form-row input[type="checkbox"] {
    width: 16px;
    height: 16px;

    margin: 0;

    accent-color: var(--accent);
}


/* =========================================================
   NESTED FIELDS
   ========================================================= */

.nested-fields {
    display: flex;
    align-items: center;

    gap: 8px;

    padding: 10px;

    background: var(--bg-card);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);
}

.nested-fields label {
    color: var(--text-muted);

    font-size: 12px;
}

.nested-fields input {
    width: 120px;

    min-height: 36px;

    padding: 7px 9px;

    color: var(--text-h);
    background: var(--bg-secondary);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);
}


/* =========================================================
   DIVIDERS
   ========================================================= */

.edit-section hr {
    width: 100%;

    margin: 0;

    border: 0;
    border-top: 1px solid var(--border);
}


/* =========================================================
   MEDIA SEARCH
   ========================================================= */

.form-row:has(.media-search) {
    padding-top: 4px;
}


/* =========================================================
   SELECTED ITEMS
   ========================================================= */

.selected-items {
    display: flex;
    flex-direction: column;

    gap: 6px;

    padding: 10px;

    background: var(--bg-card);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);
}

.selected-item {
    display: flex;
    align-items: center;

    gap: 8px;

    min-width: 0;

    padding: 7px 8px;

    background: var(--bg-secondary);

    border: 1px solid var(--border);
    border-radius: 4px;
}

.selected-item span {
    flex: 1;

    min-width: 0;

    overflow: hidden;

    color: var(--text);

    font-size: 12px;

    text-overflow: ellipsis;
    white-space: nowrap;
}

.selected-item .danger-btn {
    flex-shrink: 0;
}


/* =========================================================
   DANGER BUTTONS
   ========================================================= */

.boxset-details .danger-btn {
    color: var(--danger);

    background: var(--social-bg);

    border-color: var(--social-bg);
}

.boxset-details .danger-btn:hover {
    color: var(--danger);

    background: var(--danger-bg);

    border-color: var(--danger);
}

.delete-boxset-btn {
    margin-top: 8px;
}


/* =========================================================
   ERROR
   ========================================================= */

.error-message {
    margin: 0;

    padding: 10px 12px;

    color: var(--danger);
    background: var(--danger-bg);

    border: 1px solid var(--danger);
    border-radius: var(--radius-small);

    font-size: 13px;
}


/* =========================================================
   LOADING
   ========================================================= */

.loading {
    padding: 40px 20px;

    color: var(--text-muted);

    text-align: center;

    font-size: 13px;
}


/* =========================================================
   READ ONLY
   ========================================================= */

.read-only-note {
    margin-top: 20px;
}


/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 600px) {

    .title-row {
        align-items: flex-start;
    }

    .title-row h1 {
        font-size: 26px;
    }

    .boxset-summary {
        gap: 6px;
    }

    .boxset-summary p {
        font-size: 11px;
    }

    .media-row {
        padding: 8px;
    }

    .media-row a {
        white-space: normal;
        line-height: 1.4;
    }

    .edit-section {
        padding: 14px;
    }

    .nested-fields {
        align-items: flex-start;
        flex-direction: column;
    }

    .nested-fields input {
        width: 100%;
    }

    .selected-item {
        align-items: flex-start;
    }

    .selected-item .danger-btn {
        padding: 5px 8px;
    }

}
</style>
