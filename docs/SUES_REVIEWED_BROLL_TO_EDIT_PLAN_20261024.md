# F7/F9 puente: propuesta contextual → plan de B-roll revisable · 24/10/2026

## Qué se ha habilitado

El usuario puede consultar las propuestas del Director en el panel **Sugerir recursos** y, si un vídeo tiene ancla narrativa, revisión visual parcial y tramo de origen técnicamente auditado, pulsar **Preparar este B-roll para revisar**. Esto **NO coloca el B-roll ni renderiza**: únicamente arma el JSON del plan `sues-edit-plan/v1` en el campo de plan externo existente, lo guarda como borrador privado vinculado al proyecto y desplaza la interfaz a la revisión.

El plan utiliza `sourceSha256` obtenido del catálogo del proyecto actual, `resourceId` real de un vídeo instalado, los tiempos de voz del ASR `start/end`, el `sourceIn` procedente de la auditoría temporal y un motivo narrativo declarado provisional. **No añade URLs ni importa materiales nuevos**.

El usuario pulsa **Comprobar plan**, que usa la validación preexistente del editor; si resulta `canApply:true`, puede optar por **Ejecutar plan en otra versión**. La versión anterior y los originales se conservan; no se ha alterado el render ni la API privada de ejecución. El editor ya respeta `sourceIn` en el contrato de B-roll.

## Barreras
- Sólo se prepara una propuesta narrativa `contextual-review-only` con `needsHumanReview:true` y `visualContentVerified:false`, nunca un match léxico genérico.
- Debe existir un `suggestedSourceRange` coherente con el tiempo de voz y el vídeo registrado en el catálogo `external-catalog`; lo demás se rechaza.
- No se escribe sobre un borrador previo ilegible, de otro origen o incompatible. Si hay operaciones legítimas, se agregan sin borrar; máximo 3 B-rolls y sin solapamiento en tiempos de voz. Ningún procesamiento si hay ajustes locales sin guardar, ni después de cambiar de proyecto.
- No se pulsa automáticamente **Comprobar plan** ni **Ejecutar plan**. Es imprescindible confirmar el plan tras ver el contexto y la limitación del muestreo.
- Ninguna acción toca las pistas de voz, música, efectos, CALMA ni las versiones anteriores hasta que el usuario decida ejecutar explícitamente.
- Se reutilizan rutas `/api/jobs/:id/external-catalog`, `external-draft`, `external-review` y `external-execute`. Cualquier incompatibilidad es rechazada por la validación del backend.

## Estado y aceptación

Esto es un **puente de edición asistida** y un paso de F7 a F9, no la automatización autónoma final. Falta probar un MP4 de nueva versión con el usuario, escuchar niveles reales, corregir B-roll semánticamente y comprobar captions, zonas seguras y motion. No declarar F9 aceptada.

Pruebas con el helper real extraído de `web/app.js`: plan con IDs/SHA válidos y `sourceIn`, borrador de otro vídeo, texto inválido, conflicto temporal, vídeo sin duración suficiente, tres B-rolls anteriores y ausencia de revisión visual. Se incluyen regresiones existentes de plan externo y edición audiovisual. Sin gasto externo.
