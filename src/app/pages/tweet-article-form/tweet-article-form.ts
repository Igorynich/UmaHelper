import { Component, inject, signal, computed, ChangeDetectionStrategy, effect, input } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NewsService } from '../../services/news.service';
import { TweetArticle } from '../../interfaces/tweet-article';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AbilityService } from '../../services/ability.service';
import { toSignal } from '@angular/core/rxjs-interop';

// Default author for tweet articles - @umamusume_eng
const TWEET_AUTHOR_ID = 'umamusume_eng';

@Component({
  selector: 'app-tweet-article-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './tweet-article-form.html',
  styleUrls: ['./tweet-article-form.scss']
})
export class TweetArticleForm {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private newsService = inject(NewsService);
  private abilityService = inject(AbilityService);

  mode = signal<'create' | 'edit'>('create');
  tweetArticle = signal<TweetArticle | undefined>(undefined);

  form = new FormGroup({
    text: new FormControl('', Validators.required),
    imageUrl: new FormControl('', Validators.required),
    tweetUrl: new FormControl('', [Validators.required, Validators.pattern('https?://.+')])
  });

  imageSmallUrl = signal('');
  imageLargeUrl = signal('');

  imageUrl = toSignal(this.form.controls.imageUrl.valueChanges, { initialValue: '' });

  title = computed(() => this.mode() === 'create' ? 'Create Tweet Article' : 'Edit Tweet Article');

  constructor() {
    // Determine mode from route data
    const routeData = this.route.snapshot.data;
    this.mode.set(routeData['mode'] || 'create');

    // Load article data if in edit mode
    if (this.mode() === 'edit') {
      const tweetArticleId = this.route.snapshot.paramMap.get('id');
      if (tweetArticleId) {
        const tweetArticle = toSignal(this.newsService.getTweetArticle(tweetArticleId), { initialValue: undefined });
        effect(() => {
          const article = tweetArticle();
          if (article) {
            this.tweetArticle.set(article);
            this.form.patchValue({
              text: article.text,
              imageUrl: article.imageUrl,
              tweetUrl: article.tweetUrl
            });
            this.imageSmallUrl.set(article.imageSmallUrl);
            this.imageLargeUrl.set(article.imageLargeUrl);
          }
        });
      }
    }

    // Parse image URL when it changes
    effect(() => {
      const url = this.imageUrl();
      if (url) {
        this.parseImageUrl(url);
      }
    });
  }

  private parseImageUrl(url: string) {
    const twitterImagePattern = /(https:\/\/pbs\.twimg\.com\/media\/[^?]+)(\?.*)?/;
    const match = url.match(twitterImagePattern);

    if (match) {
      const baseUrl = match[1];
      this.imageSmallUrl.set(`${baseUrl}?format=jpg&name=small`);
      this.imageLargeUrl.set(`${baseUrl}?format=jpg&name=large`);
    } else {
      this.imageSmallUrl.set(url);
      this.imageLargeUrl.set(url);
    }
  }

  save() {
    if (this.form.valid) {
      const currentMode = this.mode();

      if (currentMode === 'create') {
        if (!this.abilityService.ability().can(this.abilityService.AbilityAction.Create, this.abilityService.AbilitySubject.Article)) {
          console.warn('Permission denied: Cannot create tweet article.');
          return;
        }

        this.newsService.addTweetArticle({
          text: this.form.value.text || '',
          imageUrl: this.form.value.imageUrl || '',
          imageSmallUrl: this.imageSmallUrl(),
          imageLargeUrl: this.imageLargeUrl(),
          tweetUrl: this.form.value.tweetUrl || '',
          authorId: TWEET_AUTHOR_ID
        }).subscribe(() => {
          this.router.navigate(['/news']);
        });
      } else if (currentMode === 'edit') {
        const articleValue = this.tweetArticle();
        if (articleValue) {
          if (!this.abilityService.ability().can(this.abilityService.AbilityAction.Update, this.abilityService.AbilitySubject.Article)) {
            console.warn('Permission denied: Cannot update tweet article.');
            return;
          }
          this.newsService.updateTweetArticle({
            id: articleValue.id,
            text: this.form.value.text || '',
            imageUrl: this.form.value.imageUrl || '',
            imageSmallUrl: this.imageSmallUrl(),
            imageLargeUrl: this.imageLargeUrl(),
            tweetUrl: this.form.value.tweetUrl || ''
          }).subscribe(() => {
            this.router.navigate(['/news']);
          });
        }
      }
    }
  }
}
