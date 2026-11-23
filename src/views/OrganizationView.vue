<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import EmployeeDetailsPanel from '@/components/people/EmployeeDetailsPanel.vue'
import EmployeeEditorPanel from '@/components/people/EmployeeEditorPanel.vue'
import OrgChartNode from '@/components/organization/OrgChartNode.vue'
import type { Employee, EmployeeInput } from '@/domain/employee'
import { buildOrganizationTree, getFullName } from '@/domain/organization'
import { sampleOrganization } from '@/data/sample-organization'
import { useConfirmation } from '@/composables/useConfirmation'
import { useEmployees } from '@/composables/useEmployees'

const {
  employees,
  activeCount,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  loadSampleOrganization,
} = useEmployees()

const search = ref('')
const selectedId = ref<string | null>(null)
const editingId = ref<string | null>(null)
const defaultManagerId = ref<string | null>(null)
const editorOpen = ref(false)
const expandedIds = ref(new Set(employees.value.map((employee) => employee.id)))
const chartViewport = ref<HTMLElement | null>(null)
const zoom = ref(0.9)
const notification = ref('')
const notificationOpen = ref(false)
const {
  confirmation,
  requestConfirmation,
  resolveConfirmation,
  updateConfirmationOpen,
} = useConfirmation()

const roots = computed(() => buildOrganizationTree(employees.value))
const selectedEmployee = computed(
  () => employees.value.find((employee) => employee.id === selectedId.value) ?? null,
)
const editingEmployee = computed(
  () => employees.value.find((employee) => employee.id === editingId.value) ?? null,
)
const employeeById = computed(
  () => new Map(employees.value.map((employee) => [employee.id, employee])),
)

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
    .trim()
}

const matchingIds = computed(() => {
  const query = normalize(search.value)

  if (!query) {
    return new Set<string>()
  }

  return new Set(
    employees.value
      .filter((employee) =>
        [
          employee.firstName,
          employee.lastName,
          employee.email,
          employee.position,
          employee.department,
        ].some((value) => normalize(value).includes(query)),
      )
      .map((employee) => employee.id),
  )
})

const highlightedIds = computed(() => {
  const highlighted = new Set(matchingIds.value)

  for (const employeeId of matchingIds.value) {
    let current = employeeById.value.get(employeeId)

    while (current?.managerId) {
      highlighted.add(current.managerId)
      current = employeeById.value.get(current.managerId)
    }
  }

  return highlighted
})

function expandSearchPaths(expanded: Set<string>) {
  for (const employeeId of matchingIds.value) {
    let current = employeeById.value.get(employeeId)

    while (current?.managerId) {
      expanded.add(current.managerId)
      current = employeeById.value.get(current.managerId)
    }
  }
}

watch(matchingIds, async (matches) => {
  if (matches.size === 0) {
    return
  }

  const expanded = new Set(expandedIds.value)
  expandSearchPaths(expanded)

  expandedIds.value = expanded
  await nextTick()
  const firstMatch = matches.values().next().value as string | undefined

  if (firstMatch) {
    const selector = `[data-employee-id="${CSS.escape(firstMatch)}"] .employee-card`
    chartViewport.value
      ?.querySelector<HTMLElement>(selector)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
  }
})

function toggleExpanded(employeeId: string) {
  const next = new Set(expandedIds.value)

  if (next.has(employeeId)) {
    next.delete(employeeId)
  } else {
    next.add(employeeId)
  }

  expandedIds.value = next
}

function expandAll() {
  expandedIds.value = new Set(employees.value.map((employee) => employee.id))
}

function collapseAll() {
  const expanded = new Set<string>()
  expandSearchPaths(expanded)
  expandedIds.value = expanded
}

function openEditor(employee: Employee | null = null, manager: Employee | null = null) {
  editingId.value = employee?.id ?? null
  defaultManagerId.value = manager?.id ?? null
  selectedId.value = null
  editorOpen.value = true

  if (manager) {
    expandedIds.value = new Set([...expandedIds.value, manager.id])
  }
}

function notify(message: string) {
  notification.value = message
  notificationOpen.value = true
}

function savePerson(input: EmployeeInput) {
  const result = editingId.value
    ? updateEmployee(editingId.value, input)
    : createEmployee(input)

  if (!result.success) {
    notify(result.message)
    return
  }

  if (result.employee) {
    selectedId.value = result.employee.id
    expandedIds.value = new Set([
      ...expandedIds.value,
      result.employee.id,
      ...(result.employee.managerId ? [result.employee.managerId] : []),
    ])
  }

  editorOpen.value = false
  notify(editingId.value ? 'Person updated.' : 'Person added.')
}

async function removePerson(employee: Employee) {
  const reports = employees.value.filter((person) => person.managerId === employee.id)
  const reportNote =
    reports.length > 0
      ? ` Their ${reports.length} direct report${reports.length === 1 ? '' : 's'} will move to ${
          employee.managerId
            ? getFullName(employeeById.value.get(employee.managerId)!)
            : 'the top level'
        }.`
      : ''

  const confirmed = await requestConfirmation({
    title: `Delete ${getFullName(employee)}?`,
    message: `This person will be removed.${reportNote}`,
    confirmLabel: 'Delete person',
    confirmColor: 'error',
  })

  if (!confirmed) {
    return
  }

  const result = deleteEmployee(employee.id)

  if (!result.success) {
    notify(result.message)
    return
  }

  selectedId.value = null
  notify('Person deleted.')
}

