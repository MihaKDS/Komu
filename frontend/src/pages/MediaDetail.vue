<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useRoute } from "vue-router";

import { useAuth } from "../composables/useAuth"

const {
  user,
} = useAuth()

import Breadcrumbs from "../components/layout/Breadcrumbs.vue";
import AddCopyDialog from "../components/ui/AddCopyDialog.vue";

import { getMedia } from "../api/mediaAPI.js";
import EditCopy from "../components/ui/EditCopy.vue";
import MediaList from "../components/media/MediaList.vue";
import MediaGrid from "../components/media/MediaGrid.vue";

const route = useRoute();
const mediaDetails = ref(null);
const showAddCopy = ref(false);
const showEditCopy = ref(false);
const idEditCopy = ref(null);

// Get the current context from where user came
const currentContext = computed(() => route.query.from || 'search');

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

const sortedCollectionMedias = computed(() => {
    if (!mediaDetails.value || !mediaDetails.value.collection || !Array.isArray(mediaDetails.value.collection.medias)) return [];
    return [...mediaDetails.value.collection.medias].sort((a, b) => (a.collectionPosition ?? 0) - (b.collectionPosition ?? 0));
});

// View and filter state for the collection block
const collectionFormat = ref('ALL'); // ALL, DVD, BLURAY, UHD_4K
const collectionViewMode = ref('list'); // 'list' or 'grid'

function mediaHasFormat(media, format) {
    if (format === 'ALL') return true;
    const map = {
        DVD: media.dvd,
        BLURAY: media.bluray,
        UHD_4K: media.fourk,
    };
    return Boolean(map[format]);
}

