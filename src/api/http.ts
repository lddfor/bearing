import { ElMessage } from 'element-plus';
import { clearAuth, getToken } from './authStorage';
import type { ApiResponse } from './types';

/**
 * 极简 HTTP 客户端（基于浏览器原生 fetch，不引入 axios）。
 *
 * 为什么不用 axios：
 *   当前开发环境访问不了 npm registry，装不了新依赖；fetch 是浏览器内置能力，
 *   零依赖即可跑通。项目以后要加请求重试、取消、上传进度时再换 axios 也不迟
 *   （package.json 里已保留 axios 声明，装好即可平替，接口层不用改）。
 *
 * 统一处理的四件事：
 *   1) 自动带上 Authorization: Bearer <token>；
 *   2) 自动拆统一响应体 { code, message, data }，业务层只拿 data；
 *   3) code !== 0 时抛 ApiError（带业务码与后端文案）；
 *   4) 401 时清空登录态并跳回登录页（避免每个调用点各写一遍）。
 */

/** 后端错误码（与 backendBreaing 的 ErrorCode 对应） */
export const ERROR_CODE = {
  OK: 0,
  BAD_REQUEST: 40000,
  UNAUTHORIZED: 40100,
  LOGIN_FAILED: 40101,
  USER_DISABLED: 40102,
  NOT_FOUND: 40400,
  INTERNAL_ERROR: 50000,
} as const;

/** 业务异常：调用方可按 code 分支处理，也可直接展示 message */
export class ApiError extends Error {
  readonly code: number;
  readonly status: number;

  constructor(code: number, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }

  /** 是否属于"未登录/登录失效" */
  get isUnauthorized(): boolean {
    return this.code === ERROR_CODE.UNAUTHORIZED
      || this.code === ERROR_CODE.LOGIN_FAILED
      || this.code === ERROR_CODE.USER_DISABLED
      || this.status === 401;
  }
}

/**
 * 接口根路径。
 * 开发期为空串，请求走 Vite 代理（/api -> http://localhost:8080），因此不涉及跨域；
 * 生产期后端与前端同源，同样用相对路径即可。
 * 只有前后端分离部署到不同域名时，才需要设置 VITE_API_BASE_URL。
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/** 记录当前是否已经在跳登录页，避免并发请求触发多次跳转/多次提示 */
let redirecting = false;

/**
 * 401 处理：清登录态 + 回登录页。
 * 用动态 import 拿 router，避免与 router 模块形成循环依赖（router 里又 import 了本模块的存储函数）。
 */
const handleUnauthorized = async (): Promise<void> => {
  clearAuth();
  if (redirecting) {
    return;
  }
  redirecting = true;
  ElMessage.warning('登录已失效，请重新登录');
  try {
    const { default: router } = await import('../router/index');
    if (router.currentRoute.value.name !== 'Login') {
      await router.push({ name: 'Login' });
    }
  } finally {
    // 给跳转留一点时间窗，避免同一批并发请求重复提示
    window.setTimeout(() => {
      redirecting = false;
    }, 500);
  }
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** 查询参数，值为 undefined / null / '' 的键会被忽略 */
  params?: Record<string, string | number | undefined | null>;
  /** 请求体，会自动 JSON 序列化 */
  body?: unknown;
  /** 是否跳过 401 自动跳转（登录接口本身需要自己处理失败） */
  skipUnauthorizedRedirect?: boolean;
}

/**
 * 发起请求并返回业务数据。
 *
 * @throws ApiError 业务失败（code !== 0）或 HTTP 层失败
 */
export const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { method = 'GET', params, body, skipUnauthorizedRedirect = false } = options;

  // 拼查询参数：空值不参与，避免出现 ?bearingModel=&bearingNo= 这种噪音
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });
  }
  const queryString = query.toString();
  const url = `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch 只在网络层失败时 reject（后端没起来、被代理拦截等）
    throw new ApiError(ERROR_CODE.INTERNAL_ERROR, '无法连接后端服务，请确认后端已启动（默认 8080）', 0);
  }

  // 解析统一响应体；后端异常路径也返回同样的结构，所以这里能拿到 message
  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const code = payload?.code ?? ERROR_CODE.INTERNAL_ERROR;
    const message = payload?.message ?? `请求失败（HTTP ${response.status}）`;
    const error = new ApiError(code, message, response.status);
    if (error.isUnauthorized && !skipUnauthorizedRedirect) {
      await handleUnauthorized();
    }
    throw error;
  }

  if (!payload) {
    throw new ApiError(ERROR_CODE.INTERNAL_ERROR, '后端返回的不是合法 JSON', response.status);
  }
  if (payload.code !== ERROR_CODE.OK) {
    const error = new ApiError(payload.code, payload.message, response.status);
    if (error.isUnauthorized && !skipUnauthorizedRedirect) {
      await handleUnauthorized();
    }
    throw error;
  }
  return payload.data;
};
