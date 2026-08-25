# Recordatorios

Aplicación web progresiva (PWA) de recordatorios, preparada para empaquetarse como APK mediante Capacitor. Funciona sin conexión y guarda los datos localmente en el dispositivo.

## Funciones

- Crear, editar, completar y eliminar recordatorios.
- Fecha, hora, notas, prioridad y repetición diaria, semanal o mensual.
- Búsqueda, filtros y resumen de pendientes.
- Tema claro y oscuro.
- PWA instalable y funcionamiento sin conexión.
- Notificaciones locales al ejecutarse como aplicación Android.
- Calendario mensual con agenda por día.
- Personas responsables y etiquetas en las tareas.
- Notas independientes con búsqueda y colores.
- Asistente agéntico compatible con OpenAI, OpenRouter y APIs compatibles.
- Historial de conversación con opción para iniciar un chat nuevo.
- Dictado por voz con llave, endpoint y modelo de transcripción independientes.

## Configurar la inteligencia artificial

Abre **Configuración** dentro de la aplicación, selecciona el proveedor y captura endpoint, modelo y llave API. La llave no forma parte del código ni se sube al repositorio. El asistente puede crear y consultar tareas, completar tareas por ID, registrar personas y crear notas.

Para usar dictado, completa también la sección **Transcripción de voz**. De forma predeterminada utiliza el endpoint de audio de OpenAI y el modelo `whisper-1`, pero ambos campos son configurables. En el chat, toca el botón circular para comenzar a grabar y vuelve a tocarlo para transcribir.

> Para una APK personal la configuración se guarda localmente. Si se publica como web para varios usuarios, utiliza un backend intermediario para no exponer llaves API en el navegador.

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
