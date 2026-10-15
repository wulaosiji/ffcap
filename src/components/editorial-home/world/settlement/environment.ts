import * as T from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { createSolids, ROOMS, NEAR_CLIFFS, GARDENS } from './layout.mjs'

type Solid = {id:string;position:number[];halfExtents:number[];kind:string;visible:boolean}
/** Original 3D construction; all runtime surfaces remain real geometry. */
export async function createEnvironment(scene:T.Scene, mobile:boolean) {
  const mats=new Set<T.Material>(), geos=new Set<T.BufferGeometry>(), textures=new Set<T.Texture>()
  const batches=new Map<T.Material,T.BufferGeometry[]>(), animated:T.Object3D[]=[]
  const environmentRoot=new T.Group();environmentRoot.name='Research settlement environment';scene.add(environmentRoot)
  const loader=new T.TextureLoader()
  let loadFailed=false
  const load=async(path:string)=> {const t=await loader.loadAsync(path);if(loadFailed)t.dispose();else textures.add(t);return t}
  const make=(color:string,roughness=.85,metalness=0)=>{const m=new T.MeshStandardMaterial({color,roughness,metalness});mats.add(m);return m}
  const [grassTex,stoneTex,rockTex,woodTex,stoneNormal,sky,workflow]=await Promise.all([
    load('/world/materials/grass-color.jpg'),load('/world/materials/stone-color.jpg'),load('/world/materials/rock-color.jpg'),load('/world/materials/wood-color.jpg'),load('/world/materials/stone-normal.jpg'),load('/world/cloud-sky-v2.webp'),load('/world/agent-workflow.webp')
  ]).catch(error=>{loadFailed=true;textures.forEach(t=>t.dispose());textures.clear();environmentRoot.removeFromParent();throw error})
  for(const t of [grassTex,stoneTex,rockTex,woodTex]) {t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4}
  stoneNormal.wrapS=stoneNormal.wrapT=T.RepeatWrapping
  sky.colorSpace=T.SRGBColorSpace;sky.mapping=T.EquirectangularReflectionMapping
  scene.background=sky;scene.environment=sky;scene.environmentIntensity=.38
  const stone=make('#e7e0c6'), rock=make('#d8e1d5'), grass=make('#b9d59b'), wood=make('#998069'), timber=make('#90775c'), dark=make('#353e3c'), metal=make('#c9c8b7',.4,.6), brass=make('#b99a63',.42,.65)
  stone.map=stoneTex;stone.normalMap=stoneNormal;stone.normalScale.set(.45,.45)
  rock.map=rockTex;grass.map=grassTex;wood.map=woodTex;timber.map=woodTex
  const purple=make('#a39bbc'), leaf=make('#78994e'), leafLight=make('#b4c97a'), leafShade=make('#526f3e'), petal=make('#eee5c0'), purplePetal=make('#aea0c6')
  const bookBlue=make('#34454d'),oldPaper=make('#b7ad8b')
  // Leaves and cupped petals are thin folded surfaces, not costly miniature spheres.
  for(const material of [leaf,leafLight,leafShade,petal,purplePetal])material.side=T.DoubleSide
  const screen=make('#bdd8cc',.55);screen.emissive.set('#afcdbd');screen.emissiveIntensity=.23
  workflow.colorSpace=T.SRGBColorSpace
  const displayMaterial=new T.MeshBasicMaterial({map:workflow,color:'#d4d8cd'});mats.add(displayMaterial)
  const displayGeometry=new T.PlaneGeometry(.76,.43);geos.add(displayGeometry)
  const materialMap:Record<string,T.Material>={stone,grass,wood,bridge:stone}
  const boxGeo=new T.BoxGeometry(1,1,1), softGeo=new RoundedBoxGeometry(1,1,1,1,.045), cylinderGeo=new T.CylinderGeometry(1,1,1,8), stemGeo=new T.CylinderGeometry(1,.7,1,3,1,true), stoneGeo=new T.CylinderGeometry(1,1.15,1,mobile?6:7)
  const quat=new T.Quaternion(), matrix=new T.Matrix4(), tempV=new T.Vector3()
  const projectWorldUV=(g:T.BufferGeometry)=>{
    const position=g.getAttribute('position'),normal=g.getAttribute('normal'),uv=g.getAttribute('uv')
    if(!uv||!normal)return
    // Dominant-axis world projection: horizontal faces use X/Z, never object height.
    // This maintains a consistent grain on thin pavers, tall walls and their bevels.
    for(let i=0;i<uv.count;i++){
      const nx=Math.abs(normal.getX(i)),ny=Math.abs(normal.getY(i)),nz=Math.abs(normal.getZ(i))
      if(ny>=nx&&ny>=nz)uv.setXY(i,position.getX(i)*.35,position.getZ(i)*.35)
      else if(nx>=nz)uv.setXY(i,position.getZ(i)*.35,position.getY(i)*.35)
      else uv.setXY(i,position.getX(i)*.35,position.getY(i)*.35)
    }
  }
  const batch=(geo:T.BufferGeometry,mat:T.Material,x:number,y:number,z:number,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0)=>{
    const g=geo.clone();quat.setFromEuler(new T.Euler(rx,ry,rz));matrix.compose(new T.Vector3(x,y,z),quat,new T.Vector3(sx,sy,sz));g.applyMatrix4(matrix)
    if((mat as T.MeshStandardMaterial).map)projectWorldUV(g)
    if(!batches.has(mat))batches.set(mat,[]);batches.get(mat)!.push(g)
  }
  const block=(mat:T.Material,x:number,y:number,z:number,w:number,h:number,d:number,ry=0)=>batch(softGeo,mat,x,y,z,w,h,d,0,ry)
  const bar=(mat:T.Material,a:number[],b:number[],radius:number)=>{
    const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start),g=(mat===leaf?stemGeo:cylinderGeo).clone()
    const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize())
    g.applyMatrix4(new T.Matrix4().compose(start.add(end).multiplyScalar(.5),q,new T.Vector3(radius,delta.length(),radius)))
    if((mat as T.MeshStandardMaterial).map)projectWorldUV(g)
    if(!batches.has(mat))batches.set(mat,[]);batches.get(mat)!.push(g)
  }
  let seed=39417
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
  const naturalGeos:T.BufferGeometry[]=[]
  const boulders=Array.from({length:4},(_,variant)=>{
    const geometry=new T.IcosahedronGeometry(1,1),p=geometry.getAttribute('position')
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i)
      const chip=1+Math.sin(x*8.7+y*4.3+z*7.2+variant*1.9)*.12+Math.cos(z*11.2-x*5.2+variant)*.08
      p.setXYZ(i,x*chip+Math.sin(y*4+variant)*.09,y*(.78+Math.cos(x*4+z*3)*.1),z*chip+Math.sin(y*5+variant)*.07)
    }
    geometry.computeVertexNormals();naturalGeos.push(geometry);return geometry
  })
  const mossGeo=new T.IcosahedronGeometry(1,0);naturalGeos.push(mossGeo)
  const solids=createSolids() as Solid[]
  for(const s of solids)if(s.visible){const [x,y,z]=s.position,[w,h,d]=s.halfExtents.map(v=>v*2);if(h>.005)batch(s.kind==='grass'?boxGeo:softGeo,materialMap[s.kind]||stone,x,y,z,w,h,d)}
  // Bridge railings follow the actual stepped bridge profile.
  for(const side of [-1,1])for(let i=0;i<6;i++){
    const z=8.65-i*1.48,t=(9-z)/8,y=.8*t+.13*Math.sin(Math.PI*t)
    block(timber,side*2.08,y+.58,z,.16,1.16,.16)
    block(brass,side*2.08,y+1.18,z,.24,.08,.24)
    if(i<5){const zn=z-1.48,tn=(9-zn)/8,yn=.8*tn+.13*Math.sin(Math.PI*tn);for(const h of [.48,.99])bar(timber,[side*2.08,y+h,z],[side*2.08,yn+h,zn],.052)}
  }
  // Individual path pavers, with narrow moss-filled seams.
  const pave=(x:number,z:number,y:number,w:number,d:number)=>{
    for(let ix=0;ix<w;ix+=.8)for(let iz=0;iz<d;iz+=.9)batch(mobile?boxGeo:softGeo,stone,x-w/2+ix+.38,y+.012,z-d/2+iz+.43,.73,.04,.8,0,(rand()-.5)*.045)
  }
  pave(0,18,0,5,18);pave(0,-1,.8,5,4);pave(-5,-3.6,.8,13,4)
  pave(9,-2,.8,10,5)
  // Streams have a visible basin. Falling into water returns to the safe spawn.
  block(rock,0,-2.1,5,64,1,8)
  for(let side=0;side<2;side++)for(let i=0;i<70;i++){
    const x=-32+i*.94,z=side?1:9
    if(Math.abs(x)<2.4)continue
    batch(boulders[i%4],rock,x,side?.3:-.3,z,.65+rand()*.3,.75,.65+rand()*.25,0,rand()*6)
    if(i%3===0)batch(boulders[(i+1)%4],grass,x,side?.79:.025,z,.64,.052,.46,0,rand()*6)
  }
  const waterGeo=new T.PlaneGeometry(64,7.6,mobile?40:80,mobile?8:14);waterGeo.rotateX(-Math.PI/2);geos.add(waterGeo)
  const waterMat=new T.MeshStandardMaterial({color:'#70a4a6',transparent:true,opacity:.82,roughness:.21,metalness:.32,side:T.DoubleSide});mats.add(waterMat)
  const water=new T.Mesh(waterGeo,waterMat);water.position.set(0,-.43,5);environmentRoot.add(water)
  const waterBase=Float32Array.from(waterGeo.attributes.position.array)

  // Continuous eroded hills: a single height surface, not vertically extruded pillars.
  // The footprint fits the existing cross-shaped scenic collider envelope. The lower
  // inner/front shoulder opens towards the buildings; the ridge rises outwards/back.
  const cliff=(cx:number,cz:number,w:number,d:number,h:number)=>{
    const distant=Math.hypot(cx,cz)>60,segments=mobile?28:42,rings=mobile?9:14,phase=rand()*6,outward=cx<0?-1:1
    const amplitude=h*(distant?.84:Math.abs(cx)<10?1.17:.84),vertices:number[]=[],indices:number[]=[],radials:number[]=[]
    const elevation=(u:number,v:number,r:number)=>{
      const envelope=Math.pow(Math.max(0,1-r*r),1.18)
      const ridge=.83-v*.34+outward*u*.22
      const shoulder=Math.exp(-((u-outward*.3)**2+(v+.36)**2)/.16)*.17*(1-r)
      // Strata are changes in this same surface, so no ledges can float in the air.
      const erosion=(Math.sin(u*9+v*5+phase)*.21+Math.sin(v*13-u*4+phase)*.13)*r*(1-r)
      return Math.min(h-.18,-.6+amplitude*(envelope*ridge+shoulder)+erosion)
    }
    vertices.push(0,elevation(0,0,0),0);radials.push(0)
    for(let row=1;row<=rings;row++)for(let j=0;j<segments;j++){
      const angle=j/segments*Math.PI*2,r=row/rings,u=Math.cos(angle)*r,v=Math.sin(angle)*r
      const shoreline=1+.035*Math.sin(angle*3+phase)+.022*Math.cos(angle*5-phase)
      vertices.push(u*w*.53*shoreline,elevation(u,v,r),v*d*.53*shoreline);radials.push(r)
      if(row===1)indices.push(0,1+(j+1)%segments,1+j)
      else{
        const a=1+(row-2)*segments+j,b=1+(row-2)*segments+(j+1)%segments,c=1+(row-1)*segments+j,dd=1+(row-1)*segments+(j+1)%segments
        indices.push(a,b,c,b,dd,c)
      }
    }
    const surface=new T.BufferGeometry();surface.setAttribute('position',new T.Float32BufferAttribute(vertices,3));surface.setIndex(indices)
    surface.setAttribute('uv',new T.Float32BufferAttribute(new Array(vertices.length/3*2).fill(0),2));surface.computeVertexNormals()
    const normal=surface.getAttribute('normal'),grassFaces:number[]=[],rockFaces:number[]=[]
    for(let i=0;i<indices.length;i+=3){
      const a=indices[i],b=indices[i+1],c=indices[i+2],r=(radials[a]+radials[b]+radials[c])/3
      const slope=(normal.getY(a)+normal.getY(b)+normal.getY(c))/3
      // A broad grassy crown rolls into intermittent steep rock scarps and a rock toe.
      const useGrass=r<.55||(r<.88&&slope>.71)
      ;(useGrass?grassFaces:rockFaces).push(a,b,c)
    }
    for(const [faces,material]of [[rockFaces,rock],[grassFaces,grass]]as const){
      if(!faces.length)continue
      const part=surface.clone();part.setIndex(faces);batch(part,material,cx,0,cz);part.dispose()
    }
    surface.dispose()
    // Preserve the deterministic stream used by all later gardens/furniture/grass.
    const formerLedgeCount=distant?(mobile?8:13):(mobile?17:29)
    for(let i=0;i<formerLedgeCount*4;i++)rand()
  }
  for(const c of NEAR_CLIFFS)cliff(c.x,c.z,c.width,c.depth,c.height)
  cliff(-62,-69,24,18,25);cliff(61,-77,22,18,29);cliff(-84,-116,35,20,28)
  // Planted berms connect the two lower buildings to the high ground behind them.
  // They are enclosed gardens, not misleading height noise on the walking terrain.
  for(const garden of GARDENS){
    const {x,z,width,depth,height}=garden,nx=mobile?6:10,nz=mobile?5:8,vertices:number[]=[],indices:number[]=[]
    for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
      const u=i/nx,v=j/nz,rise=Math.pow(Math.max(0,Math.sin(u*Math.PI)*Math.sin(v*Math.PI)),.7)
      vertices.push(x+(u-.5)*width,.8+height*(.12+.82*rise)+Math.sin(u*5+v*3)*.055*rise,z+(v-.5)*depth)
      if(i<nx&&j<nz){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,dd=c+1;indices.push(a,c,b,b,c,dd)}
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.setAttribute('uv',new T.Float32BufferAttribute(new Array(vertices.length/3*2).fill(0),2));geo.computeVertexNormals();batch(geo,grass,0,0,0);geo.dispose()
    const border=(ax:number,az:number,bx:number,bz:number)=>{
      const count=Math.ceil(Math.hypot(bx-ax,bz-az)/.71)
      for(let j=0;j<=count;j++){const t=j/count;batch(boulders[j%4],rock,ax+(bx-ax)*t,1.12+(j%3)*.035,az+(bz-az)*t,.45,.47,.41,0,j*.47)}
    }
    const left=x-width/2+.35,right=x+width/2-.35,back=z-depth/2+.33,front=z+depth/2-.33
    border(left,back,right,back);border(left,front,right,front);border(left,back,left,front);border(right,back,right,front)
  }
  // Low retaining walls break the ground plane into believable terraces.
  for(let i=0;i<8;i++)block(rock,1,3.2,-28-i*1.3,14,6.4,1.28)
  for(let i=0;i<15;i++){
    block(stone,-21+i*1.15,1.2,-22,1.1,.7,.55)
    if(i%3===0)block(leaf,-21+i*1.15,1.65,-22,.8,.3,.8)
  }
  function label(text:string,x:number,y:number,z:number,width:number,font=50,color='#45483d') {
    const c=document.createElement('canvas');c.width=1024;c.height=192
    const ctx=c.getContext('2d')!;ctx.clearRect(0,0,c.width,c.height);ctx.font=`500 ${font}px Arial, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,512,96)
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;textures.add(tex)
    const mat=new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:T.DoubleSide});mats.add(mat)
    const geo=new T.PlaneGeometry(width,width*192/1024);geos.add(geo);const m=new T.Mesh(geo,mat);m.position.set(x,y,z);environmentRoot.add(m)
  }
  // Shelves have physical books, shelf edges and a reading ledge.
  const shelf=(cx:number,base:number,cz:number,width:number,rotation=0)=>{
    const cos=Math.cos(rotation),sin=Math.sin(rotation)
    const piece=(mat:T.Material,lx:number,y:number,lz:number,w:number,h:number,d:number,book=false)=>batch(book?boxGeo:softGeo,mat,cx+lx*cos+lz*sin,y,cz-lx*sin+lz*cos,w,h,d,0,rotation)
    for(let i=0;i<4;i++){const y=base+i*.65;piece(timber,0,y,0,width,.1,.5)
      const spacing=mobile?.22:.15
      if(i<3)for(let b=0;b<width/spacing;b++){
        const x=-width/2+b*spacing+spacing/2,height=.28+rand()*.22,bookWidth=spacing*(.65+rand()*.2)
        piece([timber,bookBlue,dark,wood][b%4],x,y+.05+height/2,.025,bookWidth,height,.23,true)
        if(b%(mobile?4:2)===0){piece(oldPaper,x,y+.11+height*.5,.146,bookWidth*.64,.023,.005,true);piece(oldPaper,x,y+.12,.146,bookWidth*.64,.012,.005,true)}
      }
    }
    for(const s of [-1,1])piece(timber,s*width/2,base+1,0,.1,2.1,.55)
  }
  for(const r of ROOMS){
    const {x,y,front,width,depth,height}=r
    // Thin broken courses supply human-scale masonry on the formerly blank side walls.
    for(const side of [-1,1])for(let row=0;row<5;row++)for(let column=0;column<6;column++){
      const z=front-.7-column*1.28-(row%2)*.08
      batch(boxGeo,stone,x+side*(width/2+.232),y+.45+row*.78,z,.035,.69,1.17,0,0,0)
    }
    // Rubble remains inside each foundation footprint, not across a walkable doorway.
    for(const side of [-1,1])for(let j=0;j<10;j++){
      const z=front-.25-j*(depth-.5)/10
      batch(boulders[j%4],rock,x+side*(width/2-.08),.88,z,.39,.24+rand()*.16,.48,0,rand()*6)
    }
    for(let j=0;j<13;j++){
      const dx=(j/12-.5)*width
      if(Math.abs(dx)<2.8)continue
      batch(boulders[j%4],stone,x+dx,.93,front-.02,.32,.27,.29,0,rand()*6)
    }
    // Weathered eaves create depth beneath a planted roof, rather than a bare cuboid.
    block(timber,x,y+height-.57,front-.04,width-.25,.15,.65)
    for(const side of [-1,1])block(timber,x+side*(width/2-.13),y+height-.49,front-depth/2,.16,.17,depth+.16)
    for(let j=0;j<(mobile?17:29);j++){
      const dx=(rand()-.5)*(width-.7),dz=front-.45-rand()*(depth-.6)
      batch(mossGeo,grass,x+dx,y+height+.335,dz,.58+rand()*.72,.07+rand()*.04,.48+rand()*.65,0,rand()*6)
    }
    // Cut-stone joints and arch voussoirs give the open frontage real depth.
    for(const side of [-1,1])for(let row=0;row<6;row++)for(let col=0;col<2;col++){
      block(stone,x+side*(width/2-1.3)+(col-.5)*1.24+(row%2?.08:0),y+.36+row*.65,front+.39,1.19,.6,.24)
    }
    const radius=(width-5.2)/2
    for(let i=0;i<15;i++){
      const a=i/14*Math.PI;batch(softGeo,stone,x+Math.cos(a)*(radius+.02),y+2.05+Math.sin(a)*1.6,front+.44,.52,.65,.6,0,0,a-Math.PI/2)
    }
    // A deep timber reveal follows the arch, while narrow jambs leave the route open.
    for(const side of [-1,1])block(timber,x+side*(radius-.16),y+1.04,front+.17,.15,2.08,.31)
    const archPoints=Array.from({length:21},(_,j)=>{const a=j/20*Math.PI;return new T.Vector3(x+Math.cos(a)*(radius-.16),y+2.05+Math.sin(a)*1.45,front+.17)})
    const frameGeo=new T.TubeGeometry(new T.CatmullRomCurve3(archPoints),28,.087,6,false);batch(frameGeo,timber,0,0,0);frameGeo.dispose()
    block(stone,x,y+height-.12,front+.49,width-.8,.72,.28)
    label(r.name,x,y+height-.15,front+.645,width-1.1,r.id==='entertainment'?55:64)
    for(let ix=0;ix<width;ix+=1.22)block(stone,x-width/2+ix+.6,y+height+.48,front-depth+.1,1.17,.37,.65)
    // Warm daylight inside; not emissive pillars or fantasy beams.
    const light=new T.PointLight('#ffdfa2',9,12,2);light.position.set(x,y+3,front-3.8);environmentRoot.add(light)
    for(const side of [-1,1]){block(brass,x+side*(radius+.8),y+2.2,front+.8,.17,.32,.23);block(screen,x+side*(radius+.8),y+2.2,front+.94,.12,.21,.03)}
    if(r.id==='agentic'){
      // Two arched timber leaves are truly swung out to the side of the threshold.
      const doorShape=new T.Shape();doorShape.moveTo(-.675,0);doorShape.lineTo(.675,0);doorShape.lineTo(.675,1.94);doorShape.quadraticCurveTo(.55,2.24,.14,2.28);doorShape.lineTo(-.675,2.28);doorShape.closePath()
      const doorGeo=new T.ExtrudeGeometry(doorShape,{depth:.09,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:1,curveSegments:7,steps:1});doorGeo.translate(0,0,-.045)
      for(const side of [-1,1]){
        const dx=x+side*2.43,dz=front+.72
        batch(doorGeo,wood,dx,y,dz,1,1,1,0,Math.PI/2)
        for(let j=0;j<7;j++)batch(boxGeo,timber,dx+side*.057,y+1.02,dz-.57+j*.185,.014,2.01,.028)
        for(const h of [.28,1.06,1.87])block(timber,dx+side*.074,y+h,dz,.056,.1,1.28)
        for(const h of [.42,1.75])block(brass,dx+side*.11,y+h,front+.09,.065,.13,.095)
        block(brass,dx-side*.08,y+1.09,front+1.14,.043,.17,.042)
      }
      doorGeo.dispose()
      shelf(x,y+.25,front-depth+.55,width-1.2)
      // Shares the existing left-shelf collider footprint: X -14.55 / Z -14.
      shelf(x-width/2+.65,y+.25,front-depth/2,5.9,Math.PI/2)
      block(timber,x,y+.85,front-5.8,3.5,.13,1.55)
      for(const dx of [-1.48,1.48])for(const dz of [-.55,.55])block(dark,x+dx,y+.43,front-5.8+dz,.09,.82,.09)
      for(const dx of [-1.1,0,1.1]){
        block(dark,x+dx,y+1.32,front-6.1,.83,.52,.065)
        // Authored illustrative workflow, with untouched 0..1 display UVs.
        const display=new T.Mesh(displayGeometry,displayMaterial);display.position.set(x+dx,y+1.33,front-6.05);environmentRoot.add(display)
        bar(metal,[x+dx,y+.91,front-6.1],[x+dx,y+1.15,front-6.1],.025)
        block(metal,x+dx,y+.935,front-5.7,.55,.02,.19)
        // Ceramic agent device: tangible desktop object, not a light beam.
        const deviceGeo=new T.SphereGeometry(1,12,8);batch(deviceGeo,stone,x+dx+.4,y+1,front-5.45,.1,.14,.1);deviceGeo.dispose()
        block(purple,x+dx+.4,y+1.04,front-5.347,.045,.015,.009)
      }
      for(const dx of [-1.1,1.1]){block(timber,x+dx,y+.47,front-4.4,.65,.1,.65);block(timber,x+dx,y+.82,front-4.06,.67,.67,.09);for(const a of [-.24,.24])for(const b of [-.24,.24])block(dark,x+dx+a,y+.22,front-4.4+b,.055,.44,.055)}
      label('PERCEIVE   /   REASON   /   ACT',x,y+2.75,front-depth+.36,6.4,39,'#dfddc7')
    } else if(r.id==='physical'){
      shelf(x,y+.2,front-depth+.6,width-1.4)
      const arm=new T.Group();arm.position.set(x,y+.55,front-3.4);environmentRoot.add(arm)
      const armMat=metal, pieces=[{p:[0,0,0],s:[1,.3,1]},{p:[0,.6,0],s:[.4,1,.4]},{p:[.55,1.3,0],s:[1.4,.27,.32]},{p:[1.1,1.8,0],s:[.3,1.1,.3]},{p:[.8,2.35,0],s:[.9,.2,.22]}]
      for(const item of pieces){const geo=softGeo.clone();geos.add(geo);const m=new T.Mesh(geo,armMat);m.position.set(...item.p as [number,number,number]);m.scale.set(...item.s as [number,number,number]);m.castShadow=true;arm.add(m)}
      animated.push(arm)
      block(dark,x-2,y+.37,front-3.3,1.2,.36,1.7)
      for(const side of [-1,1])for(const dz of [-.6,.6])batch(cylinderGeo,dark,x-2+side*.65,y+.3,front-3.3+dz,.27,.13,.27,0,0,Math.PI/2)
      block(screen,x-2,y+.67,front-3.3,.55,.15,.6)
    }else{
      block(purple,x,y+2.5,front-depth+1.2,6.2,2.7,.035)
      block(stone,x,y+2.5,front-depth+1.24,5.85,2.42,.035)
      for(let ix=0;ix<4;ix++)for(let iz=0;iz<3;iz++)block(timber,x-2.1+ix*1.35,y+.4,front-2.5-iz,1.05,.18,.5)
      label('IMAGINE WHAT COMES NEXT',x,y+2.55,front-depth+1.27,5.4,39)
    }
    if(!r.open){
      // Both unopened rooms show the complete extent of their physical barrier.
      const half=(width-5.2)/2
      for(const side of [-1,1])block(timber,x+side*(half-.09),y+.55,front+.18,.16,1.1,.17)
      for(const height of [.42,.96])bar(timber,[x-half,y+height,front+.18],[x+half,y+height,front+.18],.045)
      block(purple,x,y+.77,front+.22,2.7,.46,.045)
      label('NEXT CHAPTER',x,y+.77,front+.25,2.6,47,'#efe9d3')
    }
    // Soft hanging fabric: actual subdivided cloth surface with gentle motion.
    for(const side of [-1,1]){
      const geo=new T.PlaneGeometry(.72,2.5,5,12);geos.add(geo)
      const mat=purple.clone();mat.side=T.DoubleSide;mats.add(mat)
      const banner=new T.Mesh(geo,mat);banner.position.set(x+side*(width/2+.4),y+2.7,front+.3);environmentRoot.add(banner);animated.push(banner)
      bar(brass,[banner.position.x-.53,y+4.1,front+.3],[banner.position.x+.53,y+4.1,front+.3],.03)
    }
  }

  // Vegetation: modeled blades and leaves batched into only a handful of draws.
  const blade=new T.BufferGeometry();blade.setAttribute('position',new T.Float32BufferAttribute([-.028,0,0,.028,0,0,.023,.28,.01,-.017,.28,.01,0,.64,.12],3));blade.setIndex([0,1,2,0,2,3,3,2,4]);blade.computeVertexNormals();blade.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,.5,0,.5,.5,1],2))
  const foldedSurface=(petalShape=false)=>{
    const geometry=new T.BufferGeometry()
    // Curved lanceolate leaves have a narrow stem, a full middle and a bent tip.
    const vertices=petalShape?[0,.45,0,-.78,0,0,-.4,.04,.87,.82,0,.62,.96,.03,-.42,-.32,0,-.88]:[
      0,0,-1,-.45,.06,-.55,0,.16,-.55,.45,.06,-.55,
      -.72,.13,0,0,.27,0,.72,.13,0,-.38,.34,.57,0,.43,.57,.38,.34,.57,0,.65,1,
    ]
    geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3))
    geometry.setIndex(petalShape?[0,1,2,0,2,3,0,3,4,0,4,5,0,5,1]:[0,1,2,0,2,3,1,4,2,2,4,5,2,5,3,3,5,6,4,7,5,5,7,8,5,8,6,6,8,9,7,10,8,8,10,9])
    geometry.computeVertexNormals()
    const uv:number[]=[];for(let i=0;i<vertices.length;i+=3)uv.push(vertices[i]*.5+.5,vertices[i+2]*.5+.5)
    geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return geometry
  }
  const leafGeo=foldedSurface(),flowerGeo=foldedSurface(true)
  const plantable=(x:number,z:number)=>{
    if(z>1&&z<9)return false
    if(Math.abs(x)<3.18&&z>-.5)return false
    if(x>-17&&x<3&&z>-6&&z<-.5)return false
    if(ROOMS.some(r=>Math.abs(x-r.x)<r.width/2+1 && z<r.front+1&&z>r.front-r.depth-1))return false
    if(GARDENS.some(g=>Math.abs(x-g.x)<g.width/2+.1&&Math.abs(z-g.z)<g.depth/2+.1))return false
    if(NEAR_CLIFFS.some(c=>Math.abs(x-c.x)<c.width*.6&&Math.abs(z-c.z)<c.depth*.6))return false
    if(z<-9&&Math.abs(x)<17)return false
    return Math.abs(x)<29&&z>-25&&z<35
  }
  // Meadow growth is clustered: open earth, short ground cover, tufted grasses and flowers.
  // The field beside the opening path is intentionally richer than distant empty land.
  for(let i=0;i<(mobile?680:1240);i++){
    const foreground=i%3===0,cx=foreground?(i%2?-1:1)*(3.6+rand()*10):(rand()-.5)*58,cz=foreground?10+rand()*21:-24+rand()*58
    if(!plantable(cx,cz))continue
    const growth=.5+.24*Math.sin(cx*.31+Math.cos(cz*.24))+.23*Math.cos(cz*.27-cx*.19)
    if(!foreground&&rand()>growth+.16)continue
    const radius=.24+rand()*.68,y=cz>9?0:.8
    if(i%3===0)batch(mossGeo,grass,cx,y+.007,cz,radius*.94,.014,radius*.8,0,rand()*6)
    const shoots=mobile?8:13
    for(let j=0;j<shoots;j++){
      const angle=rand()*Math.PI*2,reach=Math.sqrt(rand())*radius,x=cx+Math.cos(angle)*reach,z=cz+Math.sin(angle)*reach
      if(!plantable(x,z))continue
      const s=.43+rand()*.57
      for(let k=0;k<(mobile?2:3);k++)batch(blade,j%5===0?leafLight:j%4===0?leafShade:leaf,x,y,z,s,s*(.72+rand()*.34),s,0,angle+k*2.1)
      if(j%6===0&&i%3===0){
        const h=.29+rand()*.2;bar(leaf,[x,y,z],[x+.025,y+h,z],.007)
        for(let k=0;k<5;k++){const a=k*Math.PI*.4;batch(flowerGeo,i%2?petal:purplePetal,x+Math.cos(a)*.048,y+h,z+Math.sin(a)*.048,.049,.02,.033,0,-a)}
      }
    }
    // Smaller, feathered ground plants interrupt the repeated grass-blade silhouette.
    if(i%20===0){
      for(let j=0;j<5;j++){
        const a=j*1.256+.2,reach=.28+rand()*.18,h=.26+rand()*.15
        for(let k=0;k<4;k++){const t=(k+1)/5;for(const side of [-1,1]){
          const x=cx+Math.cos(a)*reach*t+Math.cos(a+1.57)*side*.05,z=cz+Math.sin(a)*reach*t+Math.sin(a+1.57)*side*.05
          if(plantable(x,z))batch(leafGeo,k%2?leaf:leafShade,x,y+Math.sin(t*1.57)*h,z,.07*(1-t*.55),.035,.11*(1-t*.45),.32,a+side*.75)
        }}
      }
    }
  }
  // Vines spilling over stone ledges and roofs.
  for(const r of ROOMS)for(let i=0;i<24;i++){
    const x=r.x+(rand()-.5)*(r.width+1),z=r.front+rand()*.3,top=r.y+r.height+.4,len=.6+rand()*2
    if(Math.abs(x-r.x)<2.4)continue
    const count=mobile?7:10
    for(let j=0;j<count;j++){const t=j/count;batch(leafGeo,j%2?leaf:leafLight,x+Math.sin(j)*.09,top-t*len,z,.09,.045,.13,.8,rand()*6,.3)}
  }
  // Grass grows into roof joints and hangs over their irregular living edges.
  for(const r of ROOMS)for(let i=0;i<(mobile?95:180);i++){
    const dx=(rand()-.5)*(r.width-.8),z=r.front-.35-rand()*(r.depth-.6),y=r.y+r.height+.39
    for(let j=0;j<2;j++)batch(blade,i%4?leaf:leafLight,r.x+dx,y,z,.42,.32+rand()*.3,.42,0,rand()*6)
  }
  // Young wind-shaped trees at the settlement edges.
  for(const [x,z,s] of [[-21,-4,1.4],[23,-9,1.6],[-22,20,1.4],[19,19,1.1],[-18,-23,1.2]]){
    const y=z>9?0:.8
    bar(timber,[x,y,z],[x+.18,y+1.9*s,z-.11],.11*s)
    bar(timber,[x+.18,y+1.9*s,z-.11],[x+.5,y+3.6*s,z-.24],.068*s)
    const branches=mobile?7:10
    for(let j=0;j<branches;j++){
      const a=j*2.4,h=1.6*s+j*.18,dx=Math.cos(a)*s*(.9+rand()*.45)+.24,dz=Math.sin(a)*s*(.9+rand()*.35)
      bar(timber,[x+.2,y+h,z-.1],[x+dx,y+h+.6,z+dz],.033*s)
      for(let shoot=0;shoot<(mobile?4:6);shoot++){
        const t=shoot/6,tx=x+dx+Math.cos(a+shoot)*.39*s,tz=z+dz+Math.sin(a+shoot)*.4*s,ty=y+h+.49+t*.3
        if(shoot%2===0)bar(timber,[x+dx*.75,y+h+.37,z+dz*.75],[tx,ty,tz],.013*s)
        for(let k=0;k<(mobile?8:11);k++){
          const angle=k*2.4,reach=.1+Math.sqrt(rand())*.43*s
          batch(leafGeo,k%5===0?leafShade:k%3?leaf:leafLight,tx+Math.cos(angle)*reach,ty+(rand()-.5)*.38*s,tz+Math.sin(angle)*reach,.105*s,.036*s,.125*s,(rand()-.5)*.8,angle,Math.sin(angle)*.3)
        }
      }
    }
  }
  // Flush static geometry once per material (shadows reuse the same batches).
  for(const [mat,list]of batches){
    const normalized=list.map(g=>g.index?g.toNonIndexed():g)
    const merged=mergeGeometries(normalized,false)
    list.forEach(g=>g.dispose());normalized.forEach(g=>g.dispose())
    if(!merged)throw new Error('Settlement geometry could not be assembled')
    geos.add(merged);const mesh=new T.Mesh(merged,mat)
    mesh.castShadow=mat!==grass&&mat!==leaf&&mat!==leafLight&&mat!==leafShade&&mat!==petal&&mat!==purplePetal
    mesh.receiveShadow=true;environmentRoot.add(mesh)
  }
  ;[boxGeo,softGeo,cylinderGeo,stemGeo,stoneGeo,blade,leafGeo,flowerGeo,...naturalGeos].forEach(g=>g.dispose())
  const cameras=solids.filter(s=>s.kind!=='grass'&&s.kind!=='rail').map(s=>new T.Box3(
    new T.Vector3(...s.position as [number,number,number]).sub(new T.Vector3(...s.halfExtents as [number,number,number])).addScalar(-.22),
    new T.Vector3(...s.position as [number,number,number]).add(new T.Vector3(...s.halfExtents as [number,number,number])).addScalar(.22)
  ))
  let disposed=false
  return {
    solids,
    update(time:number){
      if(disposed)return
      const p=waterGeo.attributes.position
      for(let i=0;i<p.count;i++){const x=waterBase[i*3],z=waterBase[i*3+2];p.setY(i,Math.sin(x*1.7+time*.9)*.018+Math.sin(z*3+time*1.2)*.012)}
      p.needsUpdate=true
      for(const o of animated){if(o instanceof T.Mesh){o.rotation.x=Math.sin(time*.7+o.position.x)*.035;o.rotation.y=Math.sin(time*.5)*.035}else{o.rotation.y=Math.sin(time*.25)*.15}}
    },
    cameraDistance(target:T.Vector3,desired:T.Vector3){
      const delta=desired.clone().sub(target),length=delta.length();delta.normalize()
      let closest=length
      const ray=new T.Ray(target,delta)
      for(const box of cameras){
        if(ray.intersectBox(box,tempV)){const d=target.distanceTo(tempV);if(d>.05)closest=Math.min(closest,Math.max(.5,d-.2))}
      }
      return target.clone().addScaledVector(delta,closest)
    },
    dispose(){
      if(disposed)return;disposed=true
      environmentRoot.removeFromParent();environmentRoot.clear()
      if(scene.background===sky)scene.background=null
      if(scene.environment===sky)scene.environment=null
      geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())
      geos.clear();mats.clear();textures.clear();batches.clear();animated.length=0
    },
  }
}
