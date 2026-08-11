<template>
<div class="dialog-overlay">
<div class="edit-copy">

    <div class="dialog-header">
        <h2>Edit Copy</h2>

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
         MEDIA
         ===================================================== -->

    <div class="media-reference">

        <strong>
            {{ media.title }}
        </strong>

        <span>
            {{ media.releaseYear }}
        </span>
                <button
            type="button"
            class="delete-button"
            @click="deleteCopy"
        >
            Delete
        </button>
    </div>


    <!-- =====================================================
         CONTENT
         ===================================================== -->

    <section class="edit-section">

        <div class="section-title">
            <h3>Copy details</h3>
        </div>


        <div class="contains">

            <span class="detail-label">
                Edition
            </span>

            <div class="detail-value">
                {{ copy.edition }}
            </div>


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
                    @click="splitCopy"
                >
                    Split
                </button>

            </div>


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
                            from: 'collection'
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


        <!-- Note -->

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


    <!-- =====================================================
         SALE
         ===================================================== -->

    <section class="edit-section">

        <div class="section-title">
            <h3>Sale</h3>
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

                    <span>€</span>

                </div>

            </div>

        </div>

    </section>


    <!-- =====================================================
         ACTIONS
         ===================================================== -->

    <div class="form-actions">

        <button
            type="button"
            class="primary-button"
            @click="saveCopy"
        >
            Save
        </button>

        <button
            type="button"
            class="secondary-button"
            @click="emit('close')"
        >
            Cancel
        </button>

    </div>

</div>
</div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import {
    updateCopy,
    deleteCopyById,
    splitCopyById
} from '../../api/copyAPI'

const props = defineProps({
    media: Object,
    copy: Object
})

const emit = defineEmits([
    'saved',
    'close'
])

const form = reactive({
    canSell: props.copy.canSell,
    sellPrice: props.copy.sellPrice,

    listingNote: props.copy.listingNote,
    condition: props.copy.condition,

    canRent: props.copy.canRent,
    rentPrice: props.copy.rentPrice,
    deposit: props.copy.deposit,
})

const hasBoxSet = computed(() => props.copy?.boxSet != null)
const boxSetLabel = computed(
    () => props.copy?.boxSet?.name || props.copy?.boxSet?.title || 'Box set',
)

async function saveCopy() {
    const payload = {
        canSell: form.canSell,
        sellPrice: form.canSell ? form.sellPrice : null,
        listingNote: form.listingNote,
        condition: form.condition,
        canRent: form.canRent,
        rentPrice: form.canRent ? form.rentPrice : null,
        deposit: form.canRent ? form.deposit : null,
    }

    await updateCopy(
        props.copy.id,
        payload,
    )

    emit('saved')
    emit('close')
}

async function deleteCopy() {
    if (!confirm('Delete this copy?')) return

    await deleteCopyById(props.copy.id)

    emit('saved')
    emit('close')
}

async function splitCopy() {
    await splitCopyById(props.copy.id)

    emit('saved')
}
</script>
<style scoped>
.edit-copy {
    width: min(100%, 600px);
    height: 100dvh;
    max-height: 100dvh;

    overflow-y: auto;
    overscroll-behavior: contain;

    padding: 24px;

    color: var(--text);
    background: var(--accent-bg);

    border: 2px solid var(--border);
    border-radius: var(--radius);

    box-shadow: var(--shadow);
}


/* Header */

.dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    margin-bottom: 20px;
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
    border-radius: var(--radius-small);

    font-size: 24px;
    line-height: 1;

    cursor: pointer;
}

.close-button:hover {
    color: var(--text-h);
    background: var(--bg-hover);
}


/* Media reference */

.media-reference {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;

    margin-bottom: 20px;
    padding: 11px 12px;

    background: var(--bg);

    border: 2px solid var(--border);
    border-radius: var(--radius-small);
}

.media-reference strong {
    color: var(--text-h);

    font-size: 15px;
}

.media-reference span {
    color: var(--text-muted);

    font-size: 13px;
}


/* Sections */

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


/* Copy details */

.contains {
    display: flex;
    flex-direction: column;

    gap: 7px;
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
}

.small-button:hover {
    color: var(--text-h);
    background: var(--bg-hover);
}


/* Fields */

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


/* Sale / lending */

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


/* Actions */

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


/* Mobile */

@media (max-width: 600px) {

    .edit-copy {
        width: 100%;

        max-height: calc(100vh - 20px);

        padding: 18px;
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