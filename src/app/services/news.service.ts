import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Article, ArticleData } from '../interfaces/article';
import { combineLatest, from, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  Firestore,
  serverTimestamp,
  updateDoc, addDoc
} from '@angular/fire/firestore';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private firestore: Firestore = inject(Firestore);
  private injector = inject(Injector);
  private userService = inject(UserService);

  getArticles(): Observable<Article[]> {
    return runInInjectionContext(this.injector, () => {
      const articlesCollection = collection(this.firestore, 'articles');
      return (collectionData(articlesCollection, { idField: 'id' }) as Observable<ArticleData[]>).pipe(
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
        })
      );
    });
  }

  getArticle(id: string): Observable<Article | undefined> {
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
        })
      );
    });
  }

  addArticle(article: Omit<Article, 'id' | 'created' | 'edited' | 'author'> & { authorId: string }): Observable<Article> {
    const articlesCollection = collection(this.firestore, 'articles');
    const newArticle = {
      ...article,
      created: serverTimestamp(),
      edited: serverTimestamp(),
    };
    return from(addDoc(articlesCollection, newArticle)).pipe(
      switchMap(docRef => this.getArticle(docRef.id).pipe(
        map(newlyAddedArticle => newlyAddedArticle!)
      ))
    );
  }

  updateArticle(article: Pick<Article, 'id' | 'title' | 'text'>): Observable<void> {
    const articleDoc = doc(this.firestore, `articles/${article.id}`);
    return from(updateDoc(articleDoc, { ...article, edited: serverTimestamp() }));
  }

  deleteArticle(id: string): Observable<void> {
    const articleDoc = doc(this.firestore, `articles/${id}`);
    return from(deleteDoc(articleDoc));
  }
}
