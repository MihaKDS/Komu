<template>
    <div class="page">

        <Breadcrumbs
            :title="pageTitle"
        />

        <div class="edit-copy-page">

            <!-- =================================================
                 LOADING
                 ================================================= -->

            <div
                v-if="loading"
                class="loading"
            >
                Loading copy...
            </div>


            <!-- =================================================
                 ERROR
                 ================================================= -->

            <div
                v-else-if="error"
                class="error-panel"
            >
                <h2>Unable to load copy</h2>

                <p>
                    {{ error }}
                </p>

                <button
                    type="button"
                    class="secondary-button"
                    @click="goBack"
                >
                    Back
                </button>
            </div>


            <!-- =================================================
                 FORM
                 ================================================= -->

            <div
                v-else-if="copy"
                class="edit-copy"
            >

                <!-- Header -->

                <div class="page-header">

                    <div>
                        <h1>
                            Edit Copy
                        </h1>

                        <p class="page-subtitle">
                            Copy #{{ copy.id }}
                        </p>
                    </div>

                    <button
                        type="button"
                        class="secondary-button"
                        @click="goBack"
                    >
                        ← Back
                    </button>

                </div>


                <!-- =================================================
                     MEDIA REFERENCE
                     ================================================= -->

                <div class="media-reference">

                    <div class="media-reference-title">

                        <strong>
                            {{ copy.media?.title || "Unknown media" }}
                        </strong>

                        <span
                            v-if="copy.media?.releaseYear"
                        >
                            {{ copy.media.releaseYear }}
                        </span>

                    </div>

                    <span class="copy-id">
                        Copy #{{ copy.id }}
                    </span>

                </div>


                <!-- =================================================
                     COPY DETAILS
                     ================================================= -->

                <section class="edit-section">

                    <div class="section-title">
                        <h3>
                            Copy details
                        </h3>
                    </div>


                    <div class="contains">

                        <!-- Edition -->

                        <div class="detail-row">

                            <span class="detail-label">
                                Edition
                            </span>

                            <span class="detail-value">
                                {{ copy.edition }}
                            </span>

                        </div>


                        <!-- Includes Blu-ray -->

                        <div
                            v-if="copy.includesBluRay"
                            class="included-item"
                        >

                            <span>
                                Includes Blu-ray
                            </span>

                            <button
                                type="button"
                                class="small-button"
                                :disabled="saving"
                                @click="splitCopy"
                            >
                                Split
                            </button>

                        </div>


                        <!-- Box Set -->

                        <div
                            v-if="hasBoxSet"
                            class="included-item"
                        >

                            <span>
                                Part of
                            </span>

                            <RouterLink
                                :to="{
                                    name: 'boxset',
                                    params: {
                                        id: copy.boxSet.id
                                    },
                                    query: {
                                        from: 'collection-edit'
                                    }
                                }"
                            >
                                Box Set #{{ copy.boxSet.id }}
                            </RouterLink>

                        </div>

                    </div>


                    <!-- Condition -->

                    <div class="field">

                        <label for="condition">
                            Condition
                        </label>

                        <select
                            id="condition"
                            v-model="form.condition"
                        >
                            <option value="MINT">
                                Mint
                            </option>

                            <option value="VERY_GOOD">
                                Very Good
                            </option>

                            <option value="GOOD">
                                Good
                            </option>

                            <option value="FAIR">
                                Fair
                            </option>

                            <option value="POOR">
                                Poor
                            </option>
                        </select>

                    </div>


                    <!-- Listing note -->

                    <div class="field">

                        <div class="field-header">

                            <label for="listing-note">
                                Note about item
                            </label>

                            <span class="char-counter">
                                {{ form.listingNote?.length || 0 }}/50
                            </span>

                        </div>

                        <textarea
                            id="listing-note"
                            v-model="form.listingNote"
                            maxlength="50"
                            rows="2"
                            placeholder="Extended Edition with slipcover..."
                        ></textarea>

                    </div>

                </section>


                <!-- =================================================
                     SALE
                     ================================================= -->

                <section class="edit-section">

                    <div class="section-title">
                        <h3>
                            Sale
                        </h3>
                    </div>


                    <div class="option-card">

                        <label class="checkbox-label">

                            <input
                                type="checkbox"
                                v-model="form.canSell"
                            >

                            <span>
                                Offer for sale
                            </span>

                        </label>


                        <div
                            v-if="form.canSell"
                            class="price-field"
                        >

                            <label for="sell-price">
                                Price
                            </label>

                            <div class="price-input">

                                <input
                                    id="sell-price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    v-model.number="form.sellPrice"
                                >

                                <span>
                                    €
                                </span>

                            </div>

                        </div>

                    </div>

                </section>


                <!-- =================================================
                     ACTIONS
                     ================================================= -->

                <div class="form-actions">

                    <button
                        type="button"
                        class="primary-button"
                        :disabled="saving"
                        @click="saveCopy"
                    >
                        {{ saving ? "Saving..." : "Save" }}
                    </button>

                    <button
                        type="button"
                        class="secondary-button"
                        :disabled="saving"
                        @click="goBack"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        class="delete-button"
                        :disabled="saving"
                        @click="deleteCopy"
                    >
                        Delete
                    </button>

                </div>


                <p
                    v-if="saveError"
                    class="form-error"
                >
                    {{ saveError }}
                </p>

            </div>

        </div>

    </div>
