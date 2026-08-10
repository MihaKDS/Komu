<template>
<div class="categories">
    <button
        v-for="category in props.categories"
        :key="category"
        :class="{ active: category === props.selected }"
        @click="select(category)"
    >
        {{ category }}

        <span
            v-if="props.counts?.[category] != null"
            class="category-count"
        >
            {{ props.counts[category] }}
        </span>
    </button>
</div>
</template>

<script setup>

const props = defineProps({

    categories: {
        type: Array,
        required: true
    },

    selected: {
        type: String,
        required: true
    },
    counts: {
        type: Object,
        default: () => ({}),
    },

});

const emit = defineEmits([
    "change"
]);


function select(category) {

    emit("change", category);

}

</script>

<style scoped>

.categories {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;

    width: 100%;

    padding: 1px;

    background: var(--bg-secondary);

    border: 1px solid var(--border);
    border-radius: var(--radius);

    box-sizing: border-box;
}

.categories button {
    flex: 1 1 0;

    min-width: 70px;
    min-height: 36px;

    padding: 3px 6px;

    color: var(--text-secondary);
    background: var(--bg-secondary);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);

    font: inherit;
    font-size: 13px;
    font-weight: 500;

    cursor: pointer;

    transition:
        color 0.15s ease,
        background 0.15s ease,
        box-shadow 0.15s ease;
}

.categories button:hover {
    color: var(--text-h);
    background: var(--bg);
}

.categories button.active {
    color: var(--text-h);
    background: var(--accent-bg);

    box-shadow: var(--shadow);

    font-weight: 600;
}
.category-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    min-width: 15px;
    height: 15px;

    margin-left: 3px;
    padding: 0 2px;

    color: var(--text-muted);
    background: var(--accent-bg);

    border: 1px solid var(--border);
    border-radius: 10px;

    font-size: 10px;
    font-weight: 600;
}

.categories button.active .category-count {
    color: var(--accent-bg);
    background: var(--text-h);
    border-color: var(--text-h);
}
</style>