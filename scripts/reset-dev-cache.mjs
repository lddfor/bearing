/**
 * 清理 Vite 依赖预打包缓存，并检查 node_modules 里是否残留 pnpm 的包体。
 *
 * 背景：这个项目同时存在 pnpm-lock.yaml 与 package-lock.json，node_modules 曾被 pnpm 装过，
 * 之后又用 npm 装了一次，于是：
 *   - node_modules/.pnpm/                     残留 pnpm 的 element-plus 2.13.6
 *   - node_modules/element-plus               被 npm 装成 2.3.14
 *   - node_modules/.vite/deps                 缓存里记的还是 .pnpm/...2.13.6
 * 三者版本错配时，组件 JS 与 CSS 对不上，界面会出现"控件渲染不全"这类怪现象。
 *
 * 本脚本只做清理与报告，不改 package.json、不装包。
 * 用法：node scripts/reset-dev-cache.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const viteDir = path.join(root, 'node_modules', '.vite');
const pnpmDir = path.join(root, 'node_modules', '.pnpm');

console.log('=== 1) 删除 Vite 预打包缓存 ===');
if (fs.existsSync(viteDir)) {
  fs.rmSync(viteDir, { recursive: true, force: true });
  console.log('  已删除 node_modules/.vite（dev server 下次启动会自动重建）');
} else {
  console.log('  node_modules/.vite 不存在，无需清理');
}

console.log('');
console.log('=== 2) 报告包体来源 ===');
const readVersion = (rel) => {
  const p = path.join(root, 'node_modules', rel, 'package.json');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8')).version;
};

const check = (name) => {
  const top = readVersion(name);
  console.log(`  node_modules/${name}: ${top ?? '未安装'}`);
  return top;
};

const ep = check('element-plus');
check('vue');
check('@element-plus/icons-vue');

console.log('');
console.log('=== 3) 是否存在 pnpm 残留（.pnpm 目录）===');
if (fs.existsSync(pnpmDir)) {
  const entries = fs.readdirSync(pnpmDir).filter((n) => n.startsWith('element-plus@'));
  console.log('  node_modules/.pnpm 存在；其中 element-plus 的包体:');
  entries.forEach((e) => {
    const v = e.match(/element-plus@([\d.]+)/);
    const flag = v && v[1] !== ep ? '  <-- 与 node_modules 根下的版本不一致，可能造成版本错配' : '';
    console.log(`    ${e}${flag}`);
  });
  console.log('');
  console.log('  建议（二选一，别同时保留两套锁文件）：');
  console.log('    A. 只用 npm ：删除 pnpm-lock.yaml，然后 rmdir /s /q node_modules 再 npm install');
  console.log('    B. 只用 pnpm：删除 package-lock.json，然后 rmdir /s /q node_modules 再 pnpm install');
} else {
  console.log('  无 .pnpm 残留，node_modules 来源单一');
}

console.log('');
console.log('=== 4) 两个锁文件是否同时存在 ===');
const hasNpm = fs.existsSync(path.join(root, 'package-lock.json'));
const hasPnpm = fs.existsSync(path.join(root, 'pnpm-lock.yaml'));
console.log(`  package-lock.json: ${hasNpm}`);
console.log(`  pnpm-lock.yaml   : ${hasPnpm}`);
if (hasNpm && hasPnpm) {
  console.log('  ⚠️ 两个锁文件并存，是这次版本错配的根源，建议只留一个');
}
