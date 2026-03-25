import { inject, Injectable } from '@angular/core';
import { collection, collectionData, doc, Firestore, getDoc } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { Trainee } from '../interfaces/trainee';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TraineeService {
  private firestore = inject(Firestore);

  private readonly TRAINEE_COLLECTION = 'trainees';

  getRawTrainees(): Observable<Trainee[]> {
    const traineesCollection = collection(this.firestore, this.TRAINEE_COLLECTION);
    return (collectionData(traineesCollection) as Observable<any[]>).pipe(
      map(trainees => trainees.map(t => this.prepareTraineeForDisplay(t)))
    );
  }

  getTraineeById(id: string): Observable<Trainee | null> {
    const traineeDocRef = doc(this.firestore, `${this.TRAINEE_COLLECTION}/${id}`);
    return from(getDoc(traineeDocRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return this.prepareTraineeForDisplay(data) as Trainee;
        } else {
          return null;
        }
      })
    );
  }

  private prepareTraineeForDisplay(trainee: any): Trainee {
    // Basic preparation - can be extended later if needed
    return trainee as Trainee;
  }
}
