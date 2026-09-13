<template>
    <div class="add-media">
        <Breadcrumbs title="Add Media" />
        <h1>Add Media</h1>
        <p class="help-text">
            Add a movie, TV show, or book to Komu.
        </p>

        <section v-if="!categorySelected" class="category-section">
            <h2>What do you want to add?</h2>
            <div class="category-buttons">
                <button type="button" class="category-button" @click="selectCategory('BOOK')">
                    <span class="category-icon">📚</span>
                    <span>Book</span>
                </button>
                <button type="button" class="category-button" @click="selectCategory('MOVIE')">
                    <span class="category-icon">🎬</span>
                    <span>Movie</span>
                </button>
                <button type="button" class="category-button" @click="selectCategory('TV_SHOW')">
                    <span class="category-icon">📺</span>
                    <span>TV Show</span>
                </button>
            </div>
        </section>

        <form v-else class="media-form" @submit.prevent="saveMedia">
            <div class="selected-category">
                <span>{{ categoryLabel }}</span>
                <button type="button" class="change-category" @click="changeCategory">
                    Change
                </button>
            </div>

            <!-- =================================================
                 TMDB IMPORT
                 ================================================= -->
            <div
            v-if="
                form.category === 'MOVIE' ||
                form.category === 'TV_SHOW' ||
                form.category === 'BOOK'
            "
            class="external-search"
            >
            <button
                v-if="form.category === 'MOVIE' || form.category === 'TV_SHOW'"
                type="button"
                class="tmdb-search-button"
                @click="openTmdbImport"
            >
                Search TMDB
            </button>

            <button
                v-if="form.category === 'BOOK'"
                type="button"
                class="tmdb-search-button"
                @click="openGoogleBooksImport"
            >
                Search Google Books
            </button>
            </div>

            <!-- =================================================
                 MINIMAL FORM
                 ================================================= -->
            <section class="basic-fields">
                <label>
                    Title
                    <div class="input-wrapper">
                        <input
                            v-model="form.title"
                            type="text"
                            required
                            placeholder="Title"
                            autocomplete="off"
                        >
                        <button
                            v-if="form.title"
                            type="button"
                            class="clear-button"
                            aria-label="Clear title"
                            @click="form.title = ''"
                        >×</button>
                    </div>
                </label>

                <label v-if="form.category === 'BOOK'">
                    Author
                    <div class="input-wrapper">
                        <input
                            v-model="form.author"
                            type="text"
                            placeholder="Author"
                            autocomplete="off"
                        >
                        <button
                            v-if="form.author"
                            type="button"
                            class="clear-button"
                            aria-label="Clear author"
                            @click="form.author = ''"
                        >×</button>
                    </div>
                    <RecentValues :values="recentAuthors" @select="form.author = $event" />
                </label>

                <label>
                    Release year
                    <div class="input-wrapper">
                        <input
                            v-model.number="form.releaseYear"
                            type="number"
                            min="1"
                            max="9999"
                            placeholder="Year"
                        >
                        <button
                            v-if="form.releaseYear"
                            type="button"
                            class="clear-button"
                            aria-label="Clear release year"
                            @click="form.releaseYear = null"
                        >×</button>
                    </div>
                </label>
            </section>

            <button
                type="button"
                class="details-toggle"
                @click="showDetailedFields = !showDetailedFields"
            >
                <span>{{ showDetailedFields ? "−" : "+" }}</span>
                {{ showDetailedFields ? "Hide additional information" : "Add more information" }}
            </button>

            <!-- =================================================
                 DETAILED FORM
                 ================================================= -->
            <section v-if="showDetailedFields" class="detailed-fields">
                <label>
                    {{ form.category === "BOOK" ? "Author" : "Author / Creator" }}
                    <div class="input-wrapper">
                        <input
                            v-model="form.author"
                            type="text"
                            placeholder="Author or creator"
                            autocomplete="off"
                        >
                        <button
                            v-if="form.author"
                            type="button"
                            class="clear-button"
                            aria-label="Clear author"
                            @click="form.author = ''"
                        >×</button>
                    </div>
                    <RecentValues :values="recentAuthors" @select="form.author = $event" />
                </label>

                <label>
                    Description
                    <div class="textarea-wrapper">
                        <textarea v-model="form.description" rows="5" placeholder="Description"></textarea>
                        <button
                            v-if="form.description"
                            type="button"
                            class="clear-button textarea-clear"
                            aria-label="Clear description"
                            @click="form.description = ''"
                        >×</button>
                    </div>
                </label>

                <label>
                    Poster URL
                    <div class="input-wrapper">
                        <input
                            v-model="form.poster"
                            type="url"
                            placeholder="https://..."
                            autocomplete="off"
                        >
                        <button
                            v-if="form.poster"
                            type="button"
                            class="clear-button"
                            aria-label="Clear poster URL"
                            @click="form.poster = ''"
                        >×</button>
                    </div>
                    <span class="field-help">Optional. You can leave this empty.</span>
                </label>

                <label>
                    Genres
                    <div class="tag-input">
                        <div v-for="genre in form.genres" :key="genre" class="tag">
                            <span>{{ genre }}</span>
                            <button type="button" aria-label="Remove genre" @click="removeGenre(genre)">×</button>
                        </div>
                        <input
                            v-model="genreInput"
                            type="text"
                            placeholder="Add genre"
                            @keyup.enter.prevent="addGenre"
                            @keyup.,.prevent="addGenre"
                        >
                    </div>
                    <RecentValues :values="recentGenres" @select="addGenreValue" />
                </label>

            </section>

            <p v-if="error" class="error">{{ error }}</p>

            <div class="form-actions">
                <button type="button" class="secondary-button" @click="goBack">Cancel</button>
                <button type="submit" class="primary-button" :disabled="saving || !isFormValid">
                    {{ saving ? "Adding..." : "Add media" }}
                </button>
            </div>
        </form>

        <!-- =====================================================
             TMDB IMPORT MODAL
             ===================================================== -->
        <div v-if="showTmdbImport" class="modal-backdrop" @click.self="closeTmdbImport">

            <div class="modal">

                <div class="modal-header">
                    <h2>TMDB Import</h2>
                    <button type="button" class="close-button" @click="closeTmdbImport">×</button>
                </div>

                <template v-if="!selectedTmdbMovie && !selectedTmdbTvShow">
                    <p class="modal-description">
                        Search TMDB to import a
                        {{ form.category === "MOVIE" ? "movie" : "TV show" }}.
                        <template v-if="form.category === 'MOVIE'">
                        </template>
                        <template v-else>
                             Specials are excluded.
                        </template>
                    </p>

                    <div class="tmdb-search-row">
                        <div class="input-wrapper">
                            <input
                                v-model="tmdbSearch"
                                type="text"
                                class="search-input"
                                :placeholder="form.category === 'MOVIE' ? 'Search movie...' : 'Search TV show...'"
                                autocomplete="off"
                                @keyup.enter="searchTmdb"
                            >
                            <button
                                v-if="tmdbSearch"
                                type="button"
                                class="clear-button"
                                aria-label="Clear TMDB search"
                                @click="clearTmdbSearch"
                            >×</button>
                        </div>
                        <button
                            type="button"
                            class="search-tmdb-button"
                            :disabled="tmdbLoading || !tmdbSearch.trim()"
                            @click="searchTmdb"
                        >
                            {{ tmdbLoading ? "Searching..." : "Search" }}
                        </button>
                    </div>

                    <p v-if="tmdbError" class="error">{{ tmdbError }}</p>

                    <div v-if="tmdbResults.length" class="tmdb-results">
                        <article v-for="item in tmdbResults" :key="item.id" class="tmdb-result">
                            <img v-if="item.poster" :src="item.poster" :alt="item.title">
                            <div class="tmdb-result-content">
                                <strong>{{ item.title }}</strong>
                                <span>{{ item.releaseYear || "Release year unknown" }}</span>
                                <button type="button" @click="selectTmdbItem(item)">
                                    Use this title
                                </button>
                            </div>
                        </article>
                    </div>
                </template>

                <template v-else-if="form.category === 'MOVIE' && selectedTmdbMovie">
                    <div v-if="form.category === 'MOVIE' && selectedTmdbMovie" class="tmdb-selected">
                        <h4>Selected TMDB movie</h4>
                        <div class="selected-movie">
                            <img v-if="selectedTmdbMovie.poster" :src="selectedTmdbMovie.poster" :alt="selectedTmdbMovie.title">
                            <div>
                                <strong>{{ selectedTmdbMovie.title }}</strong>
                                <p>{{ selectedTmdbMovie.releaseYear || "Unknown year" }}</p>
                            </div>
                        </div>

                        <div v-if="tmdbCollection" class="tmdb-collection">
                            <h4>Collection: {{ tmdbCollection.title }}</h4>
                            <label class="checkbox-label">
                                <input v-model="importCollection" type="checkbox">
                                Import collection movies
                            </label>
                            <div v-if="importCollection && tmdbCollectionMovies.length" class="collection-movies">
                                <p>Select the movies you want to import:</p>
                                <div v-for="movie in tmdbCollectionMovies" :key="movie.id" class="collection-movie-card">
                                    <label>
                                        <input v-model="selectedCollectionMovieIds" type="checkbox" :value="movie.id">
                                        <img v-if="movie.poster" :src="movie.poster" :alt="movie.title">
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

                        <p v-if="tmdbError" class="error">{{ tmdbError }}</p>
                        <div class="form-actions">
                            <button
                                type="button"
                                class="primary-button"
                                :disabled="importingTmdb || (importCollection && !selectedCollectionMovieIds.length)"
                                @click="importTmdbItems"
                            >
                                {{ importingTmdb ? "Importing..." : "Import" }}
                            </button>
                            <button type="button" class="secondary-button" :disabled="importingTmdb" @click="resetTmdb">
                                Back to search
                            </button>
                        </div>
                    </div>
                </template>
                <template v-else-if="form.category === 'TV_SHOW' && selectedTmdbTvShow">
                    <div v-if="form.category === 'TV_SHOW' && selectedTmdbTvShow" class="tmdb-selected">
                        <h4>Selected TMDB TV show</h4>
                        <div class="selected-movie">
                            <img v-if="selectedTmdbTvShow.poster" :src="selectedTmdbTvShow.poster" :alt="selectedTmdbTvShow.title">
                            <div>
                                <strong>{{ selectedTmdbTvShow.title }}</strong>
                                <p>{{ selectedTmdbTvShow.releaseYear || "Unknown year" }}</p>
                            </div>
                        </div>

                        <div class="tmdb-collection">
                            <h4>Seasons</h4>
                            <p class="season-help">Select the seasons you want to import. Specials are excluded.</p>
                            <div v-if="tmdbSeasons.length" class="collection-movies">
                                <div v-for="season in tmdbSeasons" :key="season.id" class="collection-movie-card">
                                    <label>
                                        <input v-model="selectedSeasonIds" type="checkbox" :value="season.id">
                                        <img v-if="season.poster" :src="season.poster" :alt="season.title">
                                        <div>
                                            <strong>{{ season.title }}</strong>
                                            <span>
                                                {{ season.releaseYear || "Release year unknown" }}
                                                <template v-if="season.episodeCount">
                                                    · {{ season.episodeCount }} episodes
                                                </template>
                                            </span>
                                        </div>
                                    </label>
                                </div>
                                <p class="selection-count">
                                    {{ selectedSeasonIds.length }} season(s) selected for import
                                </p>
                            </div>
                            <p v-else class="modal-description">No regular seasons were found.</p>
                        </div>

                        <p v-if="tmdbError" class="error">{{ tmdbError }}</p>
                        <div class="form-actions">
                            <button
                                type="button"
                                class="primary-button"
                                :disabled="importingTmdb || !selectedSeasonIds.length"
                                @click="importTmdbItems"
                            >
                                {{ importingTmdb ? "Importing..." : "Import selected seasons" }}
                            </button>
                            <button type="button" class="secondary-button" :disabled="importingTmdb" @click="resetTmdb">
                                Back to search
                            </button>
                        </div>
                    </div>
                </template>

            </div>

        </div>

        <!-- =====================================================
            GOOGLE BOOKS IMPORT MODAL
            ===================================================== -->
        <div
            v-if="showGoogleBooksImport"
            class="modal-backdrop"
            @click.self="closeGoogleBooksImport"
        >
            <div class="modal">

                <div class="modal-header">
                    <div>
                        <h2>Google Books Import</h2>
                        <p class="modal-subtitle">
                            Search by title, author, or ISBN.
                        </p>
                    </div>

                    <button
                        type="button"
                        class="close-button"
                        @click="closeGoogleBooksImport"
                    >
                        ×
                    </button>
                </div>

                <template v-if="!selectedGoogleBook">

                    <div class="tmdb-search-row">
                        <div class="input-wrapper">
                            <input
                                v-model="googleBooksSearch"
                                type="text"
                                class="search-input"
                                placeholder="Search books..."
                                autocomplete="off"
                                @keyup.enter="searchGoogleBooksApi"
                            >

                            <button
                                v-if="googleBooksSearch"
                                type="button"
                                class="clear-button"
                                aria-label="Clear Google Books search"
                                @click="googleBooksSearch = ''"
                            >
                                ×
                            </button>
                        </div>

                        <button
                            type="button"
                            class="search-tmdb-button"
                            :disabled="
                                googleBooksLoading ||
                                !googleBooksSearch.trim()
                            "
                            @click="searchGoogleBooksApi"
                        >
                            {{ googleBooksLoading ? "Searching..." : "Search" }}
                        </button>
                    </div>

                    <p v-if="googleBooksError" class="error">
                        {{ googleBooksError }}
                    </p>

                    <div
                        v-if="googleBooksResults.length"
                        class="tmdb-results google-books-results"
                    >
                        <article
                            v-for="book in googleBooksResults"
                            :key="book.id"
                            class="tmdb-result"
                        >
                            <img
                                v-if="book.poster"
                                :src="book.poster"
                                :alt="book.title"
                            >

                            <div class="tmdb-result-content">
                                <strong>{{ book.title }}</strong>

                                <span v-if="book.authors?.length">
                                    {{ book.authors.join(", ") }}
                                </span>

                                <span v-if="book.releaseYear">
                                    {{ book.releaseYear }}
                                </span>

                                <button
                                    type="button"
                                    @click="selectGoogleBook(book)"
                                >
                                    Use this book
                                </button>
                            </div>
                        </article>
                    </div>

                    <p
                        v-else-if="
                            googleBooksSearch &&
                            !googleBooksLoading
                        "
                        class="modal-empty"
                    >
                        No books found.
                    </p>

                </template>

                <!-- Selected book -->
                <div
                    v-if="selectedGoogleBook"
                    class="google-book-selected"
                >
                    <div class="selected-book-header">
                        <h4>Selected book</h4>
                    </div>

                    <div class="selected-book">
                        <div class="selected-book-cover">
                            <img
                                v-if="selectedGoogleBook.poster"
                                :src="selectedGoogleBook.poster"
                                :alt="selectedGoogleBook.title"
                            >

                            <div v-else class="book-cover-placeholder">
                                📚
                            </div>
                        </div>

                        <div class="selected-book-info">
                            <h3>{{ selectedGoogleBook.title }}</h3>

                            <p v-if="selectedGoogleBook.authors?.length">
                                <strong>Author:</strong>
                                {{ selectedGoogleBook.authors.join(", ") }}
                            </p>

                            <p v-if="selectedGoogleBook.releaseYear">
                                <strong>Year:</strong>
                                {{ selectedGoogleBook.releaseYear }}
                            </p>

                            <p v-if="selectedGoogleBook.language">
                                <strong>Language:</strong>
                                {{ selectedGoogleBook.language }}
                            </p>

                            <p v-if="selectedGoogleBook.categories?.length">
                                <strong>Categories:</strong>
                                {{ selectedGoogleBook.categories.join(", ") }}
                            </p>

                            <div
                                v-if="
                                    selectedGoogleBook.isbn10 ||
                                    selectedGoogleBook.isbn13
                                "
                                class="isbn-info"
                            >
                                <p v-if="selectedGoogleBook.isbn10">
                                    <strong>ISBN-10:</strong>
                                    {{ selectedGoogleBook.isbn10 }}
                                </p>

                                <p v-if="selectedGoogleBook.isbn13">
                                    <strong>ISBN-13:</strong>
                                    {{ selectedGoogleBook.isbn13 }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="form-actions modal-actions">
                        <button
                            type="button"
                            class="secondary-button"
                            @click="selectedGoogleBook = null"
                        >
                            Back to search
                        </button>

                        <button
                            type="button"
                            class="primary-button"
                            @click="importGoogleBook"
                        >
                            Import book
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>

<script setup>

import {

    computed,

    defineComponent,

    h,

    onMounted,

    reactive,

    ref,

} from "vue";

import { useRoute, useRouter } from "vue-router";

import Breadcrumbs from "../layout/Breadcrumbs.vue";

import { createCollection } from "../../api/collectionAPI.js";

import { createMedia } from "../../api/mediaAPI.js";

import {
    getTmdbCollection,
    getTmdbMovieDetails,
    searchTmdbMovies,
    getTmdbTvShowDetails,
    searchTmdbTvShows,
    getTmdbTvSeasonDetails,
} from "../../api/tmdbService.js";

import {
    searchGoogleBooks,
    getGoogleBookDetails,
} from "../../api/googleBookAPI.js";

const router = useRouter();

const route = useRoute();

const form = reactive({

    category: "",

    title: "",

    author: "",

    description: "",

    releaseYear: null,

    poster: "",

    genres: [],

    languages: [],

    tmdbId: null,

});

const categorySelected = ref(false);

const showDetailedFields = ref(false);

const saving = ref(false);

const error = ref("");

/* ============================================================

   TMDB

   ============================================================ \*/

const showTmdbImport = ref(false);

const tmdbSearch = ref("");

const tmdbResults = ref([]);

const tmdbLoading = ref(false);

const tmdbError = ref("");

const selectedTmdbMovie = ref(null);
const selectedTmdbTvShow = ref(null);
const tmdbSeasons = ref([]);
const selectedSeasonIds = ref([]);

const tmdbCollection = ref(null);

const tmdbCollectionMovies = ref([]);

const importCollection = ref(false);

const selectedCollectionMovieIds = ref([]);

const importingTmdb = ref(false);

/* ============================================================
   GOOGLE BOOKS
   ============================================================ */

const showGoogleBooksImport = ref(false);

const googleBooksSearch = ref("");

const googleBooksResults = ref([]);

const googleBooksLoading = ref(false);

const googleBooksError = ref("");

const selectedGoogleBook = ref(null);

/* ============================================================

   TAG INPUTS / RECENT VALUES

   ============================================================ \*/

const genreInput = ref("");

const languageInput = ref("");

const recentAuthors = ref([]);

const recentGenres = ref([]);

const recentLanguages = ref([]);

const RECENT_LIMIT = 10;

const STORAGE_KEYS = {

    authors: "komu_recent_authors",

    genres: "komu_recent_genres",

    languages: "komu_recent_languages",

};

const RecentValues = defineComponent({

    name: "RecentValues",

    props: {

        values: {

            type: Array,

            default: () => [],

        },

    },

    emits: ["select"],

    setup(props, { emit }) {

        return () => props.values.length

            ? h("div", { class: "recent-values" }, [

                h("span", { class: "recent-label" }, "Recent:"),

                ...props.values.map((value) =>

                    h(

                        "button",

                        {

                            key: value,

                            type: "button",

                            class: "recent-value",

                            onClick: () => emit("select", value),

                        },

                        value,

                    ),

                ),

            ])

            : null;

    },

});

const categoryLabel = computed(() => {

    switch (form.category) {

        case "MOVIE": return "Movie";

        case "TV_SHOW": return "TV Show";

        case "BOOK": return "Book";

        default: return "";

    }

});

function selectCategory(category) {

    form.category = category;

    categorySelected.value = true;

    error.value = "";

    resetFormMetadata();

}

function changeCategory(category) {
  form.category = category;
  categorySelected.value = false;

  resetTmdb();
  resetGoogleBooks();
  resetFormMetadata();
}

function resetFormMetadata() {

    form.title = "";

    form.author = "";

    form.description = "";

    form.releaseYear = null;

    form.poster = "";

    form.genres = [];

    form.languages = [];

    form.tmdbId = null;

    genreInput.value = "";

    languageInput.value = "";

    showDetailedFields.value = false;

}

const isFormValid = computed(() => Boolean(form.title.trim()));

/* ============================================================

   TMDB SEARCH / SELECTION

   ============================================================ \*/

function openTmdbImport() {

    showTmdbImport.value = true;

    tmdbSearch.value = "";

    tmdbResults.value = [];

    tmdbError.value = "";

    selectedTmdbMovie.value = null;
    selectedTmdbTvShow.value = null;
    tmdbSeasons.value = [];
    selectedSeasonIds.value = [];

    tmdbCollection.value = null;

    tmdbCollectionMovies.value = [];

    selectedCollectionMovieIds.value = [];

    importCollection.value = false;

}

function closeTmdbImport() {

    showTmdbImport.value = false;

}

async function searchTmdb() {

    tmdbError.value = "";

    tmdbResults.value = [];

    if (!tmdbSearch.value.trim()) return;

    tmdbLoading.value = true;

    try {

        const results = form.category === "MOVIE"
            ? await searchTmdbMovies(tmdbSearch.value.trim())
            : await searchTmdbTvShows(tmdbSearch.value.trim());

        tmdbResults.value = Array.isArray(results)

            ? results

            : results?.results ?? [];

    } catch (searchError) {

        console.error("TMDB search failed:", searchError);

        tmdbError.value = searchError.message || "Failed to search TMDB.";

    } finally {

        tmdbLoading.value = false;

    }

}

async function selectTmdbItem(item) {
    tmdbError.value = "";
    error.value = "";
    tmdbLoading.value = true;

    try {
        if (form.category === "MOVIE") {
            const details = await getTmdbMovieDetails(item.id);
            const data = details?.movie ?? details;

            selectedTmdbMovie.value = data;
            tmdbCollection.value = data.belongsToCollection
                ? {
                    id: data.belongsToCollection.id,
                    title: data.belongsToCollection.name,
                    poster: data.belongsToCollection.poster_path
                        ? `https://image.tmdb.org/t/p/w342${data.belongsToCollection.poster_path}`
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
                    description: part.description || "",
                    poster: part.poster_path
                        ? `https://image.tmdb.org/t/p/w342${part.poster_path}`
                        : null,
                    releaseYear: Number(part.release_date?.slice(0, 4)) || null,
                    genres: part.genres || [],
                    languages: part.original_language
                        ? [part.original_language]
                        : [],
                }));

                selectedCollectionMovieIds.value = tmdbCollectionMovies.value.map(
                    (collectionMovie) => collectionMovie.id,
                );
                importCollection.value = true;
            }
        } else {
            const details = await getTmdbTvShowDetails(item.id);
            const data = details?.show ?? details;

            selectedTmdbTvShow.value = data;
            tmdbSeasons.value = (data.seasons || [])
                .filter((season) => Number(season.seasonNumber) > 0)
                .sort((a, b) => Number(a.seasonNumber) - Number(b.seasonNumber));

            selectedSeasonIds.value = tmdbSeasons.value.map((season) => season.id);
        }
    } catch (detailsError) {
        console.error("Failed to fetch TMDB details:", detailsError);
        tmdbError.value = detailsError.message || "Failed to load TMDB details.";
    } finally {
        tmdbLoading.value = false;
    }
}

