import { describe, expect, it } from 'vitest'

import { sampleOrganization } from '@/data/sample-organization'

import { employeeSchema, type Employee } from './employee'
import { getOrganizationInsights } from './organization-insights'

function person(
  id: string,
  managerId: string | null,
  overrides: Partial<Employee> = {},
): Employee {
  return employeeSchema.parse({
    id,
    firstName: id,
    lastName: 'Person',
    email: `${id}@example.com`,
    position: 'Team member',
    department: 'Product',
    managerId,
    status: 'active',
    createdAt: '2025-01-10T09:00:00.000Z',
    updatedAt: '2025-01-10T09:00:00.000Z',
    ...overrides,
  })
}

describe('getOrganizationInsights', () => {
  it('returns empty metrics for an empty organization', () => {
    const insights = getOrganizationInsights([])

    expect(insights).toEqual({
      totalPeople: 0,
      activeCount: 0,
      inactiveCount: 0,
      departmentCount: 0,
      topLevelCount: 0,
      hierarchyDepth: 0,
      departments: [],
      managers: [],
    })
  })

  it('summarizes the sample organization', () => {
    const insights = getOrganizationInsights(sampleOrganization)

    expect(insights.totalPeople).toBe(17)
    expect(insights.activeCount).toBe(16)
    expect(insights.inactiveCount).toBe(1)
    expect(insights.departmentCount).toBe(6)
    expect(insights.topLevelCount).toBe(1)
    expect(insights.hierarchyDepth).toBe(6)
    expect(insights.departments).toEqual([
      { department: 'Customer Experience', count: 4 },
      { department: 'Engineering', count: 4 },
      { department: 'Finance', count: 3 },
      { department: 'Operations', count: 3 },
      { department: 'Leadership', count: 2 },
      { department: 'Product', count: 1 },
    ])
    expect(insights.managers[0]).toMatchObject({
      employeeId: 'person-alex-morgan',
      name: 'Alex Morgan',
      directReports: 3,
    })
    expect(insights.managers.map((manager) => manager.directReports)).toEqual([
      3, 2, 2, 2, 2, 1, 1, 1, 1, 1,
    ])
  })

  it('counts multiple roots, inactive people and direct reports only', () => {
    const insights = getOrganizationInsights([
      person('root-one', null, { department: 'Operations' }),
      person('root-two', null, {
        firstName: 'Bea',
        department: 'Finance',
        status: 'inactive',
      }),
      person('report-one', 'root-one', { department: 'Operations' }),
      person('report-two', 'root-two', { department: 'Finance' }),
      person('report-three', 'root-one', { department: 'Operations' }),
    ])

    expect(insights.totalPeople).toBe(5)
    expect(insights.activeCount).toBe(4)
    expect(insights.inactiveCount).toBe(1)
    expect(insights.topLevelCount).toBe(2)
    expect(insights.hierarchyDepth).toBe(2)
    expect(insights.departments).toEqual([
      { department: 'Operations', count: 3 },
      { department: 'Finance', count: 2 },
    ])
    expect(insights.managers).toEqual([
      {
        employeeId: 'root-one',
        name: 'root-one Person',
        position: 'Team member',
        department: 'Operations',
        directReports: 2,
      },
      {
        employeeId: 'root-two',
        name: 'Bea Person',
        position: 'Team member',
        department: 'Finance',
        directReports: 1,
      },
    ])
  })

  it('counts the deepest reporting chain', () => {
    const insights = getOrganizationInsights([
      person('root', null),
      person('manager', 'root'),
      person('lead', 'manager'),
      person('member', 'lead'),
      person('unrelated', null),
    ])

    expect(insights.hierarchyDepth).toBe(4)
    expect(insights.topLevelCount).toBe(2)
  })
})
