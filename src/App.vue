<template>
  <div id="app">
    <v-app id="application">
      <v-app-bar app color="blue darken-3" dark>
        <v-toolbar-title>Manage employees</v-toolbar-title>
      </v-app-bar>
      <v-main>
        <router-view />
      </v-main>
    </v-app>
  </div>
</template>

<script>
export default {
  name: "App",
};
</script>
