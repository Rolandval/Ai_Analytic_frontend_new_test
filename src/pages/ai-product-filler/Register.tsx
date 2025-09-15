import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AIProductFillerLayout from './components/AIProductFillerLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, User, Mail, Lock } from 'lucide-react';

export default function AIProductFillerRegister() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [agree, setAgree] = React.useState(true);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Тут має бути реальна логіка реєстрації через бекенд
    setTimeout(() => {
      setLoading(false);
      toast({ title: 'Реєстрація успішна (демо)', description: 'Це демо‑форма без підключення до бекенду.' });
      navigate('/ai-product-filler/login');
    }, 900);
  };

  return (
    <AIProductFillerLayout>
      <div
        className="relative w-full px-4 sm:px-6 md:px-8 py-10 flex items-center justify-center"
        style={{
          '--primary': '142 71% 45%',
          '--primary-foreground': '210 40% 98%',
        } as React.CSSProperties}
      >
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center rounded-2xl p-3 bg-primary/15">
              <div className="rounded-xl p-2 bg-primary text-white">
                <UserPlus className="w-6 h-6" />
              </div>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Реєстрація в AI Product Filler
            </h1>
            <p className="text-muted-foreground mt-2">
              Створіть акаунт, щоб користуватися генерацією та перекладачем товарів.
            </p>
          </div>

          <Card className="p-6">
            <form className="grid gap-4" onSubmit={onSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="name">Ім'я</Label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <User className="w-4 h-4" />
                  </div>
                  <Input id="name" type="text" placeholder="Ваше ім'я" required className="pl-9" />
                </div>
              </div>

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

              <div className="grid gap-2">
                <Label htmlFor="confirm">Підтвердіть пароль</Label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input id="confirm" type="password" placeholder="••••••••" required className="pl-9" />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} />
                Погоджуюсь з умовами користування
              </label>

              <Button type="submit" disabled={loading || !agree} className="w-full h-10">
                {loading ? 'Реєструємо…' : 'Зареєструватися'}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Вже маєте акаунт?{' '}
                <Link to="/ai-product-filler/login" className="text-primary hover:underline">Увійти</Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AIProductFillerLayout>
  );
}
