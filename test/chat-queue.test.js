import test from 'node:test';
import assert from 'node:assert/strict';
import { historyThrough, isRetryableDeliveryError, nextPendingMessage, normalizeChat, queuedMessage } from '../src/chat-queue.js';

test('crea mensajes pendientes antes de enviarlos', () => {
  assert.deepEqual(queuedMessage('Agenda estudiar', 'm1', '2026-09-01T10:00:00Z'), { id:'m1', role:'user', content:'Agenda estudiar', status:'pending', createdAt:'2026-09-01T10:00:00Z' });
});

test('recupera como pendiente un envío interrumpido al cerrar la app', () => {
  assert.equal(normalizeChat([{ id:'m1', role:'user', content:'Hola', status:'sending' }])[0].status, 'pending');
});

test('procesa la cola en orden y limita el historial al mensaje actual', () => {
  const chat=[{id:'m1',role:'user',content:'Primero',status:'pending'},{id:'m2',role:'user',content:'Después',status:'pending'}];
  assert.equal(nextPendingMessage(chat).id,'m1');
  assert.deepEqual(historyThrough(chat,'m1'),[{role:'user',content:'Primero'}]);
});

test('distingue errores de red de errores permanentes', () => {
  assert.equal(isRetryableDeliveryError(new TypeError('Failed to fetch'),true),true);
  assert.equal(isRetryableDeliveryError(new Error('Llave inválida'),true),false);
  assert.equal(isRetryableDeliveryError(new Error('Sin conexión'),false),true);
});