function resetTmdb() {

    selectedTmdbMovie.value = null;
    selectedTmdbTvShow.value = null;
    tmdbSeasons.value = [];
    selectedSeasonIds.value = [];

    tmdbCollection.value = null;

    tmdbCollectionMovies.value = [];

    selectedCollectionMovieIds.value = [];

    importCollection.value = false;

    tmdbError.value = "";

}

function clearTmdbSearch() {

    tmdbSearch.value = "";

    tmdbResults.value = [];

    tmdbError.value = "";

}

function tmdbPoster(path) {

    if (!path) return "";

    return `https://image.tmdb.org/t/p/w185${path}`;

}

/* ============================================================

   TMDB IMPORT

   ============================================================ \*/

async function importTmdbItems() {
    if (form.category === "MOVIE" && !selectedTmdbMovie.value) return;
    if (form.category === "TV_SHOW" && !selectedTmdbTvShow.value) return;

    importingTmdb.value = true;
    tmdbError.value = "";

    try {
        let firstCreatedMediaId = null;

        if (form.category === "TV_SHOW") {
            const show = selectedTmdbTvShow.value;

            const collection = await createCollection({
                title: show.title,
                poster: show.poster || null,
                tmdbId: show.id,
                category: "TV_SHOW",
            });

            const selectedSeasons = [...tmdbSeasons.value]
                .sort((a, b) => Number(a.seasonNumber) - Number(b.seasonNumber))
                .filter((season) => selectedSeasonIds.value.includes(season.id));

            for (const season of selectedSeasons) {
                const details = await getTmdbTvSeasonDetails(
                    show.id,
                    season.seasonNumber,
                    show.title,
                );

                const media = await createMedia({
                    category: "TV_SHOW",
                    title: details.title || season.title,
                    author: null,
                    releaseYear: details.releaseYear || season.releaseYear || null,
                    description: details.description || season.description || "",
                    poster: details.poster || season.poster || show.poster || null,
                    tmdbId: details.id || season.id,
                    collectionId: collection.id,
                    collectionPosition: Number(season.seasonNumber),
                    genres: show.genres || [],
                    languages: show.languages || [],
                });

                if (!firstCreatedMediaId) {
                    firstCreatedMediaId = media.id;
                }
            }
        } else {
            let collectionId = null;

            if (importCollection.value && tmdbCollection.value) {
                const collection = await createCollection({
                    title: tmdbCollection.value.title,
                    poster: tmdbCollection.value.poster || null,
                    tmdbId: tmdbCollection.value.id,
                    category: "MOVIE",
                });
                collectionId = collection.id;
            }

            if (
                importCollection.value &&
                collectionId &&
                selectedCollectionMovieIds.value.length
            ) {
                const sortedMovies = [...tmdbCollectionMovies.value].sort((a, b) => {
                    const yearA = a.releaseYear || 9999;
                    const yearB = b.releaseYear || 9999;
                    return yearA - yearB;
                });

                const selectedMovies = sortedMovies.filter((movie) =>
                    selectedCollectionMovieIds.value.includes(movie.id),
                );

                for (const movie of selectedMovies) {
                    const collectionPosition =
                        sortedMovies.findIndex((item) => item.id === movie.id) + 1;

                    const details = await getTmdbMovieDetails(movie.id);

                    const media = await createMedia({
                        category: "MOVIE",
                        title: details.title || movie.title,
                        author: null,
                        releaseYear: details.releaseYear || movie.releaseYear || null,
                        description: details.description || movie.description || "",
                        poster: details.poster || movie.poster || null,
                        tmdbId: details.id || movie.id,
                        collectionId,
                        collectionPosition,
                        genres: details.genres || movie.genres || [],
                        languages: details.languages || movie.languages || [],
                    });

                    if (!firstCreatedMediaId) {
                        firstCreatedMediaId = media.id;
                    }
                }
            } else {
                const movie = selectedTmdbMovie.value;

                const media = await createMedia({
                    category: "MOVIE",
                    title: movie.title,
                    author: null,
                    releaseYear: movie.releaseYear || null,
                    description: movie.description || "",
                    poster: movie.poster || null,
                    tmdbId: movie.id,
                    genres: movie.genres || [],
                    languages: movie.languages || [],
                });

                firstCreatedMediaId = media.id;
            }
        }

        closeTmdbImport();
        resetTmdb();

        if (firstCreatedMediaId) {
            router.push({
                name: "media",
                params: { id: firstCreatedMediaId },
            });
        }
    } catch (importError) {
        console.error("TMDB import failed:", importError);
        tmdbError.value = importError.message || "Failed to import TMDB data.";
    } finally {
        importingTmdb.value = false;
    }
}

