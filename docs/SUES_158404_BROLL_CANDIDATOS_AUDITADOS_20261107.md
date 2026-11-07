# Reel 158404 · candidatos B-roll inspeccionados (07/11/2026)

**Fase 1 · SUES AI Film Director v1.5.7, normativa V2 D01–D77.** Inspección técnica y visual de seis clips Pexels en staging, no asignación ni permiso creativo para ejecutar un montaje. Fuentes MP4 temporales en VPS: `/tmp/sues-film-director-candidates-20261107/`. La carpeta temporal NO es una biblioteca persistente ni acredita su conservación futura; no depender de ella sin importar y verificar.

**Política:** Pexels permite uso comercial y modificación sin atribución, sujeto a no mostrar personas identificables desfavorablemente, no insinuar respaldo y respetar marcas/privacidad. Fuente: https://www.pexels.com/es-es/license/ . La licencia general no comprueba automáticamente permisos de terceros ni adecuación cinematográfica; una revisión de Carlos continúa siendo necesaria para aceptar B-roll específico.

| Slot | Pexels ID | Duración s | Resolución / fps | SHA256 descargado | Dictamen visual |
|---|---|---:|---|---|---|
| B01 aplausos | 8513575 | 11.400 | 3840×2160, 25 | `571098cc6293c818a81bed222d1023f86fa9ac52eb013a761ed83d39d193ddeb` | **CANDIDATO**, manos aplaudiendo bajo luz púrpura, encuadre lateral horizontal; hay que verificar crop a 9:16 y semántica respecto a reconocimiento externo |
| B03 límite personal | 6904090 | 11.370 | 2160×3840, 25 | `2f3e6f991dc9c34530637830fd9932b96542fb6e2fd15d9224f8adf63301f4b1` | **CANDIDATO**, silueta anónima haciendo gesto de alto. Verificar que la estética blanca/negra encaje y preserve el matiz de poner límites con calma |
| B02 infancia/grupo | 8083184 | 11.700 | 1920×1080, 30 | `154bc1de6c89c236a2b995b3b43232869366d6c645065218090784cac20a5d08` | **DESCARTADO**, niños caminando juntos, no niño incorporándose a un grupo |
| B04 apartamiento/rechazo | 36337620 | 17.017 | 3840×2160, 23.976 | `994db2d5f5be2d039c170334c5b31823c38021d2c86760ca251690b291b05fe1` | **DESCARTADO**, una silueta caminando hacia una calle transitada, sin interacción de rechazo reconocible |
| B05 espejo/reconocimiento | 7326751 | 12.073 | 720×1280, 23.976 | `442591792403b8495810e8d19434694f30aadc45939e63f1d46c0a107e71d776` | **DESCARTADO**, persona vistiéndose ante espejo, lectura narrativa insuficiente |
| B05 alternativa | 9772531 | pendiente de ffprobe | pendiente de ffprobe | `5ba157f7fcf4390f116947ef6d0af2b08e901e87ec588b6f9b54468969ba98ce` | **DESCARTADO/RESTRICCIÓN**, rostro identificable ante espejo roto implica posibles connotaciones negativas y derechos de imagen; no usar sin prueba de permiso específico |

Enlaces verificables: https://www.pexels.com/video/a-person-clapping-her-hand-8513575/ y https://www.pexels.com/video/person-saying-stop-6904090/. Otros clips se descargaron desde `https://www.pexels.com/download/video/<ID>/`; anotar URL de ficha exacta al seleccionar.

**No confundir:** candidatos descargados en carpeta de pruebas con assets verificados registrados `approvedForProduction`, ni la licencia del sitio con aceptación creativa. No se han alterado inventarios oficiales. B01 y B03 siguen pendientes de crop de fotograma, selección de tramo, duración exacta, prueba cromática, y decisión creativa. B02, B04, B05 permanecen pendientes de encontrar recursos fieles o autorizar creación. M01–M03 son **composiciones motion**, no clips de stock y no deben resolverse mediante textos aislados. El soundtrack y las transiciones son operaciones aparte.

**Próxima fase técnica:** encontrar B02/B04/B05 aceptables, verificar jurídicamente cada candidato y ejecutar previsualizaciones + dos QA audiovisuales tras aprobar storyboard; desarrollar las 52 instrucciones todavía sin equivalencia concreta en el motor o marcar las capacidades genuinamente pendientes. La fase 1 no puede declararse 100%.

## Verificación de encuadre vertical de B01

El clip 8513575, originalmente 3840×2160 horizontal, se muestreó mediante FFmpeg en un entorno Docker sin red con recorte centrado 1215×2160 y reducción diagnóstica a 270×480. Se inspeccionaron tres muestras de la secuencia: manos aplaudiendo visibles en las tres, con fondo oscuro desenfocado y luz progresivamente magenta. **Técnicamente permite una lectura vertical de aplausos**, sin que eso demuestre QA del plano final, safe zones, color final, transición ni aceptación artística. Prueba temporal en staging: `/tmp/sues-film-director-candidates-20261107/8513575-vertical-crop-sheet.jpg`; no es un material de biblioteca persistente.

## Otros candidatos encontrados mediante búsqueda, no auditados en media

- **B05**: https://www.pexels.com/video/man-reflecting-in-mirror-7671931/ ; ficha promete mirada introspectiva. **Pendiente** descarga/inspección visual, calidad de encuadre y licencia de retrato en contexto.
- **B04**: https://www.pexels.com/video/a-woman-feeling-isolated-8410083/ ; ficha describe persona apartada mientras otras interactúan. **NO SELECCIONAR** automáticamente: caras reconocibles, narrativa de rechazo, potencial conflicto de licencia Pexels sobre personas en posición desfavorable. Solo considerar con acreditación específica de derechos del uso.
- **B02**: https://www.pexels.com/video/children-walking-on-a-paved-pathway-with-their-backpacks-3191109/ ; describe un grupo caminando, pero NO confirma un menor aislado que se incorpora; sigue faltando la acción requerida.

