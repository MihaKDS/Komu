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

    padding: .55rem .75rem;

    font-size: .9rem;

    border: 1px solid #b8c0ca;
    border-radius: 4px;

    box-sizing: border-box;
}

</style>