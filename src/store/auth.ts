import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initAuth: () => void;
  login: (token: string, user: any) => void;
  logout: () => void;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
}

const getInitialState = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;
  
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      user = null;
    }
  }
  
  return {
    token,
    user,
    isAuthenticated: !!token,
    isLoading: false,
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialState(),
  
  initAuth: () => {
    const state = getInitialState();
    set(state);
  },
  
  login: (token: string, user: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({
      token,
      user,
      isAuthenticated: true,
    });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },
  
  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  
  updateUser: (updates: Partial<User>) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },
}));
