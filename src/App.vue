<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import { useEmployees } from '@/composables/useEmployees'
import { useConfirmation } from '@/composables/useConfirmation'

const { mobile } = useDisplay()
const drawer = ref(!mobile.value)
const sidebarCollapsed = ref(true)
const desktopRail = computed(() => !mobile.value && sidebarCollapsed.value)
const storageMessage = ref('')
const storageSnackbarOpen = ref(false)
const { storageIssue, requiresRecovery, recoverSavedData } = useEmployees()
const {
  confirmation,
  requestConfirmation,
  resolveConfirmation,
  updateConfirmationOpen,
} = useConfirmation()

watch(mobile, (isMobile) => {
  drawer.value = !isMobile
})

watch(storageIssue, (message) => {
  if (message && !requiresRecovery.value) {
    storageMessage.value = message
    storageSnackbarOpen.value = true
  }
}, { immediate: true })

async function clearInvalidData() {
  const confirmed = await requestConfirmation({
    title: 'Clear unreadable saved data?',
    message: 'The unreadable organization data in this browser will be removed.',
    confirmLabel: 'Clear invalid data',
    confirmColor: 'error',
  })

  if (!confirmed) {
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
      :rail="desktopRail"
      :rail-width="84"
      color="surface"
      width="256"
    >
      <div class="brand-lockup" :class="{ 'brand-lockup-rail': desktopRail }">
        <div
          class="brand-mark"
          aria-hidden="true"
        >
          <v-icon
            icon="mdi-family-tree"
            size="22"
          />
        </div>
        <span v-if="!desktopRail">TeamMap</span>
        <v-spacer v-if="!desktopRail" />
        <v-tooltip
          v-if="!mobile"
          :text="desktopRail ? 'Expand sidebar' : 'Collapse sidebar'"
          location="right"
        >
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              class="sidebar-toggle"
              :aria-label="desktopRail ? 'Expand sidebar' : 'Collapse sidebar'"
              :icon="desktopRail ? 'mdi-chevron-double-right' : 'mdi-chevron-double-left'"
              variant="text"
              @click="sidebarCollapsed = !sidebarCollapsed"
            />
          </template>
        </v-tooltip>
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
        <div v-if="!desktopRail" class="local-first-note">
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
    <ConfirmationDialog
      :model-value="confirmation.open"
      :title="confirmation.title"
      :message="confirmation.message"
      :confirm-label="confirmation.confirmLabel"
      :confirm-color="confirmation.confirmColor"
      @update:model-value="updateConfirmationOpen"
      @confirm="resolveConfirmation(true)"
    />
  </v-app>
</template>
