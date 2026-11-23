<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()
const drawer = ref(!mobile.value)

watch(mobile, (isMobile) => {
  drawer.value = !isMobile
})
</script>

<template>
  <v-app>
    <v-app-bar
      v-if="mobile"
      color="surface"
      elevation="0"
      border="b"
    >
      <v-app-bar-nav-icon
        aria-label="Toggle navigation"
        @click="drawer = !drawer"
      />
      <v-toolbar-title class="font-weight-bold">
        TeamMap
      </v-toolbar-title>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      :permanent="!mobile"
      :temporary="mobile"
      color="surface"
      width="256"
    >
      <div class="brand-lockup">
        <div
          class="brand-mark"
          aria-hidden="true"
        >
          <v-icon
            icon="mdi-family-tree"
            size="22"
          />
        </div>
        <span>TeamMap</span>
      </div>

      <v-divider />

      <v-list
        class="navigation-list"
        nav
        aria-label="Main navigation"
      >
        <v-list-item
          to="/"
          prepend-icon="mdi-family-tree"
          title="Organization"
          exact
        />
        <v-list-item
          to="/people"
          prepend-icon="mdi-account-multiple-outline"
          title="People"
        />
      </v-list>

      <template #append>
        <div class="local-first-note">
          <v-icon
            icon="mdi-laptop"
            size="18"
          />
          <span>Stored in this browser</span>
        </div>
      </template>
    </v-navigation-drawer>

    <v-main class="app-main">
      <router-view />
    </v-main>
  </v-app>
</template>
