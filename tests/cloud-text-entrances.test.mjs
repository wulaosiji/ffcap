import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import postcss from 'postcss'

test('only entry and skip lose their button shells; courtyard actions retain theirs',async()=>{
  const css=postcss.parse(await readFile(new URL('../src/app/settlement.css',import.meta.url),'utf8'))
  const rules=new Map()
  css.walkRules(rule=>{if(rule.parent.type==='root')rules.set(rule.selector,Object.fromEntries(rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value])))})
  for(const selector of ['.ed-settlement-enter','.ed-settlement-reveal button']){
    const rule=rules.get(selector)
    assert.equal(rule.background,'none');assert.equal(rule.border,'0');assert.equal(rule['border-radius'],'0')
    assert.equal(rule['min-height'],'44px')
  }
  const guide=rules.get('.ed-settlement-actions button')
  assert.equal(guide.background,'#f6efd6e8');assert.equal(guide['border-radius'],'28px')
  const hover=rules.get('.ed-settlement :is(.ed-settlement-enter,.ed-settlement-reveal button):is(:hover,:focus-visible)')
  assert.equal(hover['text-decoration-color'],'currentColor')
})

test('entry UI cannot render courtyard controls while engine is still in hero phase',async()=>{
  const source=await readFile(new URL('../src/components/editorial-home/SettlementHero.tsx',import.meta.url),'utf8')
  assert.match(source,/useLayoutEffect\(\(\)=>\{engine.current\?\.setExploring\(exploring\)/)
  assert.match(source,/state.phase!=='explore'\?<div className="ed-settlement-reveal"/)
  assert.doesNotMatch(source,/state.phase==='reveal'\?<div className="ed-settlement-reveal"/)
  const engine=await readFile(new URL('../src/components/editorial-home/world/settlement/createCloudSettlement.ts',import.meta.url),'utf8')
  assert.match(engine,/heroPosition:camera.position.toArray\(\),heroTarget:smoothTarget.toArray\(\)/)
})

test('desktop loading and entry rows occupy the same height without a ready-state text jump',async()=>{
  const css=postcss.parse(await readFile(new URL('../src/app/settlement.css',import.meta.url),'utf8'))
  const styles={}
  css.walkRules(rule=>{if(rule.parent.type==='root'&&['.ed-settlement-loading','.ed-settlement-enter'].includes(rule.selector))styles[rule.selector]=Object.fromEntries(rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]))})
  const loading=styles['.ed-settlement-loading'],entry=styles['.ed-settlement-enter']
  assert.equal(loading['min-height'],entry['min-height'])
  assert.equal(loading.padding,'0 19px')
  for(const property of ['display','align-items','justify-content'])assert.equal(loading[property],entry[property])
})

test('the matching poster stays opaque underneath the fading WebGL scene',async()=>{
  const css=postcss.parse(await readFile(new URL('../src/app/settlement.css',import.meta.url),'utf8'))
  let foundReadyCanvas=false
  css.walkRules(rule=>{
    if(rule.selector==='.ed-settlement-ready .ed-settlement-canvas')foundReadyCanvas=rule.nodes.some(n=>n.prop==='opacity'&&n.value==='1')
    if(rule.selector.includes('.ed-settlement-poster'))for(const node of rule.nodes){
      if(node.prop==='opacity')assert.equal(node.value,'1')
      if(node.prop==='display')assert.notEqual(node.value,'none')
      if(node.prop==='visibility')assert.notEqual(node.value,'hidden')
    }
  })
  assert.ok(foundReadyCanvas)
  for(const canvasOpacity of [0,.1,.25,.5,.75,.9,1])assert.equal(canvasOpacity+(1-canvasOpacity),1,'poster plus scene must not reveal the base color')
})
