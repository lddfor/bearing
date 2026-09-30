// 验证 node_modules 里 element-plus 的 JS 与 CSS 是否同一版本、是否自洽
import fs from 'node:fs';
import path from 'node:path';

const epDir = 'node_modules/element-plus';
const pkg = JSON.parse(fs.readFileSync(path.join(epDir, 'package.json'), 'utf8'));
console.log('node_modules/element-plus 版本:', pkg.version);
console.log('');

const css = fs.readFileSync(path.join(epDir, 'dist/index.css'), 'utf8');

// 2.4+ 用 .el-select__wrapper 画选择框边框；2.3.x 用 .el-select .el-input__wrapper
const cssHasNewWrapper = css.includes('.el-select__wrapper');
const cssHasOldWrapper = css.includes('.el-select .el-input__wrapper');
console.log('=== CSS 侧的 DOM 结构预期 ===');
console.log('  含 .el-select__wrapper (2.4+ 语义化结构):', cssHasNewWrapper);
console.log('  含 .el-select .el-input__wrapper (2.3.x 结构):', cssHasOldWrapper);
console.log('');

// 检查组件 JS（es 目录）里 el-select 渲染的是哪一套结构
const selectDir = path.join(epDir, 'es/components/select');
const probe = (dir) => {
  if (!fs.existsSync(dir)) return { found: false };
  const walk = (d, out = []) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p, out);
      else if (e.name.endsWith('.mjs') || e.name.endsWith('.js')) out.push(p);
    }
    return out;
  };
  const files = walk(dir);
  const hitsNew = [];
  const hitsOld = [];
  for (const f of files) {
    const c = fs.readFileSync(f, 'utf8');
    if (c.includes('el-select__wrapper')) hitsNew.push(path.relative(epDir, f));
    if (c.includes('el-input__wrapper')) hitsOld.push(path.relative(epDir, f));
  }
  return { found: true, files: files.length, hitsNew, hitsOld };
};
const js = probe(selectDir);
console.log('=== JS 侧实际渲染的结构 ===');
if (!js.found) {
  console.log('  找不到 es/components/select 目录，跳过');
} else {
  console.log(`  扫描 ${js.files} 个文件`);
  console.log('  出现 el-select__wrapper 的文件:', js.hitsNew.length ? js.hitsNew.join(', ') : '（无）');
  console.log('  出现 el-input__wrapper 的文件:', js.hitsOld.length ? js.hitsOld.slice(0, 5).join(', ') : '（无）');
}

console.log('');
console.log('=== 结论 ===');
const consistent = (cssHasNewWrapper && js.hitsNew.length > 0) || (cssHasOldWrapper && js.hitsOld.length > 0);
if (consistent) {
  console.log('  ✅ JS 与 CSS 结构一致，node_modules 里的 element-plus 是自洽的');
  console.log('     => 界面异常只可能来自"浏览器/Vite 缓存了旧版本"，清缓存重启即可');
} else {
  console.log('  ❌ JS 与 CSS 结构不一致，node_modules 本身有问题，需要重装依赖');
}

console.log('');
console.log('=== 另外确认：npm 装的这个版本是否满足 package.json 声明 ===');
const declared = JSON.parse(fs.readFileSync('package.json', 'utf8')).dependencies['element-plus'];
console.log('  package.json 声明:', declared, ' 实际安装:', pkg.version);
