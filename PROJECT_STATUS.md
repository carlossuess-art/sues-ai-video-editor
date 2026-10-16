# Estado técnico · 16/10/2026

FASE 2/10 · POC CLOUD
Progreso fase: 70 % (estimación de preparación; el render real sigue pendiente).
Progreso global: 11,5 % = Fase 1 al 90 % × 5 % + Fase 2 al 70 % × 10 %.
Fase 1 conserva 90 % hasta validar proveedor/almacenamiento con la prueba real.

Último hito: POC implementado, validación contra snapshot oficial, 18 tests offline
aprobados, comprobación de sintaxis y dry-run satisfactorios. Repositorio privado creado y
rama de trabajo poc/phase-2 habilitada. No se ha renderizado
ningún vídeo ni se han realizado llamadas autenticadas a Shotstack.

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
No validado aún: ingest/autorización real, upload firmado, tipografía visual, sincronía,
resolución y audio del MP4, latencia ni cuota disponible en la cuenta del usuario.

## Bloqueos y siguiente acción exacta

1. Carlos crea/inicia sesión en cuenta Shotstack gratuita; API Keys → Sandbox y
   configura SHOTSTACK_STAGE_API_KEY en .env/gestor de secretos, sin publicarla.
2. Introducir vídeo real de 30–60 s. Ejecutar el comando `run` del README.
3. Inspeccionar MP4 y anotar duración, tamaño, latencia, marca de agua y coste (0).
4. Archivar original/resultado/job en Drive; ejecutar cleanup del sourceId de ese job.
5. Actualizar este archivo y Doc; sólo cerrar Fase 2 tras MP4 comprobado.

Bloqueo GitHub resuelto. Continuar los cambios del POC en poc/phase-2, preservando
main como base. Leer este archivo y el Doc maestro antes de cada bloque; no recrear
el proyecto ni usar créditos Lovable para modificar este motor. Añadir la URL de
este repo y los IDs de Drive a las instrucciones del Proyecto ChatGPT.

## Alta Shotstack pendiente · 16/10/2026

Carlos autorizó expresamente el acceso a Shotstack. Autenticación con Google completada.
La web está en https://app.shotstack.io/onboarding. Se prepararon nombre y uso
“Add video editing inside my product”. No se marcó la aceptación de condiciones ni
se pulsó Get Started. Carlos debe elegir nivel técnico, revisar/aceptar condiciones
y completar el alta personalmente. Después comprobar créditos y API Keys → Sandbox.
No se ha leído ni configurado ninguna API key. Sin tarjeta, compra, recarga ni cargos.
La fase sigue al 70 % / global 11,5 %; primer render pendiente.
