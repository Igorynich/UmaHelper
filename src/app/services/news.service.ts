import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private http = inject(HttpClient);
  private apiUrl = 'https://umamusume.com/api/ajax/pr_info_detail?format=json';
  private apiUrl1 = 'https://umapyoi.net/api/v1/news';
  private apiNewsLatest = 'https://umapyoi.net/api/v1/news/latest/5';

  getNewsDetails(announceId: number): Observable<any> {
    const payload = { announce_id: announceId };
    return this.http.post(this.apiUrl, payload);
  }

  getNewsDetails1(): Observable<any> {
    return this.http.get(this.apiUrl1);
  }

  getLatestNews(): Observable<any> {
    return this.http.get(this.apiNewsLatest);
  }
}
