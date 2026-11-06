## COMPROBACIÓN DEL ORIGINAL REAL · 06/11/2026

El original del Reel 158404 identificado por SHA256 `9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad` se comprobó en modo de solo lectura con el detector de fuente real. Tiene 1080×1920 y audio; el detector lo bloqueó como `SOURCE_NOT_FRAME_ALIGNED_CFR30` desde el fotograma 1. No se ha modificado ni convertido.

Para una prueba integral con este original hace falta integrar o preparar una derivación CFR30 verificable y editable, registrar su linaje y el mapa temporal respecto al original, comprobar sincronía de audio y volver a revisar/aprobar el plan sobre esa versión. No cambiar silenciosamente la fuente ni atribuir a esta comprobación una aceptación creativa. No se generó un Reel.

## REGRESIÓN DE EXPORTACIÓN PRIVADA · 06/11/2026

Tras conectar MP4 1080, suite de Master Director en host: 181 PASS, 0 FAIL, 6 SKIP de 187. Los seis omitidos dependen de FFmpeg o runtime de máscaras; no se ejecutaron en esta pasada. Pruebas dirigidas de exportación, API y journal 21/21, más 10/10 de memoria y renderer; flujo mixto simulado extremo a extremo y navegador simulado a 1440 y 390: descarga del archivo privado comprobada para ambos flujos con contenido ficticio y nombre esperado; no se ha comprobado la descarga en dispositivos reales. La salida real 1080 de seis fotogramas fue sintética, no Reel de aceptación. Sin despliegue.

## MP4 1080 PRIVADO PARA REVISIÓN · 06/11/2026

La rama permite pedir un MP4 1080×1920 privado para revisión desde los flujos Remotion y mixto nativo→Remotion ya admitidos. Se conserva el plan, la aprobación y las versiones editables; el archivo queda sellado, sujeto a auditoría técnica de identidad/decodificación y marcado **no final**. La interfaz permite descargarlo; no constituye publicación ni aceptación creativa. Solicitudes 270p y 1080 tienen claves independientes e inmutables, y el historial indica su calidad. Combinaciones mixtas cuyo orden no puede representarse y máscaras no verificadas continúan bloqueadas.

La opción 1080 mantiene al menos 1 GiB libre observado en host y cgroup durante el trabajo, además de los controles anteriores; el servicio puede rechazarla o detenerla ante memoria insuficiente. No se ha activado en producción. Commit de integración `3575d7a7dc973880618906c87b4639efe79c974e`.

Pruebas dirigidas 21/21; flujos HTTP y navegador simulado de ambos motores en escritorio y móvil con workers ficticios; salida Remotion real sintética de seis fotogramas con vídeo, audio y capa de imagen auditada a 1080×1920. En esa prueba real se usó un contenedor aislado con límite de 1,8 GiB y se sustituyó el detector de memoria por una función de prueba: no demuestra estabilidad de un Reel largo ni de la salvaguarda predeterminada. Una segunda comprobación de los mismos seis fotogramas, en un contenedor aislado con límite de 2,2 GiB y la salvaguarda real activa, también produjo MP4 1080 con auditoría técnica PASS; píxeles de fuente y capa superpuesta coincidieron con el montaje sintético. No acredita estabilidad ni capacidad para un Reel largo. No se ha ejecutado aún un plan maestro completo sobre Reel real ni se ha aceptado V1.

## ÚLTIMA REGRESIÓN DIRIGIDA · 06/11/2026

Tras los cambios de tiempo, encuadre y supervisión: `node --test tests/master-director-*.test.js` en host, 178 PASS, 0 FAIL, 6 SKIP. Cuatro pruebas omitidas se ejecutaron por separado con FFmpeg aislado: etapa nativa+handoff, render nativo de lista, extracción de evidencia y estéreo en contrafase; todas pasaron sobre material sintético. Las dos omitidas de generación local de máscaras no se repitieron en este corte. Los conteos proceden de entornos distintos, no son una única pasada integral verde. No equivalen a aceptación con Reel real.

## COMPROBACIÓN DE AUDIO SOBRE REEL EXISTENTE · 06/11/2026

Se aplicó el nuevo medidor únicamente al audio de la previsualización real V6B existente (vídeo SHA256 `60642ab2e03fffc24d4704b13320e812d9a1182004cde0f214340e835639a64b`), sin modificarla ni crear otro Reel. El WAV convertido tiene 70,016 s, pico de muestra normalizado 0,7032 y cero muestras por canal en el umbral de 32760/32768; WAV temporal SHA256 `97bbcfdffddbd07da87274325068890aca755d8f19aa14662387f78b40ef01b2`. Estas medidas no son true peak, no prueban calidad de mezcla ni sustituyen escucha. **No es una ejecución de un plan externo nuevo, una auditoría semántica ni aceptación V1.**

## MEDICIONES OBJETIVAS DE AUDIO · 06/11/2026

El supervisor calcula por canal y por segundo el pico y el RMS del WAV estéreo convertido, además de muestras próximas al límite digital. Se muestra como medición orientativa, sin tratarla como escucha, revisión semántica, garantía de ausencia de distorsión ni aprobación. El WAV se valida estructuralmente, se compara con su propio SHA antes y después de la comprobación de aprobación, y las medidas quedan en el manifiesto vinculado al SHA exacto de salida.

Pruebas 6/6 con FFmpeg aislado, incluida señal en contrafase, archivo hasta 120 s simulado, WAV truncado y cambio de evidencia durante la aprobación; navegación simulada escritorio/móvil mostró las medidas sin errores. No hay supervisor audiovisual semántico completo ni aceptación de Reel. Sin despliegue.

## AUDIO DE SUPERVISIÓN ESTÉREO · 06/11/2026

La extracción de evidencia de audio ya no mezcla sistemáticamente a mono: prepara WAV estéreo PCM de 48 kHz, informa de su conversión y amplía el límite para los 120 segundos permitidos. La conversión puede mezclar fuentes multicanal y no equivale a los bytes originales; sigue siendo una muestra para escucha, no un dictamen de calidad.

Prueba real FFmpeg con audio estéreo sintético en contrafase: ambos canales se conservaron en vez de cancelarse al sumar a mono. Las tres pruebas del módulo pasaron en contenedor con FFmpeg; se verificó aparte con un fixture el límite de 120 segundos. El supervisor audiovisual semántico y las dos auditorías siguen pendientes. Sin despliegue.

## AJUSTE DE IMAGEN Y VÍDEO EN REMOTION · 06/11/2026

El plan externo puede elegir `fit:"fill"`, `"contain"` o `"cover"` en recursos `image-exact` y `video-exact`, con encuadre centrado: estirar, ajustar dejando transparencia o recortar. Se conserva el valor en compilación y render; no se admite anclaje personalizado. El editor permite cambiarlo y guarda una nueva versión que exige revisión y aprobación renovadas. Contrato actualizado y skill privada 1.5.6 sincronizada sin tocar producción.

Pruebas tras el cambio: 37/37 de compilación/almacenamiento/staging/revisión híbrida, TypeScript sin errores y navegador simulado escritorio/móvil con persistencia de `cover` y nueva aprobación. La prueba general existente de revisión/edición también pasó en ambos tamaños. Fotogramas sintéticos Remotion de imagen con contain y cover y vídeo con cover comprobaron por píxeles el ajuste, transparencia y recorte. Esto no acredita movimiento completo, contain en vídeo, máscaras combinadas, Reel real ni QA creativa. Sin despliegue ni gasto.

## FIDELIDAD TEMPORAL Y ORDEN EN MOTOR MIXTO · 06/11/2026

Se detectó que el worker nativo → Remotion colocaba siempre las capas Remotion por encima del resultado nativo. Una transición nativa que afecta a toda la composición podía solaparse con un texto Remotion y quedar aplicada solo al vídeo de debajo, alterando el plan. La revisión ahora bloquea los solapamientos de transición, gráfico o subtítulo nativo con capas Remotion cuando el orden visual no está representado. En la interfaz se explica el motivo. El bloqueo evita una edición incorrecta; **aún no implementa esa composición**.

El grafo conserva además `startTime`/`endTime` exactos junto a los fotogramas. El análisis mixto compara los segundos originales para no perder un solapamiento real por redondeo, y rechaza tiempos ausentes o incompatibles. Las operaciones que no solapan mantienen la vía nativa → Remotion existente.

Pruebas: regresión dirigida `tests/master-director-*.test.js`: 174 PASS, 0 FAIL, 5 SKIP (host sin FFmpeg). Una de esas cinco, el render nativo sintético y handoff autenticado, se ejecutó con FFmpeg aislado: 1/1 PASS tras este cambio. Los cuatro restantes no se ejecutaron en esta pasada. La prueba del render nativo es sintética y no constituye un Reel real, validación visual final ni exportación MP4 aprobada. No se ha desplegado.