function addGenre() {

    addGenreValue(genreInput.value);

    genreInput.value = "";

}

function addGenreValue(value) {

    const genre = String(value || "").trim();

    if (!genre) return;

    if (!form.genres.some((existing) => existing.toLowerCase() === genre.toLowerCase())) {

        form.genres.push(genre);

    }

}

function removeGenre(genre) {

    form.genres = form.genres.filter((value) => value !== genre);

}

function addLanguage() {

    addLanguageValue(languageInput.value);

    languageInput.value = "";

}

function addLanguageValue(value) {

    const language = String(value || "").trim();

    if (!language) return;

    if (!form.languages.some((existing) => existing.toLowerCase() === language.toLowerCase())) {

        form.languages.push(language);

    }

}

function removeLanguage(language) {

    form.languages = form.languages.filter((value) => value !== language);

}

async function searchGoogleBooksApi() {

    if (!googleBooksSearch.value.trim()) {
        return;
    }

    googleBooksLoading.value = true;
    googleBooksError.value = "";
    googleBooksResults.value = [];

    try {

        googleBooksResults.value =
            await searchGoogleBooks(
                googleBooksSearch.value.trim()
            );

    } catch (searchError) {

        console.error(
            "Google Books search failed:",
            searchError
        );

        googleBooksError.value =
            "Could not search Google Books.";

    } finally {

        googleBooksLoading.value = false;

    }
}