</template>


<script setup>
import {
    computed,
    onMounted,
    reactive,
    ref,
} from "vue";

import {
    RouterLink,
    useRoute,
    useRouter,
} from "vue-router";

import Breadcrumbs from "../layout/Breadcrumbs.vue";

import {
    getCopyById,
    updateCopy,
    deleteCopyById,
    splitCopyById,
} from "../../api/copyAPI.js";


const route = useRoute();
const router = useRouter();


/* ============================================================
   STATE
   ============================================================ */

const copy = ref(null);

const loading = ref(true);
const saving = ref(false);

const error = ref("");
const saveError = ref("");


/* ============================================================
   FORM
   ============================================================ */

const form = reactive({
    canSell: false,
    sellPrice: null,

    listingNote: "",
    condition: "GOOD",

    canRent: false,
});


/* ============================================================
   COMPUTED
   ============================================================ */

const pageTitle = computed(() => {

    if (!copy.value) {
        return "Edit Copy";
    }

    return copy.value.media?.title
        ? `Edit ${copy.value.media.title}`
        : "Edit Copy";
});


const hasBoxSet = computed(() => {
    return copy.value?.boxSet != null;
});


/* ============================================================
   MAP COPY → FORM
   ============================================================ */

function mapCopyToForm(data) {

    form.canSell =
        data.canSell ?? false;

    form.sellPrice =
        data.sellPrice ?? null;

    form.listingNote =
        data.listingNote ?? "";

    form.condition =
        data.condition ?? "GOOD";

    form.canRent =
        data.canRent ?? false;

}


/* ============================================================
   LOAD COPY
   ============================================================ */

async function loadCopy() {

    loading.value = true;
    error.value = "";

    const id = Number(route.params.id);

    if (!Number.isInteger(id)) {

        error.value =
            "Invalid copy ID.";

        loading.value = false;

        return;
    }

    try {

        const data =
            await getCopyById(id);

        copy.value = data;

        mapCopyToForm(data);

        document.title =
            `Komu - Edit ${data.media?.title || "Copy"}`;

    } catch (err) {

        console.error(
            "Failed to load copy:",
            err
        );

        error.value =
            err.message ||
            "Unable to load this copy.";

    } finally {

        loading.value = false;
    }
}


/* ============================================================
   SAVE
   ============================================================ */

async function saveCopy() {

    if (!copy.value) {
        return;
    }

    saving.value = true;
    saveError.value = "";

    const payload = {

        canSell:
            form.canSell,

        sellPrice:
            form.canSell
                ? form.sellPrice
                : null,

        listingNote:
            form.listingNote,

        condition:
            form.condition,

        canRent:
            form.canRent,

    };


    try {

        await updateCopy(
            copy.value.id,
            payload
        );

        router.back();

    } catch (err) {

        console.error(
            "Failed to save copy:",
            err
        );

        saveError.value =
            err.message ||
            "Unable to save copy.";

    } finally {

        saving.value = false;
    }
}


