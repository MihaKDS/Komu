<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";

import { useAuth } from "../composables/useAuth"

const {
  user,
} = useAuth()

import Breadcrumbs from "../components/layout/Breadcrumbs.vue";
import AddCopyDialog from "../components/ui/AddCopyDialog.vue";

import { getMedia } from "../api/mediaAPI.js";
import EditCopy from "../components/ui/EditCopy.vue";

const route = useRoute();
const mediaDetails = ref(null);
const showAddCopy = ref(false);
const showEditCopy = ref(false);
const idEditCopy = ref(null);

async function loadMedia() {
    mediaDetails.value = await getMedia(route.params.id);
    console.log(mediaDetails.value)
}

function editCopy(id) {
    idEditCopy.value = id;
    showEditCopy.value = true;
}

function posterSource(poster) {
    return poster?.startsWith("http") ? poster : `/posters/${poster}`;
}

onMounted(loadMedia);
watch(
    () => route.params.id,
    loadMedia
);

watch(mediaDetails, (details) => {
    if (details) {
        document.title = `Komu - ${details.media.title}`;
    }
});
</script>

<template>

<main v-if="mediaDetails">

    <Breadcrumbs :title="mediaDetails.media.title" />

    <div class="media-detail">

        <section class="media-header">

            <div class="poster">
                <img
                    :src="posterSource(mediaDetails.media.poster)"
                    :alt="mediaDetails.media.title"
                >
            </div>

            <div class="summary">

                <h1>{{ mediaDetails.media.title }}</h1>

                <p>
                    {{ mediaDetails.media.releaseYear }}
                    •
                    {{ mediaDetails.media.category }}
                </p>

                <p class="description">
                    {{ mediaDetails.media.description }}
                </p>

                <button
                    v-if="user"
                    @click="showAddCopy = true"
                    >
                    Add to collection
                </button>

            </div>

        </section>

        <section v-if="user">

            <h2>Your copies</h2>

            <div
                v-if="mediaDetails.myCopies.length === 0"
                class="empty"
            >
                You don't own this media yet.
            </div>

            <div
                v-for="copy in mediaDetails.myCopies"
                :key="copy.id"
                class="copy-card"
            >

                <strong>{{ copy.edition }} <div v-if="copy.includesBluRay" >with Blue Ray</div></strong>

                <p>{{ copy.condition }}</p>
                <p>{{ copy.listingNote }}</p>

                <div class="actions">

                    <button @click="showEditCopy = true, idEditCopy= copy.id">Edit</button>

                    <button v-if="copy.canSell">
                        Selling
                    </button>

                    <button v-if="copy.canRent">
                        Renting
                    </button>

                </div>

            </div>

        </section>

<details v-if="mediaDetails.otherCopies.length">

    <summary>
        Other owners ({{ mediaDetails.otherOwnersCount }})
    </summary>

    <div
        v-for="copy in mediaDetails.otherCopies"
        :key="copy.id"
        class="copy-card"
    >
        <strong>{{ copy.owner.username }}</strong>

        <p>
            {{ copy.edition }}
            •
            {{ copy.condition }}
        </p>
        <p>
            {{ copy.listingNote }}
        </p>

        <p v-if="copy.canSell">
            💰 For sale: {{ copy.sellPrice }} €
        </p>

        <p v-if="copy.canRent">
            🎬 For rent: {{ copy.rentPrice }} €
            <br>
            Deposit: {{ copy.deposit }} €
        </p>

    </div>
    <div
    v-if="mediaDetails.otherCopies.length === 0"
    class="empty"
>
    Nobody is currently selling or renting this title.
</div>

</details>


        <AddCopyDialog
            v-if="showAddCopy"
            :media="mediaDetails.media"
            @close="showAddCopy = false"
            @saved="loadMedia"
        />
        <EditCopy 
            v-if="showEditCopy"
            :media = "mediaDetails.media"
            :copy="mediaDetails.myCopies.find(copy => copy.id === idEditCopy)"
            @close="showEditCopy = false"
            @saved="loadMedia"
        />

    </div>

</main>

</template>

<style scoped>

.media-detail{

    display:flex;
    flex-direction:column;

    gap:3rem;

    padding:2rem;

}

.media-header{

    display:flex;

    gap:3rem;

    align-items:flex-start;

}

.poster{

    flex-shrink:0;

}

.poster img{

    width:280px;

    border-radius:12px;

    box-shadow:0 10px 25px rgba(0,0,0,.35);

}

.summary{

    flex:1;

}

.summary h1{

    margin-top:0;

    margin-bottom:1rem;

}

.summary p{

    margin-bottom:.75rem;

}

.description{

    margin-top:2rem;

    line-height:1.6;

    color:#aaa;

}

.copy-card {

    border: 1px solid #333;

    border-radius: 8px;

    padding: 1rem;

    margin-bottom: 1rem;

}

.actions {

    display: flex;

    gap: .5rem;

    margin-top: 1rem;

}

.empty {

    color: #888;

    font-style: italic;

}

details {

    margin-top: 2rem;

}

summary {

    cursor: pointer;

    font-weight: bold;

}

</style>
