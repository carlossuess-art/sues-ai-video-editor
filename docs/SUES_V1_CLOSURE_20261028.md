# SUES AI VIDEO EDITOR · Cierre técnico del bloque V1 · 28/10/2026

## Estado actual

Mejoras DESPLEGADAS. V1 todavía ABIERTA: faltan la prueba real del Director
autónomo con consumo expresamente autorizado y la aceptación creativa del propietario.
No se ejecutaron llamadas de inferencia de pago ni se cambiaron suscripciones.

Web: https://editor.suesholistics.com
Repositorio: https://github.com/carlossuess-art/sues-ai-video-editor
Rama: feat/v1-closure-20261028.
Servidor: srv1841004. Base: /opt/sues-video-setup.
Código de integración: /opt/sues-video-setup/v1-closure-work-20261028.
Código productivo: /opt/sues-video-setup/release-update.78zyka2k.
Evidencia privada: /opt/sues-video-setup/v1-closure-qa-20261028.
Mantener estos IDs/enlaces en las instrucciones del proyecto para otros chats.

## Recuperación y protección

Se partió de manual-adjust en7b89935, limpia, con snapshot bf59fbd del trabajo
posterior del servidor. Se compararon hashes con producción y GitHub7cdef768.
Se recuperaron cinco archivos de tests adicionales, conservando sus casos.
El worktree DOPAMIN original con cambios sin confirmar sigue intacto.
No se fusionaron ramas indiscriminadamente ni se sustituyó main por una mezcla.

## Resultado P0

| Función | Resultado |
|---|---|
| Recortes del bruto | Propuestas individuales, silencios reteniendo~0,5s, muletillas/repeticiones literales, rangos manuales, confirmación, preview con saltos y persistencia |
| Reversibilidad | Original conservado; nuevas versiones; borradores locales ligados a SHA/fingerprint; deshacer |
| Sincronización | Mapa temporal aplicado a voz/vídeo/captions; pruebas reales y rechazo de planes de otra revisión de cortes |
| Contrato Director | edit-timeline, sourceTimeMap y timelineFingerprint; operaciones desconocidas bloqueadas |
| Validador | Unión de apoyos reales, extremos incluidos; DOPAMIN6s/CALMA8s, hook semántico0–3s y SFX activo±0,45s; excluye zoom/flash/blur/captions/transición vacía |
| Densidad DOPAMIN60–75s | Mínimos5B-roll,2motions y composición con sujeto recortado; sin rellenar una cuota de comienzos con efectos arbitrarios |
| Jerarquía textual | Sustitución literal conservadora; información diferente recolocada; caption-visibility para duplicación semántica propuesta y revisada |
| Validar/Ajustar | Visibles en móvil/escritorio; validación ligada a versión/fingerprint/SHA; nueva versión sin otra llamada al Director |
| Ajustes | Texto/visibilidad/tiempo de captions±0,1s; B-roll/imágenes/SFX explícitos temporizados, sustitución, volumen SFX, texto de tarjetas, deshacer |
| Capas automáticas | Catálogo reversible para motions, tarjetas, ELEMENTS, texto de profundidad, capas de sujeto, foreground e imágenes de plantilla; ocultar/restaurar sin perder originales |
| Versiones históricas | Catálogo de capas reconstruido solo en lectura, sin reescribir bundles anteriores |
| Exportación |1080p conserva máster;720p separado del proxy,CRF20/Lanczos/5Mb/s y audio copiado; caché por versión/tipo |
| Reproducción | ProxyCRF28/1,2Mb/s; HTTP Range206; servicio permanente3057 preservado |
| Despliegue | Copias verificadas, arranque probado del código restaurado, HTTPS/sesión/Range y versiones previas conservadas |

CALMA permite render de borrador aunque no cumpla el control editorial;
ambos perfiles impiden aceptación final cuando el control técnico falla.
La pertinencia semántica real y la audibilidad necesitan revisión audiovisual:
el validador estructural no las demuestra.

## Vídeo completo para Carlos

Versión nueva: e5d48158-777e-4273-86ee-8970db623ab5.
Padre conservado:5413b0fe-9b40-47d8-a2d0-65b18b178af9.
URL privada de proyecto:
https://editor.suesholistics.com/?project=e5d48158-777e-4273-86ee-8970db623ab5

