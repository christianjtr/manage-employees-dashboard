import { describe, expect, it } from 'vitest'

import { employeeSchema } from './employee'

const validEmployee = {
  id: 'employee-1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  position: 'Analyst',
  department: 'Research',
  managerId: null,
  status: 'active',
  joinedAt: '2025-01-10',
  createdAt: '2025-01-10T09:00:00.000Z',
  updatedAt: '2025-01-10T09:00:00.000Z',
}

describe('employeeSchema', () => {
  it('parses valid employee data and normalizes email', () => {
    const result = employeeSchema.safeParse({
      ...validEmployee,
      email: ' ADA@EXAMPLE.COM ',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('ada@example.com')
      expect(result.data.managerId).toBeNull()
    }
  })

  it('rejects an invalid status', () => {
    const result = employeeSchema.safeParse({
      ...validEmployee,
      status: 'on-leave',
    })

    expect(result.success).toBe(false)
  })

  it('rejects a malformed joining date', () => {
    const result = employeeSchema.safeParse({
      ...validEmployee,
      joinedAt: 'January 10, 2025',
    })

    expect(result.success).toBe(false)
  })
})