async function selectGoogleBook(book) {

    googleBooksError.value = "";
    googleBooksLoading.value = true;

    try {

        const details =
            await getGoogleBookDetails(book.id);

        selectedGoogleBook.value =
            details;

    } catch (detailsError) {

        console.error(
            "Failed to fetch Google Books details:",
            detailsError
        );

        googleBooksError.value =
            "Failed to load book details.";

    } finally {

        googleBooksLoading.value = false;

    }
}
function openGoogleBooksImport() {

    showGoogleBooksImport.value = true;

    googleBooksSearch.value = "";
    googleBooksResults.value = [];
    selectedGoogleBook.value = null;
    googleBooksError.value = "";

}

function closeGoogleBooksImport() {

    showGoogleBooksImport.value = false;

}

function resetGoogleBooks() {
  showGoogleBooksImport.value = false;
  googleBooksSearch.value = "";
  googleBooksResults.value = [];
  googleBooksLoading.value = false;
  googleBooksError.value = "";
  selectedGoogleBook.value = null;
}

function importGoogleBook() {
  if (!selectedGoogleBook.value) return;

  const book = selectedGoogleBook.value;

  form.title = book.title || "";
  form.author = book.authors?.join(", ") || "";
  form.description = book.description || "";
  form.releaseYear = book.releaseYear || null;
  form.poster = book.poster || "";
  form.genres = [...(book.categories || [])];

  // Language is intentionally not imported into Media.
  // It belongs to the Copy and will be handled later.

  closeGoogleBooksImport();

  // Show the additional fields so the imported data can be reviewed.
  showDetailedFields.value = true;
}

