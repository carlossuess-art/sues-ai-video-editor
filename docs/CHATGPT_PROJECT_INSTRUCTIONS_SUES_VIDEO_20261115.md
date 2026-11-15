# Instrucciones del proyecto ChatGPT · SUES AI VIDEO EDITOR

**Texto listo para pegar en las instrucciones del proyecto ChatGPT «SUES AI VIDEO EDITOR».**

## Continuidad prioritaria · 15/11/2026

Trabaja siempre sobre el editor **existente** SUES AI VIDEO EDITOR. No dupliques proyectos, ramas, librerías ni motores. Repositorio canónico: https://github.com/carlossuess-art/sues-ai-video-editor

**Rama vigente del módulo narrativo:** `feat/speech-linked-motion-grammar-20261115`.

**Informe y checkpoint de esta fase:** https://github.com/carlossuess-art/sues-ai-video-editor/blob/feat/speech-linked-motion-grammar-20261115/docs/SUES_MOTION_NARRATIVE_VPS_INTEGRATION_20261115.md

**Estado actualizado:** el módulo narrativo se ha integrado **en código de desarrollo** dentro de «Subtítulos y elementos»; reutiliza el selector de palabras del editor; tiene un endpoint autenticado de solo lectura, un adaptador de palabras originales y salida A/V revisable. **28/28 pruebas dirigidas PASS en el VPS el 15/11/2026**, incluidas HTTP, seguridad, simulación de interacción y regresión del servidor. **NO está desplegado en producción; NO existe render nativo del nuevo motor de motion ni QA audiovisual completo.** No presentar las pruebas dirigidas como aceptación de calidad artística o prueba total del editor.

**VPS/consola:** SUES Server Console MCP ya puede ejecutar y consultar comandos en el VPS Hostinger `srv1841004` (ID `1841004`). Priorizar esta consola frente a Desktop Commander para tareas compatibles y verificar siempre sus resultados. Su ejecución de comandos tenía `ulimit -Hf 1024`; evitar copias Git/archivos grandes por ese canal. Disco observado al 90 % con ~4,9 GB libres. Espacio de pruebas aislado: `/opt/sues-video-setup/motion-narrative-review-20261115` (copia parcial, NO worktree Git completo). No modificar sin verificar alcance, estado actual y proceso activo.

**Reglas de protección:** no tocar sin autorización diferenciada las versiones publicadas, WAC, los originales/Reels (especialmente V29), servidores ajenos, DNS, configuración productiva ni librerías. Separar prototipo SVG, soporte de comandos nativos, aprobación creativa y publicación. No inventar efecto, voz, anclas, licencias, tiempos, capacidad FableCut o resultados de QA.

**Siguiente fase exacta:** (1) QA visual y móvil del panel en navegador autorizado y aislado; (2) examinar el contrato operativo FableCut/HyperFrames actual y preparar mapping nativo de las animaciones por palabra; (3) validar con una narración real, fuente SHA, IDs de palabra, mapa fuente→edición, guion A/V completo por capas, clon privado y dos pasadas de auditoría antes de considerar producción.

**Skill obligatoria:** activar y leer la última SUES AI Film Director y todas sus referencias vigentes antes de cada plan nuevo, revisión, ejecución y QA; conservar las normas de subtítulos, identidad SUES y correspondencia 1:1 del guion humano con el contrato técnico. Consultar antes `PROJECT_STATUS.md`, `AGENTS.md` y el informe enlazado, reconciliando la rama y HEAD reales.

**Para mantener continuidad:** cuando cambie el estado verificado, actualizar `PROJECT_STATUS.md`, el checkpoint específico y estas instrucciones del proyecto; distinguir pruebas locales, VPS y producción.
