<template>
  <div class="add-media">

    <h2>Add New Media</h2>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="categoryNotice" class="notice">{{ categoryNotice }}</p>

    <form class="media-form" @submit.prevent="saveMedia">
      <label>
        Category
        <select v-model="form.category" required>
          <option value="MOVIE">Movie 🎬</option>
          <option value="TV_SHOW">TV Show 📺</option>
          <option value="BOOK">Book 📚</option>
          <option value="COMIC">Comic 📖</option>
        </select>
      </label>

      <label>
        Title
        <input v-model.trim="form.title" required placeholder="Title" />
      </label>

      <label>
        Author
        <input v-model.trim="form.author" placeholder="Optional" />
      </label>

      <label>
        Release year
        <input
          v-model.number="form.releaseYear"
          type="number"
          min="1888"
          :max="new Date().getFullYear() + 5"
          placeholder="Optional"
        />
      </label>

      <label>
        Description
        <textarea
          v-model.trim="form.description"
          rows="4"
          placeholder="Optional"
        />
      </label>

      <label>
        Poster URL
        <input
          v-model.trim="form.poster"
          type="url"
          placeholder="Optional"
        />
      </label>

      <div class="collection-section">
        <h3>Part of collection</h3>

        <label class="checkbox-label">
          <input type="checkbox" v-model="form.partOfCollection" />
          Part of collection
        </label>

        <div v-if="form.partOfCollection" class="collection-selector">
          <div v-if="!createNewCollection">
            <label>
              Search collection
              <input
                v-model.trim="collectionQuery"
                placeholder="Search collections..."
              />
            </label>

            <div
              v-if="collectionResults.length"
              class="collection-results"
            >
              <button
                v-for="collection in collectionResults"
                :key="collection.id"
                type="button"
                class="collection-result"
                @click="selectCollection(collection)"
              >
                <img
                  v-if="collection.poster"
                  :src="collection.poster"
                  :alt="collection.title"
                />

                <span>{{ collection.title }}</span>
              </button>
            </div>

            <div v-if="selectedCollection" class="selected-collection">
              <strong>Selected collection:</strong>
              {{ selectedCollection.title }}

              <button type="button" @click="clearCollection">
                Change
              </button>
            </div>

            <button
              type="button"
              class="secondary-button"
              @click="createNewCollection = true"
            >
              + Add new collection
            </button>
          </div>

          <div v-else class="new-collection">
            <label>
              Collection title
              <input
                v-model.trim="newCollection.title"
                required
                placeholder="Collection title"
              />
            </label>

            <label>
              Collection poster URL
              <input
                v-model.trim="newCollection.poster"
                type="url"
                placeholder="Optional"
              />
            </label>

            <div class="collection-actions">
              <button
                type="button"
                :disabled="savingCollection"
                @click="saveNewCollection"
              >
                {{ savingCollection ? "Saving..." : "Save collection" }}
              </button>

              <button
                type="button"
                class="secondary-button"
                @click="cancelNewCollection"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="form.category === 'MOVIE'"
        class="tmdb-section"
      >
        <hr />

        <h3>TMDB Import</h3>

        <p class="help-text">
          Search TMDB to automatically fill the media information.
        </p>

        <div class="search-box">
          <input
            v-model.trim="tmdbQuery"
            placeholder="Search TMDB..."
            @keyup.enter="searchTmdb"
          />

          <button
            type="button"
            :disabled="tmdbLoading"
            @click="searchTmdb"
          >
            {{ tmdbLoading ? "Searching..." : "Search" }}
          </button>
        </div>

        <p v-if="tmdbError" class="error">
          {{ tmdbError }}
        </p>

        <div
          v-if="tmdbResults.length && !selectedTmdbMovie"
          class="results"
        >
          <div
            v-for="movie in tmdbResults"
            :key="movie.id"
            class="movie-card"
          >
            <img
              v-if="movie.poster"
              :src="movie.poster"
              :alt="movie.title"
            />

            <div class="movie-info">
              <h4>{{ movie.title }}</h4>
              <p>{{ movie.releaseYear || "Release year unknown" }}</p>

              <button
                type="button"
                @click="selectTmdbMovie(movie)"
              >
                Use this title
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="selectedTmdbMovie"
          class="tmdb-selected"
        >
          <h4>Selected TMDB movie</h4>

          <div class="selected-movie">
            <img
              v-if="selectedTmdbMovie.poster"
              :src="selectedTmdbMovie.poster"
              :alt="selectedTmdbMovie.title"
            />

            <div>
              <strong>{{ selectedTmdbMovie.title }}</strong>
              <p>{{ selectedTmdbMovie.releaseYear || "Unknown year" }}</p>
            </div>
          </div>

          <div
            v-if="tmdbCollection"
            class="tmdb-collection"
          >
            <h4>Collection: {{ tmdbCollection.title }}</h4>

            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="importCollection"
              />
              Import collection movies
            </label>

            <div
              v-if="importCollection && tmdbCollectionMovies.length"
              class="collection-movies"
            >
              <p>Select the movies you want to import:</p>

              <div
                v-for="movie in tmdbCollectionMovies"
                :key="movie.id"
                class="collection-movie-card"
              >
                <label>
                  <input
                    type="checkbox"
                    :value="movie.id"
                    v-model="selectedCollectionMovieIds"
                  />

                  <img
                    v-if="movie.poster"
                    :src="movie.poster"
                    :alt="movie.title"
                  />

                  <div>
                    <strong>{{ movie.title }}</strong>
                    <span>{{ movie.releaseYear || "Release year unknown" }}</span>
                  </div>
                </label>
              </div>

              <p class="selection-count">
                {{ selectedCollectionMovieIds.length }} movie(s) selected for import
              </p>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="useTmdbMovie">
              Fill form from TMDB
            </button>

            <button
              type="button"
              class="secondary-button"
              @click="resetTmdb"
            >
              Back to search
            </button>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button
          type="submit"
          :disabled="saving || !form.title.trim()"
        >
          {{ saving ? "Saving..." : "Add media" }}
        </button>

        <button
          type="button"
          class="secondary-button"
          @click="goBack"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { createCollection, searchCollections } from "../../api/collectionAPI";
