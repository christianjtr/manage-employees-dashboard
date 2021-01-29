<template>
  <div>
    <v-card>
      <v-card-title>
        <span class="headline">
          {{ isEmployeeFormStateEditable ? "Edit employee" : "Add employee" }}
        </span>
      </v-card-title>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12" sm="6" md="4">
              <v-text-field
                v-model="employeeForm.name"
                label="Name"
                title="Name"
                autofocus
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <v-text-field
                v-model="employeeForm.age"
                label="Age"
                title="Age"
                suffix="years old"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <v-select
                v-model="employeeForm.gender"
                :items="items"
                label="Gender"
                title="Gender"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <v-text-field
                v-model="employeeForm.email"
                label="E-mail"
                title="E-mail"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <v-text-field
                v-model="employeeForm.phoneNumber"
                label="Phone number"
                title="Phone number"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <div class="flex-grow-1"></div>
        <v-btn color="grey" text @click="setDialog" title="Cancel"
          >Cancel</v-btn
        >
        <v-btn color="blue" text @click="save" title="Save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";

export default {
  name: "EmployeeForm",
  data: () => ({
    items: ["female", "male"],
    employeeForm: {
      name: "",
      age: "",
      gender: "",
      email: "",
      phoneNumber: "",
    },
  }),
  mounted() {
    if (this.isEmployeeFormStateEditable) {
      this.employeeForm = Object.assign({}, this.employeeToBeEdited);
    }
  },
  computed: {
    ...mapGetters("UserInterface", ["isEmployeeFormStateEditable"]),
    ...mapGetters("Employee", ["employeeToBeEdited"]),
  },
  methods: {
    ...mapActions("Employee", ["createNewEmployee", "editEmployeeByID"]),
    ...mapActions("UserInterface", [
      "setDialog",
      "setEmployeeFormStateEditable",
    ]),
    async save() {
      if (this.isEmployeeFormStateEditable) {
        await this.editEmployeeByID({ data: this.employeeForm });
      } else {
        await this.createNewEmployee({ data: this.employeeForm });
      }
      this.setDialog();
    },
  },
};
</script>
