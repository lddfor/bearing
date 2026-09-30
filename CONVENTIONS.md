# 项目开发规约（CONVENTIONS）

> 适用范围：本仓库（轴承检测数据库，Vue 3 + TypeScript + Vite + Element Plus）的**全部后续修改**。
> 任何一次改动（无论人写还是 AI 写）都必须先读本文件，并逐条遵守。
> 规约与需求冲突时：先问，不要自行取舍。

---

## 0. 最高优先级：不要提交

- **严禁执行 `git commit` / `git push` / `git tag`**，除非用户在当前对话里明确说"提交"。
- 严禁 `git checkout -- <file>`、`git restore`、`git reset --hard`、`git clean`、`git stash` 等会丢弃用户未提交内容的命令。
- 改完就停在"工作区有未提交改动"的状态，由用户自己 review。
- 需要提交时，**只在回复里给出 commit 信息**（见第 8 节），由用户决定何时提交。

## 1. 不越界原则

- **只改与本次需求相关的代码。** 不做"顺手重构"、不调整无关格式、不重排 import 顺序之外的代码块。
- **数据文件默认只读**：`src/data/bearingData.ts`、`src/data/QJS206.json`、`src/data/NU1006.json`
  以及 `public/**` 下的图片/PDF 属于原始检测数据与交付素材，**未经用户确认不得修改、格式化、批量重写**。
- 不改 `dist/`（构建产物）。要更新产物用构建命令，不手工编辑。
- 不擅自升级依赖版本、不擅自换包管理器（本仓库 `package-lock.json` 为准，见第 6 节）。

## 2. 函数写法：统一 const 箭头函数

用户偏好 **`const` + 箭头函数**，不要用 `function` 声明（`vite.config.ts` 除外，那是配置对象字面量）。

```ts
// ✅ 正确
const searchHandle = (): void => {
  // ...
};

// ❌ 避免
function searchHandle() { /* ... */ }
```

- 事件处理函数命名：`handleXxx`（如 `handleMenuSelect`、`handleOriginalData`）。
- 纯计算/取值函数命名：动词开头，如 `getImagePath`、`loadImage`。
- 布尔判断用 `isXxx` / `hasXxx`。
- 复杂表达式（如模板里要用的分类判断）用 `computed`，不要写成内联三元堆叠。
- 组合式逻辑超过约 60 行、或同一状态被多个弹层复用时，抽到 `src/composables/useXxx.ts`，
  并在文件顶部写明用途。

## 3. TypeScript：必须零报错

- **改完必须跑 `npx vue-tsc --noEmit`，要求输出为空。** 当前基线：0 错误。
- `tsconfig.json` 已开启 `strict`、`noUnusedLocals`、`noUnusedParameters`，因此：
  - 删代码时**必须同步删掉不再使用的 `import` 和变量**，否则直接报 TS6133。
  - 用不到的函数参数**直接删掉**，不要保留 `rule` 这种占位参数。
- **禁止新增 `any`**。确实拿不到类型时：先用 `unknown` + 类型收窄；仍不行则写 `// TODO(类型)` 注释说明原因。
- 数据结构必须显式声明接口（`interface`），不要用 `as any` 绕过。
- 类型断言（`as`）只用于"我比编译器更确定"的场景，且要有注释说明依据。
- 依赖必须显式声明在 `package.json` 里才能 `import`；不允许依赖别的包的传递依赖
  （例：`@element-plus/icons-vue` 已显式声明）。
- `.vue` 文件统一 `<script setup lang="ts">`。

## 4. 注释：只写"为什么"，不写"是什么"

必要的注释指的是下面这些，**必须写**：

- **业务口径**：字段名与表头/单位的对应关系、计算公式的来源。这是本项目最容易出错的地方，
  例：`// 字段沿用原始数据命名：rs* 存 Z/Ω，z* 存 Rs/Ω 或 Ls/mH（见 CONVENTIONS 第五节）`。
- **魔数与硬编码**：`calc(100vh - 150px)` 里的 `150`、写死的 `base: '/bearing/'`、硬编码密码等，
  要说明它对应界面上的什么。
- **绕过性写法**：为什么要 `.replace('#', '')`、为什么要等 300ms 再清空状态 —— 说明原因。
- **临时/待定**：统一用 `// TODO(原因)` 标记，不要写"以后再说"。

