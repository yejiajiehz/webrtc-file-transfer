import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "首页",
    component: () => import(/* webpackChunkName: "home" */ "../views/Home"),
  },
];

const router = createRouter({
  history: createWebHistory("/"),
  routes,
});

export default router;
