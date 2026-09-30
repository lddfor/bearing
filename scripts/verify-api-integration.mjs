/**
 * 前端接入验证脚本（Node 运行，直连本机后端）。
 *
 * 它做的事：复刻 src/api/bearing.ts 里的适配逻辑，用真实后端数据核对：
 *   1) 登录能拿到 token（验证 BCrypt 种子哈希 + 令牌链路）；
 *   2) 无 token 访问数据接口确实被拦（401 / code 40100）；
 *   3) DTO 结构与前端类型定义一致（缺字段/改名会立刻暴露）；
 *   4) 适配后表格单元格的值正确 —— 尤其是历史错位问题是否真的修好了。
 *
 * 用法：node scripts/verify-api-integration.mjs
 */

const BASE = process.env.API_BASE ?? 'http://localhost:8080';

/** 与 src/api/bearing.ts 的 toTableRow 保持一致 */
const toTableRow = (dto) => ({
  id: dto.id,
  bearingType: dto.bearingType,
  bearingModel: dto.bearingModel,
  bearingNo: dto.bearingNo,
  number: dto.numberDisplay,
  rsUntreated: dto.untreated.rs,
  lsUntreated: dto.untreated.ls,
  zUntreated: dto.untreated.z,
  rsIon: dto.ion.rs,
  lsIon: dto.ion.ls,
  zIon: dto.ion.z,
  rsEmc: dto.emc.rs,
  lsEmc: dto.emc.ls,
  zEmc: dto.emc.z,
  impedanceChangeRate: dto.changeRate,
  lsImageUrl: dto.lsImageUrl,
  rsImageUrl: dto.rsImageUrl,
  zImageUrl: dto.zImageUrl,
});

/** 与 src/api/bearing.ts 的 toRawSampleRow 保持一致 */
const toRawSampleRow = (dto) => ({
  id: dto.id,
  sampleLabel: dto.sampleLabel,
  rsUntreated: dto.untreated.rs,
  lsUntreated: dto.untreated.ls,
  zUntreated: dto.untreated.z,
  rsIon: dto.ion.rs,
  lsIon: dto.ion.ls,
  zIon: dto.ion.z,
  rsEmc: dto.emc.rs,
  lsEmc: dto.emc.ls,
  zEmc: dto.emc.z,
});

let failures = 0;
const check = (label, actual, expected) => {
  const ok = String(actual) === String(expected);
  if (!ok) failures++;
  console.log(`   ${ok ? '✓' : '✗'} ${label}: ${actual}${ok ? '' : `  (期望 ${expected})`}`);
};
const checkTruthy = (label, value) => {
  const ok = Boolean(value);
  if (!ok) failures++;
  console.log(`   ${ok ? '✓' : '✗'} ${label}: ${value}`);
};

const post = async (path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};

const get = async (path, token) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${BASE}${path}`, { headers });
  return { status: res.status, body: await res.json() };
};

console.log(`后端地址: ${BASE}\n`);

// ---------- 1) 登录 ----------
console.log('1) 登录 POST /api/auth/login');
const login = await post('/api/auth/login', { username: 'BJUT-TS', password: '123456' });
check('HTTP 状态', login.status, 200);
check('业务码 code', login.body.code, 0);
checkTruthy('返回 token', login.body.data?.token ? '有' : '');
check('用户名', login.body.data?.username, 'BJUT-TS');
const token = login.body.data.token;

// ---------- 2) 无 token 必须被拦 ----------
console.log('\n2) 无 token 访问数据接口（应被拦截）');
const noToken = await get('/api/bearings');
check('HTTP 状态', noToken.status, 401);
check('业务码 code', noToken.body.code, 40100);

// ---------- 3) 列表 + DTO 结构 ----------
console.log('\n3) 带 token 拉列表 GET /api/bearings');
const list = await get('/api/bearings', token);
check('HTTP 状态', list.status, 200);
check('行数', list.body.data.length, 32);

const first = list.body.data[0];
const requiredFields = [
  'id', 'bearingType', 'bearingModel', 'bearingNo', 'numberDisplay',
  'untreated', 'ion', 'emc', 'changeRate',
  'lsImageUrl', 'rsImageUrl', 'zImageUrl',
];
const missing = requiredFields.filter((f) => !(f in first));
check('DTO 字段齐全（类型定义与后端一致）', missing.length === 0 ? '齐全' : `缺少 ${missing.join(',')}`, '齐全');
const measurementFields = ['rs', 'ls', 'z'];
const missingM = measurementFields.filter((f) => !(f in first.untreated));
check('untreated 含 rs/ls/z', missingM.length === 0 ? '齐全' : `缺少 ${missingM.join(',')}`, '齐全');

// ---------- 4) 适配后的表格单元格值（关键） ----------
console.log('\n4) 适配器输出与表格列口径（历史错位是否修好）');
const qjs1Dto = list.body.data.find((r) => r.bearingModel === 'QJS206' && r.bearingNo === 1);
checkTruthy('找到 QJS206-1', qjs1Dto ? '是' : '');
const row = toTableRow(qjs1Dto);
console.log('   适配后该行长这样:');
console.log('   ', JSON.stringify(row));

// 这些数字来自甲方原始表格，是判断列错位的唯一依据
check('未处理 Rs（表格第 1 组第 1 列）', row.rsUntreated, 260.791);
check('未处理 Ls（表格第 1 组第 2 列）', row.lsUntreated, -2.08409);
check('未处理 Z （表格第 1 组第 3 列）', row.zUntreated, 2631.89712);
check('离子注入 Rs', row.rsIon, 246.909);
check('离子注入 Ls', row.lsIon, -2.0549);
check('离子注入 Z', row.zIon, 2594.0464);
check('电磁耦合 Rs', row.rsEmc, 247.898);
check('电磁耦合 Ls', row.lsEmc, -2.06319);
check('电磁耦合 Z', row.zEmc, 2604.51097);
check('状态栏编号带 #', row.number, '1#');
checkTruthy('图片地址由后端下发', row.zImageUrl);
check('Z 图路径', row.zImageUrl, '/QJS206Image/QJS206-1-Z对比.png');

// ---------- 5) 编号筛选（前端传数字） ----------
console.log('\n5) 编号筛选 ?bearingNo=1（前端传数字，不再需要 1#）');
const byNo = await get('/api/bearings?bearingNo=1', token);
check('命中行数（两型号各 1 行）', byNo.body.data.length, 2);

// ---------- 6) 原始数据明细 ----------
console.log('\n6) 原始数据 GET /api/bearings/1/raw-data');
const raw = await get('/api/bearings/1/raw-data', token);
check('明细条数', raw.body.data.length, 8);
const samples = raw.body.data.map(toRawSampleRow);
check('首条 sampleLabel', samples[0].sampleLabel, '1');
check('末条 sampleLabel', samples[7].sampleLabel, '平均值');
checkTruthy('明细含 rsUntreated', samples[0].rsUntreated);

// ---------- 7) 下拉选项 ----------
console.log('\n7) 下拉选项 GET /api/bearings/options');
const options = await get('/api/bearings/options', token);
check('选项个数（2 类型 + 2 型号）', options.body.data.length, 4);
const isModel = (v) => /^[A-Za-z]+.*\d/.test(v);
check('型号判定命中数', options.body.data.filter((o) => isModel(o.value)).length, 2);
check('类型判定命中数', options.body.data.filter((o) => !isModel(o.value)).length, 2);

// ---------- 汇总 ----------
console.log('');
if (failures) {
  console.error(`❌ ${failures} 项不一致`);
  process.exit(1);
}
console.log('✅ 前后端接口契约与字段映射全部核对通过');
