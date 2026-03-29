<template>
  <div class="bearing-table">
    <el-form :inline="true" :model="formInline">
      <el-form-item label="轴承类型">
        <el-select
          v-model="formInline.bearingType"
          filterable
          style="width: 200px"
          placeholder="请输入轴承类型"
          clearable
        >
          <el-option label="球轴承" value="球轴承" />
          <el-option label="圆柱滚子轴承" value="圆柱滚子轴承" />
        </el-select>
        <el-form-item label="轴承型号" style="margin-left: 20px">
          <el-select
            v-model="formInline.bearingModel"
            filterable
            style="width: 200px"
            placeholder="请输入轴承型号"
            clearable
          >
            <el-option label="QJS206" value="QJS206" />
            <el-option label="NJ1006" value="NJ1006" />
          </el-select>
        </el-form-item>
        <el-form-item label="编号" style="margin-left: 20px">
          <el-input v-model="formInline.number" filterable style="width: 200px" placeholder="请输入编号" clearable />
        </el-form-item>
        <el-button type="primary" @click="searchHandle">搜索</el-button>
        <el-button @click="resetHandle">清空</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="tableData" height="calc(100vh - 200px)">
      <el-table-column label="序号" type="index" width="60" />
      <el-table-column prop="bearingType" label="轴承类型" min-width="110" />
      <el-table-column prop="bearingModel" label="轴承型号" min-width="100" />
      <el-table-column prop="number" label="编号" min-width="60" align="center" />
      <el-table-column label="未处理" align="center">
        <el-table-column align="center" prop="rsLsUntreated" label="Rs/Ω" min-width="90" />
        <el-table-column align="center" prop="zLsUntreated" label="Ls/mH" min-width="90" />
        <el-table-column align="center" prop="rsIonImplantation" label="Z/Ω" min-width="100" />
      </el-table-column>
      <el-table-column label="离子注入" align="center">
        <el-table-column align="center" prop="zIonImplantation" label="Rs/Ω" width="80" />
        <el-table-column align="center" prop="zIonImplantation2" label="Ls/mH" width="90" />
        <el-table-column align="center" prop="rsElectromagneticCoupling" label="Z/Ω" width="100" />
      </el-table-column>
      <el-table-column label="电磁耦合强化" align="center">
        <el-table-column align="center" prop="zElectromagneticCoupling" label="Rs/Ω" min-width="90" />
        <el-table-column align="center" prop="zElectromagneticCoupling2" label="Ls/mH" min-width="90" />
        <el-table-column align="center" prop="zElectromagneticCoupling3" label="Z/Ω" min-width="100" />
      </el-table-column>
      <el-table-column align="center" prop="impedanceChangeRate" width="120" label="耦合强化技术处理的阻抗变化率%" />
      <el-table-column fixed="right" label="操作" width="80" align="center" :resizable="false">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="openSidebar(scope.row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 弹出表格对话框 -->
    <el-dialog v-model="dialogVisible" title="原始数据" width="1000" destroy-on-close center>
      <div class="original-data-table">
        <el-table :data="originalDataTable" style="width: 100%">
          <el-table-column prop="id" label="编号" width="80" />
          <el-table-column label="Rs/Ω">
            <el-table-column prop="rsUntreated" label="未处理" width="120" />
            <el-table-column prop="rsIonImplantation" label="离子注入" width="120" />
            <el-table-column prop="rsElectromagneticCoupling" label="电磁耦合强化" width="120" />
          </el-table-column>
          <el-table-column label="Ls/mH">
            <el-table-column prop="lsUntreated" label="未处理" width="120" />
            <el-table-column prop="lsIonImplantation" label="离子注入" width="120" />
            <el-table-column prop="lsElectromagneticCoupling" label="电磁耦合强化" width="120" />
          </el-table-column>
          <el-table-column label="Z/Ω">
            <el-table-column prop="zUntreated" label="未处理" width="150" />
            <el-table-column prop="zIonImplantation" label="离子注入" width="150" />
            <el-table-column prop="zElectromagneticCoupling" label="电磁耦合强化" width="150" />
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

    <!-- 轴承内圈抗阻有效区间图片预览对话框 -->
    <el-dialog
      v-model="impedanceDialogVisible"
      title=""
      width="900"
      destroy-on-close
      center
      @close="closeImpedanceDialog"
    >
      <div v-loading="impedanceLoading" class="image-preview-container">
        <div v-if="impedanceError" class="error-message">
          <el-icon size="48" color="#f56c6c"><CircleClose /></el-icon>
          <p>{{ impedanceError }}</p>
        </div>
        <div v-else-if="impedanceImageUrl" class="image-preview">
          <img
            :src="impedanceImageUrl"
            alt="轴承内圈抗阻有效区间"
            style="max-width: 100%; max-height: 70vh; object-fit: contain"
          />
        </div>
        <div v-else class="no-image">
          <el-icon size="48" color="#909399"><Picture /></el-icon>
          <p>暂无图片</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="impedanceDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 侧边操作弹框 -->
    <el-drawer v-model="sidebarVisible" title="操作选项" direction="rtl" size="300px" destroy-on-close>
      <div class="sidebar-content">
        <div v-if="currentRow" class="row-info">
          <h3>{{ currentRow.bearingModel }} - {{ currentRow.number }}</h3>
          <p>轴承类型：{{ currentRow.bearingType }}</p>
        </div>
        <div class="action-buttons">
          <el-space direction="vertical" style="width: 100%">
            <el-button type="primary" text @click="currentRow && handleButton1(currentRow)" style="width: 100%">
              Ls图
            </el-button>
            <el-button type="primary" text @click="currentRow && handleButton2(currentRow)" style="width: 100%">
              Rs图
            </el-button>
            <el-button type="primary" text @click="currentRow && handleButton3(currentRow)" style="width: 100%">
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

    <!-- TIF 图片预览对话框 -->
    <el-dialog
      v-model="imageDialogVisible"
      :title="imageDialogTitle"
      width="900"
      destroy-on-close
      center
      @close="closeImageDialog"
    >
      <div v-loading="imageLoading" class="image-preview-container">
        <div v-if="imageError" class="error-message">
          <el-icon size="48" color="#f56c6c"><CircleClose /></el-icon>
          <p>{{ imageError }}</p>
        </div>
        <div v-else-if="imageDataUrl" class="image-preview">
          <img
            :src="imageDataUrl"
            :alt="imageDialogTitle"
            style="max-width: 100%; max-height: 70vh; object-fit: contain"
          />
        </div>
        <div v-else class="no-image">
          <el-icon size="48" color="#909399"><Picture /></el-icon>
          <p>请点击按钮查看图片</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeImageDialog">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
  import { reactive, ref, onMounted } from 'vue';
  import { CircleClose, Picture } from '@element-plus/icons-vue';
  import data from '../../data/bearingData.ts';
  import qjs206Data from '../../data/QJS206.json';
  import nu1006Data from '../../data/NU1006.json';

  // 定义轴承数据类型
  interface BearingData {
    id: number;
    bearingType: string;
    bearingModel: string;
    number: string;
    rsLsUntreated: number;
    zLsUntreated: number;
    rsIonImplantation: number;
    zIonImplantation: number;
    rsElectromagneticCoupling: number;
    zElectromagneticCoupling: number;
    impedanceChangeRate: number;
  }

  // 定义表单类型
  interface FormInline {
    bearingType: string;
    bearingModel: string;
    number: string;
  }

  let formInline = reactive<FormInline>({
    bearingType: '',
    bearingModel: '',
    number: '',
  });

  const tableData = ref(data as BearingData[]);

  const searchHandle = () => {
    console.log(formInline);

    let result = data as BearingData[];

    if (formInline.bearingType) {
      result = result.filter((item) => item.bearingType === formInline.bearingType);
    }

    if (formInline.bearingModel) {
      result = result.filter((item) => item.bearingModel === formInline.bearingModel);
    }

    if (formInline.number) {
      result = result.filter((item) => item.number === formInline.number);
    }

    tableData.value = result;
  };

  const resetHandle = () => {
    formInline.bearingType = '';
    formInline.bearingModel = '';
    formInline.number = '';
    tableData.value = data as BearingData[];
  };

  // 弹出表格相关
  const dialogVisible = ref(false);
  const originalDataTable = ref<any>([]);

  // 图片预览相关
  const imageDialogVisible = ref(false);
  const imageDataUrl = ref('');
  const imageDialogTitle = ref('');
  const imageLoading = ref(false);
  const imageError = ref('');

  // 关闭图片对话框时清理资源
  const closeImageDialog = () => {
    imageDialogVisible.value = false;
    setTimeout(() => {
      imageDataUrl.value = '';
      imageError.value = '';
    }, 300);
  };

  // 轴承内圈抗阻有效区间图片预览相关
  const impedanceDialogVisible = ref(false);
  const impedanceImageUrl = ref('');
  const impedanceLoading = ref(false);
  const impedanceError = ref('');

  // 侧边操作弹框相关
  const sidebarVisible = ref(false);
  const currentRow = ref<BearingData | null>(null);

  // 关闭轴承内圈抗阻有效区间图片对话框时清理资源
  const closeImpedanceDialog = () => {
    impedanceDialogVisible.value = false;
    setTimeout(() => {
      impedanceImageUrl.value = '';
      impedanceError.value = '';
    }, 300);
  };

  // 打开侧边操作弹框
  const openSidebar = (row: BearingData) => {
    currentRow.value = row;
    sidebarVisible.value = true;
  };

  // 加载轴承内圈抗阻有效区间图片
  const loadImpedanceImage = async (imagePath: string) => {
    // 重置状态
    impedanceLoading.value = true;
    impedanceError.value = '';
    impedanceImageUrl.value = '';

    try {
      console.log('开始加载图片:', imagePath);

      // 直接设置图片路径作为 src
      impedanceImageUrl.value = imagePath;
      console.log('图片加载成功');
    } catch (error: any) {
      console.error('加载图片失败:', error);
      impedanceError.value = error.message || '图片加载失败，请检查图片文件是否存在或格式是否正确';
    } finally {
      impedanceLoading.value = false;
    }
  };

  // 加载 PNG 图片
  const loadPngImage = async (imagePath: string) => {
    // 重置状态
    imageLoading.value = true;
    imageError.value = '';
    imageDataUrl.value = '';

    try {
      console.log('开始加载图片:', imagePath);

      // 直接设置图片路径作为 src
      imageDataUrl.value = imagePath;
      console.log('图片加载成功');
    } catch (error: any) {
      console.error('加载 PNG 图片失败:', error);
      imageError.value = error.message || '图片加载失败，请检查图片文件是否存在或格式是否正确';
    } finally {
      imageLoading.value = false;
    }
  };

  // 获取图片路径 - 优化版本
  const getImagePath = (row: BearingData, type: string): string => {
    const model = row.bearingModel;
    const number = row.number.replace('#', '');

    let fileName = '';
    switch (type) {
      case 'Ls':
        fileName = `${model}-${number}-Ls对比.png`;
        break;
      case 'Rs':
        fileName = `${model}-${number}-Rs对比.png`;
        break;
      case 'Z':
        fileName = `${model}-${number}-Z对比.png`;
        break;
      default:
        return '';
    }

    // 构建完整路径，使用 QJS206Image 或 NU1006Image 目录
    const imageDir = model === 'QJS206' ? 'QJS206Image' : 'NU1006Image';
    const basePath = import.meta.env.BASE_URL || '/';
    return `${basePath}${imageDir}/${fileName}`;
  };

  // 按钮点击处理函数
  const handleButton1 = async (row: BearingData) => {
    console.log('按钮1点击', row);
    imageDialogTitle.value = `${row.bearingModel}-${row.number}-Ls对比`;
    imageDialogVisible.value = true;
    const imagePath = getImagePath(row, 'Ls');
    console.log('imagePath', imagePath);
    await loadPngImage(imagePath);
  };

  const handleButton2 = async (row: BearingData) => {
    console.log('按钮2点击', row);
    imageDialogTitle.value = `${row.bearingModel}-${row.number}-Rs对比`;
    imageDialogVisible.value = true;
    const imagePath = getImagePath(row, 'Rs');
    await loadPngImage(imagePath);
  };

  const handleButton3 = async (row: BearingData) => {
    console.log('按钮3点击', row);
    imageDialogTitle.value = `${row.bearingModel}-${row.number}-Z对比`;
    imageDialogVisible.value = true;
    const imagePath = getImagePath(row, 'Z');
    await loadPngImage(imagePath);
  };

  // 定义原始数据类型
  interface OriginalDataItem {
    id: number | string;
    rsUntreated: number;
    rsIonImplantation: number;
    rsElectromagneticCoupling: number;
    lsUntreated: number;
    lsIonImplantation: number;
    lsElectromagneticCoupling: number;
    zUntreated: number;
    zIonImplantation: number;
    zElectromagneticCoupling: number;
  }

  // 定义数据源类型
  type DataSource = Record<string, OriginalDataItem[]>;

  // 原始数据按钮点击处理函数
  const handleOriginalData = (row: BearingData) => {
    console.log('原始数据按钮点击', row);

    // 根据当前行的轴承型号选择对应的数据源
    const dataSource = (row.bearingModel === 'QJS206' ? qjs206Data : nu1006Data) as DataSource;

    // 根据当前行的轴承型号和编号获取对应的数据
    const key = `${row.bearingModel}-${row.number.replace('#', '')}`;
    originalDataTable.value = dataSource[key] || [];

    dialogVisible.value = true;
  };

  // 轴承内圈抗阻有效区间按钮点击处理函数
  const handleImpedanceRange = async (row: BearingData) => {
    console.log('轴承内圈抗阻有效区间按钮点击', row);
    impedanceDialogVisible.value = true;

    // 根据轴承型号构建图片路径
    const model = row.bearingModel;
    const imageDir = model === 'QJS206' ? 'QJS206Image' : 'NU1006Image';
    const fileName = model === 'QJS206' ? 'QJS206轴承内外圈阻抗有效区间-30.png' : 'NU1006轴承内外圈阻抗有效区间-30.png';
    const basePath = import.meta.env.BASE_URL || '/';
    const imagePath = `${basePath}${imageDir}/${fileName}`;

    console.log('imagePath', imagePath);
    await loadImpedanceImage(imagePath);
  };

  // 组件挂载
  onMounted(() => {
    console.log('组件已挂载');
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

    .image-preview-container {
      width: 100%;
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .image-preview {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        border-radius: 4px;
      }
    }

    .no-image {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #909399;
      font-size: 16px;
      gap: 16px;
    }

    .error-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #f56c6c;
      font-size: 16px;
      gap: 16px;
      text-align: center;
      padding: 20px;
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
