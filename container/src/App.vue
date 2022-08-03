<script setup>

import MicroFrontend from "./components/MicroFrontend.vue";
</script>

<template>
  <main>
    <MicroFrontend host="http://localhost:5173" name="diceroll" static-container-name="test123"/>
    <MicroFrontend host="http://localhost:5175" name="wisdom"/>
  </main>
</template>

<style scoped>

</style>
