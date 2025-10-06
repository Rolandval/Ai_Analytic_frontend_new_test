const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'ai-product-filler', 'Generation.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Замінюємо коментар категорії на перемикач
const oldPattern = '              {/* Категорія */}';
const newPattern = `              {/* Перемикач між товарами та категоріями */}
              <EntityTypeToggle 
                entityType={entityType} 
                onEntityTypeChange={setEntityType} 
              />
              
              {/* Категорія (тільки для товарів) */}
              {entityType === 'products' && (`;

content = content.replace(oldPattern, newPattern);

// Додаємо закриваючу дужку перед коментарем "Модель/Мови для перекладу"
const selectEndPattern = /(\s+)<\/Select>\s+(\s+)\{\/\* Модель\/Мови для перекладу \*\/\}/;
content = content.replace(selectEndPattern, '$1</Select>\n$2)}\n$2{/* Модель/Мови для перекладу */}');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Файл оновлено успішно!');
