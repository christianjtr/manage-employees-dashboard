<script setup lang="ts">
defineProps<{
  modelValue: boolean
  title: string
  message: string
  confirmLabel: string
  confirmColor: string
}>()

const emit = defineEmits<{
  'update:modelValue': [open: boolean]
  confirm: []
}>()
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="440"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card rounded="lg">
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>{{ message }}</v-card-text>
      <v-card-actions class="confirmation-dialog-actions">
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">
          Cancel
        </v-btn>
        <v-btn
          :color="confirmColor"
          variant="flat"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
