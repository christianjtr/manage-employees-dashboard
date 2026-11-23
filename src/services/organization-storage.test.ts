import { beforeEach, describe, expect, it } from 'vitest'

import { sampleOrganization } from '@/data/sample-organization'

import {
  clearSavedOrganization,
  loadOrganization,
  organizationStorageKey,
  saveOrganization,
  type OrganizationStorage,
} from './organization-storage'

function createMemoryStorage(): OrganizationStorage {
  const records = new Map<string, string>()

  return {
    getItem: (key) => records.get(key) ?? null,
    setItem: (key, value) => records.set(key, value),
    removeItem: (key) => records.delete(key),
  }
}

describe('organization storage', () => {
  let storage: OrganizationStorage

  beforeEach(() => {
    storage = createMemoryStorage()
  })

  it('returns empty when no organization has been saved', () => {
    expect(loadOrganization(storage)).toEqual({ status: 'empty' })
  })

  it('round-trips a valid versioned organization', () => {
    const saveResult = saveOrganization(sampleOrganization, storage)

    expect(saveResult.success).toBe(true)
    expect(loadOrganization(storage)).toEqual({
      status: 'loaded',
      employees: sampleOrganization,
    })
  })

  it('does not overwrite valid saved data with an invalid hierarchy', () => {
    saveOrganization(sampleOrganization, storage)
    const invalidOrganization = sampleOrganization.map((employee) =>
      employee.id === 'person-dana-lee'
        ? { ...employee, managerId: 'missing-manager' }
        : employee,
    )

    const result = saveOrganization(invalidOrganization, storage)

    expect(result.success).toBe(false)
    expect(loadOrganization(storage)).toEqual({
      status: 'loaded',
      employees: sampleOrganization,
    })
  })

  it('preserves invalid saved data and reports it instead of overwriting it', () => {
    storage.setItem(organizationStorageKey, '{not json')

    expect(loadOrganization(storage)).toMatchObject({ status: 'invalid' })
    expect(storage.getItem(organizationStorageKey)).toBe('{not json')
  })

  it('allows an explicit valid restore to replace invalid saved data', () => {
    storage.setItem(organizationStorageKey, '{not json')

    const result = saveOrganization(sampleOrganization, storage)

    expect(result.success).toBe(true)
    expect(loadOrganization(storage)).toEqual({
      status: 'loaded',
      employees: sampleOrganization,
    })
  })

  it('rejects an unsupported stored schema version', () => {
    storage.setItem(
      organizationStorageKey,
      JSON.stringify({ schemaVersion: 99, employees: [] }),
    )

    expect(loadOrganization(storage)).toMatchObject({ status: 'invalid' })
  })

  it('clears saved data only when explicitly requested', () => {
    saveOrganization(sampleOrganization, storage)

    expect(clearSavedOrganization(storage)).toBe(true)
    expect(loadOrganization(storage)).toEqual({ status: 'empty' })
  })
})
