# 轴承检测数据库 · 前端（Vue 3 + TypeScript + Vite）

前后端分离项目的前端部分。后端在**平级目录** `..\backendBreaing`（Spring Boot 3 + Java 17，独立仓库）。

```
C:\Users\A\Desktop\code\
├─ breaing\            本仓库：前端（Vue 3 + TS + Vite + Element Plus）
└─ backendBreaing\     后端（Spring Boot 3 + Java 17 + H2/MySQL）
```

---

## 一、怎么跑起来（两步）

### 1）先起后端

```bat
cd ..\backendBreaing
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot
scripts\mvn.cmd spring-boot:run
```

后端默认监听 **8080**，启动时会自动建表并导入种子数据（32 行轴承 + 256 行明细 + 1 个用户）。
浏览器打开 <http://localhost:8080/api/health> 看到 `{"status":"UP",...}` 即就绪。

### 2）再起前端

```bat
npm run dev
```

前端跑在 **9000**，Vite 已配置代理：`/api` 的请求会转发到 `http://localhost:8080`，
因此浏览器视角是**同源请求**，完全绕开 CORS（后端也不需要配跨域白名单）。
访问 <http://localhost:9000/bearing/>，用下面账号登录。

> ⚠️ **必须先起后端**。前端启动本身不依赖后端，但登录和列表都会调接口；
> 后端没起时页面会提示"无法连接后端服务，请确认后端已启动（默认 8080）"。

### 登录账号

| 账号 | 密码 |
|---|---|
| `BJUT-TS` | `123456` |

口令由后端 **BCrypt** 校验，账号存在数据库 `app_user` 表里（**没有注册功能**，账号由后台开户）。
登录成功后 token 存在 `sessionStorage`（关掉标签页即登出，与后端"token 存内存"的行为一致）。

---

## 二、接口对接说明

前端不直接写死任何数据，全部来自后端接口：

| 前端调用 | 后端接口 | 用途 |
|---|---|---|
| `src/api/auth.ts` → `login` | `POST /api/auth/login` | 登录，拿 token |
| `src/api/auth.ts` → `logout` | `POST /api/auth/logout` | 退出，吊销 token |
| `src/api/bearing.ts` → `fetchBearings` | `GET /api/bearings` | 列表 + 筛选（`bearingType`/`bearingModel`/`bearingNo`） |
| `src/api/bearing.ts` → `fetchOptions` | `GET /api/bearings/options` | 下拉选项（数据库 distinct，不再写死） |
| `src/api/bearing.ts` → `fetchRawSamples` | `GET /api/bearings/{id}/raw-data` | 原始逐样本明细（8 条，含"平均值"） |

完整接口文档见后端仓库的 `docs/api.md`。

### 文件结构（前端新增部分）

```
src/api/
├─ types.ts        后端 DTO 的类型定义（改字段时两边必须同步，否则编译期报错）
├─ http.ts         基于原生 fetch 的封装：自动带 token、拆统一响应体、401 自动回登录页
├─ authStorage.ts  token / 用户信息的 sessionStorage 读写
├─ auth.ts         登录 / 登出 / 查询当前用户
└─ bearing.ts      轴承数据接口 + 后端字段到界面字段的适配
src/composables/useImagePreview.ts   图片预览弹层状态（Ls/Rs/Z 图与阻抗区间图共用）
src/components/ImagePreviewDialog/   通用图片预览弹层
scripts/verify-api-integration.mjs   前后端契约校验脚本（见下）
```

**为什么用 `fetch` 而不是 axios**：当前开发环境访问不了 npm registry，
`fetch` 是浏览器内置能力，零依赖即可跑通。`package.json` 里已声明 `axios`，
以后要加请求重试/上传进度时替换 `src/api/http.ts` 即可，接口层无需改动。

---

## 三、字段口径：表格里的数字为什么和改造前不一样

后端把甲方原始数据里"历史乱命名"的字段（`rsLsUntreated`、`zIonImplantation`…）
统一改成了**按单位语义命名**：`rs` = Rs/Ω、`ls` = Ls/mH、`z` = Z/Ω，
条件取 `untreated`（未处理）/ `ion`（离子注入）/ `emc`（电磁耦合强化）。

改造前后端把原始字段名直接透传到界面，导致**「未处理」那一列显示的其实是离子注入的值**
（整体错位一格）。现在按语义重排，所以同一格里的数字变了 —— 这是修正。

以 `QJS206-1` 为例，界面现在显示：

| 条件 | Rs/Ω | Ls/mH | Z/Ω |
|---|---|---|---|
| 未处理 | 260.791 | -2.08409 | **2631.89712** |
| 离子注入 | 246.909 | -2.0549 | 2594.0464 |
| 电磁耦合强化 | 247.898 | -2.06319 | 2604.51097 |

> 改造前"未处理 Z"位置显示的是 2594.0464（离子注入的值）。

**仍未确认的两个业务口径**（详见仓库根目录 `CONVENTIONS.md` 第 5 节）：
1. 原始表格里 Z 的三个值疑似整体串行（现按上面口径落库，需甲方确认）；
2. 变化率列数值吻合"vs 离子注入"，但表头写的是"相较于未处理"。

---

## 四、改完代码怎么验证

```bat
npx vue-tsc --noEmit                     :: 类型检查，必须 0 错误
node scripts\verify-api-integration.mjs  :: 前后端契约校验（需要后端已启动）
npm run build                            :: 生产构建
```

`scripts\verify-api-integration.mjs` 会用真实后端核对 23 项：
登录拿 token、无 token 被拦（401/40100）、DTO 字段是否与前端类型定义一致、
适配后的 9 个单元格数值是否正确、编号筛选、明细条数（8 条含"平均值"）、下拉选项。
**建议每次改完接口对接层都跑一次**，它比肉眼看界面可靠。

---

## 五、已知问题

| 现象 | 说明 |
|---|---|
| `NU1006-20` 点"Z图"显示加载失败 | 素材缺 `public/NU1006Image/NU1006-20-Z对比.png`（只有 Ls、Rs），属已知数据缺口 |
| 界面点"阻抗有效区间"所有编号显示同一张图 | 后端按型号固定取 `-16` 版，未按编号区分，属待确认口径 |
| 表格只到 16 号 | `bearingData.ts` 里没有 17–26 号的汇总行，两个 JSON 里那 160 条明细因此未入库 |
| 部署到 GitHub Pages 后图片 404 | `vite.config.ts` 的 `base: '/bearing/'` 与图片根相对路径的配合问题，统一托管到后端（阶段 6）时一并处理 |

---

## 六、后续计划

| 阶段 | 内容 | 状态 |
|---|---|---|
| 1–4 | 后端：骨架 / 数据层 / REST 接口 / 登录鉴权 | ✅ 已完成并跑通 |
| **5** | **前端接入后端：接口层、登录、路由守卫、退出、字段口径对齐** | ✅ **本次完成** |
| 6 | 前端构建产物打进后端 `resources/static`，由 Spring Boot 单独托管全站 | ⏳ |

阶段 6 需要处理 `vite.config.ts` 里的 `base: '/bearing/'`（改成 `/`）以及图片路径统一来源。
