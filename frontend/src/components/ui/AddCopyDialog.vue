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
    
        </div>
    
        <button @click="saveCopy">
            Add
        </button>
    
        <button @click="emit('close')">
            Cancel
        </button>
    
    </div>
</div>    
</template>

<script setup>
import { reactive, computed } from "vue";
import { createCopy } from "../../api/copyAPI";
import MediaSearch from "../media/MediaSearch.vue";

const props = defineProps({
    media: {
        type: Object,
        required: true,
    },
});

const emit = defineEmits(["close", "saved"]);

const form = reactive({
    edition: "BLURAY",
    includesBluRay: false,
    partOfBox: false,
    items: [
        props.media 
    ]
});

const is4K = computed(() => form.edition === "UHD_4K");

async function saveCopy() {
    try {
        await createCopy({
            edition: form.edition,
            includesBluRay: form.includesBluRay,
            partOfBox: form.partOfBox,
            mediaIds: form.items.map(item => item.id),
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