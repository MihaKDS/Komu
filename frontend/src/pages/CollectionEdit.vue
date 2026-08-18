<template>
    <div class="page collection-edit-page">

        <Breadcrumbs />

        <div class="page-header">
            <div>
                <h1>Collection Edit</h1>
                <p class="page-subtitle">
                    Manage your copies and box sets.
                </p>
            </div>

            <span class="item-count">
                {{ allCopies.length }} copies
            </span>
        </div>


        <!-- =====================================================
             TOOLBAR
             ===================================================== -->

        <div class="toolbar">

            <div class="search-wrapper">
                <input
                    v-model="search"
                    type="search"
                    placeholder="Search collection..."
                >
            </div>

            <div
                v-if="selectedCopyIds.length > 0"
                class="selection-info"
            >
                <strong>
                    {{ selectedCopyIds.length }}
                </strong>

                selected
            </div>

        </div>


        <!-- =====================================================
             BULK ACTIONS
             ===================================================== -->

        <div
            v-if="selectedCopyIds.length > 0"
            class="bulk-toolbar"
        >

            <div class="bulk-count">
                {{ selectedCopyIds.length }} selected
            </div>

            <div class="bulk-actions">

                <button
                    type="button"
                    @click="openPriceDialog"
                >
                    Set price
                </button>

                <button
                    type="button"
                    @click="removeFromSale"
                >
                    Remove from sale
                </button>

                <button
                    type="button"
                    class="danger-button"
                    @click="deleteSelected"
                >
                    Delete
                </button>

                <button
                    type="button"
                    class="clear-button"
                    @click="clearSelection"
                >
                    Clear
                </button>

            </div>

        </div>


        <!-- =====================================================
             LOADING
             ===================================================== -->

        <div
            v-if="loading"
            class="loading"
        >
            Loading collection...
        </div>


        <!-- =====================================================
             EMPTY
             ===================================================== -->

        <div
            v-else-if="filteredBoxSets.length === 0 && filteredStandalone.length === 0"
            class="empty"
        >
            No items match your search.
        </div>


        <template v-else>
            <!--<label class="select-all">

                <input
                    type="checkbox"
                    :checked="allVisibleSelected"
                    :indeterminate="someVisibleSelected"
                    @change="toggleSelectAll"
                >

                Select all

            </label>-->
            <!-- =================================================
                 BOX SETS
                 ================================================= -->

            <section
                v-if="filteredBoxSets.length"
                class="collection-section"
            >

                <div class="section-header">
                    <h2>Box Sets</h2>
                </div>


                <div class="table">

                    <!-- Desktop header -->

                    <div class="table-header">

                        <span></span>
                        <span>ID</span>
                        <span>Title</span>
                        <span>Format</span>
                        <span>Copies</span>
                        <span>Note</span>
                        <span>Price</span>
                        <span></span>

                    </div>
                    

                    <!-- Box sets -->

                    <div
                        v-for="boxSet in filteredBoxSets"
                        :key="`boxset-${boxSet.id}`"
                        class="boxset-group"
                    >

                        <!-- Box set row -->

                        <div
                            class="table-row boxset-row"
                            @click="toggleBoxSet(boxSet.id)"
                        >

                            <button
                                type="button"
                                class="expand-button"
                                @click.stop="toggleBoxSet(boxSet.id)"
                                :aria-label="
                                    expandedBoxSets.has(boxSet.id)
                                        ? 'Collapse box set'
                                        : 'Expand box set'
                                "
                            >
                                {{ expandedBoxSets.has(boxSet.id) ? "▼" : "▶" }}
                            </button>


                            <span class="item-id">
                                #{{ boxSet.id }}
                            </span>


                            <div class="title-cell">

                                <strong>
                                    {{ boxSetDisplayTitle(boxSet) }}
                                </strong>

                                <span class="mobile-secondary">
                                    {{ boxSet.copies.length }}
                                    {{ boxSet.copies.length === 1 ? "copy" : "copies" }}
                                </span>

                            </div>


                            <span class="format-cell">
                                {{ boxSetFormats(boxSet) }}
                            </span>


                            <span class="copy-count">
                                {{ boxSet.copies.length }}
                            </span>


                            <span
                                class="note-cell"
                                :title="boxSet.listingNote || ''"
                            >
                                {{ boxSet.listingNote || "—" }}
                            </span>


                            <span
                                class="price-cell"
                                :class="{ selling: boxSet.canSell }"
                            >
                                {{
                                    boxSet.canSell && boxSet.sellPrice != null
                                        ? `${boxSet.sellPrice} €`
                                        : "—"
                                }}
                            </span>


                            <button
                                type="button"
                                class="edit-button"
                                @click.stop="editBoxSet(boxSet)"
                            >
                                Edit
                            </button>

                        </div>


                        <!-- Copies -->

                        <div
                            v-if="expandedBoxSets.has(boxSet.id)"
                            class="boxset-copies"
                        >

                            <div
                                v-for="copy in boxSet.copies"
                                :key="`copy-${copy.id}`"
                                class="table-row copy-row"
                            >

                                <label
                                    class="selection-checkbox"
                                    @click.stop
                                >
                                    <input
                                        type="checkbox"
                                        :checked="isSelected(copy.id)"
                                        @change="toggleCopy(copy)"
                                    >
                                </label>


                                <span class="item-id">
                                    #{{ copy.id }}
                                </span>


                                <div class="title-cell">

                                    <span>
                                        {{ copy.media?.title || "Unknown title" }}
                                    </span>

                                    <span
                                        v-if="copy.listingNote"
                                        class="mobile-secondary"
                                    >
                                        {{ copy.listingNote }}
                                    </span>

                                </div>


                                <span class="format-cell">
                                    {{ formatLabel(copy.edition) }}
                                </span>


                                <span class="condition-cell">
                                    {{ conditionLabel(copy.condition) }}
                                </span>


                                <span
                                    class="note-cell"
                                    :title="copy.listingNote || ''"
                                >
                                    {{ copy.listingNote || "—" }}
                                </span>


                                <span
                                    class="price-cell"
                                    :class="{ selling: copy.canSell }"
                                >
                                    {{
                                        copy.canSell && copy.sellPrice != null
                                            ? `${copy.sellPrice} €`
                                            : "—"
                                    }}
                                </span>


                                <button
                                    type="button"
                                    class="edit-button"
                                    @click="editCopy(copy)"
                                >
                                    Edit
                                </button>

                                <span></span>

                            </div>

                        </div>

                    </div>

                </div>

            </section>


            <!-- =================================================
                 STANDALONE COPIES
                 ================================================= -->

            <section
                v-if="filteredStandalone.length"
                class="collection-section"
            >

                <div class="section-header">
                    <h2>Standalone Copies</h2>

                </div>


                <div class="table">

                    <div class="table-header">

                        <span></span>
                        <span>ID</span>
                        <span>Title</span>
                        <span>Format</span>
                        <span>Condition</span>
                        <span>Note</span>
                        <span>Price</span>
                        <span></span>

                    </div>


                    <div
                        v-for="copy in filteredStandalone"
                        :key="`standalone-${copy.id}`"
                        class="table-row copy-row standalone-row"
                    >

                        <label
                            class="selection-checkbox"
                            @click.stop
                        >
                            <input
                                type="checkbox"
                                :checked="isSelected(copy.id)"
                                @change="toggleCopy(copy)"
                            >
                        </label>


                        <span class="item-id">
                            #{{ copy.id }}
                        </span>


                        <div class="title-cell">

                            <strong>
                                {{ copy.media?.title || "Unknown title" }}
                            </strong>

                            <span class="mobile-secondary">
                                {{ copy.media?.releaseYear || "" }}
                            </span>

                        </div>


                        <span class="format-cell">
                            {{ formatLabel(copy.edition) }}
                        </span>


                        <span class="condition-cell">
                            {{ conditionLabel(copy.condition) }}
                        </span>


                        <span
                            class="note-cell"
                            :title="copy.listingNote || ''"
                        >
                            {{ copy.listingNote || "—" }}
                        </span>


                        <span
                            class="price-cell"
                            :class="{ selling: copy.canSell }"
                        >
                            {{
                                copy.canSell && copy.sellPrice != null
                                    ? `${copy.sellPrice} €`
                                    : "—"
                            }}
                        </span>


                        <button
                            type="button"
                            class="edit-button"
                            @click="editCopy(copy)"
                        >
                            Edit
                        </button>

                    </div>

                </div>

            </section>

        </template>


        <!-- =====================================================
             PRICE DIALOG
             ===================================================== -->

        <div
            v-if="showPriceDialog"
            class="dialog-overlay"
            @click.self="closePriceDialog"
        >

            <div class="price-dialog">

                <div class="dialog-header">

                    <h2>
                        Set selling price
                    </h2>

                    <button
                        type="button"
                        class="close-button"
                        @click="closePriceDialog"
                    >
                        ×
                    </button>

                </div>

                <p>
                    Set the same selling price for
                    <strong>{{ selectedCopyIds.length }}</strong>
                    copies.
                </p>

                <div class="price-input">

                    <label for="bulk-price">
                        Price
                    </label>

                    <div>
                        <input
                            id="bulk-price"
                            v-model.number="bulkPrice"
                            type="number"
                            min="0.01"
                            step="0.01"
                        >

                        <span>€</span>
                    </div>

                </div>

                <p
                    v-if="bulkPriceError"
                    class="error"
                >
                    {{ bulkPriceError }}
                </p>

                <div class="dialog-actions">

                    <button
                        type="button"
                        class="secondary-button"
                        @click="closePriceDialog"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        class="primary-button"
                        @click="applyBulkPrice"
                    >
                        Apply
                    </button>

                </div>

            </div>

        </div>

    </div>
