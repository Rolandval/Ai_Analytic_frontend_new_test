// Діагностика збереження категорійних промптів
// Запустити в консолі браузера на сторінці Templates

console.log('🔍 Debugging Templates save process...');

// Функція для перевірки стану Templates компонента
const debugTemplatesState = () => {
  console.log('📋 Current page location:', window.location.pathname);
  
  // Перевіряємо чи ми на правильній сторінці
  if (!window.location.pathname.includes('templates')) {
    console.warn('⚠️ Not on Templates page! Go to /ai-product-filler/templates');
    return;
  }
  
  // Перевіряємо DOM елементи
  const categoryTab = document.querySelector('[role="tab"]:nth-child(2)'); // Category tab
  const saveButton = document.querySelector('button:contains("Зберегти")') || 
                    document.querySelector('button[class*="bg-emerald"]') ||
                    document.querySelector('button[class*="green"]');
  
  console.log('🎯 UI Elements check:');
  console.log('  Category tab found:', !!categoryTab);
  console.log('  Save button found:', !!saveButton);
  
  // Перевіряємо textarea поля
  const textareas = document.querySelectorAll('textarea');
  console.log('📝 Textareas found:', textareas.length);
  
  textareas.forEach((textarea, i) => {
    const value = textarea.value;
    console.log(`  Textarea ${i + 1}: ${value.length} chars - "${value.substring(0, 50)}..."`);
  });
  
  // Перевіряємо активний таб
  const activeTab = document.querySelector('[role="tab"][aria-selected="true"]');
  console.log('📑 Active tab:', activeTab?.textContent?.trim());
  
  return {
    categoryTab,
    saveButton,
    textareas: Array.from(textareas),
    activeTab: activeTab?.textContent?.trim()
  };
};

// Функція для симуляції збереження
const simulateSave = () => {
  console.log('🚀 Simulating save process...');
  
  const elements = debugTemplatesState();
  
  if (!elements.saveButton) {
    console.error('❌ Save button not found!');
    return;
  }
  
  if (elements.activeTab !== 'Категорія' && elements.activeTab !== 'Category') {
    console.warn('⚠️ Not on Category tab! Current tab:', elements.activeTab);
    console.log('💡 Click on Category tab first');
    return;
  }
  
  console.log('✅ Ready to save. Clicking save button...');
  
  // Додаємо слухач для перехоплення логів
  const originalLog = console.log;
  const logs = [];
  console.log = (...args) => {
    logs.push(args);
    originalLog(...args);
  };
  
  // Натискаємо кнопку збереження
  elements.saveButton.click();
  
  // Відновлюємо console.log через 2 секунди
  setTimeout(() => {
    console.log = originalLog;
    console.log('📊 Captured logs during save:');
    logs.forEach((log, i) => {
      if (log[0] && log[0].includes && log[0].includes('Templates')) {
        console.log(`  ${i + 1}.`, ...log);
      }
    });
  }, 2000);
};

// Функція для перевірки API endpoints
const testCategoryAPI = async () => {
  console.log('🌐 Testing category API endpoints...');
  
  try {
    // Тест створення промпта
    const testPrompt = {
      name: 'Debug Test Category Prompt',
      prompt: 'Test prompt for debugging category save process',
      site_column_name: 'meta_description',
      lang_code: 'ua',
      is_active: true,
      is_category: true
    };
    
    console.log('📡 Creating test category prompt...');
    const createResponse = await fetch('/api/content/create_site_content_prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPrompt)
    });
    
    if (createResponse.ok) {
      const result = await createResponse.json();
      console.log('✅ Test prompt created:', result);
      
      // Перевіряємо чи з'явився в категорійних промптах
      const checkResponse = await fetch('/api/content/get_site_category_prompts/meta_description/ua');
      if (checkResponse.ok) {
        const categoryPrompts = await checkResponse.json();
        console.log('✅ Category prompts now:', categoryPrompts.length);
        const ourPrompt = categoryPrompts.find(p => p.name === testPrompt.name);
        console.log('🎯 Our test prompt found:', !!ourPrompt);
      }
    } else {
      console.error('❌ Failed to create test prompt:', createResponse.status, createResponse.statusText);
      const errorText = await createResponse.text();
      console.error('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
};

// Запуск діагностики
console.log('🏁 Starting Templates debug...');
debugTemplatesState();

console.log('\n💡 Available commands:');
console.log('  debugTemplatesState() - Check current state');
console.log('  simulateSave() - Simulate save button click');
console.log('  testCategoryAPI() - Test API directly');
