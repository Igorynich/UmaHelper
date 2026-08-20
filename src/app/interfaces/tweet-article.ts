import { User } from './user';
import { Timestamp } from 'firebase/firestore';

export interface TweetArticle {
  id: string;
  text: string;
  imageUrl: string;
  imageSmallUrl: string;
  imageLargeUrl: string;
  tweetUrl: string;
  created: Timestamp;
  edited: Timestamp;
  author: User;
}

export interface TweetArticleData extends Omit<TweetArticle, 'author'> {
  authorId: string;
}
