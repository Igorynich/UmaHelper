import { Component, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { TweetArticle } from '../../../interfaces/tweet-article';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Lightbox } from '../lightbox/lightbox';

@Component({
  selector: 'app-tweet-article-display',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    Lightbox
  ],
  templateUrl: './tweet-article-display.html',
  styleUrls: ['./tweet-article-display.css']
})
export class TweetArticleDisplay {
  tweetArticle = input.required<TweetArticle>();
}
