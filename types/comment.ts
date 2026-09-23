export interface CommentItem {
  id: string;
  slug: string;
  author: string;
  email: string;
  site: string;
  content: string;
  createdAt: string;
  replyToId?: string;
  replyToAuthor?: string;
  replyToContent?: string;
}
