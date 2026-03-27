import {Component, effect, inject} from '@angular/core';
import {TraineeService} from '../../services/trainee.service';
import {toSignal} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-trainees',
  imports: [],
  templateUrl: './trainees.html',
  styleUrl: './trainees.css'
})
export class Trainees {

  private traineeService: TraineeService = inject(TraineeService);

  traineesSignal = toSignal(this.traineeService.getRawTrainees());

  constructor() {
    effect(() => {
      console.log('Trainees component initialized', this.traineesSignal());
    });

  }
}
