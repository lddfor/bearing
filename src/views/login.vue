<template>
  <div class="login-page" :style="{ backgroundImage: `url(${backgroundImageUrl})` }">
    <div class="login-content">
      <div class="login-title">轴承检测数据库</div>
      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="rules"
        label-width="60px"
        class="demo-ruleForm"
        size="default"
        status-icon
      >
        <el-form-item label="账号" prop="name">
          <el-input v-model="ruleForm.name" />
        </el-form-item>
        <el-form-item class="password-item" label="密码" prop="password">
          <el-input type="password" v-model="ruleForm.password" />
        </el-form-item>
      </el-form>
      <el-button
        class="login-button"
        type="primary"
        :loading="submitting"
        @click="submitForm(ruleFormRef)"
      >
        登录
      </el-button>
    </div>
  </div>
</template>
<script lang="ts" setup>
  import { reactive, ref } from 'vue';
  import { ElMessage } from 'element-plus';
  import type { FormInstance, FormRules } from 'element-plus';
  import { useRouter } from 'vue-router';
  import { login } from '../api/auth';
  import { ApiError } from '../api/http';

  interface RuleForm {
    name: string;
    password: string;
  }

  const router = useRouter();
  const ruleFormRef = ref<FormInstance>();

  /**
   * 背景图地址。
   * 图片在 public/ 下，必须拼 import.meta.env.BASE_URL：
   * 部署子路径是 /bearing/，写死 '/background_image.jpg' 会 404
   * （本地 dev 正常、线上挂掉，属于很难发现的那类问题）。
   */
  const backgroundImageUrl = `${import.meta.env.BASE_URL}background_image.jpg`;

  /** 提交中：防止连点造成重复登录请求 */
  const submitting = ref(false);

  const ruleForm = reactive<RuleForm>({
    // 账号预填只是方便本机演示；密码不再预填，校验一律交给后端
    name: 'BJUT-TS',
    password: '',
  });

  /**
   * 表单校验只做"非空"这类体验层检查。
   * 口令是否正确必须由后端判定（原来在前端硬编码 '123456' 比对，
   * 既没有安全性，也无法支持多账号，已删除）。
   */
  const rules = reactive<FormRules<RuleForm>>({
    name: [{ required: true, message: '请输入账号', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  });

  const submitForm = async (formEl: FormInstance | undefined): Promise<void> => {
    if (!formEl) {
      return;
    }
    // validate 抛错即校验不通过，这里不需要再读 fields
    const valid = await formEl.validate().catch(() => false);
    if (!valid) {
      return;
    }

    submitting.value = true;
    try {
      await login({ username: ruleForm.name, password: ruleForm.password });
      ElMessage.success('登录成功');
      await router.push({ name: 'Bearing' });
    } catch (error) {
      // 后端返回的 message 已经是中文（如"账号或密码错误"），直接用
      ElMessage.error(error instanceof ApiError ? error.message : '登录失败，请稍后重试');
    } finally {
      submitting.value = false;
    }
  };
</script>
<style scoped lang="less">
  .login-page {
    height: 100vh;
    width: 100%;
    overflow-y: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    background-size: cover;

    .login-title {
      height: 36px;
      line-height: 36px;
      font-size: 20px;
      margin-bottom: 30px;
      text-align: center;
    }

    .login-content {
      width: 430px;
      background: white;
      border-radius: 10px;
      box-sizing: border-box;
      padding: 50px;

      .password-item {
        margin-top: 20px;
      }

      .login-button {
        width: 100%;
        margin-top: 20px;
      }
    }
  }
</style>
