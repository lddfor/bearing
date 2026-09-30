import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Login from "../views/login.vue";
import Bearing from "../views/bearing.vue";
import Layout from "../components/Layout/index.vue";
import NotFoundComponent from "../views/notFoundPage.vue";
import { isLoggedIn } from "../api/authStorage";

/**
 * 路由表。
 *
 * 相比改造前做了两处修正：
 *   1) 原来有两条 path: "/"（一条指 Login、一条作 Layout 父级），靠"先匹配先赢"才没出错；
 *      现在 Login 有独立路径 /login 与名字 Login，二者不再重叠；
 *   2) Layout 作为父路由用 path: ""（空路径子路由），/bearing 依旧正常。
 */
const routes: RouteRecordRaw[] = [
  { path: "/", redirect: { name: "Login" } },
  { path: "/login", name: "Login", component: Login },
  { path: "/home", redirect: { name: "Bearing" } },
  {
    path: "/",
    component: Layout,
    children: [
      { path: "bearing", name: "Bearing", component: Bearing, meta: { requiresAuth: true } },
    ],
  },
  { path: "/:pathMatch(.*)", component: NotFoundComponent },
];

const router = createRouter({
  // 使用 HTML5 History 模式，URL 中不会显示 #
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

/**
 * 登录守卫。
 *
 * 注意：这只是前端体验层拦截（没 token 就回登录页）。
 * 真正的鉴权在后端拦截器 —— 前端守卫可以被绕过，安全性不能依赖它。
 */
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isLoggedIn()) {
    return { name: "Login" };
  }
  // 已登录还去登录页就直接进数据页
  if (to.name === "Login" && isLoggedIn()) {
    return { name: "Bearing" };
  }
  return true;
});

export default router;
