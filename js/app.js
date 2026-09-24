import { DEFAULT_FEATURED_EFFECT_ID, SHADER_EFFECTS } from './shaders.js'

const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.rrapps.infinitetunnel'
const thumbnailFor = (id) => `assets/wallpapers/${id}.webp`

// The gallery is a complete thumbnail catalog from the Android app. Only the
// five entries in SHADER_EFFECTS are experimentable on this site; the rest are
// intentionally thumbnail-only so their shader source stays private.
const GALLERY_WALLPAPERS = [
  ...SHADER_EFFECTS.map((effect) => ({
    id: effect.id,
    name: effect.name,
    tagline: effect.tagline,
    category: effect.category,
    thumbnail: thumbnailFor(effect.id),
    configurable: true
  })),
  { id: 'plasma', name: 'Plasma', tagline: 'Bright energy in motion', category: 'abstract' },
  { id: 'ink_in_water', name: 'Ink in Water', tagline: 'Soft color unfolding', category: 'fluids' },
  { id: 'fractals', name: 'Fractals', tagline: 'A new pattern every moment', category: 'abstract' },
  { id: 'liquid_metals', name: 'Liquid Metals', tagline: 'Glossy movement and shine', category: 'abstract' },
  { id: 'rain', name: 'Rain', tagline: 'A calmer kind of motion', category: 'abstract' },
  { id: 'fireflies', name: 'Fireflies', tagline: 'Tiny lights with a gentle glow', category: 'cosmic' },
  { id: 'pulse_lines', name: 'Pulse Lines', tagline: 'Color that moves to the beat', category: 'abstract' },
  { id: 'lava_lamp', name: 'Lava Lamp', tagline: 'Slow, colorful movement', category: 'fluids' },
  { id: 'perlin_noise', name: 'Perlin Noise', tagline: 'Organic patterns in motion', category: 'abstract' },
  { id: 'matrix_rain', name: 'Matrix Rain', tagline: 'A digital downpour', category: 'abstract' },
  { id: 'hexagonal_grids', name: 'Hexagonal Grids', tagline: 'A sharper kind of rhythm', category: 'abstract' },
  { id: 'wireframe_mountains', name: 'Wireframe Mountains', tagline: 'A world made of lines', category: 'abstract' },
  { id: 'endless_stars', name: 'Endless Stars', tagline: 'A quiet field of light', category: 'cosmic' },
  { id: 'blooming_flowers', name: 'Blooming Flowers', tagline: 'Color opening in motion', category: 'cosmic' },
  { id: 'celestial_tide', name: 'Celestial Tide', tagline: 'A pull of light and shadow', category: 'cosmic' }
].map((effect) => ({ ...effect, thumbnail: thumbnailFor(effect.id), configurable: effect.configurable === true }))

const byId = (id) => SHADER_EFFECTS.find((effect) => effect.id === id) || SHADER_EFFECTS[0]

const stage = document.querySelector('[data-stage-canvas]')
const effectGrid = document.querySelector('[data-effect-grid]')
const effectSwitchers = [...document.querySelectorAll('[data-hero-effect-switcher], [data-studio-effect-switcher]')]
const studioPreview = document.querySelector('[data-studio-preview]')
const studioStage = document.querySelector('[data-studio-canvas]')
const controls = document.querySelector('[data-controls]')
const canvasLabel = document.querySelector('[data-canvas-label]')
const heroCanvasWrap = document.querySelector('.hero-canvas-wrap')
const canvasCategory = document.querySelector('[data-canvas-category]')
const studioLabel = document.querySelector('[data-studio-label]')
const controlTitle = document.querySelector('[data-control-title]')
const controlTagline = document.querySelector('[data-control-tagline]')

let selected = byId(DEFAULT_FEATURED_EFFECT_ID)
let state = {}
let renderer
let studioRenderer
let activeFilter = 'all'

