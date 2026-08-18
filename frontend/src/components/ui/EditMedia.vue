<template>
    <div class="page media-edit-page">

        <Breadcrumbs title="Media Management" />

        <div class="page-header">
            <div>
                <h1>Media Management</h1>

                <p class="page-description">
                    Manage media, movie collections and metadata.
                </p>
            </div>

            <button
                type="button"
                class="tmdb-button"
                @click="openTmdbImport"
            >
                TMDB Import
            </button>
        </div>


        <!-- =====================================================
             COLLECTIONS
             ===================================================== -->

        <section class="management-section">

            <div class="section-header">
                <div>
                    <h2>Collections</h2>

                    <span class="section-count">
                        {{ filteredCollections.length }}
                    </span>
                </div>
            </div>


            <div class="collection-search-row">

                <input
                    v-model="collectionSearch"
                    type="text"
                    class="search-input"
                    placeholder="Search collections..."
                >

                <button
                    type="button"
                    class="create-button"
                    @click="createNewCollection"
                >
                    + Create new
                </button>

            </div>


            <div
                v-if="filteredCollections.length === 0"
                class="empty-state"
            >
                <span>
                    No collections found.
                </span>

                <button
                    type="button"
                    class="create-link"
                    @click="createNewCollection"
                >
                    Create new collection
                </button>
            </div>


            <div
                v-else
                class="collection-table"
            >

                <div class="table-header collection-row">

                    <span>ID</span>
                    <span>Collection</span>
                    <span>Titles</span>
                    <span>TMDB</span>
                    <span></span>

                </div>


                <article
                    v-for="collection in filteredCollections"
                    :key="collection.id"
                    class="collection-row table-row"
                >

                    <span class="id-cell">
                        #{{ collection.id }}
                    </span>


                    <div class="title-cell">

                        <strong>
                            {{ collection.title }}
                        </strong>

                        <span
                            v-if="collection.overview"
                            class="secondary-text"
                        >
                            {{ truncate(collection.overview, 100) }}
                        </span>

                    </div>


                    <span>
                        {{ collection.mediaCount ?? 0 }}
                    </span>


                    <span class="secondary-text">
                        {{ collection.tmdbId || "—" }}
                    </span>


                    <button
                        type="button"
                        class="edit-button"
                        @click="editCollection(collection)"
                    >
                        Edit
                    </button>

                </article>

            </div>

        </section>


        <!-- =====================================================
             MEDIA
             ===================================================== -->

        <section class="management-section">

            <div class="section-header">

                <div>
                    <h2>Media</h2>

                    <span class="section-count">
                        {{ filteredMedia.length }}
                    </span>
                </div>

            </div>


            <div class="media-filter-row">

                <input
                    v-model="mediaSearch"
                    type="text"
                    class="search-input"
                    placeholder="Search media..."
                >


                <select
                    v-model="mediaCategory"
                    class="category-select"
                >
                    <option value="ALL">
                        All
                    </option>

                    <option value="MOVIE">
                        Movies
                    </option>

                    <option value="TV_SHOW">
                        TV Shows
                    </option>

                    <option value="BOOK">
                        Books
                    </option>
                </select>

            </div>


            <div
                v-if="loading"
                class="loading"
            >
                Loading media...
            </div>


            <div
                v-else-if="filteredMedia.length === 0"
                class="empty-state"
            >
                No media found.
            </div>


            <div
                v-else
                class="media-table"
            >

                <div class="table-header media-row">

                    <span>ID</span>
                    <span>Title</span>
                    <span>Category</span>
                    <span>Year</span>
                    <span>Collection</span>
                    <span></span>

                </div>


                <article
                    v-for="media in filteredMedia"
                    :key="media.id"
                    class="media-row table-row"
                >

                    <span class="id-cell">
                        #{{ media.id }}
                    </span>


                    <div class="title-cell">

                        <strong>
                            {{ media.title }}
                        </strong>

                        <span
                            v-if="media.author"
                            class="secondary-text"
                        >
                            {{ media.author }}
                        </span>

                    </div>


                    <span>
                        {{ categoryLabel(media.category) }}
                    </span>


                    <span>
                        {{ media.releaseYear || "—" }}
                    </span>


                    <span class="collection-cell">

                        <template v-if="media.mediaCollection">

                            {{ media.mediaCollection.title }}

                            <span
                                v-if="media.collectionPosition != null"
                                class="position"
                            >
                                #{{ media.collectionPosition }}
                            </span>

                        </template>

                        <span v-else>
                            —
                        </span>

                    </span>


                    <button
                        type="button"
                        class="edit-button"
                        @click="editMedia(media)"
                    >
                        Edit
                    </button>

                </article>

            </div>

        </section>


        <!-- =====================================================
             TMDB IMPORT PLACEHOLDER
             ===================================================== -->
<div
    v-if="showMediaEdit"
    class="modal-backdrop"
    @click.self="closeMediaEdit"
>
    <div class="modal media-edit-modal">

        <div class="modal-header">

            <h2>
                Edit Media
                <span v-if="editingMedia">
                    #{{ editingMedia.id }}
                </span>
            </h2>

            <button
                type="button"
                class="close-button"
                :disabled="savingMedia || deletingMedia"
                @click="closeMediaEdit"
            >
                ×
            </button>

        </div>


        <div class="media-edit-form">

            <!-- TITLE -->

            <label>
                <span>Title</span>

                <input
                    v-model="mediaEditForm.title"
                    type="text"
                    placeholder="Title"
                >
            </label>


            <!-- CATEGORY -->

            <label>
                <span>Category</span>

                <select
                    v-model="mediaEditForm.category"
                >
                    <option value="MOVIE">
                        Movie
                    </option>

                    <option value="TV_SHOW">
                        TV Show
                    </option>

                    <option value="BOOK">
                        Book
                    </option>
                </select>
            </label>


            <!-- AUTHOR -->

            <label>
                <span>Author</span>

                <input
                    v-model="mediaEditForm.author"
                    type="text"
                    placeholder="Author"
                >
            </label>


            <!-- RELEASE YEAR -->

            <label>
                <span>Release year</span>

                <input
                    v-model="mediaEditForm.releaseYear"
                    type="number"
                    min="0"
                    max="9999"
                    placeholder="Year"
                >
            </label>


            <!-- DESCRIPTION -->

            <label>
                <span>Description</span>

                <textarea
                    v-model="mediaEditForm.description"
                    rows="5"
                    placeholder="Description"
                />
            </label>


            <!-- POSTER -->

            <label>
                <span>Poster URL</span>

                <input
                    v-model="mediaEditForm.poster"
                    type="text"
                    placeholder="https://..."
                >
            </label>


            <!-- POSTER PREVIEW -->

            <div
                v-if="mediaEditForm.poster"
                class="media-edit-poster-preview"
            >
                <img
                    :src="mediaEditForm.poster"
                    :alt="mediaEditForm.title"
                >
            </div>


            <!-- TMDB -->

            <label>
                <span>TMDB ID</span>

                <input
                    v-model="mediaEditForm.tmdbId"
                    type="number"
                    min="1"
                    placeholder="TMDB ID"
                >
            </label>


            <!-- COLLECTION -->

            <div
                v-if="editingMedia?.mediaCollection"
                class="media-edit-info"
            >

                <span>Collection</span>

                <strong>
                    {{ editingMedia.mediaCollection.title }}
                </strong>

                <small>
                    Position:
                    {{ editingMedia.collectionPosition ?? "—" }}
                </small>

            </div>


            <p
                v-if="mediaEditError"
                class="error"
            >
                {{ mediaEditError }}
            </p>

        </div>


        <!-- ACTIONS -->

        <div class="form-actions">

            <button
                type="button"
                class="delete-button"
                :disabled="savingMedia || deletingMedia"
                @click="deleteMediaEdit"
            >
                {{ deletingMedia ? "Deleting..." : "Delete" }}
            </button>


            <div class="form-actions-right">

                <button
                    type="button"
                    class="secondary-button"
                    :disabled="savingMedia || deletingMedia"
                    @click="closeMediaEdit"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    class="primary-button"
                    :disabled="
                        savingMedia ||
                        deletingMedia ||
                        !mediaEditForm.title.trim()
                    "
                    @click="saveMediaEdit"
                >
                    {{ savingMedia ? "Saving..." : "Save" }}
                </button>

            </div>

        </div>

    </div>
