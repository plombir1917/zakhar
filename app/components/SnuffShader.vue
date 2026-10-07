<script setup lang="ts">
/**
 * Полноэкранный шейдер мира Снюфа. Один фрагментный шейдер, два режима:
 *
 * - tunnel — затягивает в неоновый туннель перед дропом; progress 0→1
 *   разгоняет его и к концу выбеливает центр;
 * - world — «жидкий хром»: перекрученный шум с переливом, бочка его
 *   встряхивает, мышь сдвигает центр завихрения.
 *
 * Голый WebGL, без three.js: один прямоугольник на весь экран и шейдер —
 * библиотека тут ничего не добавляет, кроме веса.
 */
const props = withDefaults(
  defineProps<{
    mode: 'tunnel' | 'world'
    progress?: number
    /** Огибающая удара 0..1 — откуда угодно, лишь бы в долю */
    kick?: () => number
    still?: boolean
  }>(),
  { progress: 0, kick: () => 0, still: false },
)

const canvas = ref<HTMLCanvasElement | null>(null)
let raf = 0
let cleanup = () => {}

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime, uKick, uMode, uProg; uniform vec2 uMouse;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
// УФ-фиолетовый, розовый, циан, ядовито-жёлтый — палитра флаера
vec3 rave(float t){
  vec3 a = vec3(0.48, 0.17, 1.0), b = vec3(1.0, 0.24, 0.66), c = vec3(0.17, 0.83, 1.0), d = vec3(0.96, 0.9, 0.04);
  t = fract(t) * 4.0;
  if (t < 1.0) return mix(a, b, t);
  if (t < 2.0) return mix(b, c, t - 1.0);
  if (t < 3.0) return mix(c, d, t - 2.0);
  return mix(d, a, t - 3.0);
}

void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 col;
  if (uMode < 0.5) {
    // Туннель: полярные координаты, глубина = 1/r, скорость растёт с прогрессом
    float r = length(p) + 1e-3;
    float a = atan(p.y, p.x);
    float speed = 0.6 + uProg * uProg * 9.0;
    float z = 0.35 / r + uTime * speed;
    float rings = smoothstep(0.42, 0.5, abs(fract(z * 2.0) - 0.5));
    float spokes = smoothstep(0.46, 0.5, abs(fract(a / 6.2832 * 12.0 + z * 0.15) - 0.5));
    vec3 c = rave(z * 0.12 + a * 0.05);
    col = c * (rings * 0.9 + spokes * 0.5) * smoothstep(0.0, 0.35, r) * (0.35 + uProg * 1.4);
    col += vec3(1.0, 0.9, 1.0) * pow(uProg, 6.0) * (1.6 - r * 2.0);
    col *= smoothstep(1.4, 0.2, r);
  } else {
    // Жидкий хром: шум, перекрученный шумом; бочка встряхивает
    vec2 m = (uMouse - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    vec2 q = p * (1.6 - uKick * 0.25) + m * 0.4;
    float t = uTime * 0.12;
    vec2 w = vec2(fbm(q + t), fbm(q + vec2(5.2, 1.3) - t));
    float f = fbm(q + 2.4 * w + uKick * 0.6);
    float bands = 0.5 + 0.5 * cos(f * 18.0 + uTime * 0.6);
    vec3 chrome = mix(vec3(0.05, 0.04, 0.09), vec3(0.92, 0.94, 1.0), pow(bands, 3.0));
    col = mix(chrome, rave(f * 1.4 + t), 0.42 + 0.25 * uKick);
    col *= 0.55 + 0.45 * smoothstep(1.3, 0.1, length(p));
    col += rave(f + 0.3) * uKick * 0.22;
  }
  gl_FragColor = vec4(col, 1.0);
}`

onMounted(() => {
  const c = canvas.value!
  const gl = c.getContext('webgl', { antialias: false, premultipliedAlpha: false })
  if (!gl) return
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    return s
  }
  const prog = gl.createProgram()!
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(prog)
  gl.useProgram(prog)
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'p')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  const u = (n: string) => gl.getUniformLocation(prog, n)
  const uRes = u('uRes'), uTime = u('uTime'), uKick = u('uKick'), uMode = u('uMode'), uProg = u('uProg'), uMouse = u('uMouse')

  // Шейдер тяжёлый на весь экран — рисуем в уменьшенном буфере, браузер
  // растянет; на размытом переливе разницы не видно, а кадр в разы дешевле
  const scale = Math.min(devicePixelRatio, 1) * (innerWidth > 1200 ? 0.6 : 0.75)
  const mouse = [0.5, 0.5]
  const onMove = (e: PointerEvent) => {
    mouse[0] = e.clientX / innerWidth
    mouse[1] = 1 - e.clientY / innerHeight
  }
  addEventListener('pointermove', onMove)
  const t0 = performance.now()
  const frame = () => {
    const w = Math.round(innerWidth * scale)
    const h = Math.round(innerHeight * scale)
    if (c.width !== w || c.height !== h) {
      c.width = w
      c.height = h
      gl.viewport(0, 0, w, h)
    }
    gl.uniform2f(uRes, w, h)
    gl.uniform1f(uTime, props.still ? 3.0 : (performance.now() - t0) / 1000)
    gl.uniform1f(uKick, props.still ? 0 : props.kick())
    gl.uniform1f(uMode, props.mode === 'tunnel' ? 0 : 1)
    gl.uniform1f(uProg, props.progress)
    gl.uniform2f(uMouse, mouse[0]!, mouse[1]!)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
  cleanup = () => {
    cancelAnimationFrame(raf)
    removeEventListener('pointermove', onMove)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
})
onBeforeUnmount(() => cleanup())
</script>

<template>
  <canvas ref="canvas" class="shader" aria-hidden="true" />
</template>

<style scoped>
.shader {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100svh;
  display: block;
}
</style>
