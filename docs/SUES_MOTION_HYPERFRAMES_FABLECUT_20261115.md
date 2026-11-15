# SUES · Motion narrativo · HyperFrames + composición editable FableCut · checkpoint 15/11/2026

**Estado:** desarrollo en rama aislada, pruebas reales en VPS, sin despliegue, sin aprobación creativa de Carlos y sin modificar los Reels existentes.

Repositorio: `carlossuess-art/sues-ai-video-editor` · rama `feat/speech-linked-motion-grammar-20261115`.

## Decisión de implementación

Se reutilizaron los dos módulos SVG ya desarrollados (tarjeta con palabras y continuidad hacia «hacer espacio»). Se identificaron recursos existentes en Hostinger, sin instalaciones ni créditos nuevos:

- HyperFrames **v0.9.20** instalado en `/opt/sues-video-setup/hyperframes-engine-next`, con `gsap 3.14.2` y `three 0.180.0`.
- FableCut real en `/srv/sues-fablecut-next`, con `project-ops.js` y `comp.js` capaces de validar figuras con radio animado y composiciones anidadas.
- SUES Server Console MCP disponible en `srv1841004`. Los procesos heredan límite duro de tamaño de archivo **1024 bloques** (`ulimit -Hf 1024`). No se cambió ni eludió esta restricción; Chrome de HyperFrames termina con `SIGXFSZ` en la comprobación de runtime. `hyperframes lint` **sí pasó 0 errores/0 advertencias** tras corregir la estructura HTML y la declaración de variables.
- Directorio exclusivo de desarrollo HyperFrames `/opt/sues-video-setup/hyperframes-engine-next/sues-motion-narrative-20261115`; nunca se reutilizó un proyecto de Reel de cliente.

## Guion A/V sintético por capas: 151 frames a 30 fps

El texto es **ficticio**, sin pista de audio, sin ASR, sin voz de Carlos y sin A-roll. No se presenta como un plan de Reel real aprobado.

| ID · intervalo [f0, fN) | Voz y anclas | A-roll / cámara | Capas / máscara | Motion / captions | Audio | QA y estado |
|---|---|---|---|---|---|---|
| MG01 · F0–F8 · 0–0,267 s | Sin voz; texto demo | Cámara centrada 1× | Fondo antracita, tarjeta z10, esquinas rectas | Apertura rectángulo desde línea horizontal | Sin audio | SVG validado |
| MG02 · F8–F32 · 0,267–1,067 s | «¿Y» F8, «SI» F14, «TE» F20, «ESCUCHARAS?» F26, sin word IDs reales | Cámara 1× | Tarjeta, texto por capas individuales; clip interno en SVG | Radio 0→62 px desde F8 a F19; entrada de cada palabra con blur→nítido | Sin audio; captions convencionales delegados al editor | SVG proxy |
| MG03 · F32–F51 · 1,067–1,700 s | Permanencia de lectura | Cámara 1× | Tarjeta y cuatro palabras | Retención legible | Sin audio | SVG proxy |
| MG04 · F51–F70 · 1,700–2,333 s | Cambio de idea; sin voz | Cámara de la tarjeta (no del fondo) escala 1→4,5, Y 0→−1950 px | Tarjeta+texto salen por arriba | Zoom de transición completo | Sin audio | SVG proxy |
| MG05 · F59–F92 · 1,967–3,067 s | «crear espacio» es solo metáfora de prueba | Segundo escenario fijo; comparte tapiz | Dos líneas verticales z20, x540±20→x114/966; y1540→895 | Se separan con causalidad visual y dejan hueco para texto | Sin audio | SVG proxy |
| MG06 · F81–F119 · 2,700–3,967 s | «HAZ» F81, «ESPACIO» F89, «PARA» F104, «ESCUCHARTE» F112, demo | Cámara fija | 4 textos independientes y líneas; espacio horizontal entre palabras **84 px fuente** | Las palabras entran durante la apertura de líneas; eliminada la pausa vacía del diseño anterior | Sin audio | SVG proxy; inspeccionados F84/F119 |
| MG07 · F123–F151 · 4,100–5,033 s | Permanencia sin voz | Cámara fija | Textos y líneas visibles | Lectura final; salida posterior aún NO diseñada por falta de narración | Sin audio | SVG proxy |

Los intervalos se solapan deliberadamente en el cambio de composición. No existe transcript auténtico, mapa fuente→montaje, selección real ni sincronía aprobada.

## Desarrollo y evidencia