</template>


<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import Breadcrumbs from "../components/layout/Breadcrumbs.vue";

import {
    getMyCopies,
    bulkUpdateCopies,
} from "../api/copyAPI.js";


const router = useRouter();


/* ============================================================
   STATE
   ============================================================ */

const loading = ref(true);
const copies = ref([]);

const search = ref("");

const expandedBoxSets = ref(new Set());

const selectedCopyIds = ref([]);

const showPriceDialog = ref(false);
const bulkPrice = ref(null);
const bulkPriceError = ref("");

const bulkActionLoading = ref(false);
const bulkActionError = ref("");



/* ============================================================
   LOAD
   ============================================================ */

async function loadCollection() {
    loading.value = true;

    try {
        copies.value = await getMyCopies();
    } catch (error) {
        console.error(
            "Failed to load collection:",
            error
        );

        copies.value = [];
    } finally {
        loading.value = false;
    }
}

onMounted(loadCollection);



/* ============================================================
   ALL COPIES
   ============================================================ */

const allCopies = computed(() => {
    return copies.value;
});



/* ============================================================
   BOX SETS
   ============================================================ */

const boxSets = computed(() => {

    const map = new Map();

    for (const copy of copies.value) {

        if (!copy.boxSet) {
            continue;
        }

        const id = copy.boxSet.id;

        if (!map.has(id)) {

            map.set(id, {
                ...copy.boxSet,
                copies: [],
            });

        }

        map.get(id).copies.push(copy);
    }

    return [...map.values()];
});


