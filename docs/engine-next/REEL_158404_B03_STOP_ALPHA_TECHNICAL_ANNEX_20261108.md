# SUES Reel 158404 · Escena 03 · Anexo técnico NO IMPORTABLE · 08/11/2026

**Contrato autoridad:** `sues-master-story/v1`, Film Director V2 D01–D77. Fuente original SHA `9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad`. Las operaciones usan timestamps nominales y algunos NO alinean exactamente con 30fps: no redondear silenciosamente. Faltan voz y fuente de recursos verificadas y licencia.

## Cobertura de las ocho operaciones (no hay ejecución completa)
| operationId | Intervalo y requerimiento técnico | Estado real |
| --- | --- | --- |
| `shot-3-1` | 16,83–20,80 vídeo/cara/voz originales | Fuente existente, render del tramo completo pendiente |
| `shot-3-2` | 20,80–24,10 cámara + gesto | Subintervalo 23–23,5 renderizado, NO tramo completo |
| `shot-3-3` | 24,10–26,67 retorno a cámara | PENDIENTE |
| `M01-overlay` | 16,83–20,80, objeto motion/2 bloques «DECIR NO/SENTIR CULPA» sin cubrir cara | PENDIENTE voz, geometría, materiales y motor |
| `GIF-STOP-overlay` | 22,85–23,95: recurso alfa sobre pecho, oclusión, movimiento y salida | Parcial QA. WebM 0,966s / clip 22,88–23,84 vs 1,10s previsto; NO inventar frames |
| `title-4` | 23,04–24,10, «LÍMITES» arriba, composición/contraste y timing auténtico | PENDIENTE transcripción y safe zones |
| `captions-3` | 16,83–26,67, palabra por palabra acumulativa bajo barbilla | PENDIENTE escucha humana y geometría |
| `music-scene-03` | 16,83–26,67, música/SFX licenciados y ducking | PENDIENTE licencias y QA auditiva |

## Recurso alfa real y prueba nativa
- Archivo original existente `sues-158404-hand-alpha-browser.webm`, VP9 alfa `alpha_mode=1`, 256×256 30fps 29 frames, SHA256 `77d114fe5d754aa3057348773cb01139a5afbc141fbf21e530082142c8101a0f`, asset `m_sues_158404_hand_alpha_webm_browser`. Derechos/comercialización del GIF de origen POR VERIFICAR.
- En clon FableCut se habilitó solo V3 `sues_alpha_hand_review_only` para `23,00–23,50`; V1 vídeo y A1 voz siempre bloqueados. Cinco propuestas de geometría; `x=160,y=430,scale=0.46` evita oclusión facial respecto a x0/y0 y x150/y100, que se descartaron por tapar boca.
- **Export auténtico:** trabajo FableCut `x_4nfasqap` finalizado, 15 frames H.264 distintos 1080×1920/30fps + AAC 48kHz/0,5s, sin errores de navegador. MP4 candidato SHA `27e7a01e892d2c1faf83d8a3d66b0a841295d588c9eb15d4a00b96968f95ae88`, 660.308 bytes, 44,473s de medición nativa. PCM de audio SHA `0252f3b3269e3a4f7f3b4351aa01d448aba9ab056e0b6f152f07994985a744fb`, **idéntico** al de la prueba de mano con geometría base. `B03-STOP-chest-right-15f-QA-proof.json` privado.
- **Limitación:** la muñeca aparece cortada rectangularmente. Se generó solo **CANDIDATO QA** VP9 29f alfa, SHA `71aae21683898da325f6f36817963f01b6982a79ea59a1ac7e5b3fe98b5d27d4`, conservando archivo original y agregando `m_sues_b03_stop_hand_feather24_qa` en biblioteca del CLON. Espacialmente `alpha(X,Y)*min(1,max(0,(250-Y)/24))` difumina los últimos 24px de la muñeca; zona 226–249 reduce alfa ~45%, zona 100–190 prácticamente sin cambios. **El recodificado VP9 puede alterar RGB ligeramente, no afirmar bitstream idéntico.** Captura FableCut real confirma una mejora leve, **insuficiente para aprobación artística**.
- Media preflight: nueve recursos existentes en el clon con hand original; diez tras añadir el candidato nuevo; cero faltantes y proyectos editables. Todos los recursos y vídeo permanecen en VPS privado y ningún archivo con rostro/voz se ha subido a GitHub.

## Bloqueos explícitos / próximo gate
1. Plan de GIF STOP 1,10s vs asset disponible 0,966s y clip 0,96s: resolver con voz/timing auténticos, no duplicar cuadros por inercia.
2. Oclusión facial validada en cinco capturas; falta revisar 29 frames completos de alpha y zona subtítulos. La muñeca cortada exige intervención estética nueva o sustitución por elemento licenciado.
3. M01 debe contener animación/material cinematográfico real y semántica correcta; no simplificar a dos títulos por limitación del compositor. Pendientes `title-4`, `captions-3`, licencia musical, dos rondas QA.
4. No generar nuevos actores/rostros, no comprar ni generar recursos sin permiso específico, no modificar original FableCut revisión54/seis clips, no publicar Studio.
5. Cerrar primero un plano completo verificable y coordinar siempre storyboard humano y anexo. **NUNCA marcar «APROBADO» por tener 15 frames técnicos.**

**Artefactos del ensayo:** `/srv/sues-fablecut-next/data/qa/reel-158404-milestone1-20261108/perf-20261108/B03-stop-hand-first-15f/`.
