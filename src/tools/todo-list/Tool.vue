<script setup lang="ts">
import { ChevronDown, GripVertical, Trash2 } from '@lucide/vue'
import { type ComponentPublicInstance, computed, nextTick, ref } from 'vue'
import { useLocalStorage } from '../../composables/useLocalStorage'
import {
  addTodo,
  COMPLETED_OPEN_STORAGE_KEY,
  clearCompleted,
  countTodos,
  normalizeTodos,
  removeTodo,
  reorderTodos,
  STORAGE_KEY,
  splitTodos,
  type TodoFilter,
  type TodoItem,
  toggleTodo,
  updateTodoText,
} from './logic'

const todos = useLocalStorage<TodoItem[]>(STORAGE_KEY, [])
todos.value = normalizeTodos(todos.value)

const completedOpen = useLocalStorage<boolean>(COMPLETED_OPEN_STORAGE_KEY, true)

const draft = ref('')
const filter = ref<TodoFilter>('all')
const editingId = ref<string | null>(null)
const editingText = ref('')
const editingOriginal = ref<string | null>(null)
const newTodoInput = ref<HTMLInputElement | null>(null)
const editInput = ref<HTMLInputElement | null>(null)

const filters: { value: TodoFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

const counts = computed(() => countTodos(todos.value))
const sections = computed(() => splitTodos(todos.value))
const activeVisible = computed(() => (filter.value === 'completed' ? [] : sections.value.active))
const completedVisible = computed(() => {
  if (filter.value === 'active') return []
  if (filter.value === 'completed') return sections.value.completed
  return completedOpen.value ? sections.value.completed : []
})
const hasVisibleRows = computed(
  () => activeVisible.value.length + completedVisible.value.length > 0,
)
const showEmpty = computed(
  () => counts.value.total === 0 || (filter.value !== 'all' && !hasVisibleRows.value),
)

const emptyMessage = computed(() => {
  if (counts.value.total === 0) return 'No tasks yet. Add one above.'
  if (filter.value === 'active') return 'No active tasks. Nice work!'
  if (filter.value === 'completed') return 'No completed tasks yet.'
  return 'No tasks to show.'
})

function filterCount(value: TodoFilter): number {
  if (value === 'active') return counts.value.active
  if (value === 'completed') return counts.value.completed
  return counts.value.total
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `t-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function add() {
  const next = addTodo(todos.value, draft.value, newId(), Date.now())
  if (next === todos.value) {
    newTodoInput.value?.focus()
    return
  }
  todos.value = next
  draft.value = ''
  newTodoInput.value?.focus()
}

function toggle(id: string) {
  todos.value = toggleTodo(todos.value, id, Date.now())
}

function startEdit(todo: TodoItem) {
  if (editingId.value === todo.id) {
    editInput.value?.focus()
    editInput.value?.select()
    return
  }
  editingId.value = todo.id
  editingText.value = todo.text
  editingOriginal.value = todo.text
  nextTick(() => {
    editInput.value?.focus()
    editInput.value?.select()
  })
}

function bindEditInput(el: Element | ComponentPublicInstance | null) {
  editInput.value = el instanceof HTMLInputElement ? el : null
}

/** Leave edit mode, keeping the text already committed by `onEditInput`. */
function finishEdit() {
  editingId.value = null
  editingText.value = ''
  editingOriginal.value = null
}

/** Commit every keystroke so route changes and reloads cannot drop the draft. */
function onEditInput(event: Event) {
  const id = editingId.value
  if (id === null) return
  const text = (event.target as HTMLInputElement).value
  editingText.value = text
  const next = updateTodoText(todos.value, id, text)
  if (next !== todos.value) todos.value = next
}

/** Exit edit mode only for the row that is still being edited. */
function onEditBlur(id: string) {
  if (editingId.value === id) finishEdit()
}

function cancelEdit() {
  const id = editingId.value
  if (id !== null && editingOriginal.value !== null) {
    const next = updateTodoText(todos.value, id, editingOriginal.value)
    if (next !== todos.value) todos.value = next
  }
  finishEdit()
}

function remove(id: string) {
  const next = removeTodo(todos.value, id)
  if (next !== todos.value) todos.value = next
  if (editingId.value === id) finishEdit()
}

function clearDone() {
  todos.value = clearCompleted(todos.value)
  if (editingId.value !== null && !todos.value.some((todo) => todo.id === editingId.value)) {
    finishEdit()
  }
}

const dragId = ref<string | null>(null)
const dropTarget = ref<{ id: string; place: 'before' | 'after' } | null>(null)

/** Start a drag from the handle only, so text selection and editing keep working. */
function onHandleDragStart(event: DragEvent, todo: TodoItem) {
  const row = (event.currentTarget as HTMLElement).closest('li')
  if (row) event.dataTransfer?.setDragImage(row, 16, 16)
  event.dataTransfer?.setData('text/plain', todo.id)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
  dragId.value = todo.id
}

function onDragEnd() {
  dragId.value = null
  dropTarget.value = null
}

/** Highlight the half of the row the pointer is over; cross-section targets are ignored. */
function onRowDragOver(event: DragEvent, todo: TodoItem) {
  const source = todos.value.find((item) => item.id === dragId.value)
  if (!source || source.id === todo.id || source.done !== todo.done) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  dropTarget.value = {
    id: todo.id,
    place: event.clientY < rect.top + rect.height / 2 ? 'before' : 'after',
  }
}

function onRowDragLeave(event: DragEvent, id: string) {
  const row = event.currentTarget as HTMLElement
  if (event.relatedTarget instanceof Node && row.contains(event.relatedTarget)) return
  if (dropTarget.value?.id === id) dropTarget.value = null
}

function onRowDrop(event: DragEvent, todo: TodoItem) {
  event.preventDefault()
  const sourceId = dragId.value
  if (sourceId === null) return
  const source = todos.value.find((item) => item.id === sourceId)
  if (!source || source.id === todo.id || source.done !== todo.done) {
    onDragEnd()
    return
  }
  const next = reorderTodos(todos.value, sourceId, todo.id, dropTarget.value?.place ?? 'before')
  if (next !== todos.value) todos.value = next
  onDragEnd()
}

/** Keyboard reorder fallback: move one position inside the todo's own section. */
function moveWithinSection(todo: TodoItem, direction: -1 | 1) {
  const section = todo.done ? sections.value.completed : sections.value.active
  const index = section.findIndex((item) => item.id === todo.id)
  const neighbour = index === -1 ? undefined : section[index + direction]
  if (!neighbour) return
  const next = reorderTodos(
    todos.value,
    todo.id,
    neighbour.id,
    direction === 1 ? 'after' : 'before',
  )
  if (next !== todos.value) todos.value = next
}
</script>

<template>
  <div class="todo">
    <form class="todo-add" @submit.prevent="add">
      <input
        ref="newTodoInput"
        v-model="draft"
        type="text"
        class="input"
        maxlength="500"
        aria-label="New todo"
        placeholder="What needs doing?"
      />
      <button type="submit" class="btn">Add</button>
    </form>

    <div class="todo-toolbar">
      <div class="todo-filters" role="group" aria-label="Filter todos">
        <button
          v-for="option in filters"
          :key="option.value"
          type="button"
          class="btn filter"
          :class="{ active: filter === option.value }"
          :aria-pressed="filter === option.value"
          @click="filter = option.value"
        >
          {{ option.label }} {{ filterCount(option.value) }}
        </button>
      </div>
      <button
        v-if="counts.completed > 0"
        type="button"
        class="btn btn-danger todo-clear"
        @click="clearDone"
      >
        <Trash2 :size="16" aria-hidden="true" />
        Clear completed
      </button>
    </div>

    <p class="todo-summary" aria-live="polite">
      {{ counts.active }} active · {{ counts.completed }} completed · {{ counts.total }} total
    </p>

    <ul v-if="activeVisible.length > 0" class="todo-list">
      <li
        v-for="todo in activeVisible"
        :key="todo.id"
        class="todo-row"
        :class="{
          dragging: dragId === todo.id,
          'drop-before': dropTarget?.id === todo.id && dropTarget.place === 'before',
          'drop-after': dropTarget?.id === todo.id && dropTarget.place === 'after',
        }"
        @dragover="onRowDragOver($event, todo)"
        @dragleave="onRowDragLeave($event, todo.id)"
        @drop="onRowDrop($event, todo)"
      >
        <button
          type="button"
          class="todo-handle"
          draggable="true"
          aria-label="Reorder todo"
          title="Drag to reorder, or press Arrow Up / Arrow Down"
          @dragstart="onHandleDragStart($event, todo)"
          @dragend="onDragEnd"
          @keydown.up.prevent="moveWithinSection(todo, -1)"
          @keydown.down.prevent="moveWithinSection(todo, 1)"
        >
          <GripVertical :size="16" aria-hidden="true" />
        </button>
        <label class="todo-check" @mousedown.prevent>
          <input
            type="checkbox"
            :checked="todo.done"
            aria-label="Toggle todo"
            @change="toggle(todo.id)"
          />
        </label>
        <input
          v-if="editingId === todo.id"
          :ref="bindEditInput"
          :value="editingText"
          type="text"
          class="input todo-edit"
          maxlength="500"
          aria-label="Edit todo text"
          @input="onEditInput"
          @keydown.enter.prevent="finishEdit"
          @keydown.escape.prevent="cancelEdit"
          @blur="onEditBlur(todo.id)"
        />
        <span
          v-else
          class="todo-text"
          :class="{ done: todo.done }"
          @mousedown.prevent
          @dblclick="startEdit(todo)"
        >
          {{ todo.text }}
        </span>
        <div class="todo-actions">
          <button
            type="button"
            class="btn todo-action"
            aria-label="Edit todo"
            @mousedown.prevent
            @click="startEdit(todo)"
          >
            Edit
          </button>
          <button
            type="button"
            class="btn todo-action"
            aria-label="Delete todo"
            @mousedown.prevent
            @click="remove(todo.id)"
          >
            Delete
          </button>
        </div>
      </li>
    </ul>

    <section v-if="filter !== 'active' && counts.completed > 0" class="todo-section">
      <button
        v-if="filter !== 'completed'"
        type="button"
        class="todo-section-head"
        :aria-expanded="completedOpen"
        aria-controls="todo-completed-list"
        @click="completedOpen = !completedOpen"
      >
        <ChevronDown
          :size="16"
          aria-hidden="true"
          class="todo-section-chevron"
          :class="{ collapsed: !completedOpen }"
        />
        Completed {{ counts.completed }}
      </button>
      <ul v-if="completedVisible.length" id="todo-completed-list" class="todo-list">
        <li
          v-for="todo in completedVisible"
          :key="todo.id"
          class="todo-row"
          :class="{
            dragging: dragId === todo.id,
            'drop-before': dropTarget?.id === todo.id && dropTarget.place === 'before',
            'drop-after': dropTarget?.id === todo.id && dropTarget.place === 'after',
          }"
          @dragover="onRowDragOver($event, todo)"
          @dragleave="onRowDragLeave($event, todo.id)"
          @drop="onRowDrop($event, todo)"
        >
          <button
            type="button"
            class="todo-handle"
            draggable="true"
            aria-label="Reorder todo"
            title="Drag to reorder, or press Arrow Up / Arrow Down"
            @dragstart="onHandleDragStart($event, todo)"
            @dragend="onDragEnd"
            @keydown.up.prevent="moveWithinSection(todo, -1)"
            @keydown.down.prevent="moveWithinSection(todo, 1)"
          >
            <GripVertical :size="16" aria-hidden="true" />
          </button>
          <label class="todo-check" @mousedown.prevent>
            <input
              type="checkbox"
              :checked="todo.done"
              aria-label="Toggle todo"
              @change="toggle(todo.id)"
            />
          </label>
          <input
            v-if="editingId === todo.id"
            :ref="bindEditInput"
            :value="editingText"
            type="text"
            class="input todo-edit"
            maxlength="500"
            aria-label="Edit todo text"
            @input="onEditInput"
            @keydown.enter.prevent="finishEdit"
            @keydown.escape.prevent="cancelEdit"
            @blur="onEditBlur(todo.id)"
          />
          <span
            v-else
            class="todo-text"
            :class="{ done: todo.done }"
            @mousedown.prevent
            @dblclick="startEdit(todo)"
          >
            {{ todo.text }}
          </span>
          <div class="todo-actions">
            <button
              type="button"
              class="btn todo-action"
              aria-label="Edit todo"
              @mousedown.prevent
              @click="startEdit(todo)"
            >
              Edit
            </button>
            <button
              type="button"
              class="btn todo-action"
              aria-label="Delete todo"
              @mousedown.prevent
              @click="remove(todo.id)"
            >
              Delete
            </button>
          </div>
        </li>
      </ul>
    </section>

    <p v-if="showEmpty" class="todo-empty">{{ emptyMessage }}</p>
  </div>
</template>

<style scoped>
.todo {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-add {
  display: flex;
  gap: 8px;
}

.todo-add .input {
  flex: 1;
  min-width: 0;
}

.todo-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.todo-filters {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.todo-clear {
  margin-left: auto;
}

.btn-danger {
  color: var(--accent);
  border-color: var(--accent);
}

.btn-danger:hover {
  background: var(--surface-2);
}

.filter.active {
  border-color: var(--accent);
  background: var(--surface-2);
}

.todo-summary {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.todo-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.todo-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.todo-section-head {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 4px 0;
  border: none;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.todo-section-chevron {
  transition: transform 120ms ease;
}

.todo-section-chevron.collapsed {
  transform: rotate(-90deg);
}

.todo-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 54px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.todo-row.dragging {
  opacity: 0.5;
}

.todo-row.drop-before {
  box-shadow: inset 0 2px 0 var(--accent);
}

.todo-row.drop-after {
  box-shadow: inset 0 -2px 0 var(--accent);
}

.todo-handle {
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

.todo-handle:hover {
  color: var(--fg);
  background: var(--surface-2);
}

.todo-handle:active {
  cursor: grabbing;
}

.todo-handle:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.todo-check {
  display: flex;
  align-items: center;
}

.todo-text {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  min-height: 32px;
  padding: 4px 8px;
  border: 1px solid transparent;
  line-height: 20px;
  overflow-wrap: anywhere;
  cursor: text;
}

.todo-text.done {
  text-decoration: line-through;
  color: var(--muted);
}

.todo-edit {
  flex: 1;
  min-width: 0;
  height: 32px;
  padding: 4px 8px;
  border-radius: 8px;
  line-height: 20px;
  font-family: inherit;
  font-size: inherit;
}

.todo-actions {
  display: flex;
  gap: 6px;
}

.todo-action {
  padding: 4px 10px;
  font-size: 13px;
}

.todo-empty {
  margin: 0;
  padding: 24px 0;
  text-align: center;
  font-size: 14px;
  color: var(--muted);
}

@media (max-width: 520px) {
  .todo-add {
    flex-direction: column;
  }
}
</style>
