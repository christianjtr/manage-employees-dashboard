import { employeeInputSchema, employeeSchema, type Employee } from '@/domain/employee'
import { validateOrganization } from '@/domain/organization'

export const ORGANIZATION_CSV_HEADERS = [
  'firstName',
  'lastName',
  'email',
  'position',
  'department',
  'managerEmail',
  'status',
  'joinedAt',
  'avatar',
] as const

const requiredHeaders = ['firstName', 'lastName', 'email', 'position', 'department']
const supportedHeaders = new Set<string>(ORGANIZATION_CSV_HEADERS.map((header) => header.toLowerCase()))

export type OrganizationCsvImportResult =
  | { success: true; employees: Employee[] }
  | { success: false; message: string }

export interface ParseOrganizationCsvOptions {
  createId?: () => string
  now?: () => string
}

interface CsvRecord {
  row: number
  values: string[]
}

type CsvRecordsResult =
  | { success: true; records: CsvRecord[] }
  | { success: false; message: string }

interface ParsedCsvEmployee {
  row: number
  input: ReturnType<typeof employeeInputSchema.parse>
  managerEmail: string
}

function parseCsvRecords(text: string): CsvRecordsResult {
  const records: CsvRecord[] = []
  const values: string[] = []
  let field = ''
  let row = 1
  let inQuotes = false
  let quoteClosed = false

  function finishRecord() {
    const recordValues = [...values, field]

    if (recordValues.some((value) => value.trim() !== '')) {
      records.push({ row, values: recordValues })
    }

    values.length = 0
    field = ''
    quoteClosed = false
    row += 1
  }

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    const nextCharacter = text[index + 1]

    if (inQuotes) {
      if (character === '"' && nextCharacter === '"') {
        field += '"'
        index += 1
      } else if (character === '"') {
        inQuotes = false
        quoteClosed = true
      } else if (character === '\r' || character === '\n') {
        field += '\n'
        if (character === '\r' && nextCharacter === '\n') {
          index += 1
        }
      } else {
        field += character
      }

      continue
    }

    if (quoteClosed) {
      if (character === ' ' || character === '\t') {
        continue
      }

      if (character !== ',' && character !== '\r' && character !== '\n') {
        return {
          success: false,
          message: `CSV row ${row}: unexpected character after a quoted field.`,
        }
      }
    }

    if (character === '"') {
      if (field.trim() !== '') {
        return {
          success: false,
          message: `CSV row ${row}: quotes must wrap the complete field.`,
        }
      }

      field = ''
      inQuotes = true
      continue
    }

    if (character === ',') {
      values.push(field)
      field = ''
      quoteClosed = false
      continue
    }

    if (character === '\r' || character === '\n') {
      finishRecord()
      if (character === '\r' && nextCharacter === '\n') {
        index += 1
      }
      continue
    }

    field += character
  }

  if (inQuotes) {
    return { success: false, message: 'The CSV file contains an unterminated quoted field.' }
  }

  if (field !== '' || values.length > 0 || quoteClosed) {
    finishRecord()
  }

  return records.length > 0
    ? { success: true, records }
    : { success: false, message: 'The CSV file is empty.' }
}

function formatIssues(issues: string[]) {
  const visibleIssues = issues.slice(0, 8)
  const remainingCount = issues.length - visibleIssues.length

  return remainingCount > 0
    ? `${visibleIssues.join('\n')}\nAnd ${remainingCount} more issue${remainingCount === 1 ? '' : 's'}.`
    : visibleIssues.join('\n')
}

