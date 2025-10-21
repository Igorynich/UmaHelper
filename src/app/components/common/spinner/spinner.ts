import { Component, inject } from '@angular/core';
import {SpinnerService} from '../../../services/spinner';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.html',
  styleUrls: ['./spinner.css'],
  standalone: true,
})
export class SpinnerComponent {
  spinnerService = inject(SpinnerService);
}
