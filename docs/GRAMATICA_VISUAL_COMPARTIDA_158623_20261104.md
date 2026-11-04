# Gramática audiovisual compartida · 158623 · 04/11/2026

## Autoridad y continuidad
Carlos ha validado como **especificación técnica** la tabla completa elaborada por una IA especializada en análisis de vídeo. No volver a desautorizar colores, tamaños, tiempos o coordenadas usando capturas a 4 fps. Las capturas complementan la inspección del movimiento y el QA de la propia implementación.

**Identificador único:** `sues-visual-grammar-158623-v1`.

Fuentes:
- Código canónico: `src/visual-grammar.js`.
- Remotion: `experiments/remotion-cta/src/SemanticVisualBeat.tsx`, composición `SUES-VISUAL-GRAMMAR-158623` tanto en `Root.tsx` como en `FullRoot.tsx`.
- Editor: `src/style-variants.js` (perfiles), `src/director-context.js` (catálogo para el Director), `src/local-pipeline.js` (propiedad `plan.visualGrammar`), `src/elements.js` (límites de tamaño/acentos para ELEMENTS).
- Skill privada SUES AI Film Director versión 1.4.2, con `references/GRAMATICA_VISUAL_158623.md`, invocado desde `references/KEANU_ADN.md`.
- Análisis de la referencia y tabla transcrita: `experiments/remotion-cta/docs/REFERENCIA_158623_ANALISIS_4FPS_20261104.md`.

## Contrato aceptado
Lino 1080 × 1920; familia Montserrat/Inter/Poppins; conector semibold/bold 62–68 px, blanco #FFFFFF y sombra negra blur8/60%; protagonista ExtraBold/Black 98–115 px y relación 1,5–1,8; `FORTUNA` #26F7FD glow #00E5FF/25 px; cantidades `75 MILLONES` #59FF00 glow #32CD32/20 px más ambiente Screen 40%; contraste #FFD000. Pizarra clara con texto #1E1E1E y contorno blanco 6 px. En hablante X510–520 y pecho Y890–1060 evitando boca; pantalla completa encabezados Y680–890 y objetos Y1000–1400. Construcción acumulativa ligada a palabras pronunciadas, no intervalos arbitrarios.

## Contrato API de editor (ahora)
`visualGrammarForProfile(styleId)` contiene el mismo id y tokens para cualquier ruta. `completeDirectorCatalog` devuelve `visualGrammar`. `prepareProject` adjunta `plan.visualGrammar` y el perfil automático lo anuncia; no invoca nuevos proveedores. El renderer nativo `drawElements` utiliza tamaño máximo y acento donde hay soporte. Remotion `compileVisualBeat` valida `layoutMode`, `speechCue`, intervalo, roles, tamaño y tiempos por línea; `appearanceAtFrame` devuelve visibilidad y easing del build-in. No inventar timestamps ni interpretar entradas incompletas como escenas listas.

**Límite funcional importante:** el motor FFmpeg/ASS actual no soporta de forma genérica todas las operaciones de `SemanticVisualBeat` (oclusiones reales, objetos editables, efectos glows equivalentes). Una propiedad declarativa `plan.visualGrammar` no equivale a un visual-beat exportado. La composición de Remotion sí renderiza la tipografía por línea, pero la integración de ese motor como pista editable y automática del editor web sigue pendiente. El MP4 V2B guardado no ha sido modificado.

## QA y despliegue
- Remotion `tsc --noEmit` PASS.
- Fotogramas reales renderizados en el VPS, composición `SUES-VISUAL-GRAMMAR-158623` a frames 32 y 105; disponibles solo para QA de desarrollo.
- Pruebas dirigidas de gramática, estilos y ELEMENTS: **11/11 PASS**.
- Suite general desde el worktree aislado: **302 PASS, 50 FAIL**. Principales motivos: `ERR_MODULE_NOT_FOUND: ajv` en esta copia del proyecto y falta del ejecutable `ffmpeg` en PATH; al menos una aserción ajena necesita investigación. No afirmar regresión completa aprobada.
- **Producción no desplegada:** la versión viva bajo `release-mobile-layers-20261030` contiene funcionalidades adicionales (ej. ELEMENTS TRUE_FALSE). Copiar módulos enteros de la rama puede eliminarlas, por lo que no se hizo ese despliegue sin integración y QA de la versión desplegada. El editor público y proyectos anteriores permanecen intactos.
- Coste de API: 0. Sin servicios de pago, merge ni alteración de originales.

## Próxima acción exacta
Portar cambios mínimos a la versión que está en producción (sin sobrescribir módulos actuales), ejecutar pruebas de regresión en entorno con AJV/FFmpeg y doble auditoría visual; conectar visual-beats de Remotion al esquema de pistas reales y renderer cloud; generar una nueva edición V3 y someterla a aprobación de Carlos. No aprobar V1 ni atribuir capacidades futuras como implementadas.