/* ============================================================

   RECENT VALUES

   ============================================================ \*/

function loadRecentValues() {

    recentAuthors.value = loadRecent(STORAGE_KEYS.authors);

    recentGenres.value = loadRecent(STORAGE_KEYS.genres);

    recentLanguages.value = loadRecent(STORAGE_KEYS.languages);

}

function loadRecent(key) {

    try {

        const stored = localStorage.getItem(key);

        if (!stored) return [];

        const parsed = JSON.parse(stored);

        return Array.isArray(parsed) ? parsed : [];

    } catch {

        return [];

    }

}

function saveRecentValue(key, value) {

    const cleanValue = String(value || "").trim();

    if (!cleanValue) return;

    const existing = loadRecent(key);

    const updated = [

        cleanValue,

        ...existing.filter(

            (item) => item.toLowerCase() !== cleanValue.toLowerCase(),

        ),

    ].slice(0, RECENT_LIMIT);

    localStorage.setItem(key, JSON.stringify(updated));

    loadRecentValues();

}

/* ============================================================

   SAVE MANUAL MEDIA

   ============================================================ \*/

function goBack() {

    router.back();

}

async function saveMedia() {

    error.value = "";

    if (!isFormValid.value) {

        error.value = "Title is required.";

        return;

    }

    saving.value = true;

    try {

        const media = await createMedia({

            category: form.category,

            title: form.title.trim(),

            author: form.author.trim() || null,

            description: form.description.trim() || null,

            releaseYear: form.releaseYear ? Number(form.releaseYear) : null,

            poster: form.poster.trim() || null,

            genres: [...form.genres],

            languages: [...form.languages],

            tmdbId: form.tmdbId ? Number(form.tmdbId) : null,

        });

        saveRecentValue(STORAGE_KEYS.authors, form.author);

        form.genres.forEach((genre) => saveRecentValue(STORAGE_KEYS.genres, genre));

        form.languages.forEach((language) => saveRecentValue(STORAGE_KEYS.languages, language));

        router.push({

            name: "media",

            params: { id: media.id },

        });

    } catch (saveError) {

        console.error("Failed to add media:", saveError);

        error.value = saveError.message || "Failed to add media.";

    } finally {

        saving.value = false;

    }

}

