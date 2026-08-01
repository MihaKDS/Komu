<script setup>
import { reactive, ref } from "vue";
import { createMedia } from "../../api/mediaAPI";
import { searchTmdbMovies, getTmdbMovieDetails } from "../../api/tmdbService";

const emit = defineEmits(["close", "saved"]);
const query = ref("");
const loading = ref(false);
const results = ref([]);
const error = ref("");
const saving = ref(false);
const selectedMovie = ref(null);
const importCollection = ref(true);
const form = reactive({
  title: "",
  description: "",
  releaseYear: new Date().getFullYear(),
  poster: "",
  category: "MOVIE",
  // optional collection info populated from TMDb details
  movieCollection: null,
});

async function search() {
  if (!query.value.trim()) return;

  loading.value = true;
  error.value = "";
  selectedMovie.value = null;

  try {
    results.value = await searchTmdbMovies(query.value.trim());
  } catch (err) {
    error.value = "Unable to search TMDB. Please try again.";
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function selectMovie(movie) {
  selectedMovie.value = movie;
  form.title = movie.title;
  form.description = movie.description ?? "";
  form.releaseYear = movie.releaseYear ?? new Date().getFullYear();
  form.poster = movie.poster ?? "";
  form.category = "MOVIE";
  form.movieCollection = null;
  importCollection.value = true;
  form.tmdbId = movie.id;

  // Fetch TMDb details to see if this movie belongs to a collection
  try {
    const details = await getTmdbMovieDetails(movie.id);
    if (details?.belongsToCollection) {
      form.movieCollection = {
        tmdbId: details.belongsToCollection.id,
        title: details.belongsToCollection.name,
        poster: details.belongsToCollection.poster_path
          ? `https://image.tmdb.org/t/p/w342${details.belongsToCollection.poster_path}`
          : null,
      };
    }
  } catch (err) {
    console.error('Failed to fetch TMDB details', err);
    // proceed without collection info
  }
}

function createManually() {
  selectedMovie.value = { manual: true };
  form.title = "";
  form.description = "";
  form.releaseYear = new Date().getFullYear();
  form.poster = "";
  form.category = "MOVIE";
  form.tmdbId = undefined;
  form.movieCollection = null;
  importCollection.value = false;
}

async function saveMedia() {
  saving.value = true;
  error.value = "";

  try {
    const payload = {
      ...form,
      releaseYear: Number(form.releaseYear),
      poster: form.poster || null,
    };
    // Only send collection info if user opted in and we have it
    if (!importCollection.value) payload.movieCollection = null;
    // Indicate whether to import the whole collection's members
    payload.importCollectionMembers = !!importCollection.value;

    await createMedia(payload);
    emit("saved");
    emit("close");
  } catch (err) {
    error.value = "Unable to add this title. Please check the form and try again.";
    console.error(err);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="dialog-overlay">
    <div class="add-media">
      <button class="close-btn" aria-label="Close add media dialog" @click="emit('close')">&times;</button>
      <h2>Add New Title</h2>

      <div class="search-box">
        <input v-model="query" placeholder="Search TMDB..." @keyup.enter="search" />
        <button :disabled="loading" @click="search">Search</button>
      </div>

      <p v-if="loading">Searching...</p>
      <p v-if="error" class="error">{{ error }}</p>

      <div v-if="results.length && !selectedMovie" class="results">
        <div v-for="movie in results" :key="movie.id" class="movie-card">
          <img v-if="movie.poster" :src="movie.poster" :alt="movie.title" />
          <div class="movie-info">
            <h3>{{ movie.title }}</h3>
            <p>{{ movie.releaseYear || "Release year unknown" }}</p>
            <button @click="selectMovie(movie)">Use this title</button>
          </div>
        </div>
      </div>

      <form v-if="selectedMovie" class="media-form" @submit.prevent="saveMedia">
        <h3>Media details</h3>
        <label>Title<input v-model.trim="form.title" required /></label>
        <label>Release year<input v-model.number="form.releaseYear" type="number" min="1888" :max="new Date().getFullYear() + 5" required /></label>
        <label>Description<textarea v-model.trim="form.description" required rows="4" /></label>
        <label>Poster URL<input v-model.trim="form.poster" type="url" /></label>

        <div v-if="form.movieCollection" class="collection-info">
          <label>
            <input type="checkbox" v-model="importCollection" />
            Link to collection: <strong>{{ form.movieCollection.title }}</strong>
          </label>
          <img v-if="form.movieCollection.poster" :src="form.movieCollection.poster" alt="Collection poster" style="width:80px;margin-top:8px;" />
        </div>

        <div class="form-actions">
          <button type="submit" :disabled="saving">{{ saving ? "Adding..." : "Add media" }}</button>
          <button type="button" @click="selectedMovie = null">Back to results</button>
        </div>
      </form>

      <div v-else-if="!loading && !results.length" class="manual">
        <hr>
        <p>Can't find your title?</p>
        <button @click="createManually">Create manually</button>
        <button @click="emit('close')">Cancel</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay { position: fixed; inset: 0; display: flex; justify-content: center; align-items: center; padding: 1rem; background: rgba(224, 223, 223, .8); z-index: 1000; }
.add-media { position: relative; width: min(700px, 100%); max-height: 90vh; overflow-y: auto; padding: 2rem; border: solid 1px white; border-radius: 14px; background: rgba(0, 0, 0, .45); color: whitesmoke; box-shadow: 0 10px 30px rgba(0, 0, 0, .5); }
.search-box, .form-actions { display: flex; gap: 10px; }
.search-box { margin-bottom: 20px; }
.search-box input { flex: 1; }
.movie-card { display: flex; gap: 15px; padding: 10px 0; border-bottom: 1px solid #ddd; }
.movie-card img { width: 80px; height: 120px; object-fit: cover; }
.movie-info { flex: 1; }
.manual { margin-top: 30px; text-align: center; }
.media-form { display: grid; gap: 1rem; margin-top: 1.5rem; }
.media-form label { display: grid; gap: .35rem; }
.media-form input, .media-form textarea { width: 100%; box-sizing: border-box; }
.error { color: #ff9b9b; }
.close-btn { position: absolute; top: 1rem; right: 1rem; border: none; background: transparent; color: inherit; font-size: 1.5rem; cursor: pointer; }
</style>
