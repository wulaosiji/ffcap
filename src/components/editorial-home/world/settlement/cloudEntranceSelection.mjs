/** Transactional entrance restart. A cancelled/unmounted load never replaces the actor. */
export function createEntranceSelection({phase,prepare,commit,onBusy=()=>{},onError=()=>{},allowedKinds=['human','robot','dog']}){
  const allowed=new Set(allowedKinds)
  let busy=false,epoch=0,disposed=false
  return {
    async select(kind){
      if(disposed||busy||phase()!=='explore'||!['human','robot','dog'].includes(kind)||!allowed.has(kind))return false
      const request=++epoch;busy=true;onBusy(true)
      let candidate
      try{
        candidate=await prepare(kind)
        if(disposed||request!==epoch||phase()!=='explore'){candidate.dispose();return false}
        commit(candidate,kind);return true
      }catch(error){candidate?.dispose();if(!disposed&&request===epoch)onError(error);return false}
      finally{if(request===epoch){busy=false;onBusy(false)}}
    },
    cancel(){epoch++;busy=false;onBusy(false)},
    dispose(){disposed=true;epoch++;busy=false},
  }
}
