export interface PostMeta {
  id: string;
  slug: string;
  filename: string;
  title: string;
  date: string;
  updatedDate?: string;
  author: string;
  categories: string[];
  tags: string[];
  readTime: string;
  readMinutes?: number;
  wordCount?: number;
  excerpt: string;
  topic: 'gesp' | 'csp' | 'java' | 'algo' | 'python-data';
  topicName: string;
  subtopic: string;
  previewImg: string | null;
  previewGraphic: {
    symbol: string;
    title: string;
    desc: string;
  };
  hasMath?: boolean;
  pinned?: boolean;
  pinOrder?: number;
}

export interface PostCardMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  readTime: string;
  excerpt: string;
  topic: 'gesp' | 'csp' | 'java' | 'algo' | 'python-data';
  topicName: string;
  subtopic: string;
  previewImg: string | null;
  previewGraphic: {
    symbol: string;
    title: string;
  };
}

export interface PostDetail extends PostMeta {
  contentHtml: string;
  toc: {
    id: string;
    title: string;
    depth: number;
  }[];
  faqItems?: {
    question: string;
    answer: string;
  }[];
  prevPost?: PostMeta | null;
  nextPost?: PostMeta | null;
  relatedPosts?: PostMeta[];
}
