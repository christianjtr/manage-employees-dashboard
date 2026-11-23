import { z } from 'zod'

export const employeeSchema = z.strictObject({
  id: z.string().trim().min(1),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  avatar: z.url().optional(),
  position: z.string().trim().min(1),
  department: z.string().trim().min(1),
  managerId: z.string().trim().min(1).nullable(),
  status: z.enum(['active', 'inactive']),
  joinedAt: z.iso.date().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export type Employee = z.infer<typeof employeeSchema>
