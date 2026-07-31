<template>

    <div class="categories">

        <button
            v-for="category in props.categories"
            :key="category"
            :class="{ active: category === props.selected }"
            @click="select(category)"
        >
            {{ category }}
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
    }

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
    gap: .5rem;

    margin-bottom: 1rem;

}

button {

    padding: .5rem 1rem;

    border: 1px solid #666;

    background: #2b2b2b;

    color: #bdbdbd;

    border-radius: 8px;

    cursor: pointer;

    transition: .2s;
}

button:hover {

    background: #3a3a3a;

    color: white;
}

button.active {

    background: #ffffff;

    color: #222;

    border-color: white;
}

button.active:hover {

    background: #e9e9e9;
}

</style>