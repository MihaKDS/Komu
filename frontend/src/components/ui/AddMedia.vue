<template>
    <div class="add-media">

        <Breadcrumbs title="Add Media" />

        <h1>Add Media</h1>

        <p class="help-text">
            Add a basic media entry so you can add it to your collection.
            More information can be added later.
        </p>


        <form
            class="media-form"
            @submit.prevent="saveMedia"
        >

            <!-- =================================================
                 CATEGORY
                 ================================================= -->

            <label>
                Category

                <select
                    v-model="form.category"
                    required
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


            <!-- =================================================
                 TITLE
                 ================================================= -->

            <label>
                Title

                <input
                    v-model.trim="form.title"
                    type="text"
                    required
                    placeholder="Title"
                    autocomplete="off"
                >
            </label>


            <!-- =================================================
                 AUTHOR
                 ================================================= -->

            <label v-if="form.category === 'BOOK'">

                Author

                <input
                    v-model.trim="form.author"
                    type="text"
                    :required="form.category === 'BOOK'"
                    placeholder="Author"
                    autocomplete="off"
                >

            </label>


            <!-- =================================================
                 RELEASE YEAR
                 ================================================= -->

            <label>

                Release year

                <input
                    v-model.number="form.releaseYear"
                    type="number"
                    min="1"
                    :required="
                        form.category === 'MOVIE' ||
                        form.category === 'TV_SHOW'
                    "
                    placeholder="Year"
                >

                <span
                    v-if="form.category === 'BOOK'"
                    class="field-help"
                >
                    Optional. Leave empty if you don't know the
                    publication year.
                </span>

            </label>


            <!-- =================================================
                 ERROR
                 ================================================= -->

            <p
                v-if="error"
                class="error"
            >
                {{ error }}
            </p>


            <!-- =================================================
                 ACTIONS
                 ================================================= -->

            <div class="form-actions">

                <button
                    type="button"
                    class="secondary-button"
                    @click="goBack"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    class="primary-button"
                    :disabled="saving || !isFormValid"
                >
                    {{ saving ? "Adding..." : "Add media" }}
                </button>

            </div>

        </form>

    </div>
</template>


<script setup>

import {
    computed,
    reactive,
    ref,
} from "vue";

import {
    useRouter,
} from "vue-router";

import Breadcrumbs from "../layout/Breadcrumbs.vue";

import {
    createMedia,
} from "../../api/mediaAPI.js";


const router = useRouter();


/* ============================================================
   FORM
   ============================================================ */

const form = reactive({

    category: "MOVIE",

    title: "",

    author: "",

    releaseYear: null,

});


/* ============================================================
   STATE
   ============================================================ */

const saving = ref(false);

const error = ref("");



/* ============================================================
   VALIDATION
   ============================================================ */

const isFormValid = computed(() => {

    if (!form.title.trim()) {
        return false;
    }


    /*
     * Movies and TV shows need a release year.
     */

    if (
        form.category === "MOVIE" ||
        form.category === "TV_SHOW"
    ) {

        if (
            !Number.isInteger(
                form.releaseYear
            ) ||
            form.releaseYear <= 0
        ) {
            return false;
        }

    }


    /*
     * Books need an author.
     */

    if (
        form.category === "BOOK" &&
        !form.author.trim()
    ) {
        return false;
    }


    return true;

});



/* ============================================================
   CATEGORY CHANGE
   ============================================================ */

function handleCategoryChange() {

    /*
     * When changing away from Book,
     * don't accidentally carry an author
     * into a movie or TV show.
     */

    if (form.category !== "BOOK") {
        form.author = "";
    }

}



/* ============================================================
   NAVIGATION
   ============================================================ */

function goBack() {

    router.back();

}



/* ============================================================
   SAVE
   ============================================================ */

async function saveMedia() {

    error.value = "";


    if (!isFormValid.value) {

        if (!form.title.trim()) {

            error.value =
                "Title is required.";

            return;
        }


        if (
            form.category === "BOOK" &&
            !form.author.trim()
        ) {

            error.value =
                "Author is required for books.";

            return;
        }


        if (
            form.category === "MOVIE" ||
            form.category === "TV_SHOW"
        ) {

            error.value =
                "Release year is required for movies and TV shows.";

            return;
        }

    }


    saving.value = true;


    try {

        const media = await createMedia({

            category:
                form.category,

            title:
                form.title.trim(),

            author:
                form.category === "BOOK"
                    ? form.author.trim()
                    : null,

            releaseYear:
                form.releaseYear
                    ? Number(form.releaseYear)
                    : null

        });


        /*
         * Go directly to the newly created
         * media page so the user can add
         * their copy immediately.
         */

        router.push({

            name: "media",

            params: {
                id: media.id,
            },

        });

    } catch (saveError) {

        console.error(
            "Failed to add media:",
            saveError
        );

        error.value =
            saveError.message ||
            "Failed to add media.";

    } finally {

        saving.value = false;

    }

}

</script>


<style scoped>

/* =========================================================
   PAGE
   ========================================================= */

.add-media {

    width: 100%;

    max-width: 700px;

    margin: 0 auto;

    padding-bottom: 40px;

}


/* =========================================================
   HEADER
   ========================================================= */

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


/* =========================================================
   FORM
   ========================================================= */

.media-form {

    display: flex;

    flex-direction: column;

    gap: 16px;

}


.media-form > label {

    display: flex;

    flex-direction: column;

    gap: 6px;

    color: var(--text-secondary);

    font-size: 13px;

    font-weight: 500;

}


.media-form input,
.media-form select {

    width: 100%;

    min-height: 40px;

    padding: 9px 11px;

    color: var(--text-h);

    background: var(--bg);

    border: 1px solid var(--border);

    border-radius: var(--radius-small);

    font: inherit;

}


.media-form input::placeholder {

    color: var(--text-muted);

}


.media-form input:focus,
.media-form select:focus {

    outline: 2px solid var(--accent);

    outline-offset: 1px;

}


.field-help {

    color: var(--text-muted);

    font-size: 11px;

    font-weight: 400;

}


/* =========================================================
   ERROR
   ========================================================= */

.error {

    margin: 0;

    padding: 10px 12px;

    color: var(--danger);

    background: var(--danger-bg);

    border: 1px solid var(--danger);

    border-radius: var(--radius-small);

    font-size: 13px;

}


/* =========================================================
   ACTIONS
   ========================================================= */

.form-actions {

    display: flex;

    justify-content: flex-end;

    gap: 8px;

    margin-top: 8px;

    padding-top: 18px;

    border-top: 1px solid var(--border);

}


.form-actions button {

    min-height: 38px;

    padding: 8px 16px;

    font: inherit;

    font-size: 13px;

    border-radius: var(--radius-small);

    cursor: pointer;

}


.primary-button {

    color: #fff;

    background: var(--accent);

    border: 1px solid var(--accent);

}


.primary-button:hover {

    background: var(--accent-hover);

}


.primary-button:disabled {

    opacity: 0.5;

    cursor: not-allowed;

}


.secondary-button {

    color: var(--text);

    background: var(--bg-card);

    border: 1px solid var(--border);

}


.secondary-button:hover {

    color: var(--text-h);

    background: var(--bg-hover);

}


/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 600px) {

    .add-media {

        padding-bottom: 25px;

    }


    .form-actions {

        flex-direction: column-reverse;

    }


    .form-actions button {

        width: 100%;

    }

}

</style>