</div>
<div
    v-if="showCollectionEdit"
    class="modal-backdrop"
    @click.self="closeCollectionEdit"
>
    <div class="modal collection-edit-modal">

        <div class="modal-header">

            <h2>
                Edit Collection
                <span v-if="editingCollection">
                    #{{ editingCollection.id }}
                </span>
            </h2>

            <button
                type="button"
                class="close-button"
                :disabled="
                    savingCollection ||
                    deletingCollection
                "
                @click="closeCollectionEdit"
            >
                ×
            </button>

        </div>


        <div class="media-edit-form">

            <label>
                <span>Title</span>

                <input
                    v-model="collectionEditForm.title"
                    type="text"
                    placeholder="Collection title"
                >
            </label>


            <label>
                <span>Category</span>

                <select
                    v-model="collectionEditForm.category"
                >
                    <option value="MOVIE">
                        Movie
                    </option>

                    <option value="TV_SHOW">
                        TV Show
                    </option>

                    <option value="BOOK">
                        Book
                    </option>
                </select>
            </label>


            <label>
                <span>Poster URL</span>

                <input
                    v-model="collectionEditForm.poster"
                    type="text"
                    placeholder="https://..."
                >
            </label>


            <div
                v-if="collectionEditForm.poster"
                class="media-edit-poster-preview"
            >
                <img
                    :src="collectionEditForm.poster"
                    :alt="collectionEditForm.title"
                >
            </div>


            <label>
                <span>TMDB ID</span>

                <input
                    v-model="collectionEditForm.tmdbId"
                    type="number"
                    min="1"
                    placeholder="TMDB ID"
                >
            </label>


            <label>
                <span>Overview</span>

                <textarea
                    v-model="collectionEditForm.overview"
                    rows="5"
                    placeholder="Collection overview"
                />
            </label>


<!-- =================================================
     COLLECTION MEDIA
     ================================================= -->

<section class="collection-media-editor">

<div class="collection-media-header">

    <div>
        <h3>
            Collection media
        </h3>

        <span>
            {{ collectionMedia.length }}
            {{ collectionMedia.length === 1
                ? "title"
                : "titles"
            }}
        </span>
    </div>


    <button
        type="button"
        class="add-media-button"
        @click="openAddCollectionMedia"
    >
        + Add media
    </button>

</div>

    <div
        v-if="collectionMedia.length === 0"
        class="empty-state collection-empty"
    >
        No media in this collection.
    </div>


    <div
        v-else
        class="collection-media-list"
    >

        <div
            v-for="
                (item, index) in collectionMedia
            "
            :key="item.id"
            class="collection-media-item"
        >

            <span class="collection-position">
                {{ index + 1 }}
            </span>


            <img
                v-if="item.poster"
                :src="item.poster"
                :alt="item.title"
            >


            <div class="collection-media-info">

                <strong>
                    {{ item.title }}
                </strong>

                <span>
                    {{ item.releaseYear || "—" }}
                </span>

            </div>


            <div class="collection-media-actions">

                <button
                    type="button"
                    class="order-button"
                    :disabled="index === 0"
                    title="Move up"
                    @click="
                        moveCollectionMediaUp(index)
                    "
                >
                    ↑
                </button>


                <button
                    type="button"
                    class="order-button"
                    :disabled="
                        index ===
                        collectionMedia.length - 1
                    "
                    title="Move down"
                    @click="
                        moveCollectionMediaDown(index)
                    "
                >
                    ↓
                </button>


                <button
                    type="button"
                    class="remove-media-button"
                    @click="
                        removeCollectionMedia(index)
                    "
                >
                    Remove
                </button>

            </div>

        </div>

    </div>

</section>


            <p
                v-if="collectionEditError"
                class="error"
            >
                {{ collectionEditError }}
            </p>

        </div>


        <div class="form-actions">

            <button
                type="button"
                class="delete-button"
                :disabled="
                    savingCollection ||
                    deletingCollection
                "
                @click="deleteCollectionEdit"
            >
                {{
                    deletingCollection
                        ? "Deleting..."
                        : "Delete"
                }}
            </button>


            <div class="form-actions-right">

                <button
                    type="button"
                    class="secondary-button"
                    :disabled="
                        savingCollection ||
                        deletingCollection
                    "
                    @click="closeCollectionEdit"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    class="primary-button"
                    :disabled="
                        savingCollection ||
                        deletingCollection ||
                        !collectionEditForm.title.trim()
                    "
                    @click="saveCollectionEdit"
                >
                    {{
                        savingCollection
                            ? "Saving..."
                            : "Save"
                    }}
                </button>

            </div>

        </div>

    </div>
</div>
<div
    v-if="showAddCollectionMedia"
    class="modal-backdrop"
    @click.self="closeAddCollectionMedia"
