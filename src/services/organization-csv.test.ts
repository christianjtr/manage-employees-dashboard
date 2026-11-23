import { describe, expect, it } from 'vitest'

import {
  ORGANIZATION_CSV_HEADERS,
  parseOrganizationCsvText,
  serializeOrganizationCsvTemplate,
  type OrganizationCsvImportResult,
} from './organization-csv'

function deterministicOptions() {
  let id = 0

  return {
    createId: () => `person-${++id}`,
    now: () => '2026-11-23T12:00:00.000Z',
  }
}

const headers = 'firstName,lastName,email,position,department,managerEmail,status,joinedAt,avatar'

function failureMessage(result: OrganizationCsvImportResult) {
  if (result.success) {
    throw new Error('Expected the CSV import to fail.')
  }

  return result.message
}

describe('organization CSV import', () => {
  it('parses quoted fields, normalizes email and defaults blank status to active', () => {
    const csv = [
      `\uFEFF${headers}`,
      '"Sam, ""Ace""",Rivera,SAM@example.com,Designer,Product,,,,',
    ].join('\r\n')

    const result = parseOrganizationCsvText(csv, deterministicOptions())

    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.employees).toHaveLength(1)
    expect(result.employees[0]).toMatchObject({
      id: 'person-1',
      firstName: 'Sam, "Ace"',
      email: 'sam@example.com',
      managerId: null,
      status: 'active',
      createdAt: '2026-11-23T12:00:00.000Z',
    })
    expect(result.employees[0]?.joinedAt).toBeUndefined()
    expect(result.employees[0]?.avatar).toBeUndefined()
  })

  it('resolves manager email references regardless of row order', () => {
    const csv = [
      headers,
      'Riley,James,riley@example.com,Engineer,Engineering,lead@example.com,active,,',
      'Dana,Lee,lead@example.com,Engineering Manager,Engineering,,active,,',
    ].join('\n')

    const result = parseOrganizationCsvText(csv, deterministicOptions())

    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.employees[0]?.managerId).toBe('person-2')
    expect(result.employees[1]?.managerId).toBeNull()
  })

  it('preserves newlines embedded inside quoted fields', () => {
    const csv = [
      headers,
      '"Taylor\r\nLee",Stone,taylor@example.com,Engineer,Engineering,,active,,',
    ].join('\r\n')

    const result = parseOrganizationCsvText(csv, deterministicOptions())

    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.employees[0]?.firstName).toBe('Taylor\nLee')
  })

  it('rejects rows with invalid fields and reports the CSV row number', () => {
    const csv = [
      headers,
      'Taylor,Stone,not-an-email,Engineer,Engineering,,active,,',
    ].join('\n')

    const result = parseOrganizationCsvText(csv, deterministicOptions())

    expect(result.success).toBe(false)
    expect(failureMessage(result)).toContain('CSV row 2 (email)')
    expect(result).not.toHaveProperty('employees')
  })

  it('rejects manager emails that are not present in the imported file', () => {
    const csv = [
      headers,
      'Taylor,Stone,taylor@example.com,Engineer,Engineering,missing@example.com,active,,',
    ].join('\n')

    const result = parseOrganizationCsvText(csv, deterministicOptions())

    expect(result.success).toBe(false)
    expect(failureMessage(result)).toContain('CSV row 2 (managerEmail)')
    expect(failureMessage(result)).toContain('does not match a person in this CSV file')
  })

  it('rejects duplicate emails and reporting cycles as whole-file errors', () => {
    const duplicateCsv = [
      headers,
      'Taylor,Stone,taylor@example.com,Engineer,Engineering,,active,,',
      'Riley,James,TAYLOR@example.com,Designer,Product,,active,,',
    ].join('\n')
    const cycleCsv = [
      headers,
      'Taylor,Stone,taylor@example.com,Engineer,Engineering,riley@example.com,active,,',
      'Riley,James,riley@example.com,Designer,Product,taylor@example.com,active,,',
    ].join('\n')

    const duplicateResult = parseOrganizationCsvText(duplicateCsv, deterministicOptions())
    const cycleResult = parseOrganizationCsvText(cycleCsv, deterministicOptions())

    expect(duplicateResult.success).toBe(false)
    expect(failureMessage(duplicateResult)).toContain('email')
    expect(cycleResult.success).toBe(false)
    expect(failureMessage(cycleResult)).toContain('cannot contain a cycle')
  })

  it('rejects missing or unsupported columns and malformed quoted fields', () => {
    const missingHeaderResult = parseOrganizationCsvText(
      'firstName,lastName,email\nSam,Rivera,sam@example.com',
    )
    const unsupportedHeaderResult = parseOrganizationCsvText(
      `${headers},unknownColumn\nSam,Rivera,sam@example.com,Designer,Product,,active,,,value`,
    )
    const incorrectColumnCountResult = parseOrganizationCsvText(
      `${headers}\nSam,Rivera,sam@example.com,Designer,Product,,active,`,
    )
    const malformedResult = parseOrganizationCsvText(
      `${headers}\n"Sam,Rivera,sam@example.com,Designer,Product,,active,,`,
    )

    expect(missingHeaderResult.success).toBe(false)
    expect(failureMessage(missingHeaderResult)).toContain(
      'Required CSV column "position" is missing',
    )
    expect(unsupportedHeaderResult.success).toBe(false)
    expect(failureMessage(unsupportedHeaderResult)).toContain('unknowncolumn')
    expect(incorrectColumnCountResult.success).toBe(false)
    expect(failureMessage(incorrectColumnCountResult)).toContain('expected 9 columns')
    expect(malformedResult.success).toBe(false)
    expect(failureMessage(malformedResult)).toContain('unterminated quoted field')
  })

  it('provides a UTF-8 template with the supported headers', () => {
    expect(serializeOrganizationCsvTemplate()).toBe(
      `\uFEFF${ORGANIZATION_CSV_HEADERS.join(',')}\r\n`,
    )
  })
})
