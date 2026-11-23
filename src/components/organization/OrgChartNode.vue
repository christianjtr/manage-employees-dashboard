<script setup lang="ts">
import { computed } from 'vue'

import { getFullName, type OrganizationNode } from '@/domain/organization'
import type { Employee } from '@/domain/employee'

defineOptions({ name: 'OrgChartNode' })

const props = defineProps<{
  node: OrganizationNode
  expandedIds: ReadonlySet<string>
  selectedId: string | null
  highlightedIds: ReadonlySet<string>
  matchingIds: ReadonlySet<string>
}>()

const emit = defineEmits<{
  select: [employee: Employee]
  toggle: [employeeId: string]
}>()

const employee = computed(() => props.node.employee)
const name = computed(() => getFullName(employee.value))
const initials = computed(() =>
  `${employee.value.firstName[0] ?? ''}${employee.value.lastName[0] ?? ''}`.toUpperCase(),
)
const expanded = computed(() => props.expandedIds.has(employee.value.id))
</script>

<template>
  <div
    class="org-node"
    :class="{
      'is-in-path': highlightedIds.has(employee.id),
      'is-selected': selectedId === employee.id,
    }"
    :data-employee-id="employee.id"
  >
    <div class="node-main">
      <button
        class="employee-card"
        :class="{ 'is-match': matchingIds.has(employee.id) }"
        type="button"
        :aria-label="`${name}, ${employee.position}, ${employee.department}, ${employee.status}`"
        @click="emit('select', employee)"
      >
        <img
          v-if="employee.avatar"
          class="employee-avatar"
          :src="employee.avatar"
          :alt="''"
        />
        <span
          v-else
          class="employee-avatar employee-initials"
          aria-hidden="true"
        >
          {{ initials }}
        </span>
        <span class="employee-copy">
          <span class="employee-position">{{ employee.position }}</span>
          <span class="employee-name">{{ name }}</span>
          <span class="employee-department">{{ employee.department }}</span>
        </span>
        <span
          class="employee-status"
          :class="`status-${employee.status}`"
          :title="employee.status === 'active' ? 'Active' : 'Inactive'"
          aria-hidden="true"
        />
      </button>

      <button
        v-if="node.children.length > 0"
        class="report-toggle"
        type="button"
        :aria-expanded="expanded"
        :aria-label="`${expanded ? 'Collapse' : 'Expand'} ${node.children.length} direct report${node.children.length === 1 ? '' : 's'} for ${name}`"
        @click="emit('toggle', employee.id)"
      >
        <span>{{ node.children.length }}</span>
        <v-icon
          :icon="expanded ? 'mdi-chevron-left' : 'mdi-chevron-right'"
          size="16"
        />
      </button>
    </div>

    <div
      v-if="node.children.length > 0 && expanded"
      class="org-children"
    >
      <OrgChartNode
        v-for="child in node.children"
        :key="child.employee.id"
        :node="child"
        :expanded-ids="expandedIds"
        :selected-id="selectedId"
        :highlighted-ids="highlightedIds"
        :matching-ids="matchingIds"
        @select="emit('select', $event)"
        @toggle="emit('toggle', $event)"
      />
    </div>
  </div>
</template>
