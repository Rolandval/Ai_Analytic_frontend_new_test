import { DataTable, Column } from '../DataTable';
import { TableActions } from '../TableActions';
import { DateCell, NumberCell } from '../TableCellVariants';

/**
 * ПРИКЛАД КОМПАКТНОЇ ТАБЛИЦІ ДЛЯ AI ANALYTIC
 * 
 * Максимально компактний дизайн без чекбоксів
 * Мінімальні відступи та скроли
 * Акуратний вигляд як у Content Filler
 */

interface PriceData {
  id: number;
  product: string;
  supplier: string;
  price: number;
  quantity: number;
  lastUpdate: string;
  status: string;
}

const CompactTableExample = () => {
  const data: PriceData[] = [
    {
      id: 1,
      product: 'Сонячна панель JA Solar 550W',
      supplier: 'Постачальник А',
      price: 125.50,
      quantity: 100,
      lastUpdate: '2024-01-15T10:30:00',
      status: 'active',
    },
    // ... більше даних
  ];

  // Опис колонок з компактними налаштуваннями
  const columns: Column<PriceData>[] = [
    {
      key: 'id',
      header: '№',
      accessor: (row) => row.id,
      width: 60,
      align: 'center',
    },
    {
      key: 'product',
      header: 'Назва товару',
      accessor: (row) => row.product,
      sortable: true,
      align: 'left',
      className: 'font-medium',
    },
    {
      key: 'supplier',
      header: 'Постачальник',
      accessor: (row) => row.supplier,
      sortable: true,
      width: 150,
    },
    {
      key: 'price',
      header: 'Ціна, $',
      render: (row) => (
        <NumberCell value={row.price} decimals={2} prefix="$" />
      ),
      sortable: true,
      width: 100,
      align: 'right',
    },
    {
      key: 'quantity',
      header: 'К-сть',
      accessor: (row) => row.quantity,
      sortable: true,
      width: 80,
      align: 'center',
    },
    {
      key: 'lastUpdate',
      header: 'Оновлено',
      render: (row) => (
        <DateCell date={row.lastUpdate} format="short" />
      ),
      sortable: true,
      width: 120,
    },
    {
      key: 'actions',
      header: 'Дії',
      render: (row) => (
        <TableActions
          compact
          onEdit={() => console.log('Edit', row.id)}
          onDelete={() => console.log('Delete', row.id)}
        />
      ),
      width: 100,
      align: 'center',
    },
  ];

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Компактна таблиця (як у Content Filler)</h2>
        <p className="text-sm text-muted-foreground">
          Мінімальні відступи, фіксовані ширини колонок, компактний дизайн
        </p>
      </div>

      {/* КОМПАКТНА ТАБЛИЦЯ З МІНІМАЛЬНИМИ ВІДСТУПАМИ */}
      <DataTable
        data={data}
        columns={columns}
        keyExtractor={(row) => row.id.toString()}
        variant="minimal"        // 🔥 Використовуємо minimal варіант!
        compact                  // 🔥 Компактний режим
        stickyHeader            // 🔥 Фіксований заголовок
        emptyMessage="Немає даних для відображення"
      />
    </div>
  );
};

export default CompactTableExample;

/**
 * КЛЮЧОВІ ОСОБЛИВОСТІ КОМПАКТНОГО ВАРІАНТУ:
 * 
 * 1. ✅ variant="minimal" - компактний дизайн
 * 2. ✅ Фіксовані ширини колонок (width: 100)
 * 3. ✅ Мінімальні відступи (px-1, py-2)
 * 4. ✅ Висота заголовка 40px (h-10)
 * 5. ✅ Текст 12px (text-xs)
 * 6. ✅ Округлені кути заголовка
 * 7. ✅ Світлий фон заголовків (#EBF3F6)
 * 8. ✅ Центрування тексту за замовчуванням
 * 9. ✅ Hover ефекти
 * 10. ✅ Автоматичне сортування
 * 
 * ПОРІВНЯННЯ З CONTENT FILLER:
 * - ✅ Однакова висота рядків
 * - ✅ Однакові відступи
 * - ✅ Однакові кольори
 * - ❌ БЕЗ чекбоксів (як і потрібно)
 * - ✅ Акуратний вигляд
 */