const standaloneCopies = computed(() => {
    return copies.value.filter(
        copy => !copy.boxSet
    );
});



/* ============================================================
   SEARCH
   ============================================================ */

function matchesSearch(copy) {

    const value = search.value
        .trim()
        .toLowerCase();

    if (!value) {
        return true;
    }

    const title =
        copy.media?.title?.toLowerCase() || "";

    const note =
        copy.listingNote?.toLowerCase() || "";

    const edition =
        copy.edition?.toLowerCase() || "";

    return (
        title.includes(value) ||
        note.includes(value) ||
        edition.includes(value) ||
        String(copy.id).includes(value)
    );
}


const filteredStandalone = computed(() => {
    return standaloneCopies.value.filter(
        matchesSearch
    );
});


const filteredBoxSets = computed(() => {

    const value = search.value
        .trim()
        .toLowerCase();

    if (!value) {
        return boxSets.value;
    }

    return boxSets.value
        .map(boxSet => {

            const boxSetMatch =
                boxSetDisplayTitle(boxSet)
                    .toLowerCase()
                    .includes(value);

            const matchingCopies =
                boxSet.copies.filter(
                    matchesSearch
                );

            if (
                !boxSetMatch &&
                matchingCopies.length === 0
            ) {
                return null;
            }

            return {
                ...boxSet,

                copies: boxSetMatch
                    ? boxSet.copies
                    : matchingCopies,
            };
        })
        .filter(Boolean);
});



