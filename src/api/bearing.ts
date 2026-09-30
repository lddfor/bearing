import { request } from './http';
import type { BearingDetailDto, BearingRowDto, FilterOptionDto, RawSampleRowDto } from './types';

/**
 * 轴承数据接口 + 后端字段到界面字段的适配。
 *
 * 适配的意义：后端按"单位语义"组织数据（untreated/ion/emc 各含 rs/ls/z），
 * 而表格是按列渲染的，这里统一摊平成 rsUntreated / lsIon 这类扁平字段，
 * 好处是：
 *   1) 组件模板里的 prop 名字一眼能看出"哪个条件 + 哪个单位"；
 *   2) 映射集中在这一个文件里，历史错位问题只可能出现在这里，便于审查。
 */

/** 界面用的扁平字段：{条件}{单位}，条件取 Untreated / Ion / Emc */
export interface BearingTableRow {
  id: number;
  bearingType: string;
  bearingModel: string;
  /** 原始编号数字，用于筛选与图片文件名 */
  bearingNo: number;
  /** 带 # 的展示编号，如 1# */
  number: string;

  rsUntreated: number;
  lsUntreated: number;
  zUntreated: number;
  rsIon: number;
  lsIon: number;
  zIon: number;
  rsEmc: number;
  lsEmc: number;
  zEmc: number;

  /** 阻抗变化率（%），后端已有值，前端不重算 */
  impedanceChangeRate: number;

  /** 图片地址由后端下发，前端不再自己拼文件名 */
  lsImageUrl: string;
  rsImageUrl: string;
  zImageUrl: string;
}

/** 原始数据弹层里的一行 */
export interface RawSampleRow {
  id: number;
  /** 样本序号 1-7 或「平均值」 */
  sampleLabel: string;
  rsUntreated: number;
  lsUntreated: number;
  zUntreated: number;
  rsIon: number;
  lsIon: number;
  zIon: number;
  rsEmc: number;
  lsEmc: number;
  zEmc: number;
}

/** 下拉选项：类型与型号分开，避免前端写死 */
export interface BearingOptions {
  types: FilterOptionDto[];
  models: FilterOptionDto[];
}

/** 列表查询条件 */
export interface BearingQuery {
  bearingType?: string;
  bearingModel?: string;
  /** 编号用数字，传 1 即可命中（旧实现必须输 1#） */
  bearingNo?: number;
}

const toTableRow = (dto: BearingRowDto): BearingTableRow => ({
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

const toRawSampleRow = (dto: RawSampleRowDto): RawSampleRow => ({
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

/**
 * 型号判定：以字母开头且含数字（QJS206 / NU1006）。
 * 后端把类型与型号放在同一个数组里返回，这里按规则拆开；
 * 以后后端加上 dimension 字段就能直接区分，不必猜。
 */
const isBearingModel = (value: string): boolean => /^[A-Za-z]+.*\d/.test(value);

/** 查询轴承列表（无筛选时返回全部 32 行） */
export const fetchBearings = async (query: BearingQuery = {}): Promise<BearingTableRow[]> => {
  const rows = await request<BearingRowDto[]>('/api/bearings', { params: { ...query } });
  return rows.map(toTableRow);
};

/** 查询单行详情（汇总 + 明细） */
export const fetchBearingDetail = async (id: number): Promise<{ row: BearingTableRow; samples: RawSampleRow[] }> => {
  const detail = await request<BearingDetailDto>(`/api/bearings/${id}`);
  return { row: toTableRow(detail.row), samples: detail.samples.map(toRawSampleRow) };
};

/** 查询原始逐样本明细（每只轴承 8 条，最后一条是「平均值」） */
export const fetchRawSamples = async (id: number): Promise<RawSampleRow[]> => {
  const samples = await request<RawSampleRowDto[]>(`/api/bearings/${id}/raw-data`);
  return samples.map(toRawSampleRow);
};

/** 查询筛选下拉选项，并把类型 / 型号拆开 */
export const fetchOptions = async (): Promise<BearingOptions> => {
  const options = await request<FilterOptionDto[]>('/api/bearings/options');
  return {
    types: options.filter((o) => !isBearingModel(o.value)),
    models: options.filter((o) => isBearingModel(o.value)),
  };
};
