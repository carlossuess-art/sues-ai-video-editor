# Estado técnico · 16/10/2026

FASE 2/10 · POC CLOUD
Progreso fase: 80 % (Sandbox y autenticación real preparados; render pendiente).
Progreso global: 12,5 % = Fase 1 al 90 % × 5 % + Fase 2 al 80 % × 10 %.
Fase 1 conserva 90 % hasta validar proveedor/almacenamiento con la prueba real.

Último hito: POC implementado, validación contra snapshot oficial, 18 tests offline
aprobados, comprobación de sintaxis y dry-run satisfactorios. Repositorio privado creado y
rama de trabajo poc/phase-2 habilitada. No se ha renderizado
ningún vídeo. Autenticación de Ingest/Edit verificada con GET de lectura.

## Decisiones

- Candidato provisional: Shotstack Edit + Ingest, exclusivamente `stage`.
- Node.js 22+, JavaScript ESM; Ajv con lockfile. Payload validado antes de enviarse.
- MP4 vertical 1080×1920, 30fps, 2 segmentos, título/outro, voz original.
- `contain` evita recortar caras sin tracking; bandas si el original es horizontal.
- Fuentes temporales en Ingest; hosting permanente del render excluido explícitamente.
- Publicación por URL no equivale a almacenamiento privado. No usar material sensible
  para este POC. El original de Drive permanece privado y sin cambios.
- Captions manuales cronometradas mediante rich-text para esta fase; ASR en Fase 3.
- Producción y generación IA bloqueadas en código. Sin OpenAI key ni coste IA.
- Sin CapCut, nuevas cuotas, UI grande ni créditos Lovable.

## Inventario y persistencia

- Drive principal: 1SNifaQFcBMzQ_H_3UQZcNMkUmzrMykOf
- Doc maestro: 1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ
- Pruebas Drive: 1efHjGfJ3b5vDYTkdMM_dUjQOumXGgqYr
- Estado Drive: 1aRkcle1mpKjom3E35rY_-soF0QrsSPUE
- GitHub: https://github.com/carlossuess-art/sues-ai-video-editor
- ID de repositorio: 1422196475. Visibilidad privada; propietario carlossuess-art.
- Rama principal: main. Rama de trabajo Fase 2: poc/phase-2.
- Repositorio creado mediante navegador autenticado; código publicado por conector.
- Base local previa: 7fabed55527dfa4a20e867330642f531dbffcc35. El commit remoto
  desciende del README inicial de GitHub; los hashes locales previos son históricos.
- Paquete previo en Drive: 1PM7nfmFfzDzO5sWXLnmWIhNPsCp5qymX.
  Es snapshot anterior a publicar GitHub; el repo es ahora la fuente técnica vigente.
- Lovable: 12 proyectos comprobados, ninguno específico; no se han gastado créditos.
- Sites relacionado: Sues Content Studio, appgprj_6a933e68e0408191a75dc6ff0364b0e2,
  https://sues-content-studio-v1.suesholistics.chatgpt.site (estudio editorial).
  Se consultaron metadatos, no su código; su reutilización como UI queda para Fase 8.
  No se modificó ni se creó un Site paralelo.
- Servicio añadido: repositorio privado GitHub. Sin nuevas cuentas ni API keys.
  Sin workflows de pago ni suscripciones; coste de este bloque: 0 USD.

## Pruebas y límites

`npm test` → 18/18; `npm run check` → OK; `npm run dry-run` → OK.
Pruebas: compilación/schema, tiempos, URL, capas, solapamiento, música, prohibición de
costes, endpoints stage, polling, errores, locks, ciclo mock completo, descarga MP4,
recuperación sin doble POST y fallo real de duración/ingest. Todo con mocks/offline.
Validado con la cuenta real: GET Ingest stage /sources y GET Edit stage /templates.
Ambos han respondido correctamente. Cuenta con 10 créditos gratuitos, caducidad 15/11/2026.
No validado aún: PUT de vídeo, render real, tipografía visual, sincronía,
resolución y audio del MP4 ni tiempo efectivo de render.

## Bloqueos y siguiente acción exacta

1. Carlos adjunta vídeo real de 30–60 s o lo sube a 06_PRUEBAS de Drive.
2. Ejecutar `npm run poc -- run /ruta/video.mp4 --out runtime/prueba-001 --execute-stage`.
3. Inspeccionar MP4 y anotar duración, tamaño, latencia, marca de agua y coste (0).
4. Archivar original/resultado/job en Drive; ejecutar cleanup del sourceId de ese job.
5. Actualizar este archivo y Doc; sólo cerrar Fase 2 tras MP4 comprobado.

Bloqueo GitHub resuelto. Continuar los cambios del POC en poc/phase-2, preservando
main como base. Leer este archivo y el Doc maestro antes de cada bloque; no recrear
el proyecto ni usar créditos Lovable para modificar este motor. Añadir la URL de
este repo y los IDs de Drive a las instrucciones del Proyecto ChatGPT.

## Shotstack Sandbox operativo · 16/10/2026

Carlos completó el alta personalmente. Cuenta gratuita: 10 créditos; caducidad indicada
en dashboard 15/11/2026. Entorno web SANDBOX seleccionado. No se contrató ningún plan.
La clave stage existente se configuró sin imprimirla en el chat: .env con permisos
0600 y git check-ignore confirmado. No hay claves en GitHub, Drive, Library ni docs.
Configuración disponible sólo en este entorno Work; si caduca/se pierde el workspace,
recuperar la clave desde la sesión autorizada o gestor de secretos, sin leerla en chat.

Validación real sin render: GET https://api.shotstack.io/ingest/stage/sources y
GET https://api.shotstack.io/edit/stage/templates → respuesta autenticada correcta.
No se enviaron POST de render/upload/generación, no hay vídeos remotos creados.
La copia al portapapeles del navegador no devolvía contenido; se usó el ejemplo cURL
visible de Sandbox para guardar la clave sin exponerla. No se rotaron claves.

Único material pendiente: vídeo propio de 30–60 s. Cuando llegue, ejecutar el POC.
Coste nuevo: 0. Fase 2: 80 % / global 12,5 %. El render real sigue pendiente.
