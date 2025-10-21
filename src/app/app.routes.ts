import { Routes } from '@angular/router';
import { News } from './pages/news/news';
import { Trainees } from './pages/trainees/trainees';
import { SupportCards } from './pages/support-cards/support-cards';
import { UsefulInfo } from './pages/useful-info/useful-info';
import { abilityGuard } from './guards/ability.guard';
import { AbilityAction, AbilitySubject } from './interfaces/ability';

export const routes: Routes = [
  {
    path: 'news',
    data: { title: 'News' },
    children: [
      { path: '', component: News },
      {
        path: 'new',
        loadComponent: () => import('./pages/article-edit/article-edit').then(m => m.ArticleEditComponent),
        canActivate: [abilityGuard],
        data: {
          action: AbilityAction.Create,
          subject: AbilitySubject.Article,
          title: 'Create Article'
        }
      },
      { path: ':id', loadComponent: () => import('./pages/article-detail/article-detail').then(m => m.ArticleDetailComponent), data: { title: 'Article' } },
      {
        path: ':id/edit',
        loadComponent: () => import('./pages/article-edit/article-edit').then(m => m.ArticleEditComponent),
        canActivate: [abilityGuard],
        data: {
          action: AbilityAction.Update,
          subject: AbilitySubject.Article,
          title: 'Edit Article'
        }
      },
    ]
  },
  { path: 'trainees', component: Trainees, data: { title: 'Trainees' } },
  { path: 'support-cards', component: SupportCards, data: { title: 'Support Cards' } },
  { path: 'useful-info', component: UsefulInfo, data: { title: 'Useful Info' } },
  { path: '', redirectTo: '/news', pathMatch: 'full' }
];