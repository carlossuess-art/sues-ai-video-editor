# F7 · Evidencia visual muestreada para la recomendación de B-roll · 24/10/2026

## Problema y alcance
El filtro léxico anterior suprime palabras vagas, pero aún podía sugerir vídeos que coinciden con la narrativa y sin embargo contienen inscripciones/marcas comerciales ajenas. La coincidencia narrativa y la aptitud de un clip son condiciones independientes. Esta mejora **no usa IA visual ni garantiza que el clip completo sea apropiado**: registra inspecciones humanas parciales de fotogramas y hace una exclusión conservadora, sin automatizar importación ni publicación.

## Muestras revisadas (cuatro clips instalados)
Se utilizó FFmpeg 5.1 en contenedor aislado, sin acceso a red ni modificación de originales. Hoja de contacto: **cuatro fotogramas por clip**, segundo 0/1/2/3 (FPS=1, primer tile 2×2). Los JPG de QA son temporales y PRIVADOS, guardados fuera de GitHub en `/opt/sues-video-setup/dopamin-visual-review-20261024`; no constituyen revisión íntegra.
- **Reloj** (hash privado del archivo real): plano de esfera analógica; inscripción de producto en la zona central. Se registra `visible-third-party-marking` + `unrelated-on-screen-text`; esta clase de B-roll se excluye de propuestas del Director para evitar introducir branding ajeno.
- **Sendero/persona caminando**: se aprecia una persona de espaldas, en entorno exterior. `person-visible` significa únicamente que aparece una persona en la muestra; no implica identidad, consentimiento ni derechos adicionales. Todavía requiere revisión humana.
- **Cadena industrial en agua**: no se observa inscripción o persona en las cuatro capturas. `riskFlags:[]` NO significa que el clip entero esté libre de riesgos.
- **Amanecer en valle**: no se observa inscripción o persona en las cuatro capturas; limitaciones equivalentes.

La procedencia/licencias siguen regidas por los metadatos V2 ya existentes. No modificar `approvedForProduction` ni inferir aprobación a partir de esta revisión.

## Implementación
- El archivo privado opcional `jobs/library/asset-visual-review-v1.json` conserva exclusivamente **hashes SHA256 como IDs**, `scope:sampled-frames-only`, cuatro segundos muestreados y riesgo categorizado con una lista cerrada de valores. **No URLs, nombres de persona, secretos ni rutas a material privado**.
- Nuevo loader controlado: índices symlink y entradas corruptas fallan en cerrado; archivo ausente sigue siendo compatible con la versión previa. Se comparte un único snapshot entre las frases.
- La búsqueda manual sigue encontrando todos los recursos instalados, pero muestra el campo limitado `visualReview` cuando existe. El Director **solo excluye de sugerencias de vídeo** elementos con `visible-third-party-marking` o `unrelated-on-screen-text`. Mantiene otros candidatos bajo `needsHumanReview:true`, `approvedToAutoPublish:false`, `visualContentVerified:false`.
- El panel web informa claramente de «Revisión parcial: cuatro fotogramas» o «Sin muestreo visual registrado» y de presencia de personas, sin exponer rutas privadas. Selección manual y renderer no alterados.

## Pruebas y criterios pendientes
Casos automatizados: bandera de marca bloquea una sugerencia de reloj, alternativa de cadena permanece; selector manual conserva reloj con advertencia; persona visible queda sugerida solo para revisión; symlink/índices corruptos y campos arbitrarios no exfiltran datos. Se repiten las pruebas de API privada, permisos, lectura/privacidad y suite de sintaxis. Prueba real sobre catálogo/índice privado. F7 no se da por cerrada: faltan muestras de clips completos y correspondencia visual/semántica con la frase exacta.

**No usar el resultado para declarar Fase 9/V1 aceptadas.** CALMA y preferencias de audio permanecen intactos. Global oficial 48 %.
