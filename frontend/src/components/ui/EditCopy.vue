<template>
<div class="dialog-overlay">
    <div class="dialog">

        <h2>Edit Copy</h2>

        <p>{{ media.title }} ({{ media.releaseYear }})</p>

        <div>
            <strong>Contains:</strong><br>

            • {{ copy.edition }}

            <div v-if="copy.includesBluRay">
                • Blu-ray
                <button @click="splitCopy">Split</button>
            </div>
            <p v-if="hasBoxSet">
                • Part of
                <RouterLink :to="{ name: 'boxset', params: { id: copy.boxSet.id }, query: { from: 'collection' } }">
                    Box Set #{{ copy.boxSet.id }}
                </RouterLink>
            </p>
            <hr>
            <label>Condition</label><br>
            <select v-model="form.condition">
                <option value="MINT">Mint</option>
                <option value="VERY_GOOD">Very Good</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
            </select>
            <br><br>
            <label>Note about item:</label><br>
            <textarea
                v-model="form.listingNote"
                maxlength="50"
                rows="1"
                placeholder="Extended Edition with slipcover..."
            ></textarea>

            <div class="char-counter">
                {{ form.listingNote?.length || 0 }}/50
            </div>
        </div>

        <hr>

        <h3>
            <input type="checkbox" v-model="form.canSell">
            Sell
        </h3>

        <div v-if="form.canSell">
            Price
            <input
                type="number"
                v-model.number="form.sellPrice"
            >
        </div>

        <hr>

        <h3>
            <input type="checkbox" v-model="form.canRent">
            Lend
        </h3>

        <div v-if="form.canRent">
            Deposit
            <input
                type="number"
                v-model.number="form.deposit"
            >

            Price / month
            <input
                type="number"
                v-model.number="form.rentPrice"
            >
        </div>

        <hr>

        <button @click="saveCopy">
            Save
        </button>

        <button @click="deleteCopy">
            Delete Copy
        </button>

        <button @click="emit('close')">
            Cancel
        </button>

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
textarea {
    width: 100%;
    min-height: 2px;
    padding: 8px;
    font: inherit;
    resize: vertical;
    box-sizing: border-box;
}

.char-counter {
    text-align: right;
    font-size: 0.8rem;
    color: #777;
}
input{
    width: 3em;
}
.dialog-overlay {
    position: fixed;
    inset: 0;

    display: flex;
    justify-content: center;
    align-items: center;

    background: rgba(224, 223, 223, 0.8);

    z-index: 1000;
}

.dialog {
    background: rgba(0, 0, 0, 0.45);

    color: whitesmoke;

    border: solid 1px white;

    border-radius: 14px;

    padding: 2rem;

    width: min(500px, 90vw);

    box-shadow:
        0 10px 30px rgba(0, 0, 0, .5);

    animation: dialogAppear .18s ease;

    position: relative;
}

@keyframes dialogAppear {

    from {
        opacity: 0;
        transform: scale(.95);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }

}
.close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;

    border: none;
    background: transparent;

    font-size: 1.5rem;
    cursor: pointer;
}
</style>