const taskInput       = document.getElementById('taskInput');
const dueDateInput    = document.getElementById('dueDate');
const prioritySelect  = document.getElementById('prioritySelect');
const categorySelect  = document.getElementById('categorySelect');
const addBtn          = document.getElementById('addBtn');
const taskList        = document.getElementById('taskList');
const taskCount       = document.getElementById('taskCount');
const searchInput     = document.getElementById('searchInput');
const clearCompleted  = document.getElementById('clearCompleted');
const themeToggle     = document.getElementById('themeToggle');
const iconMoon        = document.getElementById('iconMoon');
const iconSun         = document.getElementById('iconSun');

const statusBtns   = document.querySelectorAll('#statusFilters button');
const priorityBtns = document.querySelectorAll('#priorityFilters button');
const categoryBtns = document.querySelectorAll('#categoryFilters button');

// SVG icons used inside task cards (inline so no img src needed)
const ICONS = {
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  alert:    `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  tag:      `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  close:    `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// ── Helpers ───────────────────────────────────────────────
function formatDueDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

function isOverdue(task) {
  if (!task.dueDate || task.completed) return false;
  return new Date(task.dueDate) < new Date();
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, m =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])
  );
}

function getActiveFilter(groupId) {
  return document.querySelector(`#${groupId} button.active`);
}

// ── Render ────────────────────────────────────────────────
function renderTasks(list) {
  taskList.innerHTML = '';

  if (list.length === 0) {
    taskList.innerHTML = '<li class="empty-state">No tasks here yet</li>';
    updateCount();
    return;
  }

  list.forEach((task, index) => {
    const overdue = isOverdue(task);
    const li = document.createElement('li');
    li.className = [task.completed ? 'completed' : '', overdue ? 'overdue' : ''].filter(Boolean).join(' ');
    li.draggable = true;
    li.dataset.index = index;

    const priorityDot = (task.priority && task.priority !== 'none')
      ? `<span class="p-dot ${task.priority}" title="${task.priority} priority"></span>`
      : '';

    const dueMeta = task.dueDate
      ? `<span class="due-date ${overdue ? 'overdue-label' : ''}">
           ${overdue ? ICONS.alert : ICONS.calendar}
           ${formatDueDate(task.dueDate)}${overdue ? ' · Overdue' : ''}
         </span>`
      : '';

    const catMeta = (task.category && task.category !== 'none')
      ? `<span class="cat-badge">${ICONS.tag} ${task.category}</span>`
      : '';

    li.innerHTML = `
      <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark complete">
      <div class="task-body">
        <div class="task-top">
          ${priorityDot}
          <span class="task-text">${escapeHTML(task.text)}</span>
        </div>
        ${(dueMeta || catMeta) ? `<div class="task-meta">${dueMeta}${catMeta}</div>` : ''}
      </div>
      <button class="delete-btn" aria-label="Delete task">${ICONS.close}</button>
    `;

    li.querySelector('input[type=checkbox]').addEventListener('change', () => {
      const real = tasks.indexOf(task);
      tasks[real].completed = !tasks[real].completed;
      saveTasks(); renderTasks(getFilteredTasks());
    });

    li.querySelector('.delete-btn').addEventListener('click', () => {
      const real = tasks.indexOf(task);
      tasks.splice(real, 1);
      saveTasks(); renderTasks(getFilteredTasks());
    });

    taskList.appendChild(li);
  });

  updateCount();
}

// ── Filtering ─────────────────────────────────────────────
function getFilteredTasks() {
  const status   = getActiveFilter('statusFilters')?.dataset.filter    || 'all';
  const priority = getActiveFilter('priorityFilters')?.dataset.priority || 'all';
  const category = getActiveFilter('categoryFilters')?.dataset.category || 'all';
  const search   = searchInput.value.toLowerCase().trim();

  return tasks.filter(task => {
    const over = isOverdue(task);
    if (status === 'active'    && (task.completed || over)) return false;
    if (status === 'completed' && !task.completed)          return false;
    if (status === 'overdue'   && !over)                    return false;
    if (priority !== 'all' && task.priority !== priority)   return false;
    if (category !== 'all' && task.category !== category)   return false;
    if (search && !task.text.toLowerCase().includes(search)) return false;
    return true;
  });
}

