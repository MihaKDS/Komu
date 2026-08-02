<template>
    <RouterLink
        :to="to"
        class="media-card"
    >
        <article class="media-card">

            <img
                :src="posterSource(media.poster)"
                :alt="media.title"
            >

            <div class="content">

                <div class="card-meta">
                    <h3>{{ media.title }}</h3>
                    <span v-if="media.inCollection" class="collection-badge">In collection</span>
                    <span v-if="media.hasSell" class="sell-badge">Selling</span>
                    <span v-if="media.hasRent" class="rent-badge">Renting</span>
                </div>

                <p>
                    {{ media.isCollectionGroup ? 'Collection' : media.releaseYear }}
                </p>

                <p v-if="media.isCollectionGroup" class="collection-summary">
                    {{ media.collectionSize }} titles
                </p>

                <p v-else-if="media.availableCopies != null" class="available-copies">
                    {{ media.availableCopies }} available for sale or rent
                </p>

                <div
                    class="media-formats"
                    v-if="!media.isCollectionGroup"
                >
                    <div class="format">
                        <span>DVD</span>
                        <strong>{{ media.dvd ?? 0 }}</strong>
                    </div>

                    <div class="format">
                        <span>Blu-ray</span>
                        <strong>{{ media.bluray ?? 0 }}</strong>
                    </div>

                    <div class="format">
                        <span>UHD</span>
                        <strong>{{ media.fourk ?? 0 }}</strong>
                    </div>
                </div>

            </div>

        </article>
    </RouterLink>
</template>

<script setup>

defineProps({

    media: {
        type: Object,
        required: true
    },
    showOwnership: {
        type: Boolean,
        default: false,
    },
    mode: String,
    to: { 
        type:[String, Object],
        required: true,
    }
});

function posterSource(poster) {
    return poster?.startsWith("http") ? poster : `/posters/${poster}`;
}
</script>

<style scoped>
.media-card{
    width:220px;
    background:#2b2b2b;
    border-radius:12px;
    overflow:hidden;
    color: white;
    text-decoration: none;

    transition:transform .2s ease,
               box-shadow .2s ease;

    cursor:pointer;
}

.media-card:hover{
    transform:translateY(-4px);
    box-shadow:0 8px 20px rgba(0,0,0,.35);
}

.media-card img{
    width:100%;
    height:320px;
    object-fit:cover;
    display:block;
}

.media-card-content{
    padding:1rem;
}

.media-card h3{
    margin:0;
    color:#fff;
    font-size:1.25rem;
}

.card-meta{
    display:flex;
    flex-wrap:wrap;
    gap:.5rem;
    align-items:center;
    margin-bottom:.5rem;
}

.collection-badge{
    background:#3f8cff;
    color:#fff;
    padding:.25rem .6rem;
    border-radius:999px;
    font-size:.75rem;
}

.available-copies{
    margin:.5rem 0;
    color:#d4d4d4;
    font-size:.9rem;
}

.collection-summary{
    margin:.35rem 0;
    color:#d4d4d4;
    font-size:.95rem;
}

.media-card .meta{
    margin:.4rem 0 1rem;
    color:#aaa;
    font-size:.9rem;
}

.media-formats{
    display:flex;
    justify-content:space-between;
    border-top:1px solid #444;
    padding-top:.75rem;
}

.format{
    display:flex;
    flex-direction:column;
    align-items:center;
}

.format span{
    font-size:.75rem;
    color:#999;
    text-transform:uppercase;
}

.format strong{
    color:#fff;
    font-size:1rem;
    margin-top:.2rem;
}
</style>