不需要的注释：

- 复述代码的注释（`// 定义变量`、`// 循环遍历`、`// 设置值`）。
- 被注释掉的旧代码（直接删，git 里有历史）。
- 已废弃方案的长篇说明（放到讨论记录里，不要留在源码里，例：早期 TIF/UTIF 方案）。

## 5. 数据与字段口径（本项目重灾区，务必先看）

- 原始数据来自 `修改图片显示逻辑.md` 里甲方给的表，**字段名（key）是历史命名，与含义不一致**。
  以 `QJS206-1` 为基准逐格核对过（甲方原文语义 → 代码里实际存放的字段 → 该字段当前值）：

  | 甲方原文（语义） | 原文值 | 代码实际字段 | 当前值 |
  |---|---|---|---|
  | Rs/Ω 未处理 | 262.086 | `rsLsUntreated` | 260.791 |
  | Rs/Ω 离子注入 | 247.812 | `zIonImplantation` | 246.909 |
  | Rs/Ω 电磁耦合强化 | 248.875 | `zElectromagneticCoupling` | 247.898 |
  | Ls/mH 未处理 | -2.08899 | `zLsUntreated` | -2.08409 |
  | Ls/mH 离子注入 | -2.05900 | `zIonImplantation2` | -2.0549 |
  | Ls/mH 电磁耦合强化 | -2.06702 | `zElectromagneticCoupling2` | -2.06319 |
  | Z/Ω 未处理 | 2638.15223 | `rsElectromagneticCoupling` | 2594.0464 |
  | Z/Ω 离子注入 | 2599.25384 | `rsIonImplantation` | 2631.89712 |
  | Z/Ω 电磁耦合强化 | 2609.39094 | `zElectromagneticCoupling3` | 2604.51097 |

- **规律**：`rs*` 与 `z*` 都不能当单位依据；真正可靠的对照只有"甲方原文数值 ↔ 代码字段值"。
- **三方交叉验证（动任何表格列之前必做）**：字段名 / 表头文字 / 数值量级三者对齐。
  量级参考：Rs ≈ 137（NU1006）或 259（QJS206）；Ls ≈ -1.1 或 -2.0；Z ≈ 1483 或 2599。
- **已知错位与口径疑点（属于业务问题，未经确认不得擅自改）**：
  1. 主表 1# 行疑似整体错位一格：界面"未处理"第三列显示 2631.90（实为**离子注入**的 Z），
     "离子注入"第三列显示 2594.05（实为**电磁耦合强化**的 Z），"离子注入"第一列显示 246.909
     （Rs 量级，但甲方原文此处应为 Z）。即标签整体向后挪了一位，导致"未处理"列其实是离子注入值。
  2. 变化率列口径待确认：表头写"相较于未处理"，但 `impedanceChangeRate` 数值吻合
     **vs 离子注入**（1#：2604.51097 - 2631.89712 ≈ -1.041%）。改表头或改数值前先问。
- 在用户给出正确口径之前：只允许**加注释说明**，不允许调换 `prop`（会改变界面数字，属业务变更）。
- 图片路径规则：`public/{型号}Image/{型号}-{编号去掉#}-{Ls|Rs|Z}对比.png`；
  所有静态资源 URL 必须拼 `import.meta.env.BASE_URL`（部署在子路径 `/bearing/`）。
- 原始数据 JSON 通过 `{型号}-{编号去掉#}` 作为 key 关联，改动时三处（主表/JSON/图片命名）一起核对。

## 6. 依赖与构建

- 依赖以 `package-lock.json` 为准（`pnpm-lock.yaml` 与已安装版本不一致，视为无效文件）。
- 安装/卸载依赖前先问用户；本仓库同时存在两份 lockfile，批量操作容易把版本搞乱。
- 不允许新增"引入但未使用"的依赖（本次已移除 `axios`、`fast-glob`、`underscore`）。
- 构建命令：`npm run build`（等价 `vite build`）；发布 `npm run deploy` 会覆盖 `gh-pages` 分支，
  **未经允许不得执行 `deploy`**。

## 7. 样式与资源

- 样式用 `<style scoped lang="less">`；类名 kebab-case，与组件语义对应。
- 覆盖 Element Plus 内部类用 `:deep(...)`，并单列一小段，便于升级时排查。
- 图片统一用 `<img :src>` 直连静态资源；**不再引入 TIF/UTIF 方案**（已废弃）。
- 图片加载必须有失败兜底：监听 `<img @error>`，给出错误文案，不要留"永远无法触发的错误分支"。