// ── Persistence ───────────────────────────────────────────
function saveTasks() { localStorage.setItem('tasks', JSON.stringify(tasks)); }

function updateCount() {
  const active = tasks.filter(t => !t.completed).length;
  taskCount.textContent = `${active} task${active !== 1 ? 's' : ''} remaining`;
}

// ── Add task ──────────────────────────────────────────────
function addTask() {
  const text = taskInput.value.trim();
  if (!text) {
    taskInput.classList.add('shake');
    setTimeout(() => taskInput.classList.remove('shake'), 400);
    taskInput.focus();
    return;
  }
  tasks.unshift({
    text,
    completed: false,
    dueDate:   dueDateInput.value   || null,
    priority:  prioritySelect.value || 'none',
    category:  categorySelect.value || 'none',
  });
  taskInput.value = '';
  dueDateInput.value = '';
  prioritySelect.value = 'none';
  categorySelect.value = 'none';
  saveTasks();
  renderTasks(getFilteredTasks());
}

// ── Events ────────────────────────────────────────────────
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); });
searchInput.addEventListener('input', () => renderTasks(getFilteredTasks()));

clearCompleted.addEventListener('click', () => {
  tasks = tasks.filter(t => !t.completed);
  saveTasks(); renderTasks(getFilteredTasks());
});

function setupFilterGroup(buttons, renderFn) {
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderFn();
    });
  });
}
setupFilterGroup(statusBtns,   () => renderTasks(getFilteredTasks()));
setupFilterGroup(priorityBtns, () => renderTasks(getFilteredTasks()));
setupFilterGroup(categoryBtns, () => renderTasks(getFilteredTasks()));

// Theme toggle
if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light-mode');
  iconMoon.style.display = 'none';
  iconSun.style.display  = '';
}
themeToggle.addEventListener('click', () => {
  const isLight = document.body.classList.toggle('light-mode');
  iconMoon.style.display = isLight ? 'none' : '';
  iconSun.style.display  = isLight ? ''     : 'none';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
});

// Drag & drop
let dragSrcIndex = null;
taskList.addEventListener('dragstart', e => {
  const li = e.target.closest('li');
  if (!li || li.classList.contains('empty-state')) return;
  dragSrcIndex = parseInt(li.dataset.index);
  setTimeout(() => li.classList.add('dragging'), 0);
});
taskList.addEventListener('dragend', () => {
  document.querySelectorAll('#taskList li').forEach(l => l.classList.remove('dragging', 'drag-over'));
});
taskList.addEventListener('dragover', e => {
  e.preventDefault();
  const li = e.target.closest('li');
  document.querySelectorAll('#taskList li').forEach(l => l.classList.remove('drag-over'));
  if (li && !li.classList.contains('empty-state')) li.classList.add('drag-over');
});
taskList.addEventListener('drop', e => {
  e.preventDefault();
  const li = e.target.closest('li');
  if (!li || dragSrcIndex === null) return;
  const toIndex = parseInt(li.dataset.index);
  if (dragSrcIndex !== toIndex) {
    const filtered = getFilteredTasks();
    const sI = tasks.indexOf(filtered[dragSrcIndex]);
    const tI = tasks.indexOf(filtered[toIndex]);
    const [moved] = tasks.splice(sI, 1);
    tasks.splice(tI, 0, moved);
    saveTasks(); renderTasks(getFilteredTasks());
  }
  dragSrcIndex = null;
});

// Init
renderTasks(getFilteredTasks());
setInterval(() => renderTasks(getFilteredTasks()), 30000);
