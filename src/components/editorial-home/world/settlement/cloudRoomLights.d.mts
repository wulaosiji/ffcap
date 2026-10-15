import type {Scene} from 'three'
import type {CloudLayout,CloudDestination} from './cloudLayout.mjs'
export function createCloudRoomLights(scene:Scene,fixtures:NonNullable<CloudLayout['lights']>,destinations:CloudDestination[]):{update(daylight:number):void;dispose():void}
