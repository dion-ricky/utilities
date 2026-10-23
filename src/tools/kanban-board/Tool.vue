<script setup lang="ts">
import { ChevronLeft, ChevronRight, GripVertical, Trash2 } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useLocalStorage } from '../../composables/useLocalStorage'
import {
  addTask,
  clearDone,
  countByStatus,
  type KanbanStatus,
  type KanbanTask,
  moveTask,
  normalizeTasks,
  removeTask,
  STATUS_LABELS,
  STATUSES,
  STORAGE_KEY,
  tasksByStatus,
} from './logic'

const tasks = useLocalStorage<KanbanTask[]>(STORAGE_KEY, [])
tasks.value = normalizeTasks(tasks.value)

const draft = ref('')
const newTaskInput = ref<HTMLInputElement | null>(null)
const dragId = ref<string | null>(null)
const dropTarget = ref<{ status: KanbanStatus; beforeId: string | null } | null>(null)

const grouped = computed(() => tasksByStatus(tasks.value))
const counts = computed(() => countByStatus(tasks.value))
const columns = STATUSES.map((status) => ({ status, label: STATUS_LABELS[status] }))

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `t-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function add() {
  const next = addTask(tasks.value, draft.value, 'todo', newId(), Date.now())
  if (next === tasks.value) {
    newTaskInput.value?.focus()
    return
  }
  tasks.value = next
  draft.value = ''
  newTaskInput.value?.focus()
}

function columnIndex(status: KanbanStatus): number {
  return STATUSES.indexOf(status)
}

function applyMove(id: string, status: KanbanStatus, beforeId: string | null) {
  const next = moveTask(tasks.value, id, status, beforeId, Date.now())
  if (next !== tasks.value) tasks.value = next
}

/** Move a task to the adjacent column, appended. */
function moveToColumn(task: KanbanTask, offset: -1 | 1) {
  const status = STATUSES[columnIndex(task.status) + offset]
  if (!status) return
  applyMove(task.id, status, null)
}

/** Keyboard reorder fallback for pointer-free movement. */
function keyboardMove(task: KanbanTask, direction: 'up' | 'down' | 'left' | 'right') {
  const column = grouped.value[task.status]
  const index = column.findIndex((entry) => entry.id === task.id)
  if (index === -1) return

  if (direction === 'left' || direction === 'right') {
    moveToColumn(task, direction === 'right' ? 1 : -1)
    return
  }

  if (direction === 'up') {
    const previous = column[index - 1]
    if (!previous) return
    applyMove(task.id, task.status, previous.id)
    return
  }

  const following = column[index + 2]
  applyMove(task.id, task.status, following?.id ?? null)
}

function removeOne(id: string) {
  const next = removeTask(tasks.value, id)
  if (next !== tasks.value) tasks.value = next
}

function clearDoneTasks() {
  const next = clearDone(tasks.value)
  if (next !== tasks.value) tasks.value = next
}

function resetDrag() {
  dragId.value = null
  dropTarget.value = null
}

/** Start a drag from the handle only, so text selection keeps working. */
function onHandleDragStart(event: DragEvent, task: KanbanTask) {
  const card = (event.currentTarget as HTMLElement).closest('li')
  if (card) event.dataTransfer?.setDragImage(card, 16, 16)
  event.dataTransfer?.setData('text/plain', task.id)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
  dragId.value = task.id
  dropTarget.value = null
}

/** Highlight the card half the pointer is over, or the end of the column. */
function onCardDragOver(event: DragEvent, task: KanbanTask) {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const column = grouped.value[task.status]
  const index = column.findIndex((entry) => entry.id === task.id)
  const following = index === -1 ? undefined : column[index + 1]
  dropTarget.value = {
    status: task.status,
    beforeId: event.clientY < rect.top + rect.height / 2 ? task.id : (following?.id ?? null),
  }
}

/** Column body hover means "append to this column". */
function onColumnDragOver(event: DragEvent, status: KanbanStatus) {
  if (dragId.value === null) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  dropTarget.value = { status, beforeId: null }
}

function onColumnDragLeave(event: DragEvent, status: KanbanStatus) {
  const column = event.currentTarget as HTMLElement
  if (event.relatedTarget instanceof Node && column.contains(event.relatedTarget)) return
  if (dropTarget.value?.status === status) dropTarget.value = null
}

function onDrop(event: DragEvent, status: KanbanStatus) {
  event.preventDefault()
  const id = dragId.value
  if (id !== null) applyMove(id, status, dropTarget.value?.beforeId ?? null)
  resetDrag()
}
</script>

<template>
  <div class="kanban">
    <form class="kanban-add" @submit.prevent="add">
      <input
        ref="newTaskInput"
        v-model="draft"
        type="text"
        class="input"
        maxlength="500"
        aria-label="New task"
        placeholder="What needs doing?"
      />
      <button type="submit" class="btn">Add</button>
    </form>

    <p v-if="tasks.length === 0" class="kanban-hint">
      Add a task above, then drag cards between columns.
    </p>

    <div class="kanban-board">
      <section
        v-for="column in columns"
        :key="column.status"
        class="kanban-column"
        :class="{ active: dropTarget?.status === column.status }"
        :aria-label="`${column.label} column`"
        @dragover="onColumnDragOver($event, column.status)"
        @dragleave="onColumnDragLeave($event, column.status)"
        @drop="onDrop($event, column.status)"
      >
        <header class="kanban-column-head">
          <h2 class="kanban-column-title">{{ column.label }} · {{ counts[column.status] }}</h2>
          <button
            v-if="column.status === 'done' && counts.done > 0"
            type="button"
            class="btn kanban-clear"
            @click="clearDoneTasks"
          >
            <Trash2 :size="14" aria-hidden="true" />
            Clear done
          </button>
        </header>

        <ul class="kanban-list" :aria-label="`${column.label} tasks`">
          <li
            v-for="(task, index) in grouped[column.status]"
            :key="task.id"
            class="kanban-card"
            :data-task-id="task.id"
            :class="{
              dragging: dragId === task.id,
              'drop-before': dropTarget?.status === column.status && dropTarget.beforeId === task.id,
              'drop-after':
                dropTarget?.status === column.status &&
                dropTarget.beforeId === null &&
                index === grouped[column.status].length - 1,
            }"
            @dragover.stop="onCardDragOver($event, task)"
            @drop.stop="onDrop($event, task.status)"
          >
            <button
              type="button"
              class="kanban-handle"
              draggable="true"
              aria-label="Reorder or move task"
              title="Drag to reorder or move, or press Arrow Up / Arrow Down to reorder and Arrow Left / Arrow Right to change column"
              @dragstart="onHandleDragStart($event, task)"
              @dragend="resetDrag"
              @keydown.up.prevent="keyboardMove(task, 'up')"
              @keydown.down.prevent="keyboardMove(task, 'down')"
              @keydown.left.prevent="keyboardMove(task, 'left')"
              @keydown.right.prevent="keyboardMove(task, 'right')"
            >
              <GripVertical :size="16" aria-hidden="true" />
            </button>

            <span class="kanban-text">{{ task.text }}</span>

            <div class="kanban-actions">
              <button
                type="button"
                class="btn kanban-action"
                :disabled="column.status === 'todo'"
                aria-label="Move to previous column"
                @click="moveToColumn(task, -1)"
              >
                <ChevronLeft :size="14" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="btn kanban-action"
                :disabled="column.status === 'done'"
                aria-label="Move to next column"
                @click="moveToColumn(task, 1)"
              >
                <ChevronRight :size="14" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="btn kanban-action"
                aria-label="Delete task"
                @click="removeOne(task.id)"
              >
                <Trash2 :size="14" aria-hidden="true" />
              </button>
            </div>
          </li>
        </ul>

        <p v-if="grouped[column.status].length === 0" class="kanban-empty">No tasks</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.kanban {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kanban-add {
  display: flex;
  gap: 8px;
}

.kanban-add .input {
  flex: 1;
  min-width: 0;
}

.kanban-hint {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

.kanban-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 120px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface-2);
}

.kanban-column.active {
  border-color: var(--accent);
}

.kanban-column-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 28px;
}

.kanban-column-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}

.kanban-clear {
  padding: 2px 8px;
  font-size: 12px;
}

.kanban-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kanban-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.kanban-card.dragging {
  opacity: 0.5;
}

.kanban-card.drop-before {
  box-shadow: inset 0 2px 0 var(--accent);
}

.kanban-card.drop-after {
  box-shadow: inset 0 -2px 0 var(--accent);
}

.kanban-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--muted);
  cursor: grab;
}

.kanban-handle:hover {
  color: var(--fg);
  background: var(--surface-2);
}

.kanban-handle:active {
  cursor: grabbing;
}

.kanban-handle:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.kanban-text {
  flex: 1;
  min-width: 0;
  line-height: 20px;
  overflow-wrap: anywhere;
}

.kanban-actions {
  display: flex;
  gap: 4px;
}

.kanban-action {
  padding: 2px 6px;
}

.kanban-empty {
  margin: 0;
  padding: 8px 0;
  text-align: center;
  font-size: 12px;
  color: var(--muted);
}

@media (max-width: 760px) {
  .kanban-board {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
