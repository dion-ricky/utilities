<script setup lang="ts">
import {
  Crop,
  Download,
  Highlighter,
  ImagePlus,
  MousePointer2,
  Pen,
  Redo2,
  RotateCcw,
  Trash2,
  Type,
  Undo2,
} from '@lucide/vue'
import {
  computed,
  markRaw,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue'
import Field from '../../components/Field.vue'
import Select from '../../components/Select.vue'
import {
  type Annotation,
  annotationBounds,
  buildExportFilename,
  clampCropToBounds,
  contrastOutlineColor,
  createHistory,
  defaultCrop,
  type EditorSnapshot,
  fitDisplaySize,
  type History,
  hitTestAnnotations,
  normalizeDragRect,
  type Point,
  pushHistory,
  type Rect,
  redoHistory,
  remapAnnotationsAfterCrop,
  type StrokeAnnotation,
  type TextAnnotation,
  type ToolMode,
  toImagePoint,
  undoHistory,
} from './logic'

type ImageSource = ImageBitmap | HTMLImageElement
type ExportFormat = 'png' | 'jpeg' | 'webp'

interface SourceMeta {
  name: string
  width: number
  height: number
}

type DragState =
  | { kind: 'draw'; id: string }
  | { kind: 'move'; id: string; start: Point; original: Annotation }
  | { kind: 'crop'; start: Point }

const MAX_FILE_BYTES = 25 * 1024 * 1024
const MAX_DIMENSION = 10000
const FONT_FAMILY = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
const HIT_TOLERANCE = 8

const fileInput = ref<HTMLInputElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const stageEl = ref<HTMLDivElement | null>(null)

const source = shallowRef<ImageSource | null>(null)
const sourceMeta = ref<SourceMeta | null>(null)
let previewContext: CanvasRenderingContext2D | null = null

const state = ref<EditorSnapshot>({ crop: defaultCrop(0, 0), annotations: [] })
const history = shallowRef<History<EditorSnapshot>>(
  createHistory<EditorSnapshot>({ crop: defaultCrop(0, 0), annotations: [] }),
)

const mode = ref<ToolMode>('pen')
const selectedId = ref<string | null>(null)
const pendingCrop = ref<Rect | null>(null)
const displaySize = ref({ width: 0, height: 0, scale: 1 })

const color = ref('#d52b1e')
const highlightColor = ref('#fde047')
const penWidth = ref(6)
const highlightWidth = ref(22)
const fontSize = ref(28)
const labelText = ref('')
const editText = ref('')

const format = ref<ExportFormat>('png')
const quality = ref(0.9)
const exporting = ref(false)

const error = ref('')
const loading = ref(false)
const dragging = ref(false)

const drag = shallowRef<DragState | null>(null)
let activePointerId: number | null = null
let loadSeq = 0
let rafId: number | null = null
let resizeObserver: ResizeObserver | null = null

const formatOptions = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
]

const canUndo = computed(() => history.value.past.length > 0)
const canRedo = computed(() => history.value.future.length > 0)

const selectedAnnotation = computed(
  () => state.value.annotations.find((annotation) => annotation.id === selectedId.value) ?? null,
)
const selectedText = computed(() =>
  selectedAnnotation.value?.type === 'text' ? selectedAnnotation.value : null,
)

