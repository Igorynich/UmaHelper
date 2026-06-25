export interface RaceFactor {
  effect_1: string; // Например, "冬ウマ娘○"
  effect_2: string; // Например, "power"
}

export interface Race {
  alts?: any[];
  banner_id: number;
  course: number;
  course_id: number;
  did_not_exist?: string;
  direction: number;
  distance: number;
  entries: number;
  factor?: RaceFactor;
  grade: number;
  group: number;
  id: number;
  list_ura: string[];
  name_en: string;
  name_jp: string;
  name_ko?: string;
  name_tw?: string;
  race_id: number;
  season: number;
  terrain: number;
  tid: string;
  time: number;
  track: number;
  unreleased_servers?: string[];
  url_name: string;
}