Siguiente trabajo: implementar la composición fiel para solapamientos bloqueados, el circuito de revisión y aplicación de máscaras, supervisor audiovisual independiente y exportación; después realizar la prueba integral autorizada con un Reel real y las dos auditorías. La generación de planes local sigue aparcada por decisión de Carlos.

## DECISIÓN DE ALCANCE V1 · 06/11/2026 · PRIORIDAD DE CARLOS

**La skill SUES AI Film Director (ChatGPT + supervisión de Carlos) es la fuente inicial de planes de edición.** Se congela la mejora del generador de planes con modelo local: queda opcional, desactivado y fuera de la ruta crítica de la V1. No es requisito demostrar que Qwen/llama.cpp produzcan un plan creativo autónomo. No retirar las salvaguardas de validación ni eliminar el código existente.

**Ruta crítica obligatoria:** plan de la skill en `sues-master-story/v1` → importación maestra autenticada sin pérdida → revisión de reglas/capacidades/recursos y aprobación → ejecución fiel de operaciones nativas y Remotion con handoff de capas verificable → máscaras con evidencia y aprobación → preview y corrección manual → exportación MP4 → supervisor audiovisual de imagen+audio, correcciones y dos auditorías independientes → aceptación con Reel real → despliegue controlado.

**Primero cerrar todos los módulos que consumen y ejecutan el plan externo.** El supervisor audiovisual y la verificación de máscaras sí son parte del objetivo. No convertir la ausencia de proveedor IA local válido en bloqueo del desarrollo ni de la prueba extremo a extremo. La vía de generación automática queda para una etapa posterior.

**Próximo trabajo de código:** comprobar en HEAD de rama la importación, revisión, persistencia y ejecución del plan maestro de la skill; identificar la primera pérdida de información/bloqueo no justificado y corregirlo con pruebas. Después cerrar el worker de la etapa nativa y el handoff hacia Remotion, antes de ampliar efectos y pasar a QA creativa. Este cambio de prioridades no constituye implementación, QA ni despliegue; progreso oficial conservado 55 % ±10 puntos.

## BORRADOR IA LOCAL OPCIONAL · 06/11/2026

En rama se añadió un proveedor opcional para llama.cpp/Qwen3 local, conectado al mismo endpoint y revisión de `sues-master-story/v1` que la entrada pegada. Desactivado si falta configuración privada; no aprueba ni ejecuta. Binario y modelo fijados por SHA, concurrencia uno, límites de entrada/salida y tiempo; no habilitado en producción. Manual y límites: `docs/SUES_MASTER_LOCAL_GENERATOR_20261106.md`. Commits principales `17e099d7aa4cf60de4f5acd4864d198b108555fd`, `d92a0330c8efb928bd065f192394786ec2e7e50e` y posteriores.

Pruebas dirigidas 16/16 PASS, más 2/2 tras desactivar expresamente el desplazamiento de contexto. En contenedor sin red, llama.cpp y Qwen3 0.6B existentes produjeron un JSON sintético con las siete claves maestras. Una segunda prueba HTTP autenticada recibió 201 y guardó un borrador, pero la revisión lo BLOQUEÓ por campos no representados y contexto de prueba incompleto; no hubo render ni aprobación. Un intento posterior con gramática de raíz estricta agotó el límite de 300 s y devolvió HTTP 422; se revirtió esa restricción. La revisión existente sigue bloqueando campos no representados. El modelo pequeño no ha demostrado producir un plan apto. No hay evidencia de que el modelo pueda producir planes creativos válidos o completos.

Pendientes aislamiento de memoria/red/dependencias antes de uso real, evaluación de modelos y calidad; además de revisión y promoción fiable de máscaras, supervisor audiovisual semántico y ejecución fiel integral. No se ha desplegado ni creado un Reel.

## MÁSCARA VERIFICADA CON ACABADO ESTÁTICO · 05/11/2026

La rama admite en Remotion una máscara alfa verificada combinada con **una** sombra estática o **un** resplandor estático: la máscara afecta a la capa interior y el filtro se aplica después a su silueta. No permite sombra y resplandor simultáneos. La evidencia sigue ligada a la fuente, intervalo y recursos acreditados; no se promocionan candidatos automáticamente. En ejecución mixta se mantiene el bloqueo de máscaras sin evidencia de la fuente derivada.

Validación acotada: 12/12 pruebas del compilador y TypeScript sin errores. Dos fotogramas sintéticos de una imagen con máscara cambiante y sombra azul sin desenfoque han confirmado por píxeles que la sombra sigue la silueta y no queda recortada por la máscara. Esto no certifica vídeo, texto, resplandor combinado, calidad de segmentación ni QA artística. La skill privada se sincronizó a 1.5.5; no implica despliegue.

**Regresión general del 05/11:** en el host, `npm test` produjo 585 aprobadas, 24 fallidas y 6 omitidas de 615; las 24 fallidas requerían FFmpeg, ausente del PATH del host. La repetición selectiva de esos 24 casos en un contenedor aislado con FFmpeg obtuvo 24 aprobados y 0 fallidos. Son dos entornos y seis casos permanecen omitidos en la pasada general; no presentan una única ejecución integral verde.

Siguen pendientes, entre otros, un generador de planes IA operativo configurado, revisión y promoción fiable de máscaras y supervisión audiovisual semántica autónoma. No se han creado Reels nuevos ni desplegado producción.

# SUES MASTER DIRECTOR · CHECKPOINT ACTIVO ÚNICO

**Última actualización verificada:** 2026-11-05. **Estado:** EN DESARROLLO, sin despliegue. **Progreso global estimado: 55 % ±10 puntos** de la misión completa (estimación humana; NO deriva del número de tests, commits o funcionalidades contadas).

## RESPLANDOR ESTÁTICO · 05/11/2026

- Añadido `visual.glow:{color,radiusPx}` opcional en capas Remotion de texto/imagen/vídeo: radio >0–200 px y color hexadecimal, usando un filtro CSS sobre la silueta. Se bloquea su combinación con máscara o sombra; no cubre animación, múltiples halos ni materiales. Compilación, edición y persistencia en rama: `74969127425d8f715f1551c6b852a644e4174f13`, `4b1d00dbb2cc6fb45e2e753772f9072140bf8c5e`, `5e21293161beeea23d622ee571086e45b4656e88`, `ea3b3dd6241208f1a0bf6f5af77a4f0f688bfb26`.
- Pruebas dirigidas 24/24 PASS, TypeScript PASS, navegador 1440/390 con cambio de sombra a glow PASS. Un fotograma sintético de Remotion comprobó objeto rojo, halo azul semitransparente y exterior transparente; no acredita todas las variantes ni calidad artística. Tests `b1c71fb64d6b524e40cec25f8970bc8ac9c3d42a`, `a107884c28263cf28b0220f9e9748fd66040735f`. Regresión de rama: 167 PASS, 0 FAIL, 5 SKIP de 172 en host; pruebas omitidas se ejecutaron aparte en cortes anteriores, no tras este cambio.
- Skill privada sincronizada de 1.5.3 a **1.5.4**, release `pluginrel_6aed0bd277708191adb2feee10a29e3c`, contenido y 11 archivos releídos. Mantiene prohibición de combinaciones no soportadas, generación de Reels nuevos, gasto no autorizado y despliegue. Contrato actualizado en `3cf73ec70d27e3fc6301246bdbe50fd5aedb010d` y `9875c74a14256f490be1558a0d00c34cc24c5f52`.
- Sin despliegue ni Reel nuevo. Pendientes efectos combinados y materiales, registro y supervisión de máscaras, generador IA gratuito real y auditoría audiovisual autónoma integral.

## SOMBRA ESTÁTICA Y SINCRONIZACIÓN DE SKILL · 05/11/2026

- Añadido `visual.dropShadow` opcional en el compilador y compositor Remotion: color hexadecimal, desplazamiento y desenfoque acotados, sin combinación con máscara. El editor permite modificarlo de forma reversible. El contrato detalla semántica y límites. Commits `d1dde2c0096cc887cab2c0566c2a21c50dfd3784`, `285aa69dbd2dcbd020e1a366b4d875557bdf5037`, `e9cf5652afc48825b25990d1fb94c9cb455dbbf2`, `27447eeb93bc8550d488e03e7bf03ecda24fd221`, `01513131f5a0c85651b0a1ce38a42bc74b37eecc`.
- Validación aislada: 23/23 pruebas de compilación/almacén, TypeScript PASS, navegador 1440/390 PASS, y un fotograma sintético Remotion: objeto rojo, sombra azul desplazada y exterior transparente verificados por píxeles. Solo se probó visualmente sombra sin desenfoque, no todos los acabados ni una edición real. No desplegado.
- Skill privada SUES AI Film Director actualizada de 1.5.2 a **1.5.3**, release `pluginrel_6aed0abff2d08191b8a63d6bb66a36a2`, con inventario y archivos releídos: documenta el campo opcional sin máscara, mantiene bloqueos y aclara que Carlos autorizó pruebas técnicas. No implica activación en producción.
- Siguen pendientes glow independiente, materiales, máscaras más sombra, aplicaciones verificadas de máscaras, planificación gratuita real y supervisor audiovisual autónomo. No afirmar cierre integral.