/* ============================================================
   BOX SET EXPANSION
   ============================================================ */

function toggleBoxSet(id) {

    const next =
        new Set(expandedBoxSets.value);

    if (next.has(id)) {
        next.delete(id);
    } else {
        next.add(id);
    }

    expandedBoxSets.value = next;
}



/* ============================================================
   SELECTION
   ============================================================ */

function isSelected(id) {
    return selectedCopyIds.value.includes(id);
}


function toggleCopy(copy) {

    if (isSelected(copy.id)) {

        selectedCopyIds.value =
            selectedCopyIds.value.filter(
                id => id !== copy.id
            );

        return;
    }

    selectedCopyIds.value = [
        ...selectedCopyIds.value,
        copy.id,
    ];
}


function clearSelection() {
    selectedCopyIds.value = [];
    bulkActionError.value = "";
}


const visibleCopies = computed(() => {

    return [
        ...filteredStandalone.value,

        ...filteredBoxSets.value.flatMap(
            boxSet => boxSet.copies
        ),
    ];
});


const allVisibleSelected = computed(() => {

    if (visibleCopies.value.length === 0) {
        return false;
    }

    return visibleCopies.value.every(
        copy =>
            selectedCopyIds.value.includes(
                copy.id
            )
    );
});


const someVisibleSelected = computed(() => {

    const selected =
        visibleCopies.value.filter(
            copy =>
                selectedCopyIds.value.includes(
                    copy.id
                )
        );

    return (
        selected.length > 0 &&
        selected.length < visibleCopies.value.length
    );
});


function toggleSelectAll() {

    if (allVisibleSelected.value) {

        const visibleIds = new Set(
            visibleCopies.value.map(
                copy => copy.id
            )
        );

        selectedCopyIds.value =
            selectedCopyIds.value.filter(
                id => !visibleIds.has(id)
            );

        return;
    }


    const ids =
        new Set(selectedCopyIds.value);

    for (const copy of visibleCopies.value) {
        ids.add(copy.id);
    }

    selectedCopyIds.value = [
        ...ids
    ];


    /*
     * When selecting all, expand all visible
     * box sets so the user can actually see
     * the selected copies.
     */

    const nextExpanded =
        new Set(expandedBoxSets.value);

    for (
        const boxSet
        of filteredBoxSets.value
    ) {
        nextExpanded.add(boxSet.id);
    }

    expandedBoxSets.value =
        nextExpanded;
}



const selectedCopies = computed(() => {

    const selected =
        new Set(
            selectedCopyIds.value
        );

    return copies.value.filter(
        copy => selected.has(copy.id)
    );
});


/*
 * True when at least one selected copy
 * belongs to a box set.
 *
 * Delete is only allowed when ALL selected
 * copies are standalone.
 */

const selectedCopiesHaveBoxSet = computed(() => {

    return selectedCopies.value.some(
        copy => Boolean(copy.boxSet)
    );
});


const canDeleteSelected = computed(() => {

    if (
        selectedCopyIds.value.length === 0
    ) {
        return false;
    }

    return !selectedCopiesHaveBoxSet.value;
});



