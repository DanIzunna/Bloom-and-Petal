"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, type User } from "../api";
import { useCart } from "./useCart";

type AuthState = {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  setHydrated: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loadUser: () => Promise<void>;
  logout: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      signIn: async (email, password) => {
        const result = await api.login({ email, password });
        set({ token: result.data.accessToken, user: result.data.user });
        useCart
          .getState()
          .switchScope(
            result.data.user.role === "ADMIN"
              ? `admin:${result.data.user.id}`
              : `customer:${result.data.user.id}`,
            result.data.user.role === "CUSTOMER",
          );
      },
      register: async (name, email, password) => {
        const result = await api.register({ name, email, password });
        set({ token: result.data.accessToken, user: result.data.user });
        useCart.getState().switchScope(`customer:${result.data.user.id}`, true);
      },
      loadUser: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const result = await api.me(token);
          set({ user: result.data });
          useCart
            .getState()
            .switchScope(
              result.data.role === "ADMIN"
                ? `admin:${result.data.id}`
                : `customer:${result.data.id}`,
              false,
            );
        } catch {
          set({ token: null, user: null });
          useCart.getState().initialize();
        }
      },
      logout: () => {
        const user = get().user;
        if (user)
          useCart
            .getState()
            .clearScope(
              user.role === "ADMIN"
                ? `admin:${user.id}`
                : `customer:${user.id}`,
            );
        useCart.getState().switchScope("anonymous");
        set({ token: null, user: null });
      },
    }),
    {
      name: "bloom-petal-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
        if (state?.user)
          useCart
            .getState()
            .switchScope(
              state.user.role === "ADMIN"
                ? `admin:${state.user.id}`
                : `customer:${state.user.id}`,
              false,
            );
        else useCart.getState().initialize();
      },
    },
  ),
);
