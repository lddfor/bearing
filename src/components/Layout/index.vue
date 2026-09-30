<template>
  <div class="common-layout">
    <el-container>
      <el-header class="page-header">
        <span class="header-title">轴承检测数据库</span>
        <!-- 退出登录：调后端吊销 token，再清本地并回登录页 -->
        <span class="header-user">
          <span class="user-name">{{ currentUserName }}</span>
          <el-button link type="primary" class="logout-button" @click="handleLogout">退出登录</el-button>
        </span>
      </el-header>
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
  import { ElMessage } from 'element-plus';
  import { useRouter, useRoute } from 'vue-router';
  import { getStoredUser } from '../../api/authStorage';
  import { logout } from '../../api/auth';

  const router = useRouter();
  const route = useRoute();

  const openVisible = ref(false);
  const pdfURLSrc = ref('');
  const deviceDialogVisible = ref(false);
  const deviceImageUrl = ref('');

  // 顶栏显示当前登录人（登录时由 api/auth.ts 写入 sessionStorage）
  const currentUserName = computed(() => getStoredUser()?.displayName || getStoredUser()?.username || '');

  // 计算当前激活的菜单项：菜单只有 bearing 一项会被路由激活，
  // desc / device 走弹窗（见 handleMenuSelect），不参与高亮。
  const activeMenu = computed(() => (route.path.includes('/bearing') ? 'bearing' : ''));

  /** 退出登录：后端失败也要清本地，否则会卡在"退不出去" */
  const handleLogout = async (): Promise<void> => {
    await logout();
    ElMessage.success('已退出登录');
    await router.push({ name: 'Login' });
  };

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
      /* 左侧标题 + 右侧用户/退出，用 flex 分开，避免退出按钮跟着标题居中 */
      display: flex;
      align-items: center;
      justify-content: space-between;

      .header-title {
        font-size: 25px;
      }

      .header-user {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        font-weight: 400;
      }

      .logout-button {
        color: #fff;
        font-size: 14px;

        &:hover {
          color: #ffe9ec;
        }
      }
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
