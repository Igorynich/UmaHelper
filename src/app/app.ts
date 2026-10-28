import {Component, signal, ChangeDetectionStrategy, inject} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/layout/header/header';
import { SpinnerComponent } from './components/common/spinner/spinner';
import { Footer } from './components/layout/footer/footer';
import {ServiceWorkerService} from './services/service-worker.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, SpinnerComponent],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.css'
})
export class App {
  private sw = inject(ServiceWorkerService);

  protected readonly title = signal('UmaHelper');
}
