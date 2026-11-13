// 3D exercise animations for the Animasi tab, and the stills its cards show.
// Every move is stored as a 2D rig (a side or front view): two poses, A and B, as absolute joint angles in
// degrees (0 = right on screen, 90 = up), a joint that stays put (anchor), the equipment as shapes in the same
// 400-wide picture, and the muscles to colour (hl). Here that picture becomes a 3D scene: each angle aims a
// bone of a rigged mannequin (Mixamo X Bot from the three.js examples), a segment drawn shorter than its
// length (uaS, thS …) leans out of the picture, and points of the picture map onto the floor plane.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

// The body: Superhero Male of Universal Base Characters by Quaternius (CC0), repacked by hand: bones carry the Mixamo
// names used below, the colour textures are gone (the body is painted here), the normal map stays so the muscles show.
const MODEL = new URL('./model/muscle.glb', import.meta.url).href;
const RAD = Math.PI / 180, V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), UP = V(0, 1, 0);
const lerp = (p, q, t) => p + (q - p) * t, ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const lerpAng = (p, q, t) => { let d = ((q - p + 540) % 360) - 180; return p + d * t };
// the app's colours: the main muscle in the accent blue, the helping ones in the light blue of the body map
// a grey body on a dark stage; the working muscle glows orange, the helping one a paler orange
const C_MAIN = 0xff7a1a, C_HELP = 0xffb680, C_BODY = 0xb9bdc3, C_JOINT = 0x9aa0a8, C_HAIR = 0xb9bdc3, C_EYE = 0xa9aeb5;
const HOLD = new Set(['barbell', 'dumbbell', 'cable', 'rope', 'bar', 'lever', 'kb', 'dipbar']);

let modelP = null;
const loadModel = () => modelP || (modelP = new GLTFLoader().loadAsync(MODEL).catch(e => { modelP = null; throw e }));

const _a = V(), _b = V(), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion();
function rotateWorld(bone, dq) {
  bone.getWorldQuaternion(_q1); bone.parent.getWorldQuaternion(_q2);
  bone.quaternion.copy(_q2.invert().multiply(dq.clone().multiply(_q1))); bone.updateWorldMatrix(false, true);
}
function aim(bone, child, dir) {
  if (!bone || !child) return;
  bone.getWorldPosition(_a); child.getWorldPosition(_b);
  rotateWorld(bone, _q3.setFromUnitVectors(_b.sub(_a).normalize(), dir.clone().normalize()));
}
const wp = b => b.getWorldPosition(V());

function bodyMaterial(color, U) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: .5, metalness: 0 });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'attribute float hlA;\nattribute float hlB;\nattribute float hlC;\nvarying float vHlA;\nvarying float vHlB;\nvarying float vHlC;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vHlA = hlA; vHlB = hlB; vHlC = hlC;');
    sh.fragmentShader = 'uniform float uA, uB;\nuniform vec3 cA, cB;\nvarying float vHlA;\nvarying float vHlB;\nvarying float vHlC;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      diffuseColor.rgb = mix(diffuseColor.rgb, cA, clamp(vHlA, 0.0, 1.0) * uA);
      diffuseColor.rgb = mix(diffuseColor.rgb, cB, clamp(vHlB, 0.0, 1.0) * uB);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.035, 0.038, 0.045), clamp(vHlC, 0.0, 1.0));`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      totalEmissiveRadiance += cA * clamp(vHlA, 0.0, 1.0) * uA * 0.5 * (1.0 - clamp(vHlC, 0.0, 1.0));`);
  };
  return m;
}

// a lying body faces down (plank, push-up) when its arms prop it up; otherwise up (bench press, crunch)
const prone = an => { const A = an.A, t = A.torso ?? 90; return t > 120 && t < 240 && A.ua < -55 && A.ua > -125 };

