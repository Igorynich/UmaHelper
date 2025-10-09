import { Component, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { NewsService } from '../../services/news.service';
import { ConfirmationDialog } from '../../components/common/confirmation-dialog/confirmation-dialog';
import { AbilityService } from '../../services/ability.service';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatPaginatorModule,
  ],
  templateUrl: './news.html',
  styleUrls: ['./news.css']
})
export class News {
  private newsService = inject(NewsService);
  private dialog = inject(MatDialog);
  abilityService = inject(AbilityService);

  articles = toSignal(this.newsService.getArticles(), { initialValue: [] });

  pageIndex = signal(0);
  pageSize = signal(5);

  paginatedArticles = computed(() => {
    const articles = this.articles();
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

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.newsService.deleteArticle(id).subscribe();
      }
    });
  }
}