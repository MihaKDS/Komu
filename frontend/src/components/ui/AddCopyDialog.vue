<template>
<div class="dialog-overlay">
<div class="add-copy">

    <div class="dialog-header">
        <h2>Add to Collection</h2>

        <button
            type="button"
            class="close-button"
            @click="emit('close')"
            aria-label="Close"
        >
            ×
        </button>
    </div>


    <!-- =====================================================
         EDITION
         ===================================================== -->

    <section class="form-section">

        <label for="edition">
            Edition
        </label>

        <select
            id="edition"
            v-if="
                props.media.category === 'MOVIE' ||
                props.media.category === 'TV_SHOW'
            "
            v-model="form.edition"
        >
            <option value="DVD">DVD</option>
            <option value="BLURAY">Blu-ray</option>
            <option value="UHD_4K">4K UHD</option>
        </select>

        <select
            id="edition"
            v-else
            v-model="form.edition"
        >
            <option value="SOFT_COVER">Soft cover</option>
            <option value="HARD_COVER">Hard cover</option>
        </select>

    </section>


    <!-- =====================================================
         COMIC / MANGA VOLUMES
         ===================================================== -->

    <section
        v-if="props.media.category === 'COMIC'"
        class="form-section volume-section"
    >

        <div class="section-title">
            <h3>Add volumes</h3>

            <span class="section-hint">
                Add multiple volumes at once
            </span>
        </div>


        <div class="volume-input">

            <input
                type="number"
                min="1"
                v-model.number="form.volume"
                placeholder="Volume"
                @keyup.enter="addVolume"
            />

            <button
                type="button"
                class="secondary-button"
                @click="addVolume"
            >
                Add volume
            </button>

        </div>


        <div
            v-if="form.volumes.length"
            class="volume-list"
        >

            <div class="volume-list-header">
                <span>
                    Volumes to add
                </span>

                <span>
                    {{ form.volumes.length }}
                </span>
            </div>


            <div
                v-for="volume in form.volumes"
                :key="volume"
                class="volume-item"
            >

                <span>
                    {{ props.media.title }}
                    <strong>Vol. {{ volume }}</strong>
                </span>

                <button
                    type="button"
                    class="remove-button"
                    @click="removeVolume(volume)"
                >
                    Remove
                </button>

            </div>

        </div>


        <div
            v-else
            class="volume-empty"
        >
            No volumes added yet.
        </div>


        <div class="form-actions">

            <button
                type="button"
                class="primary-button"
                :disabled="form.volumes.length === 0"
                @click="saveComic"
            >
                Add
                {{ form.volumes.length || "" }}
                volume<span v-if="form.volumes.length !== 1">s</span>
                to collection
            </button>

            <button
                type="button"
                class="secondary-button"
                @click="emit('close')"
            >
                Cancel
            </button>

        </div>

    </section>


    <!-- =====================================================
         NORMAL MEDIA
         ===================================================== -->

    <section
        v-else
        class="form-section"
    >

        <!-- 4K -->

        <div
            v-if="is4K"
            class="option-row"
        >
            <label class="checkbox-label">

                <input
                    type="checkbox"
                    v-model="form.includesBluRay"
                >

                <span>
                    Includes Blu-ray
                </span>

            </label>
        </div>


        <!-- BOX SET -->

        <div class="option-row">

            <label class="checkbox-label">

                <input
                    type="checkbox"
                    v-model="form.partOfBox"
                >

                <span>
                    Part of a box set
                </span>

            </label>

        </div>


        <div
            v-if="form.partOfBox"
            class="boxset-section"
        >

            <div class="section-title">
                <h3>Box set</h3>
            </div>


            <!-- New / existing -->

            <div class="mode-selector">

                <label class="radio-label">

                    <input
                        type="radio"
                        value="new"
                        v-model="form.boxSetMode"
                    >

                    <span>
                        Create new box set
                    </span>

                </label>


                <label class="radio-label">

                    <input
                        type="radio"
                        value="existing"
                        v-model="form.boxSetMode"
                    >

                    <span>
                        Add to existing box set
                    </span>

                </label>

            </div>


            <!-- Existing box set -->

            <div
                v-if="form.boxSetMode === 'existing'"
                class="nested-section"
            >

                <label for="existing-boxset">
                    Existing box set
                </label>

                <select
                    id="existing-boxset"
                    v-model="form.existingBoxSetId"
                >

                    <option value="">
                        Select box set
                    </option>

                    <option
                        v-for="boxSet in existingBoxSets"
                        :key="boxSet.id"
                        :value="boxSet.id"
                    >
                        {{
                            boxSet.name ||
                            boxSet.title ||
                            `Box Set #${boxSet.id}`
                        }}
                        ({{ boxSet.copyCount }})
                    </option>

                </select>

            </div>


            <!-- Items -->

            <div class="nested-section">

                <h4>
                    Items in box
                </h4>

                <MediaSearch
                    :category="props.media.category"
                    :exclude-ids="form.items.map(item => item.id)"
                    @selected="addItem"
                />


                <div
                    v-if="form.items.length"
                    class="box-items"
                >

                    <div
                        v-for="item in form.items"
                        :key="item.mediaId"
                        class="box-item"
                    >

                        <span>
                            {{ item.title }}
                        </span>

                        <span>
                            {{ item.releaseYear }}
                        </span>

                    </div>

                </div>

                <p
                    v-else
                    class="muted"
                >
                    No items added to this box yet.
                </p>

            </div>


            <!-- New box -->

            <template
                v-if="form.boxSetMode === 'new'"
            >

                <div class="nested-section">

                    <label for="box-name">
                        Box set name
                    </label>

                    <input
                        id="box-name"
                        v-model="form.boxSetName"
                        placeholder="Collection name"
                    />

                </div>


                <div class="nested-section">

                    <label for="box-note">
                        Box listing note
                    </label>

                    <input
                        id="box-note"
                        v-model="form.boxSetListingNote"
                        placeholder="note"
                    />

                </div>


                <div class="option-card">

                    <label class="checkbox-label">

                        <input
                            type="checkbox"
                            v-model="form.boxSetCanSell"
                        >

                        <span>
                            Sell entire box
                        </span>

                    </label>


                    <div
                        v-if="form.boxSetCanSell"
                        class="price-input"
                    >

                        <label>
                            Price
                        </label>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            v-model.number="
                                form.boxSetSellPrice
                            "
                        />

                        <span>€</span>

                    </div>

                </div>


            </template>

        </div>


        <!-- Actions -->

        <div class="form-actions">

            <button
                type="button"
                class="primary-button"
                :disabled="
                    form.partOfBox &&
                    form.boxSetMode === 'existing' &&
                    !form.existingBoxSetId
                "
                @click="saveCopy"
            >
                Add to collection
            </button>

            <button
                type="button"
                class="secondary-button"
                @click="emit('close')"
            >
                Cancel
            </button>

        </div>

    </section>

