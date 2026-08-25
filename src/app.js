import { filterReminders, getSummary, localDateKey, nextOccurrence, toDateTime, validateReminder } from './reminders.js';

const STORAGE_KEY = 'recordatorios.v1';
const $ = (selector) => document.querySelector(selector);
const state = { items: loadItems(), filter: 'pending', query: '' };
const els = {
  list: $('#reminderList'), empty: $('#emptyState'), dialog: $('#reminderDialog'), form: $('#reminderForm'),
  id: $('#reminderId'), title: $('#titleInput'), notes: $('#notesInput'), date: $('#dateInput'), time: $('#timeInput'),
  priority: $('#priorityInput'), repeat: $('#repeatInput'), error: $('#formError'), dialogTitle: $('#dialogTitle'), toast: $('#toast')
};

function loadItems() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function saveItems() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items)); }
function escapeHtml(value = '') { const node = document.createElement('span'); node.textContent = value; return node.innerHTML; }
function formatDue(item) {
  const due = toDateTime(item);
  const date = new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }).format(due);
  const time = new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit' }).format(due);
  return `${date} · ${time}`;
}
function repeatLabel(value) { return ({ daily: 'Cada día', weekly: 'Cada semana', monthly: 'Cada mes' })[value] || ''; }
function showToast(message) { els.toast.textContent = message; els.toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 2400); }

function render() {
  const visible = filterReminders(state.items, state.filter, state.query);
  const summary = getSummary(state.items);
  $('#pendingCount').textContent = summary.pending; $('#todayCount').textContent = summary.today; $('#doneCount').textContent = summary.done;
  els.empty.hidden = visible.length > 0;
  els.list.innerHTML = visible.map((item) => `
    <article class="reminder ${item.completed ? 'completed' : ''}" data-id="${item.id}">
      <button class="check" data-action="toggle" aria-label="${item.completed ? 'Marcar pendiente' : 'Completar'}">${item.completed ? '✓' : ''}</button>
      <div class="reminder-content">
        <div class="reminder-title"><h3>${escapeHtml(item.title)}</h3><span class="priority ${item.priority}">${({ high: 'Alta', medium: 'Media', low: 'Baja' })[item.priority]}</span></div>
        ${item.notes ? `<p>${escapeHtml(item.notes)}</p>` : ''}
        <div class="meta"><span>◷ ${formatDue(item)}</span>${item.repeat !== 'none' ? `<span>↻ ${repeatLabel(item.repeat)}</span>` : ''}</div>
      </div>
      <div class="item-actions"><button data-action="edit" aria-label="Editar">✎</button><button data-action="delete" aria-label="Eliminar">⌫</button></div>
    </article>`).join('');
}

function openForm(item) {
  els.form.reset(); els.error.textContent = ''; els.id.value = item?.id || ''; els.dialogTitle.textContent = item ? 'Editar recordatorio' : 'Nuevo recordatorio';
  const defaultTime = new Date(Date.now() + 3600000); defaultTime.setMinutes(Math.ceil(defaultTime.getMinutes() / 5) * 5, 0, 0);
  els.title.value = item?.title || ''; els.notes.value = item?.notes || ''; els.date.value = item?.date || localDateKey(defaultTime);
  els.time.value = item?.time || `${String(defaultTime.getHours()).padStart(2, '0')}:${String(defaultTime.getMinutes()).padStart(2, '0')}`;
  els.priority.value = item?.priority || 'medium'; els.repeat.value = item?.repeat || 'none'; els.dialog.showModal(); setTimeout(() => els.title.focus(), 50);
}

async function scheduleNotification(item) {
  const at = toDateTime(item); if (at <= new Date() || item.completed) return;
  try {
    const cap = globalThis.Capacitor;
    if (cap?.isNativePlatform?.()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display === 'granted') await LocalNotifications.schedule({ notifications: [{ id: hashId(item.id), title: item.title, body: item.notes || 'Tienes un recordatorio pendiente', schedule: { at }, extra: { reminderId: item.id } }] });
    }
  } catch (error) { console.warn('No se pudo programar la notificación', error); }
}
function hashId(value) { return [...value].reduce((hash, char) => ((hash * 31 + char.charCodeAt(0)) | 0), 7) & 0x7fffffff; }
async function cancelNotification(item) {
  try { if (globalThis.Capacitor?.isNativePlatform?.()) { const { LocalNotifications } = await import('@capacitor/local-notifications'); await LocalNotifications.cancel({ notifications: [{ id: hashId(item.id) }] }); } } catch {}
}

els.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const item = { id: els.id.value || crypto.randomUUID(), title: els.title.value.trim(), notes: els.notes.value.trim(), date: els.date.value, time: els.time.value, priority: els.priority.value, repeat: els.repeat.value, completed: false, createdAt: new Date().toISOString() };
  const error = validateReminder({ ...item, id: els.id.value }); if (error) { els.error.textContent = error; return; }
  const index = state.items.findIndex((entry) => entry.id === item.id); if (index >= 0) { await cancelNotification(state.items[index]); item.completed = state.items[index].completed; item.createdAt = state.items[index].createdAt; state.items[index] = item; } else state.items.push(item);
  saveItems(); await scheduleNotification(item); els.dialog.close(); render(); showToast(index >= 0 ? 'Recordatorio actualizado' : 'Recordatorio guardado');
});

els.list.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]'); if (!button) return;
  const item = state.items.find((entry) => entry.id === button.closest('[data-id]').dataset.id); if (!item) return;
  if (button.dataset.action === 'edit') return openForm(item);
  if (button.dataset.action === 'delete') { if (!confirm(`¿Eliminar “${item.title}”?`)) return; await cancelNotification(item); state.items = state.items.filter((entry) => entry.id !== item.id); showToast('Recordatorio eliminado'); }
  if (button.dataset.action === 'toggle') { item.completed = !item.completed; if (item.completed) { await cancelNotification(item); if (item.repeat !== 'none') { const next = nextOccurrence(item); state.items.push(next); await scheduleNotification(next); } } else await scheduleNotification(item); }
  saveItems(); render();
});

$('#addButton').addEventListener('click', () => openForm()); $('#closeDialog').addEventListener('click', () => els.dialog.close()); $('#cancelButton').addEventListener('click', () => els.dialog.close());
$('#searchInput').addEventListener('input', (event) => { state.query = event.target.value; render(); });
document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => { document.querySelector('.filter.active').classList.remove('active'); button.classList.add('active'); state.filter = button.dataset.filter; render(); }));
$('#themeButton').addEventListener('click', () => { const dark = document.documentElement.classList.toggle('dark'); localStorage.setItem('recordatorios.theme', dark ? 'dark' : 'light'); });
if (localStorage.getItem('recordatorios.theme') === 'dark' || (!localStorage.getItem('recordatorios.theme') && matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');
if ('serviceWorker' in navigator && !globalThis.Capacitor?.isNativePlatform?.()) navigator.serviceWorker.register('./sw.js');
render();
