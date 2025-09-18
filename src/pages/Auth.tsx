import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { requestPassword } from '@/api/auth';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, register, loading, error, token, clearError } = useAuthStore();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const from = (location.state as any)?.from || '/profile';

  useEffect(() => {
    if (token) {
      navigate(from, { replace: true });
    }
  }, [token, from, navigate]);

  useEffect(() => {
    if (error) {
      toast({ title: 'Помилка', description: error, variant: 'destructive' });
      clearError();
    }
  }, [error, toast, clearError]);

  const handleLogin = async () => {
    try {
      await login({ email, password });
      toast({ title: 'Вітаємо!', description: 'Вхід виконано успішно' });
      clearError();
      navigate(from, { replace: true });
    } catch (e: any) {
      // error handled by store; toast shown in effect
    }
  };

  const handleRequestPassword = async () => {
    try {
      const targetEmail = (resetEmail || email).trim();
      if (!targetEmail) {
        toast({ title: 'Помилка', description: 'Введіть email, щоб скинути пароль', variant: 'destructive' });
        return;
      }
      // Проста валідація email
      const emailRegex = /.+@.+\..+/;
      if (!emailRegex.test(targetEmail)) {
        toast({ title: 'Некоректний email', description: 'Перевірте правильність email', variant: 'destructive' });
        return;
      }
      setResetLoading(true);
      await requestPassword({ email: targetEmail });
      toast({ title: 'Лист відправлено', description: 'Якщо email існує, ми надіслали новий пароль на пошту.' });
    } catch (e: any) {
      toast({ title: 'Помилка', description: e?.message || 'Не вдалося надіслати лист', variant: 'destructive' });
    } finally {
      setResetLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      await register({ email, password });
      toast({ title: 'Реєстрація успішна', description: 'Обліковий запис створено' });
      clearError();
      navigate('/profile', { replace: true });
    } catch (e: any) {
      // handled
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'login') handleLogin();
    else handleRegister();
  };

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-black dark:to-neutral-950">
      <Card className="w-full max-w-md bg-white/90 dark:bg-neutral-900/80 backdrop-blur border-white/20 dark:border-neutral-800 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Вхід / Реєстрація</CardTitle>
          <CardDescription>Увійдіть у кабінет або створіть новий обліковий запис</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="login">Вхід</TabsTrigger>
              <TabsTrigger value="register">Реєстрація</TabsTrigger>
            </TabsList>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ваш пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Приховати пароль' : 'Показати пароль'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {tab === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    {loading ? 'Входимо…' : 'Увійти'}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {loading ? 'Реєструємо…' : 'Зареєструватися'}
                  </>
                )}
              </Button>

              {/* Reset password section */}
              <div className="mt-2 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Скинути пароль</Label>
                  <div className="flex gap-2">
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="you@example.com"
                      value={resetEmail || email}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                    <Button type="button" variant="outline" onClick={handleRequestPassword} disabled={resetLoading}>
                      {resetLoading ? 'Надсилаємо…' : 'Отримати пароль'}
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">Ми надішлемо новий пароль на вашу пошту</div>
                </div>
              </div>

              <div className="text-xs text-center text-gray-500">
                Натискаючи кнопку, ви погоджуєтесь з умовами використання
              </div>

              <div className="text-sm text-center text-gray-600">
                {tab === 'login' ? (
                  <>
                    Немає акаунту?{' '}
                    <button type="button" className="text-blue-600 hover:underline" onClick={() => setTab('register')}>
                      Зареєструйтесь
                    </button>
                  </>
                ) : (
                  <>
                    Вже маєте акаунт?{' '}
                    <button type="button" className="text-blue-600 hover:underline" onClick={() => setTab('login')}>
                      Увійдіть
                    </button>
                  </>
                )}
              </div>

              <div className="text-center">
                <Link to="/" className="text-xs text-gray-500 hover:underline">На головну</Link>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
