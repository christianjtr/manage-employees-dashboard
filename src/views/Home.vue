<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center" class="px-5">
      <v-flex v-if="hasEmployee">
        <EmployeeList />
      </v-flex>
      <v-flex v-else>
        <v-overlay value="true">
          <v-progress-circular indeterminate size="64"></v-progress-circular>
        </v-overlay>
      </v-flex>
    </v-row>
    <v-dialog v-model="isDialogOpen" eager persistent max-width="500px">
      <EmployeeForm v-if="isDialogOpen" />
    </v-dialog>
  </v-container>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import EmployeeList from "@/components/employees/EmployeeList";
import EmployeeForm from "@/components/employees/EmployeeForm";

export default {
  name: "Home",
  components: {
    EmployeeList,
    EmployeeForm,
  },
  computed: {
    ...mapGetters("UserInterface", ["isDialogOpen"]),
  },
  created() {
    this.getAllEmployees();
  },
  methods: {
    ...mapActions("Employee", ["getAllEmployees", "hasEmployee"]),
  },
};
</script>
