import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'organization',
      component: () => import('@/views/OrganizationView.vue'),
    },
    {
      path: '/people',
      name: 'people',
      component: () => import('@/views/PeopleView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
