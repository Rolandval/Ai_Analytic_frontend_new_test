import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AIProductFillerLayout from './components/AIProductFillerLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Mail, Lock } from 'lucide-react';

export default function AIProductFillerLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [remember, setRemember] = React.useState(true);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Тут має бути реальна логіка авторизації через бекенд
    setTimeout(() => {
      setLoading(false);
      toast({ title: 'Вхід виконано (демо)', description: 'Це демо‑форма без підключення до бекенду.' });
      navigate('/ai-product-filler');
    }, 800);
  };

  return (
    <AIProductFillerLayout>
      <div
        className="relative w-full px-4 sm:px-6 md:px-8 py-10 flex items-center justify-center"
        style={{
          // Emerald-ish primary для цієї сторінки
          // узгоджено з головною AI Product Filler
          '--primary': '142 71% 45%',
          '--primary-foreground': '210 40% 98%',
        } as React.CSSProperties}
      >
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center rounded-2xl p-3 bg-primary/15">
              <div className="rounded-xl p-2 bg-primary text-white">
                <LogIn className="w-6 h-6" />
              </div>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Вхід до AI Product Filler
            </h1>
            <p className="text-muted-foreground mt-2">
              Авторизуйтеся, щоб продовжити роботу з генерацією і перекладами.
            </p>
          </div>

          <Card className="p-6">
            <form className="grid gap-4" onSubmit={onSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                  </div>
                  <Input id="email" type="email" placeholder="you@example.com" required className="pl-9" />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input id="password" type="password" placeholder="••••••••" required className="pl-9" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
                  Запам'ятати мене
                </label>
                <Link to="#" className="text-sm text-primary hover:underline">Забули пароль?</Link>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-10">
                {loading ? 'Входимо…' : 'Увійти'}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Немає акаунта?{' '}
                <Link to="/ai-product-filler/register" className="text-primary hover:underline">Зареєструватися</Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AIProductFillerLayout>
  );
}
