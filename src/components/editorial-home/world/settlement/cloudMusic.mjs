/** Original instrumental score; no recordings or external requests.
 * Shared C-major/A-minor pitches keep six-second weather crossfades consonant.
 * One musical clock continues across visual pauses and weather changes.
 */
export const CLOUD_MUSIC_THEMES = Object.freeze({
  day: {chord:[48,55,62,64], melody:[72,76,79,74,76,72,69,74], brightness:2400, pulse:1},
  sunset: {chord:[45,52,59,60], melody:[72,69,76,71,69,67,64,69], brightness:1600, pulse:.75},
  night: {chord:[40,47,55,62], melody:[76,null,71,null,79,null,74,null], brightness:1000, pulse:.48},
  sunrise: {chord:[41,48,57,64], melody:[69,72,74,76,79,76,74,72], brightness:2100, pulse:.85},
})
const frequency = midi => 440 * 2 ** ((midi-69)/12)

export function createCloudMusic(context, timers=globalThis){
  let disposed=false, audible=false, theme='day', step=0, nextTime=context.currentTime+.08
  let suspension
  const voices=new Map(), nodes=[]
  const own=node=>{nodes.push(node);return node}
  const master=own(context.createGain());master.gain.value=0;master.connect(context.destination)
  const space=own(context.createDelay(2));space.delayTime.value=.375
  const echo=own(context.createGain());echo.gain.value=.16
  const echoTone=own(context.createBiquadFilter());echoTone.type='lowpass';echoTone.frequency.value=1800
  space.connect(echoTone);echoTone.connect(echo);echo.connect(space);echo.connect(master)
  const room=own(context.createBiquadFilter());room.type='lowpass';room.frequency.value=3800
  room.connect(master);room.connect(space)
  const layers=Object.fromEntries(Object.entries(CLOUD_MUSIC_THEMES).map(([id,score])=>{
    const gain=own(context.createGain());gain.gain.value=id===theme?1:0
    const tone=own(context.createBiquadFilter());tone.type='lowpass';tone.frequency.value=score.brightness
    gain.connect(tone);tone.connect(room)
    return [id,gain]
  }))
  function note(midi, at, length, level, layer, plucked=false){
    const oscillator=context.createOscillator(), envelope=context.createGain()
    oscillator.type=plucked?'triangle':'sine';oscillator.frequency.value=frequency(midi)
    envelope.gain.setValueAtTime(0,at)
    envelope.gain.linearRampToValueAtTime(level,at+(plucked?.025:2.3))
    envelope.gain.exponentialRampToValueAtTime(.0001,at+length)
    oscillator.connect(envelope);envelope.connect(layer);voices.set(oscillator,envelope)
    oscillator.onended=()=>{oscillator.disconnect();envelope.disconnect();voices.delete(oscillator)}
    oscillator.start(at);oscillator.stop(at+length+.05)
  }
  function schedule(){
    if(disposed||!audible||context.state!=='running')return
    // Never replay a backlog after throttling/background suspension.
    if(nextTime<context.currentTime)nextTime=context.currentTime+.05
    while(nextTime<context.currentTime+.2){
      for(const [id,score] of Object.entries(CLOUD_MUSIC_THEMES)){
        const layer=layers[id], bar=Math.floor(step/8)
        if(step%8===0)for(const pitch of score.chord)note(pitch,nextTime,14,.032,layer)
        const pitch=score.melody[(step+(bar%4)*2)%8]
        if(pitch!==null)note(pitch,nextTime,3.6,.045*score.pulse,layer,true)
      }
      step++;nextTime+=1.5
    }
  }
  const interval=timers.setInterval(schedule,100)
  return {
    setScene(value, indoors=false){
      if(disposed)return
      const next=Object.hasOwn(CLOUD_MUSIC_THEMES,value)?value:'day'
      if(next!==theme){
        theme=next
        for(const [id,layer] of Object.entries(layers))layer.gain.setTargetAtTime(id===theme?1:0,context.currentTime,2)
      }
      room.frequency.setTargetAtTime(indoors?1700:3800,context.currentTime,2)
    },
    async setAudible(value){
      if(disposed)return false
      audible=value;timers.clearTimeout(suspension)
      if(!value){
        master.gain.setTargetAtTime(0,context.currentTime,.02)
        suspension=timers.setTimeout(()=>{if(!disposed&&!audible)void context.suspend().catch(()=>{})},120)
        return false
      }
      try{
        await context.resume()
        if(disposed||!audible)return false
        if(context.state!=='running')throw new Error('Audio not running')
        master.gain.setTargetAtTime(.42,context.currentTime,.6);schedule();return true
      }catch{audible=false;master.gain.value=0;return false}
    },
    inspect(){return {theme,audible,voices:voices.size,state:context.state,step}},
    dispose(){
      if(disposed)return
      disposed=true;audible=false;timers.clearInterval(interval);timers.clearTimeout(suspension)
      for(const [voice,envelope] of voices){try{voice.stop()}catch{}voice.disconnect();envelope.disconnect()}
      voices.clear();for(const node of nodes)node.disconnect()
      void context.close().catch(()=>{})
    },
  }
}
