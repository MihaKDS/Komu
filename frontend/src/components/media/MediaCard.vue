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

                <h3>{{ media.title }}</h3>

                <p>
                    {{ media.releaseYear }}                        
                </p>

                <div
                    v-if="mode === 'collection'"
                    class="media-formats"
                >
                    <div class="format">
                        <span>DVD</span>
                        <strong>{{ media.dvd }}</strong>
                    </div>

                    <div class="format">
                        <span>Blu-ray</span>
                        <strong>{{ media.bluray }}</strong>
                    </div>

                    <div class="format">
                        <span>4K</span>
                        <strong>{{ media.fourk }}</strong>
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
