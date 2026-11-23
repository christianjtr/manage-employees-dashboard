import { z } from 'zod'

import { employeeSchema, type Employee } from '@/domain/employee'
import { validateOrganization } from '@/domain/organization'

const STORAGE_KEY = 'teammap.organization.v1'

const storedOrganizationSchema = z.strictObject({
  schemaVersion: z.literal(1),
  employees: employeeSchema.array(),
})

export type OrganizationLoadResult =
  | { status: 'empty' }
  | { status: 'loaded'; employees: Employee[] }
  | { status: 'invalid'; message: string }
  | { status: 'unavailable'; message: string }

export type OrganizationSaveResult =
  | { success: true; employees: Employee[] }
  | { success: false; message: string }

export interface OrganizationStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function getStorage(): OrganizationStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function loadOrganization(
  storageOverride?: OrganizationStorage,
): OrganizationLoadResult {
  const storage = storageOverride ?? getStorage()

  if (!storage) {
    return {
      status: 'unavailable',
      message: 'Browser storage is not available in this session.',
    }
  }

  let serialized: string | null

  try {
    serialized = storage.getItem(STORAGE_KEY)
  } catch {
    return {
      status: 'unavailable',
      message: 'Saved organization data could not be read from this browser.',
    }
  }

  if (serialized === null) {
    return { status: 'empty' }
  }

  let value: unknown

  try {
    value = JSON.parse(serialized)
  } catch {
    return {
      status: 'invalid',
      message: 'Saved organization data is not valid JSON.',
    }
  }

  const stored = storedOrganizationSchema.safeParse(value)

  if (!stored.success) {
    return {
      status: 'invalid',
      message:
        'Saved organization data is invalid or from an unsupported version.',
    }
  }

  const organization = validateOrganization(stored.data.employees)

  if (!organization.success) {
    return {
      status: 'invalid',
      message: organization.issues[0]?.message ?? 'Saved data is inconsistent.',
    }
  }

  return { status: 'loaded', employees: organization.employees }
}

export function saveOrganization(
  employees: Employee[],
  storageOverride?: OrganizationStorage,
): OrganizationSaveResult {
  const storage = storageOverride ?? getStorage()

  if (!storage) {
    return {
      success: false,
      message: 'Browser storage is not available; changes were not saved.',
    }
  }

  const organization = validateOrganization(employees)

  if (!organization.success) {
    return {
      success: false,
      message: organization.issues[0]?.message ?? 'Organization data is invalid.',
    }
  }

  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, employees: organization.employees }),
    )
  } catch {
    return {
      success: false,
      message: 'Browser storage could not save the organization; changes were not applied.',
    }
  }

  return { success: true, employees: organization.employees }
}

export function clearSavedOrganization(
  storageOverride?: OrganizationStorage,
): boolean {
  const storage = storageOverride ?? getStorage()

  if (!storage) {
    return false
  }

  try {
    storage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export const organizationStorageKey = STORAGE_KEY