import { createMedia } from "../../api/mediaAPI";
import {
  getTmdbCollection,
  getTmdbMovieDetails,
  searchTmdbMovies,
} from "../../api/tmdbService";

const router = useRouter();

const SUPPORTED_CATEGORIES = new Set(["MOVIE", "TV_SHOW", "BOOK", "COMIC"]);

const form = reactive({
  category: "MOVIE",
  title: "",
  author: "",
  releaseYear: null,
  description: "",
  poster: "",
  partOfCollection: false,
  collectionId: null,
});

const saving = ref(false);
const error = ref("");

const collectionQuery = ref("");
const collectionResults = ref([]);
const selectedCollection = ref(null);
const createNewCollection = ref(false);
const savingCollection = ref(false);
const newCollection = reactive({
  title: "",
  poster: "",
});

const tmdbQuery = ref("");
const tmdbResults = ref([]);
const tmdbLoading = ref(false);
const tmdbError = ref("");
const selectedTmdbMovie = ref(null);
const tmdbCollection = ref(null);
const tmdbCollectionMovies = ref([]);
const importCollection = ref(false);
const selectedCollectionMovieIds = ref([]);

const categoryNotice = computed(() => {
  if (SUPPORTED_CATEGORIES.has(form.category)) {
    return "";
  }

  return "TV Show and Comic categories still need a backend schema update, so they cannot be saved yet.";
});

let collectionSearchTimeout = null;

watch(collectionQuery, () => {
  clearTimeout(collectionSearchTimeout);

  if (!collectionQuery.value.trim()) {
    collectionResults.value = [];
    return;
  }

  collectionSearchTimeout = setTimeout(() => {
    void runCollectionSearch();
  }, 300);
});

function goBack() {
  router.push("/");
}

async function runCollectionSearch() {
  try {
    collectionResults.value = await searchCollections(collectionQuery.value);
  } catch (searchError) {
    console.error("Collection search failed:", searchError);
    error.value = "Could not search collections.";
  }
}

function selectCollection(collection) {
  selectedCollection.value = collection;
  form.collectionId = collection.id;
  collectionQuery.value = "";
  collectionResults.value = [];
  createNewCollection.value = false;
}

function clearCollection() {
  selectedCollection.value = null;
  form.collectionId = null;
}

