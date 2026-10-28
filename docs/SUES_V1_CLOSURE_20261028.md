# SUES AI VIDEO EDITOR · Continuidad V1 · 28/10/2026

## Estado y procedencia

V1 ABIERTA. No hay aceptación creativa final ni prueba nueva de inferencia de pago.
Repositorio: https://github.com/carlossuess-art/sues-ai-video-editor
Web: https://editor.suesholistics.com
Servidor: srv1841004. Base general: /opt/sues-video-setup.
Rama de integración: feat/v1-closure-20261028.
Worktree: /opt/sues-video-setup/v1-closure-work-20261028.
Evidencias privadas: /opt/sues-video-setup/v1-closure-qa-20261028.
Mantener estos IDs en las instrucciones del proyecto para continuidad entre chats.

Se recuperó la rama manual-adjust en 7b89935, limpia, con snapshot bf59fbd
del trabajo DOPAMIN. El worktree dopamin-density original sigue intacto,
con sus cambios sin confirmar. Producción original monta release-update.78zyka2k,
con reparaciones posteriores aplicadas a archivos; un SHA histórico aislado
no describe toda esa carpeta. Se compararon hashes de código y recursos web.
La rama GitHub work/dopamin-density-20261028 (7cdef768) conserva tests adicionales:
se recuperaron los cinco archivos afectados, sin perder casos existentes.
No se fusionaron ramas indiscriminadamente.

## P0 implementado en la rama

- Recortes del bruto integrados en settings, mapa temporal, vídeo, audio y captions.
  Selección individual de pausas, muletillas/repeticiones literales y rangos manuales.
  Se propone, nunca se elimina automáticamente. Previsualización saltando cortes.
- Pausas conservan aproximadamente 0,5s; se descartan límites de palabras inciertas.
  Corregido el corte final de fuentes cuya duración no es múltiplo de 1/30s.
  Las decisiones de corte se recuperan del borrador local ligado al SHA de subida.
- Contrato Director usa edit-timeline, sourceTimeMap y timelineFingerprint.
  Un plan de otra revisión de cortes se rechaza. Sin cortes se toleran planes
  históricos sin fingerprint; si lo incluyen, se verifica siempre.
- Validador mide unión de apoyos semánticos en todo el vídeo, incluidos extremos.
  Excluye zooms, flashes, transiciones, blur y captions ordinarios.
  Hook semántico y SFX activo con diferencia de inicio máxima de 0,45s.
  DOPAMIN máximo 6s y CALMA 8s sin apoyo; duración no limitada a 60–75s.
  En DOPAMIN 60–75s conserva mínimo 5 B-roll, 2 motions y una composición recortada.
  No se rellena una cuota de comienzos con efectos arbitrarios: cuenta la duración
  significativa del apoyo. La pertinencia narrativa y audibilidad requieren revisión.
  DOPAMIN bloquea render incumplidor; CALMA permite borrador de revisión, pero
  ambos bloquean aceptación final si el control técnico falla.
- Jerarquía general de texto: sustitución solo cuando el gráfico contiene la
  copia literal completa. Otra información hablada se conserva y recoloca.
  Texto editado manualmente no se elimina automáticamente. El audio no cambia.
- Ajustar: ocultación reversible, texto y tiempo de captions (±0,1s),
  B-roll/imágenes/SFX temporizados, sustitución instalada, volumen SFX,
  texto de tarjetas y deshacer. Guardar crea otra versión sin llamar al Director.
  Borrador manual local ligado a versión y fingerprint, recuperable tras recarga.
- Validación asociada a fingerprint y SHA del MP4. La descarga final requiere
  validación de esa versión, también en el endpoint con resolución elegida.
- Exportación 720p separada del proxy: CRF20, límite 5Mb/s, escalado Lanczos,
  audio AAC copiado sin volver a codificar. Caché por versión/tipo.
  Proxy de previsualización conserva CRF28/1,2Mb/s. 1080p conserva el máster.
  Se reutilizan proxies históricos válidos para evitar recodificación innecesaria.
- Servicio byte-range permanente 3057 preservado; no se cambió Caddy/DNS/WhatsApp.

## Evidencia obtenida

- Batería completa v3: 390/391. Único fallo por Git ausente en imagen.
  Tests deploy-service ejecutados en host: 2/2 PASS.
- Tests recuperados de GitHub: 33/33 PASS.
- Pruebas dirigidas finales: 12/12 PASS, incluidas descarga720 con Range206,
  audio copiado, rechazo de descarga no validada y contrato temporal.
- Navegador autenticado con proyecto real e histórico MP4 conservado:
  móvil393×852, tablet820×1180 y escritorio1440×1000.
  Ocultar caption, moverlo, recuperar borrador tras recarga, mover B-roll,
  deshacer y descartar. Cero errores JS; anchos sin overflow.
  Esta prueba UI reutiliza un MP4 histórico: no atribuirle un render nuevo.
- Clip real no destructivo: fuente original70,891s, conservado8–18s,
  salida10s, audio/vídeo y decode íntegro PASS; fuente SHA conservado.
- Render completo de jerarquía: primera ejecución con techo artificial1200MiB
  terminó SIGKILL a~35,7s. Se repite con los1900MiB ya existentes en producción.
  No se ha aumentado el límite productivo. Resultado completo aún pendiente
  en este checkpoint; revisar full-render-prod-limits.log y full-memory.events.
- npm run check y git diff --check pasaron antes del último cierre.

## P0 pendiente para declarar V1

1. Finalizar render completo, inspeccionar fotogramas críticos y audio técnico.
2. Probar nueva subida real, revisión de cortes y generación de versión.
3. Verificar despliegue/rollback y recorrido público autenticado si se integra.
4. Edición manual de todas las capas automáticas/máscaras y motions:
   el inspector actual no representa todas esas operaciones.
5. Dirección creativa autónoma de calidad: motor local Qwen previo falló.
   Gemini está configurado, pero esta misión prohíbe consumo externo de pago.
   No se ha enviado vídeo ni plan a Gemini ni se ha hecho fallback.
6. Aceptación audiovisual subjetiva final del propietario.

## P1

Análisis semántico de redundancias/reinicios, refinamiento de selección narrativa,
preview de fragmentos/capas sin render completo y mayor precisión táctil.
El reproductor manual muestra explícitamente el último MP4 hasta generar.
No presentar como preview instantáneo del borrador.

## P2

Keyframes libres, edición espacial avanzada y otras funciones profesionales.
No condicionan el trabajo prioritario de V1.

## Recuperación

Copia previa verificada por extracción/listado:
v1-closure-qa-20261028/live-code-before.tgz
SHA256 dff2902df4ce8f7a72e96d904e21f8a3014292052d39904029c18afe6ea40348.
No incluye medios privados ni secretos en Git. Antes de cambiar producción,
comprobar inactividad, respaldar estado mutable y probar una instancia aislada
con el código previo. Conservar contenedor anterior para rollback.
El progreso oficial previo sigue48%; no se recalcula por cantidad de tests.
