import MUTATION_TYPES from './mutation-types';

const setDialog = async ({
  commit
}) => {
    commit(MUTATION_TYPES.SET_DIALOG);
};

const setEmployeeFormStateEditable = async ({
  commit
}) => {
    commit(MUTATION_TYPES.SET_EMPLOYEE_FORM_STATE);
};

export default {
  setDialog,
  setEmployeeFormStateEditable
};
