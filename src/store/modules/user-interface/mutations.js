import MUTATION_TYPES from './mutation-types';

export default {
  [MUTATION_TYPES.SET_DIALOG](state) {
    state.isDialogOpen = !state.isDialogOpen;
  },
  [MUTATION_TYPES.SET_EMPLOYEE_FORM_STATE](state) {
    state.isEmployeeFormStateEditable = !state.isEmployeeFormStateEditable;
  },
};
