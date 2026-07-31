<script setup>
import { ref, computed } from "vue";
import OwnerCard from "./OwnerCard.vue";

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    copies: {
        type: Array,
        default: () => []
    }
});

const expanded = ref(false);

function toggle() {
    expanded.value = !expanded.value;
}

const rentCount = computed(() =>
    props.copies.filter(copy => copy.canRent).length
);

const sellCount = computed(() =>
    props.copies.filter(copy => copy.canSell).length
);
</script>

<template>

    <div class="edition-panel">

        <button
            class="edition-header"
            @click="toggle"
        >

            <div class="edition-title">

                <span class="arrow">
                    {{ expanded ? "▼" : "►" }}
                </span>

                <h2>{{ title }}</h2>

            </div>

            <div class="edition-stats">

                <span>{{ copies.length }} owned</span>

                <span>{{ rentCount }} renting</span>

                <span>{{ sellCount }} selling</span>

            </div>

        </button>

        <Transition name="expand">

            <div
                v-if="expanded"
                class="owners"
            >

            <OwnerCard
                v-for="copy in copies"
                :key="copy.id"
                :copy="copy"
            />

            </div>

        </Transition>

    </div>

</template>

<style scoped>

.edition-panel{

    background:#262626;

    border:1px solid #444;

    border-radius:12px;

    margin-bottom:1rem;

    overflow:hidden;

}

.edition-header{

    width:100%;

    background:none;

    border:none;

    color:white;

    cursor:pointer;

    display:flex;

    justify-content:space-between;

    align-items:center;

    padding:1rem 1.5rem;

    transition:.2s;

}

.edition-header:hover{

    background:#303030;

}

.edition-title{

    display:flex;

    align-items:center;

    gap:1rem;

}

.arrow{

    font-size:1rem;

}

.edition-title h2{

    margin:0;

    font-size:1.2rem;

}

.edition-stats{

    display:flex;

    gap:1.5rem;

    color:#aaa;

    font-size:.9rem;

}

.owners{

    padding:1rem;

    background:#1d1d1d;

}

.expand-enter-active,
.expand-leave-active{

    transition:all .25s ease;

}

.expand-enter-from,
.expand-leave-to{

    opacity:0;

    transform:translateY(-8px);

}

</style>