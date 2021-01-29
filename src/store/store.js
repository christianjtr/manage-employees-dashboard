import Vue from 'vue';
import Vuex from 'vuex';
import UserInterface from './modules/user-interface';
import Employee from './modules/employee';

Vue.use(Vuex);

const store = new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  modules: {
    UserInterface,
    Employee,
  }
});

export default store;
