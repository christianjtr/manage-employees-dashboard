import { describe, expect, it } from 'vitest'

import { employeeSchema, type Employee } from './employee'
import {
  buildOrganizationTree,
  getAvailableManagers,
  removeEmployeeAndPromoteReports,
  validateOrganization,
} from './organization'

function person(id: string, managerId: string | null, email = `${id}@example.com`) {
  return employeeSchema.parse({
    id,
    firstName: id,
    lastName: 'Person',
    email,
    position: 'Team member',
    department: 'Product',
    managerId,
    status: 'active',
    createdAt: '2025-01-10T09:00:00.000Z',
    updatedAt: '2025-01-10T09:00:00.000Z',
  })
}

describe('organization domain', () => {
  it('builds a sorted forest with multiple top-level people', () => {
    const employees = [
      person('zara', null),
      person('milo', 'zara'),
      person('alex', null),
    ]

    const roots = buildOrganizationTree(employees)

    expect(roots.map((root) => root.employee.id)).toEqual(['alex', 'zara'])
    expect(roots[1]?.children.map((node) => node.employee.id)).toEqual(['milo'])
  })

  it('rejects a manager reference that is not in the organization', () => {
    const validation = validateOrganization([person('employee', 'missing')])

    expect(validation.success).toBe(false)
    if (!validation.success) {
      expect(validation.issues[0]?.field).toBe('managerId')
    }
  })

  it('rejects self-reporting relationships', () => {
    const validation = validateOrganization([person('employee', 'employee')])

    expect(validation.success).toBe(false)
    if (!validation.success) {
      expect(validation.issues.some((issue) => issue.message.includes('own manager'))).toBe(true)
    }
  })

  it('rejects circular reporting relationships', () => {
    const validation = validateOrganization([
      person('one', 'two'),
      person('two', 'one'),
    ])

    expect(validation.success).toBe(false)
    if (!validation.success) {
      expect(validation.issues.every((issue) => issue.message.includes('cycle'))).toBe(true)
    }
  })

  it('rejects duplicate normalized email addresses', () => {
    const validation = validateOrganization([
      person('one', null, 'TEAM@example.com'),
      person('two', null, 'team@example.com'),
    ])

    expect(validation.success).toBe(false)
    if (!validation.success) {
      expect(validation.issues.some((issue) => issue.field === 'email')).toBe(true)
    }
  })

  it('does not offer a person or their descendants as a manager', () => {
    const employees: Employee[] = [
      person('ceo', null),
      person('manager', 'ceo'),
      person('report', 'manager'),
      person('peer', 'ceo'),
    ]

    expect(
      getAvailableManagers('manager', employees).map((employee) => employee.id),
    ).toEqual(['ceo', 'peer'])
  })

  it('promotes direct reports one level when deleting their manager', () => {
    const employees = [
      person('ceo', null),
      person('manager', 'ceo'),
      person('report', 'manager'),
      person('grandchild', 'report'),
    ]

    const remaining = removeEmployeeAndPromoteReports(
      'manager',
      employees,
      '2026-01-01T00:00:00.000Z',
    )
    const report = remaining.find((employee) => employee.id === 'report')
    const grandchild = remaining.find((employee) => employee.id === 'grandchild')

    expect(remaining.map((employee) => employee.id)).toEqual([
      'ceo',
      'report',
      'grandchild',
    ])
    expect(report?.managerId).toBe('ceo')
    expect(report?.updatedAt).toBe('2026-01-01T00:00:00.000Z')
    expect(grandchild?.managerId).toBe('report')
  })
})
