# Integración de foundations · 16/10/2026

Rama oficial: `feat/phase-4-vision-camera`. Fase 4 cerrada para POC_001
con evidencia en `docs/CAMERA_PROFILES_VALIDATION.md` y commit
`edf604e09333b5632435e403d12c5ce81bf06847`.

Se comparó cada árbol con su base común `10e194a25237b1de4c05af7f0f1b781ce78d43ef`.
Todos los cambios de foundation eran ficheros nuevos: ninguna sobreescribió cámara,
ASR, captions o proveedor. Se revisaron contratos/tests y se ejecutó la suite completa
tras cada integración. Merges remotos con dos padres; ramas originales conservadas.
El checkout local se sincroniza por contenido con GitHub; sus commits locales no
sustituyen los IDs remotos de esta tabla.

| Fase | Head de origen | Merge oficial | Tests aprobados |
|---|---|---|---|
| 5 | `0c5677c6232508864235de2cb9392ca93900081d` | `14a229632abfa24211159807d3be85acb334c7b4` | 53 |
| 6 | `739f1034caf5208ebc9bb315851110ca951ed11b` | `7c99f806ff653adead7806b2a6e1c2e9c1eb0c3a` | 56 |
| 7 | `1c7d332f3d7429b0f86bdfcaf7d54971cb63a2f3` | `6e78df43f351a5c428999b751e5b1fa50692df62` | 59 |
| 8 | `341e4d3b2316994d6548aaf2cd22d6c4ffb58186` | `a42ae5a007a798fa6dbe3d76d116eb91bcd7d517` | 63 |
| 9 | `89fac4091a9a9a7c4c42bd42996afd3776ab9e89` | `ad8ee7e97307c799eb368b4dd496c7339094687b` | 66 |
| 10 | `7ddeaa66f667d0376caeff071fbb77707461dfde` | `94c09a790836e194223af008a6135b0c8ff5063f` | 68 |

## Conexiones verificadas después de los merges

`src/foundation-integration.js` es un preflight desacoplado, sin proveedor ni red.
Compila BrandKit + Template + catálogo + Director con los ejemplos existentes.
Mapea blurred-resource, compare-yes-no y numbered-list a IDs reales del catálogo.
quote-card queda explícitamente sin resolver; no se inventa un asset.
Una decisión que solicite un motion no permitido se rechaza.

La cámara base recomendada usa composition 1,40×. Los valores de zoom de plantilla
son factores semánticos relativos al encuadre, no reemplazan ese encuadre.
El límite absoluto del preflight es 1,60×: CALMA con composition admite como máximo
1,142857× relativo; 1,12× produce 1,568× total; 1,18× se rechaza (1,652×).
Esto valida presupuesto, todavía no aplica zoom dinámico ni conecta al render.
El Director conserva reason/rule obligatorios y no genera zoom periódico.
También se rechazan decisiones fuera de duración y colores obligatorios ausentes.

Salida reproducible: `examples/foundation-preflight.sample.json` (ejemplo, no plan
aprobado de producción ni resultado visual). `renderReady:false` deliberadamente.
Pruebas cruzadas cubren las cuatro plantillas, alias, presupuesto de cámara,
colores faltantes, motion desconocido y duración. Suite final: 72/72; syntax de
TODOS los JS/MJS de src/scripts mediante `npm run check`. Coste nuevo: 0 USD.

## Qué NO se ha completado

- Fase 5 activa al 40 % estimado: contratos, cuatro presets candidatos, integración
  y tests. SUES_CALMA candidata principal, estética sin aprobar. Antes de cerrar
  cada estilo: 3 Reels de referencia. Prioridad deckeanu y Sues_Reel2_May_V1.mov;
  blur de fondo, profundidad y recursos integrados, no pegados.
- Fase 6: specs/catálogo; faltan bindings, ejecución visual y safe-zone layout.
- Fase 7: contrato; faltan modelo/prompt/evaluación y enforcement exhaustivo de
  look/audio/outro, conflictos y mapeo de tiempo fuente al timeline editado.
- Fase 8: contrato y estados; faltan backend persistente/auth/uploads/preview/UI.
- Fase 9: gates preparados; NO hay E2E V1 aceptado. Se mantiene literalmente el
  criterio «Cambiaría dos o tres cosas, pero el vídeo prácticamente está».
- Fase 10: consolidación futura y frontera opcional CapCut; no se ha conectado
  CapCut ni se convierte en dependencia V1. MCP sigue siendo fachada.

No se suman porcentajes de F6–F10 al progreso oficial: F1–F4 = 40 %;
F5 al 40 % pesa 4 puntos => global 44 %. No se cierra ninguna fase posterior.

## Continuación exacta

Leer maestro y PROJECT_STATUS; seguir en rama oficial. Revisar las 3 referencias
SUES_CALMA y concretar tokens/layout. Después resolver quote-card o excluirlo de
ese preset con decisión explícita, bindings y safe zones; mapear cortes al tiempo
fuente y conectar un único preview local reproducible. No construir UI grande
hasta backend E2E. No repetir MediaPipe hasta aclarar su tráfico documentado.
Sin nuevas APIs, renders remotos, créditos, servicios, ASR o assets generados.
