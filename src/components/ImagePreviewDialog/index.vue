<template>
  <!-- 通用图片预览弹层：承载 Ls/Rs/Z 对比图与阻抗有效区间图，避免两处重复模板 -->
  <el-dialog
    v-model="preview.visible.value"
    :title="preview.title.value"
    width="900"
    destroy-on-close
    center
    @close="preview.close"
  >
    <div v-loading="preview.loading.value" class="image-preview-container">
      <div v-if="preview.error.value" class="error-message">
        <el-icon size="48" color="#f56c6c"><CircleClose /></el-icon>
        <p>{{ preview.error.value }}</p>
      </div>
      <div v-else-if="preview.imageUrl.value" class="image-preview">
        <img
          :src="preview.imageUrl.value"
          :alt="preview.title.value"
          style="max-width: 100%; max-height: 70vh; object-fit: contain"
          @load="preview.handleLoad"
          @error="preview.handleError"
        />
      </div>
      <div v-else class="no-image">
        <el-icon size="48" color="#909399"><Picture /></el-icon>
        <p>暂无图片</p>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="preview.close">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
  import { CircleClose, Picture } from '@element-plus/icons-vue';
  import type { useImagePreview } from '../../composables/useImagePreview';

  // 直接复用组合式函数 return 出来的那组状态，父组件无需再转发 props / emit
  defineProps<{ preview: ReturnType<typeof useImagePreview> }>();
</script>

<style lang="less" scoped>
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
</style>