>
    <div class="modal add-collection-media-modal">

        <div class="modal-header">

            <h2>
                Add Media
            </h2>

            <button
                type="button"
                class="close-button"
                @click="closeAddCollectionMedia"
            >
                ×
            </button>

        </div>


        <div class="add-media-search">

            <input
                v-model="collectionMediaSearch"
                type="text"
                placeholder="Search media..."
                autofocus
                @input="searchCollectionMedia"
            />

        </div>


        <div
            v-if="
                collectionMediaSearch &&
                collectionMediaSearchResults.length === 0
            "
            class="empty-state"
        >
            No media found.
        </div>


        <div
            v-else
            class="add-media-results"
        >

            <div
                v-for="
                    item in collectionMediaSearchResults
                "
                :key="item.id"
                class="add-media-result"
            >

                <img
                    v-if="item.poster"
                    :src="item.poster"
                    :alt="item.title"
                >


                <div class="add-media-result-info">

                    <strong>
                        {{ item.title }}
                    </strong>

                    <span>
                        <template
                            v-if="item.releaseYear"
                        >
                            {{ item.releaseYear }}
                        </template>

                        <template
                            v-if="
                                item.releaseYear &&
                                item.category
                            "
                        >
                            ·
                        </template>

                        {{ item.category }}
                    </span>


                    <span
                        v-if="
                            item.mediaCollection &&
                            item.mediaCollection.id !==
                                editingCollection?.id
                        "
                        class="collection-warning"
                    >
                        Already in:
                        {{ item.mediaCollection.title }}
                    </span>

                </div>


                <button
                    v-if="
                        !item.mediaCollection ||
                        item.mediaCollection.id ===
                            editingCollection?.id
                    "
                    type="button"
                    class="add-result-button"
                    @click="
                        addMediaToCollection(item)
                    "
                >
                    Add
                </button>


                <span
                    v-else
                    class="already-used-label"
                >
                    In collection
                </span>

            </div>

        </div>

    </div>
</div>
        <div
    v-if="showTmdbImport"
    class="modal-backdrop"
    @click.self="closeTmdbImport"
>
    <div class="modal">
        
        <div class="modal-header">

            <h2>TMDB Import</h2>

            <button
                type="button"
                class="close-button"
                @click="closeTmdbImport"
            >
                ×
            </button>

        </div>


        <!-- =================================================
             SEARCH
             ================================================= -->

        <template v-if="!selectedTmdbMovie">

            <p class="modal-description">
                Search TMDB to import movies into the database.
            </p>

            <div class="tmdb-search-row">

                <input
                    v-model.trim="tmdbSearch"
                    type="text"
                    class="search-input"
                    placeholder="Search movie..."
                    @keyup.enter="searchTmdb"
                >

                <button
                    type="button"
                    class="search-tmdb-button"
                    :disabled="
                        tmdbLoading ||
                        !tmdbSearch.trim()
                    "
                    @click="searchTmdb"
                >
                    {{ tmdbLoading ? "Searching..." : "Search" }}
                </button>

            </div>


            <p
                v-if="tmdbError"
                class="error"
            >
                {{ tmdbError }}
            </p>


            <div
                v-if="tmdbResults.length"
                class="tmdb-results"
            >

                <article
                    v-for="movie in tmdbResults"
                    :key="movie.id"
                    class="tmdb-result"
                >

                    <img
                        v-if="movie.poster"
                        :src="movie.poster"
                        :alt="movie.title"
                    >

                    <div class="tmdb-result-content">

                        <strong>
                            {{ movie.title }}
                        </strong>

                        <span>
                            {{ movie.releaseYear || "Release year unknown" }}
                        </span>

                        <button
                            type="button"
                            @click="selectTmdbMovie(movie)"
                        >
                            Use this title
                        </button>

                    </div>

                </article>

            </div>

        </template>


        <!-- =================================================
             SELECTED MOVIE
             ================================================= -->

        <template v-else>

            <div class="tmdb-selected">

                <h4>Selected TMDB movie</h4>

                <div class="selected-movie">

                    <img
                        v-if="selectedTmdbMovie.poster"
                        :src="selectedTmdbMovie.poster"
                        :alt="selectedTmdbMovie.title"
                    >

                    <div>

                        <strong>
                            {{ selectedTmdbMovie.title }}
                        </strong>

                        <p>
                            {{
                                selectedTmdbMovie.releaseYear ||
                                "Unknown year"
                            }}
                        </p>

                    </div>

                </div>


                <!-- =========================================
                     COLLECTION
                     ========================================= -->

                <div
                    v-if="tmdbCollection"
                    class="tmdb-collection"
                >

                    <h4>
                        Collection:
                        {{ tmdbCollection.title }}
                    </h4>

                    <label class="checkbox-label">

                        <input
                            v-model="importCollection"
                            type="checkbox"
                        >

                        Import collection movies

                    </label>


                    <div
                        v-if="
                            importCollection &&
                            tmdbCollectionMovies.length
                        "
                        class="collection-movies"
                    >

                        <p>
                            Select the movies you want to import:
                        </p>


                        <div
                            v-for="
                                movie in tmdbCollectionMovies
                            "
                            :key="movie.id"
                            class="collection-movie-card"
                        >

                            <label>

                                <input
                                    v-model="selectedCollectionMovieIds"
                                    type="checkbox"
                                    :value="movie.id"
                                >

                                <img
                                    v-if="movie.poster"
                                    :src="movie.poster"
                                    :alt="movie.title"
                                >

                                <div>

                                    <strong>
                                        {{ movie.title }}
                                    </strong>

                                    <span>
                                        {{
                                            movie.releaseYear ||
                                            "Release year unknown"
                                        }}
                                    </span>

                                </div>

                            </label>

                        </div>


                        <p class="selection-count">
                            {{ selectedCollectionMovieIds.length }}
                            movie(s) selected for import
                        </p>

                    </div>

                </div>


                <!-- =========================================
                     ACTIONS
                     ========================================= -->

                <div class="form-actions">

                    <button
                        type="button"
                        class="primary-button"
                        :disabled="importingTmdb"
                        @click="importTmdbMovies"
                    >
                        {{
                            importingTmdb
                                ? "Importing..."
                                : "Import"
                        }}
                    </button>


                    <button
                        type="button"
                        class="secondary-button"
                        :disabled="importingTmdb"
                        @click="resetTmdb"
                    >
                        Back to search
                    </button>

                </div>

            </div>

        </template>

    </div>
</div>

    </div>
</template>

<script setup>

import {
    computed,
    onMounted,
    ref,
} from "vue";

import {
    useRouter,
} from "vue-router";

import Breadcrumbs from "../layout/Breadcrumbs.vue";

import { createCollection, updateCollectionMedia, updateCollection, deleteCollectionById } from "../../api/collectionAPI.js";

import {
    createMedia,
    getAllMedia,
    updateMedia,
    deleteMediaById,
} from "../../api/mediaAPI.js";

import {
    searchTmdbMovies,
    getTmdbMovieDetails,
    getTmdbCollection,
} from "../../api/tmdbService.js";

