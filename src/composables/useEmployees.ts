import { computed, ref } from 'vue'

import {
  employeeInputSchema,
  employeeSchema,
  type Employee,
  type EmployeeInput,
} from '@/domain/employee'
import { removeEmployeeAndPromoteReports } from '@/domain/organization'
import { sampleOrganization } from '@/data/sample-organization'
import {
  clearSavedOrganization,
  loadOrganization,
  saveOrganization,
} from '@/services/organization-storage'

type MutationResult =
  | { success: true; employee?: Employee }
  | { success: false; message: string }

const initialLoad = loadOrganization()
const employeeRecords = ref<Employee[]>(
  initialLoad.status === 'loaded' ? initialLoad.employees : [],
)
const storageIssue = ref(
  initialLoad.status === 'invalid' || initialLoad.status === 'unavailable'
    ? initialLoad.message
    : null,
)
const requiresRecovery = ref(initialLoad.status === 'invalid')

function saveNext(records: Employee[]): MutationResult {
  if (requiresRecovery.value) {
    return {
      success: false,
      message: 'Clear or restore the invalid saved data before making changes.',
    }
  }

  const result = saveOrganization(records)

  if (!result.success) {
    storageIssue.value = result.message
    return result
  }

  employeeRecords.value = result.employees
  storageIssue.value = null
  return { success: true }
}

function createEmployee(input: EmployeeInput): MutationResult {
  const parsedInput = employeeInputSchema.safeParse(input)

  if (!parsedInput.success) {
    return {
      success: false,
      message: parsedInput.error.issues[0]?.message ?? 'Check the person details.',
    }
  }

  const timestamp = new Date().toISOString()
  const employee = employeeSchema.parse({
    ...parsedInput.data,
    id: crypto.randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  const result = saveNext([...employeeRecords.value, employee])

  return result.success ? { success: true, employee } : result
}

function updateEmployee(id: string, input: EmployeeInput): MutationResult {
  const existingEmployee = employeeRecords.value.find(
    (employee) => employee.id === id,
  )

  if (!existingEmployee) {
    return { success: false, message: 'This person no longer exists.' }
  }

  const parsedInput = employeeInputSchema.safeParse(input)

  if (!parsedInput.success) {
    return {
      success: false,
      message: parsedInput.error.issues[0]?.message ?? 'Check the person details.',
    }
  }

  const employee = employeeSchema.parse({
    ...existingEmployee,
    ...parsedInput.data,
    updatedAt: new Date().toISOString(),
  })
  const nextRecords = employeeRecords.value.map((record) =>
    record.id === id ? employee : record,
  )
  const result = saveNext(nextRecords)

  return result.success ? { success: true, employee } : result
}

function deleteEmployee(id: string): MutationResult {
  const employee = employeeRecords.value.find((record) => record.id === id)

  if (!employee) {
    return { success: false, message: 'This person no longer exists.' }
  }

  const nextRecords = removeEmployeeAndPromoteReports(
    id,
    employeeRecords.value,
    new Date().toISOString(),
  )

  return saveNext(nextRecords)
}

function loadSampleOrganization(): MutationResult {
  const result = saveNext(sampleOrganization)
  return result.success ? { success: true } : result
}

function recoverSavedData(): MutationResult {
  if (!clearSavedOrganization()) {
    return {
      success: false,
      message: 'Invalid saved data could not be cleared from this browser.',
    }
  }

  employeeRecords.value = []
  requiresRecovery.value = false
  storageIssue.value = null
  return { success: true }
}

export function useEmployees() {
  const employees = computed(() => employeeRecords.value)
  const activeCount = computed(
    () => employeeRecords.value.filter((employee) => employee.status === 'active').length,
  )

  return {
    employees,
    activeCount,
    storageIssue,
    requiresRecovery,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    loadSampleOrganization,
    recoverSavedData,
  }
}