70,9s,1080×1920,36.754.940bytes.
SHA256 dddfa227ee6a01d1e9ed60f3ebd5bf99d877cbb7d3872ca53305646f46c9df45.
Decode íntegro PASS, fuente conservada y audio AAC idéntico a la edición anterior.
Se ocultaron únicamente seg-064 («La transformación») y seg-083 («DESARROLLAR tu»),
representados por los gráficos principales. Se conservan «profunda no»,
«es cómoda» y «Si quieres»: ocultarlos por completo perdería información.
Fotogramas terminados49,8s y66,8s revisados, además de la comparación de cuatro
escenas11,9/35,8/49,8/66,8s del primer render completo.
Control técnico:7B-roll,3tarjetas,2capas de foreground,hook/SFX válido,
hueco máximo sin apoyo5,3s. No es aceptación estética ni escucha humana.
No se aprobó la versión en nombre de Carlos.

## Pruebas verificadas

- Suite completa final406/407. Único fallo: Git no existe en el contenedor.
  La comprobación correspondiente en host pasó2/2.
- Compatibilidad histórica/servidor/colas/almacenamiento posterior:15/15PASS.
- Contrato semántico/Director:24/24PASS; visibilidad manual:4/4PASS.
- Navegador autenticado, móvil393×852/tablet820×1180/escritorio1440×1000:
  ocultar caption, mover±0,1s, recuperar borrador tras recarga, mover/deshacer
  B-roll y ocultar/restaurar motion. Cero erroresJS y sin overflow.
- Se descubrió y reparó colapso del reproductor móvil; comprobación de altura
  mínima y revisión visual. En producción: reproductor móvil~203px/escritorio680px.
- Subida real desde UI, análisis existente reutilizado,6silencios seleccionables,
  desmarcado individual, rango manual, confirmación y recarga.
  Resultado de prueba65,324s con6cortes; original intacto.
- Dos renders reales10s: recorte→versión manual→validación de prueba→descarga
  720p/1080p→reinicio/recuperación. La validación de prueba vive solo en QA,
  no representa opinión del propietario.
- Render completo1080p y export720p70,9s;720×1280,22.444.501bytes en QA.
  Audio copiado idéntico; la pista del1080 también coincide con la edición anterior.
- Producción: HTTPS, sesión, API/mediaRange206/1024bytes y assets nuevos.
  Las37versiones previas conservaron estados y fingerprints; se añadió la versión
  de revisión. Servicio Range permanente también responde206/1024bytes.
- Código previo restaurado:181archivos idénticos y arranque/sesión/saludPASS.
- Primer ensayo con techo artificial1200MiB terminóSIGKILL; repetición con los
 1900MiB ya existentes en producción PASS. Sin aumentar límites; producción0OOM.
- npm run check y git diff --check PASS.

## Skill y límites

Director privado actualizado a1.4.0: tiempos recortados, fingerprint,
ocultación semántica conservadora y prioridad de decisiones manuales.
Identidad, privacidad y configuración preservadas; lectura posterior verificada.
No se ha probado con una llamada nueva de modelo.

El inspector permite ocultar/restaurar capas automáticas; mover o retimar
máscaras y algunas animaciones compiladas requiere ampliar su contrato y
recalcular geometría/mattes. No se presentan controles falsos.
El reproductor manual muestra explícitamente el último MP4 mientras hay cambios:
no existe aún preview exacto por capas del borrador.

## Prioridad restante

P0: probar una sola solicitud real del Director con el vídeo/análisis existentes
cuando Carlos autorice específicamente el consumo; comprobar plan completo,
contrato, semántica y render. Obtener después su valoración creativa.
No repetir Whisper ni reanalizar biblioteca ya disponible sin motivo.

P1: cortes semánticos avanzados, VAD/respiraciones, ranking narrativo,
preview corto/por capas, edición fina de animaciones/máscaras y tactilidad.
P2: keyframes y funciones profesionales ajenas al criterio mínimo.

## Recuperación y siguiente acción exacta

Backup de código: v1-closure-qa-20261028/live-code-before.tgz;
SHA256 dff2902df4ce8f7a72e96d904e21f8a3014292052d39904029c18afe6ea40348.
Estado mutable: state-before.tgz, verificado.
Compatibilidad histórica tiene respaldo adicional editor-jobs-first-release.js.
No hay medios privados ni credenciales en Git.

Siguiente: abrir la versión de revisión, valorar imagen/voz/recursos y ajustar
si procede. Para verificar autonomía, preparar su catálogo actual y una única
POST jobs/{id}/ai-plan?async=1 con fingerprint actual y proveedor Gemini, solo tras
autorización específica; sin reintentos ni cambio de proveedor automáticos.
Guardar respuesta y validaciones; ejecutar solo un plan compatible.
Fase9abierta; global oficial previo48%, sin recalcular porcentajes por tests.
