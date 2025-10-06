# 📋 Посібник з компактних таблиць для AI Analytic

## 🎯 Швидкий старт

### Компактна таблиця без чекбоксів (як у Content Filler)

```tsx
import { DataTable, Column } from '@/components/common';
import { TableActions, DateCell, NumberCell } from '@/components/common';

// 1. Визначте тип даних
interface Product {
  id: number;
  name: string;
  price: number;
  supplier: string;
  updatedAt: string;
}

// 2. Опишіть колонки
const columns: Column<Product>[] = [
  {
    key: 'id',
    header: '№',
    accessor: (row) => row.id,
    width: 60,          // 🔥 Фіксована ширина
    align: 'center',    // 🔥 Центрування
  },
  {
    key: 'name',
    header: 'Назва',
    accessor: (row) => row.name,
    sortable: true,     // 🔥 Сортування
    align: 'left',
  },
  {
    key: 'price',
    header: 'Ціна',
    render: (row) => <NumberCell value={row.price} decimals={2} prefix="$" />,
    width: 100,
    align: 'right',
  },
  {
    key: 'supplier',
    header: 'Постачальник',
    accessor: (row) => row.supplier,
    width: 150,
  },
  {
    key: 'updatedAt',
    header: 'Оновлено',
    render: (row) => <DateCell date={row.updatedAt} format="short" />,
    width: 120,
  },
  {
    key: 'actions',
    header: 'Дії',
    render: (row) => (
      <TableActions
        compact
        onEdit={() => handleEdit(row)}
        onDelete={() => handleDelete(row.id)}
      />
    ),
    width: 100,
  },
];

// 3. Використайте DataTable
<DataTable
  data={products}
  columns={columns}
  keyExtractor={(row) => row.id.toString()}
  variant="minimal"      // 🔥 КЛЮЧОВА ОПЦІЯ для компактності
  compact               // 🔥 Ще більш компактний текст
  stickyHeader         // 🔥 Фіксований заголовок
  isLoading={isLoading}
  emptyMessage="Немає даних"
/>
```

---

## ✨ Ключові опції

### variant="minimal"

Це ГОЛОВНА опція для компактних таблиць!

**Що робить:**
- ✅ Висота заголовка: **40px** (замість 48px)
- ✅ Відступи: **px-1** (замість px-4)
- ✅ Висота комірок: **py-2** (замість py-3)
- ✅ Фон заголовка: **#EBF3F6** (світло-блакитний)
- ✅ Округлені кути: **rounded-lg**
- ✅ Текст: **text-xs** (12px)

### compact

Додаткова опція для ще більшої компактності.

**Що робить:**
- ✅ Зменшує розмір шрифту до **text-xs** (якщо ще не xs)
- ✅ Працює разом з variant="minimal"

### stickyHeader

Фіксує заголовок при скролі.

**Що робить:**
- ✅ Заголовок залишається на місці при прокрутці
- ✅ z-index: 10

---

## 🎨 Налаштування колонок

### width - Фіксована ширина

```tsx
{
  key: 'id',
  header: '№',
  width: 60,        // Фіксована ширина 60px
}
```

**Можливі формати:**
- `width: 60` - число (px)
- `width: '150px'` - рядок з одиницями
- `width: '20%'` - відсоток

### align - Вирівнювання

```tsx
{
  key: 'price',
  header: 'Ціна',
  align: 'right',   // left | center | right
}
```

**За замовчуванням:** `center`

### sortable - Сортування

```tsx
{
  key: 'name',
  header: 'Назва',
  sortable: true,   // Додає іконку сортування
}
```

**Вимога:** Потрібен `accessor` для правильного сортування

---

## 📊 Порівняння варіантів

| Опція | Default | Minimal (Compact) |
|-------|---------|-------------------|
| Висота заголовка | 48px | **40px** |
| Відступи заголовка | px-4 | **px-1** |
| Відступи комірок | py-3 | **py-2** |
| Розмір шрифту | text-sm (14px) | **text-xs (12px)** |
| Фон заголовка | bg-background | **#EBF3F6** |
| Округлення | - | **rounded-lg** |

---

## 🚀 Приклади для різних таблиць

### 1. Google Tables (Solar Panels)

```tsx
const columns: Column<GoogleTable>[] = [
  { key: 'id', header: '№', width: 50, align: 'center' },
  { key: 'name', header: 'Назва', sortable: true, align: 'left' },
  { key: 'doc_url', header: 'Посилання', render: (r) => <LinkCell href={r.doc_url} truncate /> },
  { key: 'last_update', header: 'Оновлено', render: (r) => <DateCell date={r.last_update} />, width: 140 },
  { key: 'actions', header: 'Дії', render: (r) => <TableActions compact onEdit={() => {}} />, width: 100 },
];

<DataTable data={tables} columns={columns} keyExtractor={(r) => r.id} variant="minimal" compact stickyHeader />
```