onMounted(() => {

    loadRecentValues();

    if (route.query.title) {

        form.title = String(route.query.title);

    }

});

</script>

<style scoped>
.add-media {
    width: 100%;
    max-width: 700px;
    margin: 0 auto;
    padding-bottom: 40px;
}

.add-media h1 {
    margin: 24px 0 8px;
    color: var(--text-h);
    font-size: 28px;
}

.help-text {
    max-width: 600px;
    margin: 0 0 28px;
    color: var(--text-muted);
    font-size: 13px;
    line-height: 1.5;
}

.category-section { margin-top: 35px; }
.category-section h2 { margin: 0 0 18px; color: var(--text-h); font-size: 18px; }
.category-buttons { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.category-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 130px;
    padding: 20px;
    color: var(--text-h);
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font: inherit;
    font-size: 14px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
}
.category-button:hover { background: var(--bg-hover); border-color: var(--accent); }
.category-icon { font-size: 30px; }

.selected-category {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2px;
    padding: 10px 12px;
    color: var(--text-h);
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-small);
    font-size: 13px;
    font-weight: 600;
}
.change-category {
    padding: 4px 8px;
    color: var(--accent);
    background: transparent;
    border: 0;
    font: inherit;
    font-size: 12px;
    cursor: pointer;
}

