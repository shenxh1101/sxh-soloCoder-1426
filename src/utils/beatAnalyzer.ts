export interface BeatAnalysisResult {
  bpm: number;
  beats: number[];
  duration: number;
  waveformData: number[];
}

export async function analyzeAudioFile(file: File): Promise<BeatAnalysisResult> {
  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));

  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  const duration = audioBuffer.duration;

  const targetSampleRate = 8000;
  const downsampleRatio = Math.max(1, Math.floor(sampleRate / targetSampleRate));
  const downsampled: number[] = [];
  for (let i = 0; i < channelData.length; i += downsampleRatio) {
    downsampled.push(channelData[i]);
  }

  const frameSize = 512;
  const hopSize = 256;
  const energies: number[] = [];
  const waveformData: number[] = [];
  const lowCut = 20;
  const highCut = 200;
  const targetSR = sampleRate / downsampleRatio;
  const binLow = Math.floor((lowCut / targetSR) * frameSize);
  const binHigh = Math.ceil((highCut / targetSR) * frameSize);

  for (let start = 0; start + frameSize < downsampled.length; start += hopSize) {
    const frame = downsampled.slice(start, start + frameSize);
    const rms = computeRMS(frame);
    waveformData.push(rms);
    const bandEnergy = computeBandEnergy(frame, binLow, binHigh);
    energies.push(bandEnergy);
  }

  const windowSize = Math.round(energies.length / (duration / 2));
  const thresholded: boolean[] = [];
  for (let i = 0; i < energies.length; i++) {
    const start = Math.max(0, i - windowSize);
    const end = Math.min(energies.length, i + windowSize + 1);
    let sum = 0;
    for (let j = start; j < end; j++) sum += energies[j];
    const avg = sum / (end - start);
    thresholded.push(energies[i] > avg * 1.45);
  }

  const rawPeaks: number[] = [];
  const minHopFrames = Math.round(0.25 * targetSR / hopSize);
  let lastPeakIdx = -minHopFrames - 1;
  for (let i = 1; i < thresholded.length - 1; i++) {
    if (thresholded[i] && !thresholded[i - 1]) {
      let localMaxIdx = i;
      for (let j = i + 1; j < Math.min(i + 8, thresholded.length); j++) {
        if (energies[j] > energies[localMaxIdx]) localMaxIdx = j;
      }
      if (localMaxIdx - lastPeakIdx >= minHopFrames) {
        rawPeaks.push(localMaxIdx);
        lastPeakIdx = localMaxIdx;
      }
    }
  }

  const intervals: number[] = [];
  for (let i = 1; i < rawPeaks.length; i++) {
    intervals.push(rawPeaks[i] - rawPeaks[i - 1]);
  }

  let bpm = 120;
  if (intervals.length > 0) {
    const bucketSize = 2;
    const buckets = new Map<number, number>();
    for (const interval of intervals) {
      const key = Math.round(interval / bucketSize) * bucketSize;
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
    let bestKey = 0, bestCount = 0;
    buckets.forEach((count, key) => {
      if (count > bestCount) { bestCount = count; bestKey = key; }
    });
    if (bestKey > 0) {
      const bpmEstimate = 60 / (bestKey * hopSize / targetSR);
      bpm = Math.max(60, Math.min(200, bpmEstimate));
    }
  }

  const beatIntervalFrames = (60 / bpm) * targetSR / hopSize;
  const beats: number[] = [];
  if (rawPeaks.length > 0) {
    const firstBeatSample = rawPeaks[0];
    let cursor = firstBeatSample;
    while (cursor < energies.length) {
      const searchStart = Math.max(0, Math.round(cursor - beatIntervalFrames * 0.35));
      const searchEnd = Math.min(energies.length, Math.round(cursor + beatIntervalFrames * 0.35) + 1);
      let bestIdx = Math.round(cursor);
      let bestEnergy = -1;
      for (let j = searchStart; j < searchEnd; j++) {
        if (energies[j] > bestEnergy) { bestEnergy = energies[j]; bestIdx = j; }
      }
      beats.push(bestIdx * hopSize / targetSR);
      cursor = bestIdx + beatIntervalFrames;
    }
  }

  while (beats.length > 0 && beats[0] < 0) beats.shift();

  await audioCtx.close();

  const downsampledWaveform: number[] = [];
  const waveStep = Math.max(1, Math.floor(waveformData.length / 800));
  for (let i = 0; i < waveformData.length; i += waveStep) {
    downsampledWaveform.push(waveformData[i]);
  }

  return {
    bpm: Math.round(bpm * 10) / 10,
    beats,
    duration,
    waveformData: downsampledWaveform,
  };
}

function computeRMS(frame: number[]): number {
  let sum = 0;
  for (const s of frame) sum += s * s;
  return Math.sqrt(sum / frame.length);
}

function computeBandEnergy(frame: number[], binLow: number, binHigh: number): number {
  const n = frame.length;
  const real = new Float64Array(n);
  const imag = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    real[i] = frame[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)));
    imag[i] = 0;
  }
  simpleDFT(real, imag);
  let sum = 0;
  const lo = Math.max(0, binLow);
  const hi = Math.min(n / 2, binHigh);
  for (let k = lo; k < hi; k++) {
    sum += real[k] * real[k] + imag[k] * imag[k];
  }
  return Math.sqrt(sum / (hi - lo));
}

function simpleDFT(real: Float64Array, imag: Float64Array): void {
  const n = real.length;
  const outRe = new Float64Array(n);
  const outIm = new Float64Array(n);
  for (let k = 0; k < n / 2; k++) {
    let sumR = 0, sumI = 0;
    for (let t = 0; t < n; t++) {
      const angle = (-2 * Math.PI * k * t) / n;
      sumR += real[t] * Math.cos(angle) - imag[t] * Math.sin(angle);
      sumI += real[t] * Math.sin(angle) + imag[t] * Math.cos(angle);
    }
    outRe[k] = sumR;
    outIm[k] = sumI;
  }
  for (let k = 0; k < n; k++) {
    real[k] = outRe[k] || 0;
    imag[k] = outIm[k] || 0;
  }
}