## RECURSOS Y COBERTURA DE SUPERVISIÓN · 05/11/2026

- El contexto confiable puede resolver un recurso solicitado para generar si una política del servidor ya acredita proyecto, fuente, montaje, hash del brief, tipo, SHA, bytes y derechos; ante una discrepancia se bloquea. Imagen, vídeo, música y SFX; la generación o licencia no se inventa. Probado hasta revisión y compilación con datos simulados. Commits `2f579fd34e2b9f6165038de5b217dfe9f4cada74`, `769d54e3ac9b8ca2a5ecdf62ec5a7567bb193505`, `bf7d7e04bf4f06bbe8e7bb9aa90e31b8985dad54`, `88fd45a0630a6e44bb1501f6d22b364f1e02d09a`.
- La revisión enlaza medios de la biblioteca privada por rutas autenticadas derivadas de hashes; controles en navegador escritorio/móvil PASS con datos simulados. Commits `62b13b88799bdaf666f282d382fc232b92595f8f`, `058ebd7bd1d368d60e20eada33c79bd5066cd8bb`, `c1269d8b9bcf57d9c75b4da0cc5aac87a94ec8de`, `2d2b670c5ce517db89f444d77c1dc81076144a85`.
- Las muestras para supervisión cubren toda la línea temporal a 1 fps más entrada, mitad y salida de operaciones, limitadas a 180 frames únicos. Prueba real FFmpeg sintética 2/2 y navegador simulado 1440/390 PASS. No equivale a inspección completa de movimiento ni escucha automática. Commits `406ff3c01f652aba11b276a52b3f5550bcc837be`, `30ee2ea22bea6c6caa4d81845cf19a58893a6cd5`, `a9b0d8bb540082b37070b583c1ae2001c2ab5b18`.
- Regresión posterior: 165 PASS, 0 FAIL, 5 SKIP de 170 en host; las cinco pruebas que requieren FFmpeg o modelo se ejecutaron por separado en cortes anteriores según se documenta abajo. Sin despliegue ni Reel nuevo. Pendientes registro y verificación de máscaras, generador IA gratuito real, supervisor audiovisual autónomo y validación integral.

## ÚLTIMA REGRESIÓN Y ENTORNO · 05/11/2026

- Tras conectar supervisor y candidaturas de máscaras, suite `node --test tests/master-director-*.test.js`: 163 PASS, 0 FAIL, 5 SKIP de 168 en host. Las cinco pruebas omitidas dependen de FFmpeg o del runtime Python: se han ejecutado por separado en los cortes documentados, 2 pruebas nativas, 1 extracción de evidencia y 2 pruebas de máscaras reales/sintéticas, sin trasladar esos resultados como si se hubieran ejecutado en la suite de host.
- Configuración local de máscaras con hashes comprobada en staging; sin activación en producción. Para recuperar espacio se eliminó únicamente la copia temporal de `node_modules` de la checkout aislada; quedan 4,2 GB disponibles en el VPS al cierre. El runtime de prueba Python permanece en `/tmp/sues-mask-runtime-20261105`, es temporal y no es una instalación productiva.
- Siguiente acción: completar el ciclo de revisión/verificación y registro de máscaras, integrar un proveedor de planificación gratuito real y un supervisor audiovisual que interprete imagen y sonido; después validar el flujo completo con los recursos y derechos reales. Mantener el bloqueo de aceptación completa cuando solo hay muestras o candidatos.

## GENERACIÓN LOCAL DE MÁSCARAS CANDIDATAS · 05/11/2026

- Integrados, solo en rama, un generador local de alpha por fotograma y una ruta autenticada de candidaturas para capas Remotion aprobadas: fuente y mapa temporal verificados, hasta 120 frames, 1080×1920, con proveedor local opt-in y hashes de ejecutable, script y modelo. La interfaz permite solicitar y abrir candidaturas; **no se aplican ni aprueban automáticamente**, ni se incorporan a la política. Detalle, límites y configuración: `docs/SUES_MASTER_MASK_CANDIDATES_20261105.md`.
- Runtime temporal de prueba en `/tmp/sues-mask-runtime-20261105`; no configurado ni desplegado en el servicio. El modelo se instaló sin API de pago. La configuración protege puntos de entrada/modelo, pero no todas las dependencias transitivas ni carreras; aislar antes de uso real. El trabajo mixto y la aprobación de evidencia real siguen pendientes.
- Validación: Python 2/2, wrapper con FFmpeg/modelo local sobre vídeo sintético 2/2, API autenticada con modelo real sobre vídeo sintético 1/1 (sonda de metadatos simulada), y navegador escritorio/móvil con generador simulado PASS. Se analizaron dos frames de la revisión 158404 V6B existente sin generar Reel: alpha no uniforme y variable; un frame visualizado tiene silueta aproximada y pelo imperfecto. Esto no acredita tracking, calidad sostenida ni segmentación lista para publicar.
- Commits principales `22be81d7baa9442712568025be15c39b5bc07b0a`, `6c7d5c9cd44c6f880c62bdc51080e7726b055215`, `d37352459db27268627e142f8591118892ff873a`, `6a429e3b0e76b0519d83e3b411cdacd3ce88ba37`, `4ec6ca3e70a933ff6e4de2316d32e28429e8610c`, `36940a2f5b84476ca01579f824557acc19047fb9`, `9bdda659d9272b1fe09a47fe1f231a145be5fd86`, `6b6093691cf80f85e4af1b7ca103911da6c5de30`, `895f7bd031c42944c5eb851dcb8a1a0261c2ce95`, `df365d2b678064d78377d48be71fad03dd28bec6`, `b9e514d13cd1c2b81410dfd948fff454f72184c3`, `49a77c3cec9eb00a765e2f85526ac93d3cc46e32`, `d6a807193973bab78db94b100df2a9d362d34e40`. No desplegado.

## EVIDENCIA PARA SUPERVISIÓN · 05/11/2026

- Integrado un preparador independiente de muestras sobre previsualizaciones selladas y aprobadas: extrae con FFmpeg entrada, mitad y salida de cada operación, además de un WAV de escucha, y vincula cada archivo a su SHA, al plan y al SHA del vídeo. Límite: hasta 180 fotogramas únicos y 120 s. Acceso autenticado; al cambiar autorización o archivo se rechaza. La extracción comparte el control de capacidad del editor. Commits `56dc4bb9f15c50d100051380e0761ba61f1e981b`, `5f1d0c3016cdf78b73503590741e976005e04369`, `723a0a6ae9dcd12def6e8efb754a9e5b4e949eee`, `3f05053bf6d54eff913f2d31a5f2c1591924cb8b`, `85617385356b706f8b91cd7275e8fd3047aabbd3`, `248f3b74ed2f6b9c85549fad429cff9b0245f057`.
- Pruebas: extracción real en vídeo sintético y verificación de integridad 2/2 PASS con FFmpeg en contenedor; regresión dirigida 14 PASS, 1 SKIP en host; navegador 1440/390 con extracción simulada y acceso autenticado PASS. Tests `51462a523f95248a4d19fcd2800a61c10af3ba8a`, `efdafc2d1293db2b0b3494c2c864e16d29b435ca`, `9ff730ff818e991493edee72c7a870942295c751`, `6a12c50317b8d0b425d12d96cea296ac82991f0e`.
- **No equivale a supervisor audiovisual autónomo completo:** son muestras, no análisis de todos los fotogramas, ni escucha ni revisión semántica; no genera pasadas QA aprobadas. Siguen pendientes el verificador independiente capaz de interpretar imagen/voz, auditar movimiento y mezcla, y producir dos pasadas completas sobre el resultado. Sin despliegue ni Reel nuevo.

## INTEGRIDAD DE QA · 05/11/2026

- La puerta de calidad exige que las dos pasadas y la aceptación creativa se refieran al SHA exacto del archivo entregado, además del fingerprint del plan. Colecciones de pruebas malformadas o duplicadas producen bloqueo. Commits `acc562fda3f7eefefe4764da8c876424103598d5`, `60905dffeddfdb4d45e420ea483df66c03a25755`; cobertura nueva `e77efa275fe92fc3b79eeab8c90585bf416fda16`, `a6391901dd0e8b0c8790e2794eddd155facfbb61`: 24/24 pruebas dirigidas PASS.
- Regresión posterior al cambio de QA: 160 PASS, 0 FAIL, 2 SKIP de 162 en host; las dos pruebas con FFmpeg se superaron en contenedor en el corte anterior al cambio de QA. No confundir con auditoría audiovisual ni con producción.
- Es un control de consistencia, no un supervisor audiovisual real ni pruebas de escucha o calidad creativa. Los productores de evidencias y aceptaciones aún deben suministrar SHA del archivo; sin ellos, la entrega final se bloquea. No desplegado.

