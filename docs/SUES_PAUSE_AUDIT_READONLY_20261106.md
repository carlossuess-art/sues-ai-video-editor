# SUES MASTER DIRECTOR · Auditar pausas en la edición actual (fase 2)

Estado: **implementado exclusivamente para análisis no destructivo en la PR #27**. No crea nuevas versiones, no modifica el vídeo, no genera una aprobación, no publica y no acredita escucha humana o calidad cinematográfica.

## Acceso autenticado

`POST /api/jobs/:jobId/master-pause-audit` con JSON:

```json
{"expectedRevision":null,"expectedSourceSha256":"<SHA256 obtenido de external-catalog>","expectedTimelineFingerprint":"<fingerprint obtenido de external-catalog>","suggest":true}
```

O proporcionar una lista de intervalos `{start,end,expressive?}` bajo `candidates` en lugar de `suggest:true`. Ambos son **solo propuestas**. `expectedRevision` proviene de `master-current` y puede ser `null` si todavía no existe un plan maestro; no significa permiso para escribir. La fuente y fingerprint se toman de `external-catalog` autenticado, nunca del texto del usuario. Respuesta de solo lectura con códigos de seguridad, tiempos al fotograma y palabras contiguas; `applied:false`, `approved:false`, `canExecute:false` siempre. Se rechazan solicitudes obsoletas con 409, intentos de forjar campos con 400 y mapas de tiempo editados/no verificados con 422. No registra ni aplica cortes.

En la interfaz: abrir un Reel, **Revisar plan maestro → Analizar pausas de voz (sin cortar) → Comprobar pausas**. El panel muestra únicamente pausas candidatas y bloqueos. Cada candidata espera comprobación auditiva/perceptiva posterior.

## Protección de los fonemas

Alinea los intervalos a 30 fps y comprueba los límites frente a la transcripción **verificada** del proyecto. Rechaza solapamientos con palabras, pausas de hasta 0,7 s, margen residual menor de 0,67 s, cortes solapados, intervalos no representables y errores de entrada. No etiqueta las pausas expresivas como seguras sin escuchar; la transcripción no permite conocer de forma concluyente respiraciones, emociones o cortes naturales. Los cortes sobre `sourceTimeMap` con múltiples tramos permanecen bloqueados hasta tener rebases de palabras demostrables.

Los datos de la fuente CFR30 derivada 158404 y la evidencia objetiva de 24 ventanas son consistentes, pero el estado creativo y de escucha **NO APROBADO** permanece vigente. Para cerrar la fase 2 aún se precisa escuchar los bordes/cortes, verificar la transición perceptivamente y aceptar la fuente derivada en el plan cinematográfico real, sin inventar aprobaciones.

## Test de aceptación

`node --test tests/master-director-pause-http.test.js tests/master-director-pause-audit.test.js` valida autorización, sugerencias deterministas, denegación por revisión/huella desactualizada, inmutabilidad del trabajo y protección del habla. Las pruebas dirigidas integradas también cubren persistencia del proyecto y la fuente derivada.
