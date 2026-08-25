# Recordatorios

Aplicación web progresiva (PWA) de recordatorios, preparada para empaquetarse como APK mediante Capacitor. Funciona sin conexión y guarda los datos localmente en el dispositivo.

## Funciones

- Crear, editar, completar y eliminar recordatorios.
- Fecha, hora, notas, prioridad y repetición diaria, semanal o mensual.
- Búsqueda, filtros y resumen de pendientes.
- Tema claro y oscuro.
- PWA instalable y funcionamiento sin conexión.
- Notificaciones locales al ejecutarse como aplicación Android.

## Probar en navegador

```bash
npm run dev
```

Abre `http://localhost:4173`.

## Preparar Android y generar APK

Requiere Node.js, Android Studio y un JDK compatible.

```bash
npm install
npm run build
npm run cap:add:android
npm run cap:sync
npm run cap:open
```

En Android Studio selecciona **Build > Build APK(s)**. Después de modificar la web basta ejecutar `npm run cap:sync` antes de volver a compilar.

## Pruebas

```bash
npm test
```
