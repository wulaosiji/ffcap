import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createCloudMusic,CLOUD_MUSIC_THEMES} from '../src/components/editorial-home/world/settlement/cloudMusic.mjs'

function fixture(){
  const params=[],nodes=[],timeouts=new Map();let tick,serial=0
  const param=()=>{const p={value:0,events:[],setValueAtTime(...v){this.events.push(['set',...v])},linearRampToValueAtTime(...v){this.events.push(['ramp',...v])},exponentialRampToValueAtTime(...v){this.events.push(['exp',...v])},setTargetAtTime(...v){this.events.push(['target',...v])}};params.push(p);return p}
  const node=()=>{const n={gain:param(),frequency:param(),delayTime:param(),connect(){},disconnect(){this.disconnected=true},start(at){this.started=at},stop(at){this.stopped=at}};nodes.push(n);return n}
  const context={currentTime:0,state:'suspended',destination:{},createGain:node,createDelay:node,createBiquadFilter:node,createOscillator:node,async resume(){this.state='running'},async suspend(){this.state='suspended'},async close(){this.state='closed'}}
  const timers={setInterval(fn){tick=fn;return 1},clearInterval(){tick=undefined},setTimeout(fn){timeouts.set(++serial,fn);return serial},clearTimeout(id){timeouts.delete(id)}}
  return {context,nodes,params,timers,tick:()=>tick?.(),flush:()=>{for(const fn of timeouts.values())fn();timeouts.clear()}}
}

test('four original instrumental themes share a pitch family and vary density/brightness',()=>{
  assert.deepEqual(Object.keys(CLOUD_MUSIC_THEMES).sort(),['day','night','sunrise','sunset'])
  for(const score of Object.values(CLOUD_MUSIC_THEMES)){
    assert.equal(score.melody.length,8)
    assert.ok(score.chord.every(n=>n>=36&&n<72))
    assert.ok([...score.chord,...score.melody].filter(n=>n!==null).every(n=>[0,2,4,5,7,9,11].includes(n%12)))
  }
  assert.ok(CLOUD_MUSIC_THEMES.night.brightness<CLOUD_MUSIC_THEMES.day.brightness)
  assert.equal(CLOUD_MUSIC_THEMES.night.melody.filter(n=>n===null).length,4)
})

test('silent until opt-in; weather crossfade preserves clock; mute suspends and dispose releases resources',async()=>{
  const f=fixture(),music=createCloudMusic(f.context,f.timers)
  f.tick();assert.equal(music.inspect().voices,0)
  assert.equal(await music.setAudible(true),true)
  assert.equal(music.inspect().step,1);assert.ok(music.inspect().voices>0)
  const count=f.nodes.length
  for(const theme of ['sunset','night','sunrise','day']){
    music.setScene(theme,true);assert.equal(music.inspect().theme,theme)
    assert.equal(music.inspect().step,1);assert.equal(f.nodes.length,count)
  }
  assert.ok(f.params.some(p=>p.events.some(e=>e[0]==='target'&&e[3]===2)))
  assert.equal(await music.setAudible(false),false);f.flush();assert.equal(f.context.state,'suspended')
  f.context.currentTime=1000;await music.setAudible(true)
  assert.equal(music.inspect().step,2,'no backlog after interruption')
  music.dispose();music.dispose();assert.equal(f.context.state,'closed');assert.equal(music.inspect().voices,0)
  assert.ok(f.nodes.every(n=>n.disconnected));f.tick();assert.equal(music.inspect().step,2)
})

test('audio resume failure remains silent and can be retried',async()=>{
  const f=fixture(),music=createCloudMusic(f.context,f.timers)
  f.context.resume=async()=>{throw new Error('blocked')}
  assert.equal(await music.setAudible(true),false);assert.equal(music.inspect().audible,false)
  assert.equal(music.inspect().voices,0)
  f.context.resume=async()=>{f.context.state='running'}
  assert.equal(await music.setAudible(true),true);music.dispose()
})

test('music is independent from visual pause, opt-in, and follows scene weather/location',async()=>{
  const source=await readFile(new URL('../src/components/editorial-home/SettlementHero.tsx',import.meta.url),'utf8')
  assert.match(source,/musicEnabled=useRef\(false\)/)
  assert.match(source,/setScene\(state.weather,state.location==='agentic'\)/)
  assert.match(source,/setAudible\(musicEnabled.current&&visible.current&&!document.hidden\)/)
  assert.match(source,/暂停画面/);assert.match(source,/开启场景音乐/)
  const controls=source.split('<div className="ed-settlement-utilities">')[1].split('</div></div>')[0]
  assert.doesNotMatch(controls,/<span|音乐开|音乐关/,'utility buttons must remain icon-only')
  assert.equal((controls.match(/aria-label=/g)||[]).length,2)
  assert.equal((controls.match(/title=/g)||[]).length,2)
})
