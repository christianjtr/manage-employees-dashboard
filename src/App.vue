<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

import { useEmployees } from '@/composables/useEmployees'

const { mobile } = useDisplay()
const drawer = ref(!mobile.value)
const storageMessage = ref('')
const storageSnackbarOpen = ref(false)
const { storageIssue, requiresRecovery, recoverSavedData } = useEmployees()

watch(mobile, (isMobile) => {
  drawer.value = !isMobile
})

watch(storageIssue, (message) => {
  if (message && !requiresRecovery.value) {
    storageMessage.value = message
    storageSnackbarOpen.value = true
  }
}, { immediate: true })

function clearInvalidData() {
  if (!window.confirm('Clear the unreadable saved organization data?')) {
    return
  }

  const result = recoverSavedData()

  if (!result.success) {
    storageMessage.value = result.message
    storageSnackbarOpen.value = true
  }
}
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
      <v-alert
        v-if="requiresRecovery"
        class="storage-recovery-alert"
        type="warning"
        variant="tonal"
        prominent
      >
        <div class="storage-recovery-content">
          <div>
            <strong>Saved data needs attention</strong>
            <p>{{ storageIssue }}</p>
            <small>TeamMap has not overwritten this browser data.</small>
          </div>
          <v-btn color="warning" variant="flat" @click="clearInvalidData">
            Clear invalid data
          </v-btn>
        </div>
      </v-alert>
      <router-view />
    </v-main>

    <v-snackbar v-model="storageSnackbarOpen" timeout="4500">
      {{ storageMessage }}
    </v-snackbar>
  </v-app>
</template>
