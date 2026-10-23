// AI proctoring engine for the final assessment. Runs entirely in the browser: no video or image
// ever leaves the student's device - only the outcome of each check (e.g. "phone detected") is
// reported with the exam submission.
//
//  - Faces:    @vladmandic/face-api (tiny face detector + 128-d face descriptors) counts faces and
//              compares the face on camera with the reference captured before the exam.
//  - Phones:   MediaPipe object detector (EfficientDet-Lite0, COCO labels "cell phone", "person").
//  - Hands:    MediaPipe hand landmarker.
// Libraries are imported lazily, so nothing is downloaded until a student opens the final exam.

import wasmLoaderPath from '@mediapipe/tasks-vision/vision_wasm_internal.js?url';
import wasmBinaryPath from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url';

const FACE_MODELS = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';
const HAND_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const OBJECT_MODEL = 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite';

/** Face descriptors closer than this (euclidean) are treated as the same person. */
export const SAME_PERSON = 0.55;

let engine = null;
let loading = null;

/** Loads every model once. onProgress(label, done, total) reports each finished step. */
export function loadProctorModels(onProgress = () => {}) {
  if (engine) return Promise.resolve(engine);
  if (loading) return loading;
  loading = (async () => {
    const steps = 5;
    let done = 0;
    const tick = (label) => onProgress(label, ++done, steps);

    const faceapi = await import('@vladmandic/face-api');
    await faceapi.tf.setBackend('webgl').catch(() => faceapi.tf.setBackend('cpu'));
    await faceapi.tf.ready();
    tick('Face detector runtime');
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODELS),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(FACE_MODELS)
    ]);
    tick('Face detection model');
    await faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODELS);
    tick('Identity model');

    const { ObjectDetector, HandLandmarker } = await import('@mediapipe/tasks-vision');
    const fileset = { wasmLoaderPath, wasmBinaryPath };
    const make = async (Cls, options) => {
      try { return await Cls.createFromOptions(fileset, { ...options, baseOptions: { ...options.baseOptions, delegate: 'GPU' } }); }
      catch { return Cls.createFromOptions(fileset, { ...options, baseOptions: { ...options.baseOptions, delegate: 'CPU' } }); }
    };
    const objects = await make(ObjectDetector, {
      baseOptions: { modelAssetPath: OBJECT_MODEL },
      runningMode: 'VIDEO',
      scoreThreshold: 0.35,
      maxResults: 8,
      categoryAllowlist: ['cell phone', 'person', 'book', 'laptop']
    });
    tick('Phone detection model');
    const hands = await make(HandLandmarker, { baseOptions: { modelAssetPath: HAND_MODEL }, runningMode: 'VIDEO', numHands: 2 });
    tick('Hand detection model');

    engine = { faceapi, objects, hands };
    return engine;
  })();
  loading.catch(() => { loading = null; });
  return loading;
}

const faceOptions = (faceapi, inputSize = 416) => new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold: 0.45 });

/** Euclidean distance between two face descriptors. */
export function faceDistance(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
  return Math.sqrt(s);
}

/** 0-100 similarity score shown to students and admins (100 = identical, ~55 = threshold). */
export const matchPercent = (distance) => Math.round(Math.max(0, Math.min(1, 1 - distance / (SAME_PERSON * 2.2))) * 100);

/** All faces in the frame, largest first: [{ box, score, descriptor }]. */
async function detectFaces(video, inputSize) {
  const { faceapi } = engine;
  const res = await faceapi.detectAllFaces(video, faceOptions(faceapi, inputSize)).withFaceLandmarks(true).withFaceDescriptors();
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
    const faces = await detectFaces(video, 416);
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
export async function analyzeFrame(video, reference) {
  const { objects, hands } = engine;
  const t = performance.now();
  const faces = (await detectFaces(video, 416)).map(f => {
    const distance = reference ? faceDistance(f.descriptor, reference) : null;
    return { box: f.box, distance, same: distance === null ? null : distance <= SAME_PERSON };
  });
  const objs = objects.detectForVideo(video, t).detections || [];
  const label = (d) => d.categories?.[0]?.categoryName;
  const score = (d) => d.categories?.[0]?.score || 0;
  const toBox = (b) => ({ x: b.originX, y: b.originY, width: b.width, height: b.height });
  const phones = objs.filter(d => label(d) === 'cell phone' && score(d) >= 0.4).map(d => ({ ...toBox(d.boundingBox), score: score(d) }));
  const people = objs.filter(d => label(d) === 'person' && score(d) >= 0.5).length;
  const handRes = hands.detectForVideo(video, t + 1);
  const W = video.videoWidth;
  const H = video.videoHeight;
  const handBoxes = (handRes.landmarks || []).map(pts => {
    const xs = pts.map(p => p.x * W);
    const ys = pts.map(p => p.y * H);
    const x = Math.min(...xs); const y = Math.min(...ys);
    return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
  });
  return { faces, phones, people, hands: handBoxes, width: W, height: H };
}

/** True when a hand overlaps the (slightly enlarged) face box - e.g. covering the face or holding something to the ear. */
export function handNearFace(hand, face) {
  const pad = face.width * 0.25;
  return hand.x < face.x + face.width + pad && hand.x + hand.width > face.x - pad && hand.y < face.y + face.height + pad && hand.y + hand.height > face.y - pad;
}
