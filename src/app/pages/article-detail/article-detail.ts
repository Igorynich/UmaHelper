import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NewsService } from '../../services/news.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { AbilityService } from '../../services/ability.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import {of} from 'rxjs';

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
  private sanitizer = inject(DomSanitizer);
  abilityService = inject(AbilityService);

  article = toSignal(
    this.route.paramMap.pipe(
      switchMap(params => {
        const articleId = params.get('id');
        return articleId ? this.newsService.getArticle(articleId) : of(undefined);
      })
    )
  );

  safeArticleContent = computed(() => {
    const text = this.article()?.text;
    return text ? this.sanitizer.bypassSecurityTrustHtml(text) : '';
  });
}
