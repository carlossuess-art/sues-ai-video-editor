## Decisión de Carlos · V1 asistida / V1.1 API · 28/10/2026

V1: subir el vídeo al editor o compartirlo con ChatGPT y obtener la edición final deseada con asistencia humana/ChatGPT, revisión, ajustes y exportación. La API de Gemini NO es requisito de aceptación ni bloqueo de V1. V1.1: automatizar el mismo resultado mediante Gemini solo cuando aporte valor; evitar llamadas y costes siempre que sea posible. No invocar Gemini ni otros servicios de pago por esta continuación. Carlos conserva la aceptación creativa del resultado; no inferirla de tests.

# SUES AI VIDEO EDITOR · Cierre técnico del bloque V1 · 28/10/2026

## Estado actual

Mejoras DESPLEGADAS. Criterio actualizado por Carlos: V1 asistida, con resultado final revisable/exportable mediante editor y ayuda de ChatGPT. Gemini API pasa a V1.1 y NO bloquea V1. La aceptación creativa corresponde al propietario.
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
La continuación asistida añade una vista exacta de fragmentos; no hay reproducción instantánea por capas.

## Prioridad restante

P0: completar el flujo asistido, corregir limitaciones útiles del ajuste y facilitar la revisión/exportación de Carlos sin API.
V1.1: automatización vía Gemini opcional y con autorización de consumo.

P1: cortes semánticos avanzados, VAD/respiraciones, ranking narrativo,
preview instantáneo por capas, edición fina de animaciones/máscaras y tactilidad.
P2: keyframes y funciones profesionales ajenas al criterio mínimo.

## Recuperación y siguiente acción exacta

Backup de código: v1-closure-qa-20261028/live-code-before.tgz;
SHA256 dff2902df4ce8f7a72e96d904e21f8a3014292052d39904029c18afe6ea40348.
Estado mutable: state-before.tgz, verificado.
Compatibilidad histórica tiene respaldo adicional editor-jobs-first-release.js.
No hay medios privados ni credenciales en Git.

Siguiente: Carlos revisa el vídeo completo e5d48158-777e-4273-86ee-8970db623ab5, comunica correcciones o lo valida y descarga. Fragmentos desplegados y verificados. Gemini se reserva para V1.1. No recalcular porcentajes por número de tests.

## Continuación V1 asistida · fragmentos de ajustes

- Botón Ver fragmento de ajuste: ventana de 4 s alrededor del elemento elegido, 540×960, mismo compositor y mezcla del montaje. API privada admite 0,5–8 s. Incluye remapeo de cortes; no exporta un render completo por cada movimiento.
- El render puede procesar parte anterior de la línea temporal. En navegador real: primer fragmento 30,2 s, reutilización 1,85 s; un ensayo anterior con trabajo concurrente tardó 67,4 s. No confundir estas mediciones con un SLA.
- Caché de cuatro ventanas vinculadas a proyecto y fingerprint del borrador; autenticación y Range. Solicitudes repetidas reutilizan el resultado. Cancelar el diálogo detiene el proceso. Arranque recupera interrupciones. Un fragmento nunca satisface validateRenderResult ni permite validar la exportación final.
- Exclusión con render, publicación, pósters y generación de proxy para preservar el techo de memoria existente. No se han cambiado límites ni instalado dependencias.
- 409 pruebas: 408 PASS en imagen sin Git; prueba Git 2/2 en host. Check PASS. Prueba audiovisual sintética con cortes, audio de 880 Hz en el intervalo esperado, caché/reinicio/cancelación y conservación del original. QA real móvil393×852 y escritorio1440×1000 con texto modificado visible; borrador persiste y exportación sigue bloqueada mientras hay cambios.
- Director privado 1.4.1 publicado y leído de nuevo: V1 asistida, Gemini para V1.1. La nueva versión conserva identidad, configuración, privacidad y ocho archivos; no se efectuó inferencia de pago.
- Recuperación preparada: v1-assisted-preview-qa-20261028/live-code-before.tgz, SHA256 50f417ab189d40a52e282135281da44c744e9675ef713879cce71562fcfe9d4b; 184 archivos comparados, restaurados y arranque/sesión/salud comprobados.

El vídeo final de revisión sigue siendo e5d48158-777e-4273-86ee-8970db623ab5. La valoración del propietario, escucha humana y aceptación de la calidad creativa siguen pendientes. Gemini no bloquea V1.

## Despliegue verificado de la continuación

Código 4497a0d aplicado a los diez archivos runtime diferentes, sin mezclar ramas ni alterar otros worktrees. Respaldo de estado JSON verificado; rollback del código anterior restaurado y arrancado antes de desplegar. Reinicio sin trabajos activos. HTTPS/sesión200, Range206 de 1024 bytes, 38 versiones con idénticos estados/fingerprints. Range permanente, Whisper y Desktop Commander activos; WhatsApp/Caddy intactos. Memoria de producción permanece1900MiB, OOMKilled=false.

Navegador público móvil393×852/tablet820×1180/escritorio1440×1000: fragmento540×960/4 s, texto editado visible, borrador conservado, exportación bloqueada, cero erroresJS, sin overflow y versión final sin modificar. Caché medida1,06/1,45/1,37 s. El primer render en producción tardó31,9 s. El ensayo de Chromium con techo artificial350MiB agotó el timeout de reproducción; la repetición de QA con900MiB pasó. No se aumentó memoria del editor.

Resultados privados: deploy-result.json, production-fragment-result.json y capturas production-*-fragment.png bajo v1-assisted-preview-qa-20261028. No se pulsó Validar ni se atribuye aprobación creativa a Carlos. El cierre técnico asistido queda disponible para su valoración final; Gemini es V1.1.
