# Fase 4 · Visión / cámara inteligente

Completada para POC_001 el 16/10/2026. Núcleo provider-neutral, fixture real y dos
perfiles parametrizados. Ver CAMERA_PROFILES_VALIDATION.md para pruebas/evidencias.

Base recomendada composition 1,40× fijo; alternativa conservative 1,12×.
Ambos interpolan en tiempo fuente, suavizan posición y mantienen crop dentro del frame.
Zoom inicial fijo evita respiración; énfasis semántico futuro queda en Director validado.

50/50 tests y syntax OK; replay real y comparación local revisada en fotogramas.
Sin repetir MediaPipe ni ASR ni usar APIs de render. No es validación V1 completa.
No aplicar keyframes de tiempo fuente directamente a un vídeo con cortes.

Detector: JSON 74 muestras/73 caras, bbox/ojos, confidence proxy documentado.
Tráfico inesperado del SDK sigue bloqueando nuevas inferencias; se usó fixture existente.
Continuar con las foundations en orden según PARALLEL_FOUNDATIONS_5_10.md.
