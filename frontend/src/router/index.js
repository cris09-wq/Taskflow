import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';

const DashboardView = () => import('../views/DashboardView.vue');
const NewRequestView = () => import('../views/NewRequestView.vue');
const RequestsView = () => import('../views/RequestsView.vue');
const RequestDetailView = () => import('../views/RequestDetailView.vue');
const MonitorView = () => import('../views/MonitorView.vue');

// Rutas propuestas en la sección 3.6 del enunciado.
const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', redirect: { name: 'dashboard' } },
      { path: 'dashboard', name: 'dashboard', component: DashboardView, meta: { titulo: 'Dashboard' } },
      { path: 'solicitudes', name: 'solicitudes', component: RequestsView, meta: { titulo: 'Solicitudes' } },
      {
        path: 'solicitudes/nueva',
        name: 'solicitudes-nueva',
        component: NewRequestView,
        meta: { titulo: 'Nueva solicitud' }
      },
      {
        path: 'solicitudes/:id',
        name: 'solicitudes-detalle',
        component: RequestDetailView,
        meta: { titulo: 'Detalle de solicitud' },
        props: true
      },
      { path: 'monitor', name: 'monitor', component: MonitorView, meta: { titulo: 'Monitor' } }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'dashboard' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

router.afterEach((to) => {
  document.title = to.meta?.titulo ? `TASKFLOW · ${to.meta.titulo}` : 'TASKFLOW';
});

export default router;
