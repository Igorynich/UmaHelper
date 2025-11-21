import { Routes } from '@angular/router';
import { abilityGuard } from './guards/ability.guard';
import { AbilityAction, AbilitySubject } from './interfaces/ability';

export const routes: Routes = [
  {
    path: 'news',
    data: { title: 'News' },
    children: [
      { path: '', loadComponent: () => import('./pages/news/news').then(m => m.News) },
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
  { path: 'trainees', redirectTo: '/under-construction', pathMatch: 'full' },
  { path: 'support-cards', redirectTo: '/under-construction', pathMatch: 'full' },
  { path: 'useful-info', loadComponent: () => import('./pages/useful-info/useful-info').then(m => m.UsefulInfo), data: { title: 'Useful Info' } },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin').then(m => m.AdminComponent),
    canActivate: [abilityGuard],
    data: {
      action: AbilityAction.Manage,
      subject: AbilitySubject.All,
      title: 'Admin'
    }
  },
  {
    path: 'conditions',
    loadComponent: () => import('./pages/conditions/conditions').then(m => m.ConditionsComponent),
    data: { title: 'Conditions' }
  },
  { path: 'skills', loadComponent: () => import('./pages/skills/skills').then(m => m.SkillsComponent), data: { title: 'Skills' } },
  {
    path: 'under-construction',
    loadComponent: () => import('./components/common/under-construction/under-construction').then(m => m.UnderConstruction),
    data: { title: 'Under Construction' }
  },
  { path: '', redirectTo: '/news', pathMatch: 'full' }
];