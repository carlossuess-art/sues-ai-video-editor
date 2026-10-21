# SUES AI VIDEO EDITOR — INFORME TÉCNICO MAESTRO V2.0
**Fecha:** 21/10/2026
**Tipo:** especificación de producto, motor creativo y catálogo; **no** es una función ya instalada.
**Proyecto existente:** `carlossuess-art/sues-ai-video-editor` · `https://editor.suesholistics.com`
**Autoridad de continuidad:** Roadmap Maestro + `PROJECT_STATUS.md` de la rama oficial + estado real del VPS.
**Objetivo V1:** subir un vídeo real → escoger perfil → recibir edición inteligente → revisar y retocar → exportar MP4; Carlos debería necesitar solo 2–3 cambios menores.
## 0. Estado verificado y distinción fundamental
A fecha de consulta: servicio web del editor operativo, Whisper local activo, importación de planes externos JSON SUES, 13 SFX privados cargados y cuatro motions nativos invocables desde planes externos. Se han probado renders y navegación con material/visión de prueba; faltan Director LLM semántico completo, inferencia espacial para cualquier vídeo nuevo y aceptación creativa del flujo final. La Fase 6, Fase 9 y la V1 siguen abiertas. **Esta V2 amplía el diseño, no declara implementadas sus propuestas.**
Los **14 SFX de firma descritos más abajo son 14 objetivos semánticos**, no archivos ya existentes ni equivalen automáticamente a los 13 sonidos integrados. La asociación entre un identificador lógico y un fichero real exige escucha, procedencia, licencia, hash, metadatos y aceptación.
## 1. Visión editorial y prioridades
**Ambición:** calidad de montaje de autor, coherente, reconocible y premium; no prometer un valor monetario objetivo ni calidad cinematográfica por acumular efectos.
**Regla superior:** `sentido narrativo > inteligibilidad > seguridad y derechos > continuidad audiovisual > identidad de marca > espectacularidad > densidad de efectos`.
1. Conservar la intención, la voz y la identidad del sujeto. No inventar palabras, hechos, emociones ni escenas documentales.
2. Cada intervención debe tener una **razón observable**: palabra clave, cambio de argumento, pausa, gesto, entrada de B-roll, ruptura musical, comparación o transición espacial.
3. Es legítimo **no aplicar efecto alguno**. Ni los dos segundos ni el número de recursos constituyen un disparador automático.
4. Evitar borrar, tapar o alejar el rostro, subtítulos, ojos y elementos narrativos esenciales. Una tarjeta que ocupe la pantalla debe ser una elección editorial explícita.
5. Usar el mismo **motor visual maestro de referencia Keanu**, con intensidades configurables: DOPAMIN (alta), CALMA (aprox. mitad de densidad como punto de partida), y estructura ELEMENTS (LIST, RANKING, COMPARE, REVEAL, Q&A, FLOW), que puede combinarse con ambos estilos.
6. No fusionar identidad/estética de Sues Holistics con otros clientes: Brand Kit y contenidos por marca; motor compartido, proyectos aislados.
## 2. Representación de una escena: Director IA, no calendario de efectos
Para cada segmento narrativo, el análisis produce un **registro de evidencia**, no un resultado de edición aún:
- `startSec`, `endSec`, `transcript`, `wordTimestamps`, `asrConfidence`, `timingUncertain`.
- `narrativeRole`: `hook | setup | tension | evidence | turning_point | resolution | cta | pause`.
- `emotion`: etiquetas descriptivas `intrigue | solitude | disappointment | danger | serenity | revelation | hope | empowerment | joy | irony | resonance` o `unknown`.
- `energy`: 0–1; `intimacy`: 0–1; `semanticImportance`: 0–1; `emotionConfidence`: 0–1.
- `audio`: pausas, dinámica de voz, picos de sílaba, ambiente y música existente.
- `vision`: trayectoria de rostro/ojos, caja de sujeto, movimiento, estabilidad, fondo, zonas seguras, confianza y disponibilidad de máscara.
- `brand`, `profile`, `structure`, `targetPlatform`, `assetAvailability` y restricciones explícitas del usuario.
No diagnosticar el estado emocional real del hablante: la emoción es una **interpretación editorial del contenido** y admite `unknown`. Sin análisis visual fiable, no simular profundidad o seguimiento ocular. Con marcas temporales inciertas, evitar efectos sincronizados a una palabra exacta salvo confirmación.
### Selección de candidatos
Para cada instante significativo, el Director plantea *opciones*, con causa, confianza y coste:
`candidate = {time, kind, purpose, evidence, confidence, requiredCapabilities, requiredAssets, occlusionRisk, audibilityRisk, intensity, fallback}`.
El optimizador escoge una secuencia global, **no cada efecto de forma aislada**. Rechaza candidatos por incompatibilidad, derechos no verificados, colisión, saturación, exceso de procesado, memoria o baja confianza. Da prioridad al contraste editorial entre momentos tranquilos y momentos de impacto. No aplica efectos «de relleno» para alcanzar cuotas.
## 3. Música: suites coherentes, cuatro funciones narrativas
### 3.1 Modelo modular
Cada suite contiene stems separados, documentados y compatibles cuando se mezclan: `bed | pulse | tension | lift | resolution | accents`. Al catalogar: tonalidad (o `atonal`), BPM o libre, compás, puntos de sincronización, longitud, loop seguro, cola de reverberación, LUFS medidos, picos, licencia y compatibilidad de versiones. **No afirmar compatibilidad solo por coincidir en BPM**; revisar fase, armonía, dinámica y cortes de loop.
Los cuatro actos son **funciones opcionales de la narrativa**, no cuatro tramos obligatorios. Para una pieza de 50 s pueden orientarse inicialmente alrededor de 0–20 %, 20–50 %, 50–88 % y 88–100 %, **pero los límites se desplazan a los eventos detectados**. Una narración contemplativa puede tener solo dos actos. Los reencuadres musicales se sincronizan con silencios reales, entradas y frases, jamás con un reloj fijo.
| Función | Recursos candidatos | Control editorial |
|---|---|---|
| Inmersión / gancho | drone discreto, piano felt, pulso medido | Empezar con contraste o silencio si ya hay gancho visual/voz |
| Compresión / conflicto | cello sul ponticello, ostinato, riser selectivo, low-pass progresivo | No cubrir consonantes ni aplicar 400 Hz a la voz; evitar tensión falsa |
| Giro / revelación | micropausa de **música**, reverse swell, apertura armónica, cuerdas | Jamás silenciar una palabra; pausa de 0,2–0,8 s solo si el discurso la permite |
| Huella / resolución | nota sostenida, piano/cuenco, caída de densidad | Preservar inteligibilidad del CTA; dejar resonancia dentro de duración final |
**Binaural:** un pulso binaural solo es perceptivamente pertinente con auriculares y requiere dos señales. Un subgrave 50–80 Hz **no equivale** a audio binaural; en móvil puede desaparecer. Usar armónicos audibles y comprobar mezcla mono. **Shepard tone** es un recurso de tensión excepcional, nunca una obligación.
### 3.2 Doce estados de búsqueda de música
El catálogo admite las etiquetas de origen siguientes; son búsquedas/roles, **no doce pistas ya incorporadas**:
| Tag lógico | Rol |
|---|---|
| `INVESTIGATIVE_PIZZICATO_LOOP` | intriga |
| `STACCATO_STRING_HIT` | sorpresa |
| `LONELY_CELLO_FELT_PIANO` | soledad o vacío |
| `DESCENDING_SAD_PIANO` | decepción |
| `TICKING_TENSION_OSTINATO` | tensión |
| `SOFT_FELT_PIANO_AMBIENT` | calma |
| `SHIMMERING_SYNTH_SWELL` | revelación |
| `HOPEFUL_INDIE_GUITAR_BUILD` | esperanza |
| `HEAVY_STOMP_DARK_PHONK` | empoderamiento |
| `UPBEAT_LOFI_JOY` | alegría |
| `QUIRKY_JAZZ_BASSLINE` | ironía |
| `SUSTAINED_AMBIENT_OUTRO` | cierre |
La IA puede elegir *ninguna* de esas etiquetas si el discurso no las justifica. Se pueden superponer dos estados si hay continuidad armónica y la mezcla lo permite.
## 4. Identidad sonora: 14 identificadores lógicos de firma
Estos IDs **reservados** sirven para localizar, aprobar y colocar sonidos reales. Estado inicial: `planned/unmapped`; no inventar archivos ni reutilizar indiscriminadamente sonidos de Creator Club bajo otro nombre.
| Familia | ID | Disparador recomendado |
|---|---|---|
| Atención | `SFX_SIGNATURE_CHIME` | Inicio ritual o idea inaugural *si procede* |
| Atención | `SFX_MATCH_STRIKE` | Encendido de una idea |
| Atención | `SFX_SUB_WHOOSH` | Transición de peso dramático |
| Retención | `SFX_TEXT_SNAP` | Aparición tipográfica breve |
| Retención | `SFX_CHARCOAL_SCRATCH` | Subrayado con trazo |
| Retención | `SFX_UI_GLASS_POP` | Icono o dato interactivo |
| Retención | `SFX_CLOTH_WHOOSH` | Movimiento orgánico |
| Emoción | `SFX_SUCKBACK` | Preparación de giro narrativo |
| Emoción | `SFX_VINYL_BRAKE` | Error o ironía |
| Emoción | `SFX_HEARTBEAT` | Suspense íntimo específico |
| Emoción | `SFX_BREATH_INHALE` | Respiración expresiva compatible con la grabación |
| Emoción | `SFX_GLASS_PING` | Comprensión o microrevelación |
| Cierre | `SFX_OUTRO_PIANO` | Resolución musical |
| Cierre | `SFX_EARTH_DROP` | Impacto final justificado |
La identidad sonora no exige usar los catorce sonidos en cada vídeo. SFX, música, voz y sonido natural pasan por buses separados con ducking ajustado a voz, fades y prevención de clipping. Actualmente el editor acepta SFX por `resourceId` **real**, segundo inicial y ganancia con límites del motor; la asignación `alias → resourceId` solo será ejecutable después de validarla.
### Mezcla, medición y QA
- Medir el **programa completo** en LUFS integrados y el true peak en dBTP. «-14 LUFS para textos» no tiene significado técnico: el texto es visual; su SFX se equilibra por contexto y dinámica, no por un LUFS global fijo por disparo.
- Punto de partida **configurable**, no garantía universal de plataforma: mezcla final aproximada entre **-16 y -14 LUFS integrados**, true peak **≤ -1 dBTP**; mantener voz prioritaria, sin compresión destructiva.
- Música preferentemente entre **12–20 dB por debajo de la voz** durante habla como punto inicial a escuchar, no un parámetro universal. Atenuación variable según tipo de música/voz; verificar en altavoz de móvil y auriculares, también en mono.
- Detectar distorsión, solapamientos de SFX, picos y silencios inesperados; registrar informe de loudness y escucha humana cuando se busque aceptación creativa.
Referencia de medida: ITU-R BS.1770-5; FFmpeg `loudnorm`/`sidechaincompress` son herramientas disponibles, no evidencia de que este pipeline ya esté configurado a esos valores.
## 5. Cámara y profundidad 2.5D: efectos condicionados a geometría real
**Regla de activación:** usar efectos detrás, delante o sobre el sujeto **solo** cuando existan trayectoria/máscara comprobadas y los bordes sean aceptables en fotogramas consecutivos. En ausencia de segmentación válida, degradar de forma explícita a composición 2D segura; no fingir una rotoscopia.
- `PROGRESSIVE_RACK_FOCUS`: intensidad 0–1 convertida en radio de blur según resolución, con rampa de entrada/salida, máscara del sujeto y límite visual. El «10 % → 85 %» del texto original no es una especificación ejecutable de desenfoque; se sustituye por radio de píxeles y sigma parametrizados y evaluados visualmente.
- `BACKGROUND_EXPOSURE_DIMMER`: hasta ~0,3 EV negativos iniciales *como propuesta*, no «oscurecer siempre 30 %»; proteger piel y evitar bordes luminosos en máscaras.
- `ANAMORPHIC_BOKEH`: overlay condicionado a luces existentes; no fabricar brillos enormes sobre ojos o captions.
- `MIST_GLOW`: bloom sobre altas luces medido/limitado; mantener detalle en piel y ojos, no blanquear sujeto.
- `GOD_RAYS_DUST`: partículas en plano ambiental coherente con iluminación y movimiento; oclusión correcta. Si no hay profundidad fiable, no dibujarlas atravesando el rostro.
- `LUT_COLD_ISOLATION` / `LUT_WARM_AWAKENING`: estados visuales disponibles, **no obligación conflict→azul / solución→ámbar**. Mezcla limitada, continuidad de exposición, tonos de piel preservados y revisión en móvil.
- Cámara virtual: ancla a ojos/rostro con dead zones, aceleración y límites suaves; nunca seguir un solo frame inestable ni tapar safe zones.
La sensación de anamórfico, niebla óptica o luz volumétrica es **simulación artística**; no declarar que se filmó con una lente o iluminación real.
## 6. Motion graphics, tipografía y microestímulos
**Sistema tipográfico de base:** se conserva **Montserrat** y las decisiones documentadas del Brand Kit/Keanu. Las siguientes son **candidatas futuras** y no reemplazos globales automáticos:
- Titular: Montserrat Black / Bebas Neue (solo si archivo y derecho de uso aprobados).
- Énfasis editorial: Instrument Serif Italic, cuando no rompa la coherencia.
- Anotación humana: Caveat / Permanent Marker.
- Datos/código: JetBrains Mono.
Las escalas de subtítulo ya definidas por el proyecto (14/12 y jerarquía de énfasis) prevalecen; no reinterpretarlas a partir de este informe. Cualquier fuente necesita licencia, precarga/subsetting, soporte de caracteres y prueba de legibilidad en 9:16.
`cubic-bezier(0.16,1,0.3,1)` es una **curva orientativa** para animaciones rápidas, no el valor obligatorio de toda transición. El tratamiento «12 fps documental» afecta solo al elemento vintage, **no** al vídeo o a la locución. Aberración cromática, grunge y sombras ovaladas deben tener controles de intensidad y función narrativa.
**Política de densidad:** primero identificar eventos significativos; después aplicar un presupuesto de estímulos por perfil como **límite**, nunca colocar algo exactamente cada dos segundos. Alternar movimiento y reposo; un silencio visual puede ser el punto de mayor retención.
## 7. Biblioteca metafórica de B-roll y texturas
Clases de búsqueda:
- `ARCHIVAL_VINTAGE_4_3`: laboratorio, cine científico, televisión/archivo monocromo. Exigir fuente y derechos reales, época y contexto; no presentar vídeo sintético como documento histórico.
- `TACTILE_MACRO`: tinta en agua, hielo, fuego, pupilas, polvo, manos. Relación semántica clara; evitar imágenes de enfermedad/miedo por automatismo.
- `ANALOG_TEXTURE`: CRT 5 % como punto de inicio, scratches/grano adaptados a imagen y al texto; no degradar todo el metraje.
- `BRAND_NATURE_RETREAT`: naturaleza y actividades propias de Sues Holistics, cuando correspondan y con consentimiento/derechos.
Cada candidato debe incluir duración, frame rate, resolución, orientación, alpha, zonas de interés, información de licencia y compatibilidad con el plano. No descargar recursos de internet ni generar material con servicios de pago sin autorización. Usar Drive como laboratorio, y el almacén privado de recursos aprobados como fuente ejecutable.
## 8. Contrato de metadatos de recursos
Cada recurso se registra como `discovered → verified → converted → integrated → approved` (o `rejected`) y nunca se considera *ejecutable* por solo estar descargado.
Campos mínimos:
- **Identidad:** `assetId`, `logicalAlias`, `sha256`, `version`, `kind`, `origin`, `originalFilename`, `privateStorageRef`.
- **Derechos:** `rightsStatus`, `licenseType`, `commercialUseAllowed`, `attribution`, `restrictions`, `proofRef`, `reviewedBy`, `reviewedAt`.
- **Técnica:** duración, resolución, fps, codec, canales, sample rate, alpha, tonalidad/BPM, loudness/true peak si aplican.
- **Semántica:** `narrativeRoles`, `emotionTags`, `energyRange`, `intimacyRange`, `visualMotifs`, `platformCompatibility`, `profileCompatibility`.
- **Reglas de colocación:** `requiredCapabilities`, `safeZonePolicy`, `faceExclusion`, `maxIntensity`, `minInterval`, `simultaneityLimit`, `fallbackAlias`.
- **Evidencia:** `previewRef`, `testReportRef`, `approvedForProduction`, `knownLimitations`.
**Alias** es un nombre legible. **Asset ID** y **hash** resuelven la entrada privada exacta; nunca insertar en un plan real un placeholder o ruta arbitraria. La lógica consulta disponibilidad, derechos y capacidades antes de proponer el recurso.
## 9. Arquitectura lógica y contrato entre módulos
Flujo propuesto sin sustituir servicios existentes:
1. **Ingesta**: fuente inmutable y hash, formato, autorización, perfiles y briefing.
2. **Análisis**: Whisper/transcripción y marcas temporales; visión/ojos/seguimiento cuando esté disponible; audio, pausas y estructura.
3. **Director IA**: produce `director-intent/v2` **interno, no ejecutable**, con beats, razones, confianza, intensidad y recursos deseados.
4. **Capability resolver**: cruza intención con motor real, derechos y catálogo; reporta `supported`, `degraded`, `blocked`, nunca inventa funciones.
5. **Compilador**: convierte solo operaciones compatibles al contrato **actual** `sues-edit-plan/v1` con `sourceSha256` y IDs verdaderos; futuras extensiones requerirán contrato/versionado y tests.
6. **Preview/render**: compositor y audio existentes, render cloud/FFmpeg, versionado, deshacer y exportación verificada.
7. **QA y realimentación**: métricas técnicas + revisión creativa + correcciones que mejoran futuras reglas, sin entrenar ni enviar medios sin autorización.
No cambiar el contrato de producción para acomodar un JSON bonito. `director-intent/v2` y el ejemplo del archivo de prompt **no se deben pegar en la pantalla actual de «Ya tengo un plan»**: esa pantalla admite el contrato `sues-edit-plan/v1` y operaciones que figuran en su catálogo real.
### Ejemplo conceptual, NO ejecutable en producción
```json
{
  "schema": "director-intent/v2",
  "sourceSha256": "<HASH_REAL_DEL_VIDEO>",
  "profile": {"visual": "DOPAMIN", "intensity": 0.75, "structure": null},
  "beats": [
    {
      "startSec": 8.5,
      "endSec": 12.2,
      "narrativeRole": "turning_point",
      "emotion": "revelation",
      "confidence": 0.88,
      "evidence": ["emphasis_on_phrase", "pause_before"],
      "candidates": [
        {
          "kind": "music_lift",
          "logicalAssetAlias": "SHIMMERING_SYNTH_SWELL",
          "requiredCapabilities": ["music_stems"],
          "reason": "Cambio de tesis después de una pausa",
          "fallback": "subtle_gain_automation"
        }
      ]
    }
  ]
}
```
La estructura anterior es propuesta para ingeniería; `music_stems` no se considera implementado hasta que se compruebe y pruebe. El componente de ejecución debe rechazar cualquier evento sin correspondencia certificada.
## 10. Criterios de seguridad, accesibilidad, rendimiento y calidad
**Bloqueos obligatorios:**
- Original y versiones anteriores intactos; la ejecución no escribe parcialmente si el plan es inválido.
- Procedencia, consentimiento y licencia comercial verificados; si falta prueba, no usar en producción.
- Rostro/sujeto y captions legibles en los fotogramas críticos; tolerancias por plataforma, no una plantilla de safe zones universal.
- No superar **tres flashes por segundo**; evitar secuencias de destellos intensos incluso por debajo del umbral cuando sean innecesarios.
- Voz íntegra, sin SFX que oculten palabras, sin picos verdaderos por encima del límite configurado; no cortar respiraciones intencionadas sin criterio.
- Procesamiento limitado por memoria y timeout real. Con el VPS actual de un vCPU y 4 GB RAM, tareas pesadas de segmentación/visión deberán programarse o delegarse a un worker compatible; no asumir GPU.
- Un vídeo con solo Whisper no habilita automáticamente máscaras, seguimientos faciales ni capas detrás del sujeto.
**Aceptación técnica:** tests de esquema y reglas, revisión de catálogo/derechos, frame sampling por keyframes/oclusiones, MP4 completo decodificable, sincronización captación/voz/captions, mezcla medida, recursos/fuentes intactos, hashes correctos, navegador móvil y escritorio y rollback disponible.
**Aceptación creativa:** comparación humana contra referencia Keanu y perfil seleccionado: narrativa clara; pocos efectos gratuitos; cámara estable; captions legibles; sincronía de SFX; música emocionalmente coherente. Criterio V1 explícito: «cambiaría dos o tres cosas, pero el vídeo prácticamente está». **Una prueba automatizada PASS no equivale a superar esta aceptación.**
## 11. Hoja de implementación incremental (sin rehacer el editor)
| Orden | Entrega concreta | Fase del roadmap | Criterio para avanzar |
|---|---|---|---|
| 1 | Catalogar los 13 SFX reales; mapear solo los aliases compatibles, identificar los 14 lógicos aún no disponibles | F6 | Inventario con hashes, licencias, escucha y IDs reales |
| 2 | Incorporar metadatos semánticos y prioridades al banco de recursos existente, no crear otro sistema de almacenamiento | F6 | Selector devuelve recursos verificables o `unavailable` |
| 3 | Conectar beats narrativos a cuatro motions actuales y SFX temporizados, via planes válidos | F6/F7 | Prueba semántica sin efecto inventado; fallback explícito |
| 4 | Analizar rostro, zonas seguras y posibles máscaras en nuevos vídeos sin degradar la voz/exportación | F4/F7 | Fallos de confianza generan composición segura |
| 5 | Ampliar el compilador por capacidades auditadas: cortes semánticos, otros motions, automatización musical/stems, LUTs, profundidad | F6/F7 | Cada operación nueva con renderer, tests y contrato versionado |
| 6 | Obtener un vídeo real de DOPAMIN y otro CALMA con idéntico bruto, comparar calidad y costes, ajustar reglas | F9 | Aprobación creativa humana del flujo completo |
| 7 | Cerrar V1 con ajustes, exportación y pruebas web/VPS; documentar consumo y rollback | F9/F10 | Solo retoques menores y todo reproducible |
**Costes:** primero reutilizar código/VPS/recursos, después open source, después PAYG autorizado; sin activar APIs de pago ni licencias de recursos automáticamente.
## 12. Instrucción maestra para el Director IA
> Actúas como **Director Cinematográfico IA de SUES**. Analizas texto, prosodia, pausas, rostro, encuadre, ritmo y permisos reales antes de decidir. Tu objetivo es una edición coherente y emocionalmente precisa, no producir la máxima cantidad de efectos. Establece beats narrativos y sus evidencias; elige música, SFX, composición, cámara y captions solo cuando mejoren la intención. Respeta la identidad SUES y el perfil DOPAMIN/CALMA/ELEMENTS. Nunca ocultes la voz, el sujeto ni los subtítulos esenciales. Solo propones assets existentes, aprobados y compatibles; si no existen, devuelves ausencia/fallback, jamás un recurso inventado. Distingue intención editorial de operación ejecutable. Nunca afirmes que un efecto se ha renderizado sin resultado real. Genera planes trazables, deterministas, validados y reversibles, listos para que el motor compruebe cada capacidad. Si la mejor decisión es no hacer nada, mantén la escena limpia.
## 13. Referencias técnicas de implementación
- ITU-R BS.1770-5 — método de medición de loudness y true peak: https://www.itu.int/rec/R-REC-BS.1770-5-202311-I
- FFmpeg Audio Filters — `loudnorm`, `sidechaincompress`: https://ffmpeg.org/ffmpeg-filters.html
- W3C WCAG 2.2, 2.3.2, tres flashes: https://www.w3.org/WAI/WCAG22/Understanding/three-flashes.html
- Proyecto: https://github.com/carlossuess-art/sues-ai-video-editor
- Roadmap: https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit
---
**CONTROL DE CAMBIOS — V2.0:** actos musicales dinámicos; separación LUFS/ganancia; binaural corregido; 14 alias propuestos separados de 13 archivos reales; segmentación y LUTs condicionados a evidencia; no efectos cada 2 segundos; capa de intención desacoplada de `sues-edit-plan/v1`; licencias, seguridad, rendimiento, QA y despliegue por fases. No se ha modificado producción, ni se han añadido recursos mediante este documento.
