# Recordatorios

Aplicación web progresiva (PWA) de recordatorios, preparada para empaquetarse como APK mediante Capacitor. Funciona sin conexión y guarda los datos localmente en el dispositivo.

## Funciones

- Crear, editar, completar y eliminar recordatorios.
- Fecha, hora, notas, prioridad y repetición diaria, semanal o mensual.
- Búsqueda, filtros y resumen de pendientes.
- Tema claro y oscuro.
- PWA instalable y funcionamiento sin conexión.
- Notificaciones locales al ejecutarse como aplicación Android.
- Alertas anticipadas configurables por tarea.
- Acciones para completar o posponer 10 minutos o una hora desde la notificación.
- Las tareas de prioridad alta activan una alarma nativa tipo despertador con sonido continuo, vibración y pantalla sobre el bloqueo.
- La alarma prioritaria permite detener o posponer 10 minutos y se detiene automáticamente después de 10 minutos.
- Las alarmas prioritarias pendientes se restauran después de reiniciar el teléfono.
- Calendario mensual con agenda por día.
- Perfiles de personas con relación, apodos, teléfono, correo, cumpleaños, dirección, empresa e información adicional.
- Búsqueda privada enriquecida para encontrar personas por sus datos, relación o contexto sin mostrar etiquetas internas en la interfaz.
- Notas independientes con búsqueda y colores.
- Asistente agéntico compatible con OpenAI, OpenRouter y APIs compatibles; puede consultar y actualizar la información de personas.
- Consultas de tareas por periodos reales, como hoy, mañana, esta semana, un día específico o un intervalo de fechas.
- Historial de conversación con opción para iniciar un chat nuevo.
- Asistente como pantalla principal, con encabezado y entrada fijos y desplazamiento limitado a los mensajes.
- Dictado por voz con llave, endpoint y modelo de transcripción independientes.
- Base de datos SQLite nativa en Android, con respaldo de seguridad compatible en la versión web.

## Almacenamiento y migración

En la APK, las tareas, personas, notas, conversaciones y preferencias se guardan en SQLite. Al instalar esta actualización, la aplicación detecta los datos de versiones anteriores y los importa automáticamente una sola vez, sin borrar la copia anterior. Los respaldos manuales y de Drive continúan usando archivos JSON para que puedan restaurarse fácilmente.

Las llaves de IA y transcripción no se guardan en SQLite: en Android permanecen protegidas por Android Keystore.

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

## Compilar sin Android Studio

Abre la pestaña **Actions** del repositorio, selecciona **Compilar APK** y pulsa **Run workflow**. Cuando termine, abre la ejecución y descarga el artefacto `recordatorios-apk`. El archivo ZIP contiene `app-debug.apk`, listo para instalar manualmente en Android.

El comando `npm run cap:add:android` instala automáticamente el componente nativo de alarma y sus permisos. Android 13 o superior solicitará autorización para mostrar notificaciones. Las tareas bajas y medias utilizan notificaciones locales; las de prioridad alta utilizan el volumen de alarmas del sistema y pueden despertar el dispositivo.

## Pruebas

```bash
npm test
```
