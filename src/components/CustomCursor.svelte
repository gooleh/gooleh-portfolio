<script lang="ts">
  import { onMount } from 'svelte';

  let x = -100;
  let y = -100;
  let ringX = -100;
  let ringY = -100;
  let visible = false;

  onMount(() => {
    if (!window.matchMedia('(hover: hover)').matches) return;

    let animId: number;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      visible = true;
    };

    const onLeave = () => { visible = false; };

    window.addEventListener('mousemove', onMove);
    document.documentElement.addEventListener('mouseleave', onLeave);

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      ringX = lerp(ringX, x, 0.1);
      ringY = lerp(ringY, y, 0.1);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(animId);
    };
  });
</script>

<div
  class="cursor-dot"
  style="transform: translate3d({x - 4}px, {y - 4}px, 0); opacity: {visible ? 1 : 0};"
/>
<div
  class="cursor-ring"
  style="transform: translate3d({ringX - 16}px, {ringY - 16}px, 0); opacity: {visible ? 0.6 : 0};"
/>

<style>
  .cursor-dot,
  .cursor-ring {
    position: fixed;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 9999;
    border-radius: 50%;
    will-change: transform;
    transition: opacity 0.3s ease;
  }

  .cursor-dot {
    width: 8px;
    height: 8px;
    background: #22d3ee;
  }

  .cursor-ring {
    width: 32px;
    height: 32px;
    border: 1.5px solid #22d3ee;
  }
</style>
