<script setup lang="ts">
import { computed } from 'vue'

import type { Employee } from '@/domain/employee'
import { getFullName } from '@/domain/organization'

const props = defineProps<{
  employee: Employee | null
  employees: Employee[]
}>()

const emit = defineEmits<{
  close: []
  edit: [employee: Employee]
  delete: [employee: Employee]
  addReport: [employee: Employee]
  select: [employee: Employee]
}>()

const manager = computed(() =>
  props.employee?.managerId
    ? props.employees.find((person) => person.id === props.employee?.managerId) ?? null
    : null,
)

const directReports = computed(() =>
  props.employee
    ? props.employees.filter((person) => person.managerId === props.employee?.id)
    : [],
)

const initials = computed(() =>
  props.employee
    ? `${props.employee.firstName[0] ?? ''}${props.employee.lastName[0] ?? ''}`.toUpperCase()
    : '',
)

function fullName(employee: Employee) {
  return getFullName(employee)
}
</script>

<template>
  <v-navigation-drawer
    class="employee-details-drawer"
    :model-value="Boolean(employee)"
    location="right"
    temporary
    width="400"
    @update:model-value="(open) => !open && emit('close')"
  >
    <template v-if="employee">
      <div class="drawer-heading">
        <div>
          <p class="eyebrow">PERSON DETAILS</p>
          <h2>Profile</h2>
        </div>
        <v-btn
          icon="mdi-close"
          aria-label="Close details"
          variant="text"
          @click="emit('close')"
        />
      </div>

      <v-divider />

      <div class="person-profile">
        <img
          v-if="employee.avatar"
          class="profile-avatar"
          :src="employee.avatar"
          alt=""
        />
        <div v-else class="profile-avatar employee-initials">
          {{ initials }}
        </div>
        <h3>{{ fullName(employee) }}</h3>
        <p>{{ employee.position }}</p>
        <v-chip
          size="small"
          :color="employee.status === 'active' ? 'success' : 'secondary'"
          variant="tonal"
        >
          {{ employee.status }}
        </v-chip>
      </div>

      <div class="detail-actions">
        <v-btn
          prepend-icon="mdi-account-plus-outline"
          variant="tonal"
          @click="emit('addReport', employee)"
        >
          Add report
        </v-btn>
        <v-btn
          icon="mdi-pencil-outline"
          aria-label="Edit person"
          variant="text"
          @click="emit('edit', employee)"
        />
      </div>

      <v-divider />

      <div class="detail-section">
        <p class="detail-label">CONTACT</p>
        <a class="detail-email" :href="`mailto:${employee.email}`">
          <v-icon icon="mdi-email-outline" size="18" />
          {{ employee.email }}
        </a>
      </div>

      <div class="detail-section">
        <p class="detail-label">ORGANIZATION</p>
        <div class="detail-pair">
          <span>Department</span>
          <strong>{{ employee.department }}</strong>
        </div>
        <div class="detail-pair">
          <span>Joined</span>
          <strong>{{ employee.joinedAt || 'Not specified' }}</strong>
        </div>
      </div>

      <div class="detail-section">
        <p class="detail-label">REPORTS TO</p>
        <button
          v-if="manager"
          class="related-person"
          type="button"
          @click="emit('select', manager!)"
        >
          <span class="mini-avatar">{{ manager.firstName[0] }}{{ manager.lastName[0] }}</span>
          <span>
            <strong>{{ fullName(manager) }}</strong>
            <small>{{ manager.position }}</small>
          </span>
          <v-icon icon="mdi-chevron-right" size="18" />
        </button>
        <p v-else class="muted-note">No manager assigned</p>
      </div>

      <div class="detail-section reports-section">
        <div class="section-heading-row">
          <p class="detail-label">DIRECT REPORTS</p>
          <v-btn
            icon="mdi-plus"
            size="small"
            aria-label="Add direct report"
            variant="text"
            @click="emit('addReport', employee)"
          />
        </div>
        <button
          v-for="report in directReports"
          :key="report.id"
          class="related-person"
          type="button"
          @click="emit('select', report)"
        >
          <span class="mini-avatar">{{ report.firstName[0] }}{{ report.lastName[0] }}</span>
          <span>
            <strong>{{ fullName(report) }}</strong>
            <small>{{ report.position }}</small>
          </span>
          <v-icon icon="mdi-chevron-right" size="18" />
        </button>
        <p v-if="directReports.length === 0" class="muted-note">
          No direct reports yet
        </p>
      </div>

      <div class="detail-footer">
        <v-btn
          color="error"
          prepend-icon="mdi-trash-can-outline"
          variant="text"
          @click="emit('delete', employee)"
        >
          Delete person
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>
