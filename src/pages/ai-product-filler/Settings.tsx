import { useEffect, useState, type CSSProperties } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AlertTriangle, Database as DatabaseIcon, Plug, Eye, EyeOff, Plus } from 'lucide-react';
import AIProductFillerLayout from './components/AIProductFillerLayout';
import { useThemeStore } from '@/store/themeStore';
import { usePFI18n } from './i18n';
import { useToast } from '@/hooks/use-toast';
import {
  type DatabaseItem,
  type SqlType,
  getDatabases,
  createDatabase,
  updateDatabase,
  deleteDatabase,
  checkDatabaseConnection,
} from '@/api/databases';

export default function AIProductFillerSettings() {
  const { toast } = useToast();
  const { uiLanguage, setUiLanguage } = useThemeStore();
  const { t } = usePFI18n();
  // Мок налаштувань підключення до БД
  const [dbAddress, setDbAddress] = useState('');
  const [dbLogin, setDbLogin] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [dbPort, setDbPort] = useState<number | ''>('');
  const [dbName, setDbName] = useState('');
  const [dbType, setDbType] = useState<'postgresql' | 'mysql' | 'mssql' | 'sqlite'>('postgresql');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Список баз
  const [databases, setDatabases] = useState<DatabaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<string>('');

  type MappingRow = { id: string; label: string; dbField: string; example: string };
  const [rows, setRows] = useState<MappingRow[]>([
    { id: 'name', label: 'Name', dbField: '', example: 'введіть назву товару' },
    { id: 'description', label: 'Description', dbField: '', example: 'введіть опис товару' },
    { id: 'code', label: 'Код товару', dbField: '', example: 'введіть код товару' },
  ]);

  const refreshList = async () => {
    setLoading(true);
    setActionMsg('');
    try {
      const list = await getDatabases();
      setDatabases(list);
    } finally {
      setLoading(false);
    }
  };

  // Create a new DB entry from current form values even if an item is selected
  const onCreateAsNew = async () => {
    setActionMsg('');
    try {
      const payload = {
        name: dbName,
        sql_type: dbType,
        host: dbAddress,
        port: Number(dbPort || 0),
        user: dbLogin,
        password: dbPassword,
        database: dbName,
      };
      await createDatabase(payload);
      setActionMsg('Створено новий запис успішно');
      toast({ title: 'Створено нову базу', description: `Базу "${dbName}" створено як новий запис.`, variant: 'default' });
      // Після створення залишимо форму як є, але оновимо список
      await refreshList();
    } catch (e) {
      setActionMsg('Помилка створення нового запису');
      toast({ title: 'Помилка створення', description: e instanceof Error ? e.message : 'Не вдалося створити новий запис', variant: 'destructive' });
    }
  };

  useEffect(() => {
    void refreshList();
  }, []);

  const applySelection = (db: DatabaseItem | null) => {
    if (!db) {
      setSelectedId(null);
      setDbName('');
      setDbAddress('');
      setDbPort('');
      setDbLogin('');
      setDbPassword('');
      setDbType('postgresql');
      setIsConnected(false);
      return;
    }
    setSelectedId(db.id);
    setDbName(db.name || '');
    setDbAddress(db.host || '');
    setDbPort(db.port ?? '');
    setDbLogin(db.user || '');
    setDbPassword(db.password || '');
    // Узгодження типів: бекенд може повертати як 'Postgres'|'MySQL'|'MSSQL', так і нижній регістр
    const t = (db.sql_type as SqlType | 'Postgres' | 'MySQL' | 'MSSQL' | string) || '';
    const lower = String(t).toLowerCase();
    const normalized: 'postgresql' | 'mysql' | 'mssql' | 'sqlite' =
      lower === 'postgresql' || lower === 'postgres' ? 'postgresql' :
      lower === 'mysql' ? 'mysql' :
      lower === 'sqlite' ? 'sqlite' :
      'mssql';
    setDbType(normalized);
  };

  const onCreate = async () => {
    setActionMsg('');
    try {
      const payload = {
        name: dbName,
        sql_type: dbType, // нижній регістр: 'postgres' | 'mysql' | 'mssql' | 'sqlite'
        host: dbAddress,
        port: Number(dbPort || 0),
        user: dbLogin,
        password: dbPassword,
        database: dbName,
      };
      await createDatabase(payload);
      setActionMsg('Створено успішно');
      toast({ title: 'Базу створено', description: `Базу "${dbName}" успішно створено.`, variant: 'default' });
      await refreshList();
    } catch (e) {
      setActionMsg('Помилка створення бази');
      toast({ title: 'Помилка створення', description: e instanceof Error ? e.message : 'Не вдалося створити базу', variant: 'destructive' });
    }
  };

  const onUpdate = async () => {
    if (!selectedId) return;
    setActionMsg('');
    try {
      const payload = {
        id: selectedId,
        name: dbName,
        sql_type: dbType, // нижній регістр
        host: dbAddress,
        port: Number(dbPort || 0),
        user: dbLogin,
        password: dbPassword,
        database: dbName,
      };
      await updateDatabase(payload);
      setActionMsg('Оновлено успішно');
      toast({ title: 'Оновлено базу', description: `Базу "${dbName}" оновлено успішно.`, variant: 'default' });
      await refreshList();
    } catch (e) {
      setActionMsg('Помилка оновлення бази');
      toast({ title: 'Помилка оновлення', description: e instanceof Error ? e.message : 'Не вдалося оновити базу', variant: 'destructive' });
    }
  };

  const onDelete = async () => {
    if (!selectedId) return;
    setActionMsg('');
    try {
      await deleteDatabase(selectedId);
      setActionMsg('Видалено успішно');
      toast({ title: 'Базу видалено', description: `Запис бази видалено.`, variant: 'default' });
      applySelection(null);
      await refreshList();
    } catch (e) {
      setActionMsg('Помилка видалення бази');
      toast({ title: 'Помилка видалення', description: e instanceof Error ? e.message : 'Не вдалося видалити базу', variant: 'destructive' });
    }
  };

  const checkConnection = async () => {
    if (!selectedId) return;
    setChecking(true);
    setActionMsg('');
    try {
      const res = await checkDatabaseConnection(selectedId);
      setIsConnected(!!res?.ok);
      setActionMsg(res?.ok ? 'Підключення успішне' : (res?.message || 'Підключення неуспішне'));
      toast({
        title: res?.ok ? 'Підключення успішне' : 'Проблема з підключенням',
        description: res?.message || (res?.ok ? 'Звʼязок із БД встановлено.' : 'Перевірте налаштування доступу.'),
        variant: res?.ok ? 'default' : 'destructive',
      });
    } catch (e) {
      setIsConnected(false);
      setActionMsg('Помилка перевірки підключення');
      toast({ title: 'Помилка перевірки', description: e instanceof Error ? e.message : 'Не вдалося перевірити підключення', variant: 'destructive' });
    } finally {
      setChecking(false);
    }
  };

  const autoDetect = (id: string) => {
    setRows(prev => prev.map(r => (
      r.id === id
        ? { ...r, dbField: r.label.toLowerCase().replace(/\s+/g, '_') }
        : r
    )));
  };

  const addRow = () => {
    const idx = rows.length + 1;
    setRows(prev => [
      ...prev,
      { id: `custom_${idx}`, label: `Нове поле ${idx}`, dbField: '', example: 'введіть назву товару' }
    ]);
  };

  return (
    <AIProductFillerLayout>
      <div
        className="w-full px-5 py-5"
        style={{
          // Вирівнюємо зелений під сторінки AI Product Filler (як у Home.tsx)
          '--primary': '142 71% 45%',
          '--primary-foreground': '210 40% 98%',
        } as CSSProperties}
      >
        {/* Заголовок сторінки (градієнт) + селектор мови інтерфейсу */}
        <div className="mb-6">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/70 text-primary-foreground shadow-sm">
            <div className="px-5 py-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-md bg-white/15 flex items-center justify-center">
                  <DatabaseIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-semibold leading-tight">{t('settings.title')}</h1>
                  <p className="text-sm/6 text-white/90">{t('settings.subtitle')}</p>
                </div>
              </div>
              <div className="shrink-0">
                <label className="text-xs block mb-1 text-white/80">{t('settings.ui_language')}</label>
                <div className="flex items-center gap-2 bg-white/10 rounded-md px-2 py-1">
                  {(['ua','en','ru'] as const).map((lng) => (
                    <button
                      key={lng}
                      onClick={() => setUiLanguage(lng)}
                      className={`h-8 px-2 rounded-md text-sm transition-colors ${uiLanguage === lng ? 'bg-white text-emerald-700' : 'text-white/90 hover:bg-white/20'}`}
                      title={{ua:'Українська',en:'English',ru:'Русский'}[lng]}
                    >
                      {lng.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          </div>
        </div>

        {/* Попередження */}
        <Card className="p-4 mb-6 border border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-amber-600 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="text-base font-semibold">‼️ Попередження‼️</div>
              <p>Робіть бекапи!</p>
              <p>Акуратно користуйтесь, щоб не зіпсувати вашу БД.</p>
              <p>Спочатку зробіть тест на копії або забекапленій базі.</p>
            </div>
          </div>
        </Card>

        {/* Список баз */}
        <Card className="p-6 mb-6 bg-white/90 dark:bg-neutral-900/60 ring-1 ring-black/5 dark:ring-white/10 rounded-xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Ваші бази</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applySelection(null)}
                aria-label="Нова база"
                title="Нова база"
                className="p-2 h-8 w-8 flex items-center justify-center"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => applySelection(null)}>Очистити форму</Button>
              <Button variant="outline" size="sm" onClick={() => refreshList()} disabled={loading}>{loading ? 'Оновлюємо…' : 'Оновити список'}</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {databases.map(db => (
              <button
                key={db.id}
                onClick={() => applySelection(db)}
                className={`text-left p-3 rounded-lg border transition hover:shadow ${selectedId === db.id ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-gray-200 dark:border-white/10'}`}
              >
                <div className="font-medium truncate">{db.name}</div>
                <div className="text-xs text-muted-foreground truncate">{db.host}:{db.port} • {db.sql_type}</div>
              </button>
            ))}
            {databases.length === 0 && !loading && (
              <div className="text-sm text-muted-foreground">Список порожній. Додайте першу базу.</div>
            )}
          </div>
        </Card>

        {/* Параметри підключення до БД */}
        <Card className="p-6 mb-3 bg-white/90 dark:bg-neutral-900/60 ring-1 ring-black/5 dark:ring-white/10 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-slate-600 dark:text-slate-300">Хост</Label>
              <Input value={dbAddress} onChange={(e) => setDbAddress(e.target.value)} placeholder="Напр., 172.30.16.1" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-slate-600 dark:text-slate-300">Логін</Label>
              <Input value={dbLogin} onChange={(e) => setDbLogin(e.target.value)} placeholder="Введіть логін" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-slate-600 dark:text-slate-300">Пароль</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={dbPassword}
                  onChange={(e) => setDbPassword(e.target.value)}
                  placeholder="Введіть пароль"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-2 my-auto h-6 w-6 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
                  title={showPassword ? 'Сховати пароль' : 'Показати пароль'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-slate-600 dark:text-slate-300">Тип БД (postgres, mysql, mssql тощо)</Label>
              <select
                className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-sm dark:bg-neutral-800 dark:border-neutral-700"
                value={dbType}
                onChange={(e) => setDbType(e.target.value as 'postgresql' | 'mysql' | 'mssql' | 'sqlite')}
              >
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="mssql">MS SQL</option>
                <option value="sqlite">SQLite</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-slate-600 dark:text-slate-300">Порт</Label>
              <Input type="number" value={dbPort} onChange={(e) => setDbPort(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Напр., 5432" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-slate-600 dark:text-slate-300">Назва бази</Label>
              <Input value={dbName} onChange={(e) => setDbName(e.target.value)} placeholder="Напр., my_database" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Стан БД</span>
              {isConnected ? (
                <Badge variant="success" className="gap-1"><Plug className="h-3.5 w-3.5" /> підключена</Badge>
              ) : (
                <Badge variant="destructive">не підключена</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedId ? (
                <>
                  <Button variant="outline" size="sm" onClick={checkConnection} disabled={checking}>{checking ? 'Перевіряємо…' : 'Перевірити підключення'}</Button>
                  <Button size="sm" onClick={onUpdate} disabled={!dbAddress || !dbLogin || !dbPort || !dbName}>Оновити базу</Button>
                  <Button size="sm" variant="secondary" onClick={onCreateAsNew} disabled={!dbAddress || !dbLogin || !dbPort || !dbName}>Зберегти як нову</Button>
                  <Button size="sm" variant="destructive" onClick={onDelete}>Видалити</Button>
                </>
              ) : (
                <Button size="sm" onClick={onCreate} disabled={!dbAddress || !dbLogin || !dbPort || !dbName}>Створити базу</Button>
              )}
            </div>
          </div>
          {actionMsg && (
            <div className="mt-2 text-xs text-muted-foreground">{actionMsg}</div>
          )}
        </Card>

        {/* Відповідник полів */}
        <Card className="p-6 bg-white/90 dark:bg-neutral-900/60 ring-1 ring-black/5 dark:ring-white/10 rounded-xl">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Відповідник полів</h2>
          </div>

          <div className="divide-y divide-gray-200/70 dark:divide-white/10">
            {rows.map((row) => (
              <div key={row.id} className="py-2 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                  <div className="shrink-0 min-w-[160px] font-medium text-slate-700 dark:text-slate-200">[{row.label}]</div>
                  <div className="hidden md:block text-slate-400">=</div>
                  <div className="flex-1">
                    <Input
                      placeholder="поле в бд"
                      value={row.dbField}
                      onChange={(e) => setRows(prev => prev.map(r => r.id === row.id ? { ...r, dbField: e.target.value } : r))}
                    />
                  </div>
                  <div className="hidden md:block text-slate-400">|</div>
                  <div className="flex-1">
                    <Input placeholder={row.example} disabled />
                  </div>
                  <div className="shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => autoDetect(row.id)}>Визначити</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={addRow}>+ Додати поле</Button>
          </div>
        </Card>
      </div>
    </AIProductFillerLayout>
  );
}