function cancelNewCollection() {
  createNewCollection.value = false;
  newCollection.title = "";
  newCollection.poster = "";
}

async function saveNewCollection() {
  if (!newCollection.title.trim()) {
    return;
  }

  savingCollection.value = true;
  error.value = "";

  try {
    const collection = await createCollection({
      title: newCollection.title.trim(),
      poster: newCollection.poster.trim() || null,
      tmdbId: tmdbCollection.value?.id,
    });

    selectCollection(collection);
    newCollection.title = "";
    newCollection.poster = "";
  } catch (saveError) {
    console.error("Failed to create collection:", saveError);
    error.value = "Could not create collection.";
  } finally {
    savingCollection.value = false;
  }
}

async function searchTmdb() {
  if (!tmdbQuery.value.trim()) {
    return;
  }

  tmdbLoading.value = true;
  tmdbError.value = "";
  tmdbResults.value = [];

  try {
    tmdbResults.value = await searchTmdbMovies(tmdbQuery.value);
  } catch (searchError) {
    console.error("TMDB search failed:", searchError);
    tmdbError.value = "Could not search TMDB.";
  } finally {
    tmdbLoading.value = false;
  }
}

async function selectTmdbMovie(movie) {
  tmdbError.value = "";

  try {
    const details = await getTmdbMovieDetails(movie.id);

    selectedTmdbMovie.value = details;
    form.title = details.title || "";
    form.releaseYear = details.releaseYear || null;
    form.description = details.description || "";
    form.poster = details.poster || "";

    const belongsToCollection = details.belongsToCollection || null;
    tmdbCollection.value = belongsToCollection
      ? {
          id: belongsToCollection.id,
          title: belongsToCollection.name,
          poster: belongsToCollection.poster_path
            ? `https://image.tmdb.org/t/p/w342${belongsToCollection.poster_path}`
            : null,
        }
      : null;

    tmdbCollectionMovies.value = [];
    selectedCollectionMovieIds.value = [];
    importCollection.value = false;

    if (tmdbCollection.value) {
      const collection = await getTmdbCollection(tmdbCollection.value.id);

      tmdbCollection.value = {
        id: collection.id,
        title: collection.name,
        poster: collection.poster_path
          ? `https://image.tmdb.org/t/p/w342${collection.poster_path}`
          : null,
      };

      tmdbCollectionMovies.value = (collection.parts || []).map((part) => ({
        id: part.id,
        title: part.title,
        poster: part.poster_path
          ? `https://image.tmdb.org/t/p/w342${part.poster_path}`
          : null,
        releaseYear: Number(part.release_date?.slice(0, 4)) || null,
      }));

      selectedCollectionMovieIds.value = tmdbCollectionMovies.value.map(
        (collectionMovie) => collectionMovie.id,
      );
      importCollection.value = true;
    }
  } catch (detailsError) {
    console.error("Failed to fetch TMDB details:", detailsError);
    tmdbError.value = "Failed to load TMDB movie details.";
  }
}

function useTmdbMovie() {
  if (importCollection.value && tmdbCollection.value) {
    form.partOfCollection = true;

    if (!selectedCollection.value && !newCollection.title) {
      newCollection.title = tmdbCollection.value.title;
      newCollection.poster = tmdbCollection.value.poster || "";
    }
  }
}

function resetTmdb() {
  selectedTmdbMovie.value = null;
  tmdbCollection.value = null;
  tmdbCollectionMovies.value = [];
  selectedCollectionMovieIds.value = [];
  importCollection.value = false;
  tmdbError.value = "";
}

async function ensureCollectionId() {
  if (!form.partOfCollection) {
    return null;
  }

  if (form.collectionId) {
    return form.collectionId;
  }

  if (selectedCollection.value?.id) {
    form.collectionId = selectedCollection.value.id;
    return form.collectionId;
  }

  const title =
    newCollection.title.trim() ||
    tmdbCollection.value?.title ||
    "";

  if (!title) {
    return null;
  }

  const collection = await createCollection({
    title,
    poster: (newCollection.poster || tmdbCollection.value?.poster || "").trim() || null,
    tmdbId: tmdbCollection.value?.id,
  });

  selectCollection(collection);
  return collection.id;
}

