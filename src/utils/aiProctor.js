// AI proctoring engine for the final assessment. Runs entirely in the browser: no video or image
// ever leaves the student's device - only the outcome of each check (e.g. "phone detected") is
// reported with the exam submission.
//
//  - Faces:    @vladmandic/face-api (SSD MobileNet detector, 68-point landmarks, 128-d descriptors) counts faces and
//              compares the face on camera with the reference captured before the exam.
//  - Phones:   MediaPipe object detector (EfficientDet-Lite2, COCO labels "cell phone", "person").
//  - Hands:    MediaPipe hand landmarker.
//  - Eyes:     MediaPipe face landmarker (iris points + eye-direction blendshapes) for looking down or
//              away, measured against the student's own "looking at the screen" pose from calibration.
// Libraries are imported lazily, so nothing is downloaded until a student opens the final exam.

import wasmLoaderPath from '@mediapipe/tasks-vision/vision_wasm_internal.js?url';
import wasmBinaryPath from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url';

const FACE_MODELS = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';
const HAND_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
// EfficientDet-Lite2: float16 build on the GPU; the int8 build on the CPU (int8 returns nothing on the GPU).
const OBJECT_MODEL_GPU = 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/float16/latest/efficientdet_lite2.tflite';
const OBJECT_MODEL_CPU = 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/int8/1/efficientdet_lite2.tflite';
const FACE_MESH_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

/**
 * Face descriptors closer than this (euclidean) are treated as the same person. 0.6 is face-api's
 * recommended threshold; it keeps the same student matched with or without glasses.
 */
export const SAME_PERSON = 0.6;
/** Confident matches closer than this teach the identity gallery a new view (glasses on/off, light). */
const LEARN_BELOW = 0.42;
const GALLERY_MAX = 8;

let engine = null;
let loading = null;

/** Loads every model once. onProgress(label, done, total) reports each finished step. */
export function loadProctorModels(onProgress = () => {}) {
  if (engine) return Promise.resolve(engine);
  if (loading) return loading;
  loading = (async () => {
    const steps = 6;
    let done = 0;
    const tick = (label) => onProgress(label, ++done, steps);

    const faceapi = await import('@vladmandic/face-api');
    await faceapi.tf.setBackend('webgl').catch(() => faceapi.tf.setBackend('cpu'));
    await faceapi.tf.ready();
    tick('Face detector runtime');
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(FACE_MODELS),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(FACE_MODELS)
    ]);
    tick('Face detection model');
    await faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODELS);
    tick('Identity model');

    const { ObjectDetector, HandLandmarker, FaceLandmarker } = await import('@mediapipe/tasks-vision');
    const fileset = { wasmLoaderPath, wasmBinaryPath };
    const make = async (Cls, options) => {
      try { return await Cls.createFromOptions(fileset, { ...options, baseOptions: { ...options.baseOptions, delegate: 'GPU' } }); }
      catch { return Cls.createFromOptions(fileset, { ...options, baseOptions: { ...options.baseOptions, delegate: 'CPU' } }); }
    };
    const objectOptions = { runningMode: 'VIDEO', scoreThreshold: 0.35, maxResults: 8, categoryAllowlist: ['cell phone', 'person', 'book', 'laptop'] };
    let objects;
    try { objects = await ObjectDetector.createFromOptions(fileset, { ...objectOptions, baseOptions: { modelAssetPath: OBJECT_MODEL_GPU, delegate: 'GPU' } }); }
    catch { objects = await ObjectDetector.createFromOptions(fileset, { ...objectOptions, baseOptions: { modelAssetPath: OBJECT_MODEL_CPU, delegate: 'CPU' } }); }
    tick('Phone detection model');
    const hands = await make(HandLandmarker, { baseOptions: { modelAssetPath: HAND_MODEL }, runningMode: 'VIDEO', numHands: 2 });
    tick('Hand detection model');
    const mesh = await make(FaceLandmarker, { baseOptions: { modelAssetPath: FACE_MESH_MODEL }, runningMode: 'VIDEO', numFaces: 3, outputFaceBlendshapes: true });
    tick('Eye tracking model');

    engine = { faceapi, objects, hands, mesh };
    // Warm-up: the first pass after loading compiles GPU shaders and can give unreliable results,
    // so run every model once on a blank frame before anything real is measured.
    const blank = document.createElement('canvas');
    blank.width = 320; blank.height = 240;
    const bctx = blank.getContext('2d');
    bctx.fillStyle = '#777'; bctx.fillRect(0, 0, 320, 240);
    try {
      await faceapi.detectAllFaces(blank, faceOptions(faceapi)).withFaceLandmarks(true).withFaceDescriptors();
      const t = performance.now();
      objects.detectForVideo(blank, t); hands.detectForVideo(blank, t); mesh.detectForVideo(blank, t);
    } catch { /* warm-up is best effort */ }
    return engine;
  })();
  loading.catch(() => { loading = null; });
  return loading;
}

