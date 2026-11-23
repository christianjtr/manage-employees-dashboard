import { describe, expect, it } from 'vitest'

import { sampleOrganization } from '@/data/sample-organization'

import {
  createOrganizationBackup,
  parseOrganizationBackup,
  parseOrganizationBackupText,
  serializeOrganizationBackup,
} from './organization-backup'

describe('organization JSON backups', () => {
  it('serializes and parses a complete versioned organization', () => {
    const exportedAt = '2026-11-23T12:00:00.000Z'
    const created = createOrganizationBackup(sampleOrganization, exportedAt)

    expect(created.success).toBe(true)
    if (!created.success) return

    expect(created.backup.schemaVersion).toBe(1)
    expect(created.backup.format).toBe('teammap-backup')
    expect(created.backup.exportedAt).toBe(exportedAt)
    expect(created.backup.employees).toHaveLength(17)

    const serialized = serializeOrganizationBackup(sampleOrganization)
    expect(serialized.success).toBe(true)
    if (serialized.success && 'json' in serialized) {
      const parsed = parseOrganizationBackupText(serialized.json ?? '')
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.backup.employees).toEqual(sampleOrganization)
      }
    }
  })

  it('rejects unsupported backup versions', () => {
    const result = parseOrganizationBackup({
      format: 'teammap-backup',
      schemaVersion: 2,
      exportedAt: '2026-11-23T12:00:00.000Z',
      employees: [],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.message).toContain('version 2')
    }
  })

  it('rejects invalid JSON and invalid manager relationships', () => {
    expect(parseOrganizationBackupText('{invalid json')).toMatchObject({
      success: false,
      message: 'This file does not contain valid JSON.',
    })

    const invalidEmployees = sampleOrganization.map((employee) =>
      employee.id === 'person-dana-lee'
        ? { ...employee, managerId: 'unknown-manager' }
        : employee,
    )
    const invalidBackup = createOrganizationBackup(sampleOrganization)

    expect(invalidBackup.success).toBe(true)
    if (invalidBackup.success) {
      const result = parseOrganizationBackup({
        ...invalidBackup.backup,
        employees: invalidEmployees,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.message).toContain('manager does not exist')
      }
    }
  })
})