.media-form { display: flex; flex-direction: column; gap: 18px; }
.basic-fields, .detailed-fields { display: flex; flex-direction: column; gap: 18px; }
.media-form label { display: flex; flex-direction: column; gap: 6px; color: var(--text-secondary); font-size: 13px; font-weight: 500; }
.input-wrapper, .textarea-wrapper { position: relative; }
.media-form input, .media-form textarea {
    width: 100%;
    color: var(--text-h);
    background: var(--bg);
    border: 1px solid var(--accent-border);
    border-radius: var(--radius-small);
    font: inherit;
}
.media-form input { min-height: 40px; padding: 9px 38px 9px 11px; }
.media-form textarea { min-height: 110px; padding: 10px 38px 10px 11px; resize: vertical; }
.media-form input::placeholder, .media-form textarea::placeholder { color: var(--text-muted); }
.media-form input:focus, .media-form textarea:focus { outline: 2px solid var(--accent); outline-offset: 1px; }

.clear-button {
    position: absolute;
    top: 50%;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    color: var(--text-muted);
    background: transparent;
    border: 0;
    border-radius: 50%;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    transform: translateY(-50%);
}
.clear-button:hover { color: var(--text-h); background: var(--bg-hover); }
.textarea-clear { top: 14px; transform: none; }

.external-search {
    padding: 14px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-small);
}
.external-search-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.external-search-header > div { display: flex; flex-direction: column; gap: 3px; }
.external-search-header strong { color: var(--text-h); font-size: 13px; }
.external-search-header span { color: var(--text-muted); font-size: 11px; }
.search-button, .search-tmdb-button {
    min-height: 38px;
    padding: 8px 14px;
    color: #fff;
    background: var(--accent);
    border: 1px solid var(--accent);
    border-radius: var(--radius-small);
    font: inherit;
    font-size: 13px;
    cursor: pointer;
}
.search-button:hover, .search-tmdb-button:hover { background: var(--accent-hover); }
.search-button:disabled, .search-tmdb-button:disabled { opacity: 0.5; cursor: not-allowed; }
.search-button.compact { flex-shrink: 0; }

.details-toggle {
    display: flex;
    align-items: center;
    align-self: flex-start;
    gap: 7px;
    padding: 0;
    color: var(--accent);
    background: transparent;
    border: 0;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
}
.details-toggle span { width: 16px; font-size: 18px; line-height: 1; text-align: center; }
.details-toggle:hover { text-decoration: underline; }

.tag-input {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    padding: 5px 8px;
    background: var(--bg);
    border: 1px solid var(--accent-border);
    border-radius: var(--radius-small);
}
.tag-input:focus-within { outline: 2px solid var(--accent); outline-offset: 1px; }
.tag-input input { flex: 1; min-width: 100px; min-height: 28px; padding: 3px; background: transparent; border: 0; outline: none; }
.tag { display: flex; align-items: center; gap: 5px; padding: 4px 7px; color: var(--text); background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; font-size: 11px; }
.tag button { padding: 0; color: var(--text-muted); background: transparent; border: 0; font-size: 14px; line-height: 1; cursor: pointer; }
.tag button:hover { color: var(--text-h); }

.recent-values { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; }
.recent-label { color: var(--text-muted); font-size: 11px; }
.recent-value { padding: 3px 7px; color: var(--text-secondary); background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; font: inherit; font-size: 11px; cursor: pointer; }
.recent-value:hover { color: var(--text-h); border-color: var(--accent); }
.field-help { color: var(--text-muted); font-size: 11px; font-weight: 400; }

.error { margin: 0; padding: 10px 12px; color: var(--danger); background: var(--danger-bg); border: 1px solid var(--danger); border-radius: var(--radius-small); font-size: 13px; }
.form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; padding-top: 18px; border-top: 1px solid var(--border); }
.form-actions button { min-height: 38px; padding: 8px 16px; font: inherit; font-size: 13px; border-radius: var(--radius-small); cursor: pointer; }
.primary-button { color: #fff; background: var(--accent); border: 1px solid var(--accent); }
.primary-button:hover { background: var(--accent-hover); }
.primary-button:disabled { opacity: 0.5; cursor: not-allowed; }
.secondary-button { color: var(--text); background: var(--bg-card); border: 1px solid var(--border); }
.secondary-button:hover { color: var(--text-h); background: var(--bg-hover); }

/* =========================================================
   TMDB MODAL
   ========================================================= */
.modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(0, 0, 0, 0.55);
}
.modal {
    width: 100%;
    max-width: 650px;
    max-height: calc(100vh - 40px);
    padding: 20px;
    overflow-y: auto;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}