function defaults(effect) {
  return Object.fromEntries((effect.parameters || []).map((parameter) => [parameter.id, parameter.default]))
}

function categoryLabel(category) {
  return category === 'synthwave' ? 'SYNTHWAVE' : category.toUpperCase()
}

function renderCard(effect) {
  const card = document.createElement('article')
  card.className = 'effect-card'
  card.dataset.effectId = effect.id
  card.dataset.category = effect.category
  card.setAttribute('aria-label', effect.name)
  card.innerHTML = `
    <div class="effect-image">
      <img src="${effect.thumbnail}" alt="${effect.name} live wallpaper" loading="lazy">
      <div class="effect-overlay"></div>
      <div class="effect-info">
        <div class="effect-category">${categoryLabel(effect.category)}</div>
        <h3>${effect.name}</h3>
        <p>${effect.tagline}</p>
      </div>
    </div>`
  return card
}

function populateCards() {
  effectGrid.replaceChildren(...GALLERY_WALLPAPERS.filter((effect) => activeFilter === 'all' || effect.category === activeFilter).map(renderCard))
}

function renderEffectSwitcher() {
  effectSwitchers.forEach((switcher) => {
    const buttons = SHADER_EFFECTS.map((effect) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.dataset.effectId = effect.id
      button.setAttribute('role', 'tab')
      button.textContent = effect.name
      button.addEventListener('click', () => selectEffect(effect.id))
      return button
    })
    switcher.replaceChildren(...buttons)
  })
}

function updateCardSelection() {
  effectSwitchers.forEach((switcher) => switcher.querySelectorAll('[data-effect-id]').forEach((button) => {
    const active = button.dataset.effectId === selected.id
    button.classList.toggle('is-active', active)
    button.setAttribute('aria-selected', String(active))
  }))
}

function createControl(parameter) {
  const row = document.createElement('div')
  row.className = 'control-row'
  const label = document.createElement('label')
  label.htmlFor = `control-${parameter.id}`
  const title = document.createElement('span')
  title.textContent = parameter.label
  label.append(title)

  if (parameter.type === 'select') {
    const select = document.createElement('select')
    select.id = `control-${parameter.id}`
    parameter.options.forEach((option) => {
      const item = document.createElement('option')
      item.value = option.value
      item.textContent = option.label
      select.append(item)
    })
    select.value = state[parameter.id]
    select.addEventListener('input', () => {
      state[parameter.id] = Number(select.value)
      updatePreviewValues()
    })
    row.append(label, select)
    return row
  }

  if (parameter.type === 'boolean') {
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.id = `control-${parameter.id}`
    input.checked = Boolean(state[parameter.id])
    label.className = 'control-checkbox'
    label.prepend(input)
    input.addEventListener('change', () => {
      state[parameter.id] = input.checked
      updatePreviewValues()
    })
    row.append(label)
    return row
  }

  const value = document.createElement('span')
  value.className = 'control-value'
  value.textContent = formatControlValue(state[parameter.id])
  label.append(value)
  const input = document.createElement('input')
  input.type = 'range'
  input.id = `control-${parameter.id}`
  input.min = parameter.min
  input.max = parameter.max
  input.step = parameter.step || 0.1
  input.value = state[parameter.id]
  input.style.setProperty('--fill', `${((input.value - input.min) / (input.max - input.min)) * 100}%`)
  input.addEventListener('input', () => {
    state[parameter.id] = Number(input.value)
    value.textContent = formatControlValue(state[parameter.id])
    input.style.setProperty('--fill', `${((input.value - input.min) / (input.max - input.min)) * 100}%`)
    updatePreviewValues()
  })
  row.append(label, input)
  return row
}

function formatControlValue(value) {
  return typeof value === 'number' ? value.toFixed(1) : ''
}

