import axios from  'axios';

import Employee from "@/models/employee";

// @christianjtr: Change this value as you wish, it is just for the assignment...
const NUM_EMPLOYEES = 100;

const getAllEmployees = async () => {
    const {data: {info, results}} = await axios.get(`https://randomuser.me/api/?results=${NUM_EMPLOYEES}`);
    return {
      reqInfo: info,
      employeeList: results.map(employee => new Employee(employee))
    };
};

// Dummy services...
const createNewEmployee = newEmployee => {
  return new Employee(newEmployee);
};

const editEmployeeByID = async data => {
  return data.employeeData;
};

const deleteEmployeeByID = async employeeID => {
    return employeeID;
};

export default {
  getAllEmployees,
  createNewEmployee,
  editEmployeeByID,
  deleteEmployeeByID
};
