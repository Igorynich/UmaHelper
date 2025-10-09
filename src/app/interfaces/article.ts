import { User } from './user';
import { Timestamp } from 'firebase/firestore';

export interface Article {
  id: string;
  title: string;
  created: Timestamp;
  edited: Timestamp;
  text: string;
  author: User;
}

export interface ArticleData extends Omit<Article, 'author'> {
  authorId: string;
}