const router = useRouter();

/* ============================================================
   STATE
   ============================================================ */
const showMediaEdit = ref(false);
const editingMedia = ref(null);
const savingMedia = ref(false);
const deletingMedia = ref(false);
const mediaEditError = ref("");

const showCollectionEdit = ref(false);
const editingCollection = ref(null);
const savingCollection = ref(false);
const deletingCollection = ref(false);
const collectionEditError = ref("");
const collectionSearchError = ref("");

const showAddCollectionMedia = ref(false);
const collectionMediaSearch = ref("");
const collectionMediaSearchResults = ref([]);
const searchingCollectionMedia = ref(false);
const collectionMediaSearchError = ref("");

const collectionMedia = ref([]);

const collectionEditForm = ref({
    title: "",
    category: "MOVIE",
    poster: "",
    tmdbId: null,
    overview: "",
});

const mediaEditForm = ref({
    title: "",
    category: "MOVIE",
    author: "",
    releaseYear: null,
    description: "",
    poster: "",
    tmdbId: null,
});

const loading = ref(true);

const media = ref([]);

const collections = ref([]);

const collectionSearch = ref("");

const mediaSearch = ref("");

const mediaCategory = ref("ALL");

/* ============================================================
   TMDB
   ============================================================ */

const showTmdbImport = ref(false);

const tmdbSearch = ref("");

const tmdbResults = ref([]);

const tmdbLoading = ref(false);

const tmdbError = ref("");

const selectedTmdbMovie = ref(null);

const tmdbCollection = ref(null);

const tmdbCollectionMovies = ref([]);

const importCollection = ref(false);

const selectedCollectionMovieIds = ref([]);

const importingTmdb = ref(false);

/* ============================================================
   LOAD
   ============================================================ */

async function loadData() {

    loading.value = true;

    try {

        const result =
            await getAllMedia();

        media.value =
            result || [];


        /*
         * Build collections from the media data
         * for now.
         *
         * If you already have a dedicated
         * MediaCollection API, replace this
         * with getMediaCollections().
         */

        const collectionMap =
            new Map();


        for (const item of media.value) {

            if (!item.mediaCollection) {
                continue;
            }

            const collection =
                item.mediaCollection;


            if (!collectionMap.has(collection.id)) {

                collectionMap.set(
                    collection.id,
                    {
                        ...collection,
                        mediaCount: 0,
                    }
                );

            }

            collectionMap
                .get(collection.id)
                .mediaCount++;

        }


        collections.value =
            [...collectionMap.values()];

    } catch (error) {

        console.error(
            "Failed to load media:",
            error
        );

        media.value = [];

        collections.value = [];

    } finally {

        loading.value = false;

    }

}

onMounted(loadData);

/* ============================================================
   FILTERED COLLECTIONS
   ============================================================ */

const filteredCollections = computed(() => {

    const value =
        collectionSearch.value
            .trim()
            .toLowerCase();


    if (!value) {
        return collections.value;
    }


    return collections.value.filter(
        collection => {

            return (

                collection.title
                    ?.toLowerCase()
                    .includes(value)

                ||

                String(collection.id)
                    .includes(value)

            );

        }
    );

});

/* ============================================================
   FILTERED MEDIA
   ============================================================ */

const filteredMedia = computed(() => {

    const value =
        mediaSearch.value
            .trim()
            .toLowerCase();


    return media.value.filter(item => {

        if (
            mediaCategory.value !== "ALL" &&
            item.category !== mediaCategory.value
        ) {
            return false;
        }


        if (!value) {
            return true;
        }


        return (

            item.title
                ?.toLowerCase()
                .includes(value)

            ||

            item.author
                ?.toLowerCase()
                .includes(value)

            ||

            String(item.id)
                .includes(value)

        );

    });

});

/* ============================================================
   LABELS
   ============================================================ */

function categoryLabel(category) {

    const labels = {

        MOVIE: "Movie",

        TV_SHOW: "TV Show",

        BOOK: "Book",

    };

    return labels[category] || category;

}

function truncate(text, length) {

    if (!text) {
        return "";
    }

    return text.length > length
        ? `${text.slice(0, length)}...`
        : text;

}

/* ============================================================
   MEDIA EDIT
   ============================================================ */

function editMedia(item) {
    editingMedia.value = item;

    mediaEditForm.value = {
        title: item.title || "",
        category: item.category || "MOVIE",
        author: item.author || "",
        releaseYear: item.releaseYear || null,
        description: item.description || "",
        poster: item.poster || "",
        tmdbId: item.tmdbId || null,
    };

    mediaEditError.value = "";
    showMediaEdit.value = true;
}
function closeMediaEdit() {
    if (savingMedia.value || deletingMedia.value) {
        return;
    }

    showMediaEdit.value = false;
    editingMedia.value = null;
    mediaEditError.value = "";
}
async function saveMediaEdit() {

    if (!editingMedia.value) {
        return;
    }

    savingMedia.value = true;
    mediaEditError.value = "";

    try {

        await updateMedia(
            editingMedia.value.id,
            {
                title:
                    mediaEditForm.value.title.trim(),

                category:
                    mediaEditForm.value.category,

                author:
                    mediaEditForm.value.author?.trim() ||
                    null,

                releaseYear:
                    mediaEditForm.value.releaseYear
                        ? Number(
                            mediaEditForm.value.releaseYear
                        )
                        : null,

                description:
                    mediaEditForm.value.description?.trim() ||
                    null,

                poster:
                    mediaEditForm.value.poster?.trim() ||
                    null,

                tmdbId:
                    mediaEditForm.value.tmdbId
                        ? Number(
                            mediaEditForm.value.tmdbId
                        )
                        : null,
            }
        );

        /*
         * Reload media so the management page immediately
         * reflects the changes.
         */
        await loadData();

        closeMediaEdit();

    } catch (error) {

        console.error(
            "Failed to update media:",
            error
        );

        mediaEditError.value =
            error.message ||
            "Failed to update media.";

    } finally {

        savingMedia.value = false;

    }
}
async function deleteMediaEdit() {

    if (!editingMedia.value) {
        return;
    }

    const confirmed =
        window.confirm(
            `Delete "${editingMedia.value.title}"?`
        );

    if (!confirmed) {
        return;
    }

    deletingMedia.value = true;
    mediaEditError.value = "";

    try {

        await deleteMediaById(
            editingMedia.value.id
        );

        await loadData();

        closeMediaEdit();

    } catch (error) {

        console.error(
            "Failed to delete media:",
            error
        );

        mediaEditError.value =
            error.message ||
            "Failed to delete media.";

    } finally {

        deletingMedia.value = false;

    }
}
/* ============================================================
   COLLECTION EDIT
   ============================================================ */
