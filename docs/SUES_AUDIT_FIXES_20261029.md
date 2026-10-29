# Correcciones de auditoría · 29/10/2026

Base: 6a64e8871a3870c79a13ec3d3f997aade613aa06. Rama fix/audit-closure-20261029.
Repositorio existente carlossuess-art/sues-ai-video-editor. Dominio editor.suesholistics.com.
Clon/HeyGen excluido; ninguna llamada cloud ni proveedor de pago.

## Cambios

- A01: el control DOPAMIN/CALMA proyecta intervalos al reloj final tras postEdit;
  desaparecen apoyos borrados y se desplazan los onsets supervivientes. Un sonido
  cuya entrada se borró no recibe un onset inventado por conservar parte de su cola.
  Conteos por recurso original: partirlo en varios segmentos no multiplica B-rolls.
  La regla 60–75s utiliza la duración de salida. Fuente y ajustes no se modifican.
- A02: recuperación selectiva de resolveBrollConflicts. El contrato vigente conserva
  edit-timeline y timelineFingerprint. Ambas sustituciones requieren true explícito;
  revisión atómica, motivos y resumen de eliminaciones, nueva versión con padre intacto.
  En Ajustar se añaden opciones explícitas para B-roll y zoom; nuevo acceso Añadir
  visible junto a categorías para B-roll, imágenes y sonido también en móvil.
- A03: actualizador rechaza identidad basada solo en HEAD. Una release con archivos
  seguidos modificados necesita checkout nuevo aunque HEAD coincida. Se verifican
  también los archivos del checkout candidato. Conserva copia del estado y contenedor
  previo para reversión; no cambia proxy, DNS ni aplicaciones ajenas.
- Incidencia descubierta en suite: la firma de integridad de medios en vivo usaba
  milisegundos decimales, insuficientes para escrituras muy próximas. Ahora emplea
  dispositivo/inodo/tamaño/mtimeNs/ctimeNs, sin perder caché de archivos sin cambios.
- Script reutilizable de refresco Creator Club: incorpora metadata sin aprobar
  recursos ni borrar decisiones del propietario. Inventarios privados fuera de Git.

## Validación anterior a publicación

423/423 pruebas runtime en contenedor; 2/2 deploy-service en host. Actualizador:
13/13 pruebas Python; refresco catálogo:2/2. Check de sintaxis y diff sin errores.
La primera suite dio422/423 por la incidencia de timestamps arriba descrita; la
repetición completa tras corregirla dio423/423. No ocultar ese hallazgo.
Chromium móvil393x852 y escritorio1440x1000: rechazo sin optar por reemplazo,
sustitución explícita, ajustes enviados y padre sin cambios; sin errores JS.
Regresiones del guard: borrado de apertura, cola sonora, remapeo de onsets,
intervalos partidos, huecos y cruce del umbral de duración. Pruebas del contrato
comprueban atomicidad, opciones booleanas y rechazo de fingerprint antiguo.

## Inventario preparado

Catálogo privado:2.064→3.390 fichas con1.326 IDs nuevos del banco actual. Se preservan
íntegras las2.064 fichas y exclusiones anteriores;738 candidatos de vídeo elegibles
siguen exactamente iguales. Los nuevos son metadata, no recursos aprobados.
Se preparó además un lote pequeño de20 selecciones de SFX con descarga, hash,
FFprobe, decode completo y medición de volumen; existen aliases/duplicados de bytes.
Importación final, conteos y resultados de producción se registran al desplegar.
No atribuir escucha subjetiva a la medición técnica ni licencias individuales auditadas.

## Evidencia y siguiente trabajo

Evidencia privada /opt/sues-video-setup/audit-full-20261029: fixes-suite-final.log,
fixes-git-tests.log, fixes-updater.log, manual-conflict-ui-result.json,
audited-drive-refreshed.json, new-sfx-prepared.json y new-intake/.
Prueba de subida nueva utiliza un fragmento de12s del original con hash nuevo,
Whisper base/int8 real, CALMA y borrado2–3s en entorno aislado; no confundirla con
DOPAMIN completo ni aceptación creativa. El resultado de ejecución se conserva allí.

Siguen pendientes la paridad universal de controles de gráficos/motions, preview
instantáneo de todas las capas, trayecto musical multisegmento, revisión audiovisual
completa del banco y recuperación general de MODNet/cámara en fuentes nuevas.
La aceptación creativa corresponde a Carlos. Gemini completo sigue V1.1; clon separado.
No usar este bloque para declarar V1 terminada. Producción solo se afirma tras smoke
HTTPS, Range, hashes de proyectos, release coherente y prueba de reversión.