</div>
</div>    
</template>

<script setup>
import { reactive, computed, onMounted, ref } from "vue";
import { createCopy } from "../../api/copyAPI";
import { getMyBoxSets } from "../../api/boxsetAPI";
import MediaSearch from "../media/MediaSearch.vue";
import MediaDetail from "../../pages/MediaDetail.vue";

const props = defineProps({
    media: {
        type: Object,
        required: true,
    },
});

const emit = defineEmits(["close", "saved"]);

const existingBoxSets = ref([]);

const form = reactive({
    edition: "BLURAY",
    includesBluRay: false,
    partOfBox: false,
    boxSetMode: 'new',
    existingBoxSetId: '',
    items: [
        props.media 
    ],
    boxSetName: '',
    boxSetListingNote: '',
    boxSetCanSell: false,
    boxSetSellPrice: null,
    boxSetCanRent: false,
    volume: null,
    volumes: [],
});

const is4K = computed(() => form.edition === "UHD_4K");
onMounted(async () => {
    if(props.media.category === "BOOK" || props.media.category === "COMIC") {
        form.edition = "SOFT_COVER";
    }
    try {
        existingBoxSets.value = await getMyBoxSets();
    } catch (err) {
        console.error(err);
    }
});

async function saveCopy() {
    try {
        if (form.partOfBox && form.boxSetMode === 'existing' && !form.existingBoxSetId) {
            return;
        }

        await createCopy({
            title: `${props.media.title} Vol. ${form.volume}`,
            edition: form.edition,
            includesBluRay: form.includesBluRay,
            partOfBox: form.partOfBox,
            mediaIds: form.items.map(item => item.id),
            existingBoxSetId: form.boxSetMode === 'existing' && form.existingBoxSetId ? Number(form.existingBoxSetId) : undefined,
            boxSetName: form.boxSetMode === 'new' ? form.boxSetName : undefined,
            boxSetListingNote: form.boxSetMode === 'new' ? form.boxSetListingNote : undefined,
            boxSetCanSell: form.boxSetMode === 'new' ? form.boxSetCanSell : undefined,
            boxSetSellPrice: form.boxSetMode === 'new' ? form.boxSetSellPrice : undefined,
            boxSetCanRent: form.boxSetMode === 'new' ? form.boxSetCanRent : undefined,
        });

        emit("saved");
        emit("close");
    } catch (err) {
        console.error(err);
    }
};