export function parseOrganizationCsvText(
  text: string,
  options: ParseOrganizationCsvOptions = {},
): OrganizationCsvImportResult {
  const parsedRecords = parseCsvRecords(text.replace(/^\uFEFF/, ''))

  if (!parsedRecords.success) {
    return { success: false, message: parsedRecords.message }
  }

  const [headerRecord, ...dataRecords] = parsedRecords.records
  const headers = headerRecord.values.map((header) => header.trim().toLowerCase())
  const headerIndexes = new Map<string, number>()
  const headerIssues: string[] = []

  headers.forEach((header, index) => {
    if (!header) {
      headerIssues.push('CSV headers cannot be empty.')
    } else if (headerIndexes.has(header)) {
      headerIssues.push(`CSV column "${header}" appears more than once.`)
    } else if (!supportedHeaders.has(header)) {
      headerIssues.push(`CSV column "${header}" is not supported.`)
    } else {
      headerIndexes.set(header, index)
    }
  })

  for (const requiredHeader of requiredHeaders) {
    if (!headerIndexes.has(requiredHeader.toLowerCase())) {
      headerIssues.push(`Required CSV column "${requiredHeader}" is missing.`)
    }
  }

  if (headerIssues.length > 0) {
    return { success: false, message: formatIssues(headerIssues) }
  }

  const fieldValue = (record: CsvRecord, name: string) => {
    const column = headerIndexes.get(name.toLowerCase())
    return column === undefined ? '' : record.values[column] ?? ''
  }

  const parsedEmployees: ParsedCsvEmployee[] = []
  const rowIssues: string[] = []

  for (const record of dataRecords) {
    if (record.values.length !== headers.length) {
      rowIssues.push(
        `CSV row ${record.row}: expected ${headers.length} columns but found ${record.values.length}.`,
      )
      continue
    }

    const status = fieldValue(record, 'status').trim().toLowerCase() || 'active'
    const joinedAt = fieldValue(record, 'joinedAt').trim()
    const avatar = fieldValue(record, 'avatar').trim()
    const input = employeeInputSchema.safeParse({
      firstName: fieldValue(record, 'firstName'),
      lastName: fieldValue(record, 'lastName'),
      email: fieldValue(record, 'email'),
      position: fieldValue(record, 'position'),
      department: fieldValue(record, 'department'),
      managerId: null,
      status,
      ...(joinedAt ? { joinedAt } : {}),
      ...(avatar ? { avatar } : {}),
    })

    if (!input.success) {
      for (const issue of input.error.issues) {
        const field = issue.path[0]
        rowIssues.push(
          `CSV row ${record.row}${typeof field === 'string' ? ` (${field})` : ''}: ${issue.message}`,
        )
      }
      continue
    }

    parsedEmployees.push({
      row: record.row,
      input: input.data,
      managerEmail: fieldValue(record, 'managerEmail').trim().toLowerCase(),
    })
  }

  if (rowIssues.length > 0) {
    return { success: false, message: formatIssues(rowIssues) }
  }

  if (parsedEmployees.length === 0) {
    return { success: false, message: 'The CSV file does not contain any people.' }
  }

  const rowsByEmail = new Map<string, number[]>()
  for (const employee of parsedEmployees) {
    const emailRows = rowsByEmail.get(employee.input.email) ?? []
    emailRows.push(employee.row)
    rowsByEmail.set(employee.input.email, emailRows)
  }

  for (const [email, emailRows] of rowsByEmail) {
    if (emailRows.length > 1) {
      for (const rowNumber of emailRows) {
        rowIssues.push(`CSV row ${rowNumber} (email): The email ${email} is duplicated.`)
      }
    }
  }

  if (rowIssues.length > 0) {
    return { success: false, message: formatIssues(rowIssues) }
  }

  const createId = options.createId ?? (() => crypto.randomUUID())
  const timestamp = options.now?.() ?? new Date().toISOString()
  const idByEmail = new Map(
    parsedEmployees.map(({ input }) => [input.email, createId()]),
  )
  const employees: Employee[] = []

  for (const employee of parsedEmployees) {
    const managerId = employee.managerEmail
      ? idByEmail.get(employee.managerEmail)
      : null

    if (employee.managerEmail && !managerId) {
      rowIssues.push(
        `CSV row ${employee.row} (managerEmail): ${employee.managerEmail} does not match a person in this CSV file.`,
      )
      continue
    }

    employees.push(
      employeeSchema.parse({
        ...employee.input,
        id: idByEmail.get(employee.input.email),
        managerId,
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
    )
  }

  if (rowIssues.length > 0) {
    return { success: false, message: formatIssues(rowIssues) }
  }

  const organization = validateOrganization(employees)

  if (!organization.success) {
    const rowById = new Map(employees.map((employee, index) => [employee.id, parsedEmployees[index]?.row]))
    const organizationIssues = organization.issues.map((issue) => {
      const rowNumber = issue.employeeId ? rowById.get(issue.employeeId) : undefined
      const field = issue.field === 'managerId' ? 'managerEmail' : issue.field

      return `CSV row ${rowNumber ?? '?'}${field ? ` (${field})` : ''}: ${issue.message}`
    })

    return { success: false, message: formatIssues(organizationIssues) }
  }

  return { success: true, employees: organization.employees }
}

export function serializeOrganizationCsvTemplate() {
  return `\uFEFF${ORGANIZATION_CSV_HEADERS.join(',')}\r\n`
}
