<template>
    <nav class="breadcrumbs">

        <template
            v-for="(item, index) in items"
            :key="index"
        >

            <RouterLink
                v-if="item.to"
                :to="item.to"
            >
                {{ item.label }}
            </RouterLink>

            <span v-else>
                {{ item.label }}
            </span>

            <span
                v-if="index < items.length - 1"
                class="separator"
            >
                >
            </span>

        </template>

    </nav>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const props = defineProps({
    title: String
});
const route = useRoute();

const items = computed(() => {

    const breadcrumbs = [

        {
            label: "Home",
            to: "/"
        }

    ];
    switch (route.query.from) {

        case "collection":

            breadcrumbs.push({
                label: "My Collection",
                to: "/collection"
            });

            break;

        case "search":

            breadcrumbs.push({
                label: "Search",
                to: "/search"
            });

            break;

        case "seller":

            breadcrumbs.push({
                label: "Seller Listings",
            });

            break;

        case "trades":

            breadcrumbs.push({
                label: "Trades",
                to: "/trades"
            });

            break;

        case "books":

            breadcrumbs.push({
                label: "Books",
                to: "/books"
            });

            break;

        case "games":

            breadcrumbs.push({
                label: "Games",
                to: "/games"
            });

            break;

    }

    breadcrumbs.push({
        label: props.title || route.meta.title
    });
    return breadcrumbs;

});
</script>

<style scoped>

.breadcrumbs {
    display: flex;
    align-items: center;
    gap: .5rem;
    margin-bottom: 1rem;
}

.separator {
    color: #999;
}

a {
    text-decoration: none;
    color: #1976d2;
}

a:hover {
    text-decoration: underline;
}

span {
    color: #555;
}

</style>