## 8. 交付与 commit 信息

- 每次改完，回复里给出：改了哪些文件（附行号）、为什么、如何验证（`vue-tsc`/`build` 结果）、
  以及一条可直接使用的 commit 信息。
- commit 信息格式（中文 Conventional Commits）：

  ```
  <type>(<scope>): <简短说明>

  - <要点 1>
  - <要点 2>

  验证：npx vue-tsc --noEmit 通过；npm run build 通过
  ```

  `type` 取 `feat|fix|refactor|chore|docs|style|perf|test`。
- 一个 commit 只做一件事：清理冗余代码与业务修复**分开提交**。

## 9. 修改前自查清单（每次动手前过一遍）

1. 这次改的是"需求"还是"我顺手想改的"？后者不做。
2. 会碰到 `src/data/**`、`public/**`、依赖版本、`deploy` 吗？会就先问。
3. 删掉的东西真的没人引用了吗（模板里用了也算引用）？
4. 有没有留下未使用的 import / 变量 / 类型（`vue-tsc` 会当场报错）？
5. 表头文字、`prop`、数据量级三者对齐了吗？
6. 静态资源路径拼 `BASE_URL` 了吗？
7. 有没有把"待确认的业务口径"当成 bug 直接改掉？

---

# 后端部分（位于平级目录 backendBreaing/，独立仓库）

> 自本轮起仓库为**前后端分离**：前端仍在仓库根目录（`src/`、`public/`），后端放在**平级的 `backendBreaing/`**（独立 git 仓库）。
> 后端详细说明见 `backendBreaing/README.md`（在后端仓库里，不在本工作区）。

## 10. 后端技术栈与目录

- Spring Boot **3.2.5** + **Java 17**，构建用 **Maven**（`backendBreaing/pom.xml`）。
- **不需要全局装 Maven**：`backendBreaing/scripts/mvn.cmd` 会自动依次找 PATH 里的 `mvn`、IDEA 自带的 Maven。
- 依赖仓库锁在 **`backendBreaing/.m2repo`**（由 `backendBreaing/.mvn/maven.config` 指定），不污染全局 `~/.m2`。
- 默认数据库 **H2 文件模式**（`jdbc:h2:file:./data/bearing`，数据落在 `backendBreaing/data/`）；
  MySQL 走 `mysql` profile（`application-mysql.yml`）。
- 后端目录结构：

  ```
  backendBreaing/src/main/backendBreaing/com/bjut/bearing/
    BearingApplication.java     启动类
    controller/                 REST 接口（统一前缀 /api）
    service/                    业务逻辑
    repository/                 Spring Data JPA 接口
    entity/                     实体（对应数据库表）
    dto/                        出入参对象（不要把 entity 直接返给前端）
    config/                     配置类（拦截器、CORS、种子数据导入）
    common/                     统一响应体、全局异常处理
    data/                       数据口径与导入（FieldMapping 等）
  backendBreaing/src/main/resources/
    application.yml             默认 H2
    application-mysql.yml       可选 MySQL
    db/                         建表脚本（schema-h2.sql / schema-mysql.sql）
    static/                     前端构建产物托管目录（阶段 6 用）
  ```

## 11. Java 代码约定

- **函数体量与职责**：Controller 只做参数校验与转发，业务写在 Service，SQL/查询写在 Repository。
- **注释**：与第 4 节同一标准 —— 写"为什么"。尤其：
  - 字段口径映射必须写清"旧名 → 新名 → 依据"，例：`// 旧名 rsIonImplantation 实际是未处理的 Z，见 FieldMapping`
  - 硬编码的账号/密码/端口/路径必须注明用途并标出上线前要改。
- **类型安全**：金额/测量值统一用 `BigDecimal`，**不要用 double/float**（原始数据是 5 位小数）。
- **实体与出参分离**：接口返回 DTO，`@Entity` 不直接暴露给前端（避免懒加载异常与字段泄漏）。
- **对外接口**：统一响应体 `{code, message, data}`；异常统一由 `@RestControllerAdvice` 处理，
  不要把 500 堆栈直接给前端。
