import { Routes } from '@angular/router';
import { News } from './pages/news/news';
import { Trainees } from './pages/trainees/trainees';
import { SupportCards } from './pages/support-cards/support-cards';
import { UsefulInfo } from './pages/useful-info/useful-info';

export const routes: Routes = [
  {
    path: 'news',
    children: [
      { path: '', component: News },
      { path: 'new', loadComponent: () => import('./pages/article-edit/article-edit').then(m => m.ArticleEditComponent) },
      { path: ':id', loadComponent: () => import('./pages/article-detail/article-detail').then(m => m.ArticleDetailComponent) },
      { path: ':id/edit', loadComponent: () => import('./pages/article-edit/article-edit').then(m => m.ArticleEditComponent) },
    ]
  },
  { path: 'trainees', component: Trainees },
  { path: 'support-cards', component: SupportCards },
  { path: 'useful-info', component: UsefulInfo },
  { path: '', redirectTo: '/news', pathMatch: 'full' }
];