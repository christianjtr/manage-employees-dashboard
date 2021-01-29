import MUTATION_TYPES from './mutation-types';
import EmployeeServices from '@/services/employee';

const getAllEmployees = async ({
  commit
}) => {
    const {
      employeeList
    } = await EmployeeServices.getAllEmployees();
    commit(MUTATION_TYPES.SET_EMPLOYEE_LIST, {
      employeeList
    });
};

const createNewEmployee = async ({
  commit
}, payload) => {
    const { data } = payload;
    const newEmployee = await EmployeeServices.createNewEmployee(data);
    commit(MUTATION_TYPES.ADD_NEW_EMPLOYEE_TO_LIST, newEmployee);
};

const setEmployeeToBeEdited = async ({
  commit
}, payload) => {
    commit(MUTATION_TYPES.SET_EMPLOYEE_TO_BE_EDITED, payload);
};
setEmployeeToBeEdited;

const editEmployeeByID = async ({
  commit
}, payload) => {
    const { data } = payload;
    const editedEmployee = await EmployeeServices.editEmployeeByID({
      employeeData: {
        name: data.name,
        age: data.age,
        gender: data.gender,
        phoneNumber: data.phoneNumber,
        email: data.email
      },
      employeeID: data._id
    });
    commit(MUTATION_TYPES.SET_EDITED_EMPLOYEE_IN_LIST, {_id: data._id, ...editedEmployee});
};

const deleteEmployeeByID = async ({
  commit
}, payload) => {
    const { _id: employeeId } = payload;
    if (confirm("Are you sure you want to delete this record?")) {
      await EmployeeServices.deleteEmployeeByID(employeeId);
      commit(MUTATION_TYPES.REMOVE_EMPLOYEE_FROM_LIST, employeeId);
    }
};

export default {
  getAllEmployees,
  createNewEmployee,
  editEmployeeByID,
  deleteEmployeeByID,
  setEmployeeToBeEdited,
};
