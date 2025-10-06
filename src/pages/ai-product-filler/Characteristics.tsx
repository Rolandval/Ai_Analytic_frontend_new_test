import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Checkbox } from '@/components/ui/Checkbox';
import { Search, Plus, Save, Loader2 } from 'lucide-react';
import AIProductFillerLayout from './components/AIProductFillerLayout';
import { usePFI18n } from './i18n';

// Простий мок-датасет (поки немає бекенду)
const mockData: Array<{ id: number; name: string; attr1: string; attr2: string; attr4: string }> = [
  { id: 1, name: 'Товар A', attr1: 'Значення 1.1', attr2: 'Значення 2.1', attr4: 'Значення 4.1' },
  { id: 2, name: 'Товар B', attr1: 'Значення 1.2', attr2: 'Значення 2.2', attr4: 'Значення 4.2' },
  { id: 3, name: 'Товар C', attr1: 'Значення 1.3', attr2: 'Значення 2.3', attr4: 'Значення 4.3' },
  { id: 4, name: 'Товар D', attr1: 'Значення 1.4', attr2: 'Значення 2.4', attr4: 'Значення 4.4' },
  { id: 5, name: 'Товар E', attr1: 'Значення 1.5', attr2: 'Значення 2.5', attr4: 'Значення 4.5' },
  { id: 6, name: 'Товар F', attr1: 'Значення 1.6', attr2: 'Значення 2.6', attr4: 'Значення 4.6' },
];

