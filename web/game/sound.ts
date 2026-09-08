let context: AudioContext | undefined;
export function beep(
  kind: 'start' | 'peek' | 'found' | 'hide' | 'step',
  enabled = true,
) {
  if (!enabled) return;
  try {
    context ??= new AudioContext();
    void context.resume();
    const notes =
      kind === 'found'
        ? [330, 440, 660, 880]
        : kind === 'start'
          ? [220, 330, 440]
          : kind === 'hide'
            ? [440, 330, 165]
            : kind === 'peek'
              ? [160, 110]
              : [75];
    notes.forEach((hz, i) => {
      const o = context!.createOscillator(),
        g = context!.createGain();
      o.type = 'square';
      o.frequency.value = hz;
      g.gain.setValueAtTime(
        kind === 'step' ? 0.01 : 0.035,
        context!.currentTime + i * 0.085,
      );
      g.gain.exponentialRampToValueAtTime(
        0.001,
        context!.currentTime + i * 0.085 + 0.08,
      );
      o.connect(g);
      g.connect(context!.destination);
      o.start(context!.currentTime + i * 0.085);
      o.stop(context!.currentTime + i * 0.085 + 0.09);
    });
  } catch {
    /* Audio is optional. */
  }
}
