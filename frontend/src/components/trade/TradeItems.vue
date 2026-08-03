<template>
  <section class="trade-items">
    <article v-for="item in items" :key="item.id || item.copyId" class="trade-item">
      <img
        class="poster"
        :src="posterSource(item.media.poster)"
        :alt="item.media.title"
      >

      <div class="content">
        <RouterLink
          :to="{ name: 'media', params: { id: item.media.id }, query: { from: 'trades' } }"
          class="title-link"
        >
          {{ item.media.title }}
        </RouterLink>

        <p>{{ item.media.releaseYear }} • {{ item.media.category }}</p>
        <p>{{ item.edition }}</p>

        <p v-if="item.boxSet">
          Part of {{ item.boxSet.name || item.boxSet.title }}
        </p>
      </div>
    </article>
  </section>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
});

function posterSource(poster) {
  return poster?.startsWith("http") ? poster : `/posters/${poster}`;
}
</script>

<style scoped>
.trade-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.trade-item {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  background: #222;
}

.poster {
  width: 90px;
  height: 135px;
  object-fit: cover;
  border-radius: 10px;
}

.content p {
  margin: 0.25rem 0;
  color: #bbb;
}

.title-link {
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}

.title-link:hover {
  text-decoration: underline;
}
</style>
