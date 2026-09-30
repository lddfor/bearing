/**
 * 登录令牌的本地存储。
 *
 * 为什么用 sessionStorage 而不是 localStorage：
 *   后端目前把 token 存在内存里，重启即失效；用 sessionStorage 能让"关掉标签页就登出"
 *   与后端行为一致，也少一个"长期驻留的凭证"风险。
 * 以后换成 JWT + refresh token 时，再考虑 localStorage + 过期时间管理。
 */

const TOKEN_KEY = 'bearing_token';
const USER_KEY = 'bearing_user';

export interface StoredUser {
  username: string;
  displayName: string | null;
}

export const getToken = (): string | null => sessionStorage.getItem(TOKEN_KEY);

export const setToken = (token: string): void => {
  sessionStorage.setItem(TOKEN_KEY, token);
};

export const getStoredUser = (): StoredUser | null => {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    // 存储被改坏时按"未登录"处理，避免整个应用崩在启动阶段
    return null;
  }
};

export const setStoredUser = (user: StoredUser): void => {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
};

/** 清空登录态（退出登录或 token 失效时调用） */
export const clearAuth = (): void => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
};

export const isLoggedIn = (): boolean => Boolean(getToken());
