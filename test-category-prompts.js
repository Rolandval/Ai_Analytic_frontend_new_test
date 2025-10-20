// Тестовий скрипт для перевірки категорійних промптів
// Запустити в консолі браузера на сторінці додатку

console.log('🧪 Testing category prompts API...');

const testCategoryPromptsAPI = async () => {
  try {
    console.log('🔍 Testing all category-related endpoints...');
    
    // Тест 1: Перевіряємо звичайні промпти
    console.log('📡 1. Testing regular prompts endpoint...');
    try {
      const regularResponse = await fetch('/api/content/get_site_content_prompts/meta_description/ua');
      const regularData = await regularResponse.json();
      console.log('✅ Regular prompts for meta_description:', regularData?.length || 0, 'items');
    } catch (e) {
      console.warn('⚠️ Regular prompts failed:', e.message);
    }

    // Тест 2: Перевіряємо категорійні промпти
    console.log('📡 2. Testing category prompts endpoint...');
    try {
      const categoryResponse = await fetch('/api/content/get_site_category_prompts/meta_description/ua');
      
      if (!categoryResponse.ok) {
        console.error('❌ Category prompts endpoint failed:', categoryResponse.status, categoryResponse.statusText);
        const errorText = await categoryResponse.text();
        console.error('Error details:', errorText);
      } else {
        const categoryData = await categoryResponse.json();
        console.log('✅ Category prompts for meta_description:', categoryData?.length || 0, 'items');
        if (categoryData?.length > 0) {
          console.log('Sample category prompt:', categoryData[0]);
        }
      }
    } catch (e) {
      console.error('❌ Category prompts request failed:', e.message);
    }

    // Тест 3: Створюємо тестовий категорійний промпт
    console.log('📡 3. Creating test category prompt...');
    try {
      const createResponse = await fetch('/api/content/create_site_content_prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Test Category Meta Description',
          prompt: 'Створи мета-опис для категорії [category]. Опис повинен бути привабливим та SEO-оптимізованим, до 160 символів.',
          site_column_name: 'meta_description',
          lang_code: 'ua',
          is_active: true,
          is_category: true
        })
      });

      if (!createResponse.ok) {
        console.error('❌ Create category prompt failed:', createResponse.status, createResponse.statusText);
        const errorText = await createResponse.text();
        console.error('Error details:', errorText);
      } else {
        const createData = await createResponse.json();
        console.log('✅ Created category prompt:', createData);
      }
    } catch (e) {
      console.error('❌ Create prompt request failed:', e.message);
    }

    // Тест 4: Перевіряємо оновлені категорійні промпти
    console.log('📡 4. Checking updated category prompts...');
    try {
      const checkResponse = await fetch('/api/content/get_site_category_prompts/meta_description/ua');
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        console.log('✅ Updated category prompts:', checkData?.length || 0, 'items');
        checkData?.forEach((prompt, i) => {
          console.log(`  ${i + 1}. ${prompt.name} (active: ${prompt.is_active}, category: ${prompt.is_category})`);
        });
      }
    } catch (e) {
      console.warn('⚠️ Check updated prompts failed:', e.message);
    }

    console.log('🏁 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Функція для тестування всіх колонок
const testAllCategoryColumns = async () => {
  const columns = ['meta_description', 'short_description', 'meta_keywords', 'page_title'];
  
  console.log('🧪 Testing all category columns...');
  
  for (const column of columns) {
    console.log(`\n📋 Testing column: ${column}`);
    try {
      const response = await fetch(`/api/content/get_site_category_prompts/${column}/ua`);
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${column}: ${data?.length || 0} category prompts`);
      } else {
        console.log(`❌ ${column}: ${response.status} ${response.statusText}`);
      }
    } catch (e) {
      console.log(`❌ ${column}: ${e.message}`);
    }
  }
};

// Запустити основний тест
console.log('🚀 Starting category prompts test...');
testCategoryPromptsAPI();

// Також можна запустити тест всіх колонок
// testAllCategoryColumns();
