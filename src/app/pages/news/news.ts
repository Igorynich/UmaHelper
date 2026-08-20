import { Component, inject, signal, computed, ChangeDetectionStrategy, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { NewsService } from '../../services/news.service';
import { ConfirmationDialog } from '../../components/common/confirmation-dialog/confirmation-dialog';
import { AbilityService } from '../../services/ability.service';
import { TweetArticleDisplay } from '../../components/common/tweet-article-display/tweet-article-display';
import { Article } from '../../interfaces/article';
import { TweetArticle } from '../../interfaces/tweet-article';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-news',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatPaginatorModule,
    TweetArticleDisplay,
  ],
  templateUrl: './news.html',
  styleUrls: ['./news.css']
})
export class News {
  private newsService = inject(NewsService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  abilityService = inject(AbilityService);

  articles = toSignal(this.newsService.getArticles(), { initialValue: [] });
  tweetArticles = toSignal(this.newsService.getTweetArticles(), { initialValue: [] });

  pageIndex = signal(0);
  pageSize = signal(5);

  mergedArticles = computed(() => {
    const regularArticles = this.articles();
    const tweets = this.tweetArticles();

    const merged: Array<{ type: 'article' | 'tweet'; data: Article | TweetArticle; id: string; created: any }> = [];

    regularArticles.forEach(article => {
      merged.push({ type: 'article', data: article, id: article.id, created: article.created });
    });

    tweets.forEach(tweet => {
      merged.push({ type: 'tweet', data: tweet, id: tweet.id, created: tweet.created });
    });

    return merged.sort((a, b) => b.created.toMillis() - a.created.toMillis());
  });

  paginatedArticles = computed(() => {
    const articles = this.mergedArticles();
    if (!articles) {
      return [];
    }
    const startIndex = this.pageIndex() * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return articles.slice(startIndex, endIndex);
  });

  handlePageEvent(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  deleteArticle(id: string) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Delete Article',
        message: 'Are you sure you want to delete this article? This action cannot be undone.',
        confirmButtonText: 'Delete'
      }
    });

    const dialogResult = toSignal(dialogRef.afterClosed(), { initialValue: null });
    effect(() => {
      const result = dialogResult();
      if (result) {
        this.newsService.deleteArticle(id).subscribe();
      }
    });
  }

  editTweetArticle(id: string) {
    this.router.navigate(['/news/tweet', id, 'edit']);
  }

  deleteTweetArticle(id: string) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Delete Tweet Article',
        message: 'Are you sure you want to delete this tweet article? This action cannot be undone.',
        confirmButtonText: 'Delete'
      }
    });

    const dialogResult = toSignal(dialogRef.afterClosed(), { initialValue: null });
    effect(() => {
      const result = dialogResult();
      if (result) {
        this.newsService.deleteTweetArticle(id).subscribe();
      }
    });
  }

  asTweet(article: Article | TweetArticle): TweetArticle {
    return article as TweetArticle;
  }

  asArticle(article: Article | TweetArticle): Article {
    return article as Article;
  }
}