async function loadSample() {
  if (
    employees.value.length > 0 &&
    !(await requestConfirmation({
      title: 'Replace the current organization?',
      message: 'The current people will be replaced with fictional sample data.',
      confirmLabel: 'Load sample',
      confirmColor: 'error',
    }))
  ) {
    return
  }

  const result = loadSampleOrganization()

  if (!result.success) {
    notify(result.message)
    return
  }

  expandedIds.value = new Set(sampleOrganization.map((employee) => employee.id))
  selectedId.value = null
  notify('Sample organization loaded.')
}

function zoomBy(amount: number) {
  zoom.value = Math.min(1.2, Math.max(0.6, Number((zoom.value + amount).toFixed(2))))
}

function resetZoom() {
  zoom.value = 0.9
  chartViewport.value?.scrollTo({ left: 0, top: 0, behavior: 'smooth' })
}
</script>

<template>
  <v-container class="page-container organization-page" fluid>
    <div class="page-heading organization-heading">
      <div>
        <p class="eyebrow">TEAM STRUCTURE</p>
        <h1>Organization</h1>
        <p class="page-description">
          See how people and teams connect across your organization.
        </p>
      </div>
      <div class="organization-actions">
        <v-btn
          variant="outlined"
          prepend-icon="mdi-database-import-outline"
          @click="loadSample"
        >
          {{ employees.length > 0 ? 'Load sample' : 'Explore sample' }}
        </v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-account-plus-outline"
          @click="openEditor()"
        >
          Add person
        </v-btn>
      </div>
    </div>

    <section class="organization-summary" aria-label="Organization summary">
      <div>
        <strong>{{ employees.length }}</strong>
        <span>{{ employees.length === 1 ? 'person' : 'people' }}</span>
      </div>
      <v-divider vertical />
      <div>
        <strong>{{ activeCount }}</strong>
        <span>active</span>
      </div>
      <span class="summary-note">All records are stored in this browser</span>
    </section>

    <v-card class="chart-shell" rounded="lg" variant="flat">
      <div class="chart-toolbar">
        <v-text-field
          v-model="search"
          class="chart-search"
          density="compact"
          prepend-inner-icon="mdi-magnify"
          placeholder="Find a person, role, or department"
          aria-label="Search organization"
          clearable
          hide-details
        />
        <span v-if="search" class="search-count">
          {{ matchingIds.size }} {{ matchingIds.size === 1 ? 'match' : 'matches' }}
        </span>
        <v-spacer />
        <v-tooltip text="Expand all branches">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-arrow-expand-all"
              aria-label="Expand all branches"
              variant="text"
              :disabled="employees.length === 0"
              @click="expandAll"
            />
          </template>
        </v-tooltip>
        <v-tooltip text="Collapse all branches">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-arrow-collapse-all"
              aria-label="Collapse all branches"
              variant="text"
              :disabled="employees.length === 0"
              @click="collapseAll"
            />
          </template>
        </v-tooltip>
        <v-divider vertical class="toolbar-divider" />
        <v-btn
          icon="mdi-minus"
          aria-label="Zoom out"
          variant="text"
          :disabled="zoom <= 0.6"
          @click="zoomBy(-0.1)"
        />
        <span class="zoom-value">{{ Math.round(zoom * 100) }}%</span>
        <v-btn
          icon="mdi-plus"
          aria-label="Zoom in"
          variant="text"
          :disabled="zoom >= 1.2"
          @click="zoomBy(0.1)"
        />
        <v-btn
          icon="mdi-fit-to-screen-outline"
          aria-label="Reset chart view"
          variant="text"
          @click="resetZoom"
        />
      </div>

      <div v-if="employees.length === 0" class="chart-empty-state">
        <div class="empty-canvas-icon">
          <v-icon icon="mdi-family-tree" size="30" />
        </div>
        <h2>Your organization map starts here</h2>
        <p>
          Add your first person or explore a fictional sample organization to
          see how the chart works.
        </p>
        <div class="empty-state-actions">
          <v-btn color="primary" @click="openEditor()">Add first person</v-btn>
          <v-btn variant="text" @click="loadSample">Load sample organization</v-btn>
        </div>
      </div>

      <div v-else ref="chartViewport" class="chart-viewport">
        <div
          class="chart-content"
          :style="{ '--chart-zoom': zoom }"
        >
          <div class="org-roots">
            <OrgChartNode
              v-for="root in roots"
              :key="root.employee.id"
              :node="root"
              :expanded-ids="expandedIds"
              :selected-id="selectedId"
              :highlighted-ids="highlightedIds"
              :matching-ids="matchingIds"
              @select="selectedId = $event.id"
              @toggle="toggleExpanded"
            />
          </div>
        </div>
      </div>
    </v-card>

    <EmployeeDetailsPanel
      :employee="selectedEmployee"
      :employees="employees"
      @close="selectedId = null"
      @edit="openEditor($event)"
      @delete="removePerson"
      @add-report="openEditor(null, $event)"
      @select="selectedId = $event.id"
    />
    <EmployeeEditorPanel
      v-model="editorOpen"
      :employee="editingEmployee"
      :employees="employees"
      :default-manager-id="defaultManagerId"
      @save="savePerson"
    />
    <v-snackbar v-model="notificationOpen" timeout="3000">
      {{ notification }}
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
  </v-container>
</template>
