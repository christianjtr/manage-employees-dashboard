import MUTATION_TYPES from './mutation-types';

export default {
  [MUTATION_TYPES.SET_EMPLOYEE_LIST](state, payload) {
    state.employeeList = [...payload.employeeList];
  },
  [MUTATION_TYPES.REMOVE_EMPLOYEE_FROM_LIST](state, payload) {
    const employeeList = state.employeeList;
    const employeeIndexToRemove = employeeList.findIndex(employee => employee._id === payload);
    employeeList.splice(employeeIndexToRemove, 1);
    state.employeeList = employeeList;
  },
  [MUTATION_TYPES.ADD_NEW_EMPLOYEE_TO_LIST](state, payload) {
    const employeeList = state.employeeList;
    employeeList.unshift(payload);
    state.employeeList = employeeList;
  },
  [MUTATION_TYPES.SET_EMPLOYEE_TO_BE_EDITED](state, payload) {
    state.employeeToBeEdited = payload;
  },
  [MUTATION_TYPES.SET_EDITED_EMPLOYEE_IN_LIST](state, payload) {
    const employeeToEdit = state.employeeList.find(employee => employee._id === payload._id);
    Object.assign(employeeToEdit, payload);
  }
};