// The scene for one move. Returns { scene, camera, target, radius, set(t, k) } where t runs 0 … 1 from pose A
// to pose B, and k (0 … 1) deepens the muscle colour while it works.
async function build(item) {
  const an = item.an, gltf = await loadModel();
  const scene = new THREE.Scene(), root = cloneSkinned(gltf.scene);
  scene.add(root); root.updateMatrixWorld(true);
  const bones = {}; root.traverse(o => { if (o.isBone) bones[o.name.replace(/^mixamorig:?/, '')] = o });
  const B = n => bones[n];
  const L = wp(B('LeftArm')).sub(wp(B('RightArm'))).setY(0).normalize(), F = wp(B('LeftToeBase')).sub(wp(B('LeftFoot'))).setY(0).normalize();
  const front = an.view === 'front', sig = !front && prone(an) ? -1 : 1, H = front ? L.clone() : F.clone().multiplyScalar(sig);
  const k = wp(B('LeftUpLeg')).distanceTo(wp(B('LeftLeg'))) / 70, ankY = wp(B('LeftFoot')).y, GY = 320 + ankY / k;
  // a point of the 2D picture in the world (lateral offset z in metres, + = the body's left)
  const map = (x, y, z = 0) => H.clone().multiplyScalar((x - 200) * k).addScaledVector(UP, (GY - y) * k).addScaledVector(L, z);
  const vec2 = (dx, dy) => H.clone().multiplyScalar(dx * k).addScaledVector(UP, -dy * k);
  const rest = new Map(); root.traverse(o => { if (o.isBone) rest.set(o, o.quaternion.clone()) });

  // muscle colours from skin weights, the facing of each vertex, and its distance from the shoulder or hip
  const hl = an.hl || [], hp = new Set(an.hp || hl.slice(0, 1)), U = { uA: { value: .8 }, uB: { value: .55 }, cA: { value: new THREE.Color(C_MAIN) }, cB: { value: new THREE.Color(C_HELP) } };
  root.traverse(o => {
    if (!o.isSkinnedMesh) return;
    o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
    o.geometry = o.geometry.clone();
    const was = o.material, kind = was?.name || '';
    o.material = bodyMaterial(kind === 'hair' ? C_HAIR : kind === 'eyes' ? C_EYE : /joint/i.test(o.name) || /joint/i.test(kind) ? C_JOINT : C_BODY, U);
    if (was?.normalMap) { o.material.normalMap = was.normalMap; o.material.normalScale.copy(was.normalScale) }
    const g = o.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, nrm = g.attributes.normal, pos = g.attributes.position;
    const ix = n => o.skeleton.bones.indexOf(B(n)), both = n => [ix('Left' + n), ix('Right' + n)];
    const grp = { chest: [ix('Spine2')], core: [ix('Spine'), ix('Spine1')], back: [ix('Spine1'), ix('Spine2')], traps: [...both('Shoulder'), ix('Neck')],
      arm: both('Arm'), fore: both('ForeArm'), thigh: both('UpLeg'), shin: both('Leg'), hips: [ix('Hips')] };
    const shL = wp(B('LeftArm')), shR = wp(B('RightArm')), hipL = wp(B('LeftUpLeg')), hipR = wp(B('RightUpLeg'));
    const nm = new THREE.Matrix3().getNormalMatrix(o.matrixWorld), n = V(), p = V(), A = new Float32Array(si.count), Bv = new Float32Array(si.count), Cv = new Float32Array(si.count), waist = wp(B('Hips')).y + .09, hem = hipL.y - .2;
    for (let i = 0; i < si.count; i++) {
      const w = {}; for (const g2 in grp) w[g2] = 0;
      for (let c = 0; c < 4; c++) { const bi = si.getComponent(i, c), ww = sw.getComponent(i, c); for (const g2 in grp) if (grp[g2].includes(bi)) w[g2] += ww }
      n.fromBufferAttribute(nrm, i).applyMatrix3(nm).normalize(); p.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      const fr = THREE.MathUtils.smoothstep(n.dot(F), -.05, .45), bk = THREE.MathUtils.smoothstep(-n.dot(F), -.05, .45);
      const nearSh = 1 - THREE.MathUtils.smoothstep(Math.min(p.distanceTo(shL), p.distanceTo(shR)), .07, .14), nearHip = 1 - THREE.MathUtils.smoothstep(Math.min(p.distanceTo(hipL), p.distanceTo(hipR)), .08, .16);
      const m = { chest: w.chest * fr, core: w.core * fr, back: w.back * bk, traps: w.traps * (.4 + bk), delt: w.arm * nearSh + w.traps * .3 * fr,
        biceps: w.arm * (1 - nearSh) * fr, triceps: w.arm * (1 - nearSh) * bk, forearms: w.fore, quads: w.thigh * fr * (1 - nearHip * .5),
        hams: w.thigh * bk * (1 - nearHip), glutes: (w.hips * bk + w.thigh * bk * nearHip) * (p.y < hipL.y + .05 ? 1 : 0), calves: w.shin * bk };
      let a = 0, b = 0;
      hl.forEach(key => { const v = Math.min(1, (m[key] || 0) * 1.5); if (hp.has(key)) a = Math.max(a, v); else b = Math.max(b, v) });
      A[i] = a; Bv[i] = b;
      // the shorts: from the waist to a hand below the hip, on the trunk and thighs only
      Cv[i] = kind === 'body' && w.hips + w.thigh + w.core > .5 ? THREE.MathUtils.smoothstep(p.y, hem - .012, hem + .012) * (1 - THREE.MathUtils.smoothstep(p.y, waist - .012, waist + .012)) : 0;
    }
    g.setAttribute('hlA', new THREE.BufferAttribute(A, 1)); g.setAttribute('hlB', new THREE.BufferAttribute(Bv, 1)); g.setAttribute('hlC', new THREE.BufferAttribute(Cv, 1));
  });

  const hold = (an.eq || []).some(e => HOLD.has(e.t) || (e.t === 'pad' && e.at === 'wri'));
  // a direction from an angle of the picture; a segment drawn shorter than its length leans out of it,
  // sideways in a side view (outward) and towards the viewer in a front view
  const dirOf = (deg, s, out, horiz) => {
    const d = horiz.clone().multiplyScalar(Math.cos(deg * RAD)).addScaledVector(UP, Math.sin(deg * RAD));
    if (s != null && s < 1) d.multiplyScalar(Math.max(s, .05)).addScaledVector(front ? F : out, Math.sqrt(1 - Math.min(s, 1) ** 2));
    return d.normalize();
  };
  const FINGERS = ['Index', 'Middle', 'Ring', 'Pinky'];
  function pose(P) {
    rest.forEach((q, b) => b.quaternion.copy(q)); root.position.set(0, 0, 0); root.updateMatrixWorld(true);
    const tor = P.torso ?? 90, th = Math.atan2(sig * Math.cos(tor * RAD), Math.sin(tor * RAD));
    rotateWorld(B('Hips'), new THREE.Quaternion().setFromAxisAngle(UP.clone().cross(F).normalize(), th));
    aim(B('Neck'), B('Head'), dirOf(P.head ?? tor, null, L, H));
    ['Left', 'Right'].forEach((S, i) => {
      const out = i ? L.clone().negate() : L.clone(), two = i && !front ? '2' : '';
      // front view: the arm on the right of the picture is the body's left; uaL/faL is the other one, in screen angles
      const hz = front ? (i ? (P.uaL != null ? L : L.clone().negate()) : L) : H;
      const get = (key) => front && i && P[key + 'L'] != null ? P[key + 'L'] : P[key + two] ?? P[key];
      const fa = dirOf(get('fa'), P.faS, out, hz);
      aim(B(S + 'Arm'), B(S + 'ForeArm'), dirOf(get('ua'), P.uaS, out, hz));
      aim(B(S + 'ForeArm'), B(S + 'Hand'), fa);
      aim(B(S + 'Hand'), B(S + 'HandMiddle1'), fa);
      const lh = front ? (i ? L.clone().negate() : L) : H;
      aim(B(S + 'UpLeg'), B(S + 'Leg'), dirOf(P['th' + two] ?? P.th ?? -90, P.thS, out, lh));
      aim(B(S + 'Leg'), B(S + 'Foot'), dirOf(P['sh' + two] ?? P.sh ?? -90, P.shS, out, lh));
      aim(B(S + 'Foot'), B(S + 'ToeBase'), front ? F.clone().addScaledVector(UP, -.15).normalize() : dirOf(P['ft' + two] ?? P.ft ?? 0, null, out, H));
      if (hold) {   // fingers wrap whatever the hand holds
        const i1 = B(S + 'HandIndex1'), p1 = B(S + 'HandPinky1'), m1 = B(S + 'HandMiddle1');
        if (i1 && p1 && m1) {
          const across = wp(i1).sub(wp(p1)).normalize(), along = wp(m1).sub(wp(B(S + 'Hand'))).normalize(), palm = along.clone().cross(across).multiplyScalar(i ? -1 : 1);
          const turn = deg => { const d = along.clone().applyAxisAngle(across, deg * RAD); return d.dot(palm) >= 0 ? d : along.clone().applyAxisAngle(across, -deg * RAD) };
          FINGERS.forEach(fn => [1, 2, 3].forEach((n, j) => aim(B(S + 'Hand' + fn + n), B(S + 'Hand' + fn + (n + 1)), turn([45, 105, 160][j]))));
        }
      }
    });
    root.updateMatrixWorld(true);
    // keep the anchor joint where the picture puts it (pairs by their middle; sideways offsets stay)
    const a = an.anchor || { pt: 'ank', x: 200, y: 320 };
    const j0 = { hip: ['Hips'], ank: ['LeftFoot', 'RightFoot'], ank2: ['RightFoot'], toe: ['LeftToeBase', 'RightToeBase'], wri: ['LeftHand', 'RightHand'],
      sho: ['LeftArm', 'RightArm'], kne: ['LeftLeg', 'RightLeg'], elb: ['LeftForeArm', 'RightForeArm'] }[a.pt] || ['Hips'];
    const j = !front && j0.length === 2 && ['ua2', 'fa2', 'th2', 'sh2'].some(key => key in an.A) ? [j0[0]] : j0;
    const cur = j.reduce((s, n) => s.add(wp(B(n))), V()).multiplyScalar(1 / j.length), d = map(a.x, a.y).sub(cur);
    d.addScaledVector(front ? F : L, -d.dot(front ? F : L));
    root.position.add(d); root.updateMatrixWorld(true);
  }

  // equipment, rebuilt each frame where it follows the hands
  const M = {
    metal: new THREE.MeshStandardMaterial({ color: 0x8a94a1, roughness: .3, metalness: .85 }),
    plate: new THREE.MeshStandardMaterial({ color: 0x15171b, roughness: .5, metalness: .25 }),
    pad: new THREE.MeshStandardMaterial({ color: 0x3a4049, roughness: .7 }),
    frame: new THREE.MeshStandardMaterial({ color: 0x6b7480, roughness: .45, metalness: .5 }),
    cable: new THREE.MeshStandardMaterial({ color: 0x8b939e, roughness: .5 }),
    band: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: .6 }),
    bell: new THREE.MeshStandardMaterial({ color: 0x15171b, roughness: .5, metalness: .3 })
  };
  const fixed = new THREE.Group(), moving = new THREE.Group(); scene.add(fixed, moving);
  const box = (g, mat, c, ax, ay, w, h, d) => {   // a box from its centre and its two in-picture axes
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), az = ax.clone().cross(ay).normalize();
    m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(ax, ay, az)); m.position.copy(c); m.castShadow = m.receiveShadow = true; g.add(m); return m;
  };
  const rod = (g, mat, p, q, r) => {
    const len = p.distanceTo(q); if (len < 1e-4) return;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat);
    m.position.copy(p).add(q).multiplyScalar(.5); m.quaternion.setFromUnitVectors(UP, q.clone().sub(p).normalize()); m.castShadow = true; g.add(m); return m;
  };
  const disc = (g, mat, c, axis, r, w) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 28), mat); m.position.copy(c); m.quaternion.setFromUnitVectors(UP, axis.clone().normalize()); m.castShadow = true; g.add(m) };
  const rot2 = (x, y, e) => { if (!e.ang) return [x, y]; const c = Math.cos(e.ang * RAD), s = Math.sin(e.ang * RAD), cx = e.cx ?? x, cy = e.cy ?? y; return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c] };
  const ground = p => p.clone().setY(0);
  const slab = (e, mat, depth, sh, foot) => {   // bench, seat, step: a rectangle of the picture, maybe turned about (cx, cy)
    const [cx, cy] = rot2(e.x + e.w / 2, e.y + e.h / 2, e), ang = (e.ang || 0) * RAD;
    const ax = H.clone().multiplyScalar(Math.cos(ang)).addScaledVector(UP, -Math.sin(ang)).normalize(), ay = H.clone().multiplyScalar(Math.sin(ang)).addScaledVector(UP, Math.cos(ang)).normalize();
    if (front) { const back = e.h > e.w; box(fixed, mat, map(cx, cy, 0).add(sh).addScaledVector(F, back ? -.24 : -.06), L.clone(), UP.clone(), e.w * k, e.h * k, back ? .1 : .42) }
    else if (foot) {   // a step stands on the floor: its top where the foot is, its bottom on the ground
      const top = map(cx, e.y).add(sh).y, c = map(cx, cy).add(sh); c.y = Math.max(top, .02) / 2; box(fixed, mat, c, H.clone(), UP.clone(), e.w * k, Math.max(top, .02), depth);
    } else box(fixed, mat, map(cx, cy).add(sh), ax, ay, e.w * k, e.h * k, depth);
    if (!foot) (e.legs || []).forEach(x => { const [lx, ly] = rot2(x, e.y + e.h, e), q = map(lx, ly).add(sh); [-.12, .12].forEach(z => rod(fixed, M.frame, q.clone().addScaledVector(L, front ? 0 : z), ground(q).addScaledVector(L, front ? 0 : z), .02)) });
  };
  // where the 2D picture puts each joint in pose P: the rig's segment lengths chained from the hip, moved so the
  // anchor joint sits on its point (limb 1 = the body's left, the near side of a side view, the right of a front view)
  const LEN = { torso: 90, ua: 58, fa: 54, th: 70, sh: 66, ft: 20 };
  function joints2(P) {
    const v = (a, len, mirror) => [Math.cos(a * RAD) * len * (mirror ? -1 : 1), -Math.sin(a * RAD) * len];
    const add = (p, q) => [p[0] + q[0], p[1] + q[1]], J = { hip: [0, 0] };
    J.sho = add(J.hip, v(P.torso ?? 90, LEN.torso)); J.mid = [J.sho[0] / 2, J.sho[1] / 2]; J.head = add(J.sho, v(P.head ?? P.torso ?? 90, 22));
    [['', false], ['2', true]].forEach(([n, two]) => {
      const sfx = two && !front ? '2' : '', g = key => front && two && P[key + 'L'] != null ? P[key + 'L'] : P[key + sfx] ?? P[key];
      const mir = front && two && P.uaL == null, legMir = front && two;
      const sho = add(J.sho, front ? [two ? -22 : 22, 0] : [0, 0]), hip = add(J.hip, front ? [two ? -10 : 10, 0] : [0, 0]);
      J['elb' + n] = add(sho, v(g('ua'), LEN.ua * (P.uaS ?? 1), mir)); J['wri' + n] = add(J['elb' + n], v(g('fa'), LEN.fa * (P.faS ?? 1), mir));
      J['kne' + n] = add(hip, v(P['th' + sfx] ?? P.th ?? -90, LEN.th * (P.thS ?? 1), legMir)); J['ank' + n] = add(J['kne' + n], v(P['sh' + sfx] ?? P.sh ?? -90, LEN.sh * (P.shS ?? 1), legMir));
      J['toe' + n] = add(J['ank' + n], v(front ? -90 : P['ft' + sfx] ?? P.ft ?? 0, LEN.ft, legMir));
    });
    const a = an.anchor || { pt: 'ank', x: 200, y: 320 }, pair = front && J[a.pt + '2'] && !/2$/.test(a.pt);
    const o = pair ? [(J[a.pt][0] + J[a.pt + '2'][0]) / 2, (J[a.pt][1] + J[a.pt + '2'][1]) / 2] : J[a.pt] || J.hip;
    for (const j in J) J[j] = [J[j][0] - o[0] + a.x, J[j][1] - o[1] + a.y];
    return J;
  }
  const J3 = { hip: 'Hips', mid: 'Spine1', sho: 'LeftArm', head: 'Head', elb: 'LeftForeArm', kne: 'LeftLeg', ank: 'LeftFoot', toe: 'LeftToeBase', elb2: 'RightForeArm', kne2: 'RightLeg', ank2: 'RightFoot', toe2: 'RightToeBase' };
  const joints3 = () => { const o = {}; for (const j in J3) o[j] = wp(B(J3[j])); const [l, r] = ends(); o.wri = l.p; o.wri2 = r.p; return o };
  // distance in the picture from a joint to a piece of equipment
  const segD = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy) };
  const rectD = (p, e) => {
    let q = p;
    if (e.ang) { const c = Math.cos(-e.ang * RAD), s2 = Math.sin(-e.ang * RAD), cx = e.cx ?? 0, cy = e.cy ?? 0; q = [cx + (p[0] - cx) * c - (p[1] - cy) * s2, cy + (p[0] - cx) * s2 + (p[1] - cy) * c] }
    return Math.hypot(Math.max(e.x - q[0], 0, q[0] - e.x - e.w), Math.max(e.y - q[1], 0, q[1] - e.y - e.h));
  };
  const eqD = (p, e) => e.t === 'rail' ? segD(p, [e.x1, e.y1], [e.x2, e.y2]) : e.t === 'dipbar' ? segD(p, [e.x - 45, e.y], [e.x + 45, e.y]) : e.t === 'wall' ? segD(p, [e.x, e.y1], [e.x, GY]) : e.t === 'bar' ? segD(p, [e.x1, e.y], [e.x2, e.y]) : rectD(p, e);
  // the mannequin's proportions differ from the picture's, so each fixed piece moves onto the joint that touches it
  function buildFixed() {
    const poses = [0, 1].map(t => { pose(at(t)); return { j2: joints2(at(t)), j3: joints3() } });
    (an.eq || []).forEach(e => {
      if (!['bench', 'seat', 'step', 'wall', 'rail', 'dipbar'].includes(e.t) && !(e.t === 'bar' && front)) return;
      let best = null;
      poses.forEach(P => { for (const j in P.j2) { if (!P.j3[j]) continue; const d = eqD(P.j2[j], e); if (!best || d < best.d) best = { d, j, P } } });
      const sh = V(); let hand = null;
      if (best && best.d < 45) {
        sh.copy(best.P.j3[best.j]).sub(map(...best.P.j2[best.j])); sh.addScaledVector(L, -sh.dot(L)); if (front) sh.addScaledVector(F, -sh.dot(F));
        if (/^wri/.test(best.j)) hand = best.P.j3;
      }
      const zs = hand && !front ? [hand.wri.dot(L), hand.wri2.dot(L)] : [-.24, .24];
      if (e.t === 'bench' || e.t === 'seat') slab(e, M.pad, .34, sh);
      else if (e.t === 'step') slab(e, M.frame, .5, sh, true);
      else if (e.t === 'wall') box(fixed, new THREE.MeshStandardMaterial({ color: 0xdfe7f5, roughness: .9 }), map(e.x - 4, (e.y1 + GY) / 2).add(sh.clone().setY(0)), H.clone(), UP.clone(), .06, (GY - e.y1) * k, 1.6);
      else if (e.t === 'rail') zs.forEach(z => rod(fixed, M.frame, map(e.x1, e.y1, front ? 0 : z).add(sh), map(e.x2, e.y2, front ? 0 : z).add(sh), .016));
      else if (e.t === 'dipbar') (hand ? zs : [-.26, .26]).forEach(z => { const a = map(e.x - 45, e.y, z).add(sh), b = map(e.x + 45, e.y, z).add(sh), post = map(e.x + 35, e.y, z).add(sh); rod(fixed, M.metal, a, b, .018); rod(fixed, M.frame, post, ground(post), .025) });
      else if (e.t === 'bar') rod(fixed, M.metal, map(e.x1, e.y).add(sh), map(e.x2, e.y).add(sh), .016);
    });
  }
  const ends = () => ['Left', 'Right'].map(S => {
    const h = wp(B(S + 'Hand')), m = wp(B(S + 'HandMiddle1')), i1 = B(S + 'HandIndex1'), p1 = B(S + 'HandPinky1');
    return { p: h.clone().lerp(m, 1.6), f: m.clone().sub(h).normalize(), x: i1 && p1 ? wp(i1).sub(wp(p1)).normalize() : L.clone() };
  });
  function equip() {
    moving.children.forEach(o => o.geometry?.dispose()); moving.clear();
    const [hl2, hr] = ends(), mid = hl2.p.clone().add(hr.p).multiplyScalar(.5), lat = hl2.p.clone().sub(hr.p);
    const latN = lat.lengthSq() > 1e-4 ? lat.clone().normalize() : L.clone();
    (an.eq || []).forEach(e => {
      if (e.t === 'barbell') { const r = (e.r || 22) * k * 1.1, ax = latN; rod(moving, M.metal, mid.clone().addScaledVector(ax, -.75), mid.clone().addScaledVector(ax, .75), .014); [-1, 1].forEach(s => disc(moving, M.plate, mid.clone().addScaledVector(ax, s * .6), ax, r, .045)) }
      else if (e.t === 'dumbbell') [hl2, hr].forEach(h => { rod(moving, M.metal, h.p.clone().addScaledVector(h.x, -.09), h.p.clone().addScaledVector(h.x, .09), .013); [-1, 1].forEach(s => disc(moving, M.bell, h.p.clone().addScaledVector(h.x, s * .085), h.x, .062, .05)) });
      else if (e.t === 'kb') { const s = new THREE.Mesh(new THREE.SphereGeometry((e.r || 13) * k * 1.3, 20, 16), M.bell); s.position.copy(mid).addScaledVector(UP, -.11); s.castShadow = true; moving.add(s) }
      else if (e.t === 'pad') {
        // elbL / elbR: one side of a front view (L = the left of the picture, the body's right)
        const side = /[LR]$/.test(e.at) ? (e.at.endsWith('L') ? 'Right' : 'Left') : null, at0 = side ? e.at.slice(0, -1) : e.at;
        const j = { wri: 'Hand', kne: 'Leg', ank: 'Foot', elb: 'ForeArm', sho: 'Arm', hip: 'UpLeg' }[at0] || 'Leg', r = Math.max(.04, (e.r || 9) * k);
        if (side) {   // a pad against the outside of that limb, its axis towards the viewer
          const c = wp(B(side + j)).addScaledVector(L, (side === 'Left' ? 1 : -1) * (r + .03));
          rod(moving, M.pad, c.clone().addScaledVector(F, -.1), c.clone().addScaledVector(F, .1), r);
        } else {
          // a one-sided move (limb 2 has its own angles) gets a short pad on limb 1 only
          const one = !front && ['ua2', 'fa2', 'th2', 'sh2'].some(key => key in an.A || key in (an.B || {}));
          const a = wp(B('Left' + j)), b = wp(B('Right' + j)), c = (one ? a : a.clone().add(b).multiplyScalar(.5)).add(vec2(...(e.off || [0, 0]))), w = one ? .11 : .2;
          rod(moving, M.pad, c.clone().addScaledVector(L, -w), c.clone().addScaledVector(L, w), r);
        }
      }
      else if (e.t === 'bar' && !front) { const c = mid.clone().setY((GY - e.y) * k); c.addScaledVector(L, -c.dot(L)); rod(moving, M.metal, c.clone().addScaledVector(L, -.7), c.clone().addScaledVector(L, .7), .016) }
      else if (e.t === 'cable') {
        const src = (h, i) => { const x = e.mirror && i ? 400 - e.from[0] : e.from[0]; const p = map(x, e.from[1]); if (!front) p.addScaledVector(L, h.p.dot(L)); return p };
        const hs = front && !e.mirror ? [e.from[0] >= 200 ? hl2 : hr] : [hl2, hr];
        hs.forEach((h, i) => { const s = src(h, i); rod(moving, M.cable, s, h.p, .006); const pul = new THREE.Mesh(new THREE.SphereGeometry(.035, 16, 12), M.frame); pul.position.copy(s); moving.add(pul) });
      }
      else if (e.t === 'rope') { rod(moving, M.cable, hl2.p, hr.p, .012); rod(moving, M.cable, mid, mid.clone().addScaledVector(hl2.f.clone().add(hr.f).normalize(), 1.2), .006) }
      else if (e.t === 'lever') {
        const piv = (i) => { const x = e.mirror && i ? 400 - e.from[0] : e.from[0]; const p = map(x, e.from[1]); if (!front) p.addScaledVector(L, (i ? hr : hl2).p.dot(L)); return p };
        [hl2, hr].forEach((h, i) => rod(moving, M.frame, piv(i), h.p, .022));
      }
      else if (e.t === 'band') {
        const j = { ank: 'Foot', kne: 'Leg', wri: 'Hand', elb: 'ForeArm' }[e.b];
        const b = j ? wp(B('Left' + j)).add(wp(B('Right' + j))).multiplyScalar(.5) : mid, a = Array.isArray(e.a) ? map(e.a[0], e.a[1]).addScaledVector(L, b.dot(L)) : mid;
        rod(moving, M.band, a, b, .011);
      }
      else if (e.t === 'sled') { const t1 = wp(B('LeftToeBase')).add(wp(B('RightToeBase'))).multiplyScalar(.5), kn = wp(B('LeftLeg')).add(wp(B('RightLeg'))).multiplyScalar(.5), nrm = t1.clone().sub(kn).normalize(); const up2 = L.clone().cross(nrm).normalize(); box(moving, M.frame, t1.clone().addScaledVector(nrm, .05), L.clone(), up2, .62, .5, .04) }
    });
  }

  // the two poses and their timing: concentric A→B unless conc says BA; an isometric move only holds
  const PA = an.A, PB = an.B || an.A, keys = [...new Set([...Object.keys(PA), ...Object.keys(PB)])];
  const at = t => { const o = {}; keys.forEach(key => { const p = PA[key] ?? PB[key], q = PB[key] ?? PA[key]; o[key] = /S$/.test(key) ? lerp(p, q, t) : lerpAng(p, q, t) }); return o };
  const set = (t, kk = 1) => { pose(at(t)); equip(); U.uA.value = .55 + .3 * kk; U.uB.value = .35 + .25 * kk };
  buildFixed();

  // frame the camera on both poses: side views from the body's left, front views from the front
  const pts = [], bb = new THREE.Box3();
  [0, .5, 1].forEach(t => { pose(at(t)); equip(); moving.updateMatrixWorld(true); const mb = new THREE.Box3().setFromObject(moving); if (!mb.isEmpty()) bb.union(mb); ['Head', 'LeftHand', 'RightHand', 'LeftFoot', 'RightFoot', 'Hips', 'LeftLeg', 'LeftForeArm'].forEach(n => pts.push(wp(B(n)))) });
  fixed.updateMatrixWorld(true); const fb = new THREE.Box3().setFromObject(fixed);
  bb.expandByPoint(pts[0]); pts.forEach(q => bb.expandByPoint(q)); if (!fb.isEmpty()) bb.union(fb);
  bb.expandByScalar(.12); bb.min.y = Math.max(bb.min.y, -.05);
  const target = bb.getCenter(V()), radius = bb.getSize(V()).length() / 2;
  const view = (front ? F.clone().addScaledVector(L, .45) : L.clone().addScaledVector(F, .55)).addScaledVector(UP, .22).normalize();
  return { scene, target, radius, view, set, floorY: 0 };
}