// SSD MobileNet finds smaller, turned and partly lit faces far more reliably than the tiny detector.
const faceOptions = (faceapi) => new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5, maxResults: 5 });

/** Euclidean distance between two face descriptors. */
export function faceDistance(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
  return Math.sqrt(s);
}

/** 0-100 similarity score shown to students and admins (100 = identical, 55 = threshold). */
export const matchPercent = (distance) => Math.round(Math.max(0, Math.min(1, 1 - distance / (SAME_PERSON * 2.2))) * 100);

/** All faces in the frame, largest first: [{ box, score, descriptor }]. */
async function detectFaces(video) {
  const { faceapi } = engine;
  // tiny landmarks are only used to align the face for the descriptor - 5x faster, same matching quality
  const res = await faceapi.detectAllFaces(video, faceOptions(faceapi)).withFaceLandmarks(true).withFaceDescriptors();
  return res
    .map(r => ({ box: r.detection.box, score: r.detection.score, descriptor: r.descriptor }))
    .sort((a, b) => b.box.width * b.box.height - a.box.width * a.box.height);
}

/**
 * Captures the reference face before the exam: exactly one clear face in `samples` frames,
 * averaged into one descriptor. Throws a student-friendly message when the frame is not usable.
 */
export async function captureReference(video, samples = 3) {
  await loadProctorModels();
  const descriptors = [];
  for (let i = 0; i < samples; i++) {
    const faces = await detectFaces(video);
    if (faces.length === 0) throw new Error('No face found. Sit in good light and look straight at the camera.');
    if (faces.length > 1) throw new Error('More than one face is visible. Only you should be in front of the camera.');
    if (faces[0].box.width < video.videoWidth * 0.18) throw new Error('Your face is too small in the frame. Move a little closer to the camera.');
    descriptors.push(faces[0].descriptor);
    await new Promise(r => setTimeout(r, 250));
  }
  const avg = new Float32Array(descriptors[0].length);
  descriptors.forEach(d => d.forEach((v, i) => { avg[i] += v / descriptors.length; }));
  const spread = Math.max(...descriptors.map(d => faceDistance(d, avg)));
  if (spread > 0.35) throw new Error('Please hold still and look at the camera while your face is captured.');
  return avg;
}

/**
 * Analyses one video frame. Returns
 * { faces: [{ box, distance, same }], phones: [box], people, hands: [box], width, height }.
 * Boxes are { x, y, width, height } in video pixels.
 */
export async function analyzeFrame(video, gallery, { identity = true, objects: runObjects = true } = {}) {
  const { objects, hands, mesh } = engine;
  const t = performance.now();
  const refs = !gallery ? null : Array.isArray(gallery) ? gallery : [gallery];
  const ms = {};
  let c = performance.now();
  const lap = (k) => { const n = performance.now(); ms[k] = Math.round(n - c); c = n; };
  const raw = identity ? await detectFaces(video) : [];
  lap('faces');
  const faces = raw.map(f => {
    const distance = refs ? Math.min(...refs.map(r => faceDistance(f.descriptor, r))) : null;
    return { box: f.box, distance, same: distance === null ? null : distance <= SAME_PERSON };
  });
  // learn new confident views of the same student (e.g. glasses put on) so later frames still match
  if (identity && Array.isArray(gallery) && raw.length === 1 && faces[0].distance < LEARN_BELOW && gallery.length < GALLERY_MAX
    && Math.min(...gallery.map(r => faceDistance(raw[0].descriptor, r))) > 0.15) {
    gallery.push(raw[0].descriptor);
  }
  const objs = runObjects ? objects.detectForVideo(video, t).detections || [] : [];
  lap('objects');
  const label = (d) => d.categories?.[0]?.categoryName;
  const score = (d) => d.categories?.[0]?.score || 0;
  const toBox = (b) => ({ x: b.originX, y: b.originY, width: b.width, height: b.height });
  const phones = objs.filter(d => label(d) === 'cell phone' && score(d) >= 0.45).map(d => ({ ...toBox(d.boundingBox), score: score(d) }));
  const people = objs.filter(d => label(d) === 'person' && score(d) >= 0.5).length;
  const handRes = hands.detectForVideo(video, t + 1);
  lap('hands');
  const W = video.videoWidth;
  const H = video.videoHeight;
  const handBoxes = (handRes.landmarks || []).map(pts => {
    const xs = pts.map(p => p.x * W);
    const ys = pts.map(p => p.y * H);
    const x = Math.min(...xs); const y = Math.min(...ys);
    return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
  });
  const meshRes = mesh.detectForVideo(video, t + 2);
  lap('mesh');
  const gaze = gazeMetrics(meshRes);
  if (gaze) gaze.irises = gaze.irises.map(p => ({ x: p.x * W, y: p.y * H }));
  // second opinion on how many faces are in view (the face mesh finds smaller / turned faces)
  const meshFaces = meshRes?.faceLandmarks?.length || 0;
  // face boxes from the mesh (every frame) so hand-near-face and counting work between identity checks
  const meshBoxes = (meshRes?.faceLandmarks || []).map(pts => {
    const xs = pts.map(q => q.x * W); const ys = pts.map(q => q.y * H);
    const x = Math.min(...xs); const y = Math.min(...ys);
    return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
  });
  return { faces, identityChecked: identity, objectsChecked: runObjects, phones, people, hands: handBoxes, gaze, meshFaces, meshBoxes, width: W, height: H, ms };
}