export default function AIProductFillerCharacteristics() {
  const { t } = usePFI18n();
  // Локальний (макетний) стан для контролів — без підключення до API
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState<'ua' | 'en' | 'ru'>('ua');
  
  const [selectedChatModel, setSelectedChatModel] = useState<string>('');
  const [modelsLoading] = useState(false);
  const [modelsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [massGenerating, setMassGenerating] = useState(false);
  const [selectedGenerating, setSelectedGenerating] = useState(false);
  type CustomFilter = { id: string; name: string; field: string; value: string; active: boolean };
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([]);
  const [newFilter, setNewFilter] = useState<{ name: string; field: string; value: string }>({ name: '', field: 'site_product', value: '' });

  // Локалізований заголовок
  useEffect(() => {
    const prev = document.title;
    document.title = `${t('nav.characteristics') || 'Характеристики'} — AI Product Filler`;
    return () => { document.title = prev; };
  }, [t]);

  return (
    <AIProductFillerLayout>
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold">{t('nav.characteristics') || 'Характеристики'}</h1>
        </div>

        {/* Рядок керування (макет як у Generation, але без логіки) */}
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5 w-full">
            {/* Пошук */}
            <div className="relative flex-1 min-w-[220px] max-w-[480px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Пошук…"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Мова */}
            <Select value={selectedLang} onValueChange={(value) => setSelectedLang(value as 'ua' | 'en' | 'ru')}>
              <SelectTrigger className="w-[120px] shrink-0" title="Мова">
                <SelectValue placeholder="Мова" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ua">ua</SelectItem>
                <SelectItem value="en">en</SelectItem>
                <SelectItem value="ru">ru</SelectItem>
              </SelectContent>
            </Select>
            {/* Вибір AI-моделі (статичний) */}
            <Select value={selectedChatModel} onValueChange={(value) => setSelectedChatModel(value)}>
              <SelectTrigger className="w-[240px] shrink-0" title="AI Модель">
                <SelectValue placeholder={modelsLoading ? 'Завантаження моделей…' : 'Виберіть модель'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                <SelectItem value="llama-3.1">llama-3.1</SelectItem>
              </SelectContent>
            </Select>
            {modelsError && (
              <span className="text-xs text-red-500" title={modelsError}>Помилка завантаження моделей</span>
            )}

            {/* Кнопка додавання фільтра */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" title="Додати фільтр">
                  <Plus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Додати фільтр</h4>
                    <p className="text-sm text-muted-foreground">Виберіть поле та введіть значення</p>
                  </div>
                  <div className="grid gap-2">
                    <Select value={newFilter.field} onValueChange={(value) => setNewFilter({ ...newFilter, field: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Виберіть поле" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="site_product">Назва продукту</SelectItem>
                        <SelectItem value="site_shortname">Коротка назва</SelectItem>
                        <SelectItem value="site_short_description">Короткий опис</SelectItem>
                        <SelectItem value="site_full_description">Повний опис</SelectItem>
                        <SelectItem value="site_promo_text">Промо‑текст</SelectItem>
                        <SelectItem value="site_meta_keywords">Мета‑ключові слова</SelectItem>
                        <SelectItem value="site_meta_description">Мета‑опис</SelectItem>
                        <SelectItem value="site_searchwords">Пошукові слова</SelectItem>
                        <SelectItem value="site_page_title">Заголовок сторінки</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={newFilter.value}
                      onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                      placeholder="Значення для пошуку"
                    />
                    <Button onClick={() => {
                      if (newFilter.field && newFilter.value) {
                        const filter: CustomFilter = {
                          id: `filter_${Date.now()}`,
                          name: `${newFilter.field.replace('site_', '')}: ${newFilter.value}`,
                          field: newFilter.field,
                          value: newFilter.value,
                          active: true,
                        };
                        setCustomFilters((prev) => [...prev, filter]);
                        setNewFilter({ name: '', field: newFilter.field, value: '' });
                      }
                    }}>
                      Додати фільтр
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Кнопки дій (без логіки) */}
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setSaving(true) || setTimeout(() => setSaving(false), 800)}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {t('buttons.save_changes')}
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setMassGenerating(true) || setTimeout(() => setMassGenerating(false), 800)}
              disabled={massGenerating}
            >
              {massGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Масова генерація
            </Button>
            <Button variant="outline" onClick={() => { /* no-op */ }} className="shrink-0">
              {t('buttons.update')}
            </Button>
            <Button
              onClick={() => setSelectedGenerating(true) || setTimeout(() => setSelectedGenerating(false), 800)}
              disabled={selectedGenerating}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4"
            >
              Згенерувати вибрані
            </Button>

            {/* Активні фільтри */}
            {customFilters.length > 0 && (
              <>
                {customFilters.map((filter) => (
                  <Badge
                    key={filter.id}
                    variant="outline"
                    className={`flex items-center h-8 gap-1 cursor-pointer rounded-md px-2 ${filter.active ? 'bg-[#333] text-white border-[#444]' : 'bg-black text-gray-300 border-[#333]'} hover:bg-[#222]`}
                    onClick={() => setCustomFilters((prev) => prev.map(f => f.id === filter.id ? { ...f, active: !f.active } : f))}
                    title={`Поле: ${filter.field}, Значення: ${filter.value}, Статус: ${filter.active ? 'Активний' : 'Неактивний'}`}
                  >
                    {filter.field.replace('site_', '')}: {filter.value}
                    <span
                      role="button"
                      aria-label="Прибрати фільтр"
                      className="ml-2 text-xs opacity-70 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomFilters((prev) => prev.filter((f) => f.id !== filter.id));
                      }}
                    >×</span>
                  </Badge>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white/95 dark:bg-slate-800/90 shadow-md ring-1 ring-black/10 dark:ring-white/10 overflow-hidden">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span>№</span>
                      <Checkbox aria-label="Вибрати всі" />
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[240px]">Назва</TableHead>
                  <TableHead className="min-w-[220px]">Характеристика 1</TableHead>
                  <TableHead className="min-w-[220px]">Характеристика 2</TableHead>
                  <TableHead className="min-w-[220px]">Характеристика 4</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockData.map((row, idx) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.attr1}</TableCell>
                    <TableCell>{row.attr2}</TableCell>
                    <TableCell>{row.attr4}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AIProductFillerLayout>
  );
}