watch(selectedId, (id) => {
  if (!id) {
    editText.value = ''
    return
  }
  const found = state.value.annotations.find((annotation) => annotation.id === id)
  editText.value = found?.type === 'text' ? found.text : ''
})

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `a-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function cloneAnnotation(annotation: Annotation): Annotation {
  if (annotation.type === 'text') return { ...annotation }
  return { ...annotation, points: annotation.points.map((point) => ({ ...point })) }
}

function cloneSnapshot(snapshot: EditorSnapshot): EditorSnapshot {
  return {
    crop: { ...snapshot.crop },
    annotations: snapshot.annotations.map(cloneAnnotation),
  }
}

function snapshotKey(snapshot: EditorSnapshot): string {
  return JSON.stringify(snapshot)
}

/** Record the current state if it differs from the last committed snapshot. */
function commit() {
  const next = cloneSnapshot(state.value)
  if (snapshotKey(next) === snapshotKey(history.value.present)) return
  history.value = pushHistory(history.value, next)
}

function closeSource(value: ImageSource | null | undefined) {
  if (typeof ImageBitmap !== 'undefined' && value instanceof ImageBitmap) value.close()
}

function disposeSource() {
  closeSource(source.value)
}

function pickFile() {
  fileInput.value?.click()
}

function setMode(next: ToolMode) {
  mode.value = next
  if (next !== 'crop') pendingCrop.value = null
  // Entering any non-select tool drops the selection so the composer and the
  // label editor can never be on screen at the same time.
  if (next !== 'select') selectedId.value = null
  scheduleRender()
}

function updateDisplaySize() {
  const stage = stageEl.value
  const crop = state.value.crop
  if (!stage || !source.value || crop.width <= 0 || crop.height <= 0) return
  // The stage has 12px of padding on each side; keep the canvas inside it.
  const maxWidth = Math.max(1, stage.clientWidth - 24)
  const maxHeight = Math.max(240, Math.round(window.innerHeight * 0.65))
  displaySize.value = fitDisplaySize(crop.width, crop.height, maxWidth, maxHeight)
}

function drawStroke(ctx: CanvasRenderingContext2D, annotation: StrokeAnnotation) {
  const points = annotation.points
  if (points.length === 0) return
  ctx.save()
  ctx.globalAlpha = annotation.type === 'highlight' ? 0.35 : 1
  ctx.strokeStyle = annotation.color
  ctx.fillStyle = annotation.color
  ctx.lineWidth = annotation.width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (points.length === 1) {
    const point = points[0]
    if (point) {
      ctx.beginPath()
      ctx.arc(point.x, point.y, annotation.width / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  } else {
    const first = points[0]
    if (!first) {
      ctx.restore()
      return
    }
    ctx.beginPath()
    ctx.moveTo(first.x, first.y)
    for (let index = 1; index < points.length - 1; index += 1) {
      const current = points[index]
      const next = points[index + 1]
      if (!current || !next) continue
      ctx.quadraticCurveTo(current.x, current.y, (current.x + next.x) / 2, (current.y + next.y) / 2)
    }
    const last = points[points.length - 1]
    if (last) ctx.lineTo(last.x, last.y)
    ctx.stroke()
  }
  ctx.restore()
}

function drawText(ctx: CanvasRenderingContext2D, annotation: TextAnnotation) {
  if (!annotation.text) return
  ctx.save()
  ctx.font = `600 ${annotation.fontSize}px ${FONT_FAMILY}`
  ctx.textBaseline = 'top'
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(2, annotation.fontSize * 0.12)
  ctx.strokeStyle = contrastOutlineColor(annotation.color)
  ctx.strokeText(annotation.text, annotation.x, annotation.y)
  ctx.fillStyle = annotation.color
  ctx.fillText(annotation.text, annotation.x, annotation.y)
  ctx.restore()
}

/** Shared by the preview and the 1:1 export; coordinates are image pixels. */
function drawAnnotations(ctx: CanvasRenderingContext2D, annotations: Annotation[]) {
  for (const annotation of annotations) {
    if (annotation.type === 'text') drawText(ctx, annotation)
    else drawStroke(ctx, annotation)
  }
}

function drawCropOverlay(
  ctx: CanvasRenderingContext2D,
  crop: Rect,
  selection: Rect,
  scale: number,
) {
  ctx.save()
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
  ctx.fillRect(0, 0, crop.width, selection.y)
  ctx.fillRect(
    0,
    selection.y + selection.height,
    crop.width,
    Math.max(0, crop.height - selection.y - selection.height),
  )
  ctx.fillRect(0, selection.y, selection.x, selection.height)
  ctx.fillRect(
    selection.x + selection.width,
    selection.y,
    Math.max(0, crop.width - selection.x - selection.width),
    selection.height,
  )
  ctx.strokeStyle = '#d52b1e'
  ctx.lineWidth = Math.max(1, 1.5 / scale)
  const dash = Math.max(3, 6 / scale)
  ctx.setLineDash([dash, dash * 0.6])
  ctx.strokeRect(selection.x, selection.y, selection.width, selection.height)
  ctx.restore()
}

function drawSelection(ctx: CanvasRenderingContext2D, annotation: Annotation, scale: number) {
  const bounds = annotationBounds(annotation)
  const pad = 2 / scale
  ctx.save()
  ctx.strokeStyle = '#d52b1e'
  ctx.lineWidth = Math.max(1, 1.5 / scale)
  const dash = Math.max(3, 4 / scale)
  ctx.setLineDash([dash, dash * 0.75])
  ctx.strokeRect(bounds.x - pad, bounds.y - pad, bounds.width + pad * 2, bounds.height + pad * 2)
  ctx.restore()
}

function render() {
  rafId = null
  const canvas = canvasEl.value
  const image = source.value
  if (!canvas || !image) return
  updateDisplaySize()
  const { width, height, scale } = displaySize.value
  if (width <= 0 || height <= 0 || scale <= 0) return

  const dpr = window.devicePixelRatio || 1
  const pixelWidth = Math.max(1, Math.round(width * dpr))
  const pixelHeight = Math.max(1, Math.round(height * dpr))
  if (canvas.width !== pixelWidth) canvas.width = pixelWidth
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const ctx = previewContext ?? canvas.getContext('2d')
  if (!ctx) return
  previewContext = markRaw(ctx)

  const crop = state.value.crop
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0)
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)
  drawAnnotations(ctx, state.value.annotations)

  const pending = pendingCrop.value
  if (pending) drawCropOverlay(ctx, crop, pending, scale)

  const selected = selectedAnnotation.value
  if (selected) drawSelection(ctx, selected, scale)
}

function scheduleRender() {
  if (rafId !== null) return
  rafId = window.requestAnimationFrame(() => {
    rafId = null
    render()
  })
}

async function decodeImage(file: File): Promise<ImageSource> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // Fall through to the <img> decode path (older browsers).
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

function looksLikeImage(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  return !file.type && /\.(png|jpe?g|gif|webp|bmp|svg|avif|heic)$/i.test(file.name)
}

async function loadFile(file: File | null | undefined) {
  if (!file) return
  // A newer request invalidates any decode still in flight.
  const token = ++loadSeq
  if (!looksLikeImage(file)) {
    error.value = 'That file is not an image. Choose a PNG, JPEG, WebP, GIF, or similar image.'
    loading.value = false
    return
  }
  if (file.size > MAX_FILE_BYTES) {
    error.value = 'Image is larger than 25 MB. Choose a smaller file.'
    loading.value = false
    return
  }

  loading.value = true
  try {
    const decoded = await decodeImage(file)
    if (token !== loadSeq) {
      closeSource(decoded)
      return
    }
    const width = decoded instanceof HTMLImageElement ? decoded.naturalWidth : decoded.width
    const height = decoded instanceof HTMLImageElement ? decoded.naturalHeight : decoded.height
    if (width <= 0 || height <= 0) {
      closeSource(decoded)
      error.value = 'Could not read that image.'
      return
    }
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      closeSource(decoded)
      error.value = `Image is too large (${width}×${height}). The limit is ${MAX_DIMENSION} px per side.`
      return
    }

    disposeSource()
    source.value = markRaw(decoded)
    sourceMeta.value = {
      name: file.name || 'pasted-image.png',
      width,
      height,
    }
    state.value = { crop: defaultCrop(width, height), annotations: [] }
    history.value = createHistory(cloneSnapshot(state.value))
    selectedId.value = null
    pendingCrop.value = null
    labelText.value = ''
    editText.value = ''
    error.value = ''
    await nextTick()
    scheduleRender()
  } catch {
    if (token === loadSeq) error.value = 'Could not decode that image. Try another file.'
  } finally {
    if (token === loadSeq) loading.value = false
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  void loadFile(file)
}

function onDragOver(event: DragEvent) {
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  dragging.value = true
}

function onDragLeave(event: DragEvent) {
  const stage = stageEl.value
  if (stage && event.relatedTarget instanceof Node && stage.contains(event.relatedTarget)) return
  dragging.value = false
}

function onDrop(event: DragEvent) {
  dragging.value = false
  const file = event.dataTransfer?.files?.[0]
  void loadFile(file)
}

function onPaste(event: ClipboardEvent) {
  const items = event.clipboardData?.items
  let file: File | null = null
  if (items) {
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index]
      if (item?.kind === 'file' && item.type.startsWith('image/')) {
        file = item.getAsFile()
        break
      }
    }
  }
  if (!file) {
    const files = event.clipboardData?.files
    if (files && files.length > 0) file = files[0] ?? null
  }
  if (!file) return
  event.preventDefault()
  void loadFile(file)
}

function currentImagePoint(event: PointerEvent | MouseEvent): Point {
  return toImagePoint(event.offsetX, event.offsetY, displaySize.value.scale)
}

function startDrag(event: PointerEvent) {
  const canvas = canvasEl.value
  if (!canvas) return
  canvas.setPointerCapture(event.pointerId)
  activePointerId = event.pointerId
}

function endDrag() {
  const canvas = canvasEl.value
  if (activePointerId !== null && canvas?.hasPointerCapture(activePointerId)) {
    canvas.releasePointerCapture(activePointerId)
  }
  activePointerId = null
}

function onPointerDown(event: PointerEvent) {
  if (!source.value || event.button !== 0) return
  const point = currentImagePoint(event)
  const crop = state.value.crop
  if (point.x < 0 || point.y < 0 || point.x > crop.width || point.y > crop.height) return
  event.preventDefault()
  error.value = ''

  if (mode.value === 'pen' || mode.value === 'highlight') {
    const annotation: StrokeAnnotation = {
      id: newId(),
      type: mode.value,
      color: mode.value === 'highlight' ? highlightColor.value : color.value,
      width: mode.value === 'highlight' ? highlightWidth.value : penWidth.value,
      points: [point],
    }
    state.value.annotations.push(annotation)
    selectedId.value = null
    drag.value = { kind: 'draw', id: annotation.id }
    startDrag(event)
    scheduleRender()
    return
  }

  if (mode.value === 'crop') {
    drag.value = { kind: 'crop', start: point }
    pendingCrop.value = null
    startDrag(event)
    scheduleRender()
    return
  }

  if (mode.value === 'text') {
    const label = labelText.value.trim()
    if (!label) {
      error.value = 'Type a label in the text field first, then click the image.'
      return
    }
    const annotation: TextAnnotation = {
      id: newId(),
      type: 'text',
      color: color.value,
      fontSize: fontSize.value,
      text: label,
      x: point.x,
      y: point.y,
    }
    state.value.annotations.push(annotation)
    // Placement deliberately does not select the new label: the composer stays
    // the compose field, and selecting happens through the Select tool.
    selectedId.value = null
    drag.value = null
    commit()
    scheduleRender()
    return
  }

  const hit = hitTestAnnotations(state.value.annotations, point, HIT_TOLERANCE)
  // A canvas click blurs the label editor before the selection changes, so
  // flush a pending edit here to keep it in history.
  if (selectedText.value) commitEditText()
  selectedId.value = hit
  if (hit) {
    const found = state.value.annotations.find((annotation) => annotation.id === hit)
    if (found) {
      drag.value = { kind: 'move', id: hit, start: point, original: cloneAnnotation(found) }
      startDrag(event)
    }
  }
  scheduleRender()
}

function moveAnnotation(target: Annotation, original: Annotation, deltaX: number, deltaY: number) {
  if (target.type === 'text' && original.type === 'text') {
    target.x = original.x + deltaX
    target.y = original.y + deltaY
    return
  }
  if (target.type !== 'text' && original.type !== 'text') {
    target.points = original.points.map((point) => ({
      x: point.x + deltaX,
      y: point.y + deltaY,
    }))
  }
}

function onPointerMove(event: PointerEvent) {
  const current = drag.value
  if (!current) return
  const point = currentImagePoint(event)

  if (current.kind === 'draw') {
    const annotation = state.value.annotations.find((entry) => entry.id === current.id)
    if (annotation && annotation.type !== 'text') {
      const last = annotation.points[annotation.points.length - 1]
      if (!last || Math.hypot(point.x - last.x, point.y - last.y) >= 0.75) {
        annotation.points.push(point)
      }
    }
  } else if (current.kind === 'move') {
    const annotation = state.value.annotations.find((entry) => entry.id === current.id)
    if (annotation) {
      moveAnnotation(
        annotation,
        current.original,
        point.x - current.start.x,
        point.y - current.start.y,
      )
    }
  } else {
    const crop = state.value.crop
    pendingCrop.value = normalizeDragRect(current.start, point, {
      x: 0,
      y: 0,
      width: crop.width,
      height: crop.height,
    })
  }
  scheduleRender()
}

function onPointerUp() {
  const current = drag.value
  if (!current) {
    endDrag()
    return
  }
  drag.value = null
  endDrag()
  if (current.kind === 'draw' || current.kind === 'move') commit()
  scheduleRender()
}

function onDoubleClick(event: MouseEvent) {
  if (mode.value !== 'select' || !source.value) return
  const point = currentImagePoint(event)
  selectedId.value = hitTestAnnotations(state.value.annotations, point, HIT_TOLERANCE)
  scheduleRender()
}

function deleteSelected() {
  const id = selectedId.value
  if (!id) return
  state.value.annotations = state.value.annotations.filter((annotation) => annotation.id !== id)
  selectedId.value = null
  commit()
  scheduleRender()
}

function applyCrop() {
  const pending = pendingCrop.value
  const crop = state.value.crop
  if (!pending || !source.value) return
  const rounded = clampCropToBounds(
    {
      x: Math.round(pending.x),
      y: Math.round(pending.y),
      width: Math.round(pending.width),
      height: Math.round(pending.height),
    },
    { x: 0, y: 0, width: crop.width, height: crop.height },
  )
  if (rounded.width < 1 || rounded.height < 1) {
    pendingCrop.value = null
    scheduleRender()
    return
  }
  const annotations = remapAnnotationsAfterCrop(state.value.annotations, -rounded.x, -rounded.y, {
    x: 0,
    y: 0,
    width: rounded.width,
    height: rounded.height,
  })
  state.value = {
    crop: {
      x: crop.x + rounded.x,
      y: crop.y + rounded.y,
      width: rounded.width,
      height: rounded.height,
    },
    annotations,
  }
  pendingCrop.value = null
  selectedId.value = null
  commit()
  scheduleRender()
}

function cancelCrop() {
  pendingCrop.value = null
  drag.value = null
  scheduleRender()
}

function applyHistory(next: History<EditorSnapshot> | null) {
  if (!next) return
  history.value = next
  state.value = cloneSnapshot(next.present)
  selectedId.value = null
  pendingCrop.value = null
  drag.value = null
  scheduleRender()
}

function undo() {
  applyHistory(undoHistory(history.value))
}

function redo() {
  applyHistory(redoHistory(history.value))
}

function onEditTextInput() {
  const active = selectedText.value
  if (!active) return
  active.text = editText.value
  scheduleRender()
}

function commitEditText() {
  const active = selectedText.value
  if (!active) return
  active.text = editText.value
  commit()
}

function resetImage() {
  const meta = sourceMeta.value
  if (!meta) return
  state.value = { crop: defaultCrop(meta.width, meta.height), annotations: [] }
  selectedId.value = null
  pendingCrop.value = null
  drag.value = null
  editText.value = ''
  commit()
  scheduleRender()
}

function onFormatChange(value: string) {
  if (value === 'png' || value === 'jpeg' || value === 'webp') format.value = value
}

function exportImage() {
  const image = source.value
  if (!image || exporting.value) return
  // Snapshot the export settings so a mid-export change cannot mismatch the
  // blob MIME type and the download filename.
  const fmt = format.value
  const q = quality.value
  const crop = state.value.crop
  const width = Math.max(1, Math.round(crop.width))
  const height = Math.max(1, Math.round(crop.height))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    error.value = 'Could not prepare the export.'
    return
  }
  if (fmt === 'jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height)
  drawAnnotations(ctx, state.value.annotations)

  exporting.value = true
  canvas.toBlob(
    (blob) => {
      exporting.value = false
      if (!blob) {
        error.value = 'Export failed. Try a different format.'
        return
      }
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = buildExportFilename(sourceMeta.value?.name ?? 'image.png', fmt)
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
    },
    `image/${fmt}`,
    q,
  )
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  )
}

function onKeyDown(event: KeyboardEvent) {
  if (!source.value || isTypingTarget(event.target)) return
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault()
    if (event.shiftKey) redo()
    else undo()
    return
  }
  if (event.key === 'Delete' && selectedId.value) {
    event.preventDefault()
    deleteSelected()
    return
  }
  if (event.key === 'Escape') {
    pendingCrop.value = null
    selectedId.value = null
    drag.value = null
    scheduleRender()
  }
}

function onWindowResize() {
  updateDisplaySize()
  scheduleRender()
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('paste', onPaste)
  window.addEventListener('resize', onWindowResize)
  if (stageEl.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      updateDisplaySize()
      scheduleRender()
    })
    resizeObserver.observe(stageEl.value)
  }
  scheduleRender()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('paste', onPaste)
  window.removeEventListener('resize', onWindowResize)
  resizeObserver?.disconnect()
  resizeObserver = null
  if (rafId !== null) {
    window.cancelAnimationFrame(rafId)
    rafId = null
  }
  disposeSource()
})
</script>

<template>
  <div class="annotator">
    <aside class="panel">
      <div class="panel-section">
        <input
          ref="fileInput"
          class="file-input"
          type="file"
          accept="image/*"
          aria-label="Choose an image"
          @change="onFileChange"
        />
        <button type="button" class="btn" @click="pickFile">
          <ImagePlus :size="16" aria-hidden="true" />
          {{ source ? 'Replace image' : 'Choose image' }}
        </button>
        <p v-if="sourceMeta" class="meta">
          {{ sourceMeta.name }} · {{ sourceMeta.width }}×{{ sourceMeta.height }}
        </p>
        <p v-if="loading" class="meta">Loading image…</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
      </div>

      <div class="panel-section">
        <span class="section-label">Tool</span>
        <div class="mode-grid" role="group" aria-label="Annotation tool">
          <button
            type="button"
            class="btn mode-btn"
            :class="{ active: mode === 'select' }"
            :aria-pressed="mode === 'select'"
            @click="setMode('select')"
          >
            <MousePointer2 :size="15" aria-hidden="true" />
            Select
          </button>
          <button
            type="button"
            class="btn mode-btn"
            :class="{ active: mode === 'crop' }"
            :aria-pressed="mode === 'crop'"
            @click="setMode('crop')"
          >
            <Crop :size="15" aria-hidden="true" />
            Crop
          </button>
          <button
            type="button"
            class="btn mode-btn"
            :class="{ active: mode === 'pen' }"
            :aria-pressed="mode === 'pen'"
            @click="setMode('pen')"
          >
            <Pen :size="15" aria-hidden="true" />
            Draw
          </button>
          <button
            type="button"
            class="btn mode-btn"
            :class="{ active: mode === 'highlight' }"
            :aria-pressed="mode === 'highlight'"
            @click="setMode('highlight')"
          >
            <Highlighter :size="15" aria-hidden="true" />
            Highlight
          </button>
          <button
            type="button"
            class="btn mode-btn"
            :class="{ active: mode === 'text' }"
            :aria-pressed="mode === 'text'"
            @click="setMode('text')"
          >
            <Type :size="15" aria-hidden="true" />
            Text
          </button>
        </div>
      </div>

      <div v-if="source" class="panel-section">
        <Field v-if="mode === 'pen' || mode === 'text' || mode === 'select'" label="Colour">
          <input v-model="color" class="color" type="color" aria-label="Pen and text colour" />
        </Field>
        <Field v-if="mode === 'highlight'" label="Highlight colour">
          <input
            v-model="highlightColor"
            class="color"
            type="color"
            aria-label="Highlight colour"
          />
        </Field>
        <Field v-if="mode === 'pen'" :label="`Pen width: ${penWidth}px`">
          <input v-model.number="penWidth" type="range" min="1" max="40" step="1" />
        </Field>
        <Field v-if="mode === 'highlight'" :label="`Highlight width: ${highlightWidth}px`">
          <input v-model.number="highlightWidth" type="range" min="4" max="80" step="1" />
        </Field>
        <Field v-if="mode === 'text'" :label="`Text size: ${fontSize}px`">
          <input v-model.number="fontSize" type="range" min="10" max="96" step="1" />
        </Field>
        <Field v-if="mode === 'text'" label="Label text" hint="click the image to place">
          <input v-model="labelText" class="input" type="text" maxlength="200" />
        </Field>
        <Field v-if="selectedText" label="Edit label" hint="edits save on blur">
          <input
            v-model="editText"
            class="input"
            type="text"
            maxlength="200"
            @input="onEditTextInput"
            @keydown.enter.prevent="commitEditText"
            @blur="commitEditText"
          />
        </Field>
        <button
          v-if="selectedAnnotation"
          type="button"
          class="btn delete-btn"
          @click="deleteSelected"
        >
          <Trash2 :size="14" aria-hidden="true" />
          Delete selected
        </button>
      </div>

      <div class="panel-section">
        <span class="section-label">History</span>
        <div class="history-row">
          <button type="button" class="btn" :disabled="!canUndo" @click="undo">
            <Undo2 :size="14" aria-hidden="true" />
            Undo
          </button>
          <button type="button" class="btn" :disabled="!canRedo" @click="redo">
            <Redo2 :size="14" aria-hidden="true" />
            Redo
          </button>
        </div>
      </div>
    </aside>

    <div class="workspace">
      <div
        ref="stageEl"
        class="stage"
        :class="{ dragging }"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
      >
        <canvas
          v-show="source"
          ref="canvasEl"
          class="canvas"
          aria-label="Image annotation canvas"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          @dblclick="onDoubleClick"
        />
        <div v-if="!source" class="dropzone">
          <ImagePlus :size="32" aria-hidden="true" />
          <p>Drop an image here, paste from the clipboard, or choose a file.</p>
          <button type="button" class="btn" @click="pickFile">Choose image</button>
        </div>
      </div>

      <div v-if="mode === 'crop' && pendingCrop" class="crop-actions">
        <button type="button" class="btn" @click="applyCrop">Apply crop</button>
        <button type="button" class="btn" @click="cancelCrop">Cancel</button>
      </div>

      <div class="export-bar">
        <label class="export-field">
          Format
          <Select
            :model-value="format"
            :options="formatOptions"
            label="Export format"
            @update:model-value="onFormatChange"
          />
        </label>
        <label v-if="format !== 'png'" class="export-field">
          Quality {{ Math.round(quality * 100) }}%
          <input v-model.number="quality" type="range" min="0.1" max="1" step="0.05" />
        </label>
        <button
          type="button"
          class="btn"
          :disabled="!source || exporting"
          @click="exportImage"
        >
          <Download :size="15" aria-hidden="true" />
          {{ exporting ? 'Exporting…' : 'Export' }}
        </button>
        <button type="button" class="btn" :disabled="!source" @click="resetImage">
          <RotateCcw :size="15" aria-hidden="true" />
          Reset
        </button>
      </div>

      <p class="hint">
        Tip: <kbd>⌘Z</kbd> undo · <kbd>⌘⇧Z</kbd> redo · <kbd>Delete</kbd> removes the selection.
        Images stay in your browser — nothing is uploaded.
      </p>
    </div>
  </div>
</template>

<style scoped>
.annotator {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.panel-section:first-child {
  padding-top: 0;
  border-top: none;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.mode-btn {
  justify-content: flex-start;
  padding: 7px 8px;
  font-size: 12px;
}

.mode-btn.active {
  border-color: var(--accent);
  background: var(--surface-2);
  color: var(--accent);
}

.history-row {
  display: flex;
  gap: 8px;
}

.history-row .btn {
  flex: 1;
  justify-content: center;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.meta {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.error {
  margin: 0;
  font-size: 12px;
  color: var(--accent);
}

.color {
  width: 100%;
  height: 34px;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}

.workspace {
  min-width: 0;
}

.stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  padding: 12px;
  overflow: auto;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  background: var(--surface-2);
}

.stage.dragging {
  border-color: var(--accent);
  background: var(--surface);
}

.canvas {
  display: block;
  max-width: 100%;
  border-radius: 4px;
  touch-action: none;
  cursor: crosshair;
}

.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--muted);
}

.dropzone p {
  margin: 0;
  max-width: 320px;
}

.crop-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.export-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 12px;
  margin-top: 12px;
}

.export-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
}

.export-field :deep(.select) {
  width: auto;
  min-width: 110px;
  padding: 7px 10px;
}

.export-field input[type='range'] {
  width: 120px;
}

.hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--muted);
}

.delete-btn {
  align-self: flex-start;
  font-size: 12px;
  padding: 6px 10px;
}

@media (max-width: 760px) {
  .annotator {
    grid-template-columns: minmax(0, 1fr);
  }

  .stage {
    min-height: 220px;
  }
}
</style>
