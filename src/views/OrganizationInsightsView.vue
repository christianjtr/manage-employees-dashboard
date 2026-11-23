<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import brandMark from '@/assets/brand.svg'
import { useEmployees } from '@/composables/useEmployees'
import { getOrganizationInsights } from '@/domain/organization-insights'

const { employees, loadSampleOrganization } = useEmployees()
const router = useRouter()
const notification = ref('')
const notificationOpen = ref(false)

const insights = computed(() => getOrganizationInsights(employees.value))
const maxDepartmentCount = computed(() =>
  Math.max(1, ...insights.value.departments.map((department) => department.count)),
)
const maxManagerReports = computed(() =>
  Math.max(1, ...insights.value.managers.map((manager) => manager.directReports)),
)

const metrics = computed(() => [
  {
    label: 'People',
    value: insights.value.totalPeople,
    note: `${insights.value.activeCount} active · ${insights.value.inactiveCount} inactive`,
    icon: 'mdi-account-multiple-outline',
  },
  {
    label: 'Departments',
    value: insights.value.departmentCount,
    note: 'Named in people records',
    icon: 'mdi-view-grid-outline',
  },
  {
    label: 'Top level',
    value: insights.value.topLevelCount,
    note: 'People without a manager',
    icon: 'mdi-family-tree',
  },
  {
    label: 'Hierarchy levels',
    value: insights.value.hierarchyDepth,
    note: 'Deepest reporting path',
    icon: 'mdi-layers-triple-outline',
  },
])

function peopleLabel(count: number) {
  return `${count} ${count === 1 ? 'person' : 'people'}`
}

function reportsLabel(count: number) {
  return `${count} direct report${count === 1 ? '' : 's'}`
}

function notify(message: string) {
  notification.value = message
  notificationOpen.value = true
}

function loadSample() {
  const result = loadSampleOrganization()
  notify(result.success ? 'Sample organization loaded.' : result.message)
}
</script>

<template>
  <v-container class="page-container insights-page" fluid>
    <div class="page-heading">
      <div>
        <h1>Insights</h1>
        <div class="page-title-meta">
          <span>Computed from this browser's organization data</span>
        </div>
      </div>
    </div>

    <div v-if="employees.length === 0" class="insights-empty-state">
      <div class="empty-state-brand">
        <img :src="brandMark" alt="" />
      </div>
      <h2>No organization data yet</h2>
      <p>
        Add people or explore the fictional sample organization to see a summary of
        its structure.
      </p>
      <div class="empty-state-actions">
        <v-btn color="primary" @click="router.push('/people')">Go to People</v-btn>
        <v-btn variant="text" @click="loadSample">Load sample organization</v-btn>
      </div>
    </div>

    <template v-else>
      <v-row class="insights-grid">
        <v-col v-for="metric in metrics" :key="metric.label" cols="12" sm="6" lg="3">
          <v-card class="insight-stat-card" rounded="lg" variant="flat">
            <div class="insight-stat-icon">
              <v-icon :icon="metric.icon" size="22" />
            </div>
            <span class="insight-stat-label">{{ metric.label }}</span>
            <strong class="insight-stat-value">{{ metric.value }}</strong>
            <small class="insight-stat-note">{{ metric.note }}</small>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="insights-grid">
        <v-col cols="12" md="6">
          <v-card class="insight-card" rounded="lg" variant="flat">
            <div class="drawer-heading">
              <div>
                <p class="eyebrow">DISTRIBUTION</p>
                <h2>People by department</h2>
              </div>
            </div>
            <v-divider />
            <v-card-text class="insight-card-content">
              <div
                v-for="department in insights.departments"
                :key="department.department"
                class="insight-bar-row"
              >
                <div class="insight-bar-label">
                  <span>{{ department.department }}</span>
                  <strong>{{ department.count }}</strong>
                </div>
                <v-progress-linear
                  :model-value="(department.count / maxDepartmentCount) * 100"
                  color="primary"
                  height="8"
                  rounded
                  :aria-label="`${department.department}: ${peopleLabel(department.count)}`"
                />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card class="insight-card" rounded="lg" variant="flat">
            <div class="drawer-heading">
              <div>
                <p class="eyebrow">MANAGEMENT</p>
                <h2>Direct reports by manager</h2>
              </div>
            </div>
            <v-divider />
            <v-card-text class="insight-card-content">
              <p v-if="insights.managers.length === 0" class="insight-empty-note">
                No reporting relationships have been recorded yet.
              </p>
              <div
                v-for="manager in insights.managers"
                :key="manager.employeeId"
                class="insight-manager-row"
              >
                <div class="insight-manager-copy">
                  <strong>{{ manager.name }}</strong>
                  <small>{{ manager.position }} · {{ manager.department }}</small>
                </div>
                <div class="insight-manager-count">
                  <strong>{{ manager.directReports }}</strong>
                  <v-progress-linear
                    :model-value="(manager.directReports / maxManagerReports) * 100"
                    color="primary"
                    height="6"
                    rounded
                    :aria-label="`${manager.name}: ${reportsLabel(manager.directReports)}`"
                  />
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <p class="insights-footnote">
        Structure counts include active and inactive people. Insights are a read-only
        view of the current organization and are stored only in this browser.
      </p>
    </template>

    <v-snackbar v-model="notificationOpen" timeout="3000">
      {{ notification }}
    </v-snackbar>
  </v-container>
</template>
