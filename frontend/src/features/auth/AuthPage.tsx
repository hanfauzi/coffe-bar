import { useState } from 'react';
import { Coffee } from 'lucide-react';
import { useFormik } from 'formik';
import { useToast } from '../../context/ToastContext';
import { auth as authApi } from './api';
import type { User } from './types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { loginSchema, registerSchema } from './schemas';

interface AuthPageProps {
  onAuthSuccess: (token: string, user: User) => void;
}

export default function AuthPage({
  onAuthSuccess,
}: AuthPageProps) {
  const { toast } = useToast();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema: authMode === 'login' ? loginSchema : registerSchema,
    onSubmit: async (values) => {
      setAuthError('');
      setAuthSuccess('');
      try {
        if (authMode === 'login') {
          const res = await authApi.login(values);
          onAuthSuccess(res.token, res.user);
          toast.success('Selamat datang kembali.');
        } else {
          await authApi.register(values);
          setAuthMode('login');
          setAuthSuccess('Akun berhasil dibuat. Silakan masuk.');
          formik.resetForm();
        }
      } catch (err: any) {
        setAuthError(err.message || 'Otentikasi gagal');
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center font-sans p-6 bg-canvas text-ink">
      <div className="w-full max-w-sm p-8 rounded-xl shadow-sm border bg-surface border-border space-y-6">
        <div className="text-center">
          <div className="inline-flex p-3 rounded-full mb-3 bg-primary/10 text-primary">
            <Coffee size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">BrewLedger</h1>
          <p className="text-xs mt-1 text-ink-secondary">Sistem Pelacakan Keuangan & Inventory Kopi</p>
        </div>

        {authError && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-xs text-center font-medium animate-shake">
            {authError}
          </div>
        )}

        {authSuccess && (
          <div className="p-3 bg-success/10 border border-success/20 rounded-lg text-success text-xs text-center font-medium">
            {authSuccess}
          </div>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <Input 
            label="Username"
            type="text" 
            name="username"
            value={formik.values.username}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Username pemilik"
            error={formik.touched.username ? formik.errors.username : undefined}
          />
          <Input 
            label="Password"
            type="password" 
            name="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="••••••••"
            error={formik.touched.password ? formik.errors.password : undefined}
          />

          <Button 
            type="submit" 
            className="w-full py-2.5"
            disabled={formik.isSubmitting}
          >
            {authMode === 'login' ? 'Masuk ke Dashboard' : 'Daftar Akun Baru'}
          </Button>
        </form>

        <div className="text-center pt-2">
          <button 
            onClick={() => {
              setAuthMode(authMode === 'login' ? 'register' : 'login');
              setAuthError('');
              setAuthSuccess('');
              formik.resetForm();
            }}
            className="text-xs text-ink-secondary hover:text-ink transition font-medium cursor-pointer"
          >
            {authMode === 'login' ? 'Belum punya akun? Buat baru' : 'Sudah punya akun? Masuk'}
          </button>
        </div>
      </div>
    </div>
  );
}