function lights(scene) {
  scene.add(new THREE.HemisphereLight(0xf2f5fa, 0x2a2f38, 1.05));
  const key = new THREE.DirectionalLight(0xffffff, 2); key.position.set(2.2, 4.2, 3.2); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -2.5, right: 2.5, top: 3, bottom: -1, near: .5, far: 14 }); key.shadow.bias = -.0003; key.shadow.normalBias = .02; scene.add(key);
  const back = new THREE.DirectionalLight(0xcfdcff, 1.7); back.position.set(-3, 2.6, -3); scene.add(back);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 64), new THREE.ShadowMaterial({ opacity: .4 })); floor.rotation.x = -Math.PI / 2; floor.position.y = .002; floor.receiveShadow = true; scene.add(floor);
}
// a stage under the feet: a soft blue spot and two rings in the accent colour
let stageTex = null;
function stage(scene) {
  if (!stageTex) {
    const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d'), m = 512;
    const d = x.createRadialGradient(m, m, 0, m, m, 150); d.addColorStop(0, 'rgba(255,255,255,.09)'); d.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = d; x.beginPath(); x.arc(m, m, 150, 0, Math.PI * 2); x.fill();
    [[150, 4, .7], [196, 2, .35]].forEach(([r, w, o]) => { x.strokeStyle = `rgba(255,255,255,${o * .22})`; x.lineWidth = w; x.beginPath(); x.arc(m, m, r, 0, Math.PI * 2); x.stroke() });
    stageTex = new THREE.CanvasTexture(c); stageTex.colorSpace = THREE.SRGBColorSpace; stageTex.anisotropy = 4;
  }
  const s = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ map: stageTex, transparent: true, depthWrite: false, toneMapped: false }));
  s.rotation.x = -Math.PI / 2; s.position.y = .001; scene.add(s);
}
function renderer(opts = {}) {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, ...opts });
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.08;
  return r;
}
const place = (camera, s, fill = 1) => { const d = s.radius / Math.sin(camera.fov * RAD / 2) * fill; camera.position.copy(s.target).addScaledVector(s.view, d) };