.modal-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.modal-header h2 { margin: 0; color: var(--text-h); font-size: 20px; }
.close-button { width: 30px; height: 30px; padding: 0; color: var(--text-muted); background: transparent; border: 0; border-radius: 50%; font-size: 22px; cursor: pointer; }
.close-button:hover { color: var(--text-h); background: var(--bg-hover); }
.modal-description { margin: 0 0 14px; color: var(--text-muted); font-size: 12px; line-height: 1.5; }
.tmdb-search-row { display: flex; gap: 8px; }
.tmdb-search-row .input-wrapper { flex: 1; }
.search-input { width: 100%; min-height: 38px; padding: 8px 38px 8px 10px; color: var(--text-h); background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-small); font: inherit; }
.search-tmdb-button { flex-shrink: 0; }
.tmdb-results { display: flex; flex-direction: column; gap: 4px; max-height: 420px; margin-top: 12px; overflow-y: auto; }
.tmdb-result {
    display: flex;
    gap: 10px;
    padding: 8px;
    color: var(--text);
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-small);
    text-align: left;
}
.tmdb-result:hover { background: var(--bg-hover); border-color: var(--border); }
.tmdb-result img { width: 48px; height: 70px; flex-shrink: 0; object-fit: cover; border-radius: 3px; }
.tmdb-result-content { display: flex; flex: 1; flex-direction: column; align-items: flex-start; gap: 4px; }
.tmdb-result-content strong { color: var(--text-h); font-size: 13px; }
.tmdb-result-content span { color: var(--text-muted); font-size: 11px; }
.tmdb-result-content button { margin-top: 3px; padding: 5px 8px; color: var(--accent); background: transparent; border: 1px solid var(--accent); border-radius: var(--radius-small); font: inherit; font-size: 11px; cursor: pointer; }
.tmdb-result-content button:hover { color: #fff; background: var(--accent); }
.tmdb-selected h4 { margin: 0 0 10px; color: var(--text-h); font-size: 14px; }
.selected-movie { display: flex; align-items: center; gap: 12px; padding: 10px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-small); }
.selected-movie img { width: 60px; height: 88px; object-fit: cover; border-radius: 3px; }
.selected-movie strong { color: var(--text-h); font-size: 14px; }
.selected-movie p { margin: 4px 0 0; color: var(--text-muted); font-size: 12px; }
.tmdb-collection { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); }
.checkbox-label { display: flex; align-items: center; gap: 7px; color: var(--text); font-size: 13px; cursor: pointer; }
.checkbox-label input { width: auto; }
.collection-movies { margin-top: 12px; }
.collection-movies > p:first-child { margin: 0 0 8px; color: var(--text-muted); font-size: 11px; }
.collection-movie-card { margin-bottom: 4px; }
.collection-movie-card label { display: flex; align-items: center; gap: 8px; padding: 6px; color: var(--text); background: transparent; border: 1px solid transparent; border-radius: var(--radius-small); cursor: pointer; }
.collection-movie-card label:hover { background: var(--bg-hover); border-color: var(--border); }
.collection-movie-card input { width: auto; }
.collection-movie-card img { width: 34px; height: 50px; object-fit: cover; border-radius: 2px; }
.collection-movie-card label > div { display: flex; flex-direction: column; gap: 2px; }
.collection-movie-card strong { color: var(--text-h); font-size: 12px; }
.collection-movie-card span { color: var(--text-muted); font-size: 10px; }
.selection-count { margin: 8px 0 0; color: var(--text-muted); font-size: 11px; }

/* =========================================================
   SHARED IMPORT MODAL IMPROVEMENTS
   ========================================================= */

.modal-subtitle {
    margin: 3px 0 0;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 400;
}

.modal-empty {
    margin: 16px 0 4px;
    padding: 18px;
    color: var(--text-muted);
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-small);
    font-size: 12px;
    text-align: center;
}

/* Google Books results */

/* =========================================================
   GOOGLE BOOKS RESULTS
   ========================================================= */

.google-books-results {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 460px;
    margin-top: 14px;
    padding-right: 4px;
    overflow-y: auto;
}

.google-books-results .tmdb-result {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    width: 100%;
    min-height: 82px;
    padding: 8px;
    color: var(--text);
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-small);
    text-align: left;
}

.google-books-results .tmdb-result:hover {
    background: var(--bg-hover);
    border-color: var(--border);
}

.google-books-results .tmdb-result img {
    width: 52px;
    height: 76px;
    flex: 0 0 52px;
    object-fit: cover;
    border-radius: 3px;
}

.google-books-results .tmdb-result-content {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
    gap: 4px;
    padding-top: 1px;
}

.google-books-results .tmdb-result-content strong {
    display: block;
    width: 100%;
    color: var(--text-h);
    font-size: 13px;
    line-height: 1.35;
    overflow-wrap: anywhere;
}

.google-books-results .tmdb-result-content span {
    display: block;
    color: var(--text-muted);
    font-size: 11px;
    line-height: 1.3;
}

.google-books-results .tmdb-result-content button {
    position: static;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: flex-start;
    flex: 0 0 auto;
    width: auto;
    min-height: 28px;
    margin: 3px 0 0;
    padding: 4px 9px;
    color: var(--accent);
    background: transparent;
    border: 1px solid var(--accent);
    border-radius: var(--radius-small);
    font: inherit;
    font-size: 11px;
    line-height: 1.2;
    white-space: nowrap;
    cursor: pointer;
}

.google-books-results .tmdb-result-content button:hover {
    color: #fff;
    background: var(--accent);
}

/* Selected Google Book */

.google-book-selected {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
}

.selected-book-header h4 {
    margin: 0 0 10px;
    color: var(--text-h);
    font-size: 14px;
}

.selected-book {
    display: flex;
    gap: 16px;
    padding: 14px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-small);
}

.selected-book-cover {
    flex-shrink: 0;
}

.selected-book-cover img,
.book-cover-placeholder {
    width: 90px;
    height: 132px;
    object-fit: cover;
    border-radius: 4px;
}

.book-cover-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    background: var(--bg);
    border: 1px solid var(--border);
    font-size: 28px;
}

.selected-book-info {
    min-width: 0;
}

.selected-book-info h3 {
    margin: 0 0 10px;
    color: var(--text-h);
    font-size: 16px;
    line-height: 1.3;
}

.selected-book-info p {
    margin: 5px 0;
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.4;
}

.selected-book-info strong {
    color: var(--text-h);
}

.isbn-info {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--border);
}

.modal-actions {
    margin-top: 16px;
}

/* Make modal content comfortable on smaller screens */

@media (max-width: 600px) {

    .selected-book {
        gap: 12px;
        padding: 10px;
    }

    .selected-book-cover img,
    .book-cover-placeholder {
        width: 70px;
        height: 103px;
    }

    .selected-book-info h3 {
        font-size: 14px;
    }

}

@media (max-width: 600px) {
    .add-media { padding-bottom: 25px; }
    .category-buttons { grid-template-columns: 1fr; }
    .category-button { min-height: 80px; flex-direction: row; justify-content: flex-start; }
    .category-icon { font-size: 24px; }
    .external-search-header { align-items: flex-start; flex-direction: column; }
    .search-button.compact { width: 100%; }
    .tmdb-search-row { flex-direction: column; }
    .search-tmdb-button { width: 100%; }
    .form-actions { flex-direction: column-reverse; }
    .form-actions button { width: 100%; }
    .modal-backdrop { padding: 10px; }
    .modal { max-height: calc(100vh - 20px); padding: 15px; }
}
</style>
