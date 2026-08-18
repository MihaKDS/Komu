<template>
<div class="home-page">

    <section class="home-hero">
        <p class="lead">
            Browse movies, TV shows, books and comics.
        </p>
    </section>


    <section class="browse-section">

        <h2>Browse</h2>

        <div class="sectors">

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


            <!--<RouterLink
                :to="{ path: '/search', query: { category: 'COMIC' } }"
                class="sector-button"
            >
                <span class="sector-icon">📖</span>
                <span>
                    <strong>Comics</strong>
                    <small>Browse comics</small>
                </span>
            </RouterLink> -->

        </div>

    </section>


    <section
        v-if="user"
        class="account-section"
    >

        <h2>Your Komu</h2>

        <div class="account-links">

            <RouterLink
                :to="{
                    path: '/collection',
                    query: { category: 'MOVIE' }
                }"
                class="account-button"
            >
                <span class="sector-icon">📦</span>

                <span>
                    <strong>My Collection</strong>
                    <small>Manage your collection</small>
                </span>
            </RouterLink>


            <RouterLink
                :to="{
                    path: '/trades',
                    query: { category: 'MOVIE' }
                }"
                class="account-button"
            >
                <span class="sector-icon">🔄</span>

                <span>
                    <strong>Trades</strong>
                    <small>View your trades</small>
                </span>
            </RouterLink>

        </div>

    </section>

</div>
</template>

<script setup>
import { useAuth } from '../composables/useAuth'

const {
  user,
} = useAuth()
</script>

<style scoped>
.home-page {
    width: 100%;
    max-width: 900px;

    margin: 0 auto;
    padding: 40px 20px 60px;
}


/* Hero */

.home-hero {
    text-align: center;
    padding: 35px 20px 45px;
}

.home-hero h1 {
    margin-bottom: 12px;
}

.home-hero .lead {
    margin: 0;

    color: var(--text-secondary);
    font-size: 18px;
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
        repeat(2, minmax(0, 1fr));

    gap: 14px;
}

.sector-button,
.account-button {
    display: flex;
    align-items: center;

    gap: 14px;

    min-height: 85px;

    padding: 16px;

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
    width: 44px;
    height: 44px;

    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    background: var(--accent-bg);

    border-radius: 10px;

    font-size: 22px;
}


/* Text inside buttons */

.sector-button span:last-child,
.account-button span:last-child {
    display: flex;
    flex-direction: column;

    gap: 3px;
}

.sector-button strong,
.account-button strong {
    font-size: 17px;
    font-weight: 600;
}

.sector-button small,
.account-button small {
    color: var(--text-muted);
    font-size: 13px;
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

    gap: 14px;
}


/* Mobile */

@media (max-width: 600px) {

    .home-page {
        padding: 25px 12px 40px;
    }

    .home-hero {
        padding: 25px 10px 30px;
    }

    .home-hero .lead {
        font-size: 16px;
    }

    .sectors,
    .account-links {
        grid-template-columns: 1fr;
    }

    .sector-button,
    .account-button {
        min-height: 72px;
    }
}
</style>