<template>
    <section class="media-grid">

<MediaCard
    v-for="media in mediaList"
    :key="media.id"
    :media="media"
    :mode="mode"
    :to="{
        name: 'media',
        params: {
            id: media.id
        },
        query: {
            from: mode
        }
    }"
/>

    </section>

</template>

<script setup>

import MediaCard from "./MediaCard.vue";
import { RouterLink } from "vue-router";

defineProps({

    mediaList: {
        type: Array,
        required: true
    },
    mode: String,

});

</script>

<style scoped>

.media-grid {

    display: grid;

    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));

    gap: 1.5rem;

    margin-top: 2rem;

}

@media (max-width: 600px) {
    .media-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
    }
}

</style>