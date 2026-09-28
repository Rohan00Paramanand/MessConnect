import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;
let modelLoadingPromise = null;

/**
 * Loads the face-api neural network weights.
 * Tries local /models first, then falls back to jsdelivr CDN if needed.
 */
export const loadFaceModels = async () => {
  if (modelsLoaded) return true;
  if (modelLoadingPromise) return modelLoadingPromise;

  modelLoadingPromise = (async () => {
    const MODEL_URL = '/models';
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      modelsLoaded = true;
      console.log('✓ Face recognition neural networks loaded locally');
      return true;
    } catch (localErr) {
      console.warn('Local /models loading failed, trying CDN fallback...', localErr);
      try {
        const CDN_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(CDN_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(CDN_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(CDN_URL)
        ]);
        modelsLoaded = true;
        console.log('✓ Face recognition neural networks loaded from CDN');
        return true;
      } catch (cdnErr) {
        console.error('Failed to load face recognition models:', cdnErr);
        modelLoadingPromise = null;
        throw cdnErr;
      }
    }
  })();

  return modelLoadingPromise;
};

/**
 * Detects a face and extracts its 128-element descriptor.
 * Uses adaptive thresholds to reliably detect faces under varied lighting and angles.
 */
export const getFaceDescriptorFromElement = async (element) => {
  await loadFaceModels();

  // Pass 1: Standard high-confidence detection
  let detection = await faceapi
    .detectSingleFace(element, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  // Pass 2: Adaptive fallback with larger resolution and lower threshold
  if (!detection) {
    detection = await faceapi
      .detectSingleFace(element, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.25 }))
      .withFaceLandmarks()
      .withFaceDescriptor();
  }

  if (!detection) return null;

  return {
    descriptor: Array.from(detection.descriptor),
    box: detection.detection.box,
    score: detection.detection.score
  };
};

/**
 * Creates a faceapi.FaceMatcher loaded with enrolled student face descriptors.
 */
export const createStudentFaceMatcher = (enrolledStudents = [], maxDescriptorDistance = 0.58) => {
  if (!enrolledStudents || enrolledStudents.length === 0) return null;

  const validStudents = enrolledStudents.filter(
    (student) => Array.isArray(student.faceDescriptor) && student.faceDescriptor.length === 128
  );

  console.log(`[FaceMatcher] Enrolled: ${enrolledStudents.length}, Valid biometrics: ${validStudents.length}`);

  if (validStudents.length === 0) return null;

  const labeledDescriptors = validStudents.map((student) => {
    const float32Array = new Float32Array(student.faceDescriptor);
    return new faceapi.LabeledFaceDescriptors(student.studentId.toString(), [float32Array]);
  });

  return new faceapi.FaceMatcher(labeledDescriptors, maxDescriptorDistance);
};
