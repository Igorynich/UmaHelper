import { Trainee } from './trainee';

export interface DisplayTrainee extends Trainee {
  traineeId: number; // card_id used as row identifier
  imageUrl: string;
}
