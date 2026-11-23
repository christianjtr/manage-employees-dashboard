import type { Employee } from './employee'
import { getFullName } from './organization'

export interface DepartmentInsight {
  department: string
  count: number
}

export interface ManagerInsight {
  employeeId: string
  name: string
  position: string
  department: string
  directReports: number
}

export interface OrganizationInsights {
  totalPeople: number
  activeCount: number
  inactiveCount: number
  departmentCount: number
  topLevelCount: number
  hierarchyDepth: number
  departments: DepartmentInsight[]
  managers: ManagerInsight[]
}

export function getOrganizationInsights(employees: Employee[]): OrganizationInsights {
  const byId = new Map(employees.map((employee) => [employee.id, employee]))
  const departmentCounts = new Map<string, number>()
  const directReportCounts = new Map<string, number>()
  let topLevelCount = 0
  let activeCount = 0
  let inactiveCount = 0

  for (const employee of employees) {
    departmentCounts.set(
      employee.department,
      (departmentCounts.get(employee.department) ?? 0) + 1,
    )

    if (employee.status === 'active') {
      activeCount += 1
    } else {
      inactiveCount += 1
    }

    if (employee.managerId) {
      if (byId.has(employee.managerId)) {
        directReportCounts.set(
          employee.managerId,
          (directReportCounts.get(employee.managerId) ?? 0) + 1,
        )
      }
    } else {
      topLevelCount += 1
    }
  }

  const hierarchyDepth = employees.reduce((deepest, employee) => {
    const visited = new Set<string>()
    let current: Employee | undefined = employee
    let depth = 0

    while (current && byId.has(current.id) && !visited.has(current.id)) {
      visited.add(current.id)
      depth += 1
      current = current.managerId ? byId.get(current.managerId) : undefined
    }

    return Math.max(deepest, depth)
  }, 0)

  const departments = [...departmentCounts]
    .map(([department, count]) => ({ department, count }))
    .sort(
      (left, right) =>
        right.count - left.count ||
        left.department.localeCompare(right.department),
    )

  const managers = [...directReportCounts]
    .map(([employeeId, directReports]) => {
      const employee = byId.get(employeeId)!

      return {
        employeeId,
        name: getFullName(employee),
        position: employee.position,
        department: employee.department,
        directReports,
      }
    })
    .sort(
      (left, right) =>
        right.directReports - left.directReports ||
        left.name.localeCompare(right.name),
    )

  return {
    totalPeople: employees.length,
    activeCount,
    inactiveCount,
    departmentCount: departments.length,
    topLevelCount,
    hierarchyDepth,
    departments,
    managers,
  }
}
