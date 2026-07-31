<template>
    <input
        v-model="search"
        class="search-bar"
        type="text"
        placeholder="Search media..."
    >
</template>

<script setup>

import { ref, watch } from "vue";

const emit = defineEmits([
    "search"
]);

const search = ref("");

watch(search, (value) => {
    emit("search", value);
});

</script>

<style scoped>

.search-bar {
    width: 100%;

    padding: .75rem 1rem;

    font-size: 1rem;

    border: 1px solid #ccc;
    border-radius: 8px;

    box-sizing: border-box;
}

</style>