- **禁止**：把 `123456` 这类明文口令写进 `src/`；种子数据里的口令必须是 **BCrypt 哈希**。
- **禁止提交**：`target/`、`out/`、`.m2repo/`、`data/*.mv.db`（`backendBreaing/.gitignore` 已覆盖）。

## 12. Windows 脚本（.cmd）两条硬规矩

本项目在 `backendBreaing/scripts/` 下有批处理脚本，踩过两次坑，规则如下：

1. **`.cmd` 文件一律纯 ASCII，中文说明只写进 `README.md`。**
   cmd.exe 按 OEM 代码页（中文机器是 936）**逐行解析**批处理文件，
   无 BOM 的 UTF-8 中文会让解析器把注释里的字节当成命令执行，报出
   `'xxx' is not recognized as an internal or external command` 这类莫名其妙的错误。
   （脚本开头写 `chcp 65001 >nul` 只能修正**输出**乱码，救不了解析问题。）
2. **调用 JDK / Maven 等原生命令时，用 `.cmd` 包装后再跑，不要直接在 PowerShell 里拼参数。**
   Windows PowerShell 5.1 会把 `-Dfile.encoding=UTF-8` 这类参数拆坏
   （表现为 `ClassNotFoundException: /encoding=UTF-8`），用 `.cmd` 可以完全绕开。

## 13. Java 注释里的 `*/` 陷阱

Javadoc 里写通配符时**绝对不要出现 `*/`**。例：想表达"rs 和 z 两个前缀"，
写成 `rs*/z*` 会**当场闭合注释块**，后半行变成 Java 代码，javac 报一堆
`需要 <标识符>` / `非法字符`，而报错行又指向中文，极易误判成编码问题。

- ❌ `注意 rs*/ls*/z* 的取值来源`
- ✅ `注意 rs / ls / z 前缀的取值来源`

## 14. 后端自查清单

1. 跑过 `java\scripts\check-data.cmd` 了吗（数据口径是否仍自洽）？
2. 编译是否通过：`java\scripts\mvn.cmd -o clean package`（依赖已缓存时用 `-o` 离线）。
3. 新加的接口是否走了统一响应体与全局异常？
4. 是否往库里写了明文口令、或把 `@Entity` 直接返给了前端？
5. 有没有把 `target/`、`data/`、`.m2repo/` 加进版本控制？

---

# 项目实际布局（前后端分离 + 两个独立仓库）

```
C:\Users\A\Desktop\code\
├─ breaing\            前端（Vue 3 + TS + Vite）  ← 本文件所在仓库
│  ├─ src\  public\  vite.config.ts  package.json
│  └─ CONVENTIONS.md（本文件）
└─ backendBreaing\     后端（Spring Boot 3 + Java 17）← 独立 git 仓库
   ├─ pom.xml  .mvn\maven.config
   ├─ scripts\        mvn.cmd / gen-seed.cmd / check-data.cmd / verify-*.mjs
   ├─ src\main\java\com\bjut\bearing\...
   ├─ src\main\resources\db\   schema-*.sql / seed-*.sql / report.txt
   └─ docs\api.md
```

- 后端远程仓库：`git@github.com:lddfor/backendBreaing.git`（分支 `main`）
- **两者是平级目录**，后端不在前端内部 —— 因此后端脚本不能再假设"上一级目录就是前端"，
  前端路径通过 `-Dbearing.repo-root`（或环境变量 `BR_ROOT`）显式传入，默认值 `..\breaing`。
- 两个仓库各自独立提交；改后端不会出现在前端的 `git status` 里，反之亦然。

## 15. 项目脚本只保留两类（`.cmd` 与 `.mjs`）

