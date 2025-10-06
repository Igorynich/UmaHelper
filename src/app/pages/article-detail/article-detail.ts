import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NewsService } from '../../services/news.service';
import { Article } from '../../interfaces/article';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, CommonModule],
  templateUrl: './article-detail.html',
  styleUrls: ['./article-detail.css']
})
export class ArticleDetailComponent {
  private route = inject(ActivatedRoute);
  private newsService = inject(NewsService);

  article = signal<Article | undefined>(undefined);

  constructor() {
    const articleId = this.route.snapshot.paramMap.get('id');
    if (articleId) {
      this.newsService.getArticle(articleId).subscribe(article => {
        this.article.set(article);
      });
    }
  }
}
