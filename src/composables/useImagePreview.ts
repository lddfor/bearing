import { ref } from 'vue';

/**
 * 图片预览弹层的通用状态管理。
 *
 * 为什么抽出来：表格页原来为「Ls/Rs/Z 对比图」和「阻抗有效区间图」各写了一套
 * 完全相同的状态 + 加载函数 + 弹层模板（共 2 份，约 60 行重复）。
 * 现在状态统一放这里，弹层统一用 components/ImagePreviewDialog/index.vue。
 */
export const useImagePreview = () => {
  /** 弹层是否可见 */
  const visible = ref(false);
  /** 弹层标题 */
  const title = ref('');
  /** 图片地址：静态资源直连，需由调用方拼好 import.meta.env.BASE_URL */
  const imageUrl = ref('');
  /** 加载中（图片本身的加载态，由 <img> 事件驱动） */
  const loading = ref(false);
  /** 加载失败文案，非空时弹层展示错误态而不是破图 */
  const error = ref('');

  /**
   * 打开预览并开始加载图片。
   * 这里只负责把 URL 交给 <img>，真正的成功/失败由 ImagePreviewDialog 的
   * load/error 事件回写，避免出现「永远无法触发的错误分支」。
   */
  const preview = (nextTitle: string, url: string): void => {
    title.value = nextTitle;
    imageUrl.value = url;
    error.value = '';
    loading.value = true;
    visible.value = true;
  };

  /** 关闭弹层，稍后再清空地址，避免关闭动画期间图片白闪 */
  const close = (): void => {
    visible.value = false;
    window.setTimeout(() => {
      imageUrl.value = '';
      error.value = '';
      loading.value = false;
    }, 300);
  };

  /** 图片加载成功 */
  const handleLoad = (): void => {
    loading.value = false;
    error.value = '';
  };

  /** 图片加载失败：给出可读提示，而不是让用户看到破图 */
  const handleError = (): void => {
    loading.value = false;
    error.value = '图片加载失败，请检查图片文件是否存在或格式是否正确';
  };

  return { visible, title, imageUrl, loading, error, preview, close, handleLoad, handleError };
};