function buildSinglePayload(collectionId) {
  return {
    category: form.category,
    title: form.title.trim(),
    author: form.author.trim() || null,
    releaseYear:
      form.releaseYear ||
      new Date().getFullYear(),
    description: form.description.trim() || "",
    poster: form.poster.trim() || null,
    collectionId,
    collectionPosition:
      form.collectionPosition || null,
  };
}

async function createSingleMedia(collectionId) {
  return createMedia(buildSinglePayload(collectionId));
}

async function importSelectedTmdbMovies(collectionId) {
  const sortedMovies = [...tmdbCollectionMovies.value].sort(
    (a, b) => {
      const yearA = a.releaseYear || 9999;
      const yearB = b.releaseYear || 9999;

      return yearA - yearB;
    },
  );

  const selectedMovies = sortedMovies.filter((movie) =>
    selectedCollectionMovieIds.value.includes(movie.id),
  );

  return Promise.all(
    selectedMovies.map((movie) => {
      const collectionPosition =
        sortedMovies.findIndex(
          (item) => item.id === movie.id,
        ) + 1;

      return createMedia({
        category: "MOVIE",
        title: movie.title,
        author: null,
        releaseYear:
          movie.releaseYear ||
          new Date().getFullYear(),
        description: "",
        poster: movie.poster || null,
        tmdbId: movie.id,
        collectionId,

        collectionPosition,

        movieCollection: tmdbCollection.value
          ? {
              tmdbId: tmdbCollection.value.id,
              title: tmdbCollection.value.title,
              poster: tmdbCollection.value.poster,
            }
          : undefined,
      });
    }),
  );
}

async function saveMedia() {
  if (!SUPPORTED_CATEGORIES.has(form.category)) {
    error.value = categoryNotice.value;
    return;
  }

  saving.value = true;
  error.value = "";

  try {
    const collectionId = await ensureCollectionId();

    if (
      selectedTmdbMovie.value &&
      importCollection.value &&
      selectedCollectionMovieIds.value.length
    ) {
      await importSelectedTmdbMovies(collectionId);
    } else {
      await createSingleMedia(collectionId);
      alert("Media added successfully.");
    }

    router.push("/add-media");
  } catch (saveError) {
    console.error("Failed to save media:", saveError);
    error.value = saveError.message || "Failed to save media.";
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
/* =========================================================
   ADD MEDIA
   ========================================================= */

.media-form {
    width: min(100%, 760px);

    margin: 0 auto;
    padding-bottom: 40px;

    display: flex;
    flex-direction: column;

    gap: 16px;
}


/* =========================================================
   FORM FIELDS
   ========================================================= */

.media-form > label,
.media-form .new-collection > label {
    display: flex;
    flex-direction: column;

    gap: 6px;

    color: var(--text-secondary);

    font-size: 13px;
    font-weight: 500;
}

.media-form input,
.media-form select,
.media-form textarea {
    width: 100%;

    min-height: 40px;

    padding: 9px 11px;

    color: var(--text-h);
    background: var(--bg);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);

    font: inherit;
}

.media-form textarea {
    resize: vertical;
    min-height: 90px;
}

.media-form input::placeholder,
.media-form textarea::placeholder {
    color: var(--text-muted);
}

.media-form input:focus,
.media-form select:focus,
.media-form textarea:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
}


/* =========================================================
   ERRORS / NOTICES
   ========================================================= */

.error,
.notice {
    width: min(100%, 760px);

    margin: 10px auto;
    padding: 10px 12px;

    border-radius: var(--radius-small);

    font-size: 13px;
}

.error {
    color: var(--danger);
    background: var(--danger-bg);

    border: 1px solid var(--danger);
}

.notice {
    color: var(--text-secondary);
    background: var(--bg-secondary);

    border: 1px solid var(--border);
}


/* =========================================================
   COLLECTION
   ========================================================= */

.collection-section,
.tmdb-section {
    margin-top: 8px;
    padding: 18px;

    background: var(--bg-secondary);

    border: 1px solid var(--border);
    border-radius: var(--radius);
}

.collection-section > h3,
.tmdb-section > h3 {
    margin: 0 0 4px;

    color: var(--text-h);

    font-size: 17px;
}

