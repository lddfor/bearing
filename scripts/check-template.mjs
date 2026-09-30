/**
 * Vue 单文件组件「模板结构」检查。
 *
 * 为什么需要它：
 *   本次踩的坑是搜索区布局错乱 —— 三个筛选项被写成了嵌套的 <el-form-item>：
 *
 *     <el-form-item label="轴承类型">
 *       <el-select .../>
 *       <el-form-item label="轴承型号"> ... </el-form-item>   <-- 套在里面了
 *       <el-form-item label="编号"> ... </el-form-item>
 *       <el-button>搜索</el-button>
 *     </el-form-item>
 *
 *   这种写法**标签是配对的**（是合法 XML），所以：
 *     - 标签配对检查发现不了；
 *     - vue-tsc 不报错；
 *     - vite build 不报错；
 *   但 el-form-item 用的是默认插槽，于是"型号""编号""搜索按钮"全被塞进了
 *   "轴承类型"这个表单项内部，渲染出来就是错位的。
 *
 * 因此本脚本检查的是 Vue/Element Plus 的**结构规则**，而非标签是否配对：
 *   规则 1：el-form-item 里不应内嵌 el-form-item（筛选项应当平级）
 *   规则 2：单个 el-form-item 里不应同时出现"输入类控件"和 el-button
 *          （按钮应单独放一个无 label 的 form-item，否则会继承 label 宽度而错位）
 *
 * 用法：node scripts/check-template.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 输入类控件：出现在 el-form-item 里说明这是个表单项 */
const INPUT_CONTROL = /<(el-input|el-select|el-date-picker|el-input-number|el-radio-group|el-checkbox-group|el-cascader|el-switch|el-slider|el-time-picker|el-autocomplete|el-transfer)\b/;

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(full, out);
    } else if (entry.name.endsWith('.vue')) {
      out.push(full);
    }
  }
  return out;
};

/** 取出根 <template> 块（从第一个 <template> 到与之配对的 </template>） */
const extractRootTemplate = (source) => {
  const start = source.indexOf('<template>');
  if (start < 0) return null;
  const tagRe = /<(\/?)(template)\b[^>]*?(\/?)>/g;
  tagRe.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = tagRe.exec(source)) !== null) {
    const [, closing, , selfClose] = match;
    if (selfClose) continue;
    if (closing) {
      depth--;
      if (depth === 0) return source.slice(start, match.index + match[0].length);
    } else {
      depth++;
    }
  }
  return source.slice(start);
};

/**
 * 找出所有 el-form-item 块及其范围（用栈配对，跳过自闭合写法）。
 * 返回 [{ start, end, contentStart }]，start/end 为在 template 字符串中的下标。
 */
const findFormItems = (template) => {
  const re = /<(\/?)el-form-item\b([^>]*?)(\/?)>/g;
  const stack = [];
  const items = [];
  let match;
  while ((match = re.exec(template)) !== null) {
    const isClosing = match[1] === '/';
    const isSelfClosing = match[3] === '/' || /\/\s*$/.test(match[2] ?? '');
    if (isSelfClosing) continue;
    if (isClosing) {
      const open = stack.pop();
      if (open) {
        items.push({ start: open.index, contentStart: open.contentStart, end: match.index + match[0].length });
      }
    } else {
      stack.push({ index: match.index, contentStart: match.index + match[0].length });
    }
  }
  return items;
};

const lineOf = (text, index, offset) => text.slice(0, index).split('\n').length + offset - 1;

const checkFile = (file) => {
  const source = fs.readFileSync(file, 'utf8');
  const template = extractRootTemplate(source);
  if (!template) return ['找不到根 <template> 块'];
  const templateStartLine = source.slice(0, source.indexOf('<template>')).split('\n').length;

  // 去掉注释，避免注释里写的示例标签被当成真实结构
  const cleaned = template.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  const items = findFormItems(cleaned);
  const problems = [];

  for (const item of items) {
    const content = cleaned.slice(item.contentStart, item.end);
    const line = lineOf(cleaned, item.start, templateStartLine);

    // 规则 1：form-item 内嵌 form-item
    const inner = findFormItems(content);
    if (inner.length > 0) {
      const innerLine = lineOf(cleaned, item.contentStart + inner[0].start, templateStartLine);
      problems.push(
        `第 ${line} 行的 <el-form-item> 里又嵌套了 <el-form-item>（第 ${innerLine} 行起）——`
        + ` 表单项应当平级；嵌套会让内层控件被塞进外层插槽，渲染错位（vue-tsc 与 build 都不报错）`,
      );
    }

    // 规则 2：同一个 form-item 里既有输入控件又有按钮
    if (INPUT_CONTROL.test(content) && /<el-button\b/.test(content)) {
      problems.push(
        `第 ${line} 行的 <el-form-item> 里同时有输入控件和 <el-button> ——`
        + ` 按钮建议放进单独一个无 label 的 <el-form-item>，否则会继承 label 宽度而错位`,
      );
    }
  }
  return problems;
};

const files = walk(path.join(root, 'src'));
let total = 0;
for (const file of files) {
  const problems = checkFile(file);
  const rel = path.relative(root, file);
  if (problems.length === 0) {
    console.log(`✓ ${rel}`);
  } else {
    total += problems.length;
    console.log(`✗ ${rel}`);
    problems.forEach((p) => console.log(`    ${p}`));
  }
}

console.log('');
if (total) {
  console.error(`❌ 模板结构有问题：${total} 处（vue-tsc 与 vite build 都不会报这类错）`);
  process.exit(1);
}
console.log(`✅ ${files.length} 个 .vue 文件模板结构正常`);

