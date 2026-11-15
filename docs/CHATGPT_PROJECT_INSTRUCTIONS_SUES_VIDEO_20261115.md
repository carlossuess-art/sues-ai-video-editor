## ÚLTIMO CHECKPOINT 15/11/2026 · Autorización Master Director + HyperFrames + FableCut CAS (PRIVADA)

Primero leer `docs/SUES_HF_MASTER_PRIVATE_APPROVAL_CAS_20261115.md` en `carlossuess-art/sues-ai-video-editor`, rama `feat/speech-linked-motion-grammar-20261115`. Implementada operación real HyperFrames en la historia canónica con preflight inmutable, nuevo HEAD CAS, aprobación explícita separada, ledger de token de un solo uso, ejecución privada HF render/variables SHA y transacción `addMedia+addClip` FableCut por MCP CAS. **Demostración íntegra con contenido y aprobación 100 % sintéticos**: MP4 final privado 10s/300frames H264 1080×1920/30fps SHA `87903e0fff576a68ffcaa23738b121def90e3d1afa235fd9fb5a91443930f0d2`; comparación 151f HF + 149f original. **102/102 Node + 1/1 Chrome PASS.** UI/código **NO DESPLEGADOS**, no edición ni aprobación real de usuario, WAC/V29/producción intactos. Prioridad próxima: host con autenticación humana y clon privado de nuevo Reel real, plan A/V de todas las capas, compositor multioperación, mapper de cortes y dos pasadas QA reales; ninguna aprobación/publicación automática.

## CHECKPOINT PRIORITARIO · 15/11/2026 · Preflight automático Motion

Primero consultar `docs/SUES_HYPERFRAMES_EDITOR_AUTOMATIC_PREFLIGHT_20261115.md`, `AGENTS.md` y `PROJECT_STATUS.md` en el repo `carlossuess-art/sues-ai-video-editor`, rama `feat/speech-linked-motion-grammar-20261115`. Se añadió el puente **selector real de palabras → preflight autenticado → variables HyperFrames estrictas → guion técnico A/V de 7 filas**. Render nativo HF con variables nuevas verificado en VPS, 151f 30fps 1080×1920 SHA `095bc084c26959381bd0f79f4ea5b1fdfc6633a4f145cf2fb2e36d2388bcdb4f`, Chrome comprobó las entradas exactas de cada palabra. **93/93 pruebas dirigidas Node + 1 Chromium PASS.** Código solo en rama; no desplegado. Todo preflight es `canExecute:false` y `creativeApproved:false`; no autoriza edición ni publicar. Próximo: conexión con MasterDirectorProjectStore, revisión/ledger/CAS nativos FableCut, fuentes reales/cortes y doble QA creativa. **HyperFrames crea motions; FableCut monta.**

## CHECKPOINT ACTUALIZADO · 15/11/2026 · Render e integración NATIVOS verificados

Consultar [docs/SUES_HYPERFRAMES_FABLECUT_NATIVE_CHAIN_20261115.md](docs/SUES_HYPERFRAMES_FABLECUT_NATIVE_CHAIN_20261115.md). Se ha logrado **render REAL HyperFrames → importación MCP REAL de FableCut → exportación REAL FableCut**, 151 frames 1080×1920/30 fps en entorno sintético y PRIVADO. Ya no procede tratar el bloqueo `SIGXFSZ` como impedimento actual: se resolvió mediante trabajo temporal acotado (sin cambiar globales). SHA HF `7f1ac8807b8275fde6d9d2b43fa440954484aae3588a477c17d35ba8395a9ec1`; SHA FableCut `909eaaa37b41546fff29292403eedf677a63ee1c6eb2ea679347d42c5cfa9713`; 151/151 frames comparados con PSNR mín 45,36 dB. **HyperFrames sigue siendo el motor dueño de las animaciones**. FableCut monta media, no modifica las capas animadas internas del MP4. Quedan voz y vídeo reales, QA y aprobación creativa doble. **No producción ni publicación.**

## ACTUALIZACIÓN OPERATIVA PRIORITARIA · 15/11/2026

**HyperFrames es el motor principal para TODOS los motion graphics.** SUES MASTER DIRECTOR decide narrativa, palabras, ritmo, posiciones y transiciones; HyperFrames ejecuta HTML/SVG/GSAP/Three.js y conserva editables los elementos internos; FableCut monta el Reel, sus pistas y la composición exportada y puede modificar el clip, **NO** las capas internas de un vídeo ya renderizado. La experimentación con objetos nativos FableCut no sustituye HyperFrames.

