<template>
  <div>
    <v-data-table :headers="headers" :items="employeeList" class="elevation-1">
      <template v-slot:top>
        <v-toolbar flat color="white">
          <v-toolbar-title>Employees</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn
            color="blue"
            dark
            @click="callToAddEmployee()"
            title="Add New Employee"
            >Add New Employee
          </v-btn>
        </v-toolbar>
      </template>
      <template v-slot:[`item.avatar`]="{ item }">
        <v-avatar size="35px">
          <img :src="item.avatar" alt="Employee avatar" />
        </v-avatar>
      </template>
      <template v-slot:[`item.gender`]="{ item }">
        <v-icon>gender-male</v-icon>
        <span class="text-capitalize">{{ item.gender }}</span>
      </template>
      <template v-slot:[`item.action`]="{ item }">
        <v-btn
          small
          color="blue"
          class="mr-3"
          text
          @click="callToEditEmployee(item)"
          title="Edit"
          >Edit
        </v-btn>
        <v-btn
          small
          color="red lighten-1"
          text
          @click="deleteEmployeeByID(item)"
          title="Delete"
          >Delete
        </v-btn>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";

export default {
  name: "EmployeeList",
  data() {
    return {
      headers: [
        { text: "", align: "center", value: "avatar", sortable: false },
        { text: "Name", value: "name", sortable: true },
        { text: "Age", value: "age", sortable: true },
        { text: "Gender", value: "gender", sortable: true },
        { text: "E-mail", value: "email", sortable: false },
        {
          text: "Mobile phone number",
          value: "phoneNumber",
          sortable: false,
        },
        { text: "Actions", align: "center", value: "action", sortable: false },
      ],
    };
  },
  computed: {
    ...mapGetters("Employee", ["employeeList", "hasEmployee"]),
    ...mapGetters("UserInterface", ["isEmployeeFormStateEditable"]),
  },
  methods: {
    ...mapActions("Employee", [
      "editEmployeeByID",
      "deleteEmployeeByID",
      "setEmployeeToBeEdited",
    ]),
    ...mapActions("UserInterface", [
      "setDialog",
      "setEmployeeFormStateEditable",
    ]),
    async callToAddEmployee() {
      if (this.isEmployeeFormStateEditable)
        await this.setEmployeeFormStateEditable();
      await this.setEmployeeToBeEdited(null);
      await this.setDialog();
    },
    async callToEditEmployee(employee) {
      if (!this.isEmployeeFormStateEditable)
        await this.setEmployeeFormStateEditable();
      await this.setEmployeeToBeEdited(employee);
      await this.setDialog();
    },
  },
};
</script>
