<template>
  <div class="bearing-table">
    <el-form :inline="true" :model="formInline">
      <!--
        三个筛选项必须是平级的 el-form-item。
        改造前它们是嵌套的：<el-form-item label="轴承类型"> 里面又放了
        "轴承型号"、"编号" 以及搜索/清空按钮，导致 </el-form-item> 提前闭合，
        浏览器重新配对标签后整个搜索区布局错乱。
      -->
      <el-form-item label="轴承类型">
        <el-select
          v-model="formInline.bearingType"
          filterable
          style="width: 200px"
          placeholder="请输入轴承类型"
          clearable
        >
          <el-option
            v-for="option in typeOptions"
            :key="option.value"
            :label="`${option.label}（${option.count}）`"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="轴承型号">
        <el-select
          v-model="formInline.bearingModel"
          filterable
          style="width: 200px"
          placeholder="请输入轴承型号"
          clearable
        >
          <el-option
            v-for="option in modelOptions"
            :key="option.value"
            :label="`${option.label}（${option.count}）`"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="编号">
        <el-input
          v-model="formInline.number"
          style="width: 200px"
          placeholder="请输入编号（如 1）"
          clearable
        />
      </el-form-item>

      <!-- 按钮放在 form-item 外层，避免继承 label 宽度造成对齐偏移 -->
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="searchHandle">搜索</el-button>
        <el-button @click="resetHandle">清空</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="tableData" height="calc(100vh - 150px)">
      <el-table-column label="序号" type="index" width="60" />
      <el-table-column prop="bearingType" label="轴承类型" min-width="110" align="center" />
      <el-table-column prop="bearingModel" label="轴承型号" min-width="100" align="center" />
      <el-table-column prop="number" label="编号" min-width="60" align="center" />
      <!--
        列口径说明（重要）：
        字段一律按「条件 + 单位」命名，prop 与后端数据库列一一对应：
          rs* = Rs/Ω，ls* = Ls/mH，z* = Z/Ω；未处理 / Ion（离子注入）/ Emc（电磁耦合强化）。
        改造前后端把历史乱命名字段（rsLsUntreated、zIonImplantation…）直接透传，
        导致「未处理」列显示的实际是离子注入的值（整体错位一格）。现在按语义重排，
        因此界面上的数字与改造前不同 —— 这是修正，不是数据变了。
      -->
      <el-table-column label="未处理" align="center">
        <el-table-column align="center" prop="rsUntreated" label="Rs/Ω" min-width="90" />
        <el-table-column align="center" prop="lsUntreated" label="Ls/mH" min-width="100" />
        <el-table-column align="center" prop="zUntreated" label="Z/Ω" min-width="110" />
      </el-table-column>
      <el-table-column label="离子注入" align="center">
        <el-table-column align="center" prop="rsIon" label="Rs/Ω" min-width="90" />
        <el-table-column align="center" prop="lsIon" label="Ls/mH" min-width="100" />
        <el-table-column align="center" prop="zIon" label="Z/Ω" min-width="110" />
      </el-table-column>
      <el-table-column label="电磁耦合强化" align="center">
        <el-table-column align="center" prop="rsEmc" label="Rs/Ω" min-width="90" />
        <el-table-column align="center" prop="lsEmc" label="Ls/mH" min-width="100" />
        <el-table-column align="center" prop="zEmc" label="Z/Ω" min-width="110" />
      </el-table-column>
      <!--
        这一列表头原本是"电磁耦合强化处理相较于未处理的阻抗变化率%"（21 字），
        但列宽只有 120px，而 element-plus 的 .el-table .cell 带 word-break:break-all，
        结果表头被压成一个字一行、把整张表撑歪。
        改为短表头 + tooltip 说明完整口径（口径本身还待甲方确认，见 CONVENTIONS.md 第 5 节）。
      -->
      <el-table-column align="center" prop="impedanceChangeRate" min-width="150">
        <template #header>
          <span class="header-with-tip">
            阻抗变化率%
            <el-tooltip
              effect="dark"
              placement="top"
              content="电磁耦合强化处理相较于未处理的阻抗变化率（当前数值口径待甲方确认：现有值吻合 vs 离子注入）"
            >
              <el-icon class="tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </span>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="80" align="center" :resizable="false">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="openSidebar(scope.row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 原始数据弹层：数据来自 GET /api/bearings/{id}/raw-data -->
    <el-dialog v-model="dialogVisible" title="原始数据" width="1000" destroy-on-close center>
      <div class="original-data-table" v-loading="rawDataLoading">
        <el-table :data="originalDataTable" style="width: 100%">
          <el-table-column prop="sampleLabel" label="编号" width="80" />
          <el-table-column label="Rs/Ω">
            <el-table-column prop="rsUntreated" label="未处理" width="120" />
            <el-table-column prop="rsIon" label="离子注入" width="120" />
            <el-table-column prop="rsEmc" label="电磁耦合强化" width="120" />
          </el-table-column>
          <el-table-column label="Ls/mH">
            <el-table-column prop="lsUntreated" label="未处理" width="120" />
            <el-table-column prop="lsIon" label="离子注入" width="120" />
            <el-table-column prop="lsEmc" label="电磁耦合强化" width="120" />
          </el-table-column>
          <el-table-column label="Z/Ω">
            <el-table-column prop="zUntreated" label="未处理" width="150" />
            <el-table-column prop="zIon" label="离子注入" width="150" />
            <el-table-column prop="zEmc" label="电磁耦合强化" width="150" />
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="dialogVisible = false">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 侧边操作弹框：行内「详情」按钮打开，承载各类图 / 原始数据入口 -->
    <el-drawer v-model="sidebarVisible" title="操作选项" direction="rtl" size="300px" destroy-on-close>
      <div class="sidebar-content">
        <div v-if="currentRow" class="row-info">
          <h3>{{ currentRow.bearingModel }} - {{ currentRow.number }}</h3>
          <p>轴承类型：{{ currentRow.bearingType }}</p>
        </div>
        <div class="action-buttons">
          <el-space direction="vertical" style="width: 100%">
            <el-button type="primary" text @click="currentRow && handleChartImage(currentRow, 'Ls')" style="width: 100%">
              Ls图
            </el-button>
            <el-button type="primary" text @click="currentRow && handleChartImage(currentRow, 'Rs')" style="width: 100%">
              Rs图
            </el-button>
            <el-button type="primary" text @click="currentRow && handleChartImage(currentRow, 'Z')" style="width: 100%">
              Z图
            </el-button>
            <el-button type="primary" text @click="currentRow && handleOriginalData(currentRow)" style="width: 100%">
              原始数据
            </el-button>
            <el-button type="primary" text @click="currentRow && handleImpedanceRange(currentRow)" style="width: 100%">
              {{ currentRow?.bearingModel }}强化后阻抗有效区间
            </el-button>
          </el-space>
        </div>
      </div>
    </el-drawer>

    <!-- 通用图片预览弹层：Ls/Rs/Z 对比图与阻抗有效区间图共用 -->
    <image-preview-dialog :preview="imagePreview" />
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, reactive, ref } from 'vue';
  import { ElMessage } from 'element-plus';
  import { QuestionFilled } from '@element-plus/icons-vue';
  import ImagePreviewDialog from '../ImagePreviewDialog/index.vue';
  import { useImagePreview } from '../../composables/useImagePreview';
  import {
    fetchBearings,
    fetchOptions,
    fetchRawSamples,
    type BearingTableRow,
    type RawSampleRow,
  } from '../../api/bearing';
  import { ApiError } from '../../api/http';
  import type { FilterOptionDto } from '../../api/types';

  /** 筛选表单：编号按数字传，后端用整数精确匹配（不再需要输 1#） */
  interface FormInline {
    bearingType: string;
    bearingModel: string;
    number: string;
  }

  /** 曲线类型 -> 从行数据里取哪个图片地址 */
  const CHART_URL_FIELD: Record<string, keyof BearingTableRow> = {
    Ls: 'lsImageUrl',
    Rs: 'rsImageUrl',
    Z: 'zImageUrl',
  };

  const formInline = reactive<FormInline>({
    bearingType: '',
    bearingModel: '',
    number: '',
  });

  const tableData = ref<BearingTableRow[]>([]);
  const loading = ref(false);
  const typeOptions = ref<FilterOptionDto[]>([]);
  const modelOptions = ref<FilterOptionDto[]>([]);

  // 原始数据弹层
  const dialogVisible = ref(false);
  const originalDataTable = ref<RawSampleRow[]>([]);
  const rawDataLoading = ref(false);

  // 侧边操作弹框
  const sidebarVisible = ref(false);
  const currentRow = ref<BearingTableRow | null>(null);

  // 图片预览弹层（Ls/Rs/Z 对比图 + 阻抗有效区间图共用同一套状态）
  const imagePreview = useImagePreview();

  /** 统一处理接口报错，避免每个调用点各写一遍提示 */
  const showError = (error: unknown, fallback: string): void => {
    ElMessage.error(error instanceof ApiError ? error.message : fallback);
  };

  /** 拉列表：筛选条件全部交给后端（前端不再做本地 filter，避免两处逻辑不一致） */
  const loadTable = async (): Promise<void> => {
    loading.value = true;
    try {
      // 编号为空或非数字时不传该条件，避免把 NaN 发给后端
      const bearingNo = formInline.number.trim() === '' ? undefined : Number(formInline.number);
      tableData.value = await fetchBearings({
        bearingType: formInline.bearingType || undefined,
        bearingModel: formInline.bearingModel || undefined,
        bearingNo: Number.isNaN(bearingNo) ? undefined : bearingNo,
      });
    } catch (error) {
      showError(error, '加载轴承列表失败');
    } finally {
      loading.value = false;
    }
  };

  /** 下拉选项由后端从库里 distinct 出来，不再前端写死 */
  const loadOptions = async (): Promise<void> => {
    try {
      const options = await fetchOptions();
      typeOptions.value = options.types;
      modelOptions.value = options.models;
    } catch (error) {
      showError(error, '加载筛选项失败');
    }
  };

  const searchHandle = (): void => {
    void loadTable();
  };

  const resetHandle = (): void => {
    formInline.bearingType = '';
    formInline.bearingModel = '';
    formInline.number = '';
    void loadTable();
  };

  // 打开侧边操作弹框
  const openSidebar = (row: BearingTableRow): void => {
    currentRow.value = row;
    sidebarVisible.value = true;
  };

  /** Ls/Rs/Z 图：图片地址由后端下发，前端只按类型取字段 */
  const handleChartImage = (row: BearingTableRow, type: string): void => {
    const field = CHART_URL_FIELD[type];
    if (!field) {
      return;
    }
    const url = row[field] as string;
    imagePreview.preview(`${row.bearingModel}-${row.number}-${type}对比`, url);
  };

  /**
   * 阻抗有效区间图。
   * 注意：当前后端按型号固定一张（-16 版），并未按编号区分 —— 这是已知待确认口径，
   * 详见 CONVENTIONS.md 第 5 节；改动前需与甲方确认取图规则。
   */
  const handleImpedanceRange = (row: BearingTableRow): void => {
    const url = `/${row.bearingModel}Image/${row.bearingModel}轴承内外圈阻抗有效区间-16.png`;
    imagePreview.preview(`${row.bearingModel}强化后阻抗有效区间`, url);
  };

  /** 原始数据：按行 id 调接口拉明细（每只轴承 8 条，含「平均值」） */
  const handleOriginalData = async (row: BearingTableRow): Promise<void> => {
    dialogVisible.value = true;
    rawDataLoading.value = true;
    originalDataTable.value = [];
    try {
      originalDataTable.value = await fetchRawSamples(row.id);
    } catch (error) {
      showError(error, '加载原始数据失败');
    } finally {
      rawDataLoading.value = false;
    }
  };

  onMounted(() => {
    void loadOptions();
    void loadTable();
  });
</script>

<style lang="less" scoped>
  .bearing-table {
    height: 100%;
    width: 100%;
    overflow-x: auto;

    .el-button--primary.is-link {
      color: #337ecc;
    }

    :deep(.el-table) {
      width: 100% !important;
    }

    :deep(.el-table th.el-table__cell) {
      // 表头强制不换行：element-plus 的 .cell 默认 white-space: normal + word-break: break-all，
      // 中文表头在窄列里会被排成"一个字一行"，把整张表撑得极高
      white-space: nowrap;
      color: #606266;
    }

    .header-with-tip {
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }

    .tip-icon {
      color: #909399;
      cursor: help;
    }
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .action-buttons .el-button {
    width: 100%;
  }
</style>
