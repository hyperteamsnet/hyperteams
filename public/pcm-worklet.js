// Taps the audio graph and ships mono PCM to the main thread in ~100 ms frames.
//
// The AudioContext that hosts this node is created at 16 kHz, so the samples
// arriving here are already at Whisper's expected rate — no resampling on our
// side. We only mix channels down to mono and batch samples so the message
// rate stays low (10/sec instead of ~375/sec at the 128-frame render quantum).
//
// Served as a static asset because AudioWorklet code runs in a separate global
// scope and must be loaded by URL via `audioWorklet.addModule('/pcm-worklet.js')`.
class PCMWorklet extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this._frame = 1600; // 0.1s @ 16 kHz
    this._buf = new Float32Array(this._frame);
    this._n = 0;
    // The long recorder (useVoiceRecorder) counts time in samples, so a quantum
    // with no input must still advance the clock — as silence. Otherwise a
    // silent/ended source makes that track fall behind: the elapsed time
    // freezes, two tracks drift apart, and segments stop being cut. Dictation
    // leaves it off and keeps the old "skip it" behaviour.
    this._fillGaps = !!options?.processorOptions?.fillGaps;
  }

  process(inputs) {
    const input = inputs[0];
    // No connected source this quantum (e.g. a track ended) — keep the
    // processor alive so it resumes when audio flows again.
    if (!input || input.length === 0) {
      if (!this._fillGaps) return true;
      // One render quantum (128 frames) of silence.
      for (let i = 0; i < 128; i++) this._push(0);
      return true;
    }

    const channels = input.length;
    const samples = input[0].length;
    for (let i = 0; i < samples; i++) {
      let s = 0;
      for (let c = 0; c < channels; c++) s += input[c][i];
      this._push(s / channels);
    }
    return true;
  }

  _push(sample) {
    this._buf[this._n++] = sample;
    if (this._n === this._frame) {
      // Transfer the buffer to avoid a copy, then start a fresh one.
      this.port.postMessage(this._buf, [this._buf.buffer]);
      this._buf = new Float32Array(this._frame);
      this._n = 0;
    }
  }
}

registerProcessor("pcm-worklet", PCMWorklet);
