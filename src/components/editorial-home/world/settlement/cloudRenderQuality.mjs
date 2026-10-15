/** User-approved MSAA4 default; diagnostic overrides require exact loopback. */
export function cloudRenderQuality(hostname,search,pixelRatio=1){
  const local=['localhost','127.0.0.1','[::1]'].includes(hostname)
  const params=new URLSearchParams(local?search:'')
  const value=params.get('render-aa')
  const aa=['baseline','smaa','msaa4'].includes(value)?value:value===null?'msaa4':'baseline'
  const cap=params.get('render-dpr')==='2'?2:1.5
  const device=Number.isFinite(pixelRatio)&&pixelRatio>0?pixelRatio:1
  return Object.freeze({aa,pixelRatio:Math.min(device,cap),samples:aa==='msaa4'?4:0})
}
