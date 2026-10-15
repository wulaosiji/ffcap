import type {CloudWeatherPhase} from './cloudWeather.mjs';
export const CLOUD_MUSIC_THEMES: Record<CloudWeatherPhase, {chord:number[];melody:(number|null)[];brightness:number;pulse:number}>;
export interface CloudMusic {
  setScene(theme:CloudWeatherPhase, indoors?:boolean):void;
  setAudible(value:boolean):Promise<boolean>;
  inspect():{theme:CloudWeatherPhase;audible:boolean;voices:number;state:AudioContextState;step:number};
  dispose():void;
}
export function createCloudMusic(context:AudioContext):CloudMusic;
