import { Component, inject, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Editor, Toolbar } from 'ngx-editor';
import { NewsService } from '../../services/news.service';
import { Article } from '../../interfaces/article';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { NgxEditorModule } from 'ngx-editor';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-article-edit',
  standalone: true,
  imports: [
    RouterLink, 
    MatCardModule, 
    MatButtonModule, 
    CommonModule, 
    NgxEditorModule, 
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './article-edit.html',
  styleUrls: ['./article-edit.css']
})
export class ArticleEditComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private newsService = inject(NewsService);

  article = signal<Article | undefined>(undefined);
  editor: Editor;
  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];

  form = new FormGroup({
    title: new FormControl('', Validators.required),
    text: new FormControl('', Validators.required),
  });

  constructor() {
    this.editor = new Editor();
    const articleId = this.route.snapshot.paramMap.get('id');
    if (articleId && articleId !== 'new') {
      this.newsService.getArticle(articleId).subscribe(article => {
        if (article) {
          this.article.set(article);
          this.form.patchValue({
            title: article.title,
            text: article.text
          });
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }

  save() {
    if (this.form.valid) {
      const articleValue = this.article();
      if (articleValue) {
        const updatedArticle: Article = {
          ...articleValue,
          title: this.form.value.title || '',
          text: this.form.value.text || ''
        };
        this.newsService.updateArticle(updatedArticle).subscribe(() => {
          this.router.navigate(['/news', articleValue.id]);
        });
      } else {
        // Create new article
        this.newsService.addArticle({
          title: this.form.value.title || '',
          text: this.form.value.text || ''
        }).subscribe((newArticle) => {
          this.router.navigate(['/news', newArticle.id]);
        });
      }
    }
  }
}