/* ============================================================
   DISPLAY
   ============================================================ */

function boxSetDisplayTitle(boxSet) {

    if (boxSet.name?.trim()) {
        return boxSet.name;
    }

    if (boxSet.title?.trim()) {
        return boxSet.title;
    }

    const firstTitle =
        boxSet.copies[0]?.media?.title;

    return firstTitle
        ? `${firstTitle}, ...`
        : `Box Set #${boxSet.id}`;
}


function boxSetFormats(boxSet) {

    const formats = new Set();

    for (
        const copy
        of boxSet.copies
    ) {

        if (copy.edition) {

            formats.add(
                formatLabel(
                    copy.edition
                )
            );
        }
    }

    return (
        [...formats].join(" · ") ||
        "—"
    );
}


function formatLabel(format) {

    const labels = {
        DVD: "DVD",
        BLURAY: "Blu-ray",
        UHD_4K: "4K UHD",
        SOFT_COVER: "Softcover",
        HARD_COVER: "Hardcover",
    };

    return (
        labels[format] ||
        format ||
        "—"
    );
}


function conditionLabel(condition) {

    const labels = {
        MINT: "Mint",
        VERY_GOOD: "Very Good",
        GOOD: "Good",
        FAIR: "Fair",
        POOR: "Poor",
    };

    return (
        labels[condition] ||
        condition ||
        "—"
    );
}



/* ============================================================
   EDIT
   ============================================================ */

function editCopy(copy) {

    router.push({
        name: "EditCopy",

        params: {
            id: copy.id,
        },

        query: {
            from: "collectionEdit",
        },
    });
}


function editBoxSet(boxSet) {

    router.push({
        name: "boxset",

        params: {
            id: boxSet.id,
        },

        query: {
            from: "collectionEdit",
        },
    });
}



/* ============================================================
   BULK ACTION HELPERS
   ============================================================ */

function resetBulkState() {

    bulkActionError.value = "";

    bulkPriceError.value = "";

    bulkPrice.value = null;
}


async function refreshAfterBulkAction() {

    await loadCollection();

    clearSelection();

    resetBulkState();
}



/* ============================================================
   BULK PRICE
   ============================================================ */

function openPriceDialog() {

    if (
        selectedCopyIds.value.length === 0
    ) {
        return;
    }

    bulkPrice.value = null;

    bulkPriceError.value = "";

    showPriceDialog.value = true;
}


function closePriceDialog() {

    if (bulkActionLoading.value) {
        return;
    }

    showPriceDialog.value = false;

    bulkPrice.value = null;

    bulkPriceError.value = "";
}


async function applyBulkPrice() {

    bulkPriceError.value = "";

    const price =
        Number(bulkPrice.value);

    if (
        !Number.isFinite(price) ||
        price <= 0
    ) {
        bulkPriceError.value =
            "Price must be greater than 0.";

        return;
    }

    if (
        selectedCopyIds.value.length === 0
    ) {
        closePriceDialog();
        return;
    }

    bulkActionLoading.value = true;

    bulkActionError.value = "";

    try {

        await bulkUpdateCopies(
            selectedCopyIds.value,
            "SET_PRICE",
            {
                sellPrice: price,
            }
        );

        showPriceDialog.value = false;

        await refreshAfterBulkAction();

    } catch (error) {

        console.error(
            "Failed to set bulk price:",
            error
        );

        bulkPriceError.value =
            error.message ||
            "Unable to update selected copies.";

    } finally {

        bulkActionLoading.value = false;
    }
}



/* ============================================================
   REMOVE FROM SALE
   ============================================================ */

