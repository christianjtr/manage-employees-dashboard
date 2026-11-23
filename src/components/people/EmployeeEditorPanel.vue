<script setup lang="ts">
import { computed, reactive, watch } from 'vue'

import {
  employeeInputSchema,
  type Employee,
  type EmployeeInput,
} from '@/domain/employee'
import { getAvailableManagers, getFullName } from '@/domain/organization'

const props = defineProps<{
  modelValue: boolean
  employee: Employee | null
  employees: Employee[]
  defaultManagerId: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [open: boolean]
  save: [input: EmployeeInput]
}>()

const values = reactive({
  firstName: '',
  lastName: '',
  email: '',
  position: '',
  department: '',
  managerId: null as string | null,
  status: 'active' as Employee['status'],
  joinedAt: '',
})
const errors = reactive<Record<string, string>>({})

const managerItems = computed(() =>
  getAvailableManagers(props.employee?.id ?? null, props.employees).map(
    (employee) => ({
      title: `${getFullName(employee)} · ${employee.position}`,
      value: employee.id,
    }),
  ),
)

function resetForm() {
  Object.keys(errors).forEach((key) => delete errors[key])
  Object.assign(values, {
    firstName: props.employee?.firstName ?? '',
    lastName: props.employee?.lastName ?? '',
    email: props.employee?.email ?? '',
    position: props.employee?.position ?? '',
    department: props.employee?.department ?? '',
    managerId: props.employee?.managerId ?? props.defaultManagerId,
    status: props.employee?.status ?? 'active',
    joinedAt: props.employee?.joinedAt ?? '',
  })
}

watch(
  [() => props.modelValue, () => props.employee?.id, () => props.defaultManagerId],
  ([open]) => {
    if (open) {
      resetForm()
    }
  },
)

function submit() {
  Object.keys(errors).forEach((key) => delete errors[key])

  const result = employeeInputSchema.safeParse({
    ...values,
    joinedAt: values.joinedAt || undefined,
  })

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string' && !errors[field]) {
        errors[field] = issue.message
      }
    }
    return
  }

  emit('save', result.data)
}

function fieldError(field: string) {
  return errors[field] ? [errors[field]] : []
}

function updateOpen(open: boolean) {
  emit('update:modelValue', open)
}
</script>

<template>
  <v-navigation-drawer
    class="employee-editor-drawer"
    :model-value="modelValue"
    location="right"
    temporary
    width="440"
    @update:model-value="updateOpen"
  >
    <div class="drawer-heading">
      <div>
        <p class="eyebrow">PEOPLE</p>
        <h2>{{ employee ? 'Edit person' : 'Add person' }}</h2>
      </div>
      <v-btn
        icon="mdi-close"
        aria-label="Close form"
        variant="text"
        @click="updateOpen(false)"
      />
    </div>

    <v-divider />

    <v-form class="employee-form" @submit.prevent="submit">
      <div class="editor-fields">
        <div class="form-name-row">
          <v-text-field
            v-model="values.firstName"
            label="First name"
            autocomplete="given-name"
            autofocus
            :error-messages="fieldError('firstName')"
          />
          <v-text-field
            v-model="values.lastName"
            label="Last name"
            autocomplete="family-name"
            :error-messages="fieldError('lastName')"
          />
        </div>
        <v-text-field
          v-model="values.email"
          label="Work email"
          type="email"
          autocomplete="email"
          :error-messages="fieldError('email')"
        />
        <v-text-field
          v-model="values.position"
          label="Position"
          :error-messages="fieldError('position')"
        />
        <v-text-field
          v-model="values.department"
          label="Department"
          :error-messages="fieldError('department')"
        />
        <v-select
          v-model="values.managerId"
          label="Direct manager"
          :items="managerItems"
          item-title="title"
          item-value="value"
          clearable
          :error-messages="fieldError('managerId')"
        />
        <div class="form-name-row">
          <v-select
            v-model="values.status"
            label="Status"
            :items="[
              { title: 'Active', value: 'active' },
              { title: 'Inactive', value: 'inactive' },
            ]"
          />
          <v-text-field
            v-model="values.joinedAt"
            label="Joining date"
            type="date"
            :error-messages="fieldError('joinedAt')"
          />
        </div>
      </div>

      <div class="drawer-actions">
        <v-btn variant="text" @click="updateOpen(false)">Cancel</v-btn>
        <v-btn color="primary" type="submit">
          {{ employee ? 'Save changes' : 'Add person' }}
        </v-btn>
      </div>
    </v-form>
  </v-navigation-drawer>
</template>
