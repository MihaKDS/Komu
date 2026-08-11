<template>
    <div class="filter-wrapper">

        <!-- Filter toggle -->
        <button
            type="button"
            class="filter-toggle"
            @click="isOpen = !isOpen"
        >
            <span>⚙ Filters</span>

            <span class="filter-summary">
                {{ filterSummary }}
            </span>

            <span class="filter-arrow">
                {{ isOpen ? "▲" : "▼" }}
            </span>
        </button>


        <!-- Filter contents -->
        <div
            v-if="isOpen"
            class="filter-bar"
        >

            <!-- Format -->
            <div class="group">
                <label for="format-select">
                    Format
                </label>

                <select
                    v-if="props.category === 'MOVIE' || props.category === 'TV_SHOW'"
                    id="format-select"
                    v-model="selectedFormat"
                    @change="emitFormat"
                >
                    <option value="ALL">All formats</option>
                    <option value="DVD">DVD</option>
                    <option value="BLURAY">Blu-ray</option>
                    <option value="UHD_4K">4K UHD</option>
                </select>
                <select
                    v-else-if="props.category === 'BOOK' || props.category === 'COMIC'"
                    id="format-select"
                    v-model="selectedFormat"
                    @change="emitFormat"
                >
                    <option value="ALL">All formats</option>
                    <option value="SOFTCOVER">Softcover</option>
                    <option value="HARDCOVER">Hardcover</option>
                </select>
            </div>


            <!-- Collection -->
            <div
                v-if="showCollectionFilter"
                class="group"
            >
                <label for="collection-select">
                    Collection
                </label>

                <select
                    id="collection-select"
                    v-model="selectedCollection"
                    @change="emitCollection"
                >
                    <option value="ALL">
                        All
                    </option>

                    <option value="IN_COLLECTION">
                        In collection
                    </option>

                    <option value="NOT_IN_COLLECTION">
                        Not in collection
                    </option>
                </select>
            </div>


            <!-- View -->
            <div
                v-if="showViewToggle"
                class="group"
            >
                <label>
                    View
                </label>

                <div class="button-group">

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
            </div>


            <!-- Display -->
            <div class="group">
                <label>
                    Display
                </label>

                <div class="button-group">

                    <button
                        type="button"
                        :class="{
                            active: displayMode === 'singles'
                        }"
                        @click="setDisplay('singles')"
                    >
                        Singles
                    </button>

                    <button
                        type="button"
                        :class="{
                            active: displayMode === 'collections'
                        }"
                        @click="setDisplay('collections')"
                    >
                        Collections
                    </button>

                </div>
            </div>

        </div>

    </div>
</template>


<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
    format: {
        type: String,
        default: "ALL",
    },

    collection: {
        type: String,
        default: "ALL",
    },

    viewMode: {
        type: String,
        default: "list",
    },

    displayMode: {
        type: String,
        default: "collections",
    },

    showCollectionFilter: {
        type: Boolean,
        default: true,
    },

    showViewToggle: {
        type: Boolean,
        default: true,
    },
    category: {
        type: String,
        default: "movies",
    },
});

const emit = defineEmits([
    "update:format",
    "update:collection",
    "update:viewMode",
    "update:displayMode",
]);
const isOpen = ref(false);

const selectedFormat = ref(props.format);
const selectedCollection = ref(props.collection);
const viewMode = ref(props.viewMode);
const displayMode = ref(props.displayMode);


const filterSummary = computed(() => {
    const parts = [];

    if (selectedFormat.value !== "ALL") {
        parts.push(selectedFormat.value);
    }

    if (selectedCollection.value === "IN_COLLECTION") {
        parts.push("In collection");
    }

    if (selectedCollection.value === "NOT_IN_COLLECTION") {
        parts.push("Not in collection");
    }

    if (displayMode.value === "collections") {
        parts.push("Collections");
    }

    return parts.length
        ? parts.join(" · ")
        : "Singles";
});


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

watch(
    () => props.viewMode,
    (value) => {
        viewMode.value = value;
    }
);

watch(
    () => props.displayMode,
    (value) => {
        displayMode.value = value;
    }
);


function emitFormat() {
    emit(
        "update:format",
        selectedFormat.value
    );
}

function emitCollection() {
    emit(
        "update:collection",
        selectedCollection.value
    );
}

function setView(mode) {
    viewMode.value = mode;

    emit(
        "update:viewMode",
        mode
    );
}

function setDisplay(mode) {
    displayMode.value = mode;

    emit(
        "update:displayMode",
        mode
    );
}
</script>


<style scoped>
.filter-wrapper {
    width: 100%;
    margin-bottom: 1px;
}


/* Toggle */

.filter-toggle {
    width: 100%;
    min-height: 42px;

    display: flex;
    align-items: center;

    padding: 8px 12px;

    color: var(--text-h);
    background: var(--bg-secondary);

    border: 1px solid var(--border);
    border-radius: var(--radius);

    box-shadow: none;

    cursor: pointer;
}

.filter-toggle:hover {
    background: var(--bg-hover);
    box-shadow: none;
}

.filter-toggle > span:first-child {
    font-weight: 600;
}

.filter-summary {
    margin-left: 12px;

    color: var(--text-muted);

    font-size: 13px;
}

.filter-arrow {
    margin-left: auto;

    font-size: 12px;
}


/* Filter contents */

.filter-bar {
    display: flex;
    align-items: flex-end;
    flex-wrap: wrap;

    gap: 12px;

    margin-top: 8px;

    padding: 12px;

    background: var(--bg-secondary);

    border: 1px solid var(--border);
    border-radius: var(--radius);
}

.group {
    display: flex;
    flex-direction: column;

    gap: 5px;

    min-width: 145px;
}

.group label {
    padding-left: 2px;

    color: var(--text-secondary);

    font-size: 13px;
    font-weight: 500;
}

.group select {
    width: 100%;
    height: 38px;

    padding: 6px 10px;
}


/* Buttons */

.button-group {
    display: flex;
  
    height: 38px;
}

.button-group button {
    height: 38px;

    padding: 6px 13px;

    color: var(--text-secondary);
    background: var(--bg-card);

    border: 1px solid var(--border);
    border-radius: 0;

    box-shadow: none;
}

.button-group button:first-child {
    border-radius:
        var(--radius-small)
        0
        0
        var(--radius-small);
}

.button-group button:last-child {
    border-radius:
        0
        var(--radius-small)
        var(--radius-small)
        0;
}

.button-group button + button {
    border-left: 0;
}

.button-group button:hover {
    color: var(--text-h);
    background: var(--bg-hover);
    box-shadow: none;
}

.button-group button.active {
    color: #fff;

    background: var(--accent);
    border-color: var(--accent);
}


/* Mobile */

@media (max-width: 650px) {

    .filter-bar {
        display: grid;

        grid-template-columns:
            repeat(2, minmax(0, 1fr));

        gap: 10px;
    }

    .group {
        min-width: 0;
    }

    .group select {
        min-width: 0;
    }

    .button-group {
        width: 100%;
    }

    .button-group button {
        flex: 1;
    }
}


@media (max-width: 420px) {

    .filter-bar {
        grid-template-columns: 1fr;
    }

    .filter-summary {
        max-width: 45%;

        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}
</style>