function editCollection(collection) {

    editingCollection.value = collection;

    collectionEditForm.value = {
        title: collection.title || "",
        category: collection.category || "MOVIE",
        poster: collection.poster || "",
        tmdbId: collection.tmdbId || null,
        overview: collection.overview || "",
    };

    /*
     * Create a local copy of the media belonging
     * to this collection.
     *
     * We do NOT modify media.value directly.
     */

    collectionMedia.value = media.value
        .filter(
            item =>
                item.mediaCollection?.id === collection.id
        )
        .sort(
            (a, b) =>
                (a.collectionPosition ?? 9999) -
                (b.collectionPosition ?? 9999)
        )
        .map(item => ({
            ...item,
        }));

    collectionEditError.value = "";
    showCollectionEdit.value = true;
}
function moveCollectionMediaUp(index) {

    if (index <= 0) {
        return;
    }

    const items = collectionMedia.value;

    [
        items[index - 1],
        items[index],
    ] = [
        items[index],
        items[index - 1],
    ];
}
function moveCollectionMediaDown(index) {

    if (
        index >=
        collectionMedia.value.length - 1
    ) {
        return;
    }

    const items = collectionMedia.value;

    [
        items[index],
        items[index + 1],
    ] = [
        items[index + 1],
        items[index],
    ];
}
function removeCollectionMedia(index) {

    collectionMedia.value.splice(
        index,
        1
    );
}
function openAddCollectionMedia() {
    showAddCollectionMedia.value = true;

    collectionMediaSearch.value = "";
    collectionMediaSearchResults.value = [];
    collectionMediaSearchError.value = "";
}
function closeAddCollectionMedia() {
    showAddCollectionMedia.value = false;

    collectionMediaSearch.value = "";
    collectionMediaSearchResults.value = [];
    collectionMediaSearchError.value = "";
}
function searchCollectionMedia() {
    const query =
        collectionMediaSearch.value
            .trim()
            .toLowerCase();

    if (!query) {
        collectionMediaSearchResults.value = [];
        return;
    }

    const selectedIds = new Set(
        collectionMedia.value.map(
            item => item.id
        )
    );

    collectionMediaSearchResults.value =
        media.value
            .filter(item => {

                if (selectedIds.has(item.id)) {
                    return false;
                }

                return (
                    item.title
                        ?.toLowerCase()
                        .includes(query)
                );
            })
            .slice(0, 20);
}
function addMediaToCollection(item) {
    const alreadyAdded =
        collectionMedia.value.some(
            mediaItem =>
                mediaItem.id === item.id
        );

    if (alreadyAdded) {
        return;
    }

    collectionMedia.value.push({
        ...item,
        collectionPosition:
            collectionMedia.value.length + 1,
    });

    collectionMediaSearchResults.value =
        collectionMediaSearchResults.value.filter(
            result =>
                result.id !== item.id
        );
}
function closeCollectionEdit() {

    if (
        savingCollection.value ||
        deletingCollection.value
    ) {
        return;
    }

    showCollectionEdit.value = false;

    editingCollection.value = null;

    collectionMedia.value = [];

    collectionEditError.value = "";
}
async function saveCollectionEdit() {
    if (!editingCollection.value) {
        return;
    }

    savingCollection.value = true;
    collectionEditError.value = "";

    try {
await updateCollection(
    editingCollection.value.id,
    {
        title:
            collectionEditForm.value.title.trim(),

        category:
            collectionEditForm.value.category,

        poster:
            collectionEditForm.value.poster.trim() || null,

        tmdbId:
            collectionEditForm.value.tmdbId
                ? Number(collectionEditForm.value.tmdbId)
                : null,

        overview:
            collectionEditForm.value.overview.trim() || null,
    }
);
await updateCollectionMedia(
    editingCollection.value.id,
    collectionMedia.value.map(item => item.id)
);

/*
 * Temporary:
 * show the final collection order in the console.
 *
 * Backend saving will be implemented next.
 */

const collectionMediaChanges =
    collectionMedia.value.map(
        (item, index) => ({
            mediaId: item.id,
            position: index + 1,
        })
    );

console.log(
    "Collection media changes:",
    collectionMediaChanges
);

        closeCollectionEdit();

        await loadData();

    } catch (error) {
        console.error(
            "Failed to update collection:",
            error
        );

        collectionEditError.value =
            error.message ||
            "Failed to update collection.";

    } finally {
        savingCollection.value = false;
    }
}
async function deleteCollectionEdit() {
    if (!editingCollection.value) {
        return;
    }

    const confirmed = window.confirm(
        `Delete "${editingCollection.value.title}"?\n\n` +
        "The collection must not contain any media."
    );

    if (!confirmed) {
        return;
    }

    deletingCollection.value = true;
    collectionEditError.value = "";

    try {
        await deleteCollectionById(
            editingCollection.value.id
        );

        closeCollectionEdit();

        await loadData();

    } catch (error) {
        console.error(
            "Failed to delete collection:",
            error
        );

        collectionEditError.value =
            error.message ||
            "Failed to delete collection.";

    } finally {
        deletingCollection.value = false;
    }
}
async function createNewCollection() {

    const title =
        collectionSearch.value.trim();

    if (!title) {
        return;
    }

    collectionSearchError.value = "";

    try {

        const collection =
            await createCollection({
                title,
                category: "MOVIE",
                poster: null,
                tmdbId: null,
                overview: null,
            });

        /*
         * Refresh collection list.
         */
        await loadData();

        /*
         * Open the collection editor immediately.
         */
        editCollection(collection);

        /*
         * Clear search.
         */
        collectionSearch.value = "";

    } catch (error) {

        console.error(
            "Failed to create collection:",
            error
        );

        collectionSearchError.value =
            error.message ||
            "Failed to create collection.";
    }
}

/* ============================================================
   TMDB
   ============================================================ */
