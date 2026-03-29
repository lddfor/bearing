<template>
  <div class="common-layout">
    <el-container>
      <el-header class="page-header">轴承检测数据库</el-header>
      <el-container class="page-container">
        <el-aside width="160px" class="page-aside">
          <el-menu :default-active="activeMenu" class="menu-vertical-style" @select="handleMenuSelect">
            <el-menu-item index="bearing">
              <el-icon>
                <icon-menu />
              </el-icon>
              <span>轴承数据</span>
            </el-menu-item>

            <el-menu-item index="desc">
              <el-icon>
                <zoom-in />
              </el-icon>
              <span>试验大纲</span>
            </el-menu-item>
            <el-menu-item index="device">
              <el-icon><TakeawayBox /></el-icon>
              <span>检测设备</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        <el-main class="page-main">
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>

    <el-dialog top="50px" v-model="openVisible" title="试验大纲" width="1200" destroy-on-close center>
      <div>
        <embed style="height: 65vh" :src="pdfURLSrc" type="application/pdf" width="100%" />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="openVisible = false">关闭</el-button>
          <el-button type="primary" @click="openVisible = false">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 检测设备图片对话框 -->
    <el-dialog v-model="deviceDialogVisible" title="检测设备" width="800" destroy-on-close center>
      <div class="device-image-container">
        <img :src="deviceImageUrl" alt="检测设备" style="max-width: 100%; max-height: 70vh; object-fit: contain" />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deviceDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
  import { Menu as IconMenu, ZoomIn, TakeawayBox } from '@element-plus/icons-vue';
  import { ref, computed } from 'vue';
  import { useRouter, useRoute } from 'vue-router';

  const router = useRouter();
  const route = useRoute();

  const openVisible = ref(false);
  const pdfURLSrc = ref('');
  const deviceDialogVisible = ref(false);
  const deviceImageUrl = ref('');

  // 计算当前激活的菜单项
  const activeMenu = computed(() => {
    const path = route.path;
    if (path.includes('/knife-list')) {
      return 'knife-list';
    } else if (path.includes('/bearing')) {
      return 'bearing';
    }
    return '';
  });

  const handleMenuSelect = (key: string) => {
    if (key === 'desc') {
      // 使用 public 目录中的 PDF 文件
      const basePath = import.meta.env.BASE_URL || '/';
      // 对文件名进行 URL 编码，确保空格和特殊字符被正确处理
      const encodedFileName = encodeURIComponent('试验大纲_M50轴承产品电磁耦合强化有效性检测技术.pdf');
      pdfURLSrc.value = `${basePath}pdf/${encodedFileName}`;
      openVisible.value = true;
    } else if (key === 'device') {
      // 使用 public 目录中的设备图片
      const basePath = import.meta.env.BASE_URL || '/';
      deviceImageUrl.value = `${basePath}images/device.jpg`;
      deviceDialogVisible.value = true;
    } else {
      router.push(`/${key}`);
    }
  };
</script>

<style lang="less" scoped>
  .common-layout {
    height: 100vh;

    .page-header {
      line-height: 60px;
      background: linear-gradient(135deg, #409eff 50%, #f5576c 100%);
      color: white;
      font-weight: 700;
      font-size: 25px;
      font-family: 'AliFont', 'Microsoft YaHei', 'SimHei', sans-serif;
    }

    .page-aside {
      .menu-vertical-style {
        height: 100%;
        font-family: 'Microsoft YaHei', 'SimHei', sans-serif; /* 修改字体 */
        font-size: 16px; /* 修改字号 */
        font-weight: 500; /* 修改字重 */
      }

      /* 单独修改菜单项文字样式 */
      .menu-vertical-style .el-menu-item {
        font-family: 'Microsoft YaHei', 'SimHei', sans-serif;
        font-size: 16px;
      }
    }

    .page-main {
      //background: royalblue;
    }

    .page-container {
      height: calc(100vh - 60px);
      //background: #646cff;
    }
  }
</style>