async function removeFromSale() {

    if (
        selectedCopyIds.value.length === 0
    ) {
        return;
    }

    const confirmed =
        window.confirm(
            `Remove ${selectedCopyIds.value.length} ${
                selectedCopyIds.value.length === 1
                    ? "copy"
                    : "copies"
            } from sale?`
        );

    if (!confirmed) {
        return;
    }

    bulkActionLoading.value = true;

    bulkActionError.value = "";

    try {

        await bulkUpdateCopies(
            selectedCopyIds.value,
            "REMOVE_FROM_SALE"
        );

        await refreshAfterBulkAction();

    } catch (error) {

        console.error(
            "Failed to remove copies from sale:",
            error
        );

        bulkActionError.value =
            error.message ||
            "Unable to remove selected copies from sale.";

    } finally {

        bulkActionLoading.value = false;
    }
}



/* ============================================================
   DELETE
   ============================================================ */

async function deleteSelected() {

    if (
        selectedCopyIds.value.length === 0
    ) {
        return;
    }

    /*
     * Frontend protection.
     *
     * Backend also checks this, so this is
     * only a UX rule.
     */

    if (!canDeleteSelected.value) {

        bulkActionError.value =
            "Copies belonging to a box set must be managed from the Box Set page.";

        return;
    }


    const confirmed =
        window.confirm(
            `Delete ${selectedCopyIds.value.length} ${
                selectedCopyIds.value.length === 1
                    ? "copy"
                    : "copies"
            }? This cannot be undone.`
        );

    if (!confirmed) {
        return;
    }


    bulkActionLoading.value = true;

    bulkActionError.value = "";

    try {

        await bulkUpdateCopies(
            selectedCopyIds.value,
            "DELETE"
        );

        await refreshAfterBulkAction();

    } catch (error) {

        console.error(
            "Failed to delete copies:",
            error
        );

        bulkActionError.value =
            error.message ||
            "Unable to delete selected copies.";

    } finally {

        bulkActionLoading.value = false;
    }
}

</script>


<style scoped>

.collection-edit-page {
    text-align: left;
}


/* ============================================================
   HEADER
   ============================================================ */

.page-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;

    gap: 20px;

    margin-bottom: 10px;
}

.page-header h1 {
    margin-bottom: 6px;
}

.page-subtitle {
    color: var(--text-muted);
    font-size: 14px;
}

.item-count {
    color: var(--text-muted);
    font-size: 13px;
}


/* ============================================================
   TOOLBAR
   ============================================================ */

.toolbar {
    display: flex;
    align-items: center;
    gap: 12px;

    margin-bottom: 12px;
}

.search-wrapper {
    flex: 1;
    max-width: 360px;
}

.search-wrapper input {
    width: 100%;

    height: 36px;

    padding: 7px 10px;

    color: var(--text-h);
    background: var(--bg);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);

    font: inherit;
}

.search-wrapper input:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
}

.selection-info {
    color: var(--text-muted);
    font-size: 13px;
}


/* ============================================================
   BULK TOOLBAR
   ============================================================ */

.bulk-toolbar {
    position: sticky;
    top: 10px;
    z-index: 100;

    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 15px;

    margin-bottom: 20px;
    padding: 9px 12px;

    background: var(--code-bg);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);

    box-shadow: var(--shadow);
}

.bulk-count {
    color: var(--text-h);
    font-size: 13px;
    font-weight: 600;
}

.bulk-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.bulk-actions button {
    min-height: 32px;

    padding: 5px 10px;

    color: var(--text-secondary);
    background: var(--bg);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);

    font: inherit;
    font-size: 12px;

    cursor: pointer;
}

.bulk-actions button:hover {
    color: var(--text-h);
    background: var(--bg-hover);
}

.bulk-actions .danger-button {
    color: var(--danger);
}

.bulk-actions .danger-button:hover {
    background: var(--danger-bg);
}


/* ============================================================
   SECTIONS
   ============================================================ */

.collection-section {
    margin-top: 26px;
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    margin-bottom: 8px;
}

.section-header h2 {
    margin: 0;

    color: var(--text-h);

    font-size: 12px;
}

.select-all {
    gap: 6px;

    color: var(--text-muted);

    font-size: 12px;

    cursor: pointer;
}


