import { User } from '../types';

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('isAuthenticated');
};

export const setAuthenticated = (value: boolean): void => {
  if (value) {
    localStorage.setItem('isAuthenticated', 'true');
  } else {
    localStorage.removeItem('isAuthenticated');
  }
};

export const storeUser = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = (): User | null => {
  const userJson = localStorage.getItem('user');
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson) as User;
  } catch (e) {
    return null;
  }
};

export const clearUser = (): void => {
  localStorage.removeItem('user');
};

export const hasRole = (user: User | null, roles: string[]): boolean => {
  if (!user) return false;
  return roles.includes(user.role);
};

export const isAgent = (user: User | null): boolean => {
  return hasRole(user, ['agent', 'admin']);
};

export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, ['admin']);
};
