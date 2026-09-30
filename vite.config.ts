import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import legacy from "@vitejs/plugin-legacy";

// https://vitejs.dev/config/
export default defineConfig({
  assetsInclude: ["**/*.tif", "**/*.PDF", "**/*.xlsx"],

  // 部署子路径。当前用于 GitHub Pages 的 /bearing/；
  // 阶段 6（改由 Spring Boot 托管前端产物）时需要改成 '/'，否则静态资源会 404。
  base: '/bearing/',

  server: {
    // 开发期代理：前端 9000 -> 后端 8080
    // 好处是浏览器视角只有"同源请求"，完全绕开 CORS，后端也不需要配跨域白名单。
    // 因此 src/api/http.ts 里 API_BASE_URL 取空串，请求写成相对路径 /api/...
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // 图片与 PDF 仍由前端 public/ 提供（Vite 会直接托管 public 下的文件），
      // 所以这里不代理 /QJS206Image 之类路径 —— 避免同一份素材有两个来源。
      // 阶段 6 把图片挪到 Spring Boot 的 static 后，再按需加代理或直接同源访问。
    },
  },

  plugins: [
    legacy({
      targets: ["defaults", "not IE 11"]
    }),
    vue()],

  define: {
    // Vue 的 esm-bundler 构建要求显式注入 feature flag，否则控制台会警告
    // "Feature flag __VUE_PROD_HYDRATION_MISMATCH_DETAILS__ is not explicitly defined"。
    // 本项目是纯客户端渲染（没有 SSR/hydration），所以关掉它。
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },

  build: {
    target: ["es2015", "chrome63"], // 默认是modules,百度说是更改这个会去输出兼容浏览器，尝试没啥作用，先配置吧
  }
});