.checkbox-label {
    display: flex;
    align-items: center;

    gap: 9px;

    color: var(--text);

    cursor: pointer;

    font-size: 13px;
}

.checkbox-label input {
    width: 16px;
    min-height: 16px;
    height: 16px;

    padding: 0;

    accent-color: var(--accent);
}

.collection-selector {
    margin-top: 14px;
}

.collection-selector > div > label {
    display: flex;
    flex-direction: column;

    gap: 6px;

    color: var(--text-secondary);

    font-size: 13px;
}


/* Search results */

.collection-results {
    display: flex;
    flex-direction: column;

    overflow: hidden;

    margin-top: 8px;

    background: var(--bg-card);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);
}

.collection-result {
    display: flex;
    align-items: center;

    width: 100%;

    gap: 10px;

    padding: 8px;

    color: var(--text);

    background: transparent;

    border: 0;
    border-bottom: 1px solid var(--border);

    text-align: left;

    cursor: pointer;
}

.collection-result:last-child {
    border-bottom: 0;
}

.collection-result:hover {
    background: var(--bg-hover);
}

.collection-result img {
    width: 40px;
    height: 52px;

    flex-shrink: 0;

    object-fit: cover;

    border-radius: 3px;
}

.collection-result span {
    color: var(--text-h);

    font-size: 13px;
}


/* Selected collection */

.selected-collection {
    display: flex;
    align-items: center;
    flex-wrap: wrap;

    gap: 6px;

    margin-bottom: 10px;
    padding: 10px 12px;

    color: var(--text);

    background: var(--bg-card);

    border: 1px solid var(--accent-border);
    border-radius: var(--radius-small);

    font-size: 13px;
}

.selected-collection strong {
    color: var(--text-h);
}

.selected-collection button {
    margin-left: auto;

    padding: 4px 8px;

    color: var(--text-secondary);
    background: transparent;

    border: 1px solid var(--border);
    border-radius: 4px;

    font-size: 11px;

    cursor: pointer;
}

.selected-collection button:hover {
    color: var(--text-h);
    background: var(--bg-hover);
}


/* New collection */

.new-collection {
    display: flex;
    flex-direction: column;

    gap: 12px;
}

.collection-actions {
    display: flex;

    gap: 8px;

    margin-top: 2px;
}


/* =========================================================
   BUTTONS
   ========================================================= */

.media-form button {
    min-height: 38px;

    padding: 8px 13px;

    color: #fff;
    background: var(--accent);

    border: 1px solid var(--accent);
    border-radius: var(--radius-small);

    font: inherit;
    font-size: 13px;

    cursor: pointer;

    transition:
        background 0.15s ease,
        border-color 0.15s ease,
        opacity 0.15s ease;
}

.media-form button:hover {
    background: var(--accent-hover);
}

.media-form button:disabled {
    opacity: 0.5;

    cursor: not-allowed;
}

.media-form .secondary-button {
    color: var(--text);

    background: var(--bg-card);

    border-color: var(--border);
}

.media-form .secondary-button:hover {
    color: var(--text-h);

    background: var(--bg-hover);
}


/* =========================================================
   TMDB
   ========================================================= */

.tmdb-section hr {
    margin: 0 0 18px;

    border: 0;
    border-top: 1px solid var(--border);
}

.help-text {
    margin: 0 0 12px;

    color: var(--text-muted);

    font-size: 12px;
}

.search-box {
    display: flex;

    gap: 8px;
}

.search-box input {
    flex: 1;
}

.search-box button {
    flex-shrink: 0;
}


/* =========================================================
   TMDB SEARCH RESULTS
   ========================================================= */

.results {
    display: grid;

    grid-template-columns:
        repeat(auto-fill, minmax(240px, 1fr));

    gap: 10px;

    margin-top: 14px;
}

.movie-card {
    display: flex;

    min-width: 0;

    gap: 10px;

    padding: 9px;

    background: var(--bg-card);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);
}

.movie-card img {
    width: 65px;
    height: 95px;

    flex-shrink: 0;

    object-fit: cover;

    border-radius: 4px;

    background: var(--bg-secondary);
}

.movie-info {
    min-width: 0;

    display: flex;
    flex-direction: column;

    align-items: flex-start;
}