## VALIDACIÓN AUTORIZADA · 05/11/2026

Carlos ha autorizado generar lo necesario para pruebas y continuar. En copia aislada del HEAD de rama, sin despliegue ni vídeo real nuevo:

- Suite dirigida inicial: 71/71 PASS tras actualizar fixtures para exigir SHA de recurso y preflight nativo. Regresión Master Director posterior: 150 PASS, 8 FAIL y 2 SKIP; los ocho fallos correspondían a fixtures anteriores a los controles nuevos. Corregidos sin relajar los controles y sus dos archivos se repitieron: 11 PASS, 1 SKIP, 0 FAIL. La prueba omitida requiere FFmpeg en el host; no declarar una suite completa nueva sin fallos como si se hubiera repetido entera.
- Tras reparar los fixtures, se repitió la suite completa Master Director: 159 PASS, 0 FAIL, 2 SKIP de 161 casos en host. Las dos pruebas omitidas por falta de FFmpeg en host se ejecutaron aparte dentro de contenedor aislado con FFmpeg: 2/2 PASS (etapa nativa mixta y lista estructurada nativa, con vídeo sintético y decodificación). No son un Reel ni auditoría creativa.
- Nuevas pruebas de entrada de IA, JSON duplicado/UTF-8, máscara dinámica y enlace a origen: suite del almacén 13/13, contexto/compilador 13/13 y preparación de máscaras 4/4 PASS; proveedor IA simulado, no configurado en producción. `tsc --noEmit` PASS en copia aislada.
- Dos fotogramas sintéticos 100×100 generados en contenedor sin red con memoria limitada: la máscara desplaza la zona visible entre imágenes; píxeles observados frame 0: izquierda rojo opaco, derecha transparente; frame 1: izquierda transparente, derecha rojo opaco. Esto acredita solo esa composición sintética, no segmentación real de personas, tracking ni flujo mixto completo. No se generó Reel ni se desplegó. El primer intento en host falló por librería de navegador ausente; se resolvió usando contenedor aislado.
- Test commits `ab7cca3600de397897a843d1f59066c634438936`, `3469a6e8a1dfabbea54cfa1490d745f54ef1ad73`, `801a6a90f84dfd2d97e8d5d272758f1843552ab7`, `7d4540d4d14b11fe8ce9af0921996667a3da316c`, `6e9b67e881e14de51c05ee976aea13e1db3ce48b`, `8e9cef080c25f9fb8d7522af48e3e928c5c022b1`, `38b7f3c9149b40e3005c2da4bf218fe5a3935006`, `421195f436e05386ce1f6e9dc31a9ddac31d72d9`, `9879df68cf2ec7534d57c1172bdf9fea40162251`, `863585f2e5db4841a44ad5dbef442be0bb5d52e9`.
- Navegador Chromium en contenedor aislado: revisión, aprobación, modificación de posición, texto, orden, tipografía y añadir/eliminar fotogramas, recuperación de versiones y comprobación de desbordamiento PASS en 1440 y 390 px. Datos y previsualización simulados; no equivale a aceptación audiovisual. Test commit `080e7022d3dccddf7af2f07b23f3b339947b3713`.
- Pendientes: dos entradas operativas con un generador real gratuito, creación/QA de máscaras reales, edición integral, supervisor audiovisual independiente y verificación integral. No declarar cierre ni despliegue.

## MÁSCARAS DINÁMICAS · 05/11/2026

- En rama se han añadido compilación, preparación y composición de secuencias alpha de hasta 120 imágenes por operación, una por fotograma, vinculadas a una prueba de confianza de la fuente y línea temporal. El registro de pruebas solo puede proceder de la política del servidor; cada imagen se comprueba por SHA y derechos al preparar recursos. El JSON de la skill no cambia: referencia `proofId` y modo `alpha-keep`. El compositor espera la carga de imágenes y bloquea la ausencia de un fotograma. Commits `b20b3ed1491fccf50f5321cc47b7af0be5bcfe79`, `d7144162ffd745485c69c887afd810a0ac872cfe`, `66af3cc5823a89a8909861006081b489d3126bc2`, `7089c65af2b98af4f318320780f8d51ab48cb168`, `cf6d80b8f86ff7e5661c114a3ed2d24b2da7f6bd`.
- La interfaz permite elegir o retirar un identificador de prueba de máscara en una nueva revisión (`e55f57764222d14914cef60c8a55659a8c2862e5`). Se rechazan evidencias ambiguas o con secuencias malformadas (`2a7be467486c64f0079f5eb4d093771a3cf9e266`, `ffc83039d0275b65ab4cbb6d00f060759de46d56`). La inspección de solo lectura del Python del VPS no encontró cv2, mediapipe, torch, onnxruntime ni rembg; esto no descarta otros entornos, y no se ha instalado ni ejecutado un modelo.
- El montaje mixto bloquea las máscaras hasta acreditar la fuente derivada (`482f0a08daa5beda29d885f6d344cc7e504583a8`, `ca71b3906080f37d3deb4f9d044c8b2a63c6d915`). No se ha configurado ni ejecutado una generación de máscaras; no existe prueba real de silueta ni seguimiento. Límite 120 fotogramas por operación. Sin tests, renders ni despliegue por decisión de Carlos. La corrección audiovisual y seguridad siguen sin validar.

## EDICIÓN DE CAPAS · 05/11/2026

- En la interfaz de rama se añaden controles para modificar orden de capa y tipografía, añadir y eliminar fotogramas de animación y seleccionar otro recurso declarado en el plan. El guardado crea una nueva revisión que exige volver a revisar; la validación normal sigue bloqueando fuentes, tiempos y recursos incompatibles. Commits `8c6edff7d31efdb7b8bf4ae720360948843ac469`, `6b01664142c76f416df8a86ee54235f30e5abf32`, `65319f09fe45db3976ebd39e045fa1f6df2ae5f1`, `cccc45de0370c5cc7b4923bd9728eb82eb71af0a`.
- Alcance: capas Remotion que ya han superado revisión; no representa edición integral, máscaras dinámicas, pruebas ni evidencia audiovisual. Sin tests, renders, despliegue ni gasto por indicación de Carlos. Pendiente integrar las capacidades restantes y validar cuando lo autorice.

## CONTINUIDAD · IMPORTACIÓN, TRAZABILIDAD Y ENTRADA IA · 05/11/2026

- El endpoint de borradores rechaza JSON con claves duplicadas y UTF-8 inválido; la validación bloquea listas malformadas de recursos, motivos y arco, y dependencias inválidas sin recorrer valores no iterables. Commits `551cb880d645db5349f5a2dc244375db96b89a91`, `8c21b72d94890b2d185924cc8bb1503629280d35`, `ffed36da51ae81cf720c25fec760045630c10d95`, `702ec38bf7959c962afb606559be43ff33168f30`, `686229969f451ceff7fbdd28d3733998e2ced0fa`.
- Añadida entrada opcional de generación de `sues-master-story/v1` por proveedor inyectado como gratuito, sin proveedor configurado por defecto. Comparte borrador y revisión con la entrada pegada; no ejecuta ni aprueba. La interfaz informa si no hay proveedor disponible. El contexto incluye datos limitados del proyecto y las capacidades registradas; los candidatos requieren verificación posterior. Commits `686229969f451ceff7fbdd28d3733998e2ced0fa`, `bb35a423ff4640428805eaa2af5d3789cbed64ce`, `31d6c2d3665b3a8aa4f5f6cfb964d5314d016081`, `82cd54082e7de24c6516af29db341dc739815e85`. **No hay generador operativo configurado ni gasto realizado.**
- Se persiste un manifiesto inmutable que enlaza operaciones originales y nodos del grafo a la revisión aprobada, consultable mediante endpoint autenticado. Es trazabilidad planificada, no evidencia de ejecución ni auditoría audiovisual. Commits `6ce01acd003cad826a573186bee04c56262b3ded` y `dcce99ac30c08c741f085dfe7f85471b690b67ec`.
- La revisión maestra conecta la comprobación lógica de operaciones nativas y mixtas antes de presentar la aprobación; las máscaras mixtas sin prueba sobre el hijo derivado se bloquean. Commits `f378dbe664d1af33e91c7b50b43fa3f0d91c6ca0`, `add8b8cad297e55bdfebb0fbb1e85be1b98a9f2e`. La corrección `eb1923d05ca7fb98c6f4469bc08dc08b112183e6` reconoce espacios antes de los dos puntos al buscar claves duplicadas.
- La interfaz conecta el inicio y seguimiento de trabajos mixtos existentes, conserva el identificador de solicitud ante una conexión incierta y evita lanzar la vista previa exclusivamente Remotion para planes nativos o mixtos. Commits `281d7b4a81db8bf6ec2e83a4dfee96b73d66545f` y `62215b911ae4fc53515fcb3e643f3fa79e9d4326`. Fallos del futuro generador no se exponen con detalles privados (`930727cf7db23d2b2bd6f14a2cf8bcee69421d56`); se protege el encargo si cambia mientras trabaja (`f219b6fc53dff2cac50e52100906f22917132134`). Código pendiente de validación; no se ha lanzado ningún trabajo.
- Sin pruebas ni renders por decisión expresa de Carlos; código no verificado ni desplegado. Continúan pendientes la conexión real del proveedor gratuito, representación fiel de todos los efectos y máscaras, editor integral, supervisor audiovisual independiente y validación autorizada posterior.

