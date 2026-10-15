export function isCloudMotionReview(hostname,search){
  return ['localhost','127.0.0.1','[::1]'].includes(hostname)
    &&new URLSearchParams(search).get('render-review')==='1'
}

/** Bounded diagnostic data, never a simulation input. CPU submission is not GPU time. */
export function createCloudMotionReview(enabled){
  let active=false,disposed=false,rows=[]
  return {
    start(){if(!enabled||disposed)return false;rows=[];active=true;return true},
    get active(){return active},
    record(sample){
      if(!active||disposed)return
      if(![sample.elapsedMs,sample.cpuSubmitMs,sample.time,...sample.camera,...sample.focus,...sample.actor].every(Number.isFinite))return
      if(['cpuUpdateMs','cpuPhysicsMs'].some(key=>sample[key]!==undefined&&(!Number.isFinite(sample[key])||sample[key]<0)))return
      rows.push({...sample,camera:[...sample.camera],focus:[...sample.focus],actor:[...sample.actor]})
      if(rows.length>=6000)active=false
    },
    finish(){
      if(!enabled||disposed)return null
      active=false
      const summary={count:rows.length,scope:'CPU timings are not GPU timings'}
      for(const key of ['elapsedMs','cpuUpdateMs','cpuPhysicsMs','cpuSubmitMs']){
        const values=rows.map(row=>row[key]).filter(Number.isFinite).sort((a,b)=>a-b)
        summary[key]=values.length?{median:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)],max:values.at(-1)}:null
      }
      return {limit:6000,capped:rows.length>=6000,summary,samples:rows.map(row=>({...row,camera:[...row.camera],focus:[...row.focus],actor:[...row.actor]}))}
    },
    dispose(){active=false;disposed=true;rows=[]},
  }
}