/* ============================================================
   TABLE
   ============================================================ */

.table {
    width: 100%;

    border: 1px solid var(--border);
    border-radius: var(--radius-small);

    overflow: hidden;

    background: var(--bg);
}

.table-header,
.table-row {
    display: grid;

    grid-template-columns:
        32px
        55px
        minmax(180px, 2fr)
        minmax(90px, 1fr)
        minmax(90px, 1fr)
        minmax(130px, 1.5fr)
        80px
        60px;

    align-items: center;
}

.table-header {
    min-height: 34px;

    padding: 0 10px;

    color: var(--text-muted);
    background: var(--bg-secondary);

    border-bottom: 1px solid var(--border);

    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
}

.table-row {
    min-height: 48px;

    padding: 5px 10px;

    border-bottom: 1px solid var(--border);
}

.table-row:last-child {
    border-bottom: 0;
}


/* ============================================================
   BOX SET
   ============================================================ */

.boxset-row {
    background: var(--bg-secondary);

    cursor: pointer;
}

.boxset-row:hover {
    background: var(--bg-hover);
}

.expand-button {
    width: 24px;
    height: 24px;

    padding: 0;

    color: var(--text-muted);
    background: transparent;

    border: 0;

    cursor: pointer;
}

.item-id {
    color: var(--text-muted);

    font-family: var(--mono);
    font-size: 12px;
}

.title-cell {
    min-width: 0;

    display: flex;
    flex-direction: column;

    gap: 2px;
}

.title-cell strong,
.title-cell > span {
    color: var(--text-h);

    font-size: 12px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.format-cell,
.condition-cell {
    color: var(--text-secondary);
    font-size: 8px;
}

.copy-count {
    color: var(--text-secondary);
    font-size: 12px;
}

.note-cell {
    min-width: 0;

    color: var(--text-muted);

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    font-size: 12px;
}

.price-cell {
    color: var(--text-muted);

    font-size: 13px;
    font-weight: 600;
}

.price-cell.selling {
    color: var(--text-h);
}

.boxset-copies {
    background: var(--bg);
}

.copy-row {
    padding-left: 10px;
}

.boxset-copies .copy-row {
    background: var(--bg);
}

.boxset-copies .copy-row:hover,
.standalone-row:hover {
    background: var(--bg-hover);
}


/* ============================================================
   SELECTION
   ============================================================ */

.selection-checkbox {
    display: flex;
    align-items: center;
    justify-content: center;

    cursor: pointer;
}

.selection-checkbox input,
.select-all input {
    width: 15px;
    height: 15px;

    accent-color: var(--accent);
}


/* ============================================================
   BUTTONS
   ============================================================ */

.edit-button {
    min-height: 30px;

    padding: 4px 8px;

    color: var(--text-secondary);
    background: var(--bg);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);

    font-size: 11px;

    cursor: pointer;
}

.edit-button:hover {
    color: var(--text-h);
    background: var(--bg-hover);
}

.mobile-secondary {
    display: none;

    color: var(--text-muted);

    font-size: 11px;
}


/* ============================================================
   DIALOG
   ============================================================ */

.dialog-overlay {
    position: fixed;
    inset: 0;

    z-index: 2000;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 20px;

    background: rgba(0, 0, 0, 0.45);
}

.price-dialog {
    width: min(100%, 420px);

    padding: 20px;

    color: var(--text);

    background: var(--bg);

    border: 1px solid var(--border);
    border-radius: var(--radius);

    box-shadow: var(--shadow);
}

.dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    margin-bottom: 16px;
}

.dialog-header h2 {
    margin: 0;

    color: var(--text-h);

    font-size: 18px;
}

.close-button {
    width: 30px;
    height: 30px;

    padding: 0;

    color: var(--text-muted);
    background: transparent;

    border: 0;

    font-size: 22px;

    cursor: pointer;
}

.price-input {
    margin-top: 16px;
}

.price-input label {
    display: block;

    margin-bottom: 6px;

    color: var(--text-secondary);

    font-size: 13px;
}

