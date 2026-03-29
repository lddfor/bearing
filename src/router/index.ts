import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Login from "../views/login.vue"; 
import Bearing from "../views/bearing.vue";
import Layout from "../components/Layout/index.vue";

import NotFoundComponent from "../views/notFoundPage.vue";

const routes: RouteRecordRaw[] = [
  {path: "/", component: Login},
  {path: "/home", redirect: {name: "Bearing"}},  //  跳转到 home
  {
    path: "/",
    component: Layout,
    children: [ 
      {path: "/bearing", name: "Bearing", component: Bearing},
    ]
  },
  {path: "/:pathMatch(.*)", component: NotFoundComponent}
];

const router = createRouter({
  // 使用 HTML5 History 模式，URL 中不会显示 #
  history: createWebHistory(import.meta.env.BASE_URL),
  routes, // `routes: routes`
});

export default router;
