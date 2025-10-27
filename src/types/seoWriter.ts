export type Platform = 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'google_business' | 'blog';

export type ArticleStatus = 'draft' | 'editing' | 'approved' | 'published';
export type TopicStatus = 'approved' | 'pending' | 'rejected';
export type ContentPlanStatus = 'scheduled' | 'published' | 'failed';

export interface Topic {
  id: string;
  title: string;
  keywords: string[];
  category: string;
  status: TopicStatus;
  createdAt: Date;
  platforms: Platform[];
}

export interface Article {
  id: string;
  topicId: string;
  title: string;
  content: string;
  status: ArticleStatus;
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
  status: ContentPlanStatus;
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

export interface DashboardStats {
  plannedPosts: number;
  publishedPosts: number;
  draftPosts: number;
  recentTopics: Topic[];
  recentArticles: Article[];
}
