/** Petit synthétiseur WebAudio : joue la note envoyée par tone(). */
export class AudioEngine {
  muted = false;
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;

  setTone(freq: number): void {
    if (this.muted || freq <= 0) {
      this.silence();
      return;
    }
    if (!this.ctx) {
      this.ctx = new AudioContext();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2400;
      this.gain = this.ctx.createGain();
      this.gain.gain.value = 0;
      this.gain.connect(filter).connect(this.ctx.destination);
    }
    void this.ctx.resume();
    if (!this.osc) {
      this.osc = this.ctx.createOscillator();
      this.osc.type = 'square';
      this.osc.connect(this.gain!);
      this.osc.start();
    }
    const now = this.ctx.currentTime;
    this.osc.frequency.setTargetAtTime(freq, now, 0.005);
    this.gain!.gain.setTargetAtTime(0.06, now, 0.01);
  }

  silence(): void {
    if (this.ctx && this.gain) this.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
  }

  toggle(): boolean {
    this.muted = !this.muted;
    if (this.muted) this.silence();
    return this.muted;
  }
}