`backendBreaing\scripts\` 下**只应存在**这两类脚本：

| 脚本 | 用途 |
|---|---|
| `mvn.cmd` | Maven 启动器（PATH → IDEA 自带 Maven），无需全局安装 |
| `gen-seed.cmd` | 读前端数据生成建表与种子 SQL、迁移报告 |
| `check-data.cmd` | 离线字段口径自检（纯 JDK，320 条规则） |
| `verify-entities.mjs` | 校验 JPA 实体 `@Column` 与 DDL 一致（防 `validate` 启动失败） |
| `verify-api.mjs` | 校验 Controller / DTO / 文档 / 测试字段一致 |
| `check-unused-imports.mjs` | 扫多余 import |

**不要往仓库里放 `.ps1`**：那类文件是迁移期的工作脚本（把改动写进受限目录、连仓库、推送），
属于一次性操作，留在项目里只会让人困惑。已清理完毕。

## 16. 三个脚本编码坑（都真实踩过，务必遵守）

1. **`.cmd` 必须纯 ASCII**：cmd.exe 按 OEM 代码页（中文机器是 936）逐行解析批处理，
   无 BOM 的 UTF-8 中文会让它把注释字节当命令执行，报出
   `'xxx' is not recognized as an internal or external command`。
   开头写 `chcp 65001` 只能修正**输出**乱码，救不了解析问题。
2. **含中文的 `.ps1` 必须存成 UTF-8 带 BOM**：Windows PowerShell 5.1 读无 BOM 的 UTF-8 会按 GBK 解析，
   中文直接导致**语法报错**（而且报错信息本身是乱码，极难定位）。
3. **在 PowerShell 里调用 JDK/Maven 时，`-D` 参数必须单独加引号并走数组传参**：
   裸写 `-Dfile.encoding=UTF-8` 会被拆成 `/encoding=UTF-8`，JVM 报 `ClassNotFoundException: /encoding=UTF-8`。
   正确写法：
   ```powershell
   $args = @('-Dfile.encoding=UTF-8', '-cp', $out, 'com.example.Main')
   & "$env:JAVA_HOME\bin\java.exe" @args
   ```

## 17. 数据口径问题仍然待确认（不因换目录而消失）

`CONVENTIONS.md` 第 5 节记录的两个业务口径疑点，仍需要甲方确认后才能改：

1. 主表 1# 行"未处理"列的 Z 值实际是**离子注入**的值（整列疑似错位一格）；
2. 变化率列口径：数值吻合"vs 离子注入"，但表头写的是"相较于未处理"。

后端已按"语义化字段名"落库并把映射集中在 `FieldMapping`/`SqlSeedGenerator`，
**口径一旦确认，只需改一处映射并重跑 `gen-seed.cmd`**。

## 18. 前端检查脚本与模板结构坑

前端 `scripts/` 下有两个检查脚本，改完前端建议都跑一遍：

| 脚本 | 用途 | 为什么需要 |
|---|---|---|
| `scripts\check-template.mjs` | 检查 `.vue` 模板的**结构性错误** | 这类错误 `vue-tsc` 与 `vite build` **都不报**，只表现为"界面布局莫名错位" |
| `scripts\verify-api-integration.mjs` | 前后端接口契约与字段映射校验（23 项断言，需后端已启动） | 接口字段改名、适配器写错，肉眼很难发现 |

### 模板坑（本项目已踩过一次）

**不要把 `<el-form-item>` 嵌套在另一个 `<el-form-item>` 里。**

搜索区三个筛选项（轴承类型 / 轴承型号 / 编号）原本被写成嵌套结构：

```html
<!-- ❌ 错：型号、编号、搜索按钮全被塞进了"轴承类型"这个表单项的默认插槽 -->
<el-form-item label="轴承类型">
  <el-select ... />
  <el-form-item label="轴承型号"> ... </el-form-item>
  <el-form-item label="编号"> ... </el-form-item>
  <el-button>搜索</el-button>
</el-form-item>

<!-- ✅ 对：平级 -->
<el-form-item label="轴承类型"><el-select ... /></el-form-item>
<el-form-item label="轴承型号"><el-select ... /></el-form-item>
<el-form-item label="编号"><el-input ... /></el-form-item>
<el-form-item><el-button>搜索</el-button><el-button>清空</el-button></el-form-item>
```

关键点：这种写法**标签是配对的**（合法 XML），所以标签配对检查、`vue-tsc`、`vite build`
全都发现不了；但 `el-form-item` 用的是默认插槽，内层表单项会被当成外层的内容渲染，
界面上就是搜索栏错位。**"标签配对"不是有效的检查规则，要查的是 Vue 的结构语义。**

另外：**按钮不要和输入控件放在同一个 `el-form-item` 里**（会继承 label 宽度而整体偏移），
应放进一个单独的无 label 的 `<el-form-item>`。

`scripts\check-template.mjs` 就是按上面两条规则实现的，并且已用改造前的坏版本**反向验证过**
（对该文件报出 2 处问题、退出码 1），不是"永远通过"的假检查器。
