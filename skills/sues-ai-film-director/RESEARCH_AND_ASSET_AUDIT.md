# Auditoría de investigación e inventario · 2026-10-25

Estado: investigación documental inicial; NO se ha inspeccionado VPS, Drive, REA local ni render actual.

## Prioridad 0: evitar duplicaciones
1. Leer roadmap maestro, PROJECT_STATUS, ramas/PR y resultados recientes de Work.
2. Identificar REA instalado (ruta, versión, herramientas, logs, salidas), no reinstalar.
3. Verificar stack real de PyTorch, modelos, GPU/CPU/RAM/VRAM, costes y tiempos.
4. Probar qué instrucciones soporta realmente el renderizador y cuáles sólo están planificadas.

## Investigación comparativa
- CapCut: analizar interfaz de keyframes, máscaras, auto captions, seguimiento, efectos, templates, audio, limitaciones de automatización y condiciones de licencia; registrar evidencias y vídeos de prueba autorizados.
- DaVinci Resolve/Fusion: estudiar nodos Merge/Transform/Blur/Mask/Tracker, spline/keyframes, Magic Mask y Fairlight; adaptar conceptos, no clonar implementación.
- Modelos: comparar segmentación SAM2, detección facial y seguimiento temporal frente a presupuesto CPU/GPU. Hacer benchmark con 10s antes de integrar.
- Evaluación: sincronía por palabra, máscara temporal, tracking de ojos, transiciones, B-roll semántico, LUFS/true peak, safe zones y continuidad.

## Inventario de recursos a verificar
| Grupo | Punto de partida NO VERIFICADO | Evidencia requerida |
|---|---|---|
| B-roll | Objetivo 24, al menos 6 propios | ruta, preview, licencia, tags, duración, orientación |
| SFX | 13 únicos previamente identificados; objetivo 20 | hash, duración, pico, uso permitido |
| Música | objetivo 8 | licencia, BPM, intensidad, loop, stems |
| Overlays | objetivo 6 | alpha, resolución, licencia |
| Motion templates | 69 MOGRT previamente referenciados | compatibilidad real con motor y licencia |
| Fuentes | 75 previamente referenciadas | licencia embedding/render |
| Presets voz | Eco y TV | parámetros reproducibles y audio de prueba |
| Referencias | VID_20261022_101557_201.mp4 (DOPAMIN) y carpeta deckeanu | ruta real, autorización, notas temporales |

Buscar primero en las unidades Drive conectadas, especialmente materiales propios/comprados, sin descargar colecciones completas antes de catalogar. Prioridad de adquisición: propio/comprado > generado con derechos > Pexels > Freesound > Mixkit > Pixabay > Wikimedia > NASA; validar licencias individualmente.

## Criterios para cerrar
- Matriz con capacidades IMPLEMENTADO / FALLBACK / AUSENTE / SIN PROBAR.
- Biblioteca indexada con licencia y tags emoción/concepto/plano.
- Secuencia de 10 segundos realmente renderizada y auditada.
- No confundir demo, mock, dry-run o captura con exportación funcional.
