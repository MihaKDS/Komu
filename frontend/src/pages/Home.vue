<template>
    <div class="home-page">

        <!-- Global media search -->



        <!-- Browse -->
        <section class="browse-section">

            <h2>Browse</h2>
            <section class="home-search">
                <AllMediaSearch />
            </section>
            <div class="sectors">

                <RouterLink
                    :to="{ path: '/search', query: { category: 'BOOK' } }"
                    class="sector-button"
                >
                    <span class="sector-icon">📚</span>

                    <span>
                        <strong>Books</strong>
                        <small>Browse books</small>
                    </span>
                </RouterLink>

                <RouterLink
                    :to="{ path: '/search', query: { category: 'COMIC' } }"
                    class="sector-button"
                >
                    <span class="sector-icon">📖</span>

                    <span>
                        <strong>Comics</strong>
                        <small>Browse comics</small>
                    </span>
                </RouterLink>

                <RouterLink
                    :to="{ path: '/search', query: { category: 'MUSIC' } }"
                    class="sector-button"
                >
                    <span class="sector-icon">🎵</span>

                    <span>
                        <strong>Music</strong>
                        <small>Browse music</small>
                    </span>
                </RouterLink>

                <RouterLink
                    :to="{ path: '/search', query: { category: 'MOVIE' } }"
                    class="sector-button"
                >
                    <span class="sector-icon">🎬</span>

                    <span>
                        <strong>Movies</strong>
                        <small>Browse movies</small>
                    </span>
                </RouterLink>


                <RouterLink
                    :to="{ path: '/search', query: { category: 'TV_SHOW' } }"
                    class="sector-button"
                >
                    <span class="sector-icon">📺</span>

                    <span>
                        <strong>TV Shows</strong>
                        <small>Browse TV shows</small>
                    </span>
                </RouterLink>

            </div>

        </section>


        <!-- User area -->
        <section
            v-if="user"
            class="account-section"
        >

            <h2>Your Komu</h2>

            <div class="account-links">

                <RouterLink
                    to="/collection"
                    class="account-button"
                >
                    <span class="sector-icon">📦</span>

                    <span>
                        <strong>My Collection</strong>
                        <small>Manage your collection</small>
                    </span>
                </RouterLink>


                <RouterLink
                    to="/trades"
                    class="account-button"
                >
                    <span class="sector-icon">🔄</span>

                    <span>
                        <strong>Trades</strong>
                        <small>View your trades</small>
                    </span>
                </RouterLink>


               <!-- <RouterLink
                    to="/lists"
                    class="account-button"
                >
                    <span class="sector-icon">📋</span>

                    <span>
                        <strong>Lists</strong>
                        <small>Your watchlist and wishlist</small>
                    </span>
                </RouterLink>-->


                <RouterLink
                    to="/profile"
                    class="account-button"
                >
                    <span class="sector-icon">👤</span>

                    <span>
                        <strong>Profile</strong>
                        <small>Your account and activity</small>
                    </span>
                </RouterLink>

            </div>

        </section>

    </div>
</template>


<script setup>
import { useAuth } from "../composables/useAuth";
import AllMediaSearch from "../components/media/AllMediaSearch.vue";
const {
    user,
} = useAuth();
</script>


<style scoped>

.home-page {
    width: 100%;
    max-width: 900px;

    margin: 0 auto;
    padding: 30px 20px 60px;
}


/* Search */

.home-search {
    display: flex;
    justify-content: center;

    margin-bottom: 35px;
}

.home-search :deep(.all-media-search) {
    width: 100%;
    max-width: 600px;
}


/* Sections */

.browse-section,
.account-section {
    margin-top: 20px;
}

.browse-section h2,
.account-section h2 {
    margin-bottom: 16px;
}


/* Browse buttons */

.sectors {
    display: grid;

    grid-template-columns:
        repeat(3, minmax(0, 1fr));

    gap: 12px;
}

.sector-button,
.account-button {
    display: flex;
    align-items: center;

    gap: 10px;

    min-height: 70px;

    padding: 12px;

    color: var(--text-h);
    text-decoration: none;

    background: var(--bg-card);

    border: 1px solid var(--border);
    border-radius: var(--radius);

    transition:
        background-color 0.15s ease,
        border-color 0.15s ease,
        transform 0.15s ease,
        box-shadow 0.15s ease;
}

.sector-button:hover,
.account-button:hover {
    color: var(--text-h);

    background: var(--bg-hover);

    border-color: var(--accent-border);

    transform: translateY(-2px);

    box-shadow: var(--shadow-small);
}


/* Icons */

.sector-icon {
    width: 38px;
    height: 38px;

    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    background: var(--accent-bg);

    border-radius: 8px;

    font-size: 19px;
}


/* Text */

.sector-button span:last-child,
.account-button span:last-child {
    display: flex;
    flex-direction: column;

    gap: 2px;

    min-width: 0;
}

.sector-button strong,
.account-button strong {
    font-size: 15px;
    font-weight: 600;
}

.sector-button small,
.account-button small {
    color: var(--text-muted);
    font-size: 12px;
}


/* Account section */

.account-section {
    margin-top: 40px;

    padding-top: 28px;

    border-top: 1px solid var(--border);
}

.account-links {
    display: grid;

    grid-template-columns:
        repeat(2, minmax(0, 1fr));

    gap: 12px;
}
/* Home search */

.home-search {
    display: flex;
    justify-content: center;

    width: 100%;

    margin: 10px 0 45px;
}

.home-search :deep(.all-media-search) {
    width: 100%;
    max-width: 650px;
}

.home-search :deep(.all-media-search input) {
    width: 100%;
    height: 48px;

    box-sizing: border-box;

    padding: 0 16px;

    font-size: 16px;

    color: var(--text);
    background: var(--text-h);

    border: 1px solid var(--border);
    border-radius: var(--radius);

    outline: none;

    transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
}

.home-search :deep(.all-media-search input::placeholder) {
    color: var(--text-muted);
}

.home-search :deep(.all-media-search input:focus) {
    border-color: var(--accent-border);

    box-shadow: var(--shadow-small);
}


/* Search results */

.home-search :deep(.search-results) {
    width: 100%;

    margin-top: 6px;

    border: 1px solid var(--accent-bg);
    border-radius: var(--radius);

    background: #111;

    box-shadow: var(--shadow-small);
}



/* Mobile */

@media (max-width: 600px) {

    .home-page {
        padding: 20px 12px 40px;
    }

    .home-search {
        margin-bottom: 28px;
    }

    .sectors {
        grid-template-columns: 1fr;
    }

    .account-links {
        grid-template-columns: 1fr;
    }

    .sector-button,
    .account-button {
        min-height: 65px;
    }
        .home-search {
        margin: 5px 0 35px;
    }

    .home-search :deep(.all-media-search) {
        max-width: none;
    }

    .home-search :deep(.all-media-search input) {
        height: 44px;

        font-size: 15px;
    }
}

</style>