export function queuedMessage(content, id = crypto.randomUUID(), createdAt = new Date().toISOString()) {
  return { id, role: 'user', content, status: 'pending', createdAt };
}

export function normalizeChat(messages = []) {
  return messages.map(message => {
    if (message.role !== 'user') return message;
    if (message.status === 'sending') return { ...message, status: 'pending' };
    return { ...message, status: message.status || 'sent' };
  });
}

export function nextPendingMessage(messages = []) {
  return messages.find(message => message.role === 'user' && message.status === 'pending') || null;
}

export function historyThrough(messages, messageId, limit = 20) {
  const index = messages.findIndex(message => message.id === messageId);
  if (index < 0) return [];
  return messages.slice(0, index + 1)
    .filter(message => message.role === 'user' || message.role === 'assistant')
    .slice(-limit)
    .map(({ role, content }) => ({ role, content }));
}

export function isRetryableDeliveryError(error, online = true) {
  if (!online) return true;
  if (error?.retryable === true) return true;
  return error instanceof TypeError || /failed to fetch|network|conexi[oó]n|timeout|servidor no disponible/i.test(error?.message || '');
}
