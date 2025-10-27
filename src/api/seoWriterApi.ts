// Mock API для SEO Writer + Auto Poster

export interface Topic {
  id: string;
  title: string;
  keywords: string[];
  category: string;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: Date;
  platforms: Platform[];
}

export interface Article {
  id: string;
  topicId: string;
  title: string;
  content: string;
  status: 'draft' | 'editing' | 'approved' | 'published';
  platforms: Platform[];
  scheduledDate?: Date;
  publishedDate?: Date;
  mediaUrls: string[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentPlan {
  id: string;
  date: Date;
  articleId: string;
  platforms: Platform[];
  status: 'scheduled' | 'published' | 'failed';
  scheduledTime: string;
}

export interface Analytics {
  postId: string;
  platform: Platform;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  date: Date;
}

export type Platform = 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'google_business' | 'blog';

// Mock data
export const mockTopics: Topic[] = [
  {
    id: '1',
    title: 'Як вибрати сонячні панелі для дому',
    keywords: ['сонячні панелі', 'енергія', 'дім'],
    category: 'енергетика',
    status: 'approved',
    createdAt: new Date('2025-10-20'),
    platforms: ['facebook', 'instagram', 'blog']
  },
  {
    id: '2',
    title: 'Топ 5 акумуляторів для резервного живлення',
    keywords: ['акумулятори', 'резервне живлення'],
    category: 'енергетика',
    status: 'pending',
    createdAt: new Date('2025-10-22'),
    platforms: ['instagram', 'linkedin']
  },
  {
    id: '3',
    title: 'Інвертори: що це і навіщо вони потрібні',
    keywords: ['інвертори', 'електроенергія'],
    category: 'технологія',
    status: 'approved',
    createdAt: new Date('2025-10-21'),
    platforms: ['tiktok', 'blog']
  }
];

export const mockArticles: Article[] = [
  {
    id: 'art1',
    topicId: '1',
    title: 'Як вибрати сонячні панелі для дому - Повний гайд',
    content: 'Сонячні панелі - це інвестиція у майбутнє вашої сім\'ї...',
    status: 'approved',
    platforms: ['facebook', 'instagram', 'blog'],
    scheduledDate: new Date('2025-10-25'),
    mediaUrls: ['https://via.placeholder.com/1200x630'],
    version: 2,
    createdAt: new Date('2025-10-20'),
    updatedAt: new Date('2025-10-22')
  },
  {
    id: 'art2',
    topicId: '2',
    title: 'Топ 5 акумуляторів - Огляд 2025',
    content: 'У цій статті розглянемо найкращі акумулятори на ринку...',
    status: 'draft',
    platforms: ['instagram', 'linkedin'],
    mediaUrls: [],
    version: 1,
    createdAt: new Date('2025-10-22'),
    updatedAt: new Date('2025-10-22')
  },
  {
    id: 'art3',
    topicId: '3',
    title: 'Інвертори: Все що потрібно знати',
    content: 'Інвертор - це пристрій, який перетворює постійний струм...',
    status: 'editing',
    platforms: ['tiktok', 'blog'],
    mediaUrls: ['https://via.placeholder.com/1080x1920'],
    version: 1,
    createdAt: new Date('2025-10-21'),
    updatedAt: new Date('2025-10-21')
  }
];

export const mockContentPlan: ContentPlan[] = [
  {
    id: 'plan1',
    date: new Date('2025-10-25'),
    articleId: 'art1',
    platforms: ['facebook', 'instagram'],
    status: 'scheduled',
    scheduledTime: '09:00'
  },
  {
    id: 'plan2',
    date: new Date('2025-10-26'),
    articleId: 'art2',
    platforms: ['instagram', 'linkedin'],
    status: 'scheduled',
    scheduledTime: '14:00'
  },
  {
    id: 'plan3',
    date: new Date('2025-10-27'),
    articleId: 'art3',
    platforms: ['tiktok'],
    status: 'published',
    scheduledTime: '18:00'
  }
];

export const mockAnalytics: Analytics[] = [
  {
    postId: 'plan3',
    platform: 'tiktok',
    reach: 5420,
    likes: 342,
    comments: 89,
    shares: 45,
    clicks: 234,
    date: new Date('2025-10-27')
  },
  {
    postId: 'plan1',
    platform: 'instagram',
    reach: 1230,
    likes: 156,
    comments: 34,
    shares: 12,
    clicks: 89,
    date: new Date('2025-10-25')
  }
];

// API Functions (mock)
export const getTopics = async (): Promise<Topic[]> => {
  return new Promise(resolve => setTimeout(() => resolve(mockTopics), 500));
};

export const getArticles = async (): Promise<Article[]> => {
  return new Promise(resolve => setTimeout(() => resolve(mockArticles), 500));
};

export const getContentPlan = async (): Promise<ContentPlan[]> => {
  return new Promise(resolve => setTimeout(() => resolve(mockContentPlan), 500));
};

export const getAnalytics = async (): Promise<Analytics[]> => {
  return new Promise(resolve => setTimeout(() => resolve(mockAnalytics), 500));
};

export const generateTopics = async (keywords: string): Promise<Topic[]> => {
  const newTopics: Topic[] = [
    {
      id: Date.now().toString(),
      title: `Стаття про ${keywords}`,
      keywords: keywords.split(',').map(k => k.trim()),
      category: 'інше',
      status: 'pending',
      createdAt: new Date(),
      platforms: []
    }
  ];
  return new Promise(resolve => setTimeout(() => resolve(newTopics), 1000));
};

export const createArticle = async (topicId: string, title: string, content: string): Promise<Article> => {
  const newArticle: Article = {
    id: Date.now().toString(),
    topicId,
    title,
    content,
    status: 'draft',
    platforms: [],
    mediaUrls: [],
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  return new Promise(resolve => setTimeout(() => resolve(newArticle), 500));
};

export const updateArticle = async (id: string, updates: Partial<Article>): Promise<Article> => {
  const article = mockArticles.find(a => a.id === id);
  if (!article) throw new Error('Article not found');
  
  const updated = { ...article, ...updates, updatedAt: new Date() };
  return new Promise(resolve => setTimeout(() => resolve(updated), 500));
};

export const publishArticle = async (id: string): Promise<Article> => {
  return updateArticle(id, { status: 'published', publishedDate: new Date() });
};
