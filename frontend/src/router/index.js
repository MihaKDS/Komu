import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "../composables/useAuth"

const auth = useAuth()

import Home from "../pages/Home.vue";
import Search from "../pages/Search.vue";
import Collection from "../pages/Collection.vue";
import Sharing from "../pages/Sharing.vue";
import Lists from "../pages/Lists.vue";
import Profile from "../pages/Profile.vue";
import MediaDetail from "../pages/MediaDetail.vue";
import Login from '../pages/Login.vue'
import Register from "../pages/Register.vue";

const routes = [

    // Home
    {
        path: "/",
        name: "Home",
        component: Home,
        meta: {
            title: "Home"
        }
    },

    // Search
    {
        path: "/search",
        name: "Search",
        component: Search,
        meta: {
            title: "Search"
        }
    },

    // Collection
    {
        path: "/collection",
        name: "Collection",
        component: Collection,
        meta: {
            title: "Collection",
            requiresAuth: true
        }
    },

    // Sharing
    {
        path: "/sharing",
        name: "Sharing",
        component: Sharing,
        meta: {
            title: "Sharing",
            requiresAuth: true
        }
    },

    // Lists
    {
        path: "/lists",
        name: "Lists",
        component: Lists,
        meta: {
            title: "Lists",
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
            requiresAuth: true
        }
    },
    // Profile
    {
        path: "/media/:id",
        name: "media",
        component: MediaDetail,
        meta: {
            title: "Media Details"
        }
    },

    {
    path: '/login',
    name: 'login',
    component: Login,
    },
    {
    path: '/register',
    name: 'register',
    component: Register,
    },

];

const router = createRouter({

    history: createWebHistory(),

    routes

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