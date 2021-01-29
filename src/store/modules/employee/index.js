import getters from './getters';
import mutations from './mutations';
import actions from './actions';

const state = {
  employeeToBeEdited: null,
  employeeList: []
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};
