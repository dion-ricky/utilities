<script setup lang="ts">
import { type ComponentPublicInstance, computed, nextTick, ref } from 'vue'
import { useLocalStorage } from '../../composables/useLocalStorage'
import {
  addTodo,
  clearCompleted,
  countTodos,
  filterTodos,
  normalizeTodos,
  removeTodo,
  STORAGE_KEY,
  type TodoFilter,
  type TodoItem,
  toggleTodo,
  updateTodoText,
} from './logic'

const todos = useLocalStorage<TodoItem[]>(STORAGE_KEY, [])
todos.value = normalizeTodos(todos.value)

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
const visibleTodos = computed(() => filterTodos(todos.value, filter.value))

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
      <button v-if="counts.completed > 0" type="button" class="btn" @click="clearDone">
        Clear completed
      </button>
    </div>

    <p class="todo-summary" aria-live="polite">
      {{ counts.active }} active · {{ counts.completed }} completed · {{ counts.total }} total
    </p>

    <ul v-if="visibleTodos.length > 0" class="todo-list">
      <li v-for="todo in visibleTodos" :key="todo.id" class="todo-row">
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
    <p v-else class="todo-empty">{{ emptyMessage }}</p>
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

.todo-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
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
