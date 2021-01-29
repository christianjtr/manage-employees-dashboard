import getters from './getters';
import mutations from './mutations';
import actions from './actions';

const state = {
  isDialogOpen: false,
  isEmployeeFormStateEditable: false,
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};