const filteredCollectionMedias = computed(() => {
    return sortedCollectionMedias.value.filter((m) => mediaHasFormat(m, collectionFormat.value));
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
                <p v-if="copy.activeTrade">
                    Status:
                    <RouterLink :to="{ name: 'trade-detail', params: { id: copy.activeTrade.id }, query: { from: 'collection' } }">
                        {{ copy.activeTrade.status === 'RENTING' ? 'Renting' : 'Reserved' }}
                    </RouterLink>
                </p>
                <p v-else>
                    Status: Available
                </p>
                <p v-if="copy.boxSet">
                    Part of boxset
                    <RouterLink :to="{ name: 'boxset', params: { id: copy.boxSet.id } }">
                        {{ copy.boxSet.name || copy.boxSet.title }}
                    </RouterLink>
                </p>
                <p v-if="copy.boxSet?._count?.copies">
                    Movie {{ mediaDetails.media.collectionPosition || '?' }} / {{ copy.boxSet._count.copies }}
                </p>
                <p>{{ copy.listingNote }}</p>

                <div class="actions">

                    <button @click="showEditCopy = true, idEditCopy= copy.id">Edit</button>

                            <p v-if="copy.canSell">
                                💰 For sale
                            </p>

                            <p v-if="copy.canRent">
                                🎬 For rent
                            </p>
                            
                            <div v-if="copy.boxSet !== null">
                                <p v-if="copy.boxSet.canSell">
                                    💰 Boxset for sale
                                </p>
    
                                <p v-if="copy.boxSet.canRent">
                                    🎬 Boxset for rent
                                </p>
                            </div>

                        </div>

            </div>

        </section>

<details v-if="mediaDetails.otherCopies.length">

    <summary>
        Trade offers ({{ mediaDetails.otherOwnersCount }})
    </summary>

    <div
        v-for="copy in mediaDetails.otherCopies"
        :key="copy.id"
        class="copy-card"
    >
     <div v-if="copy.canRent || copy.canSell ">
         <strong>
             <RouterLink :to="{ name: 'seller-listings', params: { username: copy.owner.username }, query: { from: currentContext } }">
                 {{ copy.owner.username }}
             </RouterLink>
         </strong>
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
     <div v-if="copy.boxSet !== null ">
         <div v-if="copy.boxSet.canRent || copy.boxSet.canSell ">
             <strong>
                 <RouterLink :to="{ name: 'seller-listings', params: { username: copy.owner.username }, query: { from: currentContext } }">
                     {{ copy.owner.username }}
                 </RouterLink>
             </strong>
             <p v-if="copy.boxSet.canRent || copy.boxSet.canSell">
                 Part of boxset
                 <RouterLink :to="{ name: 'boxset', params: { id: copy.boxSet.id }, query: { from: currentContext } }">
                     {{ copy.boxSet.name || copy.boxSet.title }}
                 </RouterLink>
             </p>
             <p v-if="copy.boxSet.canSell">
                 💰 Boxset for sale: {{ copy.boxSet.sellPrice }} €
             </p>
     
             <p v-if="copy.boxSet.canRent">
                 🎬 Boxset for rent: {{ copy.boxSet.deposit }} €
                 <br>
                 € Per Month: {{ copy.boxSet.rentPrice }} €
             </p>
         </div>
     </div>

    </div>
    <div
    v-if="mediaDetails.otherCopies.length === 0"
    class="empty"
>
    Nobody is currently selling or renting this title.
</div>

</details>


        <div v-if="mediaDetails.collection" class="collection-block">
            <h3>Part of</h3>

            <div class="collection-controls">
                <label>
                    <!--Format:
                    <select v-model="collectionFormat">
                        <option value="ALL">All</option>
                        <option value="DVD">DVD</option>
                        <option value="BLURAY">Blu-ray</option>
                        <option value="UHD_4K">UHD / 4K</option>
                    </select>-->
                </label>

                <div class="view-toggle">
                    <button :class="{ active: collectionViewMode === 'list' }" @click.prevent="collectionViewMode = 'list'">List</button>
                    <button :class="{ active: collectionViewMode === 'grid' }" @click.prevent="collectionViewMode = 'grid'">Grid</button>
                </div>
            </div>

            <div class="collection-list-container">
                <component
                    :is="collectionViewMode === 'grid' ? MediaGrid : MediaList"
                    :mediaList="filteredCollectionMedias.map(m => ({ ...m, inCollection: true }))"
                    :mode="'collection'"
                    :compact="collectionViewMode === 'list'"
                    :currentId="mediaDetails.media.id"
                />
            </div>
        </div>

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
    width:100%;
    max-width:100%;

}

.media-header{

    display:flex;

    gap:3rem;

    align-items:flex-start;
    width:100%;
    max-width:100%;

}

.poster{

    flex-shrink:0;
    max-width:100%;

}

.poster img{

    width:min(280px, 100%);

    border-radius:12px;

    box-shadow:0 10px 25px rgba(0,0,0,.35);

}

.summary{

    flex:1;
    min-width:0;

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
    flex-wrap: wrap;

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

.collection-block{
  margin-top:2rem;
}

/* Horizontally scrollable list of media cards for the collection */
/* keep previous .pos style available if needed elsewhere */
.pos{
  width:2rem;
  text-align:right;
  color:#bbb;
}


.collection-block .collection-controls{
  display:flex;
  gap:1rem;
  align-items:center;
  margin-top:.5rem;
  flex-wrap:wrap;
}
.collection-block .collection-controls select{
  background:#222;
  color:#fff;
  border:1px solid #333;
  padding:.25rem .5rem;
  border-radius:6px;
}
.collection-block .view-toggle button{
  background:transparent;
  color:#ddd;
  border:1px solid #333;
  padding:.35rem .6rem;
  border-radius:6px;
  margin-left:.25rem;
  cursor:pointer;
}
.collection-block .view-toggle button.active{
  background:#3f8cff;
  color:#fff;
  border-color:rgba(63,140,255,0.6);
}

.collection-list-container{
  margin-top:1rem;
}

@media (max-width: 768px) {
  .media-detail {
    gap: 1.5rem;
    padding: 1rem;
  }

  .media-header {
    flex-direction: column;
    gap: 1.25rem;
  }

  .poster {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .poster img {
    width: min(220px, 100%);
  }

  .summary h1,
  .summary p,
  .description,
  .copy-card p {
    overflow-wrap: anywhere;
  }

  .collection-block .collection-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .collection-block .view-toggle {
    display: flex;
    width: 100%;
  }

  .collection-block .view-toggle button {
    flex: 1;
  }
}

</style>
