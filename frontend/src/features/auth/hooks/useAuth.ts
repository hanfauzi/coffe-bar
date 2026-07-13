import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '../../../context/ToastContext';
import { auth } from '../api';
import { getToken, getUser, setToken as saveToken, setUser as saveUser } from '../../../lib/apiClient';

export function useAuth() {
  const { toast } = useToast();
  const [token, setTokenState] = useState<string | null>(getToken());
  const [user, setUserState] = useState<any | null>(getUser());

  const setAuth = (token: string | null, user: any | null) => {
    saveToken(token);
    saveUser(user);
    setTokenState(token);
    setUserState(user);
  };

  const logout = () => {
    setAuth(null, null);
    toast.success('Berhasil keluar akun');
  };

  const loginMutation = useMutation({
    mutationFn: (body: any) => auth.login(body),
    onSuccess: (res) => {
      setAuth(res.token, res.user);
      toast.success('Selamat datang kembali!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal masuk akun');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (body: any) => auth.register(body),
    onSuccess: () => {
      toast.success('Registrasi berhasil! Silakan masuk.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal mendaftar akun');
    },
  });

  return {
    token,
    user,
    loading: loginMutation.isPending || registerMutation.isPending,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    setAuth,
  };
}