function updateControls() {
  controls.replaceChildren(...(selected.parameters || []).map(createControl))
  controlTitle.textContent = selected.name
  controlTagline.textContent = selected.tagline
  canvasLabel.textContent = selected.name
  canvasCategory.textContent = categoryLabel(selected.category)
  heroCanvasWrap.style.backgroundImage = `url("${thumbnailFor(selected.id)}")`
  studioLabel.textContent = selected.name
  studioPreview.src = thumbnailFor(selected.id)
  studioStage.setAttribute('aria-label', `${selected.name} live wallpaper preview`)
}

function updatePreviewValues() {
  for (const previewRenderer of [renderer, studioRenderer]) {
    if (previewRenderer) previewRenderer.values = { ...state }
  }
}

function updatePreviewEffect(effect) {
  for (const previewRenderer of [renderer, studioRenderer]) {
    if (!previewRenderer) continue
    previewRenderer.setEffect(effect)
    previewRenderer.values = { ...state }
  }
}

function selectEffect(id) {
  const effect = byId(id)
  selected = effect
  state = defaults(effect)
  updateControls()
  updateCardSelection()
  updatePreviewEffect(effect)
  document.querySelector('#studio')?.classList.add('has-selection')
}

class ShaderRenderer {
  constructor(canvas) {
    this.canvas = canvas
    this.gl = canvas.getContext('webgl', { antialias: false, alpha: true, powerPreference: 'high-performance' })
    this.program = null
    this.locations = new Map()
    this.texture = null
    this.effect = null
    this.values = {}
    this.start = performance.now()
    this.pointer = [0, 0]
    this.drag = false
    this.visible = false
    if (!this.gl) return
    this.positionBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), this.gl.STATIC_DRAW)
    this.canvas.addEventListener('pointerdown', (event) => { this.drag = true; this.canvas.setPointerCapture(event.pointerId) })
    this.canvas.addEventListener('pointerup', () => { this.drag = false })
    this.canvas.addEventListener('pointermove', (event) => {
      if (!this.drag || !this.effect || this.effect.id !== 'tunnel') return
      const rect = this.canvas.getBoundingClientRect()
      this.pointer = [(event.clientX - rect.left) / rect.width - .5, (event.clientY - rect.top) / rect.height - .5]
    })
    window.addEventListener('resize', () => this.resize())
    this.resize()
    this.setEffect(selected)
    if ('IntersectionObserver' in window) {
      this.visibilityObserver = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting
        if (this.visible) this.resize()
      }, { rootMargin: '120px' })
      this.visibilityObserver.observe(canvas)
    } else {
      this.visible = true
    }
    requestAnimationFrame(() => this.frame())
  }

  resize() {
    if (!this.gl) return
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.max(1, Math.floor(this.canvas.clientWidth * ratio))
    const height = Math.max(1, Math.floor(this.canvas.clientHeight * ratio))
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
      this.gl.viewport(0, 0, width, height)
    }
  }

  compile(effect) {
    const gl = this.gl
    const vertex = gl.createShader(gl.VERTEX_SHADER)
    const fragment = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(vertex, effect.vertSource)
    gl.shaderSource(fragment, effect.fragSource)
    gl.compileShader(vertex)
    gl.compileShader(fragment)
    if (!gl.getShaderParameter(vertex, gl.COMPILE_STATUS) || !gl.getShaderParameter(fragment, gl.COMPILE_STATUS)) {
      console.warn(`Could not compile ${effect.id}`, gl.getShaderInfoLog(vertex), gl.getShaderInfoLog(fragment))
      gl.deleteShader(vertex); gl.deleteShader(fragment)
      return null
    }
    const program = gl.createProgram()
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program)
    gl.deleteShader(vertex); gl.deleteShader(fragment)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn(`Could not link ${effect.id}`, gl.getProgramInfoLog(program)); gl.deleteProgram(program); return null
    }
    return program
  }

  setEffect(effect) {
    if (!this.gl) return
    const program = this.compile(effect)
    if (!program) return
    if (this.program) this.gl.deleteProgram(this.program)
    this.program = program
    this.effect = effect
    this.locations.clear()
    const gl = this.gl
    const names = [...effect.fragSource.matchAll(/uniform\s+\w+\s+(\w+)/g)].map((match) => match[1])
    names.push('uMVPMatrix', 'aPosition')
    names.forEach((name) => this.locations.set(name, name === 'aPosition' ? gl.getAttribLocation(program, name) : gl.getUniformLocation(program, name)))
    if (effect.id === 'tunnel') this.loadTexture(effect.defaultTexture)
  }

  loadTexture(path) {
    const gl = this.gl
    // Install a valid texture immediately. This avoids a black first frame while
    // the selected bitmap is loading on slower connections or static previews.
    this.texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([112, 125, 160, 255]))
    const anisotropicFiltering = gl.getExtension('EXT_texture_filter_anisotropic')
    if (anisotropicFiltering) {
      const maxAnisotropy = gl.getParameter(anisotropicFiltering.MAX_TEXTURE_MAX_ANISOTROPY_EXT)
      gl.texParameterf(gl.TEXTURE_2D, anisotropicFiltering.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, maxAnisotropy))
    }
    const image = new Image()
    image.onload = () => {
      // WebGL 1 only supports mipmaps for power-of-two textures. Resampling
      // once on the CPU lets the GPU filter the tunnel cleanly at any size.
      const textureCanvas = document.createElement('canvas')
      textureCanvas.width = 1024
      textureCanvas.height = 1024
      const context = textureCanvas.getContext('2d')
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.drawImage(image, 0, 0, textureCanvas.width, textureCanvas.height)
      gl.bindTexture(gl.TEXTURE_2D, this.texture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureCanvas)
      gl.generateMipmap(gl.TEXTURE_2D)
    }
    image.onerror = () => console.warn(`Could not load tunnel texture: ${path}`)
    image.src = path
  }

  uniform(name, value) {
    const location = this.locations.get(name)
    if (location == null || !this.gl) return
    const gl = this.gl
    if (name === 'uResolution') gl.uniform2f(location, this.canvas.width, this.canvas.height)
    else if (name === 'uMVPMatrix') gl.uniformMatrix4fv(location, false, new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]))
    else if (name === 'uPalette' || name === 'uFlowMode' || name === 'uIsSquare' || name === 'uIsCenterBright' || name === 'uIsWarpMode' || name === 'uMaterial' || name === 'uFractalMode' || name === 'uLightningStyle' || name === 'uScene') gl.uniform1i(location, Math.round(Number(value) || 0))
    else if (name === 'uTunnelTexture') gl.uniform1i(location, 0)
    else gl.uniform1f(location, Number(value) || 0)
  }

  frame() {
    const gl = this.gl
    if (gl && this.visible && this.program && this.effect) {
      this.resize()
      const time = (performance.now() - this.start) / 1000
      gl.useProgram(this.program)
      const position = this.locations.get('aPosition')
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
      gl.enableVertexAttribArray(position)
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
      this.uniform('uMVPMatrix')
      this.uniform('uTime', time)
      this.uniform('uResolution', [this.canvas.width, this.canvas.height])
      this.uniform('uSeed', .37)
      this.uniform('uSpeed', this.effect.id === 'tunnel' ? this.values.speed * 0.2 : (this.values.speed ?? .8))
      this.uniform('uFlowSpeed', this.values.flow_speed ?? .7)
      this.uniform('uMotionSpeed', this.values.speed ?? .8)
      this.uniform('uBrightness', this.values.brightness * 0.1 + .3)
      this.uniform('uIntensity', this.values.intensity ?? 1.2)
      this.uniform('uGridIntensity', this.values.grid_intensity ?? .85)
      this.uniform('uGlow', this.values.glow ?? 1)
      this.uniform('uContrastGlow', this.values.intensity ?? 1.2)
      this.uniform('uRippleIntensity', this.values.intensity ?? 1)
      this.uniform('uPalette', this.values.palette ?? 0)
      this.uniform('uFlowMode', this.values.flow_mode ?? 0)
      this.uniform('uIsSquare', this.values.square_tunnel)
      this.uniform('uIsCenterBright', this.values.center_bright)
      this.uniform('uDeviationX', this.pointer[0] * .4)
      this.uniform('uDeviationY', this.pointer[1] * .4)
      this.uniform('uIsWarpMode', this.values.warp_mode)
      this.uniform('uScale', this.values.scale ?? 1)
      this.uniform('uDetail', this.values.detail ?? 1)
      this.uniform('uVorticity', this.values.vorticity ?? 1)
      this.uniform('uViscosity', this.values.viscosity ?? 1)
      this.uniform('uDyeDensity', this.values.dye_density ?? 1)
      this.uniform('uEmitters', this.values.emitters ?? 3)
      this.uniform('uSunSize', this.values.sun_size ?? .68)
      this.uniform('uHorizonHeight', this.values.horizon_height ?? .46)
      this.uniform('uReflectivity', 1.1)
      this.uniform('uRippleScale', 1)
      this.uniform('uMaterial', this.values.palette ?? 1)
      this.uniform('uRainfallAmount', 1)
      this.uniform('uDropletDensity', 1)
      this.uniform('uWind', .2)
      this.uniform('uLightningStyle', 0)
      this.uniform('uScene', this.values.palette ?? 0)
      this.uniform('uDensity', 1)
      this.uniform('uDriftSpeed', this.values.speed ?? .8)
      this.uniform('uDepth', 1)
      this.uniform('uSpread', 1)
      this.uniform('uZoom', 1)
      this.uniform('uRotationSpeed', this.values.speed ?? .8)
      this.uniform('uContrast', 1)
      if (this.effect.id === 'tunnel' && this.texture) {
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texture); this.uniform('uTunnelTexture', 0)
      }
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    requestAnimationFrame(() => this.frame())
  }
}

