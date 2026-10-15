import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {inspectGLB,decodeDracoAccessors} from '../scripts/world/blender/inspect_glb.mjs'

const source=readFile(new URL('../public/world/blender/cloud-courtyard-v2.glb',import.meta.url))
  .then(async bytes=>({bytes,decoded:await decodeDracoAccessors(bytes)}))

test('environment defaults keep the historical limit; explicit budgets are visible and still enforced',async()=>{
  const {bytes,decoded}=await source
  assert.equal(inspectGLB(bytes,'environment',decoded).environmentTriangleBudget,350000)
  const limited=inspectGLB(bytes,'environment',decoded,{environmentTriangleBudget:100})
  assert.ok(limited.errors.some(error=>error.includes('exceeds 100 triangle budget')))
  const candidate=inspectGLB(bytes,'environment',decoded,{environmentTriangleBudget:800000})
  assert.equal(candidate.environmentTriangleBudget,800000)
  assert.equal(candidate.triangles,limited.triangles,'Selecting a budget must not change or decimate the asset')
})

test('invalid resource limits cannot disable environment validation',async()=>{
  const {bytes,decoded}=await source
  for(const value of [0,-1,Infinity,NaN,1.5])assert.throws(()=>inspectGLB(bytes,'environment',decoded,{environmentTriangleBudget:value}),/positive integer/)
})
