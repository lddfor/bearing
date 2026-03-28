<template>
  <div class="login-page">
    <div class="login-content">
      <div class="login-title">钛合金加工刀具电磁强化数据库</div>
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
      <el-button class="login-button" type="primary" @click="submitForm(ruleFormRef)">登录</el-button>
    </div>
  </div>
</template>
<script lang="ts" setup>
  import { reactive, ref } from 'vue';
  import type { FormInstance, FormRules } from 'element-plus';
  import { useRouter } from 'vue-router';

  interface RuleForm {
    name: string;
    password: string;
  }

  const router = useRouter();
  const ruleFormRef = ref<FormInstance>();
  const ruleForm = reactive<RuleForm>({
    name: 'Tsinghua-ES',
    password: '',
  });

  const checkAge = (rule: any, value: any, callback: any) => {
    if (value !== '123456') {
      return callback(new Error('请输入正确密码!'));
    } else {
      callback();
    }
  };
  const rules = reactive<FormRules<RuleForm>>({
    name: [{ required: true, message: '请输入账号', trigger: 'blur' }],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { validator: checkAge, trigger: 'blur' },
    ],
  });

  const submitForm = async (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    await formEl.validate((valid, fields) => {
      if (valid) {
        console.log(ruleForm);
        console.log(ruleForm.name);
        console.log('submit!');
        router.push({
          name: 'Bearing',
        });
      } else {
        console.log('error submit!', fields);
      }
    });
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
    background: url('../assets/image/background_image.jpg') no-repeat;
    background-size: cover;

    .login-title {
      height: 36px;
      line-height: 36px;
      font-size: 20px;
      margin-bottom: 30px;
      text-align: center;
    }

    .login-content {
      //height: 400px;
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
