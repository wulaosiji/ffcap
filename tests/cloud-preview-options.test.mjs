import test from 'node:test'
import assert from 'node:assert/strict'
import {parseCloudPreviewOptions} from '../scripts/world/preview-cloud-options.mjs'

test('private preview preserves its ordinary ports and does not delay assets by default',()=>{
  assert.deepEqual(parseCloudPreviewOptions(['r12l-bank-02']),{revision:'r12l-bank-02',posterRevision:'r12l-bank-02',upstreamPort:4318,listenPort:4321,modelDelayMs:0})
  assert.deepEqual(parseCloudPreviewOptions(['r12l-bank-02','4322','r12m-light-01','4323','8000']),{revision:'r12l-bank-02',posterRevision:'r12m-light-01',upstreamPort:4322,listenPort:4323,modelDelayMs:8000})
})

test('loading QA rejects unsafe paths, ambiguous arguments, loops and delays on the user preview',()=>{
  for(const args of [[],['../asset'],['r12x','4322','../poster'],['r12x','4321'],['r12x','80'],['r12x','65536'],['r12x','4322','r12x','4322'],['r12x','4322','r12x','4321','1000'],['r12x','4322','r12x','4323','10001'],['r12x','4322','r12x','4323','-1'],['r12x','4322','r12x','4323','NaN'],['r12x','4322','r12x','4323','1e3'],['r12x','4322','r12x','4323','','extra']])assert.throws(()=>parseCloudPreviewOptions(args),String(args))
})