function openTmdbImport() {

    showTmdbImport.value = true;

    tmdbSearch.value = "";

    tmdbResults.value = [];

    selectedTmdbMovie.value = null;

    tmdbCollection.value = null;

    tmdbCollectionMovies.value = [];

    selectedCollectionMovieIds.value = [];

    importCollection.value = false;

    tmdbError.value = "";

}
function closeTmdbImport() {
console.log("CLOSING TMDB MODAL");

    showTmdbImport.value = false;

}
async function searchTmdb() {

    if (!tmdbSearch.value.trim()) {
        return;
    }

    tmdbLoading.value = true;

    tmdbError.value = "";

    tmdbResults.value = [];

    try {

        tmdbResults.value =
            await searchTmdbMovies(
                tmdbSearch.value
            );

    } catch (searchError) {

        console.error(
            "TMDB search failed:",
            searchError
        );

        tmdbError.value =
            "Could not search TMDB.";

    } finally {

        tmdbLoading.value = false;

    }

}
async function selectTmdbMovie(movie) {

    tmdbError.value = "";

    tmdbLoading.value = true;

    try {

        const details =
            await getTmdbMovieDetails(movie.id);


        selectedTmdbMovie.value =
            details;


        const belongsToCollection =
            details.belongsToCollection || null;


        tmdbCollection.value =
            belongsToCollection
                ? {
                    id: belongsToCollection.id,

                    title: belongsToCollection.name,

                    poster:
                        belongsToCollection.poster_path
                            ? `https://image.tmdb.org/t/p/w342${belongsToCollection.poster_path}`
                            : null,
                }
                : null;


        tmdbCollectionMovies.value = [];

        selectedCollectionMovieIds.value = [];

        importCollection.value = false;


        if (tmdbCollection.value) {

            const collection =
                await getTmdbCollection(
                    tmdbCollection.value.id
                );


            tmdbCollection.value = {

                id: collection.id,

                title: collection.name,

                poster:
                    collection.poster_path
                        ? `https://image.tmdb.org/t/p/w342${collection.poster_path}`
                        : null,

            };


            tmdbCollectionMovies.value =
                (collection.parts || []).map(
                    part => ({

                        id: part.id,

                        title: part.title,

                        poster:
                            part.poster_path
                                ? `https://image.tmdb.org/t/p/w342${part.poster_path}`
                                : null,

                        releaseYear:
                            Number(
                                part.release_date?.slice(0, 4)
                            ) || null,

                    })
                );


            /*
             * Same behaviour as old Add Media:
             * everything is selected initially.
             */

            selectedCollectionMovieIds.value =
                tmdbCollectionMovies.value.map(
                    movie => movie.id
                );


            importCollection.value = true;

        }

    } catch (error) {

        console.error(
            "Failed to fetch TMDB details:",
            error
        );

        tmdbError.value =
            "Failed to load TMDB movie details.";

    } finally {

        tmdbLoading.value = false;

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

async function importTmdbMovies() {

    if (!selectedTmdbMovie.value) {
        return;
    }


    importingTmdb.value = true;

    tmdbError.value = "";


    try {

        /*
         * If the movie belongs to a collection and
         * collection import is enabled, create the
         * collection first.
         */

        let collectionId = null;


        if (
            importCollection.value &&
            tmdbCollection.value
        ) {

            const collection =
                await createCollection({

                    title:
                        tmdbCollection.value.title,

                    poster:
                        tmdbCollection.value.poster || null,

                    tmdbId:
                        tmdbCollection.value.id,

                    category:
                        "MOVIE",

                });


            collectionId =
                collection.id;

        }


        /*
         * Collection import
         */

        if (
            importCollection.value &&
            collectionId &&
            selectedCollectionMovieIds.value.length
        ) {

            const sortedMovies =
                [...tmdbCollectionMovies.value].sort(
                    (a, b) => {

                        const yearA =
                            a.releaseYear || 9999;

                        const yearB =
                            b.releaseYear || 9999;

                        return yearA - yearB;

                    }
                );


            const selectedMovies =
                sortedMovies.filter(
                    movie =>
                        selectedCollectionMovieIds.value
                            .includes(movie.id)
                );


            await Promise.all(

                selectedMovies.map(movie => {

                    const collectionPosition =
                        sortedMovies.findIndex(
                            item =>
                                item.id === movie.id
                        ) + 1;


                    return createMedia({

                        category: "MOVIE",

                        title:
                            movie.title,

                        author: null,

                        releaseYear:
                            movie.releaseYear || null,

                        description: "",

                        poster:
                            movie.poster || null,

                        tmdbId:
                            movie.id,

                        collectionId,

                        collectionPosition,

                    });

                })

            );
        } else {

            /*
             * No collection import.
             * Import only the selected movie.
             */

            const movie =
                selectedTmdbMovie.value;


            await createMedia({

                category: "MOVIE",

                title:
                    movie.title,

                author: null,

                releaseYear:
                    movie.releaseYear || null,

                description:
                    movie.description || "",

                poster:
                    movie.poster || null,

                tmdbId:
                    movie.id,

            });

        }


        /*
         * Reload the management page so the
         * newly imported media/collection appears.
         */

        closeTmdbImport();
        await loadData();


    } catch (error) {

        console.error(
            "TMDB import failed:",
            error
        );

        tmdbError.value =
            error.message ||
            "Failed to import TMDB data.";

    } finally {

        importingTmdb.value = false;

    }

}

</script>


<style scoped>

/* =========================================================
   PAGE
   ========================================================= */

.media-edit-page {
    padding-bottom: 50px;
}


/* =========================================================
   HEADER
   ========================================================= */

.page-header {

    display: flex;

    justify-content: space-between;

    align-items: flex-start;

    gap: 20px;

    margin-bottom: 28px;

}


.page-header h1 {

    margin: 0 0 5px;

}


.page-description {

    margin: 0;

    color: var(--text-muted);

    font-size: 13px;

}


.tmdb-button {

    flex-shrink: 0;

    padding: 9px 14px;

    color: #fff;

    background: var(--accent);

    border: 1px solid var(--accent);

    border-radius: var(--radius-small);

    font-size: 13px;

    cursor: pointer;

}


/* =========================================================
   SECTIONS
   ========================================================= */

.management-section {

    margin-bottom: 36px;

}


.section-header {

    display: flex;

    align-items: center;

    justify-content: space-between;

    margin-bottom: 10px;

}


.section-header > div {

    display: flex;

    align-items: center;

    gap: 8px;

}


.section-header h2 {

    margin: 0;

    font-size: 18px;

}


.section-count {

    min-width: 22px;

    padding: 2px 6px;

    color: var(--text-muted);

    background: var(--bg-card);

    border: 1px solid var(--border);

    border-radius: 10px;

    text-align: center;

    font-size: 11px;

}


/* =========================================================
   SEARCH
   ========================================================= */

.collection-search-row,
.media-filter-row {

    display: flex;

    gap: 8px;

    margin-bottom: 8px;

}


.search-input {

    flex: 1;

    min-width: 0;

    min-height: 38px;

    padding: 8px 10px;

    color: var(--text-h);

    background: var(--bg);

    border: 1px solid var(--border);

    border-radius: var(--radius-small);

    font: inherit;

}


.category-select {

    min-width: 130px;

    padding: 8px 10px;

    color: var(--text);

    background: var(--bg);

    border: 1px solid var(--border);

    border-radius: var(--radius-small);

}


.create-button {

    flex-shrink: 0;

    padding: 8px 13px;

    color: var(--text);

    background: var(--bg-card);

    border: 1px solid var(--border);

    border-radius: var(--radius-small);

    cursor: pointer;

}


.create-button:hover {

    background: var(--bg-hover);

}


/* =========================================================
   TABLE
   ========================================================= */

.collection-table,
.media-table {

    width: 100%;

    border: 1px solid var(--border);

    border-radius: var(--radius-small);

    overflow: hidden;

}


.collection-row,
.media-row {

    display: grid;

    align-items: center;

    gap: 12px;

}


.collection-row {

    grid-template-columns:
        60px
        minmax(180px, 1fr)
        80px
        80px
        60px;

}


.media-row {

    grid-template-columns:
        60px
        minmax(180px, 1.5fr)
        100px
        70px
        minmax(140px, 1fr)
        60px;

}


.table-header {

    min-height: 34px;

    padding: 0 10px;

    color: var(--text-muted);

    background: var(--bg-card);

    border-bottom: 1px solid var(--border);

    font-size: 11px;

    font-weight: 600;

    text-transform: uppercase;

}


.table-row {

    min-height: 48px;

    padding: 7px 10px;

    color: var(--text);

    border-bottom: 1px solid var(--border);

    font-size: 13px;

}


.table-row:last-child {

    border-bottom: none;

}


.table-row:hover {

    background: var(--bg-hover);

}


.id-cell {

    color: var(--text-muted);

    font-family: monospace;

    font-size: 12px;

}


.title-cell {

    display: flex;

    flex-direction: column;

    min-width: 0;

}


.title-cell strong {

    overflow: hidden;

    text-overflow: ellipsis;

    white-space: nowrap;

}


.secondary-text {

    overflow: hidden;

    color: var(--text-muted);

    text-overflow: ellipsis;

    white-space: nowrap;

    font-size: 11px;

}


.collection-cell {

    overflow: hidden;

    text-overflow: ellipsis;

    white-space: nowrap;

}


.position {

    margin-left: 4px;

    color: var(--text-muted);

}


.edit-button {

    justify-self: end;

    padding: 5px 9px;

    color: var(--accent);

    background: transparent;

    border: 1px solid var(--border);

    border-radius: var(--radius-small);

    font-size: 12px;

    cursor: pointer;

}


.edit-button:hover {

    background: var(--bg-card);

    border-color: var(--accent);

}


/* =========================================================
   EMPTY / LOADING
   ========================================================= */

.empty-state,
.loading {

    padding: 24px;

    color: var(--text-muted);

    background: var(--bg-card);

    border: 1px solid var(--border);

    border-radius: var(--radius-small);

    text-align: center;

    font-size: 13px;

}


.create-link {

    margin-left: 8px;

    padding: 0;

    color: var(--accent);

    background: none;

    border: none;

    cursor: pointer;

}


/* =========================================================
   MODAL
   ========================================================= */

.modal-backdrop {

    position: fixed;

    inset: 0;

    display: flex;

    align-items: center;

    justify-content: center;

    padding: 20px;

    background: rgba(0, 0, 0, 0.5);

    z-index: 1000;

}


.modal {

    width: min(600px, 100%);

    max-height: 85vh;

    padding: 20px;

    overflow-y: auto;

    background: var(--bg);

    border: 1px solid var(--border);

    border-radius: var(--radius);

    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);

}


.modal-header {

    display: flex;

    align-items: center;

    justify-content: space-between;

    margin-bottom: 8px;

}


.modal-header h2 {

    margin: 0;

}


.close-button {

    width: 30px;

    height: 30px;

    color: var(--text-muted);

    background: transparent;

    border: none;

    font-size: 22px;

    cursor: pointer;

}


.modal-description {

    margin: 0 0 15px;

    color: var(--text-muted);

    font-size: 13px;

}


.search-tmdb-button {

    width: 100%;

    margin-top: 8px;

    padding: 9px;

    color: #fff;

    background: var(--accent);

    border: 1px solid var(--accent);

    border-radius: var(--radius-small);

    cursor: pointer;

}


.search-tmdb-button:disabled {

    opacity: 0.5;

    cursor: not-allowed;

}


.tmdb-results {

    display: flex;

    flex-direction: column;

    gap: 8px;

    margin-top: 16px;

}


.tmdb-result {

    display: flex;

    gap: 12px;

    padding: 8px;

    border: 1px solid var(--border);

    border-radius: var(--radius-small);

}


.tmdb-result img {

    width: 50px;

    height: 75px;

    object-fit: cover;

}


.tmdb-result-content {

    display: flex;

    flex: 1;

    flex-direction: column;

    gap: 5px;

}


.tmdb-result-content span {

    color: var(--text-muted);

    font-size: 12px;

}


.tmdb-result-content button {

    align-self: flex-start;

    padding: 5px 9px;

    color: var(--accent);

    background: transparent;

    border: 1px solid var(--border);

    border-radius: var(--radius-small);

    cursor: pointer;

}


.error {

    margin-top: 10px;

    color: var(--danger);

    font-size: 13px;

}
.tmdb-search-row {
    display: flex;
    gap: 8px;
}

.tmdb-search-row .search-input {
    min-width: 0;
}

.tmdb-search-row .search-tmdb-button {
    width: auto;
    flex-shrink: 0;
    margin-top: 0;
}

.tmdb-selected {
    margin-top: 4px;

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

.checkbox-label {
    display: flex;

    align-items: center;

    gap: 8px;

    color: var(--text);

    font-size: 13px;

    cursor: pointer;
}

.checkbox-label input {
    width: 16px;
    height: 16px;

    min-width: 16px;
    min-height: 16px;

    accent-color: var(--accent);
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

.primary-button {
    color: #fff;

    background: var(--accent);

    border: 1px solid var(--accent);

    border-radius: var(--radius-small);

    cursor: pointer;
}

.primary-button:disabled {
    opacity: 0.5;

    cursor: not-allowed;
}

.secondary-button {
    color: var(--text);

    background: var(--bg-card);

    border: 1px solid var(--border);

    border-radius: var(--radius-small);

    cursor: pointer;
}

.secondary-button:disabled {
    opacity: 0.5;

    cursor: not-allowed;
}

.form-actions {
    display: flex;

    justify-content: flex-end;

    gap: 8px;

    margin-top: 16px;

    padding-top: 14px;

    border-top: 1px solid var(--border);
}
.media-edit-modal {
    max-width: 620px;
}

.media-edit-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.media-edit-form label {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.media-edit-form label > span,
.media-edit-info > span {
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
}

.media-edit-form input,
.media-edit-form select,
.media-edit-form textarea {
    width: 100%;
    box-sizing: border-box;
}

.media-edit-form textarea {
    resize: vertical;
    min-height: 100px;
}

.media-edit-poster-preview {
    display: flex;
    justify-content: center;

    padding: 10px;
}

.media-edit-poster-preview img {
    width: 100px;
    max-height: 150px;

    object-fit: cover;

    border-radius: var(--radius-small);
}

.media-edit-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    padding: 10px;

    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-small);
}

.media-edit-info strong {
    color: var(--text-h);
}

.media-edit-info small {
    color: var(--text-muted);
}

.form-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;

    margin-top: 16px;
    padding-top: 14px;

    border-top: 1px solid var(--border);
}

.form-actions-right {
    display: flex;
    gap: 8px;
}

.delete-button {
    color: #fff;
    background: #a33;

    border: 1px solid #a33;
    border-radius: var(--radius-small);

    cursor: pointer;
}

.delete-button:disabled,
.primary-button:disabled,
.secondary-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
.collection-media-editor {
    margin-top: 20px;
}

.collection-media-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    margin-bottom: 10px;
}

