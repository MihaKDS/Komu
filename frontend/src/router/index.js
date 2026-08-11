import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "../composables/useAuth"

const auth = useAuth()

import Home from "../pages/Home.vue";
import Search from "../pages/Search.vue";
import Collection from "../pages/Collection.vue";
import Trades from "../pages/Trades.vue";
import Lists from "../pages/Lists.vue";
import Profile from "../pages/Profile.vue";
import MediaDetail from "../pages/MediaDetail.vue";
import BoxSetDetail from "../pages/BoxSetDetail.vue";
import SellerListings from "../pages/SellerListings.vue";
import TradeDetail from "../pages/TradeDetail.vue";
import Login from '../pages/Login.vue'
import Register from "../pages/Register.vue";
import AddMedia from "../components/ui/AddMedia.vue";

const routes = [

    // Home
    {
        path: "/",
        name: "Home",
        component: Home,
        meta: {
            title: "Home",
            breadcrumb: "Home",
            showBreadcrumbs: false
        }
    },

    // Search
    {
        path: "/search",
        name: "Search",
        component: Search,
        meta: {
            title: "Search",
            breadcrumb: "Search"
        }
    },

    // Collection
    {
        path: "/collection",
        name: "Collection",
        component: Collection,
        meta: {
            title: "Collection",
            breadcrumb: "My Collection",
            requiresAuth: true
        }
    },

    // Trades
    {
        path: "/trades",
        alias: "/sharing",
        name: "trades",
        component: Trades,
        meta: {
            title: "Trades",
            breadcrumb: "Trades",
            requiresAuth: true
        }
    },
    {
        path: "/trades/:id",
        name: "trade-detail",
        component: TradeDetail,
        meta: {
            title: "Trade",
            breadcrumb: "Trade Details",
            parentBreadcrumb: "Trades",
            parentRoute: "/trades",
            requiresAuth: true,
        }
    },

    // Lists
    {
        path: "/lists",
        name: "Lists",
        component: Lists,
        meta: {
            title: "Lists",
            breadcrumb: "My Lists",
            requiresAuth: true
        }
    },

    // Profile
    {
        path: "/profile",
        name: "Profile",
        component: Profile,
        meta: {
            title: "Profile",
            breadcrumb: "My Profile",
            requiresAuth: true
        }
    },
    // add media route
    {
        path: "/add-media",
        name: "AddMedia",
        component: AddMedia,
        meta: {
            title: "Add Media",
            breadcrumb: "Add Media",
            requiresAuth: true
        }
    },

    // Media Detail
    {
        path: "/media/:id",
        name: "media",
        component: MediaDetail,
        meta: {
            title: "Media Details",
            breadcrumb: "Media",
            parentBreadcrumb: "Search",
            parentRoute: "/search"
        }
    },

    // Box Set Detail
    {
        path: '/boxsets/:id',
        name: 'boxset',
        component: BoxSetDetail,
        meta: {
            title: 'Box Set',
            breadcrumb: 'Box Set',
            parentBreadcrumb: "Search",
            parentRoute: "/search"
        }
    },

    // Seller Listings
    {
        path: '/seller/:username',
        name: 'seller-listings',
        component: SellerListings,
        meta: {
            title: 'Seller Listings',
            breadcrumb: 'Seller Listings',
            parentBreadcrumb: "Search",
            parentRoute: "/search"
        }
    },

    // Authentication pages (no breadcrumbs)
    {
        path: '/login',
        name: 'login',
        component: Login,
        meta: {
            title: 'Login',
            showBreadcrumbs: false
        }
    },
    {
        path: '/register',
        name: 'register',
        component: Register,
        meta: {
            title: 'Register',
            showBreadcrumbs: false
        }
    },

];

const router = createRouter({
    history: createWebHistory(),
    routes,

    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        }

        return { top: 0 };
    },
});

router.beforeEach(async (to) => {

  if (auth.token.value && !auth.user.value) {
    await auth.loadUser()
  }

  if (to.meta.requiresAuth && !auth.user.value) {
    return '/login'
  }
})

router.afterEach((to) => {

    document.title = `Komu - ${to.meta.title}`;

});

export default router;