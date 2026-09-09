export interface PostMeta {
  id: string;
  slug: string;
  filename: string;
  title: string;
  date: string;
  author: string;
  categories: string[];
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
    desc: string;
  };
  hasMath?: boolean;
  pinned?: boolean;
  pinOrder?: number;
}

export interface PostDetail extends PostMeta {
  contentHtml: string;
  toc: {
    id: string;
    title: string;
    depth: number;
  }[];
}
