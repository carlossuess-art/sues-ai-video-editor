# SUES Film Director 1.5.7 / Normativa V2 D01–D77 · B02 storyboard de revisión

**ESTADO: PROPUESTO / NO APROBADO AUDIOVISUALMENTE / NO IMPORTABLE TODAVÍA.** El Reel 158404 utiliza una historia fuente de 7 escenas/49 operaciones. Este storyboard conserva sus ID y no certifica que el compositor ejecute las demás operaciones. Probar siempre sobre CLON FableCut; el original de seis clips queda intacto.

## Escena 02 — Aprender a encajar · 7,73–16,83 s

- **Plano A · `shot-2-1`, 7,73–9,50 s**: Carlos y su voz originales; sin introducir antes de tiempo al niño ni título.
- **Plano B · `shot-2-2`, 9,50–13,50 s**: en la composición de prueba existe la foto recortada de varios niños detrás de Carlos, arriba/derecha; V2 imagen RGBA x=340, y=−160, escala=0,85; V3 Carlos delante x=0,y=0,escala=1 con matte de luminancia V4 temporal de 120 frames, y V1 original bloqueado. Se conserva el recurso narrativo B02, cuyo JPG original coincide con SHA del plan. Verificar silueta, manos, rostro, niños, bordes y recorte durante 120 fotogramas: la plancha de 12 no acredita perfección temporal.
- **Título protagonista · `title-3`, 9,94–11,60 s**: «NO MOLESTAR», ligado a la palabra y contexto de voz aún sin revisión humana. Propuesta: situado por encima de la cabeza SIN tapar niños ni invadir zonas seguras, Montserrat Bold verificable, blanco y naranja fuego, progresivo. Coordenadas finales **pendientes de frames observados**; no crear ni autorizar capa anticipatoria. El MP4 de B02 actualmente NO contiene ese título.
- **Subtítulos · `captions-2`, 7,73–16,83 s**: palabra a palabra acumulativa, máximo dos líneas, debajo de la barbilla, con palabras clave de mayor tamaño; conservar negaciones. Candidatos ASR no verificados: 11 palabras en la ventana 9,5–13,5 s. Alertas: frontera izquierda, confianza baja y frontera derecha. Transcripción definitiva y ancla de barbilla requieren revisión antes de generar clips reales.
- **Elemento de laboratorio V5 oro**: el proyecto exportado añade objeto dorado 10,60–11,80 s (x=−390,y=−650,escala=0,6). Ese objeto NO está ligado a un ID de operación del storyboard de las 49 acciones; visualmente se corta por el margen izquierdo y su semántica no está acreditada. No promocionarlo a efecto artístico aprobado ni conservarlo por inercia. Propuesta de dirección: comparar con escena B02 sin objeto en clon y, si la narrativa requiere acento, elegir uno que explique «encajar/expectativas» y se pueda justificar en voz.
- **Transiciones**: el plan indica transición IN y OUT del recurso B02. Duración, técnica, z-index, feather (referencia del plan: 65 px sobre 540) y frame exacto deben comprobarse en el motor. No sustituir silenciosamente por cortes.
- **Audio**: única voz original A1 protegida (volumen 0,8) presente en el export. Música continua y ducking previstos en `music-scene-02` pero NO verificados/licenciados ni mezclados completamente.
- **Plano C · `shot-2-3`, 13,50–16,83 s**: retorno a Carlos, verificando que la salida no corte sílabas ni cambie la sincronía de capas.

## Evidencia real vs objetivos

- Bruto 1080×1920, 73,766667 s FableCut original; fuente SHA real coincide con plan. Storybook 73,753467 s (diferencia ~13,2 ms): no redondear automáticamente ni suponer que todos los cortes son frame-exact.
- Export de **4 s, 120/120 frames** con 6 pistas, B02 y V5, H264+AAC, 1080×1920 30fps, 3 mediciones preview/export SSIM 0,969279/0,978741/0,967357. No equivale a supervisión perceptual o Reel completo.
- Operación B02: **candidata técnica representada**, pero no «ejecutada y aprobada». Las 49 operaciones no tienen certificación bidireccional de ejecución completa; jamás afirmar 1/49 acabado ni que el Reel está listo.

## Siguientes operaciones sin bloquear el proyecto

1. Recuperar imagen y audio ORIGINAL en QA; solicitar revisión humana de las 11 palabras solo para activar captions definitivos. Hasta entonces, seguir con geometría, interfaces, capas y control de proyectos sin simular voz verificada.
2. Preparar comparación A/B en clon nativo: B02 sin oro experimental vs B02 actual; comprobar rostro/niños, prioridades y apariencia de 120 frames. No tocar original.
3. Implementar importador/dispatcher para las operaciones realmente representables, dejando las demás explícitamente bloqueadas por ID. Un solo timeline, manifest bidireccional, CAS y undo; nunca un MP4 aplanado como sustituto de un proyecto editable.
4. Ejecutar dos pasadas de supervisor audiovisual del fragmento íntegro y revisión artística por Carlos antes de continuar al Reel 73,75 s.

**Inventarios privados:** `/srv/sues-fablecut-next/data/qa/b02-despill50-full-120f-proof-20261108/` (vídeo/capturas originales de QA) y `/srv/sues-fablecut-next/data/qa/reel-158404-milestone1-20261108/readiness-report.json` (auditoría íntegra por 49 operaciones, creada por `scripts/engine-next/reel-158404-milestone-audit.py`). No publicar voz o fotogramas privados en GitHub.
