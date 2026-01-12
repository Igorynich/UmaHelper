import { inject, Injectable } from '@angular/core';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { from, Observable, of, switchMap, map } from 'rxjs';
import { DecodedEvent, DecodedEventsContainer, EventChoice, EventReward, UmaEvent } from '../interfaces/event';
import { effectTypeMap } from '../maps/skill-effect.map';
import { Skill } from '../interfaces/skill';
import { SkillsService } from './skills.service';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private firestore = inject(Firestore);
  private skillsService = inject(SkillsService);

  getAndDecodeEvents(cardId: string): Observable<DecodedEventsContainer | null> {
    return this.getEventsByCardId(cardId).pipe(
      switchMap(rawEvents => {
        console.log('rawEvents', rawEvents);
        if (!rawEvents) return of(null);

        const eventData = rawEvents.en || rawEvents;
        const allEvents: UmaEvent[] = [...(eventData.random || []), ...(eventData.arrows || [])];

        const skillIds = allEvents
          .flatMap(event => event.c.flatMap(choice => choice.r))
          .filter(reward => reward.t === 'sk' && reward.d)
          .map(reward => reward.d!);

        const uniqueSkillIds = [...new Set(skillIds)];

        if (uniqueSkillIds.length === 0) {
          return of(this.decodeEvents(rawEvents, new Map()));
        }

        return this.skillsService.getSkillsByIds(uniqueSkillIds).pipe(
          map(skills => {
            const skillMap = new Map(skills.map(s => [s.id, s]));
            return this.decodeEvents(rawEvents, skillMap);
          })
        );
      })
    );
  }

  private getEventsByCardId(cardId: string): Observable<any | null> {
    const eventDocRef = doc(this.firestore, `events/${cardId}`);
    return from(getDoc(eventDocRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return docSnap.data();
        } else {
          return null;
        }
      })
    );
  }

  decodeEvents(events: any, skillMap?: Map<number, Skill>): DecodedEventsContainer {
    const rewardMap: { [key: string]: string } = {
      sp: 'Speed',
      st: 'Stamina',
      gu: 'Guts',
      in: 'Wit',
      po: 'Power',
      en: 'Energy',
      pt: 'Skill Points',
      bo: 'Bond',
      sk: 'Skill Hint',
      di: '--- OR ---',
      ee: 'Event Ended',
      mo: 'Mood',
      me: 'Maximum Energy',
      brf: 'Branching Result Future',
      brp: 'Branching Result Past',
      ds: 'Can Start Dating',
      ha: 'Heal all negative status effects',
      he: 'Heal a negative status effect',
      se: 'Get Charming ○ status',
      sg: 'Skill Gain',
      sr: 'Skill Random'    // TODO: make custom template
    };

    const eventData = events.en || events;

    const mapEvent = (event: UmaEvent): DecodedEvent => ({
      name: event.n,
      choices: event.c.map((choice: EventChoice) => ({
        text: choice.o,
        rewards: choice.r.map((reward: EventReward) => {
          if (reward.t === 'sk' && reward.d) {
            const skill = skillMap?.get(reward.d);
            if (skill) {
              return {
                type: 'skill',
                skill: skill,
                value: ` Hint ${reward.v}`
              };
            }
          }

          // Fallback for skill not found or other types
          const type = rewardMap[reward.t];
          if (!type) {
            console.warn(`Unknown reward type encountered: ${reward.t}`);
          }
          let result = `${type || `Unknown (${reward.t})`}`;
          if (reward.v) result += ` ${reward.v}`;
          if (reward.d) result += ` (ID: ${reward.d})`;
          return result;
        })
      }))
    });

    return {
      random: (eventData.random || []).map(mapEvent),
      arrows: (eventData.arrows || []).map(mapEvent)
    };
  }
}