const PHASES = (an) => an.iso ? [['Tahan', 3, 0, 0, 1]] : [['Siap', .35, 0, 0, .35], ['Angkat', 1, 0, 1, 1], ['Tahan', .4, 1, 1, 1], ['Turun pelan', 2, 1, 0, .6]];

// the animation, playing in host (which holds .a3p, [data-sp] and [data-rot] controls); returns stop()
export async function mount(host, item) {
  const r = renderer(); r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const s = await build(item);
  if (!host.isConnected) { r.dispose(); return () => {} }
  host.prepend(r.domElement); lights(s.scene); stage(s.scene);
  const camera = new THREE.PerspectiveCamera(32, 1, .05, 60), controls = new OrbitControls(camera, r.domElement);
  Object.assign(controls, { enableDamping: true, enablePan: false, minDistance: 1.2, maxDistance: 9, maxPolarAngle: Math.PI * .52, autoRotateSpeed: 1.4 });
  controls.target.copy(s.target); place(camera, s, 1.1); controls.update();
  const resize = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; r.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix() };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();
  host.querySelector('.a3l')?.remove();
  const ph = host.querySelector('.a3p'), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const P = PHASES(item.an), TOTAL = P.reduce((a, p) => a + p[1], 0), ba = item.an.conc === 'BA';
  const phaseAt = sec => { let t = sec % TOTAL; for (let i = 0; i < P.length; i++) { const [label, dur, from, to, kk] = P[i]; if (t < dur || i === P.length - 1) return { u: lerp(from, to, ease(Math.min(t / dur, 1))), k: kk, label }; t -= dur } };
  let speed = 1, clock = 0, last = null, lastLabel = '', raf = 0, stopped = false;
  host.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => { speed = +b.dataset.sp; host.querySelectorAll('[data-sp]').forEach(x => x.classList.toggle('on', x === b)) });
  const rot = host.querySelector('[data-rot]'); if (rot) rot.onclick = () => { controls.autoRotate = !controls.autoRotate; rot.classList.toggle('on', controls.autoRotate) };
  const stop = () => { if (stopped) return; stopped = true; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); r.dispose(); r.forceContextLoss() };
  const frame = ts => {
    if (!host.isConnected) return stop();
    if (last != null) clock += (ts - last) / 1000 * speed; last = ts;
    const p = reduce ? { u: .6, k: 1, label: 'Posisi tengah' } : phaseAt(clock);
    s.set(ba ? 1 - p.u : p.u, p.k);
    if (ph && p.label !== lastLabel) { lastLabel = p.label; ph.textContent = p.label; ph.classList.toggle('lift', p.label === 'Angkat') }
    controls.update(); r.render(s.scene, camera); raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return stop;
}

