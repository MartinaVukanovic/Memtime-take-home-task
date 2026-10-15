import { createRouter, createWebHistory } from 'vue-router'
import ClientsView from '../views/ClientsView.vue'
import ClientProjectsView from '../views/ClientProjectsView.vue'
import ProjectTasksView from '../views/ProjectTasksView.vue'
import TaskTimeEntriesView from '../views/TaskTimeEntriesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/clients',
    },
    {
      path: '/clients',
      name: 'clients',
      component: ClientsView,
    },
    {
      path: '/clients/:clientId/projects',
      name: 'client-projects',
      component: ClientProjectsView,
    },
    {
      path: '/clients/:clientId/projects/:projectId/tasks',
      name: 'project-tasks',
      component: ProjectTasksView,
    },
    {
      path: '/clients/:clientId/projects/:projectId/tasks/:taskId/time-entries',
      name: 'task-time-entries',
      component: TaskTimeEntriesView,
    },
    {
      path: '/clients/:clientId/projects/:projectId/tasks/:taskId',
      redirect: (to) => ({
        name: 'task-time-entries',
        params: to.params,
      }),
    },
    {
      path: '/clients/:clientId/projects/:projectId',
      redirect: (to) => ({
        name: 'project-tasks',
        params: { clientId: to.params.clientId, projectId: to.params.projectId },
      }),
    },
  ],
})

export default router
