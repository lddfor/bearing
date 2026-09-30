import { ApiError, request } from './http';
import { clearAuth, setStoredUser, setToken } from './authStorage';
import type { AuthUserDto } from './types';

/**
 * 登录相关接口。
 *
 * 后端接口（见 backendBreaing/docs/api.md）：
 *   POST /api/auth/login   { username, password } -> { token, expiresIn, username, displayName }
 *   POST /api/auth/logout  使当前 token 失效
 *   GET  /api/auth/me      校验 token 是否仍然有效
 */

export interface LoginParams {
  username: string;
  password: string;
}

/** 登录失败时抛出统一异常；调用方用 error.message 展示即可（后端文案已经是中文） */
export const login = async (params: LoginParams): Promise<AuthUserDto> => {
  const user = await request<AuthUserDto>('/api/auth/login', {
    method: 'POST',
    body: params,
    // 登录接口的 401 属于"密码错"，不该触发"登录已失效"跳转
    skipUnauthorizedRedirect: true,
  });
  // 存 token 与用户信息，后续请求由 http.ts 自动带上
  setToken(user.token);
  setStoredUser({ username: user.username, displayName: user.displayName });
  return user;
};

/** 退出登录：先通知后端吊销，再清本地（后端失败也要清本地，否则会卡在"退不出去"） */
export const logout = async (): Promise<void> => {
  try {
    await request<void>('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    // token 已过期时后端会返回 401，这种情况无需提示，直接继续清本地
  } finally {
    clearAuth();
  }
};

/** 查询当前登录用户（用于刷新页面后确认 token 是否还有效） */
export const fetchCurrentUser = (): Promise<AuthUserDto> =>
  request<AuthUserDto>('/api/auth/me');
