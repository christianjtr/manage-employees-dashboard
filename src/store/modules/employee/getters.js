const employeeList = state => state.employeeList;
const hasEmployee = state => state.employeeList.length > 0;
const employeeToBeEdited = state => state.employeeToBeEdited;

export default {
  employeeList,
  hasEmployee,
  employeeToBeEdited
};
