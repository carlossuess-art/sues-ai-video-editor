# SUES AI VIDEO EDITOR · Fases y etapas verificadas · 08/11/2026

**Estado: desarrollo PR #27. NO fusionado, NO desplegado.** GitHub rama `feat/master-director-story-orchestration-20261104`. Los porcentajes son una **estimación de madurez técnica editorial**, no resultado de una fórmula ni garantía de cierre; un paso pendiente crítico puede mantener abierta una fase con muchos tests pasando.

**Leyenda:** ✅ validado con artefacto/prueba · ◐ parcial/prototipo · ○ pendiente · ⛔ bloqueado por revisión real.

## Fase 1. Infraestructura y motores — 90 % (técnica operativa, no endurecimiento final)
- ✅ 1.1 VPS Hostinger, servicio público SUES y FableCut persistente activos en 127.0.0.1:7780 detrás de SUES, HTTP 200.
- ✅ 1.2 FFmpeg, Chrome Headless, FableCut y motores HyperFrames/Three.js probados localmente.
- ✅ 1.3 Aislamiento de ensayos: puerto 7781 para copias transitorias, original de seis clips intacto, B02 desactivado.
- ◐ 1.4 Rendimiento/estabilidad para Reels largos: RAM física 3,8 GiB, swap 2 GiB, 16 GiB libres, export de 4 s validado; falta auditoría de render sostenido y concurrencia, backups/rollback final.

## Fase 2. Editor multipista único — 45 % (cuello de botella de producto)
- ✅ 2.1 FableCut conserva clips editables reales V1–V6 + A1 en copia QA; snapshots provienen de compositor auténtico.
- ✅ 2.2 Frontend staging proporcional: seis pistas verificadas en Chromium, slider y ±1 fotograma, Source vs Program, reproducción del bruto.
- ◐ 2.3 Inspector/autenticación y modificación CAS: controles de tamaño/transformación y rutas previstas; no se ha validado toda la UI junto al proyecto persistente con workflows de edición completos.
- ○ 2.4 Frontend NLE completo compartido por humano y agente (selección, arrastre, trim, undo/redo, importaciones, estado y exportar); pruebas de integración end-to-end y misma autoridad sin duplicación.

## Fase 3. Máscaras, niños detrás y profundidad — 80 % (motor de escena B02 probado)
- ✅ 3.1 Matte de Carlos V3 por V4 MODNet temporal 120 fotogramas, mantiene V1 original.
- ✅ 3.2 Grupo de cuatro niños V2 extraídos PNG RGBA transparente (alfa preservada), evita borde rectangular de la fotografía.
- ✅ 3.3 Orden de composición V2 niños detrás/V3 Carlos delante/V5 oro por delante en export NATIVA 120 fotogramas, 1080×1920 30fps H.264.
- ◐ 3.4 Artefactos finos de halo en pelo/ropa, revisión de toda la secuencia y aceptación de composición todavía pendientes. Experimento RGB 50 % reversible, sin veredicto artístico.

## Fase 4. Motion graphics y 3D — 60 % (una escena real, biblioteca incompleta)
- ✅ 4.1 Gold 3D HyperFrames/Three.js con alfa generado en local.
- ✅ 4.2 Overlay V5 reposicionado sobre Carlos a la izquierda para dejar a los niños visibles; exportación nativa completa B02 (4 s) con ese elemento.
- ◐ 4.3 Diseño/plantillas de fondos antracita y cuadrícula y composiciones; no validadas como biblioteca completa 2–3 tapices operativos.
- ○ 4.4 Editor visual plenamente funcional de gráficos/animaciones, keyframes, presets, vista/producción sin degradaciones y QA narrativa.

