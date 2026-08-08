<template>
<div class="dialog-overlay">
    <div class="dialog">
    
        <h2>Add to Collection</h2>
    
        <div>
            <label>Edition</label>
    
            <select v-model="form.edition">
                <option value="DVD">DVD</option>
                <option value="BLURAY">Blu-ray</option>
                <option value="UHD_4K">4K UHD</option>
            </select>
        </div>
    
        <div v-if="is4K">
            <label>
                <input
                    type="checkbox"
                    v-model="form.includesBluRay"
                >
                Includes Blu-ray
            </label>
        </div>
    
        <div>
            <label>
                <input
                    type="checkbox"
                    v-model="form.partOfBox"
                >
                Part of a box set
            </label>
        </div>
    
        <div v-if="form.partOfBox">
            <div>
                <label>
                    <input
                        type="radio"
                        value="new"
                        v-model="form.boxSetMode"
                    >
                    Create new box set
                </label>
                <label>
                    <input
                        type="radio"
                        value="existing"
                        v-model="form.boxSetMode"
                    >
                    Add to existing box set
                </label>
            </div>

            <div v-if="form.boxSetMode === 'existing'">
                <label>Existing box set</label><br>
                <select v-model="form.existingBoxSetId">
                    <option value="">Select box set</option>
                    <option
                        v-for="boxSet in existingBoxSets"
                        :key="boxSet.id"
                        :value="boxSet.id"
                    >
                        {{ boxSet.name || boxSet.title || `Box Set #${boxSet.id}` }} ({{ boxSet.copyCount }})
                    </option>
                </select>
            </div>

            <h3>Items in box</h3>
                <MediaSearch
                    :exclude-ids="form.items.map(item => item.id)"
                    @selected="addItem"
                />
            <ul>
                <li
                    v-for="item in form.items"
                    :key="item.mediaId"
                >
                    {{ item.title }} |
                    {{ item.releaseYear }}  
                    <hr>
                </li>
            </ul>

            <template v-if="form.boxSetMode === 'new'">
                <div>
                    <label>Box set name</label><br>
                    <input v-model="form.boxSetName" placeholder="Harry Potter 4K Collector's Box" />
                </div>

                <div>
                    <label>Box listing note</label><br>
                    <input v-model="form.boxSetListingNote" placeholder="Complete 8-movie set" />
                </div>

                <div>
                    <label>
                        <input type="checkbox" v-model="form.boxSetCanSell" />
                        Sell entire box
                    </label>
                    <div v-if="form.boxSetCanSell">
                        Price: <input type="number" v-model.number="form.boxSetSellPrice" />
                    </div>
                </div>

                <div>
                    <label>
                        <input type="checkbox" v-model="form.boxSetCanRent" />
                        Rent entire box
                    </label>
                    <div v-if="form.boxSetCanRent">
                        Price / month: <input type="number" v-model.number="form.boxSetRentPrice" />
                        Deposit: <input type="number" v-model.number="form.boxSetDeposit" />
                    </div>
                </div>
            </template>

        </div>
    
        <button @click="saveCopy" :disabled="form.partOfBox && form.boxSetMode === 'existing' && !form.existingBoxSetId">
            Add
        </button>
    
        <button @click="emit('close')">
            Cancel
        </button>
    
    </div>
</div>    
</template>

<script setup>
import { reactive, computed, onMounted, ref } from "vue";
import { createCopy } from "../../api/copyAPI";
import { getMyBoxSets } from "../../api/boxsetAPI";
import MediaSearch from "../media/MediaSearch.vue";

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
    boxSetRentPrice: null,
    boxSetDeposit: null,
});

const is4K = computed(() => form.edition === "UHD_4K");

onMounted(async () => {
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
            boxSetRentPrice: form.boxSetMode === 'new' ? form.boxSetRentPrice : undefined,
            boxSetDeposit: form.boxSetMode === 'new' ? form.boxSetDeposit : undefined,
        });

        emit("saved");
        emit("close");
    } catch (err) {
        console.error(err);
    }
};

function addItem(media) {
    form.items.push(media);
}
</script>
<style scoped>
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