/* ============================================================
   DELETE
   ============================================================ */

async function deleteCopy() {

    if (!copy.value) {
        return;
    }

    const confirmed =
        window.confirm(
            "Delete this copy?"
        );

    if (!confirmed) {
        return;
    }

    saving.value = true;
    saveError.value = "";

    try {

        await deleteCopyById(
            copy.value.id
        );

        router.back();

    } catch (err) {

        console.error(
            "Failed to delete copy:",
            err
        );

        saveError.value =
            err.message ||
            "Unable to delete copy.";

        saving.value = false;
    }
}


/* ============================================================
   SPLIT
   ============================================================ */

async function splitCopy() {

    if (!copy.value) {
        return;
    }

    const confirmed =
        window.confirm(
            "Split the included Blu-ray into a separate copy?"
        );

    if (!confirmed) {
        return;
    }

    saving.value = true;
    saveError.value = "";

    try {

        await splitCopyById(
            copy.value.id
        );

        /*
         * Reload rather than navigating away.
         * This lets the user see the resulting copy
         * state immediately.
         */

        await loadCopy();

    } catch (err) {

        console.error(
            "Failed to split copy:",
            err
        );

        saveError.value =
            err.message ||
            "Unable to split copy.";

    } finally {

        saving.value = false;
    }
}


/* ============================================================
   NAVIGATION
   ============================================================ */

function goBack() {
    router.back();
}


/* ============================================================
   INITIAL LOAD
   ============================================================ */

onMounted(loadCopy);

</script>


<style scoped>

.edit-copy-page {
    width: 100%;
    max-width: 700px;

    margin: 0 auto;

    overscroll-behavior: contain;
}


.edit-copy {
    width: 100%;

    padding: 24px;

    color: var(--text);
    background: var(--accent-bg);

    border: 2px solid var(--border);
    border-radius: var(--radius);

    box-shadow: var(--shadow);

    box-sizing: border-box;
}


/* =========================================================
   HEADER
   ========================================================= */

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 16px;

    margin-bottom: 20px;
}

.page-header h1 {
    margin: 0;

    color: var(--text-h);
}

.page-subtitle {
    margin: 4px 0 0;

    color: var(--text-muted);

    font-size: 13px;
}


/* =========================================================
   MEDIA REFERENCE
   ========================================================= */

.media-reference {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 12px;

    margin-bottom: 20px;
    padding: 11px 12px;

    background: var(--bg);

    border: 2px solid var(--border);
    border-radius: var(--radius-small);
}

.media-reference-title {
    display: flex;
    align-items: baseline;

    gap: 8px;

    min-width: 0;
}

.media-reference strong {
    color: var(--text-h);

    font-size: 15px;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.media-reference-title span,
.copy-id {
    color: var(--text-muted);

    font-size: 13px;

    white-space: nowrap;
}


/* =========================================================
   SECTIONS
   ========================================================= */

.edit-section {
    display: flex;
    flex-direction: column;

    gap: 14px;

    padding-top: 18px;

    border-top: 1px solid var(--border);
}

.edit-section + .edit-section {
    margin-top: 20px;
}

.section-title h3 {
    margin: 0;

    color: var(--text-h);

    font-size: 16px;
}


/* =========================================================
   COPY DETAILS
   ========================================================= */

.contains {
    display: flex;
    flex-direction: column;

    gap: 7px;
}

.detail-row {
    display: flex;
    flex-direction: column;

    gap: 2px;
}

.detail-label {
    color: var(--text-muted);

    font-size: 12px;
}

.detail-value {
    color: var(--text-h);

    font-weight: 600;
}

.included-item {
    display: flex;
    align-items: center;

    gap: 8px;

    padding: 7px 9px;

    color: var(--text-secondary);
    background: var(--bg-secondary);

    border: 2px solid var(--border);
    border-radius: var(--radius-small);

    font-size: 13px;
}

.included-item a {
    color: var(--accent);
}

.small-button {
    margin-left: auto;

    padding: 4px 8px;

    color: var(--text-h);
    background: var(--accent);

    border: 2px solid var(--border);
    border-radius: 4px;

    font-size: 11px;

    cursor: pointer;
}

.small-button:hover {
    background: var(--bg-hover);
}

.small-button:disabled {
    opacity: 0.5;

    cursor: not-allowed;
}


/* =========================================================
   FIELDS
   ========================================================= */

.field {
    display: flex;
    flex-direction: column;

    gap: 6px;
}

.field-header {
    display: flex;
    justify-content: space-between;

    gap: 10px;
}

.field label,
.price-field label {
    color: var(--text-secondary);

    font-size: 13px;
    font-weight: 500;
}

.field select,
.field textarea,
.price-input input {
    width: 100%;

    padding: 8px 10px;

    color: var(--text-h);
    background: var(--bg);

    border: 2px solid var(--border);
    border-radius: var(--radius-small);

    font: inherit;

    box-sizing: border-box;
}

.field select {
    height: 40px;
}

.field textarea {
    resize: vertical;

    min-height: 60px;
}

.field select:focus,
.field textarea:focus,
.price-input input:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
}

