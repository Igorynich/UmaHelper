export enum SurfaceAptitude {
  Turf = 'turf',
  Dirt = 'dirt',
}

export enum DistanceAptitude {
  Sprint = 'sprint',
  Mile = 'mile',
  Medium = 'medium',
  Long = 'long',
}

export enum StrategyAptitude {
  Front = 'front',
  Pace = 'pace',
  Late = 'late',
  End = 'end',
}

export enum AptitudeGrade {
  G = 'G',
  F = 'F',
  E = 'E',
  D = 'D',
  C = 'C',
  B = 'B',
  A = 'A',
}

export const APTITUDE_GRADE_ORDER: AptitudeGrade[] = [
  AptitudeGrade.G,
  AptitudeGrade.F,
  AptitudeGrade.E,
  AptitudeGrade.D,
  AptitudeGrade.C,
  AptitudeGrade.B,
  AptitudeGrade.A,
];
