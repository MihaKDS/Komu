<template>
    <nav v-if="showBreadcrumbs" class="breadcrumbs-container">
        <div class="breadcrumbs">
            <button 
                v-if="showBackButton"
                type="button"
                @click="goBack"
                class="back-button"
                title="Go back to previous page"
            >
                ← Back
            </button>

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
        </div>
    </nav>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const props = defineProps({
    title: String
});
const route = useRoute();
const router = useRouter();

const showBackButton = ref(false);

// Pages that are directly accessible from Home (one route away)
// Don't show back button on these pages
const mainPages = ['Search', 'Collection', 'Lists', 'Profile', 'trades'];

// Track navigation history to enable proper back functionality
onMounted(() => {
    // Show back button only if:
    // 1. User has navigation history (not first page load)
    // 2. Current page is NOT a main page
    const isMainPage = mainPages.includes(route.name);
    showBackButton.value = !isMainPage && window.history.length > 1;
});

function goBack() {
    router.back();
}

const showBreadcrumbs = computed(() => {
    return route.meta.showBreadcrumbs !== false;
});

// Map query parameter values to breadcrumb context
const contextBreadcrumbMap = {
    'collection': { label: 'My Collection', to: '/collection' },
    'search': { label: 'Search', to: '/search' },
    'seller': { label: 'Seller Listings', to: null },
    'trades': { label: 'Trades', to: '/trades' },
    'books': { label: 'Books', to: null },
    'games': { label: 'Games', to: null },
};

const items = computed(() => {

    const breadcrumbs = [
        {
            label: "Home",
            to: "/"
        }
    ];

    // Check if there's a context query parameter (from where user came)
    const fromContext = route.query.from;
    const contextBreadcrumb = contextBreadcrumbMap[fromContext];

    if (contextBreadcrumb) {
        // Use context-based breadcrumb if available
        breadcrumbs.push(contextBreadcrumb);
    } else if (route.meta.parentBreadcrumb && route.meta.parentRoute) {
        // Fall back to route metadata parent breadcrumb
        breadcrumbs.push({
            label: route.meta.parentBreadcrumb,
            to: route.meta.parentRoute
        });
    }

    // Add current page breadcrumb
    let currentLabel = props.title || route.meta.breadcrumb || route.meta.title;

    // Handle dynamic page titles
    if (route.name === 'seller-listings') {
        currentLabel = `${route.params.username}'s Listings`;
    }
    if (route.name === 'media' || route.name === 'boxset') {
        // Will be overridden by component's title prop
        currentLabel = props.title || currentLabel;
    }
    if (route.name === 'trade-detail') {
        currentLabel = props.title || `Trade #${route.params.id}`;
    }

    breadcrumbs.push({
        label: currentLabel
    });

    return breadcrumbs;

});
</script>

<style scoped>

.breadcrumbs-container {
    margin-bottom: 1rem;
}

.breadcrumbs {
    display: flex;
    align-items: center;
    gap: .75rem;
}

.back-button {
    background: #3f8cff;
    color: white;
    border: none;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    white-space: nowrap;
    transition: background-color 0.2s;
}

.back-button:hover {
    background: #2e6dcc;
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