const blend = (cats, name) => cats?.find(c => c.categoryName === name)?.score || 0;

/**
 * Head and eye direction from a face-landmarker result:
 *  pitch - nose tip height between the eye line and the chin (grows when the head tips down)
 *  yaw   - nose tip offset from the eye midpoint, in eye-widths (grows when the head turns)
 *  down  - how far the eyes look down (blendshapes, 0-1); side - eyes looking left/right (-1..1)
 */
export function gazeMetrics(result) {
  const lm = result?.faceLandmarks?.[0];
  if (!lm || lm.length < 264) return null;
  const cats = result.faceBlendshapes?.[0]?.categories;
  const L = lm[33]; const R = lm[263]; const nose = lm[1]; const chin = lm[152];
  const eyeMid = { x: (L.x + R.x) / 2, y: (L.y + R.y) / 2 };
  const eyeDist = Math.hypot(R.x - L.x, R.y - L.y) || 1e-6;
  return {
    pitch: (nose.y - eyeMid.y) / Math.max(1e-6, chin.y - eyeMid.y),
    yaw: (nose.x - eyeMid.x) / eyeDist,
    down: (blend(cats, 'eyeLookDownLeft') + blend(cats, 'eyeLookDownRight')) / 2,
    side: ((blend(cats, 'eyeLookOutLeft') + blend(cats, 'eyeLookInRight')) - (blend(cats, 'eyeLookInLeft') + blend(cats, 'eyeLookOutRight'))) / 2,
    closed: (blend(cats, 'eyeBlinkLeft') + blend(cats, 'eyeBlinkRight')) / 2,
    irises: lm.length > 473 ? [lm[468], lm[473]] : []
  };
}

/**
 * The student's normal "looking at the screen" pose, averaged over a few frames while they look at
 * the camera/screen. Everything during the exam is compared with this, so a laptop camera that sits
 * below or beside the screen does not cause false warnings.
 */
export async function calibrateGaze(video, frames = 8) {
  await loadProctorModels();
  const got = [];
  for (let i = 0; i < frames * 2 && got.length < frames; i++) {
    const g = gazeMetrics(engine.mesh.detectForVideo(video, performance.now()));
    if (g) got.push(g);
    await new Promise(r => setTimeout(r, 120));
  }
  if (got.length < Math.ceil(frames / 2)) throw new Error('Your eyes could not be tracked. Face the screen in good light.');
  const avg = (k) => got.reduce((a, g) => a + g[k], 0) / got.length;
  return { pitch: avg('pitch'), yaw: avg('yaw'), down: avg('down'), side: avg('side') };
}

/**
 * Thresholds against the calibrated pose: about 18° head tilt / 22° head turn. The eye limits are
 * set so that reading the lower part of the screen does not count, only looking clearly below it.
 */
export const GAZE_LIMITS = { headDown: 0.1, eyesDown: 0.42, headTurn: 0.22, eyesSide: 0.5, blink: 0.55 };

/** { down, away } compared with the calibrated pose; null without data. */
export function gazeState(g, base) {
  if (!g || !base) return null;
  const headDown = g.pitch - base.pitch > GAZE_LIMITS.headDown;
  // while blinking the eye-direction scores are unreliable, so only the head position counts
  const blinking = g.closed > GAZE_LIMITS.blink;
  const eyesDown = !blinking && g.down - base.down > GAZE_LIMITS.eyesDown;
  const headTurn = Math.abs(g.yaw - base.yaw) > GAZE_LIMITS.headTurn;
  const eyesSide = !blinking && Math.abs(g.side - base.side) > GAZE_LIMITS.eyesSide;
  return { down: headDown || eyesDown, away: headTurn || eyesSide, headDown, eyesDown, headTurn, eyesSide };
}

/** True when a hand overlaps the (slightly enlarged) face box - e.g. covering the face or holding something to the ear. */
export function handNearFace(hand, face) {
  const pad = face.width * 0.25;
  return hand.x < face.x + face.width + pad && hand.x + hand.width > face.x - pad && hand.y < face.y + face.height + pad && hand.y + hand.height > face.y - pad;
}