.collection-media-header h3 {
    margin: 0;

    color: var(--text-h);
    font-size: 14px;
}

.collection-media-header span {
    color: var(--text-muted);
    font-size: 12px;
}

.collection-media-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.collection-media-item {
    display: grid;

    grid-template-columns:
        28px
        42px
        minmax(0, 1fr)
        auto;

    align-items: center;

    gap: 9px;

    padding: 7px;

    background: var(--bg-card);

    border: 1px solid var(--border);

    border-radius: var(--radius-small);
}

.collection-position {
    color: var(--text-muted);

    font-family: monospace;

    font-size: 12px;

    text-align: center;
}

.collection-media-item img {
    width: 42px;
    height: 60px;

    object-fit: cover;

    background: var(--bg-secondary);

    border-radius: 3px;
}

.collection-media-info {
    min-width: 0;

    display: flex;
    flex-direction: column;

    gap: 3px;
}

.collection-media-info strong {
    overflow: hidden;

    color: var(--text-h);

    font-size: 13px;

    text-overflow: ellipsis;
    white-space: nowrap;
}

.collection-media-info span {
    color: var(--text-muted);

    font-size: 11px;
}

.collection-media-actions {
    display: flex;
    align-items: center;

    gap: 4px;
}

.order-button {
    width: 30px;
    height: 30px;

    padding: 0;

    color: var(--text);

    background: var(--bg-secondary);

    border: 1px solid var(--border);

    border-radius: var(--radius-small);

    font-size: 16px;

    cursor: pointer;
}