**HyperFrames (HTML/GSAP):** `examples/motions/hyperframes-card-to-space/index.html`. Composición 1080×1920/30, clip temporal y cuatro variables de texto editables; reproduce SVG determinista mediante timeline GSAP pausada, registro `window.__timelines.main` y evento `hf-seek`. Verificación con `hyperframes lint` v0.9.20: 0 errores y 0 advertencias. El paso `hyperframes check` **falló por Chrome SIGXFSZ**, no puede presentarse como render HyperFrames ni como QA visual dentro del motor.

**Proxy SVG fuera de HyperFrames:** `render-svg-proxy.mjs`, con `sharp` y `ffmpeg` existentes. La versión inicial detectó que las palabras de la segunda frase quedaban demasiado juntas. Se aumentó la separación y se añadió prueba geométrica de solape. El proxy **r2** es H.264, **540×960, 30 fps, 151 frames, 5.033333 s**, sin audio; `SHA-256=b2da9bfbb651739408377ac70854f7f453e8de7b1263ee8cf33d6277993e9bb3`. Previsualización de QA en `/opt/sues-video-setup/hyperframes-engine-next/sues-motion-narrative-20261115/SUES_CARD_TO_SPACE_PROXY_QA-r2.mp4`. Inspección de F84 y F119: las palabras se leen separadas; NO hay revisión de reproducción completa y doble QA de un Reel.

**Candidata estructural nativa FableCut:** `src/motion-templates/fablecut-editable-candidate.js`. Define dos comps con `addComp`, clip padre `kind:comp`, figura rect con radius animado, cámara anidada con keyframes, dos figuras de rieles, cuadrícula por vectores y 8 clips independientes de texto. Se ejecutó **únicamente sobre fixture in-memory** mediante la implementación real `/srv/sues-fablecut-next/app/project-ops.js`, comprobando `checkProject` y `Comp.flatten`: **2 composiciones, 1 clip raíz, 14 clips virtuales (8 de texto, 5 figuras, 1 comp)**. Copia de QA privada **sin aplicar a FableCut productivo** en `/opt/sues-video-setup/motion-narrative-review-20261115/fablecut-private-qa/editable-motion-candidate.json`; SHA-256 de esa copia `bb576f8382164c88e0d2f693aab7db53d1634f84111b02311b1b18a7b2cbca38`.

**Suites dirigidas pertinentes en VPS:** **54/54 PASS**, incluyendo regresiones del servidor y panel narrativo, texto por palabra, huecos, separación geométrica y normalización/composición FableCut real. No equivalen a suite global histórica ni a render nativo FableCut.

## Diferencias importantes (NUNCA afirmar equivalencia sin resolver)

La candidata FableCut **es editable estructuralmente**, pero no está demostrada su **equivalencia visual** con el SVG/HyperFrames. Pueden diferir: desenfoque gaussiano progresivo por palabra, clipping del texto en rectángulo, degradados y sombras del SVG, fuentes/métricas, easing y rasterización de anidados. Requiere render comparativo real y correcciones por IDs y fotogramas. FableCut soporta `addComp` en ProjectOps; **el contrato Master Director actual no admite por sí solo un mapping canónico lossless de este módulo**. No eludir el ledger de aprobación para ejecutarlo, ni enviar estos ops directos a un proyecto real.

## Próximos trabajos

1. Resolver mediante vía **autorizada** la ejecución de Chrome/HyperFrames fuera del límite de la consola; nunca saltarse la protección ni reiniciar servicios operativos para forzar la renderización.
2. Abrir la composición en navegador de QA y realizar comparación visual exacta SVG↔FableCut de comienzo, centro y fin de cada operación. Empezar por el bloque con 4 palabras, tarjeta y zoom.
3. Diseñar un mapping canónico de composiciones FableCut con permisos, IDs, revisión y rollback que admita las capas editables sin pérdida. Si una operación no tiene soporte, conservarla en anexo; NO convertirla silenciosamente en vídeo plano.
4. Con un Reel auténtico nuevo: seleccionar palabras con IDs reales, mapear voz y cronología editada, generar guion A/V aprobado 1:1, render privado 1080×1920/30, comprobar audio y completar dos pasadas audiovisuales. Aprobación creativa y publicación son independientes.

## Protección de producción

Sin cambios de FableCut productivo, servicios, DNS, WAC, bibliotecas, V29, originales ni sitios publicados. No se instalaron nuevos motores ni se gastaron créditos de generación. Registrar cualquier cambio nuevo primero en `PROJECT_STATUS.md` y `AGENTS.md`; guardar este checkpoint para continuidad entre chats.