function setupFilters() {
  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter
    document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('is-active', item === button))
    populateCards()
  }))
}

function setupNavigation() {
  const header = document.querySelector('[data-header]')
  const nav = document.querySelector('[data-nav]')
  const menu = document.querySelector('[data-menu-toggle]')
  window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 30), { passive: true })
  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open')
    menu.setAttribute('aria-expanded', String(open))
    document.body.classList.toggle('menu-open', open)
  })
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-open')
  }))
}

function setupReveal() {
  if (!('IntersectionObserver' in window)) return
  const items = document.querySelectorAll('.effect-card, .tour-shot, .faq')
  items.forEach((item) => { item.style.opacity = '0'; item.style.transform = 'translateY(12px)'; item.style.transition = 'opacity .6s ease, transform .6s ease' })
  const observer = new IntersectionObserver((entries, instance) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return
    entry.target.style.opacity = '1'; entry.target.style.transform = 'translateY(0)'; instance.unobserve(entry.target)
  }), { threshold: .08 })
  items.forEach((item) => observer.observe(item))
}

state = defaults(selected)
populateCards()
renderEffectSwitcher()
updateControls()
updateCardSelection()
setupFilters()
setupNavigation()
renderer = new ShaderRenderer(stage)
studioRenderer = new ShaderRenderer(studioStage)
updatePreviewValues()
if (stage && !renderer.gl) stage.parentElement.classList.add('no-webgl')
if (studioStage && !studioRenderer.gl) studioStage.parentElement.classList.add('no-webgl')
document.querySelector('[data-year]').textContent = new Date().getFullYear()
setupReveal()

// Keep the download destination correct if a static copy changes it later.
document.querySelectorAll(`a[href="${PLAY_URL}"]`).forEach((link) => { link.target = '_blank' })
