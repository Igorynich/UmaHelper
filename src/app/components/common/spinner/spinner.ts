import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {SpinnerService} from '../../../services/spinner';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.html',
  styleUrls: ['./spinner.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  spinnerService = inject(SpinnerService);
}
