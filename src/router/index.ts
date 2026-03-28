import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
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
  // 4. 内部提供了 history 模式的实现。为了简单起见，我们在这里使用 hash 模式。
  history: createWebHashHistory(),
  routes, // `routes: routes`
});

export default router;
