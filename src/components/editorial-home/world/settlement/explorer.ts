import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Original, locally modelled explorer. Metres; feet at y=0; forward is -Z.
 * The articulated clothes use authored secondary motion, not cloth simulation.
 */
export type ExplorerMotion = { speed: number; grounded: boolean; turn: number };

type Profile = readonly [y: number, width: number, depth: number, x?: number, z?: number];
type Point = readonly [number, number, number];

/** Smooth elliptical cross-sections give anatomy and tailoring their own silhouette. */
function profileGeometry(rings: readonly Profile[], sides = 18): THREE.BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];
  for (const [y, width, depth, x = 0, z = 0] of rings) {
    for (let j = 0; j < sides; j++) {
      const angle = j / sides * Math.PI * 2;
      vertices.push(x + Math.cos(angle) * width, y, z + Math.sin(angle) * depth);
    }
  }
  const ascending = rings[rings.length - 1][0] > rings[0][0];
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < sides; j++) {
      const a = i * sides + j;
      const b = (i + 1) * sides + j;
      const c = i * sides + (j + 1) % sides;
      const d = (i + 1) * sides + (j + 1) % sides;
      if (ascending) indices.push(a, b, c, c, b, d);
      else indices.push(a, c, b, c, d, b);
    }
  }
  for (const end of [0, rings.length - 1]) {
    const row = rings[end];
    const centre = vertices.length / 3;
    vertices.push(row[3] || 0, row[0], row[4] || 0);
    for (let j = 0; j < sides; j++) {
      const a = end * sides + j;
      const b = end * sides + (j + 1) % sides;
      if ((end === 0) === ascending) indices.push(centre, a, b);
      else indices.push(centre, b, a);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function panelGeometry(rows: readonly [number, number, number, number][]): THREE.BufferGeometry {
  // Rows are y, half-width, centre-x, centre-z; three columns retain a sewn fold.
  const vertices: number[] = [];
  const indices: number[] = [];
  rows.forEach(([y, width, x, z], row) => {
    vertices.push(x - width, y, z, x, y, z + 0.014, x + width, y, z);
    if (row) {
      const a = (row - 1) * 3;
      indices.push(a, a + 3, a + 1, a + 1, a + 3, a + 4);
      indices.push(a + 1, a + 4, a + 2, a + 2, a + 4, a + 5);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createExplorer() {
  const root = new THREE.Group();
  root.name = 'Original explorer — field researcher';
  const rig = new THREE.Group();
  root.add(rig);
  const resources = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();

  function material(color: THREE.ColorRepresentation, roughness = 0.9, metalness = 0) {
    const value = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    materials.add(value);
    return value;
  }
  const cloth = material('#d9d2b9');
  const clothLight = material('#ece3cb');
  const clothShade = material('#b5ad92');
  const lining = material('#b4a48e');
  const trousers = material('#3a4348');
  const trousersLight = material('#525958');
  const leather = material('#4b3528', 0.82);
  const leatherEdge = material('#75533b', 0.78);
  const sole = material('#252823');
  const skin = material('#cba384', 0.91);
  const skinShadow = material('#aa7e64');
  const hair = material('#262824', 0.97);
  const hairLight = material('#393b32', 0.94);
  const dark = material('#32332d');
  const scarfMaterial = material('#9485a8');
  const scarfEdge = material('#c0afd0');
  const brass = material('#ab8b53', 0.42, 0.62);
  for (const value of [cloth, clothLight, clothShade, lining, scarfMaterial, scarfEdge]) {
    value.side = THREE.DoubleSide;
  }

  function mesh(parent: THREE.Group, geometry: THREE.BufferGeometry, mat: THREE.Material, position?: Point) {
    resources.add(geometry);
    const object = new THREE.Mesh(geometry, mat);
    object.castShadow = true;
    object.receiveShadow = true;
    if (position) object.position.set(...position);
    parent.add(object);
    return object;
  }
  function profile(parent: THREE.Group, rings: readonly Profile[], mat: THREE.Material, position?: Point, sides = 18) {
    return mesh(parent, profileGeometry(rings, sides), mat, position);
  }
  function box(parent: THREE.Group, size: Point, mat: THREE.Material, position: Point, round = 0) {
    if (!round) return mesh(parent, new THREE.BoxGeometry(...size), mat, position);
    // Bevelled extrusions are used for leather and metal rather than inflated boxes.
    const [width, height, depth] = size;
    const shape = new THREE.Shape();
    const r = Math.min(round, width * 0.24, height * 0.24);
    shape.moveTo(-width / 2 + r, -height / 2);
    shape.lineTo(width / 2 - r, -height / 2);
    shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + r);
    shape.lineTo(width / 2, height / 2 - r);
    shape.quadraticCurveTo(width / 2, height / 2, width / 2 - r, height / 2);
    shape.lineTo(-width / 2 + r, height / 2);
    shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - r);
    shape.lineTo(-width / 2, -height / 2 + r);
    shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + r, -height / 2);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.001, depth - r), bevelEnabled: true, bevelThickness: r / 2, bevelSize: r / 2, bevelSegments: 2, steps: 1, curveSegments: 3 });
    geometry.translate(0, 0, -depth / 2 + r / 2);
    return mesh(parent, geometry, mat, position);
  }
  function seam(parent: THREE.Group, points: readonly Point[], radius: number, mat: THREE.Material) {
    return mesh(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point))), Math.max(4, points.length * 3), radius, 5, false), mat);
  }
  function joint(parent: THREE.Group, name: string, position: Point) {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(...position);
    parent.add(group);
    return group;
  }
  function polygon(parent: THREE.Group, points: readonly Point[], mat: THREE.Material) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3));
    const indices: number[] = [];
    for (let i = 1; i < points.length - 1; i++) indices.push(0, i, i + 1);
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return mesh(parent, geometry, mat);
  }

  const torso = joint(rig, 'Spine', [0, 0.98, 0]);
  profile(torso, [
    [-0.10, 0.145, 0.088], [0, 0.151, 0.092], [0.10, 0.162, 0.099],
    [0.25, 0.182, 0.108, 0, 0.005], [0.37, 0.207, 0.091],
    [0.415, 0.18, 0.079], [0.46, 0.09, 0.065],
  ], cloth, undefined, 24);
  // Inner shirt and two independently shaped lapels; chest is deliberately not spherical.
  polygon(torso, [[-.062, .43, -.076], [.062, .43, -.076], [.079, .17, -.113], [-.079, .17, -.113]], lining);
  for (const side of [-1, 1]) {
    polygon(torso, [[side * .075, .44, -.078], [side * .164, .37, -.084], [side * .085, .285, -.113], [side * .108, .225, -.113], [side * .013, .115, -.109]], clothLight);
    seam(torso, [[side * .166, .345, .071], [side * .134, .245, .101], [side * .125, .08, .10], [side * .13, -.06, .10]], .0024, clothShade);
    // Welt pockets and buttoned flaps sit on the lower front of the coat.
    box(torso, [.092, .075, .012], clothLight, [side * .111, .048, -.084], .007);
    polygon(torso, [[side * .063, .09, -.092], [side * .159, .09, -.092], [side * .153, .064, -.098], [side * .071, .058, -.098]], clothShade);
    profile(torso, [[0, .007, .005], [.006, .007, .005]], brass, [side * .111, .067, -.103], 8).rotation.x = Math.PI / 2;
    // Tailored shoulder epaulette.
    const epaulette = box(torso, [.083, .009, .053], clothLight, [side * .169, .393, .011], .007);
    epaulette.rotation.z = -side * .16;
  }
  seam(torso, [[0, .405, .075], [0, .28, .118], [0, .14, .105], [0, -.08, .095]], .0026, clothShade);
  seam(torso, [[-.177, .3, .091], [0, .273, .121], [.177, .3, .091]], .003, clothShade);
  // Waist belt is a sculpted elliptical band, with keeper, buckle and utility loop.
  profile(torso, [[-.006, .158, .104], [.032, .159, .104]], leather);
  box(torso, [.045, .043, .015], brass, [.0, .013, -.11], .005);
  box(torso, [.026, .024, .02], leather, [.0, .013, -.12], .003);
  for (const side of [-1, 1]) box(torso, [.012, .051, .011], leatherEdge, [side * .092, .015, -.088], .002);

  const tails: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const tail = joint(torso, side < 0 ? 'Left coat vent' : 'Right coat vent', [side * .072, -.015, .038]);
    const geometry = panelGeometry([[0, .084, 0, .05], [-.13, .086, side * .008, .073], [-.30, .087, side * .015, .094], [-.41, .065, side * .028, .13]]);
    mesh(tail, geometry, cloth);
    seam(tail, [[-side * .079, 0, .05], [-side * .079, -.13, .073], [-side * .072, -.30, .098], [-side * .038, -.405, .13]], .0025, clothShade);
    seam(tail, [[-.03 + side * .028, -.408, .13], [side * .028, -.413, .146], [.06 + side * .028, -.408, .13]], .003, lining);
    tails.push(tail);
  }

  // Articulated lower body. Trousers are shaped at hips, knees, calves and tucked cuffs.
  const legs: { hip: THREE.Group; knee: THREE.Group; ankle: THREE.Group }[] = [];
  for (const side of [-1, 1]) {
    const hip = joint(rig, side < 0 ? 'Left hip' : 'Right hip', [side * .084, .94, 0]);
    profile(hip, [[.035, .078, .09], [-.035, .084, .087], [-.18, .075, .078, side * .008], [-.33, .058, .068], [-.425, .052, .062, 0, -.003]], trousers);
    seam(hip, [[side * .072, -.07, .045], [side * .067, -.23, .039], [side * .046, -.39, .025]], .0023, trousersLight);
    const knee = joint(hip, side < 0 ? 'Left knee' : 'Right knee', [0, -.42, 0]);
    profile(knee, [[.04, .054, .063], [-.022, .055, .065, 0, -.006], [-.13, .063, .068, 0, .007], [-.25, .046, .052, 0, .01], [-.335, .04, .043]], trousers);
    // Subtle stitched knee reinforcement.
    polygon(knee, [[-.031, .025, -.061], [.033, .025, -.061], [.038, -.059, -.065], [-.038, -.059, -.065]], trousersLight);
    const ankle = joint(knee, side < 0 ? 'Left ankle' : 'Right ankle', [0, -.395, .006]);
    profile(ankle, [[.014, .052, .06, 0, -.007], [.073, .048, .057], [.15, .048, .05], [.184, .047, .048]], leather);
    // Asymmetric toe profile: toe extends forward (-Z), heel remains narrow.
    profile(ankle, [[-.11, .056, .115, 0, -.043], [-.087, .061, .12, 0, -.045], [-.049, .06, .116, 0, -.045], [-.009, .051, .079, 0, -.019], [.029, .046, .052, 0, .005]], leather);
    profile(ankle, [[-.125, .059, .12, 0, -.044], [-.103, .063, .124, 0, -.044]], sole);
    profile(ankle, [[.142, .052, .054], [.164, .052, .054]], leatherEdge);
    for (let j = 0; j < 3; j++) seam(ankle, [[-.032, .035 + j * .025, -.051], [0, .038 + j * .025, -.06], [.032, .035 + j * .025, -.051]], .003, leatherEdge);
    seam(ankle, [[-.048, -.066, -.125], [0, -.06, -.155], [.048, -.066, -.125]], .0023, leatherEdge);
    box(ankle, [.01, .023, .018], brass, [side * .055, .15, .009], .002);
    legs.push({ hip, knee, ankle });
  }

  const arms: { shoulder: THREE.Group; elbow: THREE.Group; wrist: THREE.Group }[] = [];
  for (const side of [-1, 1]) {
    const shoulder = joint(torso, side < 0 ? 'Left shoulder' : 'Right shoulder', [side * .193, .373, .007]);
    shoulder.rotation.z = side * .09;
    profile(shoulder, [[.025, .065, .066], [-.037, .069, .071], [-.12, .059, .062], [-.225, .051, .055], [-.278, .048, .05]], cloth);
    seam(shoulder, [[side * .049, -.035, .048], [side * .044, -.14, .04], [side * .039, -.258, .031]], .0025, clothShade);
    const elbow = joint(shoulder, side < 0 ? 'Left elbow' : 'Right elbow', [0, -.272, 0]);
    profile(elbow, [[.035, .049, .052], [-.02, .053, .056], [-.104, .048, .049], [-.215, .039, .04], [-.25, .035, .037]], cloth);
    // Stitched gathered sleeves terminate in narrow contrasting cuff bands.
    profile(elbow, [[-.205, .041, .042], [-.245, .04, .043]], clothLight);
    seam(elbow, [[-.024, -.092, .043], [0, -.084, .052], [.03, -.107, .038]], .0021, clothShade);
    seam(elbow, [[-.031, -.172, .034], [-.006, -.184, .047], [.026, -.176, .039]], .0021, clothShade);
    const wrist = joint(elbow, side < 0 ? 'Left wrist' : 'Right wrist', [0, -.251, -.005]);
    profile(wrist, [[.009, .028, .029], [-.023, .03, .023], [-.063, .033, .022], [-.081, .027, .019]], skin, undefined, 14);
    // Four individually tapered fingers plus the opposed thumb; relaxed, not mitten hands.
    for (let j = 0; j < 4; j++) {
      const length = [0.043, 0.053, 0.049, 0.038][j];
      profile(wrist, [[0, .0068, .008], [-length * .48, .0068, .0072, 0, -.004], [-length, .0045, .005, 0, -.012]], skin, [(j - 1.5) * .014, -.073, .0], 8);
    }
    const thumb = profile(wrist, [[0, .012, .011], [-.024, .010, .009, 0, -.007], [-.044, .0065, .006, 0, -.02]], skin, [-side * .031, -.039, -.001], 10);
    thumb.rotation.z = -side * .43;
    if (side === 1) {
      profile(wrist, [[.003, .032, .033], [-.021, .031, .03]], leather);
      box(wrist, [.029, .021, .012], brass, [0, -.008, -.034], .004);
    }
    arms.push({ shoulder, elbow, wrist });
  }

  const head = joint(torso, 'Head', [0, .47, -.001]);
  profile(head, [[-.015, .041, .041], [.053, .045, .044]], skin);
  profile(head, [
    [.04, .037, .04, 0, -.012], [.065, .061, .06, 0, -.013],
    [.104, .08, .076, 0, -.003], [.159, .089, .086],
    [.205, .087, .087, 0, .004], [.25, .067, .069, 0, .008], [.268, .027, .037, 0, .011],
  ], skin, undefined, 24);
  for (const side of [-1, 1]) {
    profile(head, [[.111, .008, .013], [.119, .018, .021], [.151, .018, .024], [.172, .01, .017]], skin, [side * .086, 0, .002], 12);
    profile(head, [[.124, .007, .01], [.147, .009, .012], [.16, .004, .009]], skinShadow, [side * .096, 0, -.008], 10);
    // Small upper eyelids and brows avoid oversized toy-like eyes.
    seam(head, [[side * .024, .159, -.084], [side * .04, .165, -.085], [side * .054, .159, -.076]], .0028, dark);
    seam(head, [[side * .021, .177, -.083], [side * .038, .18, -.087], [side * .057, .174, -.075]], .004, hair);
  }
  // Nose and lips are modelled features, not a texture decal.
  profile(head, [[.119, .012, .015, 0, -.084], [.13, .015, .023, 0, -.085], [.15, .011, .019, 0, -.081], [.18, .007, .011, 0, -.076]], skin, undefined, 12);
  seam(head, [[-.019, .10, -.075], [0, .098, -.083], [.019, .10, -.075]], .0022, skinShadow);

  // A cropped layered hairstyle with individually swept locks, not a spherical cap.
  profile(head, [[.164, .087, .078, 0, .027], [.2, .095, .092, 0, .012], [.24, .089, .089, 0, .009], [.274, .064, .061, -.009, .004], [.286, .023, .026, -.015, .002]], hair, undefined, 22);
  for (let i = 0; i < 16; i++) {
    const angle = i / 16 * Math.PI * 2;
    const x = Math.cos(angle);
    const z = Math.sin(angle);
    const front = z < 0;
    const lock = profile(head, [[0, .022, .013], [.025, .027, .018, -.005, .006], [.062, .021, .014, -.014, .011], [.092, .002, .003, -.027, .013]], i % 4 === 0 ? hairLight : hair, [x * .073, front ? .184 : .17, z * .074 + .012], 9);
    lock.rotation.z = -.2 + x * .4;
    lock.rotation.x = z * .42;
  }
  for (let i = 0; i < 5; i++) {
    const fringe = profile(head, [[0, .022, .016], [-.031, .018, .014, -.008, -.005], [-.056 - (i % 2) * .013, .002, .003, -.016, -.008]], hair, [(i - 2) * .029, .235, -.069 + Math.abs(i - 2) * .007], 9);
    fringe.rotation.z = -.24;
  }

  // Narrow lavender neck scarf and its two articulated ends, distinct from Sky capes.
  profile(torso, [[.442, .074, .064, 0, .002], [.463, .08, .072], [.483, .066, .061]], scarfMaterial);
  seam(torso, [[-.054, .477, .035], [0, .483, .064], [.054, .477, .035]], .003, scarfEdge);
  const scarf = joint(torso, 'Scarf end', [.044, .457, .056]);
  mesh(scarf, panelGeometry([[0, .043, 0, 0], [-.09, .04, .012, .034], [-.20, .035, .031, .036], [-.30, .032, .012, .06]]), scarfMaterial);
  seam(scarf, [[.042, 0, 0], [.052, -.09, .034], [.066, -.2, .036], [.044, -.299, .06]], .0026, scarfEdge);
  const scarfTip = joint(scarf, 'Scarf hem', [.013, -.296, .063]);
  mesh(scarfTip, panelGeometry([[0, .032, 0, 0], [-.07, .027, -.01, .014], [-.092, .026, -.006, .022]]), scarfMaterial);

  // Field satchel: shaped flap, gusset, buckled straps, and a diagonal shoulder strap.
  const satchel = joint(torso, 'Research satchel', [-.184, -.068, .054]);
  box(satchel, [.143, .191, .075], leather, [0, 0, 0], .016);
  box(satchel, [.145, .094, .014], leatherEdge, [0, .054, .046], .013);
  seam(satchel, [[-.057, .083, .052], [-.063, -.002, .052], [0, -.023, .057], [.063, -.002, .052], [.057, .083, .052]], .0028, leather);
  for (const x of [-.04, .04]) {
    box(satchel, [.019, .15, .009], leatherEdge, [x, -.027, .047], .003);
    box(satchel, [.025, .026, .012], brass, [x, -.025, .055], .003);
    box(satchel, [.013, .016, .014], leather, [x, -.025, .06], .002);
  }
  // Flat continuous strap follows the shoulder front/back instead of crossing the neck.
  const strapBack = mesh(torso, panelGeometry([[.401, .016, .145, .064], [.292, .016, .079, .124], [.139, .016, -.027, .122], [-.002, .016, -.133, .096], [-.059, .016, -.177, .079]]), leather);
  strapBack.name = 'Satchel shoulder strap, back';
  mesh(torso, panelGeometry([[.401, .016, .145, -.063], [.289, .016, .086, -.111], [.138, .016, -.037, -.118], [-.014, .016, -.148, -.088], [-.063, .016, -.177, -.002]]), leather);
  box(torso, [.032, .04, .015], brass, [.066, .264, .134], .004).rotation.z = -.58;

  // Merge the static detail on each joint by material. Articulation is preserved;
  // fingers, hair strands, stitching and buttons do not each cost one draw call.
  function mergeJointDetails(group: THREE.Group) {
    const children = [...group.children];
    for (const child of children) if (child instanceof THREE.Group) mergeJointDetails(child);
    const byMaterial = new Map<THREE.Material, THREE.Mesh[]>();
    for (const child of children) {
      if (child instanceof THREE.Mesh && !Array.isArray(child.material)) {
        const list = byMaterial.get(child.material) || [];
        list.push(child);
        byMaterial.set(child.material, list);
      }
    }
    for (const [mat, meshes] of byMaterial) {
      if (meshes.length < 2) continue;
      const geometries = meshes.map(object => {
        object.updateMatrix();
        let geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
        // Primitives have UVs but authored profile meshes do not; the model uses no textures.
        for (const key of Object.keys(geometry.attributes)) if (key !== 'position' && key !== 'normal') geometry.deleteAttribute(key);
        geometry.applyMatrix4(object.matrix);
        return geometry;
      });
      const merged = mergeGeometries(geometries, false);
      geometries.forEach(geometry => geometry.dispose());
      if (!merged) continue;
      for (const object of meshes) {
        group.remove(object);
        resources.delete(object.geometry);
        object.geometry.dispose();
      }
      mesh(group, merged, mat);
    }
  }
  mergeJointDetails(rig);

  let elapsed = 0;
  let phase = 0;
  let stride = 0;
  let airborne = 0;
  let turnLean = 0;
  let disposed = false;
  function update(dt: number, motion: ExplorerMotion) {
    if (disposed) return;
    const step = Math.min(.05, Math.max(0, dt));
    const speed = Number.isFinite(motion.speed) ? Math.max(0, motion.speed) : 0;
    const blend = 1 - Math.exp(-step * 11);
    elapsed += step;
    stride += (Math.min(1, speed / 2.9) - stride) * blend;
    airborne += ((motion.grounded ? 0 : 1) - airborne) * blend;
    turnLean += (THREE.MathUtils.clamp(motion.turn || 0, -1, 1) - turnLean) * blend;
    // Cadence follows travel speed. A standing explorer settles into a quiet breath.
    phase += step * (speed > .06 ? 5 + Math.min(speed, 5.5) * 1.8 : 0);
    const gait = stride * (1 - airborne * .85);
    const run = THREE.MathUtils.smoothstep(speed, 3.1, 5.3);
    const walkAngle = .50 + run * .24;
    rig.position.y = Math.sin(elapsed * 1.7) * .0025 * (1 - stride) - gait * .064 + Math.abs(Math.sin(phase)) * .013 * gait;
    torso.rotation.x = -.027 - stride * (.035 + run * .08) + airborne * .045;
    torso.rotation.z = -turnLean * .065 * stride + Math.sin(phase) * .019 * gait;
    torso.rotation.y = Math.sin(phase) * .043 * gait;
    head.rotation.y = -torso.rotation.y * .55 + turnLean * .13;
    head.rotation.x = Math.sin(elapsed * .75) * .015 * (1 - stride) + stride * .028;

    legs.forEach(({ hip, knee, ankle }, index) => {
      const angle = phase + index * Math.PI;
      const swing = Math.sin(angle);
      const recovery = Math.max(0, Math.cos(angle));
      // Two-link leg solution keeps the stance sole at ground level rather than
      // letting both feet rise as a side effect of rotating thighs and knees.
      const thighLength = .42;
      const shinLength = .395;
      const targetZ = -swing * (.215 + run * .052) * gait;
      const targetY = -.815 - rig.position.y + recovery * (.115 + run * .055) * gait;
      const distance = Math.min(thighLength + shinLength - .0002, Math.hypot(targetY, targetZ));
      const kneeAngle = -Math.acos(THREE.MathUtils.clamp((distance * distance - thighLength * thighLength - shinLength * shinLength) / (2 * thighLength * shinLength), -1, 1));
      const hipAngle = Math.atan2(-targetZ, -targetY) - Math.atan2(shinLength * Math.sin(kneeAngle), thighLength + shinLength * Math.cos(kneeAngle));
      hip.rotation.x = hipAngle * (1 - airborne) + (swing * walkAngle * .15 - .12) * airborne;
      hip.rotation.z = (index === 0 ? -.013 : .013) - turnLean * .014 * stride;
      knee.rotation.x = kneeAngle * (1 - airborne) - .3 * airborne;
      ankle.rotation.x = -(hipAngle + kneeAngle) * (1 - airborne) + .08 * airborne;
    });
    arms.forEach(({ shoulder, elbow, wrist }, index) => {
      const swing = Math.sin(phase + index * Math.PI);
      shoulder.rotation.x = -swing * (.42 + run * .19) * gait - airborne * .19;
      shoulder.rotation.z = (index === 0 ? -.085 : .085) + (index === 0 ? -1 : 1) * airborne * .1;
      elbow.rotation.x = .12 + (.11 + run * .37) * stride + Math.max(0, -swing) * .18 * gait;
      wrist.rotation.x = -.06 + swing * .035 * gait;
      wrist.rotation.z = (index === 0 ? -.055 : .055);
    });
    tails.forEach((tail, index) => {
      tail.rotation.x = -.045 - stride * .2 + Math.sin(phase + index * Math.PI + .5) * .095 * gait;
      tail.rotation.z = (index === 0 ? -.03 : .03) + Math.sin(elapsed * 2.1 + index) * .016 + turnLean * .08;
    });
    scarf.rotation.x = -.1 - stride * .32 + Math.sin(elapsed * 2.8) * .045 + Math.sin(phase + .9) * .035 * gait;
    scarf.rotation.z = Math.sin(elapsed * 2.2) * .04 - turnLean * .18;
    scarfTip.rotation.x = -.08 + Math.sin(elapsed * 3.4 + .8) * .16 + stride * -.22;
    satchel.rotation.x = Math.sin(phase + .9) * .055 * gait;
    satchel.rotation.z = Math.sin(phase) * .028 * gait;
  }
  update(0, { speed: 0, grounded: true, turn: 0 });

  return {
    root,
    update,
    dispose() {
      if (disposed) return;
      disposed = true;
      resources.forEach(geometry => geometry.dispose());
      materials.forEach(value => value.dispose());
      resources.clear();
      materials.clear();
      root.clear();
    },
  };
}
