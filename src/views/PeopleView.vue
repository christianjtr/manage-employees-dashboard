<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'

import EmployeeDetailsPanel from '@/components/people/EmployeeDetailsPanel.vue'
import EmployeeEditorPanel from '@/components/people/EmployeeEditorPanel.vue'
import type { Employee, EmployeeInput } from '@/domain/employee'
import { getFullName } from '@/domain/organization'
import { useEmployees } from '@/composables/useEmployees'

const {
  employees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  loadSampleOrganization,
} = useEmployees()
const { mobile } = useDisplay()

const search = ref('')
const departmentFilter = ref<string | null>(null)
const positionFilter = ref<string | null>(null)
const statusFilter = ref<Employee['status'] | null>(null)
const selectedId = ref<string | null>(null)
const editingId = ref<string | null>(null)
const defaultManagerId = ref<string | null>(null)
const editorOpen = ref(false)
const notification = ref('')
const notificationOpen = ref(false)

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

const departments = computed(() =>
  [...new Set(employees.value.map((employee) => employee.department))].sort(),
)
const positions = computed(() =>
  [...new Set(employees.value.map((employee) => employee.position))].sort(),
)

const filteredEmployees = computed(() => {
  const query = normalize(search.value)

  return employees.value.filter((employee) => {
    const matchesQuery =
      !query ||
      [
        employee.firstName,
        employee.lastName,
        employee.email,
        employee.position,
        employee.department,
      ].some((value) => normalize(value).includes(query))

    return (
      matchesQuery &&
      (!departmentFilter.value || employee.department === departmentFilter.value) &&
      (!positionFilter.value || employee.position === positionFilter.value) &&
      (!statusFilter.value || employee.status === statusFilter.value)
    )
  })
})

const rows = computed(() =>
  filteredEmployees.value.map((employee) => ({
    employee,
    id: employee.id,
    name: getFullName(employee),
    email: employee.email,
    position: employee.position,
    department: employee.department,
    managerName: employee.managerId
      ? employeeById.value.get(employee.managerId)
        ? getFullName(employeeById.value.get(employee.managerId)!)
        : 'Unknown manager'
      : 'Top level',
    status: employee.status,
  })),
)

const desktopHeaders = [
  { title: 'Name', key: 'name' },
  { title: 'Position', key: 'position' },
  { title: 'Department', key: 'department' },
  { title: 'Manager', key: 'managerName' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]
const headers = computed(() =>
  mobile.value
    ? [
        { title: 'Name', key: 'name' },
        { title: 'Status', key: 'status' },
        { title: '', key: 'actions', sortable: false, align: 'end' as const },
      ]
    : desktopHeaders,
)

function openEditor(
  employee: Employee | null = null,
  manager: Employee | null = null,
) {
  editingId.value = employee?.id ?? null
  defaultManagerId.value = manager?.id ?? null
  selectedId.value = null
  editorOpen.value = true
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

  editorOpen.value = false
  if (result.employee) {
    selectedId.value = result.employee.id
  }
  notify(editingId.value ? 'Person updated.' : 'Person added.')
}

function removePerson(employee: Employee) {
  const reports = employees.value.filter((person) => person.managerId === employee.id)
  const reportNote =
    reports.length > 0
      ? ` Their ${reports.length} direct report${reports.length === 1 ? '' : 's'} will move to ${
          employee.managerId
            ? getFullName(employeeById.value.get(employee.managerId)!)
            : 'the top level'
        }.`
      : ''

  if (!window.confirm(`Delete ${getFullName(employee)}?${reportNote}`)) {
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

function loadSample() {
  if (
    employees.value.length > 0 &&
    !window.confirm('Replace the current organization with fictional sample data?')
  ) {
    return
  }

  const result = loadSampleOrganization()
  notify(result.success ? 'Sample organization loaded.' : result.message)
}

function clearFilters() {
  search.value = ''
  departmentFilter.value = null
  positionFilter.value = null
  statusFilter.value = null
}
</script>

<template>
  <v-container class="page-container people-page" fluid>
    <div class="page-heading people-heading">
      <div>
        <p class="eyebrow">DIRECTORY</p>
        <h1>People</h1>
        <p class="page-description">
          Manage the people who make up your organization.
        </p>
      </div>
      <div class="organization-actions">
        <v-btn
          variant="outlined"
          prepend-icon="mdi-database-import-outline"
          @click="loadSample"
        >
          Load sample
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

    <v-card class="directory-shell" rounded="lg" variant="flat">
      <div class="directory-toolbar">
        <v-text-field
          v-model="search"
          class="directory-search"
          density="compact"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search name or email"
          aria-label="Search people by name or email"
          clearable
          hide-details
        />
        <v-select
          v-model="departmentFilter"
          class="directory-filter"
          density="compact"
          label="Department"
          :items="departments"
          clearable
          hide-details
        />
        <v-select
          v-model="positionFilter"
          class="directory-filter"
          density="compact"
          label="Position"
          :items="positions"
          clearable
          hide-details
        />
        <v-select
          v-model="statusFilter"
          class="directory-filter status-filter"
          density="compact"
          label="Status"
          :items="[
            { title: 'Active', value: 'active' },
            { title: 'Inactive', value: 'inactive' },
          ]"
          clearable
          hide-details
        />
        <v-btn
          aria-label="Clear filters"
          icon="mdi-filter-remove-outline"
          title="Clear filters"
          variant="text"
          @click="clearFilters"
        />
      </div>

      <div v-if="employees.length === 0" class="directory-empty-state">
        <div class="empty-canvas-icon">
          <v-icon icon="mdi-account-multiple-outline" size="30" />
        </div>
        <h2>Your directory is taking shape</h2>
        <p>Add someone or load the fictional sample organization to get started.</p>
        <div class="empty-state-actions">
          <v-btn color="primary" @click="openEditor()">Add first person</v-btn>
          <v-btn variant="text" @click="loadSample">Load sample organization</v-btn>
        </div>
      </div>

      <v-data-table
        v-else
        class="people-table"
        :headers="headers"
        :items="rows"
        item-value="id"
        :items-per-page="10"
        :items-per-page-options="[10, 25, 50]"
        hover
        no-data-text="No people match these filters."
      >
        <template #[`item.name`]="{ item }">
          <button class="directory-person" type="button" @click="selectedId = item.id">
            <span class="mini-avatar">
              {{ item.employee.firstName[0] }}{{ item.employee.lastName[0] }}
            </span>
            <span class="directory-person-copy">
              <strong>{{ item.name }}</strong>
              <small>{{ item.email }}</small>
            </span>
          </button>
        </template>
        <template #[`item.managerName`]="{ item }">
          <button
            v-if="item.employee.managerId"
            class="manager-link"
            type="button"
            @click="selectedId = item.employee.managerId"
          >
            {{ item.managerName }}
          </button>
          <span v-else class="muted-note">Top level</span>
        </template>
        <template #[`item.status`]="{ item }">
          <v-chip
            size="small"
            :color="item.status === 'active' ? 'success' : 'secondary'"
            variant="tonal"
          >
            {{ item.status }}
          </v-chip>
        </template>
        <template #[`item.actions`]="{ item }">
          <div class="table-actions">
            <v-btn
              icon="mdi-pencil-outline"
              aria-label="Edit person"
              size="small"
              variant="text"
              @click="openEditor(item.employee)"
            />
            <v-btn
              icon="mdi-trash-can-outline"
              aria-label="Delete person"
              color="error"
              size="small"
              variant="text"
              @click="removePerson(item.employee)"
            />
          </div>
        </template>
      </v-data-table>
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
  </v-container>
</template>
