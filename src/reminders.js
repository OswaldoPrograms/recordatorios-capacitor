export const PRIORITIES = { high: 0, medium: 1, low: 2 };

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toDateTime(reminder) {
  return new Date(`${reminder.date}T${reminder.time}:00`);
}

export function validateReminder(reminder, now = new Date()) {
  if (!reminder.title?.trim()) return 'Escribe un título.';
  if (!reminder.date || !reminder.time) return 'Selecciona fecha y hora.';
  const due = toDateTime(reminder);
  if (Number.isNaN(due.getTime())) return 'La fecha no es válida.';
  if (!reminder.id && due.getTime() < now.getTime() - 60000) return 'Elige una fecha futura.';
  return '';
}

export function nextOccurrence(reminder) {
  const date = toDateTime(reminder);
  if (reminder.repeat === 'daily') date.setDate(date.getDate() + 1);
  if (reminder.repeat === 'weekly') date.setDate(date.getDate() + 7);
  if (reminder.repeat === 'monthly') date.setMonth(date.getMonth() + 1);
  return { ...reminder, id: crypto.randomUUID(), completed: false, date: localDateKey(date) };
}

export function filterReminders(items, filter, query = '', today = localDateKey()) {
  const needle = query.trim().toLocaleLowerCase('es');
  return items.filter((item) => {
    const textMatches = !needle || `${item.title} ${item.notes || ''}`.toLocaleLowerCase('es').includes(needle);
    const stateMatches = filter === 'all' ||
      (filter === 'pending' && !item.completed) ||
      (filter === 'done' && item.completed) ||
      (filter === 'today' && !item.completed && item.date === today);
    return textMatches && stateMatches;
  }).sort((a, b) => {
    if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
    const time = toDateTime(a) - toDateTime(b);
    return time || PRIORITIES[a.priority] - PRIORITIES[b.priority];
  });
}

export function getSummary(items, today = localDateKey()) {
  return {
    pending: items.filter((item) => !item.completed).length,
    today: items.filter((item) => !item.completed && item.date === today).length,
    done: items.filter((item) => item.completed).length
  };
}
