import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Article, ArticleData } from '../interfaces/article';
import { TweetArticle, TweetArticleData } from '../interfaces/tweet-article';
import { combineLatest, from, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

// Special author for tweet articles - @umamusume_eng
const TWEET_AUTHOR_ID = 'umamusume_eng';
const TWEET_AUTHOR = {
  uid: TWEET_AUTHOR_ID,
  displayName: 'Umamusume: Pretty Derby Official',
  email: null,
  photoURL: 'https://pbs.twimg.com/profile_images/2050023529194864640/9n2Bt8lY_400x400.jpg',
  role: 'admin' as any
};
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  Firestore,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from '@angular/fire/firestore';
import { UserService } from './user.service';
import { SpinnerService } from './spinner';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private firestore: Firestore = inject(Firestore);
  private injector = inject(Injector);
  private userService = inject(UserService);
  private spinnerService = inject(SpinnerService);

  getArticles(): Observable<Article[]> {
    this.spinnerService.show();
    return runInInjectionContext(this.injector, () => {
      const articlesCollection = collection(this.firestore, 'articles');
      const q = query(articlesCollection, orderBy('created', 'desc'));
      return (collectionData(q, { idField: 'id' }) as Observable<ArticleData[]>).pipe(
        switchMap((articles: ArticleData[]) => {
          if (articles.length === 0) {
            return of([]);
          }
          // This is not optimal, as it can lead to N+1 queries.
          // For a small number of articles, it's fine, but for a large number, you should optimize this.
          const authorObservables = articles.map(article =>
            this.userService.getUser(article.authorId).pipe(
              map(author => {
                if (!author) {
                  return null;
                }
                const { authorId, ...rest } = article;
                return { ...rest, author } as Article;
              })
            )
          );
          return combineLatest(authorObservables).pipe(
            map(articlesWithAuthor => articlesWithAuthor.filter((a): a is Article => a !== null))
          );
        }),
        tap(() => this.spinnerService.hide())
      );
    });
  }

  getArticle(id: string): Observable<Article | undefined> {
    this.spinnerService.show();
    return runInInjectionContext(this.injector, () => {
      const articleDoc = doc(this.firestore, `articles/${id}`);
      return (docData(articleDoc, { idField: 'id' }) as Observable<ArticleData | undefined>).pipe(
        switchMap((article: ArticleData | undefined) => {
          if (!article) {
            return of(undefined);
          }
          return this.userService.getUser(article.authorId).pipe(
            map(author => {
              if (!author) {
                return undefined;
              }
              const { authorId, ...rest } = article;
              return { ...rest, author } as Article;
            })
          );
        }),
        tap(() => this.spinnerService.hide())
      );
    });
  }

  addArticle(article: Omit<Article, 'id' | 'created' | 'edited' | 'author'> & { authorId: string }): Observable<Article> {
    this.spinnerService.show();
    const articlesCollection = collection(this.firestore, 'articles');
    const newArticle = {
      ...article,
      created: serverTimestamp(),
      edited: serverTimestamp(),
    };
    return from(addDoc(articlesCollection, newArticle)).pipe(
      switchMap(docRef => this.getArticle(docRef.id).pipe(
        map(newlyAddedArticle => newlyAddedArticle!)
      )),
      tap(() => this.spinnerService.hide())
    );
  }

  updateArticle(article: Pick<Article, 'id' | 'title' | 'text'>): Observable<void> {
    this.spinnerService.show();
    const articleDoc = doc(this.firestore, `articles/${article.id}`);
    return from(updateDoc(articleDoc, { ...article, edited: serverTimestamp() })).pipe(
      tap(() => this.spinnerService.hide())
    );
  }

  deleteArticle(id: string): Observable<void> {
    this.spinnerService.show();
    const articleDoc = doc(this.firestore, `articles/${id}`);
    return from(deleteDoc(articleDoc)).pipe(
      tap(() => this.spinnerService.hide())
    );
  }

  getTweetArticles(): Observable<TweetArticle[]> {
    this.spinnerService.show();
    return runInInjectionContext(this.injector, () => {
      const tweetArticlesCollection = collection(this.firestore, 'tweetArticles');
      const q = query(tweetArticlesCollection, orderBy('created', 'desc'));
      return (collectionData(q, { idField: 'id' }) as Observable<TweetArticleData[]>).pipe(
        switchMap((tweetArticles: TweetArticleData[]) => {
          if (tweetArticles.length === 0) {
            return of([]);
          }
          const authorObservables = tweetArticles.map(tweetArticle => {
            if (tweetArticle.authorId === TWEET_AUTHOR_ID) {
              return of(TWEET_AUTHOR).pipe(
                map(author => {
                  const { authorId, ...rest } = tweetArticle;
                  return { ...rest, author } as TweetArticle;
                })
              );
            }
            return this.userService.getUser(tweetArticle.authorId).pipe(
              map(author => {
                if (!author) {
                  return null;
                }
                const { authorId, ...rest } = tweetArticle;
                return { ...rest, author } as TweetArticle;
              })
            );
          });
          return combineLatest(authorObservables).pipe(
            map(articlesWithAuthor => articlesWithAuthor.filter((a): a is TweetArticle => a !== null))
          );
        }),
        tap(() => this.spinnerService.hide())
      );
    });
  }

  getTweetArticle(id: string): Observable<TweetArticle | undefined> {
    this.spinnerService.show();
    return runInInjectionContext(this.injector, () => {
      const tweetArticleDoc = doc(this.firestore, `tweetArticles/${id}`);
      return (docData(tweetArticleDoc, { idField: 'id' }) as Observable<TweetArticleData | undefined>).pipe(
        switchMap((tweetArticle: TweetArticleData | undefined) => {
          if (!tweetArticle) {
            return of(undefined);
          }
          if (tweetArticle.authorId === TWEET_AUTHOR_ID) {
            return of(TWEET_AUTHOR).pipe(
              map(author => {
                const { authorId, ...rest } = tweetArticle;
                return { ...rest, author } as TweetArticle;
              })
            );
          }
          return this.userService.getUser(tweetArticle.authorId).pipe(
            map(author => {
              if (!author) {
                return undefined;
              }
              const { authorId, ...rest } = tweetArticle;
              return { ...rest, author } as TweetArticle;
            })
          );
        }),
        tap(() => this.spinnerService.hide())
      );
    });
  }

  addTweetArticle(tweetArticle: Omit<TweetArticle, 'id' | 'created' | 'edited' | 'author'> & { authorId: string }): Observable<TweetArticle> {
    this.spinnerService.show();
    const tweetArticlesCollection = collection(this.firestore, 'tweetArticles');
    const newTweetArticle = {
      ...tweetArticle,
      created: serverTimestamp(),
      edited: serverTimestamp(),
    };
    return from(addDoc(tweetArticlesCollection, newTweetArticle)).pipe(
      switchMap(docRef => this.getTweetArticle(docRef.id).pipe(
        map(newlyAddedTweetArticle => newlyAddedTweetArticle!)
      )),
      tap(() => this.spinnerService.hide())
    );
  }

  updateTweetArticle(tweetArticle: Pick<TweetArticle, 'id' | 'text' | 'imageUrl' | 'imageSmallUrl' | 'imageLargeUrl' | 'tweetUrl'>): Observable<void> {
    this.spinnerService.show();
    const tweetArticleDoc = doc(this.firestore, `tweetArticles/${tweetArticle.id}`);
    return from(updateDoc(tweetArticleDoc, { ...tweetArticle, edited: serverTimestamp() })).pipe(
      tap(() => this.spinnerService.hide())
    );
  }

  deleteTweetArticle(id: string): Observable<void> {
    this.spinnerService.show();
    const tweetArticleDoc = doc(this.firestore, `tweetArticles/${id}`);
    return from(deleteDoc(tweetArticleDoc)).pipe(
      tap(() => this.spinnerService.hide())
    );
  }
}