// a still of the move near the top of the lift, as a data URL (webp with a clear background)
let snapR = null;
export async function still(item, w = 360, h = 560, t = .7, q = .86) {
  const s = await build(item);
  if (!snapR) snapR = renderer({ preserveDrawingBuffer: true });
  snapR.setPixelRatio(1); snapR.setSize(w, h, false);
  lights(s.scene); stage(s.scene);
  const camera = new THREE.PerspectiveCamera(32, w / h, .05, 60);
  place(camera, s, 1.08); camera.lookAt(s.target);
  s.set(item.an.iso ? 0 : item.an.conc === 'BA' ? 1 - t : t, 1);
  snapR.render(s.scene, camera);
  const url = snapR.domElement.toDataURL('image/webp', q);
  s.scene.traverse(o => { o.geometry?.dispose?.(); if (o.material && !o.material.map) o.material.dispose?.() });
  return url;
}

// The same move for a player that owns the clock (the Remotion player in the app): nothing runs by itself,
// draw(sec) renders the moment sec seconds into the loop and returns the name of its phase.
export async function frames(item, w = 720, h = 900) {
  const r = renderer({ preserveDrawingBuffer: true }); r.setPixelRatio(1); r.setSize(w, h, false);
  const s = await build(item); lights(s.scene); stage(s.scene);
  const camera = new THREE.PerspectiveCamera(32, w / h, .05, 60);
  const P = PHASES(item.an), total = P.reduce((a, p) => a + p[1], 0), ba = item.an.conc === 'BA';
  const view = s.view.clone().normalize(), side = V().crossVectors(UP, view).normalize();
  return { canvas: r.domElement, total,
    draw(sec) {
      let t = ((sec % total) + total) % total, p = P[P.length - 1], u = p[3];
      for (const q of P) { if (t < q[1]) { p = q; u = lerp(q[2], q[3], ease(t / q[1])); break } t -= q[1] }
      s.set(ba ? 1 - u : u, p[4]);
      // the camera sways a little around the move, and is back where it started when the loop ends
      const a = Math.sin(sec / total * Math.PI * 2) * .3, d = s.radius / Math.sin(camera.fov * RAD / 2) * 1.12;
      camera.position.copy(s.target).addScaledVector(view, Math.cos(a) * d).addScaledVector(side, Math.sin(a) * d);
      camera.lookAt(s.target); r.render(s.scene, camera);
      return p[0];
    },
    dispose() { r.dispose(); r.forceContextLoss() } };
}
