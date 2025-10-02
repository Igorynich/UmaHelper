import { Routes } from '@angular/router';
import { News } from './pages/news/news';
import { Trainees } from './pages/trainees/trainees';
import { SupportCards } from './pages/support-cards/support-cards';
import { UsefulInfo } from './pages/useful-info/useful-info';

export const routes: Routes = [
  { path: 'news', component: News },
  { path: 'trainees', component: Trainees },
  { path: 'support-cards', component: SupportCards },
  { path: 'useful-info', component: UsefulInfo },
  { path: '', redirectTo: '/news', pathMatch: 'full' }
];
