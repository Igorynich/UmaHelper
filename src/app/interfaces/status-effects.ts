export type StatusEffect = {
  name: string;
  desc: string;
};

export const STATUS_EFFECTS: Record<number, StatusEffect> = {
  1: {
    name: 'Night Owl',
    desc: 'Random chance to lower energy by 10 or to lower the trainee\'s mood as long as the condition persists'
  },
  2: {
    name: 'Slacker',
    desc: 'Trainee may not show up for stat training and waste the turn'
  },
  4: {
    name: 'Slow Metabolism',
    desc: 'Speed stat cannot be increased'
  },
  6: {
    name: 'Practice Poor',
    desc: 'Increases the chance to fail stat training by 2%'
  },
  7: {
    name: 'Fast Learner',
    desc: 'Reduces cost of learning skills by 10%'
  },
  8: {
    name: 'Charming ○',
    desc: 'Increases bond gain with supports by 2'
  },
  9: {
    name: 'Hot Topic',
    desc: 'Increases bond gain with Director Akikawa and Etsuko Otonashi by 40%'
  },
  10: {
    name: 'Practice Perfect ○',
    desc: 'Reduces chance to fail stat training by 2%'
  },
  11: {
    name: 'Practice Perfect ◎',
    desc: 'Reduces chance to fail stat training by 4%'
  },
  12: {
    name: 'Under the Weather',
    desc: 'Increases the chance to fail trainings by 5%'
  },
  13: {
    name: 'Shining Brightly',
    desc: 'Reduces the chance to fail stat training by 5%'
  },
  // 14-18 Smart Falcon 1st secret event
  14: {
    name: 'Fan Promise (Hokkaido)',
    desc: 'Win a race held at the Sapporo or Hakodate racetrack to gain 10 Speed and Guts, 1 Mood level, 10 Skill Points, and a level 5 hint for the respective racetrack green skill'
  },
  15: {
    name: 'Fan Promise (Hokuto)',
    desc: 'Win a race held at the Fukushima, Niigata, or Morioka racetracks to gain 10 Speed and Stamina, 1 Mood level, 10 Skill Points, and a level 5 hint for the respective racetrack green skill'
  },
  16: {
    name: 'Fan Promise (Nakayama)',
    desc: 'Win a race held at the Nakayama or Funabashi racetracks to gain 10 Power and Guts, 1 Mood level, 10 Skill Points, and a level 5 hint for the respective racetrack green skill'
  },
  17: {
    name: 'Fan Promise (Kansai)',
    desc: 'Win a race held at the Kyoto or Hanshin racetrack to gain 10 Stamina and Wisdom, 1 Mood level, 10 Skill Points, and a level 5 hint for the respective racetrack green skill'
  },
  18: {
    name: 'Fan Promise (Kokura)',
    desc: 'Win a race held at the Kokura racetrack to gain 10 Stamina and Guts, 1 Mood level, 10 Skill Points, and a level 5 hint for the respective racetrack green skill'
  },
  // meisho doto Feeling Dizzy
  19: {
    name: 'Not Ready',
    desc: 'Random chance to lower energy by 5 after a race long as the condition persists'
  },
  // Copano Rickey In the Circle of Light
  21: {
    name: 'Ominous Portent',
    desc: 'Winning races becomes difficult'
  },
  // Smart Falcon and grandlive version
  22: {
    name: 'Idol\'s Promise (Kawasaki)',
    desc: 'Win a race held at the Kawasaki racetrack to gain 10 Power and Wisdom, 1 Mood level, 10 Skill Points, and a level 5 hint for the respective racetrack green skill'
  },
  100: {
    name: 'Pure Passion: Team Sirius',
    desc: 'Able to do Friendship Training with Team Sirius, and immune to Night Owl and Slacker'
  },
  101: {
    name: 'Pure Passion: Heirs to the Throne',
    desc: 'Able to do Friendship Training with Heirs to the Throne, and immune to Night Owl and Slacker'
  }
}
