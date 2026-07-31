<template>
    <div class="media-search">

        <input
            v-model="query"
            type="text"
            placeholder="Search media..."
            @input="search"
        />

        <div
            v-if="results.length > 0"
            class="results"
        >
            <div
                v-for="media in results"
                :key="media.id"
                class="result"
                @click="select(media)"
            >
                {{ media.title }} | {{ media.releaseYear }}  
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref } from "vue";
import { searchMedia } from "../../api/mediaAPI";

const props = defineProps({
    excludeIds: {
        type: Array,
        default: () => [],
    },
});

const emit = defineEmits(["selected"]);

const query = ref("");
const results = ref([]);

async function search() {

    if (query.value.trim().length < 2) {
        results.value = [];
        return;
    }

    try {

        const media = await searchMedia(query.value);

        results.value = media.filter(
            m => !props.excludeIds.includes(m.id)
        );

    } catch (error) {
        console.error(error);
    }
}

function select(media) {

    emit("selected", media);

    query.value = "";
    results.value = [];
}
</script>

<style scoped>

.media-search {
    position: relative;
}

input {
    width: 100%;
    padding: 8px;
}

.results {
    border: 1px solid #ccc;
    margin-top: 4px;
    max-height: 250px;
    overflow-y: auto;
}

.result {
    padding: 8px;
    cursor: pointer;
    background-color: black;
}

.result:hover {
    background: #292929;
}

</style>