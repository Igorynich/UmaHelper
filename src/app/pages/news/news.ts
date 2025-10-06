import { Component, inject } from '@angular/core';
import { UnderConstruction } from '../../components/common/under-construction/under-construction';
import { NewsService } from '../../services/news.service';

@Component({
  selector: 'app-news',
  imports: [UnderConstruction],
  templateUrl: './news.html',
  styleUrl: './news.css'
})
export class News {
  private newsService = inject(NewsService);

  constructor() {
  }
}
