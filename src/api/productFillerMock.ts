// Mock storage for AI Product Filler templates using localStorage

export type Lang = 'ua' | 'ru' | 'en';
export type Entity = 'product' | 'category';

export type ProductFieldKey =
  | 'name'
  | 'shortname'
  | 'short_description'
  | 'full_description'
  | 'meta_keywords'
  | 'meta_description'
  | 'search_words'
  | 'page_title'
  | 'age_warning_message'
  | 'promo_text'
  | 'unit_name'
  | 'feedback'
  | 'rating';

export type CategoryFieldKey =
  | 'category'
  | 'description'
  | 'page_title'
  | 'meta_title'
  | 'meta_keywords'
  | 'custom_h1'
  | 'seo_name'
  | 'age_warning_message'
  | 'meta_description';

export type ProductTemplates = Record<ProductFieldKey, string>;
export type CategoryTemplates = Record<CategoryFieldKey, string>;

export type TemplatesStore = {
  product: Record<Lang, ProductTemplates>;
  category: Record<Lang, CategoryTemplates>;
};

const STORAGE_KEY = 'ai_pf_templates_v1';

const DEFAULTS: TemplatesStore = {
  product: {
    ua: {
      name: '[product] — розумна назва продукту',
      shortname: '[shortname]',
      short_description:
        '[product]. Згенеруй розумний цікавий опис товару на 500 символів. Максимально використай характеристики товару. Дай тільки результат.',
      full_description: '[full_description]',
      meta_keywords: '[meta_keywords]',
      meta_description: '[meta_description]',
      search_words: '[search_words]',
      page_title: '[page_title]',
      age_warning_message: '[age_warning_message]',
      promo_text: '[promo_text]',
      unit_name: '[unit_name]',
      feedback: 'Згенеруй відгук користувача про [product]. Зроби його реалістичним і корисним.',
      rating: 'Оціни [product] за 5-бальною шкалою та поясни оцінку.'
    },
    ru: {
      name: '[product] — умное название продукта',
      shortname: '[shortname]',
      short_description:
        '[product]. Сгенерируй понятное интересное описание товара на 500 символов. Максимально используй характеристики товара. Дай только результат.',
      full_description: '[full_description]',
      meta_keywords: '[meta_keywords]',
      meta_description: '[meta_description]',
      search_words: '[search_words]',
      page_title: '[page_title]',
      age_warning_message: '[age_warning_message]',
      promo_text: '[promo_text]',
      unit_name: '[unit_name]',
      feedback: 'Сгенерируй отзыв пользователя о [product]. Сделай его реалистичным и полезным.',
      rating: 'Оцени [product] по 5-балльной шкале и объясни оценку.'
    },
    en: {
      name: '[product] — smart product name',
      shortname: '[shortname]',
      short_description:
        '[product]. Generate a clear and engaging product description of about 500 characters. Maximize the use of product characteristics. Provide only the result.',
      full_description: '[full_description]',
      meta_keywords: '[meta_keywords]',
      meta_description: '[meta_description]',
      search_words: '[search_words]',
      page_title: '[page_title]',
      age_warning_message: '[age_warning_message]',
      promo_text: '[promo_text]',
      unit_name: '[unit_name]',
      feedback: 'Generate a user review for [product]. Make it realistic and helpful.',
      rating: 'Rate [product] on a 5-point scale and explain the rating.'
    }
  },
  category: {
    ua: {
      category: 'Згенеруй назву категорії на основі [category]',
      description: 'Опис категорії [category]. Зроби його інформативним та корисним для користувачів.',
      page_title: 'Назва сторінки для категорії [category] — SEO оптимізована',
      meta_title: 'Meta заголовок для [category] — до 60 символів',
      meta_keywords: 'ключові слова для [category], через кому',
      custom_h1: 'Користувацький H1 заголовок для категорії [category]',
      seo_name: 'SEO імя для категорії [category] — латиницею, через дефіс',
      age_warning_message: '[age_warning_message]',
      meta_description: 'Meta опис для категорії [category] — зрозумілий, до 160 символів.'
    },
    ru: {
      category: 'Сгенерируй название категории на основе [category]',
      description: 'Описание категории [category]. Сделай его информативным и полезным для пользователей.',
      page_title: 'Название страницы для категории [category] — SEO оптимизированное',
      meta_title: 'Meta заголовок для [category] — до 60 символов',
      meta_keywords: 'ключевые слова для [category], через запятую',
      custom_h1: 'Пользовательский H1 заголовок для категории [category]',
      seo_name: 'SEO имя для категории [category] — латиницей, через дефис',
      age_warning_message: '[age_warning_message]',
      meta_description: 'Мета описание для категории [category] — до 160 символов.'
    },
    en: {
      category: 'Generate category name based on [category]',
      description: 'Category description for [category]. Make it informative and useful for users.',
      page_title: 'Page title for category [category] — SEO optimized',
      meta_title: 'Meta title for [category] — up to 60 characters',
      meta_keywords: 'keywords for [category], comma separated',
      custom_h1: 'Custom H1 heading for category [category]',
      seo_name: 'SEO name for category [category] — in Latin, hyphen-separated',
      age_warning_message: '[age_warning_message]',
      meta_description: 'Meta description for category [category] — up to 160 characters.'
    }
  }
};

function readStore(): TemplatesStore {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as TemplatesStore;
    return {
      product: { ...DEFAULTS.product, ...parsed.product },
      category: { ...DEFAULTS.category, ...parsed.category }
    };
  } catch {
    return DEFAULTS;
  }
}

function writeStore(store: TemplatesStore) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getTemplates(entity: 'product', lang: Lang): ProductTemplates;
export function getTemplates(entity: 'category', lang: Lang): CategoryTemplates;
export function getTemplates(entity: Entity, lang: Lang) {
  const store = readStore();
  return store[entity][lang];
}

export function setTemplates(entity: 'product', lang: Lang, data: ProductTemplates): void;
export function setTemplates(entity: 'category', lang: Lang, data: CategoryTemplates): void;
export function setTemplates(entity: Entity, lang: Lang, data: any) {
  const store = readStore();
  // Shallow merge per entity/lang
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (store as any)[entity][lang] = { ...(store as any)[entity][lang], ...data };
  writeStore(store);
}

export const PRODUCT_VARIABLES = [
  '[product] - Product name',
  '[shortname] - Product shortname',
  '[short_description] - Product short description',
  '[full_description] - Product full description',
  '[meta_keywords] - Product meta-tag Keywords',
  '[meta_description] - Product meta description',
  '[search_words] - Product search words',
  '[page_title] - Product page title',
  '[age_warning_message] - Product age warning message',
  '[promo_text] - Product promo text',
  '[unit_name] - Product unit name'
];

export const CATEGORY_VARIABLES = [
  '[category] - Category name',
  '[description] - Category description',
  '[page_title] - Category page title',
  '[meta_title] - Category meta title',
  '[meta_keywords] - Category meta keywords',
  '[custom_h1] - Category custom H1 heading',
  '[seo_name] - Category SEO name'
];
