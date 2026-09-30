/**
 * 后端接口类型定义（与后端 DTO 一一对应）。
 *
 * 权威来源：backendBreaing/java 里的 BearingRow / BearingMeasurements /
 * RawSampleRow / FilterOption / AuthUser，以及 docs/api.md。
 * 改字段时两边必须同步，否则 TypeScript 会在编译期报错（这正是我们要的）。
 */

/** 统一响应体：code === 0 表示成功 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 某个处理条件下的三个测量值 */
export interface BearingMeasurements {
  /** Rs/Ω */
  rs: number;
  /** Ls/mH */
  ls: number;
  /** Z/Ω */
  z: number;
}

/** 主表格一行。字段名与数据库列名一致，不再使用 rsLsUntreated 这类历史乱命名 */
export interface BearingRowDto {
  id: number;
  bearingType: string;
  bearingModel: string;
  bearingNo: number;
  /** 界面展示用编号，形如 1# */
  numberDisplay: string;
  untreated: BearingMeasurements;
  ion: BearingMeasurements;
  emc: BearingMeasurements;
  changeRate: number;
  lsImageUrl: string;
  rsImageUrl: string;
  zImageUrl: string;
}

/** 原始数据弹层里的一行（含 sampleLabel 为「平均值」的那行） */
export interface RawSampleRowDto {
  id: number;
  sampleLabel: string;
  untreated: BearingMeasurements;
  ion: BearingMeasurements;
  emc: BearingMeasurements;
}

/** 单行详情：汇总行 + 明细 */
export interface BearingDetailDto {
  row: BearingRowDto;
  samples: RawSampleRowDto[];
}

/**
 * 筛选下拉选项。
 * 后端把「类型」和「型号」混在一个数组里返回，前端按值判断归属：
 * 型号（QJS206 / NU1006）含数字且以字母开头，类型（球轴承 / 圆柱滚子轴承）不含数字。
 */
export interface FilterOptionDto {
  value: string;
  label: string;
  count: number;
}

/** 登录成功后返回的用户信息 */
export interface AuthUserDto {
  token: string;
  /** 令牌剩余有效秒数 */
  expiresIn: number;
  username: string;
  displayName: string | null;
}
