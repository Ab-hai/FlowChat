export type Recorder = {
  stop: () => void;
  cancel: () => void;
  done: Promise<Blob | null>;
};

// Records one spoken turn from the mic and resolves with 16 kHz mono PCM WAV
// (the format Azure Pronunciation Assessment expects), or null if nothing was
// said. Auto-stops after a pause; stop()/cancel() end it manually.
export async function recordUtterance(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  const buf = new Uint8Array(analyser.frequencyBinCount);

  let stopped = false;
  let cancelled = false;
  let spoke = false;
  let lastLoud = Date.now();
  const start = Date.now();

  let resolveDone!: (b: Blob | null) => void;
  const done = new Promise<Blob | null>((res) => {
    resolveDone = res;
  });

  const timer = setInterval(() => {
    analyser.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / buf.length);
    const now = Date.now();
    if (rms > 0.045) {
      spoke = true;
      lastLoud = now;
    }
    if (spoke && now - lastLoud > 900) finish();
    else if (!spoke && now - start > 8000) finish();
    else if (now - start > 25000) finish();
  }, 150);

  function finish() {
    if (stopped) return;
    stopped = true;
    if (recorder.state !== "inactive") recorder.stop();
  }

  recorder.onstop = async () => {
    clearInterval(timer);
    stream.getTracks().forEach((t) => t.stop());
    audioCtx.close().catch(() => {});
    if (cancelled || !spoke) {
      resolveDone(null);
      return;
    }
    const webm = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
    if (webm.size < 1200) {
      resolveDone(null);
      return;
    }
    resolveDone(webm);
  };

  recorder.start();

  return {
    stop: finish,
    cancel: () => {
      cancelled = true;
      finish();
    },
    done,
  };
}

export async function webmToWav16k(webm: Blob): Promise<Blob> {
  const arrayBuf = await webm.arrayBuffer();
  const ctx = new AudioContext();
  const decoded = await ctx.decodeAudioData(arrayBuf);
  ctx.close().catch(() => {});

  const targetRate = 16000;
  const channel = decoded.getChannelData(0);
  const ratio = decoded.sampleRate / targetRate;
  const outLen = Math.floor(channel.length / ratio);
  const out = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const s = channel[Math.floor(i * ratio)] || 0;
    const c = Math.max(-1, Math.min(1, s));
    out[i] = c < 0 ? c * 0x8000 : c * 0x7fff;
  }
  return encodeWav(out, targetRate);
}

function encodeWav(samples: Int16Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let off = 44;
  for (let i = 0; i < samples.length; i++, off += 2) {
    view.setInt16(off, samples[i], true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}