## REVISIÓN DETALLADA Y GUARDIA DE EVIDENCIAS · 05/11/2026

- La revisión incluye parámetros, motor, dependencias, recursos y anclas por operación; la interfaz muestra estos datos desplegables por escena. Commits `9648d6fabbb629691960cb8aae0f01d898c7fecc`, `be08f97512dc0a731eb112dcf90d7acf167c3f00`, `594420045ef763e9f6d75440699765c567763afb`.
- La revisión también expone ID, procedencia, versión, SHA, uso comercial y operaciones vinculadas de cada recurso ya resuelto en el registro confiable; no implementa búsqueda ni acredita por sí misma los derechos. Commits `30a5458bcc484e80e0fc99a0efd3d4be40310e3a` y `8fa3f2538b97f8689391a989f6e5fde02e67ce58`.
- La auditoría rechaza evidencia duplicada en cada pasada, evitando aceptar listas con entradas repetidas. Commit `7c3ff01f041a8514132f024aba2c1b7dc0d7ac7f`. No implementa supervisor audiovisual independiente ni demuestra sus resultados.
- Sin tests, renders ni despliegue por indicación de Carlos. Cambios pendientes de validación. No acredita integración integral, efectos, máscaras reales ni segundo camino IA. Próxima acción: continuar la integración y mantener bloqueadas las capacidades sin equivalencia verificada.

## IMPORTACIÓN DE ARCHIVO MAESTRO · 05/11/2026

- Añadidos controles de importación y descarga JSON en el editor de rama. Archivo y pegado comparten inspección de schema y tamaño y la misma revisión, aprobación y ejecución existente. El archivo UTF-8 se mantiene íntegro en el cuadro; un proyecto cambiado durante la lectura bloquea la importación.
- Se rechazan propiedades JSON duplicadas en la entrada de interfaz para evitar que JSON.parse descarte instrucciones anteriores silenciosamente. La API de borradores incorpora posteriormente la misma protección; véase la entrada de continuidad más reciente.
- Commits `401c7ebb121119a47137869745322a181eea8344`, `fbd0bcd4733d72174f2bd3ba62235563010d5aff`, `cccebb8ad5bdbfb8a8af81add91792157b292a8b`. Sin ampliación de schema ni efectos; skill 1.5.2 sin cambios.
- Sin tests ni renders por indicación de Carlos; código no validado ni desplegado. Integración global aún pendiente; no declarar cierre, ejecución completa ni importación universal sin pérdida.

## INTEGRIDAD DE RECURSOS · 05/11/2026

- El gate exige que el SHA del recurso de cada operación coincida con el activo verificado por el servidor, además de derechos; un cambio de versión bloquea el plan. Commit `980b796c77125c57a6fb520565813a365d8a38d9`.
- Sin pruebas ni renders por instrucción de Carlos; sin despliegue. Debe comprobarse compatibilidad de planes existentes y supervisión cuando llegue la fase de validación. No acredita importación integral, máscaras, efectos, mezcla ni cierre de proyecto.

## CAPACIDADES ANTES DE APROBAR · 05/11/2026

- En rama se inspecciona la estructura del grafo y se compilan de forma lógica las operaciones Remotion antes de mostrar una propuesta como aprobable; los identificadores y códigos de los bloqueos se presentan en pantalla. La huella temporal usada para inspección no registra una aprobación ni ejecuta un trabajo.
- Cambios `8093b22c342f5ece2739f9f19e124513f09c8017` y `6aecacc750d5ca6da259acbce7d34edaaf6d4da2`. No modifica schema ni skill y no acredita capacidad gráfica o audiovisual. La revisión completa del motor nativo y la ejecución mixta siguen dependiendo de sus propios controles.
- Sin pruebas ni renders por instrucción del titular; cambios no validados y no desplegados. Pendientes de integración completa y revisión posterior.

## CONTINUIDAD · INTEGRIDAD DEL PLAN · 05/11/2026

- Sin cambio de contrato `sues-master-story/v1` ni versión de skill 1.5.2. Añadida comparación narrativa, escenas, motivos, fuente y timeline entre borrador y plan compilado; la revisión del borrador se conserva en el grafo editable. Commits `9deb8087cacd3fb733b6da64d0b4309432b79991`, `da03afdadd92952519491eda6a99799b5b52472c`, `388481508da516a725b48d65593fcb7dcae26d5e`.
- El motor nativo calcula la duración de las tarjetas a partir de subtítulos y política. Se comunica su tiempo resultante en revisión y se bloquea la tarjeta maestra si no coincide con los tiempos solicitados; evita una traducción temporal silenciosa. Commits `95d05706166a859fc5b33369b5777fb7d88fbc3f`, `dde76058079f3f0ecdb1791682c33ff8f2d0aa2f`.
- Cambios **sin pruebas ni renders**, por indicación de Carlos, y sin despliegue. No acreditan equivalencia completa ni terminación del importador, efectos, máscaras, audio, supervisor o ejecución IA. Validar estas conexiones una vez autorizada la fase de pruebas.

## INTEGRACIÓN PEGAR PLAN Y SKILL · 05/11/2026

- Sin cambio de schema: `sues-master-story/v1`. Skill 1.5.1 → **1.5.2**, release `pluginrel_6aecd552b0088191a6da812025a9d3a1`; publicación y lectura confirmadas. Se documenta que los límites de operaciones Remotion deben coincidir con fotogramas, con tolerancia de 0,000001 s. No se incorporan efectos nuevos.
- `web/index.html` elimina límite que truncaba pegados; la revisión mantiene máximo de 60.000 bytes serializados. `src/master-director-layer-graph.js` bloquea desalineación temporal Remotion y conserva `speechAnchor`. `src/master-director-project-store.js` vincula aprobación a la revisión inmutable completa e inspecciona correspondencia de campos de operaciones compiladas; `web/app.js` explica bloqueos de traducción. Commits `858d38dbad6ac41af157d7afad8ac3d4ec9047ff`, `a9ed62c7893a3cd161ef96fef68169c0a38c3b38`, `a78e2dd4ec642b0053f7171b31ee3cf942c26b96`, `06d5243b7bb909a42896afc84dc9ac715c79e1cd`.
- El análisis de traducción no acredita equivalencia visual/audio ni cubre todas las propiedades entre compiladores y motores. Pendientes: preservación integral, soporte de acabados y máscaras reales, recursos, editor reversible, supervisor independiente y generación IA común. Aprobaciones anteriores pueden requerir nueva revisión por el cambio de fingerprint.
- Carlos ha aplazado explícitamente tests y renders hasta completar integración: cambios no validados, sin despliegue, gastos o Reels. Validar seguridad, regresiones e integración antes de usar en producción.

## SINCRONIZACIÓN SKILL + PEGAR PLAN · 05/11/2026

- Contrato anterior y actual: `sues-master-story/v1`, sin extensión ni nuevos efectos declarados. Documento `SKILL_CONTRACT_HANDOFF.md`; no garantiza pérdida cero de parámetros anidados.
- Skill privada existente: 1.5.0 → **1.5.1**, release `pluginrel_6aecd186c2cc8191b02be8dde53f8635`, publicado y archivos/inventario releídos. Referencias y audiencia conservadas. Refleja la revisión maestra en desarrollo y no declara despliegue.
- Código: `web/index.html` y `web/app.js`, commits `753268848bfb86a34534007f57b91c724dff38f2` y `bed51e51ce02ada8149ad7672397974fe42baeed`: cuadro ampliado, aviso de límite 60.000 bytes serializados, invalida revisión al editar, identifica campos no representados. Se mantiene límite del importador anterior. Guardia parcial del almacén en `3dbfc2577652c27f86ac47ae6c1dd770e2a00fb7`.
- No se han añadido operaciones ejecutables. Pendientes: importación integral sin pérdida, acabados, máscaras reales, trazabilidad y edición completa de capas, búsqueda y derechos reales, supervisor audiovisual independiente y segundo camino IA. La ejecución mixta cuenta con código de worker; funcionamiento integral no verificado en esta iteración.
- Por instrucción de Carlos: **no tests ni renders** durante integración. No despliegue, producción, servicios de pago ni nuevos Reels. Revisar de forma específica estos cambios cuando Carlos autorice validación. No atribuir pruebas históricas a estos commits.

## HITO NUEVO · V6B REAL DESDE EL BRUTO · 05/11/2026