.price-input > div {
    display: flex;
    align-items: center;

    gap: 8px;
}

.price-input input {
    width: 130px;

    min-height: 40px;

    padding: 8px 10px;

    color: var(--text-h);
    background: var(--bg);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);

    font: inherit;
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;

    gap: 8px;

    margin-top: 20px;
}

.primary-button,
.secondary-button {
    min-height: 38px;

    padding: 7px 13px;

    border-radius: var(--radius-small);

    font: inherit;

    cursor: pointer;
}

.primary-button {
    color: #fff;
    background: var(--accent);

    border: 1px solid var(--accent);
}

.secondary-button {
    color: var(--text);
    background: var(--bg-secondary);

    border: 1px solid var(--border);
}

.error {
    margin-top: 8px;

    color: var(--danger);

    font-size: 13px;
}


/* ============================================================
   MOBILE
   ============================================================ */

@media (max-width: 810px) {

    .page-header {
        align-items: center;
    }

    .page-header h1 {
        font-size: 28px;
    }

    .toolbar {
        margin-bottom: 10px;
    }

    .search-wrapper {
        max-width: none;
    }

.bulk-toolbar {
    position: sticky;
    top: 10px;
    z-index: 100;
    width: 98vw;
        max-width: 98vw;

        margin-left: calc(50% - 49vw);
        margin-right: calc(50% - 49vw);

        box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    overflow-x: auto;

    gap: 15px;

    margin-bottom: 20px;
    padding: 9px 12px;

    background: var(--code-bg);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);

    box-shadow: var(--shadow);
}

    .bulk-actions {
        flex-wrap: nowrap;
        flex-shrink: 0;
    }

    .bulk-actions button {
        flex-shrink: 0;
    }


    /*
     * Hide the desktop table header.
     */

    .table-header {
        display: none;
    }


    /*
     * Box set becomes a compact management row.
     */

    .boxset-row {
        display: grid;

        grid-template-columns:
            26px
            42px
            minmax(0, 1fr)
            40px
            28px;

        min-height: 54px;

        padding: 6px 8px;
    }

    .boxset-row .format-cell,
    .boxset-row .copy-count,
    .boxset-row .note-cell {
        display: none;
    }

    .boxset-row .price-cell {
        grid-column: 4;
        grid-row: 1;

        margin-right: 6px;
    }

    .boxset-row .edit-button {
        grid-column: 5;
        grid-row: 1;
    }


    /*
     * Box set copies.
     */

    .boxset-copies .copy-row,
    .standalone-row {
        display: grid;

        grid-template-columns:
            28px
            42px
            minmax(90px, 1fr)
            50px
            60px;

        min-height: 52px;

        padding: 6px 8px;
    }

    .copy-row .format-cell,
    .copy-row .condition-cell,
    .copy-row .note-cell {
        display: none;
    }

    .copy-row .title-cell {
        grid-column: 3;
    }

    .copy-row .price-cell {
        grid-column: 5;
        grid-row: 1;
    }


    /*
     * Standalone edit button.
     */

    .edit-button {
        grid-column: 5;
        grid-row: 1;

        justify-self: end;

        margin-top: 3px;
    }

    .price-cell {
        grid-column: 4;
        grid-row: 1;
    }

    .title-cell {
        grid-column: 3;
    }

    .mobile-secondary {
        display: block;
    }


    /*
     * On mobile the standalone row gets a little more
     * vertical space because Edit sits underneath the price.
     */

    .standalone-row {
        min-height: 64px;
    }


    .note-cell {
        display: none;
    }


    .item-id {
        font-size: 11px;
    }

    .price-cell {
        white-space: nowrap;
    }
}


@media (max-width: 420px) {

    .page {
        padding-left: 12px;
        padding-right: 12px;
    }

    .bulk-actions {
        grid-template-columns: 1fr;
    }

    .page-header {
        gap: 8px;
    }

    .item-count {
        white-space: nowrap;
    }
}

</style>