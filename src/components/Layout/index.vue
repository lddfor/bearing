<template>
  <div class="common-layout">
    <el-container>
      <el-header class="page-header">2轴承数据数据库</el-header>
      <el-container class="page-container">
        <el-aside width="160px" class="page-aside">
          <el-menu
            :default-active="activeMenu"
            class="menu-vertical-style"
            @open="handleOpen"
            @select="handleMenuSelect"
            @close="handleClose"
          >
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
  </div>
</template>
<script setup lang="ts">
  import { Menu as IconMenu, ZoomIn } from '@element-plus/icons-vue';
  import { ref, computed } from 'vue';
  import { useRouter, useRoute } from 'vue-router';

  const router = useRouter();
  const route = useRoute();

  const handleOpen = (key: string, keyPath: string[]) => {
    console.log(key, keyPath);
  };
  const handleClose = (key: string, keyPath: string[]) => {
    console.log(key, keyPath);
  };

  const openVisible = ref(false);
  const pdfURLSrc = ref('');

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
    console.log(key);
    if (key === 'desc') {
      console.log('path', key);
      const files = import.meta.glob('/src/assets/pdf/*.pdf', { eager: true });
      console.log(Object.keys(files));
      pdfURLSrc.value = './' + Object.keys(files)[0];
      openVisible.value = true;
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
      background: linear-gradient(90deg, #061716 1.49%, #9a890c 100%);
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