## Fase 5. Subtítulos progresivos y sonido — 65 % (capacidad probada, contenido real bloqueado)
- ✅ 5.1 Compilador progresivo palabra a palabra en una pista nativa V6, siempre desactivada en staging por defecto. Tres palabras **SINTÉTICAS de laboratorio** visibles en visor y export H.264 15 fotogramas, SSIM visor/export 0,967116, audio −22 LUFS/−11,5 dBTP.
- ✅ 5.2 Exportación nativa de 4s B02 con una voz de A1, −23,4 LUFS y −5,3 dBTP, sin FFmpeg posterior.
- ✅ 5.3 Modelo local faster-whisper-base-int8 generó 168 palabras **candidatas** y 11 en B02. Voz vs vídeo correlaciona >0,9998 en ventanas 4–24 y 50–70s, 0ms. Nueva auditoría de transcripción detecta 3 riesgos: primera palabra en 9,5 s, última acaba 13,5 s y una confianza 0,436. Preparado fragmento privado 8,7–14,3 s para escucha. **66/66 pruebas dirigidas pasan** con auditoría.
- ⛔ 5.4 Revisión humana de palabras y tiempos, posición bajo la barbilla en movimiento, subtítulos reales en V6, jerarquía palabras clave, música/SFX y mastering final. **Ningún clip con diálogo automático activado**.

## Fase 6. SUES MASTER DIRECTOR autónomo — 40 % (reglas y adaptadores, no orquestación cerrada)
- ✅ 6.1 Skill Film Director V2 D01–D77 y contrato maestro disponibles; no es prueba de ejecución.
- ◐ 6.2 Operaciones con adaptadores verificables para masks V2–V4, 3D V5, captions V6 y controles CAS, sin eliminación silenciosa de clips.
- ◐ 6.3 Uso programático de FableCut y auditorías de preview/export; falta demostrar 49 operaciones completas aplicadas por el cerebro al timeline compartido.
- ○ 6.4 Re-edición totalmente autónoma tras instrucciones en chat, inspección/corrección/undo y aprobación final reproducible.

## Fase 7. QA completa y despliegue — 30 % (validación parcial de 4s)
- ✅ 7.1 Escena B02 completa de 120/120 cuadros únicos 1080×1920 30fps H.264/AAC exportada por FableCut, con V1–V5 y voz. Tres SSIM de referencia 0,969279/0,978741/0,967357, mínimos no interpretados como QA perceptual.
- ✅ 7.2 V6 sintética demostró cadena editable → visor → MP4 nativo; 15/15 cuadros y validaciones técnicas. Suite actual **66/66 pruebas dirigidas PASS**.
- ○ 7.3 Reel completo ~74s, mezcla total, titulaciones, subtítulos reales, licencias, storyboard y revisión cinematográfica por Carlos.
- ○ 7.4 Seguridad UI integrada, backups, rollback, smoke tests del despliegue real, merge PR #27 y publicación.

## Avance concreto de esta tanda
- **Nuevo:** `src/engine-next/caption-review-gate.js` y `tests/engine-next/caption-review-gate.test.js` en PR27. Rechaza fuente falsa, orden incorrecto, palabra subframe/colisión y audita límites y baja confianza sin crear clips. A partir de ASR real B02: 11 candidatos; alertas `LEFT_BOUNDARY_MAY_CLIP_WORD`, `LOW_CONFIDENCE` y `RIGHT_BOUNDARY_MAY_CLIP_WORD`, **0 clips incorporados**.
- Prueba de contexto detecta una palabra inmediatamente antes del inicio y otra después del final; estas deben escuchar/revisar, no desplazar automáticamente el corte.
- Evidencia **privada**, no copiada a GitHub: `/srv/sues-fablecut-next/data/qa/b02-local-asr-candidate-20261108/caption-human-review-packet.json` y `b02-context-audio-8_7-to-14_3-PRIVATE.wav` más manifiesto y SHA.
- Estado final **66/66 tests dirigidos PASS**, repositorio sincronizado, FableCut público/persistente HTTP 200, copia original seis clips B02 desactivado.

## Siguiente puerta verificable
La siguiente condición para la Fase 5 es revisar **las 11 palabras y las fronteras 9,5/13,5 s** contra el audio original, probar el anclaje de subtítulos bajo la barbilla en movimiento y compilar las capas reales solo tras verificación. Trabajo independiente de ese bloqueo: integrar frontend multipista FableCut de forma segura en SUES (Fase 2) y sistema de edición/QA del Master Director (Fase 6). Ninguna fase se cierra por porcentajes o por tests sintéticos.