.order-button:hover:not(:disabled) {
    color: var(--text-h);

    background: var(--bg-hover);

    border-color: var(--accent);
}

.order-button:disabled {
    opacity: 0.3;

    cursor: not-allowed;
}

.remove-media-button {
    margin-left: 5px;

    padding: 6px 9px;

    color: var(--danger);

    background: transparent;

    border: 1px solid var(--border);

    border-radius: var(--radius-small);

    font-size: 11px;

    cursor: pointer;
}

.remove-media-button:hover {
    background: var(--bg-hover);

    border-color: var(--danger);
}
.add-media-button {
    padding: 6px 10px;

    color: var(--text-h);

    background: var(--bg-secondary);

    border: 1px solid var(--border);

    border-radius: var(--radius-small);

    font-size: 12px;

    cursor: pointer;
}

.add-media-button:hover {
    border-color: var(--accent);
    background: var(--bg-hover);
}

.add-collection-media-modal {
    width: min(600px, 100%);
}

.add-media-search {
    margin-bottom: 12px;
}

.add-media-search input {
    width: 100%;
    box-sizing: border-box;
}

.add-media-results {
    display: flex;
    flex-direction: column;
    gap: 6px;

    max-height: 500px;
    overflow-y: auto;
}

.add-media-result {
    display: grid;

    grid-template-columns:
        42px
        minmax(0, 1fr)
        auto;

    align-items: center;

    gap: 10px;

    padding: 7px;

    border: 1px solid var(--border);

    border-radius: var(--radius-small);

    background: var(--bg-card);
}

.add-media-result img {
    width: 42px;
    height: 60px;

    object-fit: cover;

    border-radius: 3px;

    background: var(--bg-secondary);
}

.add-media-result-info {
    min-width: 0;

    display: flex;
    flex-direction: column;

    gap: 3px;
}

.add-media-result-info strong {
    overflow: hidden;

    color: var(--text-h);

    font-size: 13px;

    text-overflow: ellipsis;
    white-space: nowrap;
}

.add-media-result-info span {
    color: var(--text-muted);

    font-size: 11px;
}

.collection-warning {
    color: var(--warning) !important;
}

.add-result-button {
    padding: 6px 10px;

    color: var(--text-h);

    background: var(--bg-secondary);

    border: 1px solid var(--border);

    border-radius: var(--radius-small);

    cursor: pointer;
}

.add-result-button:hover {
    border-color: var(--accent);
    background: var(--bg-hover);
}

.already-used-label {
    color: var(--text-muted);

    font-size: 11px;
    white-space: nowrap;
}
@media (max-width: 600px) {

    .media-edit-modal {
        width: calc(100% - 20px);
        max-height: 90vh;
        overflow-y: auto;
    }

    .form-actions {
        align-items: stretch;
        flex-direction: column;
    }

    .form-actions-right {
        width: 100%;
    }

    .form-actions-right button {
        flex: 1;
    }
    .collection-media-item {
        grid-template-columns:
            24px
            36px
            minmax(0, 1fr);
    }

    .collection-media-item img {
        width: 36px;
        height: 52px;
    }

    .collection-media-actions {
        grid-column: 3;

        justify-content: flex-end;
    }
}
/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 700px) {

    .page-header {

        flex-direction: column;

    }


    .tmdb-button {

        width: 100%;

    }


    .collection-search-row,
    .media-filter-row {

        flex-wrap: wrap;

    }


    .category-select {

        width: 100%;

    }


    /*
     * Hide the database columns on mobile.
     * The important information remains visible.
     */

    .collection-table .table-header,
    .collection-table .table-row {

        grid-template-columns:
            45px
            minmax(0, 1fr)
            55px;

    }


    .collection-table .table-header span:nth-child(4),
    .collection-table .table-row > span:nth-child(4) {

        display: none;

    }


    .media-table .table-header,
    .media-table .table-row {

        grid-template-columns:
            45px
            minmax(0, 1fr)
            55px
            55px;

    }


    .media-table .table-header span:nth-child(3),
    .media-table .table-row > span:nth-child(3),
    .media-table .table-header span:nth-child(5),
    .media-table .table-row > span:nth-child(5) {

        display: none;

    }


    .tmdb-search-row {
        flex-direction: column;
    }

    .tmdb-search-row .search-tmdb-button {
        width: 100%;
    }

    .form-actions {
        flex-direction: column;
    }

    .form-actions button {
        width: 100%;
    }


}
</style>