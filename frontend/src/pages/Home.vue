<template>
  <div class="home page">
    <h1>Welcome to Komu</h1>

    <p class="lead">Choose a sector to start browsing:</p>

    <div class="sectors">
      <RouterLink :to="{ path: '/search', query: { category: 'MOVIE' } }" class="sector-button">Film</RouterLink>
      <RouterLink :to="{ path: '/search', query: { category: 'BOOK' } }" class="sector-button">Books</RouterLink>
      <RouterLink :to="{ path: '/search', query: { category: 'MANGA' } }" class="sector-button">Manga</RouterLink>
    </div>
  </div>
</template>

<script setup>
// simple page - no logic required
</script>

<style scoped>
.home {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: flex-start;
}

.lead {
  color: #bbb;
}

.sectors {
  display: flex;
  gap: 1rem;
}

.sector-button {
  padding: 1rem 1.25rem;
  background: #3f8cff;
  color: white;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 600;
}

.sector-button:hover {
  background: #3677d1;
}
</style>