### 2. Suppliers

```tsx
const columns: Column<Supplier>[] = [
  { key: 'id', header: '№', width: 50 },
  { key: 'name', header: 'Назва', sortable: true, align: 'left' },
  { key: 'cities', header: 'Міста', render: (r) => <TagsCell tags={r.cities} maxVisible={2} />, width: 200 },
  { key: 'contacts', header: 'Контакти', align: 'left' },
  { key: 'actions', header: 'Дії', render: (r) => <TableActions compact onEdit={() => {}} />, width: 100 },
];
```

### 3. Price History

```tsx
const columns: Column<PriceRecord>[] = [
  { key: 'date', header: 'Дата', render: (r) => <DateCell date={r.date} format="datetime" />, width: 140 },
  { key: 'product', header: 'Товар', sortable: true, align: 'left' },
  { key: 'price', header: 'Ціна', render: (r) => <NumberCell value={r.price} prefix="$" decimals={2} />, width: 100, align: 'right' },
  { key: 'change', header: 'Зміна', render: (r) => <NumberCell value={r.change} suffix="%" />, width: 80 },
];
```

---

## 💡 Поради

### 1. Використовуйте фіксовані ширини

**Рекомендовано:**
```tsx
{ key: 'id', header: '№', width: 50 }
{ key: 'actions', header: 'Дії', width: 100 }
```

**Чому:** Запобігає "стрибанню" колонок при завантаженні даних

### 2. Вирівнюйте числа праворуч

```tsx
{ key: 'price', header: 'Ціна', align: 'right' }
{ key: 'quantity', header: 'К-сть', align: 'right' }
```

### 3. Використовуйте готові cell компоненти

```tsx
<DateCell date={date} format="short" />        // Дати
<NumberCell value={123.45} decimals={2} />     // Числа
<LinkCell href={url} truncate />               // Посилання
<TagsCell tags={tags} maxVisible={2} />        // Теги
<StatusCell status="active" />                 // Статуси
```

### 4. Compact mode для дій

```tsx
<TableActions
  compact           // 🔥 Мінімальні відступи
  showMore         // Dropdown для багатьох дій
  onEdit={() => {}}
  onDelete={() => {}}
/>
```

---

## ⚠️ Поширені помилки

### ❌ Забули variant="minimal"

```tsx
// ПОГАНО - буде default дизайн
<DataTable data={data} columns={columns} keyExtractor={(r) => r.id} />

// ДОБРЕ - компактний дизайн
<DataTable data={data} columns={columns} keyExtractor={(r) => r.id} variant="minimal" />
```

### ❌ Не вказали width для фіксованих колонок

```tsx
// ПОГАНО - колонки "стрибають"
{ key: 'actions', header: 'Дії' }

// ДОБРЕ - фіксована ширина
{ key: 'actions', header: 'Дії', width: 100 }
```

### ❌ Забули accessor для sortable

```tsx
// ПОГАНО - сортування не працюватиме
{ key: 'name', header: 'Назва', sortable: true }

// ДОБРЕ - з accessor
{ key: 'name', header: 'Назва', accessor: (r) => r.name, sortable: true }
```

---

## 📏 Рекомендовані ширини колонок

| Тип колонки | Рекомендована ширина |
|-------------|---------------------|
| № (ID) | 50-60px |
| Дата | 120-140px |
| Ціна | 80-100px |
| Кількість | 60-80px |
| Дії (2 кнопки) | 100-120px |
| Дії (dropdown) | 60-80px |
| Назва (коротка) | 150-200px |
| Опис | 250-300px |
| Email/Phone | 150-180px |

---

## ✅ Чек-лист

Перед використанням компактної таблиці:

- [ ] Додав `variant="minimal"`
- [ ] Додав `compact` (опціонально)
- [ ] Додав `stickyHeader` (якщо багато рядків)
- [ ] Вказав `width` для всіх колонок
- [ ] Вказав `align` для числових колонок (right)
- [ ] Додав `accessor` для sortable колонок
- [ ] Використав готові cell компоненти
- [ ] Додав `compact` для TableActions
- [ ] Перевірив на малих екранах

---

**Готово! Тепер усі таблиці AI Analytic будуть компактними і акуратними! 🎉**
