# Motions nativos en planes externos · 21/10/2026

El catálogo para Gemini ahora ofrece cuatro recetas que el motor SUES ya dibuja:
QUOTE_CARD_01 (cita), NUMBER_BADGE_GOLD_01 (paso numerado), STRIKE_TEXT_01 (tachado)
y DIVIDER_LINE_01 (separador). No son cuatro MOGRT convertidos ni nuevos diseños.
Se reutilizan las fuentes, animaciones, geometría y controles existentes.

Operación compatible:

```json
{"type":"motion","resourceId":"NUMBER_BADGE_GOLD_01","captionId":"seg-003","number":2}
```

`number` sólo corresponde a NUMBER_BADGE_GOLD_01, entero 1–99. Las otras recetas
aceptan únicamente type, resourceId y captionId. El texto procede del subtítulo
real, incluyendo correcciones caption del mismo plan en cualquier orden. Tiempos,
animación, posición y tamaño los resuelve el motor existente; no se admiten rutas,
archivos Adobe, texto libre como binding ni posición/duración arbitrarias.

Los motions necesitan análisis facial previamente preparado. El catálogo informa
available=false con Whisper solo/full-frame-fit y la revisión bloquea el encargo.
No se inventan caras. No se transforma un motion rechazado en una omisión silenciosa.
La comprobación final exige motions activos y compila el conjunto: límites de tres
citas/cinco otras elecciones, inicio/cierre, texto, rostro y solapamientos. Si falla
una operación, ninguna se ejecuta. La revisión y los borradores conservan el flujo
privado existente; se ejecuta como nueva versión, con revisión vigente e idempotencia.

Añadir un motion al mismo caption/tipo permite actualizar el número; no se elimina
otro tipo ni una cita para hacer sitio. Dos operaciones motion del mismo plan sobre
un caption se rechazan. Los demás ajustes se conservan; la elección explícita de
motion sustituye la selección automática de motions según el contrato existente.
Los controles manuales reconocen los ajustes importados y pueden retirarlos.

La adaptación del material Creator Club sigue siendo un trabajo separado. No se
han descargado ni ejecutado otros presets; los originales del banco siguen intactos.
No nuevas dependencias, modelos, proveedores, llamadas de pago ni cambios de otras apps.

Validación: consultar PROJECT_STATUS.md y el registro del bloque. El script
scripts/app/smoke_external_motions.mjs realiza QA de escritorio/móvil con vídeo y voz
sintéticos, análisis facial de fixture, cuatro motions, imagen/música subidas por
HTTP, render completo, descarga y fuente/padre intactos. No equivale a aceptación
creativa ni transcripción/seguimiento facial nuevos. F6/F9/V1 siguen abiertos.
