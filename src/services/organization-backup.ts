import { z } from 'zod'

import { employeeSchema, type Employee } from '@/domain/employee'
import { validateOrganization } from '@/domain/organization'

export const ORGANIZATION_BACKUP_VERSION = 1
export const ORGANIZATION_BACKUP_FORMAT = 'teammap-backup'

const organizationBackupSchema = z.strictObject({
  format: z.literal(ORGANIZATION_BACKUP_FORMAT),
  schemaVersion: z.literal(ORGANIZATION_BACKUP_VERSION),
  exportedAt: z.iso.datetime(),
  employees: employeeSchema.array(),
})

export type OrganizationBackup = z.infer<typeof organizationBackupSchema>

export type OrganizationBackupResult =
  | { success: true; backup: OrganizationBackup }
  | { success: false; message: string }

export type SerializedOrganizationBackupResult =
  | { success: true; backup: OrganizationBackup; json: string }
  | { success: false; message: string }

export function createOrganizationBackup(
  employees: Employee[],
  exportedAt = new Date().toISOString(),
): OrganizationBackupResult {
  const organization = validateOrganization(employees)

  if (!organization.success) {
    return {
      success: false,
      message:
        organization.issues[0]?.message ?? 'Organization data cannot be exported.',
    }
  }

  const result = organizationBackupSchema.safeParse({
    format: ORGANIZATION_BACKUP_FORMAT,
    schemaVersion: ORGANIZATION_BACKUP_VERSION,
    exportedAt,
    employees: organization.employees,
  })

  return result.success
    ? { success: true, backup: result.data }
    : {
        success: false,
        message: result.error.issues[0]?.message ?? 'Backup data could not be created.',
      }
}

export function parseOrganizationBackup(value: unknown): OrganizationBackupResult {
  const parsed = organizationBackupSchema.safeParse(value)

  if (!parsed.success) {
    const version =
      typeof value === 'object' && value !== null && 'schemaVersion' in value
        ? value.schemaVersion
        : undefined

    if (version !== undefined && version !== ORGANIZATION_BACKUP_VERSION) {
      return {
        success: false,
        message: `Backup version ${String(version)} is not supported.`,
      }
    }

    return {
      success: false,
      message: `This file is not a valid TeamMap backup: ${parsed.error.issues[0]?.message ?? 'Invalid data.'}`,
    }
  }

  const organization = validateOrganization(parsed.data.employees)

  if (!organization.success) {
    return {
      success: false,
      message:
        organization.issues[0]?.message ?? 'The backup contains invalid relationships.',
    }
  }

  return {
    success: true,
    backup: { ...parsed.data, employees: organization.employees },
  }
}

export function parseOrganizationBackupText(text: string): OrganizationBackupResult {
  let value: unknown

  try {
    value = JSON.parse(text)
  } catch {
    return {
      success: false,
      message: 'This file does not contain valid JSON.',
    }
  }

  return parseOrganizationBackup(value)
}

export function serializeOrganizationBackup(
  employees: Employee[],
): SerializedOrganizationBackupResult {
  const result = createOrganizationBackup(employees)

  return result.success
    ? {
        success: true,
        backup: result.backup,
        json: JSON.stringify(result.backup, null, 2),
      }
    : result
}
