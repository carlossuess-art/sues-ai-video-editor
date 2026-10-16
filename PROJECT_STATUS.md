# Estado técnico · 16/10/2026

FASE 2/10 · POC CLOUD · COMPLETADA
Progreso fase: 100 %.
Progreso global: 15 % = Fase 1 al 100 % × 5 % + Fase 2 al 100 % × 10 %.
Fase 1 cerrada al validar proveedor y almacenamiento con vídeo real.

Último hito: primer MP4 cloud generado y descargado; 37,3 s, 1080×1920,
30fps, voz original, título y cierre. Sandbox con marca de agua; coste real 0 USD.
Saldo posterior: 10 créditos; dashboard indica 0 gastados.

## Arquitectura y decisiones

- Node.js 22+, JavaScript ESM, Ajv y snapshot OpenAPI oficial.
- Shotstack Edit + Ingest stage validado como motor POC; adaptador reemplazable.
- Video Edit Plan estructurado → timeline validado → render → descarga → archivo → limpieza.
- Contain conserva el encuadre. Rotación 90° del HEVC de móvil resuelta por Shotstack.
- Corte mecánico 12–13 s, título inicial y outro: demuestra montaje, no edición semántica.
- Voz original volumen 1; sin música, ASR ni captions en esta ejecución.
- Captions temporizadas mediante rich-text preparadas; transcripción en Fase 3.
- Fuente temporal Ingest eliminada tras archivar; CDN permanente excluido.
- Original y resultado privados en Drive; vídeos y credenciales excluidos de Git.
- Producción/generación IA bloqueadas. Sin CapCut, Lovable, suscripciones ni compras.
- PAYG orientativo: 0,20 USD/min; este vídeo equivaldría a unos 0,125 USD de render,
  sujeto a reglas de facturación/extras. No se ha ejecutado producción.

## Inventario

- Doc maestro: https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit
- Drive principal: 1SNifaQFcBMzQ_H_3UQZcNMkUmzrMykOf
- Pruebas Drive: 1efHjGfJ3b5vDYTkdMM_dUjQOumXGgqYr
- Estado Drive: 1aRkcle1mpKjom3E35rY_-soF0QrsSPUE
- Repo privado: https://github.com/carlossuess-art/sues-ai-video-editor
- Repo ID: 1422196475. Rama activa: poc/phase-2; main conserva baseline.
- Original Drive: 1zSsbtfIBH3GEvrnkZfvGhssYRsw9kh82 (96.942.857 bytes).
- Resultado Drive: 1uQl_nLIwO7NqzayotOQhewnOT7hXRh5S (24.873.991 bytes).
- Render: a4708c00-45f2-4260-aef7-ebdc7d7b3c2d.
- Source eliminado: zzz01m52-haf02-7avyc-1w53k-0523av.
- Fuente vacía descartada/eliminada: zzz01m52-h8jp1-sa35t-19hz1-7kcj1e.
- Resultado local: runtime/prueba-001/result.mp4. Job conservado como CLEANED.
- Clave Sandbox sólo en .env local ignorado, permisos 0600; nunca en docs/commits.
  Cuenta gratuita: 10 créditos, caducidad indicada 15/11/2026.
- Snapshot histórico Drive anterior a GitHub: 1PM7nfmFfzDzO5sWXLnmWIhNPsCp5qymX.
- Site relacionado, no modificado: Sues Content Studio,
  appgprj_6a933e68e0408191a75dc6ff0364b0e2,
  https://sues-content-studio-v1.suesholistics.chatgpt.site . Reutilización UI en Fase 8.
- No workflows de Actions ni costes nuevos. GitHub es la fuente técnica vigente.

## Validación

19/19 tests offline aprobados, sintaxis y diff verificados. Nuevo test de Content-Length
para PUT de vídeo. API real Ingest/Edit, subida, polling, render, descarga y limpieza
verificados. Decodificación completa MP4 sin errores. Fotogramas de inicio, centro y
cierre revisados: orientación y textos correctos. AAC no silencioso y niveles próximos
al original; no se afirma revisión auditiva humana ni reproducción física en móvil.
Latencia envío→descarga: 62,96 s; renderTime reportado: 11,634 s.
Incidencias resueltas: timeout API aumentado a 120 s y Content-Length explícito en PUT.
Un lock residual retirado tras comprobar ausencia del proceso; no se duplicó render.
Evidencia detallada: docs/POC_RESULTS_001.md.

## Siguiente acción exacta

Iniciar FASE 3/10 · Transcripción + segmentación + subtítulos (0 %): definir contrato de
transcript con timestamps y edición manual, implementar compilación de captions y
validación offline; después evaluar ASR sin activar cargos. Reutilizar vídeo archivado.
Bloqueos actuales: ninguno. Necesito de Carlos: nada para preparación offline de Fase 3.
Leer este archivo y Doc maestro antes de continuar; conservar historial y rama activa.

Auditoría privada Drive (job, plan, timeline, verificación):
https://drive.google.com/file/d/1SB6EX0zl02B0LuahAYdcg-D6OV3l07YF/view