.char-counter {
    color: var(--text-muted);

    font-size: 11px;
}


/* =========================================================
   SALE / LENDING
   ========================================================= */

.option-card {
    display: flex;
    flex-direction: column;

    gap: 12px;

    padding: 12px;

    background: var(--bg-secondary);

    border: 2px solid var(--border);
    border-radius: var(--radius-small);
}

.checkbox-label {
    display: flex;
    align-items: center;

    gap: 9px;

    color: var(--text);

    cursor: pointer;
}

.checkbox-label input {
    width: 16px;
    height: 16px;

    accent-color: var(--accent);
}

.price-field {
    display: flex;
    flex-direction: column;

    gap: 6px;
}

.price-input {
    display: flex;
    align-items: center;

    gap: 7px;
}

.price-input input {
    max-width: 150px;
}

.price-input span {
    color: var(--text-secondary);

    font-size: 13px;
}

.rent-fields {
    display: grid;

    grid-template-columns:
        1fr 1fr;

    gap: 12px;
}


/* =========================================================
   ACTIONS
   ========================================================= */

.form-actions {
    display: flex;
    align-items: center;

    gap: 8px;

    margin-top: 24px;
    padding-top: 16px;

    border-top: 2px solid var(--border);
}

.primary-button,
.secondary-button,
.delete-button {
    min-height: 40px;

    padding: 8px 14px;

    border-radius: var(--radius-small);

    font: inherit;

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

.secondary-button {
    color: var(--text);
    background: var(--bg-secondary);

    border: 2px solid var(--border);
}

.secondary-button:hover {
    color: var(--text-h);
    background: var(--bg-hover);
}

.delete-button {
    margin-left: auto;

    color: var(--danger);
    background: var(--danger-bg);

    border: 1px solid var(--danger-bg);
}

.delete-button:hover {
    background: var(--danger-bg);
}

.primary-button:disabled,
.secondary-button:disabled,
.delete-button:disabled {
    opacity: 0.5;

    cursor: not-allowed;
}


/* =========================================================
   ERROR
   ========================================================= */

.error-panel {
    padding: 20px;

    background: var(--bg-secondary);

    border: 1px solid var(--border);
    border-radius: var(--radius);
}

.error-panel h2 {
    margin-top: 0;

    color: var(--text-h);
}

.error-panel p,
.form-error {
    color: var(--danger);

    font-size: 13px;
}

.form-error {
    margin-top: 12px;
}


/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 600px) {

    .edit-copy-page {
        max-width: none;
    }

    .edit-copy {
        padding: 18px;
    }

    .page-header {
        align-items: flex-start;
    }

    .page-header .secondary-button {
        white-space: nowrap;
    }

    .media-reference {
        align-items: flex-start;
        flex-direction: column;
    }

    .media-reference-title {
        flex-wrap: wrap;
    }

    .rent-fields {
        grid-template-columns: 1fr;
    }

    .form-actions {
        flex-direction: column-reverse;
        align-items: stretch;
    }

    .form-actions button {
        width: 100%;
    }

    .delete-button {
        margin-left: 0;
    }
}

</style>