async function saveComic() {
    try {
        if (form.partOfBox && form.boxSetMode === 'existing' && !form.existingBoxSetId) {
            return;
        }

        await createCopy({
            volumes: form.volumes,
            edition: form.edition,
            includesBluRay: form.includesBluRay,
            partOfBox: form.partOfBox,
            mediaIds: form.items.map(item => item.id),
            existingBoxSetId: form.boxSetMode === 'existing' && form.existingBoxSetId ? Number(form.existingBoxSetId) : undefined,
            boxSetName: form.boxSetMode === 'new' ? form.boxSetName : undefined,
            boxSetListingNote: form.boxSetMode === 'new' ? form.boxSetListingNote : undefined,
            boxSetCanSell: form.boxSetMode === 'new' ? form.boxSetCanSell : undefined,
            boxSetSellPrice: form.boxSetMode === 'new' ? form.boxSetSellPrice : undefined,
            boxSetCanRent: form.boxSetMode === 'new' ? form.boxSetCanRent : undefined,
        });

        emit("saved");
        emit("close");
    } catch (err) {
        console.error(err);
    }
};

function addVolume() {
    const volume = Number(form.volume);

    if (!volume || volume < 1) {
        return;
    }

    // Don't allow the same volume twice
    if (form.volumes.includes(volume)) {
        return;
    }

    form.volumes.push(volume);

    // Prepare next volume
    form.volume = volume + 1;
}

function removeVolume(volume) {
    form.volumes = form.volumes.filter(
        v => v !== volume
    );
}

function addItem(media) {
    form.items.push(media);
}
</script>
<style scoped>
.add-copy {
    width: min(100%, 620px);

    padding: 24px;

    color: var(--text);
    background: var(--accent-bg);

    border: 1px solid var(--border);
    border-radius: var(--radius);

    box-shadow: var(--shadow);
}


/* Header */

.dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    margin-bottom: 22px;
}

.dialog-header h2 {
    margin: 0;

    color: var(--text-h);
}

.close-button {
    width: 34px;
    height: 34px;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 0;

    color: var(--text-muted);
    background: transparent;

    border: 0;

    font-size: 24px;
    line-height: 1;

    cursor: pointer;
}

.close-button:hover {
    color: var(--text-h);
    background: var(--bg-hover);
}


/* Sections */

.form-section {
    display: flex;
    flex-direction: column;

    gap: 10px;
}

.form-section + .form-section {
    margin-top: 20px;
}

.section-title {
    display: flex;
    align-items: baseline;
    justify-content: space-between;

    gap: 10px;

    margin-bottom: 4px;
}

.section-title h3 {
    margin: 0;

    color: var(--text-h);

    font-size: 16px;
}

.section-hint {
    color: var(--text-muted);

    font-size: 12px;
}


/* Labels / inputs */

.form-section > label,
.nested-section > label,
.price-input label,
.rent-inputs label {
    color: var(--text-secondary);

    font-size: 13px;
    font-weight: 500;
}

select,
input[type="number"],
input[type="text"] {
    width: 100%;
    min-height: 40px;

    padding: 8px 10px;

    color: var(--text-h);
    background: var(--bg);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);

    font: inherit;
}

select:focus,
input:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
}


/* Checkbox / radio */

.option-row {
    padding: 10px 12px;

    background: var(--bg-secondary);

    border: 2px solid var(--border);
    border-radius: var(--radius-small);
}

.checkbox-label,
.radio-label {
    display: flex;
    align-items: center;

    gap: 9px;

    color: var(--text);

    cursor: pointer;
}

.checkbox-label input,
.radio-label input {
    width: 16px;
    height: 16px;

    accent-color: var(--accent);
}


/* Volumes */

.volume-input {
    display: flex;

    gap: 8px;
}

.volume-input input {
    max-width: 150px;
}

.volume-input button {
    flex-shrink: 0;
}


.volume-list {
    overflow: hidden;

    margin-top: 5px;

    border: 2px solid var(--border);
    border-radius: var(--radius-small);
}

