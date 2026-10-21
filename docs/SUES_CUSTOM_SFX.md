# Sonidos privados por tiempo

La biblioteca distingue `sfx` (0,03–30 s) de `audio` musical (3–600 s).
Ambos conservan el límite de 40 MiB y requieren procedencia declarada. La
biblioteca privada admite 24 recursos en total, deduplica por SHA256 y verifica
el archivo al resolverlo. Los archivos comerciales y sus enlaces no van en Git.

En SFX se puede elegir y escuchar un sonido, indicar su inicio y volumen, añadirlo
y quitarlo. Guardar y generar una vista previa permite escuchar la mezcla real.
Los sonidos explícitos son independientes del interruptor de efectos de motions.
Una versión admite 40 cues y tres simultáneos. El sonido completo debe caber en
el vídeo; no se recorta, repite, acelera ni desplaza implícitamente. Los tiempos
son segundos del original; esta capacidad no añade cortes ni cambia velocidades.

## Contrato externo

`Preparar instrucciones para Gemini` expone los IDs reales y duraciones de los
recursos privados disponibles. El plan conserva `sues-edit-plan/v1` y el SHA256
del original. Una operación compatible es:

```json
{"type":"sfx","resourceId":"SHA256_DEL_RECURSO_DEL_CATALOGO","start":2.125,"gain":0.3}
```

El ejemplo requiere sustituir el ID por uno del catálogo. `gain` admite 0–0,7.
La revisión sigue siendo atómica: un recurso ausente o una operación incompatible
bloquea la ejecución completa. Se crea otra versión; la anterior se conserva.
No hay nuevo modelo ni llamada a Gemini desde el editor.

## Render, mezcla y copia

Cada archivo seleccionado entra una vez en FFmpeg. Repetir un recurso distribuye
su audio a cues independientes, con retardo a 48 kHz, volumen individual y
pequeños fades de entrada/salida. El bus se atenúa según la mezcla de voz existente
y termina con limitador sin autoganancia. Si hay música u otros efectos, el
sidechain recibe esa mezcla existente; no es un detector semántico de habla.
Los sonidos no sustituyen ni cortan la pista original. El renderer verifica
procedencia, duración y hashes antes y después del render.

El fingerprint incluye ajustes, recursos y motor. La copia portable incorpora
los sonidos únicos y sus hashes; puede restaurarse sin la biblioteca original.
El verificador TAR exige que sus rutas estén dentro de los archivos comprobados.
El cálculo de espacio incluye los sonidos seleccionados.

## Validación

- `npm test`, `npm run check` y compilación del renderer Python.
- `tests/custom-sfx.test.js`: límites, duplicación, solapamientos, música/SFX
  separados, restauración y detección de alteraciones, planes externos atómicos.
- FFmpeg real: inicio por muestras, atenuación bajo voz, conservación fuera de cues,
  mezcla conjunta con música/efectos de motions, muestras finitas y limitador.
- `smoke_sfx_render.mjs OUTPUT SFX_WAV`: MP4 generado de 24 s, mezcla conjunta,
  dos cues/una entrada, decodificación completa y hash del original conservado.
- `smoke_custom_sfx.mjs OUTPUT`: Chromium con `SUES_PLAYWRIGHT_MODULE`,
  `SUES_CHROMIUM_PATH` y `SUES_QA_SFX`; recursos privados, controles SFX,
  revisión/ejecución externa, MP4 y descarga, móvil y escritorio.

Las pruebas usan vídeo generado y análisis facial de fixture. No equivalen a
aceptación sonora humana ni a análisis de un vídeo real por un Director LLM.
MOGRT, presets de Adobe/CapCut y música de práctica no se importan por esta función.
