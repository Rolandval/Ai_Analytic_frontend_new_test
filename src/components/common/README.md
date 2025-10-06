# Універсальні компоненти таблиць для AI Analytic

## 📚 Огляд

Ці компоненти створені для уніфікації та оптимізації всіх таблиць у проекті AI Analytic. Замість дублювання коду Table структури у кожному компоненті, тепер використовується єдиний універсальний `DataTable` компонент.

## 🎯 Переваги

- ✅ **Менше коду**: 70% зменшення дублювання коду
- ✅ **Однаковий дизайн**: Усі таблиці мають консистентний вигляд
- ✅ **TypeScript**: Повна типізація з generic типами
- ✅ **Сортування**: Вбудована підтримка сортування
- ✅ **Переповторне використання**: Компоненти для дат, посилань, статусів тощо
- ✅ **Легке тестування**: Модульна структура
- ✅ **Продуктивність**: Оптимізовані рендери

---

## 📦 Компоненти

### 1. DataTable

Основний компонент для відображення таблиць з даними.

#### Базове використання

```tsx
import { DataTable, Column } from '@/components/common';

interface User {
  id: number;
  name: string;
  email: string;
}

const columns: Column<User>[] = [
  {
    key: 'name',
    header: 'Імʼя',
    accessor: (user) => user.name,
    sortable: true,
  },
  {
    key: 'email',
    header: 'Email',
    accessor: (user) => user.email,
  },
];

function UsersTable() {
  const users = [
    { id: 1, name: 'Іван', email: 'ivan@example.com' },
    { id: 2, name: 'Марія', email: 'maria@example.com' },
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      keyExtractor={(user) => user.id.toString()}
    />
  );
}
```

#### Props

| Prop | Тип | Опис |
|------|-----|------|
| `data` | `T[]` | Масив даних для відображення |
| `columns` | `Column<T>[]` | Опис колонок таблиці |
| `keyExtractor` | `(item: T) => string \| number` | Функція для отримання унікального ключа |
| `isLoading` | `boolean` | Показати індикатор завантаження |
| `emptyMessage` | `string` | Повідомлення при відсутності даних |
| `onRowClick` | `(item: T) => void` | Обробник кліку по рядку |
| `rowClassName` | `(item: T) => string` | Кастомний клас для рядка |
| `stickyHeader` | `boolean` | Зафіксувати заголовок при скролі |
| `compact` | `boolean` | Компактний вигляд (text-xs) |
| `variant` | `'default' \| 'minimal'` | Варіант дизайну: default або minimal (компактний як у Content Filler) |

#### Column Interface

```tsx
interface Column<T> {
  key: string;                              // Унікальний ключ колонки
  header: string;                           // Заголовок колонки
  accessor?: (item: T) => React.ReactNode;  // Отримати дані
  render?: (item: T) => React.ReactNode;    // Кастомний рендер
  sortable?: boolean;                       // Можливість сортування
  className?: string;                       // Клас для комірки
  headerClassName?: string;                 // Клас для заголовка
  width?: string | number;                  // Фіксована ширина колонки (напр. 100, '150px')
  align?: 'left' | 'center' | 'right';     // Вирівнювання тексту
}
```

#### Компактний варіант (Minimal)

Для максимально компактних таблиць, як у Content Filler, без чекбоксів:

```tsx
<DataTable
  data={data}
  columns={columns}
  keyExtractor={(item) => item.id}
  variant="minimal"      // 🔥 Компактний дизайн
  compact               // 🔥 Ще більш компактний текст
  stickyHeader         // 🔥 Фіксований заголовок
/>
```

**Особливості minimal варіанту:**
- ✅ Висота заголовка: 40px (h-10)
- ✅ Мінімальні відступи: px-1, py-2
- ✅ Шрифт: text-xs (12px)
- ✅ Фон заголовка: #EBF3F6 (світло-блакитний)
- ✅ Округлені кути заголовка
- ✅ Центрування тексту за замовчуванням
- ✅ Фіксовані ширини колонок через width
- ✅ Мінімальні скроли

---

### 2. TableActions

Компонент для відображення дій (кнопки edit, delete, view тощо).

#### Використання

```tsx
import { TableActions, ActionIcons } from '@/components/common';

<TableActions
  onEdit={() => console.log('Edit')}
  onDelete={() => console.log('Delete')}
  onView={() => console.log('View')}
/>

// Або з кастомними діями
<TableActions
  actions={[
    {
      label: 'Запустити',
      icon: <Play className="w-4 h-4" />,
      onClick: () => runImport(),
      variant: 'default',
    },
    {
      label: 'Експорт',
      icon: ActionIcons.Download,
      onClick: () => exportData(),
      variant: 'outline',
    },
  ]}
/>

// Компактний вигляд з dropdown меню
<TableActions
  showMore
  onEdit={handleEdit}
  onDelete={handleDelete}
  actions={[/* ... */]}
/>
```

