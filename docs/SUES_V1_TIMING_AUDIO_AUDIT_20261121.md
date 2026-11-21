# V1 · Auditoría conservadora de silencios en palabras

21/11/2026 · Rama canónica PR #27 · Candidata aislada · NO producción.

## Problema y origen

Carlos revisó Q03_c: el único desfase que comunicó fue «para» aproximadamente 1,4–1,5 s adelantada cerca del segundo 54. El reloj de Whisper asignó 53,42–55,12 s, aunque la pista de voz limpia contiene una pausa 53,50–55,02 s. No se debe reescribir el Reel para ocultar un defecto general del ASR.

## Cambio real en código

El nuevo módulo `scripts/asr/word_timing_silence.py` audita palabras de duración igual o superior a 0,90 s por energía RMS en bloques de 20 ms, con pausa mínima de 0,35 s, comienzo temprano y evidencia de voz posterior. `scripts/asr/worker.py` lo invoca tras la inferencia offline, conserva los tiempos originales y marca como `timingUncertain:true` las anclas dudosas. Conserva en la procedencia índices y pausas de revisión, sin guardar muestras acústicas. Si el decodificador falla, lo declara no disponible. No inventa la hora exacta del fonema ni mueve un subtítulo.

## Evidencia

- 6/6 pruebas Python independientes superadas; cubren el caso, voz continua, pausa final, voz muy baja, silencio tardío y validación.
- Voz real aislada, 170 palabras: 7 con duración larga, 2 marcadas (incluida «para» y «por»). «Por» no tiene revisión auditiva y no se declara error.
- Mezcla con música: NO se detectó la misma pausa por contaminación RMS. El análisis debe usar pista de voz limpia o reconocer la limitación.
- `npm run check` PASS; pruebas dirigidas bridge nativo y binding 7/7 PASS. No equivalen a aprobación visual, doble QA ni render final.
- Faltan comprobar otras voces, respiraciones, ruido y la ejecución completa del worker antes de habilitarlo.

## Siguiente y rollback

El checkout de pruebas sigue aislado. Para revertir el cambio ASR basta restaurar `scripts/asr/worker.py` y quitar el nuevo módulo. No reescribe transcripciones ya importadas. La integración del host nativo FableCut en el arranque del editor, sus contratos de autenticación, la regresión y rollback del contenedor todavía son pendientes. Q03 continúa, Q04 será aceptación funcional del editor y Q05 despliegue ya autorizado sigue sin ejecutarse. No tocar WAC, V29, Reel publicado, medios originales o DNS.
