import { v4 as uuidv4 } from "uuid";

const Employee = class Employee {
  constructor(attributes = {}) {
    this._id = uuidv4();
    this.name = this._setEmployeeFullName(attributes.name);
    this.gender = attributes.gender;
    this.age = attributes.dob ? Number(attributes.dob.age) : Number(attributes.age);
    this.email = String(attributes.email).toLowerCase();
    this.avatar = attributes?.picture ? attributes.picture.thumbnail  : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
    this.phoneNumber = attributes?.cell ? attributes.cell : attributes.phoneNumber;
  }

  _setEmployeeFullName(name) {
    return (name?.first && name?.last) ? `${name.first} ${name.last}` : name; 
  }
};

export default Employee;
