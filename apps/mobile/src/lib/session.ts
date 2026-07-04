import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthResponse, AuthUser, MembershipRole } from './api';

export const MOBILE_SESSION_STORAGE_KEY = 'atar.mobile.session';

export type MobileSession = {
  accessToken: string;
  user: AuthUser;
};

export function authResponseToSession(response: AuthResponse): MobileSession {
  return {
    accessToken: response.accessToken,
    user: response.user,
  };
}

export async function saveMobileSession(session: MobileSession) {
  await AsyncStorage.setItem(MOBILE_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export async function loadMobileSession() {
  const raw = await AsyncStorage.getItem(MOBILE_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as MobileSession;
  } catch {
    await AsyncStorage.removeItem(MOBILE_SESSION_STORAGE_KEY);
    return null;
  }
}

export async function clearMobileSession() {
  await AsyncStorage.removeItem(MOBILE_SESSION_STORAGE_KEY);
}

export function getPrimaryMembershipRole(user: AuthUser): MembershipRole | null {
  return (
    user.memberships.find((membership) => membership.isPrimary)?.role ??
    user.memberships[0]?.role ??
    null
  );
}

export function getPrimaryCompanyName(user: AuthUser) {
  return (
    user.memberships.find((membership) => membership.isPrimary)?.company.name ??
    user.memberships[0]?.company.name ??
    'Mi empresa'
  );
}