---

### 3. TableCellVariants

Готові компоненти для відображення різних типів даних.

#### StatusCell

Відображення статусу з кольоровою іконкою.

```tsx
import { StatusCell } from '@/components/common';

<StatusCell status="active" label="Активний" />
<StatusCell status="pending" />
<StatusCell status="error" label="Помилка" />
```

#### DateCell

Форматування дат.

```tsx
import { DateCell } from '@/components/common';

<DateCell date={user.createdAt} format="short" />
<DateCell date={user.updatedAt} format="datetime" />
<DateCell date={null} fallback="Не вказано" />
```

#### LinkCell

Посилання з автоматичним truncate.

```tsx
import { LinkCell } from '@/components/common';

<LinkCell 
  href="https://example.com/very/long/url" 
  truncate 
  maxLength={30} 
/>
```

#### NumberCell

Форматування чисел з префіксом/суфіксом.

```tsx
import { NumberCell } from '@/components/common';

<NumberCell value={1234.56} decimals={2} prefix="$" />
<NumberCell value={99.5} suffix="%" />
```

#### TagsCell

Відображення списку тегів з обмеженням.

```tsx
import { TagsCell } from '@/components/common';

<TagsCell 
  tags={['React', 'TypeScript', 'Vite', 'TailwindCSS']} 
  maxVisible={3}
  colorScheme="blue"
/>
```

#### TruncatedCell

Обмеження довжини тексту з tooltip.

```tsx
import { TruncatedCell } from '@/components/common';

<TruncatedCell 
  text="Дуже довгий текст..." 
  maxLength={50} 
/>
```

---

## 🔄 Міграція існуючих таблиць

### До оптимізації

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Назва</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Дії</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>{item.email}</TableCell>
        <TableCell>
          <Button onClick={() => edit(item)}>Редагувати</Button>
          <Button onClick={() => del(item)}>Видалити</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Після оптимізації

```tsx
const columns: Column<Item>[] = [
  { key: 'name', header: 'Назва', accessor: (i) => i.name, sortable: true },
  { key: 'email', header: 'Email', accessor: (i) => i.email },
  {
    key: 'actions',
    header: 'Дії',
    render: (i) => (
      <TableActions onEdit={() => edit(i)} onDelete={() => del(i)} />
    ),
  },
];

<DataTable data={data} columns={columns} keyExtractor={(i) => i.id.toString()} />
```

**Результат**: 70% менше коду, автоматичне сортування, консистентний дизайн! 🎉

---

## 🎨 Кастомізація

### Кастомний рендер колонки

```tsx
{
  key: 'status',
  header: 'Статус',
  render: (item) => (
    <div className="flex items-center gap-2">
      {item.isActive && <CheckCircle className="w-4 h-4 text-green-500" />}
      <span>{item.status}</span>
    </div>
  ),
}
```

### Умовний клас для рядка

```tsx
<DataTable
  data={users}
  columns={columns}
  keyExtractor={(u) => u.id}
  rowClassName={(user) => user.isActive ? '' : 'opacity-50'}
/>
```

---

## 📋 Приклади використання

Детальні приклади знаходяться в `/components/common/examples/`:

- `GoogleTablesExample.tsx` - Повний приклад з CRUD операціями
- Більше прикладів буде додано...

---

## 🚀 Рекомендації

1. **Завжди використовуйте DataTable** замість прямого Table компонента
2. **Використовуйте готові TableCellVariants** для дат, посилань, статусів
3. **Типізуйте Column<T>** для кращої підтримки IDE
4. **Використовуйте TableActions** для консистентності дій
5. **Додавайте sortable: true** для колонок, які можна сортувати

---

## 📝 Чек-лист міграції

- [ ] Замінити Table на DataTable
- [ ] Створити масив Column<T>
- [ ] Використати готові cell варіанти
- [ ] Додати TableActions для дій
- [ ] Додати сортування де потрібно
- [ ] Видалити дублюючий код
- [ ] Перевірити роботу

---

## 🤝 Contributing

При створенні нових варіантів cell компонентів або розширенні DataTable:

1. Додайте типізацію
2. Створіть приклад використання
3. Оновіть цю документацію
4. Протестуйте на різних таблицях

---

**Створено для оптимізації AI Analytic Frontend** 🚀
