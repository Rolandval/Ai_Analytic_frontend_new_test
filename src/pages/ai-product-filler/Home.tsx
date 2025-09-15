import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AIProductFillerLayout from './components/AIProductFillerLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Wand2, Layers, Languages, Settings, Columns3, CheckCircle2, MousePointer, Zap, Info } from 'lucide-react';
import { usePFI18n } from './i18n';

export default function AIProductFillerHome() {
  const { t } = usePFI18n();
  useEffect(() => {
    const prev = document.title;
    document.title = `${t('home.title')} — AI Product Filler`;
    return () => { document.title = prev; };
  }, [t]);
  return (
    <AIProductFillerLayout>
      <div
        className="relative w-full px-4 sm:px-6 md:px-8 py-8"
        style={{
          // Emerald-ish primary for this page only
          '--primary': '142 71% 45%',
          '--primary-foreground': '210 40% 98%',
        } as React.CSSProperties}
      >
        {/* HERO */}
        <section className="relative flex flex-col gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl p-3 bg-primary/15">
              <div className="rounded-xl p-2 bg-primary text-white">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L4 8V16L12 22L20 16V8L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 22V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20 8L12 16L4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 16L12 8L20 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 2V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                {t('home.title')}
              </h1>
              <p className="text-muted-foreground mt-3 max-w-3xl text-base sm:text-lg">
                {t('home.subtitle')}
              </p>
            </div>
          </div>

          {/* CTA кнопки */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Button asChild className="h-auto py-3 justify-start gap-2">
              <Link to="/ai-product-filler/generation"><Wand2 className="w-4 h-4"/> {t('home.cta.generation')}</Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-3 justify-start gap-2">
              <Link to="/ai-product-filler/templates"><Layers className="w-4 h-4"/> {t('home.cta.templates')}</Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-3 justify-start gap-2">
              <Link to="/ai-product-filler/translator"><Languages className="w-4 h-4"/> {t('home.cta.translator')}</Link>
            </Button>
            <Button variant="ghost" asChild className="h-auto py-3 justify-start gap-2">
              <Link to="/ai-product-filler/settings"><Settings className="w-4 h-4"/> {t('home.cta.settings')}</Link>
            </Button>
          </div>
        </section>

        {/* Фішки застосунку */}
        <section className="mt-4">
          <h2 className="text-2xl font-bold mb-4">{t('home.features')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <Card className="p-5 flex items-start gap-3">
              <div className="p-2 rounded-md bg-emerald-100 text-emerald-700">
                <Columns3 className="w-5 h-5"/>
              </div>
              <div>
                <div className="font-medium">{t('home.feature.resize_title')}</div>
                <p className="text-sm text-muted-foreground mt-1">{t('home.feature.resize_desc')}</p>
              </div>
            </Card>

            <Card className="p-5 flex items-start gap-3">
              <div className="p-2 rounded-md bg-emerald-100 text-emerald-700">
                <MousePointer className="w-5 h-5"/>
              </div>
              <div>
                <div className="font-medium">{t('home.feature.master_title')}</div>
                <p className="text-sm text-muted-foreground mt-1">{t('home.feature.master_desc')}</p>
              </div>
            </Card>

            <Card className="p-5 flex items-start gap-3">
              <div className="p-2 rounded-md bg-emerald-100 text-emerald-700">
                <Languages className="w-5 h-5"/>
              </div>
              <div>
                <div className="font-medium">{t('home.feature.dual_trans_title')}</div>
                <p className="text-sm text-muted-foreground mt-1">{t('home.feature.dual_trans_desc')}</p>
              </div>
            </Card>

            <Card className="p-5 flex items-start gap-3">
              <div className="p-2 rounded-md bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-5 h-5"/>
              </div>
              <div>
                <div className="font-medium">{t('home.feature.save_ctrl_title')}</div>
                <p className="text-sm text-muted-foreground mt-1">{t('home.feature.save_ctrl_desc')}</p>
              </div>
            </Card>

            <Card className="p-5 flex items-start gap-3">
              <div className="p-2 rounded-md bg-emerald-100 text-emerald-700">
                <Layers className="w-5 h-5"/>
              </div>
              <div>
                <div className="font-medium">{t('home.feature.en_prompts_title')}</div>
                <p className="text-sm text-muted-foreground mt-1">{t('home.feature.en_prompts_desc')}</p>
              </div>
            </Card>

            <Card className="p-5 flex items-start gap-3">
              <div className="p-2 rounded-md bg-emerald-100 text-emerald-700">
                <Info className="w-5 h-5"/>
              </div>
              <div>
                <div className="font-medium">{t('home.feature.ux_title')}</div>
                <p className="text-sm text-muted-foreground mt-1">{t('home.feature.ux_desc')}</p>
              </div>
            </Card>
          </div>
        </section>

        {/* Як це працює */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold mb-4">{t('home.howitworks')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 font-medium"><Layers className="w-4 h-4"/> {t('home.step1_title')}</div>
              <p className="text-sm text-muted-foreground mt-2">{t('home.step1_desc')}</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 font-medium"><Wand2 className="w-4 h-4"/> {t('home.step2_title')}</div>
              <p className="text-sm text-muted-foreground mt-2">{t('home.step2_desc')}</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-4 h-4"/> {t('home.step3_title')}</div>
              <p className="text-sm text-muted-foreground mt-2">{t('home.step3_desc')}</p>
            </Card>
          </div>
        </section>

        {/* Швидкий старт (короткий блок) */}
        <section className="mt-8">
          <Card className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-foreground">
              <div className="p-2 rounded-md bg-primary/10 text-primary"><Zap className="w-5 h-5"/></div>
              <div>
                <div className="font-semibold">{t('home.quick.title')}</div>
                <p className="text-sm text-muted-foreground">{t('home.quick.desc')}</p>
              </div>
            </div>
            <Button asChild>
              <Link to="/ai-product-filler/generation">{t('home.go_generation')}</Link>
            </Button>
          </Card>
        </section>
      </div>
    </AIProductFillerLayout>
  );
}
