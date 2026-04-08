import {inject, Injectable} from '@angular/core';
import {collection, doc, Firestore, getDoc, getDocs} from '@angular/fire/firestore';
import {from, Observable, shareReplay} from 'rxjs';
import {Trainee} from '../interfaces/trainee';
import {map, tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TraineeService {
  private firestore = inject(Firestore);

  private readonly TRAINEE_COLLECTION = 'trainees';
  private traineesCache$: Observable<Trainee[]> | null = null;
  private individualTraineeCache = new Map<string, { data$: Observable<Trainee | null>, timestamp: number }>();
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 час в мс

  getRawTrainees(): Observable<Trainee[]> {
    const currentTime = Date.now();

    if (this.traineesCache$ && (currentTime - this.lastFetchTime < this.CACHE_DURATION)) {
      console.log('Returning TRAINEES cache');
      return this.traineesCache$;
    }

    const traineesCollection = collection(this.firestore, this.TRAINEE_COLLECTION);

    this.traineesCache$ = from(getDocs(traineesCollection)).pipe(
      map(snapshot => snapshot.docs.map(t => this.prepareTraineeForDisplay(t.data()))),
      tap(() => this.lastFetchTime = Date.now()),
      shareReplay(1)
    );
    console.log('Fetched Trainees');
    return this.traineesCache$;
  }

  getTraineeById(id: string): Observable<Trainee | null> {
    const currentTime = Date.now();

    // 1. Проверяем, есть ли живой общий кэш всех стажеров
    if (this.traineesCache$ && (currentTime - this.lastFetchTime < this.CACHE_DURATION)) {
      console.log('Returning from all trainees cache');
      return this.traineesCache$.pipe(
        map(trainees => trainees.find(t => t.itemData?.card_id === +id) || null)
      );
    }

    // 2. Проверяем персональный кэш для этого конкретного стажера
    const cached = this.individualTraineeCache.get(id);
    if (cached && (currentTime - cached.timestamp < this.CACHE_DURATION)) {
      console.log('Returning trainee individual cache');
      return cached.data$;
    }

    // 3. Если ничего нет — делаем точечный запрос к Firestore
    const traineeDocRef = doc(this.firestore, `${this.TRAINEE_COLLECTION}/${id}`);
    const trainee$ = from(getDoc(traineeDocRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return this.prepareTraineeForDisplay({ ...data, id: docSnap.id }) as Trainee;
        }
        return null;
      }),
      shareReplay(1)
    );
    console.log('Fetching individual trainee');
    this.individualTraineeCache.set(id, { data$: trainee$, timestamp: currentTime });
    return trainee$;
  }

  /**
   * Returns the ImageKit URL for the trainee's image.
   * @param trainee The trainee object.
   * @returns The URL for the trainee's image.
   */
  getTraineeImageUrl(trainee: Trainee): string {
    return `/trainees/char_${trainee.itemData.char_id}_${trainee.itemData.card_id}.png`;
    // imageUrl: `${IMAGEKIT_CONFIG.urlEndpoint}/trainees/char_${t.itemData.char_id}_${t.itemData.card_id}.png`,     // char_1033_103301.png
  }

  private prepareTraineeForDisplay(trainee: any): Trainee {
    // Basic preparation - can be extended later if needed
    return trainee as Trainee;
  }
}
