<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'

import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import EmployeeDetailsPanel from '@/components/people/EmployeeDetailsPanel.vue'
import EmployeeEditorPanel from '@/components/people/EmployeeEditorPanel.vue'
import { useConfirmation } from '@/composables/useConfirmation'
import type { Employee, EmployeeInput } from '@/domain/employee'
import { getFullName } from '@/domain/organization'
import { useEmployees } from '@/composables/useEmployees'
import {
  parseOrganizationBackupText,
  serializeOrganizationBackup,
} from '@/services/organization-backup'
import {
  parseOrganizationCsvText,
  serializeOrganizationCsvTemplate,
} from '@/services/organization-csv'

const {
  employees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  loadSampleOrganization,
  replaceOrganization,
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
const importDialogOpen = ref(false)
const importFormat = ref<'json' | 'csv'>('json')
const importInput = ref<HTMLInputElement | null>(null)
const importFilename = ref('')
const importExportedAt = ref<string | null>(null)
const importError = ref('')
const importBusy = ref(false)
const importPreview = ref<Employee[] | null>(null)
const {
  confirmation,
  requestConfirmation,
  resolveConfirmation,
  updateConfirmationOpen,
} = useConfirmation()

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
const importActiveCount = computed(
  () =>
    importPreview.value?.filter((employee) => employee.status === 'active').length ?? 0,
)
const importDepartmentCount = computed(
  () =>
    new Set(importPreview.value?.map((employee) => employee.department) ?? []).size,
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
  notify(result.success ? 'Sample organization loaded.' : result.message)
}

function openImportDialog(format: 'json' | 'csv') {
  importFormat.value = format
  importFilename.value = ''
  importExportedAt.value = null
  importError.value = ''
  importPreview.value = null
  importDialogOpen.value = true
}

function chooseImportFile() {
  importInput.value?.click()
}

async function readImportFile(event: Event) {
  const input = event.currentTarget as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  importFilename.value = file.name
  importExportedAt.value = null
  importError.value = ''
  importPreview.value = null
  importBusy.value = true

  try {
    const text = await file.text()

    if (importFormat.value === 'csv') {
      const result = parseOrganizationCsvText(text)

      if (result.success) {
        importPreview.value = result.employees
      } else {
        importError.value = result.message
      }
    } else {
      const result = parseOrganizationBackupText(text)

      if (result.success) {
        importPreview.value = result.backup.employees
        importExportedAt.value = result.backup.exportedAt
      } else {
        importError.value = result.message
      }
    }
  } catch {
    importError.value = 'The selected file could not be read.'
  } finally {
    importBusy.value = false
    input.value = ''
  }
}

function exportBackup() {
  const result = serializeOrganizationBackup(employees.value)

  if (!result.success) {
    notify(result.message)
    return
  }

  const blob = new Blob([result.json], { type: 'application/json' })
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = `teammap-backup-${result.backup.exportedAt.slice(0, 10)}.json`
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
  notify(`Exported ${employees.value.length} people to a JSON backup.`)
}

function downloadCsvTemplate() {
  const blob = new Blob([serializeOrganizationCsvTemplate()], {
    type: 'text/csv;charset=utf-8',
  })
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = 'teammap-people-template.csv'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
  notify('Downloaded the CSV import template.')
}

async function confirmImport() {
  const importedEmployees = importPreview.value

  if (!importedEmployees) {
    return
  }

  if (
    employees.value.length > 0 &&
    !(await requestConfirmation({
      title: 'Replace the current organization?',
      message: `All people currently saved in this browser will be replaced with this ${importFormat.value === 'csv' ? 'CSV file' : 'backup'}.`,
      confirmLabel: importFormat.value === 'csv' ? 'Import people' : 'Replace organization',
      confirmColor: 'error',
    }))
  ) {
    return
  }

  const result = replaceOrganization(importedEmployees)

  if (!result.success) {
    importError.value = result.message
    return
  }

  importDialogOpen.value = false
  selectedId.value = null
  notify(
    `${importFormat.value === 'csv' ? 'Imported' : 'Restored'} ${importedEmployees.length} people from ${importFilename.value}.`,
  )
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
        <h1>People</h1>
        <div class="page-title-meta">
          <span>{{ employees.length }} {{ employees.length === 1 ? 'person' : 'people' }}</span>
          <template v-if="filteredEmployees.length !== employees.length">
            <span class="page-title-separator" aria-hidden="true">·</span>
            <span>{{ filteredEmployees.length }} shown</span>
          </template>
        </div>
      </div>
      <div class="organization-actions">
        <v-btn
          class="sample-action"
          variant="outlined"
          prepend-icon="mdi-database-import-outline"
          @click="loadSample"
        >
          Load sample
        </v-btn>
        <v-menu>
          <template #activator="{ props }">
            <v-btn
              class="data-actions-button"
              v-bind="props"
              :icon="mobile"
              :aria-label="mobile ? 'Data actions' : undefined"
              variant="outlined"
            >
              <v-icon icon="mdi-database-import-outline" />
              <span v-if="!mobile">Data</span>
            </v-btn>
          </template>
          <v-list>
            <v-list-item
              v-if="mobile"
              prepend-icon="mdi-database-import-outline"
              title="Load sample organization"
              @click="loadSample"
            />
            <v-divider v-if="mobile" />
            <v-list-item
              aria-label="Import CSV file"
              prepend-icon="mdi-file-delimited-outline"
              title="Import CSV"
              @click="openImportDialog('csv')"
            />
            <v-list-item
              aria-label="Download CSV template"
              prepend-icon="mdi-file-download-outline"
              title="Download CSV template"
              @click="downloadCsvTemplate"
            />
            <v-divider />
            <v-list-item
              aria-label="Import JSON backup"
              prepend-icon="mdi-import"
              title="Import JSON backup"
              @click="openImportDialog('json')"
            />
            <v-list-item
              aria-label="Export JSON backup"
              prepend-icon="mdi-export"
              title="Export JSON backup"
              :disabled="employees.length === 0"
              @click="exportBackup"
            />
          </v-list>
        </v-menu>
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
    <input
      ref="importInput"
      class="file-input-hidden"
      type="file"
      :accept="importFormat === 'csv' ? 'text/csv,.csv' : 'application/json,.json'"
      :aria-label="importFormat === 'csv' ? 'Choose a CSV file' : 'Choose a TeamMap JSON backup'"
      @change="readImportFile"
    />
    <v-dialog v-model="importDialogOpen" max-width="600">
      <v-card class="backup-dialog" rounded="lg">
        <div class="drawer-heading">
          <div>
            <p class="eyebrow">DATA</p>
            <h2>{{ importFormat === 'csv' ? 'Import people from CSV' : 'Restore from JSON backup' }}</h2>
          </div>
          <v-btn
            icon="mdi-close"
            aria-label="Close import dialog"
            variant="text"
            @click="importDialogOpen = false"
          />
        </div>
        <v-divider />
        <v-card-text class="backup-dialog-content">
          <p>
            <template v-if="importFormat === 'csv'">
              Select a CSV file with firstName, lastName, email, position and
              department columns. managerEmail, status, joinedAt and avatar are
              optional; manager emails must match people in the same file, status
              defaults to active, and joinedAt uses YYYY-MM-DD.
            </template>
            <template v-else>
              Select a TeamMap backup. The complete file is validated before it can
              replace the people currently stored in this browser.
            </template>
          </p>
          <div class="backup-file-picker">
            <v-btn
              prepend-icon="mdi-file-upload-outline"
              variant="outlined"
              :loading="importBusy"
              @click="chooseImportFile"
            >
              {{ importFormat === 'csv' ? 'Choose CSV file' : 'Choose JSON file' }}
            </v-btn>
            <span v-if="importFilename" class="backup-filename">
              {{ importFilename }}
            </span>
          </div>

          <v-alert v-if="importError" type="error" variant="tonal">
            {{ importError }}
          </v-alert>

          <v-card v-if="importPreview" class="backup-preview" variant="outlined">
            <v-card-title>Import preview</v-card-title>
            <v-card-text>
              <div class="backup-stat-grid">
                <div>
                  <strong>{{ importPreview.length }}</strong>
                  <span>people</span>
                </div>
                <div>
                  <strong>{{ importActiveCount }}</strong>
                  <span>active</span>
                </div>
                <div>
                  <strong>{{ importDepartmentCount }}</strong>
                  <span>departments</span>
                </div>
              </div>
              <p v-if="importExportedAt">
                Exported {{ new Date(importExportedAt).toLocaleString() }}
              </p>
            </v-card-text>
          </v-card>

          <v-alert v-if="importPreview" type="warning" variant="tonal">
            Import replaces the current organization in this browser. No records
            are changed unless the complete {{ importFormat === 'csv' ? 'CSV file' : 'backup' }}
            is valid and you confirm.
          </v-alert>
        </v-card-text>
        <v-card-actions class="backup-dialog-actions">
          <v-spacer />
          <v-btn variant="text" @click="importDialogOpen = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :disabled="!importPreview || importBusy"
            @click="confirmImport"
          >
            {{ importFormat === 'csv' ? 'Import people' : 'Replace organization' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