.volume-list-header {
    display: flex;
    justify-content: space-between;

    padding: 8px 10px;

    color: var(--text-secondary);
    background: var(--bg-secondary);

    border-bottom: 2px solid var(--border);

    font-size: 12px;
    font-weight: 600;
}

.volume-item {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 10px;

    padding: 9px 10px;

    border-bottom: 2px solid var(--border);

    font-size: 13px;
}

.volume-item:last-child {
    border-bottom: 0;
}

.volume-item strong {
    color: var(--text-h);
}

.remove-button {
    padding: 4px 7px;

    color: var(--text-muted);
    background: transparent;

    border: 2px solid var(--border);
    border-radius: 4px;

    font-size: 11px;
}

.remove-button:hover {
    color: var(--text-h);
    background: var(--bg-hover);
}

.volume-empty {
    padding: 14px;

    color: var(--text-muted);
    background: var(--bg-secondary);

    border: 2px dashed var(--border);
    border-radius: var(--radius-small);

    font-size: 13px;
    text-align: center;
}


/* Box set */

.boxset-section {
    display: flex;
    flex-direction: column;

    gap: 14px;

    margin-top: 5px;

    padding: 15px;

    background: var(--bg-secondary);

    border: 2px solid var(--border);
    border-radius: var(--radius);
}

.mode-selector {
    display: flex;
    flex-wrap: wrap;

    gap: 8px;
}

.radio-label {
    padding: 8px 10px;

    background: var(--bg-card);

    border: 2px solid var(--border);
    border-radius: var(--radius-small);
}

.radio-label:has(input:checked) {
    color: var(--text-h);

    border-color: var(--accent);

    background: var(--accent-bg);
}

.nested-section {
    display: flex;
    flex-direction: column;

    gap: 7px;

    padding-top: 4px;
}

.nested-section h4 {
    margin: 0;

    color: var(--text-h);

    font-size: 14px;
}


/* Box items */

.box-items {
    display: flex;
    flex-direction: column;

    overflow: hidden;

    border: 2px solid var(--border);
    border-radius: var(--radius-small);
}

.box-item {
    display: flex;
    justify-content: space-between;

    gap: 10px;

    padding: 8px 10px;

    background: var(--bg-card);

    border-bottom: 2px solid var(--border);

    font-size: 13px;
}

.box-item:last-child {
    border-bottom: 0;
}

.box-item span:last-child {
    color: var(--text-muted);
}


/* Selling / renting */

.option-card {
    display: flex;
    flex-direction: column;

    gap: 10px;

    padding: 11px;

    background: var(--bg-card);

    border: 2px solid var(--border);
    border-radius: var(--radius-small);
}

.price-input {
    display: flex;
    align-items: center;

    gap: 7px;
}

.price-input label {
    flex-shrink: 0;
}

.price-input input {
    width: 120px;
}

.rent-inputs {
    display: grid;

    grid-template-columns:
        1fr 1fr;

    gap: 10px;
}

.rent-inputs > div {
    display: flex;
    flex-direction: column;

    gap: 5px;
}


/* Actions */

.form-actions {
    display: flex;
    justify-content: flex-end;

    gap: 8px;

    margin-top: 22px;
    padding-top: 16px;

    border-top: 2px solid var(--border);
}

.primary-button,
.secondary-button {
    min-height: 40px;

    padding: 8px 14px;

    border-radius: var(--radius-small);

    font: inherit;

    cursor: pointer;
}

.primary-button {
    color: #fff;
    background: var(--accent);

    border: 2px solid var(--accent);
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
    background: var(--bg-secondary);

    border: 2px solid var(--border);
}

.secondary-button:hover {
    color: var(--text-h);
    background: var(--bg-hover);
}

.muted {
    margin: 0;

    color: var(--text-muted);

    font-size: 12px;
}


/* Mobile */

@media (max-width: 600px) {
    .add-copy {
        width: 100%;
        padding: 18px;

        border-radius: var(--radius);
    }

    .dialog-header {
        margin-bottom: 18px;
    }

    .volume-input {
        display: grid;
        grid-template-columns: 1fr auto;
    }

    .volume-input input {
        max-width: none;
    }

    .mode-selector {
        flex-direction: column;
    }

    .radio-label {
        width: 100%;
    }

    .rent-inputs {
        grid-template-columns: 1fr;
    }

    .form-actions {
        flex-direction: column-reverse;
    }

    .form-actions button {
        width: 100%;
    }
}
</style>