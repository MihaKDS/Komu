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
            <p v-if="hasBoxSet">• Part of boxset: {{ boxSetLabel }}</p>
            <hr>
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

        <div v-if="hasBoxSet">
            <h3>Sell</h3>
            <label>
                <input type="radio" value="individual" v-model="form.boxSetSaleScope" />
                Sell individually
            </label>
            <label>
                <input type="radio" value="box" v-model="form.boxSetSaleScope" />
                Sell entire box
            </label>

            <div v-if="form.boxSetSaleScope === 'individual'">
                <label>
                    <input type="checkbox" v-model="form.canSell" />
                    Sell this copy individually
                </label>
                <div v-if="form.canSell">
                    Price
                    <input
                        type="number"
                        v-model.number="form.sellPrice"
                    >
                </div>
            </div>

            <div v-else>
                <p>Box name: {{ boxSetLabel }}</p>
                <label>
                    <input type="checkbox" v-model="form.boxSetCanSell" />
                    Sell entire box
                </label>
                <div v-if="form.boxSetCanSell">
                    Box price
                    <input
                        type="number"
                        v-model.number="form.boxSetSellPrice"
                    >
                    <label>Box listing note</label>
                    <input
                        type="text"
                        v-model="form.boxSetListingNote"
                        placeholder="Complete box set with slipcase"
                    />
                </div>
            </div>
        </div>

        <div v-else>
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
        </div>

        <hr>

        <div v-if="hasBoxSet">
            <h3>Lend</h3>
            <label>
                <input type="radio" value="individual" v-model="form.boxSetRentScope" />
                Lend this copy individually
            </label>
            <label>
                <input type="radio" value="box" v-model="form.boxSetRentScope" />
                Lend entire box
            </label>

            <div v-if="form.boxSetRentScope === 'individual'">
                <label>
                    <input type="checkbox" v-model="form.canRent" />
                    Lend this copy individually
                </label>
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
            </div>

            <div v-else>
                <p>Box name: {{ boxSetLabel }}</p>
                <label>
                    <input type="checkbox" v-model="form.boxSetCanRent" />
                    Rent entire box
                </label>
                <div v-if="form.boxSetCanRent">
                    Price / month
                    <input
                        type="number"
                        v-model.number="form.boxSetRentPrice"
                    >
                    Deposit
                    <input
                        type="number"
                        v-model.number="form.boxSetDeposit"
                    >
                </div>
            </div>
        </div>

        <div v-else>
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

    canRent: props.copy.canRent,
    rentPrice: props.copy.rentPrice,
    deposit: props.copy.deposit,

    boxSetSaleScope: props.copy.boxSet?.canSell ? 'box' : 'individual',
    boxSetRentScope: props.copy.boxSet?.canRent ? 'box' : 'individual',
    boxSetName: props.copy.boxSet?.name ?? props.copy.boxSet?.title ?? '',
    boxSetListingNote: props.copy.boxSet?.listingNote ?? '',
    boxSetCanSell: props.copy.boxSet?.canSell ?? false,
    boxSetSellPrice: props.copy.boxSet?.sellPrice ?? null,
    boxSetCanRent: props.copy.boxSet?.canRent ?? false,
    boxSetRentPrice: props.copy.boxSet?.rentPrice ?? null,
    boxSetDeposit: props.copy.boxSet?.deposit ?? null,
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
        canRent: form.canRent,
        rentPrice: form.canRent ? form.rentPrice : null,
        deposit: form.canRent ? form.deposit : null,
    }

    if (hasBoxSet.value) {
        if (form.boxSetSaleScope === 'box') {
            payload.canSell = false
            payload.sellPrice = null
            payload.boxSetCanSell = form.boxSetCanSell
            payload.boxSetSellPrice = form.boxSetSellPrice
            payload.boxSetListingNote = form.boxSetListingNote
        } else {
            payload.boxSetCanSell = false
        }

        if (form.boxSetRentScope === 'box') {
            payload.canRent = false
            payload.rentPrice = null
            payload.deposit = null
            payload.boxSetCanRent = form.boxSetCanRent
            payload.boxSetRentPrice = form.boxSetRentPrice
            payload.boxSetDeposit = form.boxSetDeposit
        } else {
            payload.boxSetCanRent = false
        }
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