- **Nueva edición verdaderamente creada sobre el bruto** original `158404.mp4`, SHA-256 `9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad` (1080×1920, 73,753 s). **NO se emplearon los MP4 V4B/V5B para derivar el montaje.** Se reutilizó únicamente la tecnología ya desarrollada.
- **Plan independiente V6**: 70 segundos / 2100 fotogramas a 30 fps, cinco cortes de pausas y cinco escenas Remotion diseñadas para el discurso (`RULES`, `FEAR`, `CHOICE`, `MIRROR`, `CHOICES`). Gráficos maestros antracita exclusivos de las composiciones; plano real de Carlos fuera de ellas. 168 palabras ASR remapeadas, 50 subtítulos editables en ASS, revisión V6B con corrección «a portarte bien» y colocación de subtítulos. Voz original, sin generar voz sintética.
- **MP4 de revisión V6B**: 720×1280 H264/AAC, **70,000 s, 2100 frames**, SHA-256 `60642ab2e03fffc24d4704b13320e812d9a1182004cde0f214340e835639a64b`, decodificación íntegra PASS; comparación de audio con base V6 recortada PASS. No equivale a QA creativa ni doble auditoría completa.
- **Acceso privado real en editor existente verificado por registro y archivo de proyecto**: [ABRIR REEL V6B · proyecto 73b94481-beef-44cb-a626-252b40f9834d](https://editor.suesholistics.com/?project=73b94481-beef-44cb-a626-252b40f9834d), estado `PREVIEW_READY`. Ingesta nueva por API autorizada, sin modificar código ni archivos del editor productivo, sin desplegar ni publicar.
- **Backup fuera de /tmp** (verificado por SHA y manifest): `/opt/sues-video-setup/editor-backups/reel-158404-v6b-20261105/` con MP4, plan JSON y Markdown, fuentes de Remotion, cinco clips renderizados, scripts, subtítulos, análisis y manifest SHA. La versión V4B y V5B permanecen intactas; los archivos de trabajo estaban en `/tmp/sues-158404-v6-20261105` y no deben ser el único respaldo.
- **Límites no ocultar**: la V6B **NO** incluye B-roll cinematográfico nuevo ni máscaras reales de silueta (máscaras antiguas inspeccionadas eran idénticas blancas); no tiene diseño musical completo acreditado ni mezcla sonora cinematográfica verificada; 720p privado aún no publicable ni exportación maestra 1080p. La previsualización en editor es MP4 aplanado; Remotion conserva fuentes por escena en backup, no son capas editables automáticamente en la UI. Prohibido fingir que el SUES MASTER DIRECTOR automatizó end-to-end este proceso: la planificación y la ejecución se coordinaron todavía en este chat con herramientas.
- **Próxima acción**: Carlos revisa la V6B privada; a continuación completar flujo automático del cerebro, selección y derechos de B-roll, máscaras dinámicas reales, ingeniería sonora, QA audiovisual independiente doble y exportación final bajo aprobación. No borrar la copia V6B ni sobrescribir anteriores.

## HITO REEL REAL 158404 · V5B 720p COMPLETO · 05/11/2026

- **Nueva evidencia audiovisual: vídeo completo de revisión obtenido** con secuencias antracita y texto corregido. **NO es final publicable**. Duración **74,333 s / 2230 frames / 30 fps / 720×1280**, H.264 + AAC; SHA-256 `0a0312f50882dc747a0ce2f47b6cbb73f026803428d5a6c88eb825c40c6285e3`. Auditoría FFmpeg completa PASS, bitstream de audio AAC idéntico a V4B (SHA `b107b3d62d99eee103e343691e220f0c1a580612a631a68b76ffec736a26b3de`).
- **Ruta durable comprobada en VPS**, fuera de producción y de `/tmp`: `/opt/sues-video-setup/editor-backups/reel-158404-v5b-20261105/SUES_158404_V5B_ANTRACITA_PREVIEW720_20261105.mp4`, con `manifest.json` y fotogramas QA; `/tmp/sues-158404-v5-20261105` es solo candidata temporal. V4B original intacta.
- **Código editable por escenas en la RAMA DE REEL (no confundir con rama Master Director):** [EDICIÓN V5B, evidencias y próximos pasos](https://github.com/carlossuess-art/sues-ai-video-editor/blob/feat/remotion-cta-poc-20261103/experiments/remotion-cta/docs/EDICION_158404_V5B_20261105.md). Ramas con distinto propósito; se mantiene un único escritor por vez.
- **Bloqueo de memoria real resuelto para este preview específico**: renderizar solo escenas gráficas con Remotion sin volver a decodificar vídeo completo (146+236 fotogramas, Docker sin red a 1500 MiB); FFmpeg concat exacto dentro de 1200 MiB; subtítulos con contraste y tercer recuadro sin desbordes. No equivale a solucionar todas las cargas de Remotion ni a habilitar una renderización 1080 de toda la obra.
- **Acceso de revisión privado YA HABILITADO**: nuevo proyecto de usuario en editor existente, `c90e1a7c-972e-411f-885d-722e9796e40b` ([abrir V5B](https://editor.suesholistics.com/?project=c90e1a7c-972e-411f-885d-722e9796e40b)), `PREVIEW_READY`; API autenticada GET proyecto **200** y rango de vídeo fuente **206** sobre exactamente 11.702.512 bytes. **No se cambió código de producción ni se sobrescribió V4B**; únicamente se creó nueva revisión privada en la biblioteca y en «Mis proyectos». El MP4 está aplanado: no volver a agregar subtítulos/música sobre la fuente, las capas editables se conservan en la rama de Reel. 
- **Pendiente:** que Carlos vea la V5B y dé comentarios; que Carlos lo vea y dé comentarios; acreditar derechos de los clips B-roll y música; preparar salida genuina 1080×1920 y QA creativo completo. No publicar, no hacer `deploy`, no afirmar aceptación artística ni `approvedForProduction`. **Progreso global del SOFTWARE sin cambio de estimación**: 55 % ±10, pese a este avance concreto de Reel.
- **Próxima acción en el Reel:** proporcionar vista privada de V5B y recoger feedback antes de decidir montaje final. **Próxima acción del software:** seguir integrando los workers de capas editables y QA real según las reglas y la siguiente fase, sin reconstruir ya esta V5B por rutina.

## Prioridad de lectura y autoridad

1. Requisitos maestros: `docs/SUES_MASTER_DIRECTOR_REGLAS_APROBADAS_20261104.md` (20 reglas aprobadas, prevalece sobre borradores).
2. **Checkpoint vivo**: ESTE documento. Actualizar al cerrar cada fase o al surgir un bloqueo concreto; dar fecha, commit exacto, entorno, evidencia, bloqueos y próxima acción. Las notas antiguas de `PROJECT_STATUS.md` y `docs/SUES_MASTER_DIRECTOR_WORK_*.md` son registros históricos, no el último estado.
3. Código: rama `feat/master-director-story-orchestration-20261104`, PR borrador #27: https://github.com/carlossuess-art/sues-ai-video-editor/pull/27 . HEAD al inicio del checkpoint: `ee71981e57114801e442ad1c1c53d4582ae93301`.
4. Producción: VPS `srv1841004`, contenedor `sues-video-editor`; montaje `/app` desde `/opt/sues-video-setup/release-mobile-layers-20261030`. **No modificar ni desplegar** sin aprobación de Carlos. Se verificó que este montaje no contiene `src/master-director-project-store.js`.
5. Roadmap en Google Drive: https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit ; mantener una sección superior de seguimiento con link a este checkpoint y apuntar hitos verificados. No sustituye al repositorio como evidencia de código.

## Regla de coordinación entre los dos Work y el chat normal

**Un único escritor/ejecutor por vez.** El segundo Work debe actuar solo como auditor/lector hasta que el primero ceda la ejecución. Nunca editar simultáneamente la misma rama o el editor productivo. En cada reanudación: (a) abrir este checkpoint, (b) comprobar únicamente si HEAD y los últimos logs referenciados siguen vigentes, (c) realizar la PRÓXIMA ACCIÓN, (d) actualizar este checkpoint y Drive. No repetir auditoría completa ni suites pesadas sin un cambio relevante o una razón explícita. Comprobar vigencia **no significa omitir pruebas de seguridad**.

No reutilizar blindly `src/editor-server.js` de la rama sobre producción; la base instalada es distinta. La herramienta `scripts/master-director/build-isolated-candidate.mjs` crea una candidata reproducible, verifica hashes de la base y aplica parche aislado. Validar la candidata antes de fusionar o desplegar.

## Evidencia confirmada al corte

- Módulos de planificación narrativa, reglas, revisión/aprobación, contexto y políticas del servidor, puente nativo, grafo de capas, Remotion experimental, auditor técnico, previsualización privada y UI parcial: **implementados en rama y entorno de pruebas**; la mayoría no están disponibles en producción.
- Backend autenticado con revisiones inmutables, invalidación por cambios y decisión `approve/autonomous`. Ruta nativa capaz de crear versión hija para **planes estrictamente compatibles**. ELEMENTS nativo probado con formatos LIST, RANKING, COMPARE, Q&A, REVEAL y FLOW; la existencia de esos formatos no acredita belleza de motion cinematográfico.
- Remotion: prueba sintética 24 s, 720 fotogramas, vídeo/audio, auditoría técnica de salida, reproducción por HTTP Range e idempotencia **PASS en host/candidata aislada**; el MP4 de previsualización es aplanado, la fuente estructurada de capas es aparte.
- Suite amplia de regresión: **558/558 PASS** en copia aislada, `/tmp/sues-master-native-elements-regression-20261105.log` (~06:32 UTC).
- Suite dirigida de runtime: **128 PASS / 129, 1 SKIP, 0 FAIL**, `/tmp/sues-master-runtime-v2-suite.log` (~06:44 UTC). No declarar 129/129.
- Render de native ELEMENTS sobre vídeo sintético de 12 s y tests específicos FFmpeg superados según PR #27; resultado técnico, no revisión artística.
- **Bloqueo conocido:** E2E 24 s Remotion dentro de contenedor quedó `BLOCKED` por `PREVIEW_MEMORY_LIMIT`, log `/tmp/sues-master-runtime-container-v2-e2e.log` (~06:47 UTC). Es un bloqueo de guardia de memoria sin superación de prueba, no evidencia suficiente de bug de imágenes ni de éxito. `src/master-director-preview-renderer.js` exige >=512 MiB de margen libre según host y cgroup; inspeccionar configuración/cgroup con entorno exactamente equivalente antes de modificar umbral. Host sí pasó la prueba equivalente.
- Del 158404: copia normalizada ~65,1 s, 1953 frames; un segundo renderizado y auditado en anteriores ensayos. Prueba anterior de 65,1 s abortó por `UND_ERR_HEADERS_TIMEOUT`; no hay Reel completo final verificado. No confundir el CTA ya creado con la edición completa.
- Biblioteca: tres tapices maestros disponibles con derechos antiguos declarados propios, pero faltan **metadatos/evidencias de licencia V2** para política confiable completa. Las pruebas positivas de proveedor usan fixtures, no autorizaciones productivas reales.
- QA técnico verifica estructura, media y decodificación; **NO acredita** calidad artística, máscara dinámica/cuerpo real, mezcla sonora crítica, sincronía semántica, doble auditoría audiovisual ni aceptación de Carlos.
- Sin API de pago, publicación, cambio de skill ni despliegue. La skill SUES AI Film Director NO se adapta hasta que el contrato del cerebro esté estabilizado.

## Roadmap secuencial con intervención de Carlos

| Fase | Entregable y evidencia de cierre | ¿Carlos? | Estado |
|---|---|---|---|
| 1. Unificación/continuidad | Checkpoint único GitHub+Drive, commits y logs referenciados, 1 escritor | No | COMPLETADO: GitHub+Drive+PR+PROJECT_STATUS |
| 2. Candidata reproducible | Reconstruir desde montaje productivo con hashes; ejecutar suite dirigida y comparativa; conservar backout | No | COMPLETADO: candidata 458 hashes; 132 pruebas+MP4 nativo |
| 3. Bloqueos y recursos | Memoria Remotion y metadata de procedencia/rights V2 de masters | Solo si falta prueba de titularidad o recursos/gastos | PARCIAL: render 1900m PASS; 1536m guard activado; derechos V2 pendientes |
| 4. Integración efectiva | Cerebro→nativo+Remotion mixto, edición de capas y keyframes, audio, máscaras reales, versiones recuperables; rechazo exacto de efectos no soportados | No para desarrollo | EN CURSO: grafo mixto+handoff y prueba técnica 12s PASS; ejecución integrada, UI y máscaras reales pendientes |
| 5. QA de Reel real 158404 | Plan genuino, recursos reales autorizados, preview y MP4 final, voz/música/SFX/oclusiones, 2 auditorías audiovisuales independientes completas, regresión | Sí para aceptación estética | PENDIENTE |
| 6. Release seguro | Snapshot/backup y rollback probado, producción contra candidata, autorización explícita de despliegue | Sí | PENDIENTE |
| 7. Skill | Informe técnico final para adaptar SUES AI Film Director en chat normal | Sí, luego | PENDIENTE |

## Checkpoint de permisos y finanzas

**Se puede avanzar SIN Carlos:** inspeccionar GitHub/VPS/Drive existentes; parchear en rama; crear candidata aislada; ensayar fixtures/medios existentes autorizados sin gastar; comparar, ejecutar tests enfocados y corregir errores; actualizar este documento y Drive con evidencia.

**Parar para Carlos SOLO en:** nuevo gasto/servicio de pago, cambiar recursos de marca o aprobar una alternativa visual importante, titularidad de recursos cuando falte evidencia, despliegue sobre producción/cambios peligrosos, publicación y valoración creativa final. No aceptar aprobación inventada de recursos o límites.

## Próxima acción exacta al retomar

1. Validar el builder reproducible en staging sin escribir a producción y registrar SHA de candidata.
2. Diagnosticar por qué el mismo E2E 24 s pasa en host y produce `PREVIEW_MEMORY_LIMIT` en contenedor: RAM host y cgroup, límites y lectura/procedencia de comprobaciones. Ajustar SOLO si hay evidencia y sin relajar el control preventivo. Repetir un test dirigido, no toda la batería.
3. Verificar capacidad de edición de versiones y composición con una operación real mínima; después integrar operaciones mixtas y máscaras dinámicas por capas.
4. Completar política con procedencia real documentada; no simular licencias.
5. Finalmente Reel 158404 y dos ciclos QA. En cada hito actualizar este documento + nota superior Drive.

## HITO VERIFICADO · 05/11/2026 · CONTRATO MIXTO Y POC DE DOS MOTORES

- **Referencia técnica detallada:** [POC mixto nativo→Remotion](SUES_MASTER_DIRECTOR_POC_MIXTO_20261105.md); código de esta iteración hasta `eae9d7ad7097fc9cff3aee211a47b7c57a315683` (commit doc, antes de actualizar este checkpoint).
- `src/master-director-hybrid-review.js` conserva identidad, tiempos y dependencias de todas las operaciones nativas y de Remotion; la UI autenticada `master-layers` devuelve revisión `hybrid` sin omitir efectos. `master-render-preflight` **bloquea** el render mixto incompleto.
- **Nuevo hito autenticado:** `/master-native-review` puede revisar el subconjunto nativo de un plan mixto ya aprobado y devolver `HYBRID_NATIVE_PART_REVIEWED_NOT_EXECUTABLE`, conservando todas las identidades. `/master-native-apply` responde 409 y no genera hijo parcial. Acreditado por prueba HTTP auténtica; última candidata `/tmp/sues-director-candidate-rRJsvw`, 458 hashes verificados, **146/146 pruebas PASS** sobre código `e5313398ef64b87f86f6c8a31f39f77291e7f5ad`. Log `/tmp/sues-master-hybrid-native-candidate-tests-20261105.log`. Confirmado en PR #27. **Sigue sin existir worker automático de ambas etapas.**
- `src/master-director-hybrid-handoff.js` valida la relación de un futuro hijo nativo editable con SHA, prueba de audio/frames, aprobación del plan original y fuente derivada para Remotion. Rechaza máscaras sin evidencia propia del nuevo origen y mezcla/dependencias no garantizadas; **NO está todavía conectado a la ejecución del servidor**.
- Pruebas **146/146 dirigidas PASS**, 0 FAIL/SKIP, sobre candidata aislada reconstruida por hashes de **458 archivos** activos. Logs: `/tmp/sues-master-handoff-candidate-tests-20261105.log` y `/tmp/sues-master-handoff-candidate-build-20261105.log`. El checkout de ese hito está en `fc2645df868658136442a4f588adc73df2b6ab70`.
- **Dos motores encadenados de verdad en una prueba sintética:** versión nativa hija de 12s 1080×1920 con sonido y FFmpeg real (1/1 PASS, SHA `b24d29d710704b56ae2178fffcd1a510359b64397dea08bbdceb4c0ac09af4f0`); su salida alimentó a Remotion, que añadió texto animado y creó preview 360 fotogramas 270×480 H.264/AAC con audio y decodificación completa. Diferencia de píxeles comprobada en un fotograma con título (6285 canales). SHA preview `3e04250be184d2bf6125e5925ded0bfd72c20235728177b6a196323b9dd208b4`. Logs `/tmp/sues-master-hybrid-native-poc-20261105.log`, `/tmp/sues-master-hybrid-remotion-poc-20261105.log`. Docker privado sin red, CPU0.65, RAM1900m, sin desplegar ni publicar.
- Test reproducible `tests/master-hybrid-two-stage-poc.mjs` y documentación de montaje. **IMPORTANTE:** el POC no prueba edición Remotion desde UI ni conserva automáticamente el vínculo padre/hijo en el servidor. Aprobación sintética de prueba, no recursos/rights de marca finales. No hay máscara dinámica real, mezclas profesionales, Reel 158404 acabado ni dos auditorías audiovisuales.
- **Próximo paso de ingeniería:** desde la revisión mixta autenticada YA PROBADA, integrar un worker de etapa nativa **no publicable como vídeo final** que cree y verifique un hijo editable, valide su auditoría, persista el handoff de ambos grafos y permita preview Remotion vinculada. Bloquear ejecución ante mezcla no representable; después resolver licencia V2, máscaras, Reel real y dos QA creativas. **NO repetir estas pruebas sin cambios relevantes.**
- **Progreso estimado actualizado a 55 %, incertidumbre ±10 puntos;** ningún consumo de API de pago, cambio de skill ni modificación de producción.

## HITO VERIFICADO · 05/11/2026, 08:42 CET (07:42 UTC) · REMOTION V2 RECUPERADO

**Código consolidado en GitHub:** `6cc49b30802af3507b1f63c9ca24ced45ac06a1e` (HEAD verificado). Se recuperaron de la carpeta de QA de Work `master-director-runtime-manifest.js` y el soporte para configuración firmada `sues-master-preview-config/v2`, con hash de cada dependencia transitiva y protección ante symlinks externos y archivos mutables. Se integró con el diagnóstico propio de memoria de 512 MiB de reserva y la validación de biblioteca navegador `LD_LIBRARY_PATH` desde configuración confiable; no se exponen stderr ni rutas internas al navegador. Remotion bloquea rutas de cache Webpack preexistentes. Los archivos integrados se compararon por SHA-256 con el checkout local, sin diferencias.

**Pruebas posteriores al cambio:**
- **134/134 PASS, cero FAIL, cero SKIP** de pruebas Node dirigidas sobre el checkout de la rama unificada con `examples/assets/schemas` completos; log `/tmp/sues-master-unified-v2-directed-fixed-20261105.log` (~07:40 UTC). El primer intento sobre sparse checkout incompleto falló por fixtures ausentes; se completó el checkout y la suite PASÓ. No atribuir esos errores al motor.
- **Remotion E2E sintético 24 s PASS dentro de Docker aislado --memory=1900m, --cpus=0.65, --network none**, versión de pruebas con manifiesto V2, biblioteca de Chrome y reserva de 512 MiB. Generó 720 frames a 30fps, audio AAC, MP4 H.264 270×480, SHA salida `d94303f59533b82f24b501cfb893aa0a61bc4e4de4867831762eff647d1c8be7`. Auditoría técnica completa de decodificación, URL Range e idempotencia **PASS**. Log `/tmp/sues-master-candidate-remotion-v2-1900m-20261105.log` (~07:38 UTC).
- Con **--memory=1536m** se reprodujo y quedó diagnosticado `PREVIEW_MEMORY_LIMIT / CGROUP_MEMORY_LOW` durante render. **No se bajó la reserva** y no se adoptó un aumento de RAM en producción: el parámetro de 1900m fue EXCLUSIVAMENTE un límite en contenedor temporal con recursos del host existente. Así queda demostrado que la capacidad de memoria importa; no se garantiza el rendimiento de dos renders simultáneos ni de un Reel complejo.
- El test nativo MP4 12 s anterior y la regresión 558/558 anterior siguen vigentes como referencias históricas, no sustituyen una regresión completa sobre este nuevo commit ni 2 auditorías creativas. No se ha probado la exportación final de Remotion ni una máscara dinámica real.

**Próxima acción exacta de Work:** leer este checkpoint y revisar HEAD actual, luego implementar un plan mixto real cerebro→Remotion/nativo de manera fiel con persistencia de capas; documentar política del runtime y recursos con pruebas reales (sin inventar licencias), realizar Reel 158404 y QA audiovisual independiente. Pruebas 134 Node + E2E 24 s ya pasadas, evitar repetirlas sin cambios relevantes. Antes de despliegue: regresión integral sobre versión candidata definitiva y backup/rollback autorizados por Carlos. Skill permanece sin cambios.

## HITO NUEVO VERIFICADO · 05/11/2026, ~08:20 CET (07:20 UTC)

**Candidata aislada reproducible:** `node scripts/master-director/build-isolated-candidate.mjs /opt/sues-video-setup/release-mobile-layers-20261030` sobre el checkout privado de trabajo `/tmp/sues-master-unified-20261105` al commit `6d9fb7911644bc1c1ebcff79e96071556e7ac401`. Resultado `ISOLATED_CANDIDATE_BUILT`, **458 hashes de archivos de producción verificados**, candidata `/tmp/sues-director-candidate-OcRkNV`, `deployed:false`. El constructor es reproducible sobre la base de hashes; la candidata lleva vínculos de node_modules para QA y **NO instala el runtime Remotion** por sí sola.

**Pruebas nuevas y diferenciadas:**
- **132/132 PASS, 0 omisiones y 0 fallos** en la candidata completa: 23 ficheros de test `master-director-*.test.js` exceptuando el test audiovisual de FFmpeg, `/tmp/sues-master-candidate-directed-20261105.log` (~07:17 UTC).
- **1/1 PASS** del test nativo audiovisual REAL con FFmpeg en Docker aislado y sin red, `tests/master-director-native-render.test.js`: versión hija editable y MP4 privado sintético de 12 s, audio presente, decodificación y reintento idempotente. Log `/tmp/sues-master-candidate-native-video-20261105.log` (~07:19 UTC). No es la QA creativa del Reel.
- **7/7 PASS** de diagnóstico de memoria y cancelación limpia en staging, `/tmp/sues-master-memory-diagnostic-tests-v2-20261105.log` (~07:13 UTC). Se añadió `src/master-director-memory-budget.js`, `scripts/master-director/inspect-preview-memory.mjs` y se mejoró `src/master-director-preview-renderer.js` para comunicar la causa exacta de falta de margen, **manteniendo el mínimo de 512 MiB**. Último commit de este bloque `6d9fb7911644bc1c1ebcff79e96071556e7ac401`.
- **Inspección aislada de memoria del contenedor al arranque:** `--memory=1536m`, `hostAvailableBytes≈2.49 GB`, `cgroupAvailableBytes≈1.60 GB`, `reason=READY`. Por tanto, el bloqueo anterior **no se reprodujo al iniciar**; puede depender del consumo durante render. **No declarar resuelto `PREVIEW_MEMORY_LIMIT` ni volver a lanzar un E2E completo sin medir su pico y garantizar RAM para producción.**
- La rama GitHub y las pruebas NO se han desplegado. `/opt/sues-video-setup/release-mobile-layers-20261030` permanece intacto.

**Próxima acción única:** perfilar memoria incremental del render Remotion 24 s dentro de un cgroup aislado con límite conservador, comprobar motivo del guard cuando aparece (sin reducirlo). Si la capacidad del host no garantiza margen, no competir con producción: optimizar o probar en entorno mayor autorizado. Después cerrar política real/recursos y flujo mixto/Remotion, terminando con 158404 y 2 QA audiovisuales.

## Registro de actualizaciones

- **2026-11-05 · Revisión mixta HTTP ya conectada:** 146/146 dirigidas PASS sobre candidata reconstruida; el editor valida el subconjunto nativo del plan completo con aprobación vigente, pero impide que se aplique o publique parcialmente. Worker y persistencia siguen pendientes.

- **2026-11-05 · Hito mixto reproducible:** 146/146 Node PASS, proyecto nativo real 12s + Remotion overlay 12s decodificados con audio, 2 motores encadenados en POC; contratos de revisión/handoff publicados. Aún NO integrado automáticamente ni listo para producción.

- **2026-11-05 08:42 CET · Chat normal / integración V2 y QA**: HEAD 6cc49b3, runtime de integridad recuperado, 134/134 tests Node PASS, Remotion E2E 24s+audio y auditoría técnica en Docker 1900m PASS; Docker 1536m bloqueó por CGROUP_MEMORY_LOW (sin relajar guardia). Producción intacta. Pendiente mezcla nativo+Remotion, Reel real y QA creativa.

- **2026-11-05 ~08:20 CET · Chat normal / ejecución aislada**: se publicaron diagnóstico seguro de memoria y 7 pruebas PASS, se construyó una candidata reproducible (458 archivos productivos verificados) y se probó completa (132/132 Node + 1/1 MP4 nativo FFmpeg). **El bloqueo Remotion en contenedor y la integración cinematográfica final permanecen pendientes.** Ningún despliegue.

- **2026-11-05 ~08:00 CET · Chat normal / auditoría de solo lectura**: corte inicial, 50 % estimado, 558/558 regresión, 128/129 dirigida con 1 omitida, bloqueo memoria contenedor. Este documento inaugura el estado único; no se ha modificado producción. Las mejoras posteriores deben documentarse aquí con su commit y resultados nuevos.
