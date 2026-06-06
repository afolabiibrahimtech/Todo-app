const taskInput = document.getElementById('taskInput');
const dueDateInput = document.getElementById('dueDate');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const searchInput = document.getElementById('searchInput');
const clearCompleted = document.getElementById('clearCompleted');
const themeToggle = document.getElementById('themeToggle');
const filterBtns = document.querySelectorAll('.filters button');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function formatDueDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit' 
  });
}

function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function renderTasks(filteredTasks) {
  taskList.innerHTML = '';
  
  filteredTasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = task.completed ? 'completed' : '';
    if (!task.completed && isOverdue(task.dueDate)) li.classList.add('overdue');
    li.draggable = true;
    li.dataset.index = index;

    li.innerHTML = `
      <input type="checkbox" ${task.completed ? 'checked' : ''}>
      <div class="task-content">
        <span>${task.text}</span>
        ${task.dueDate ? `<small class="due-date">📅 ${formatDueDate(task.dueDate)}</small>` : ''}
      </div>
      <button class="delete-btn">Delete</button>
    `;

    li.querySelector('input').addEventListener('change', () => {
      tasks[index].completed = !tasks[index].completed;
      saveTasks();
      renderTasks(getFilteredTasks());
    });

    li.querySelector('.delete-btn').addEventListener('click', () => {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks(getFilteredTasks());
    });

    taskList.appendChild(li);
  });

  updateCount();
}

function getFilteredTasks() {
  const activeFilter = document.querySelector('.filters button.active').dataset.filter;
  const searchTerm = searchInput.value.toLowerCase();

  return tasks.filter(task => {
    const matchesSearch = task.text.toLowerCase().includes(searchTerm);
    if (activeFilter === 'active') return !task.completed && matchesSearch;
    if (activeFilter === 'completed') return task.completed && matchesSearch;
    return matchesSearch;
  });
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function updateCount() {
  taskCount.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
}

function checkOverdueTasks() {
  const now = new Date();
  let changed = false;

  tasks.forEach(task => {
    if (task.dueDate && !task.completed) {
      const due = new Date(task.dueDate);
      if (due < now) {
        task.completed = true;
        changed = true;
      }
    }
  });

  if (changed) {
    saveTasks();
    renderTasks(getFilteredTasks());
  }
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  tasks.push({
    text: text,
    completed: false,
    dueDate: dueDateInput.value || null
  });

  taskInput.value = '';
  dueDateInput.value = '';
  saveTasks();
  renderTasks(getFilteredTasks());
}

// Event Listeners
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') addTask();
});

searchInput.addEventListener('input', () => renderTasks(getFilteredTasks()));

clearCompleted.addEventListener('click', () => {
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  renderTasks(getFilteredTasks());
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTasks(getFilteredTasks());
  });
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  themeToggle.textContent = document.body.classList.contains('light-mode') ? '☀️' : '🌙';
});

// Drag and Drop
taskList.addEventListener('dragstart', e => {
  if (e.target.tagName === 'LI') {
    e.dataTransfer.setData('text/plain', e.target.dataset.index);
  }
});

taskList.addEventListener('dragover', e => e.preventDefault());

taskList.addEventListener('drop', e => {
  e.preventDefault();
  const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
  const toElement = e.target.closest('li');
  if (!toElement) return;
  const toIndex = parseInt(toElement.dataset.index);
  
  if (fromIndex !== toIndex) {
    const [movedTask] = tasks.splice(fromIndex, 1);
    tasks.splice(toIndex, 0, movedTask);
    saveTasks();
    renderTasks(getFilteredTasks());
  }
});

// Initialize
renderTasks(getFilteredTasks());
checkOverdueTasks();
setInterval(checkOverdueTasks, 30000);