Consultar primero `docs/SUES_HYPERFRAMES_PRIMARY_HANDOFF_20261115.md`, `PROJECT_STATUS.md` y `AGENTS.md` en la rama vigente. 74/74 pruebas dirigidas PASS, HyperFrames lint 0/0; runtime previamente desincronizado corregido, fuente SHA `e41dadf2a5130698b5c193155b2a7dd28a922ed4bfe28ced404e45e0b8a9dba3`. No confundir manifiesto de fuente o proxy SVG con render nativo ni con autorización de integración/publicación. QA HyperFrames nativa sigue pendiente por Chrome `SIGXFSZ`. No tocar producción/WAC/V29/DNS.

# Instrucciones del proyecto ChatGPT · SUES AI VIDEO EDITOR

**Texto listo para pegar en las instrucciones del proyecto ChatGPT «SUES AI VIDEO EDITOR».**

## Continuidad prioritaria · 15/11/2026

Trabaja siempre sobre el editor **existente** SUES AI VIDEO EDITOR. No dupliques proyectos, ramas, librerías ni motores. Repositorio canónico: https://github.com/carlossuess-art/sues-ai-video-editor

**Rama vigente del módulo narrativo:** `feat/speech-linked-motion-grammar-20261115`.

**Informe y checkpoint de esta fase:** https://github.com/carlossuess-art/sues-ai-video-editor/blob/feat/speech-linked-motion-grammar-20261115/docs/SUES_MOTION_NARRATIVE_VPS_INTEGRATION_20261115.md

**Estado actualizado:** el módulo narrativo se ha integrado **en código de desarrollo** dentro de «Subtítulos y elementos»; reutiliza el selector de palabras del editor; tiene un endpoint autenticado de solo lectura, un adaptador de palabras originales y salida A/V revisable. **60/60 pruebas dirigidas PASS en el VPS el 15/11/2026**, más QA aislada de Chromium móvil/escritorio sobre el panel real con API ficticia (no despliegue ni render FableCut), incluidas HTTP, seguridad, simulación de interacción y regresión del servidor. **NO está desplegado en producción; NO existe render nativo del nuevo motor de motion ni QA audiovisual completo.** No presentar las pruebas dirigidas como aceptación de calidad artística o prueba total del editor.

**VPS/consola:** SUES Server Console MCP ya puede ejecutar y consultar comandos en el VPS Hostinger `srv1841004` (ID `1841004`). Priorizar esta consola frente a Desktop Commander para tareas compatibles y verificar siempre sus resultados. Su ejecución de comandos tenía `ulimit -Hf 1024`; evitar copias Git/archivos grandes por ese canal. Disco observado al 90 % con ~4,9 GB libres. Espacio de pruebas aislado: `/opt/sues-video-setup/motion-narrative-review-20261115` (copia parcial, NO worktree Git completo). No modificar sin verificar alcance, estado actual y proceso activo.

**Reglas de protección:** no tocar sin autorización diferenciada las versiones publicadas, WAC, los originales/Reels (especialmente V29), servidores ajenos, DNS, configuración productiva ni librerías. Separar prototipo SVG, soporte de comandos nativos, aprobación creativa y publicación. No inventar efecto, voz, anclas, licencias, tiempos, capacidad FableCut o resultados de QA.

**Siguiente fase exacta:** (1) QA visual y móvil del panel en navegador autorizado y aislado; (2) examinar el contrato operativo FableCut/HyperFrames actual y preparar mapping nativo de las animaciones por palabra; (3) validar con una narración real, fuente SHA, IDs de palabra, mapa fuente→edición, guion A/V completo por capas, clon privado y dos pasadas de auditoría antes de considerar producción.

**Skill obligatoria:** activar y leer la última SUES AI Film Director y todas sus referencias vigentes antes de cada plan nuevo, revisión, ejecución y QA; conservar las normas de subtítulos, identidad SUES y correspondencia 1:1 del guion humano con el contrato técnico. Consultar antes `PROJECT_STATUS.md`, `AGENTS.md` y el informe enlazado, reconciliando la rama y HEAD reales.

**Para mantener continuidad:** cuando cambie el estado verificado, actualizar `PROJECT_STATUS.md`, el checkpoint específico y estas instrucciones del proyecto; distinguir pruebas locales, VPS y producción.
