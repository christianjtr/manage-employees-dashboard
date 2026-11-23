import { employeeSchema, type Employee } from './employee'

export interface OrganizationNode {
  employee: Employee
  children: OrganizationNode[]
}

export interface OrganizationIssue {
  employeeId?: string
  field?: string
  message: string
}

export type OrganizationValidation =
  | { success: true; employees: Employee[] }
  | { success: false; issues: OrganizationIssue[] }

export function getFullName(employee: Pick<Employee, 'firstName' | 'lastName'>) {
  return `${employee.firstName} ${employee.lastName}`
}

export function validateOrganization(input: unknown): OrganizationValidation {
  const parsed = employeeSchema.array().safeParse(input)

  if (!parsed.success) {
    const records = Array.isArray(input) ? input : []
    const issues = parsed.error.issues.map((issue) => {
      const index = typeof issue.path[0] === 'number' ? issue.path[0] : -1
      const record = index >= 0 ? records[index] : undefined
      const employeeId =
        typeof record === 'object' && record !== null && 'id' in record
          ? String(record.id)
          : undefined

      return {
        employeeId,
        field: typeof issue.path[1] === 'string' ? issue.path[1] : undefined,
        message: issue.message,
      }
    })

    return { success: false, issues }
  }

  const employees = parsed.data
  const issues: OrganizationIssue[] = []
  const byId = new Map<string, Employee>()
  const idsByEmail = new Map<string, string[]>()

  for (const employee of employees) {
    if (byId.has(employee.id)) {
      issues.push({
        employeeId: employee.id,
        field: 'id',
        message: 'Employee IDs must be unique.',
      })
    } else {
      byId.set(employee.id, employee)
    }

    const emailIds = idsByEmail.get(employee.email) ?? []
    emailIds.push(employee.id)
    idsByEmail.set(employee.email, emailIds)
  }

  for (const [email, employeeIds] of idsByEmail) {
    if (employeeIds.length > 1) {
      for (const employeeId of employeeIds) {
        issues.push({
          employeeId,
          field: 'email',
          message: `The email ${email} is already used by another person.`,
        })
      }
    }
  }

  for (const employee of employees) {
    if (employee.managerId === employee.id) {
      issues.push({
        employeeId: employee.id,
        field: 'managerId',
        message: 'A person cannot be their own manager.',
      })
    } else if (employee.managerId && !byId.has(employee.managerId)) {
      issues.push({
        employeeId: employee.id,
        field: 'managerId',
        message: 'The selected manager does not exist in this organization.',
      })
    }
  }

  const reportedCycles = new Set<string>()

  for (const employee of employees) {
    const path: string[] = []
    const indexById = new Map<string, number>()
    let currentId: string | null = employee.id

    while (currentId && byId.has(currentId)) {
      const cycleStart = indexById.get(currentId)

      if (cycleStart !== undefined) {
        for (const cycleId of path.slice(cycleStart)) {
          if (!reportedCycles.has(cycleId)) {
            reportedCycles.add(cycleId)
            issues.push({
              employeeId: cycleId,
              field: 'managerId',
              message: 'Reporting relationships cannot contain a cycle.',
            })
          }
        }
        break
      }

      indexById.set(currentId, path.length)
      path.push(currentId)
      currentId = byId.get(currentId)?.managerId ?? null
    }
  }

  return issues.length > 0
    ? { success: false, issues }
    : { success: true, employees }
}

export function buildOrganizationTree(employees: Employee[]): OrganizationNode[] {
  const nodes = new Map<string, OrganizationNode>()

  for (const employee of employees) {
    nodes.set(employee.id, { employee, children: [] })
  }

  const roots: OrganizationNode[] = []

  for (const node of nodes.values()) {
    const manager = node.employee.managerId
      ? nodes.get(node.employee.managerId)
      : undefined

    if (manager) {
      manager.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortNodes = (items: OrganizationNode[]) => {
    items.sort((left, right) =>
      getFullName(left.employee).localeCompare(getFullName(right.employee)),
    )
    items.forEach((node) => sortNodes(node.children))
  }

  sortNodes(roots)
  return roots
}

export function getDescendantIds(
  employeeId: string,
  employees: Employee[],
): Set<string> {
  const descendants = new Set<string>()
  const queue = [employeeId]

  while (queue.length > 0) {
    const currentId = queue.shift()

    for (const employee of employees) {
      if (employee.managerId === currentId && !descendants.has(employee.id)) {
        descendants.add(employee.id)
        queue.push(employee.id)
      }
    }
  }

  return descendants
}

export function getAvailableManagers(
  employeeId: string | null,
  employees: Employee[],
): Employee[] {
  const excludedIds = employeeId
    ? getDescendantIds(employeeId, employees).add(employeeId)
    : new Set<string>()

  return employees.filter((employee) => !excludedIds.has(employee.id))
}

export function removeEmployeeAndPromoteReports(
  employeeId: string,
  employees: Employee[],
  updatedAt: string,
): Employee[] {
  const employee = employees.find((record) => record.id === employeeId)

  if (!employee) {
    return employees
  }

  return employees
    .filter((record) => record.id !== employeeId)
    .map((record) =>
      record.managerId === employeeId
        ? { ...record, managerId: employee.managerId, updatedAt }
        : record,
    )
}