.movie-info h4 {
    margin: 0 0 4px;

    color: var(--text-h);

    font-size: 14px;
    line-height: 1.3;
}

.movie-info p {
    margin: 0 0 auto;

    color: var(--text-muted);

    font-size: 12px;
}

.movie-info button {
    margin-top: 8px;

    min-height: 32px;

    padding: 5px 8px;

    font-size: 11px;
}


/* =========================================================
   SELECTED TMDB MOVIE
   ========================================================= */

.tmdb-selected {
    margin-top: 14px;

    padding: 14px;

    background: var(--bg-card);

    border: 1px solid var(--accent-border);
    border-radius: var(--radius);
}

.tmdb-selected > h4 {
    margin: 0 0 10px;

    color: var(--text-h);

    font-size: 14px;
}

.selected-movie {
    display: flex;

    align-items: center;

    gap: 12px;
}

.selected-movie img {
    width: 55px;
    height: 80px;

    flex-shrink: 0;

    object-fit: cover;

    border-radius: 4px;
}

.selected-movie strong {
    color: var(--text-h);

    font-size: 15px;
}

.selected-movie p {
    margin: 4px 0 0;

    color: var(--text-muted);

    font-size: 12px;
}


/* =========================================================
   TMDB COLLECTION
   ========================================================= */

.tmdb-collection {
    margin-top: 16px;
    padding-top: 14px;

    border-top: 1px solid var(--border);
}

.tmdb-collection h4 {
    margin: 0 0 10px;

    color: var(--text-h);

    font-size: 14px;
}

.collection-movies {
    margin-top: 12px;
}

.collection-movies > p {
    margin: 0 0 8px;

    color: var(--text-muted);

    font-size: 12px;
}

.collection-movie-card {
    margin-bottom: 6px;
}

.collection-movie-card label {
    display: flex;
    align-items: center;

    gap: 9px;

    min-width: 0;

    padding: 7px;

    background: var(--bg-secondary);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);

    cursor: pointer;
}

.collection-movie-card label:hover {
    background: var(--bg-hover);
}

.collection-movie-card input {
    width: 16px;
    min-width: 16px;
    height: 16px;
    min-height: 16px;

    padding: 0;

    accent-color: var(--accent);
}

.collection-movie-card img {
    width: 38px;
    height: 55px;

    flex-shrink: 0;

    object-fit: cover;

    border-radius: 3px;
}

.collection-movie-card div {
    min-width: 0;

    display: flex;
    flex-direction: column;

    gap: 3px;
}

.collection-movie-card strong {
    overflow: hidden;

    color: var(--text-h);

    font-size: 12px;

    text-overflow: ellipsis;
    white-space: nowrap;
}

.collection-movie-card span {
    color: var(--text-muted);

    font-size: 11px;
}

.selection-count {
    margin-top: 10px;

    color: var(--accent);

    font-size: 12px;
    font-weight: 600;
}


/* =========================================================
   TMDB ACTIONS
   ========================================================= */

.tmdb-selected .form-actions {
    margin-top: 16px;
    padding-top: 14px;

    border-top: 1px solid var(--border);
}


/* =========================================================
   MAIN ACTIONS
   ========================================================= */

.media-form > .form-actions {
    display: flex;
    justify-content: flex-end;

    gap: 8px;

    margin-top: 8px;
    padding-top: 18px;

    border-top: 1px solid var(--border);
}


/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 600px) {

    .media-form {
        gap: 13px;
    }

    .collection-section,
    .tmdb-section {
        padding: 14px;
    }

    .search-box {
        display: grid;

        grid-template-columns: 1fr auto;
    }

    .results {
        grid-template-columns: 1fr;
    }

    .movie-card {
        padding: 8px;
    }

    .movie-card img {
        width: 55px;
        height: 80px;
    }

    .selected-collection {
        align-items: flex-start;
    }

    .selected-collection button {
        margin-left: auto;
    }

    .collection-actions,
    .media-form > .form-actions,
    .tmdb-selected .form-actions {
        flex-direction: column;
    }

    .collection-actions button,
    .media-form > .form-actions button,
    .tmdb-selected .form-actions button {
        width: 100%;
    }

    .collection-movie-card label {
        padding: 6px;
    }

}
</style>
