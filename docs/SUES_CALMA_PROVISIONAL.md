# SUES_CALMA · plantilla cinematográfica provisional

## Dirección autorizada por Carlos

Naturaleza, exteriores y vídeos de retiros. Inspiración documental cinematográfica
(tipo National Geographic), sin incorporar su marca ni presuponer licencia de su material.
Carlos autoriza avanzar con criterio propio y afinar después; las referencias NO
bloquean esta implementación provisional. Sigue vigente pedir 3 referencias antes
de cerrar estética. No se ha aprobado ningún look final.

## Comportamiento implementado, sin render

- Preset `examples/templates/sues-calma.template.json`, Template v1 con extensión
  opcional `visualStyle` v1, estado `provisional`; otros presets siguen compatibles.
- Ritmo slow; cortes del presentador 2,2–7 s. Transiciones permitidas cut/soft-fade;
  se retira subtle-punch para este preset. Color natural; cámara lenta/suave como
  intención editorial, sin ralentizar automáticamente personas o audio.
- B/N y relight opcionales, sin aplicarlos automáticamente al look natural.
- B-roll full-frame de naturaleza, exteriores o retiros: 2,5–6 s por inserción,
  máximo 40 % del vídeo; al menos 3 s de presentador entre inserciones; reservar
  2 s iniciales y al menos 3 s finales de presentador (o duración del outro compartido si es mayor). Valores provisionales configurables.
- Slots con motivo semántico y tags explícitos, ya en TIEMPO DE EDICIÓN. No inserta
  clips periódicos ni infiere tags con IA. Prioriza número de tags coincidentes;
  desempate estable por ID, sin reutilizar un mismo asset en la toma.
- Original voice + captions preservados; audio del recurso desactivado. Si no hay
  material disponible, compatible o suficiente: mantener presentador con causa.
- No altera los contratos de visión ni conecta keyframes al proveedor.

`src/cinematic-style.js` valida la extensión y prepara las decisiones de B-roll.
`src/template.js` compila la extensión, propaga brandKitId y hereda también límites
compartidos de captions. Tipografía, colores, límites de subtítulos y cierre se
resuelven desde BrandKit al compilar: cambiar el kit permite unificarlos después.
No se fija logo ni se inventa uno: su token/asset se añadirá al kit compartido
cuando se defina; hoy no hay render de logo.

Las familias musicales y motions heredados siguen siendo vocabulario candidato,
no una instrucción de aplicarlos en cada clip. quote-card continúa sin resolver en
el preflight anterior; no se usa para estas inserciones cinematográficas. No se
ha creado un renderer ni se han generado assets. El fondo difuminado con recursos
integrados sigue disponible como preferencia para recursos, mientras B-roll aquí
se plantea a pantalla completa para exteriores/retiros.

## Uso reproducible sin coste

Desde raíz del repo, Node >=22 y dependencias ya existentes:

```sh
npm run template:calma -- examples/broll/calma-dry-run.input.json runtime/templates/sues-calma.plan.json
npm test
npm run check
```

Input JSON: templatePath, brandKitPath (relativas al cwd), duration, slots, assets.
Slot: start/end (segundos de edición), reason no vacío, tags no vacíos.
Asset: id, sourceRef opaco, kind nature/exterior/retreat, tags, duration (segundos
hasta final del archivo), inPoint opcional (0), available boolean.

Los slots de `examples/broll/calma-dry-run.input.json` son SINTÉTICOS, no un análisis
del guion real. El catálogo está vacío: la salida demuestra fallback correcto.
`examples/broll/calma-dry-run.output.json` guarda esa salida reproducible, con
renderReady:false. Las pruebas usan refs fixture: sin clips reales ni URLs.
Los ficheros audiovisuales permanecen fuera de GitHub, originales intactos en Drive.
No se consulta Drive ni se descarga un asset durante la compilación.

## Validación ejecutada

80/80 tests completos + npm run check. CLI en seco ejecutado: 0 inserciones,
2 decisiones keep-presenter, salida JSON válida. Casos cubiertos: herencia de otro
BrandKit, naturaleza/retiro, matching determinista, asset ausente/no disponible/corto,
inPoint, evitar repeticiones, gaps, cobertura, bookends, tiempos solapados o fuera
de duración y reglas de audio inválidas. Sin dependencias nuevas. Coste: 0 USD.

## Pendiente y siguiente acción

No hay prueba visual de esta plantilla ni vídeo editado nuevo. No se asigna 100 %.
Antes de ejecutar recursos: verificar bytes/duración real, orientación/encuadre
9:16 y disponibilidad de sourceRef; respetar la reserva de outro heredada del BrandKit;
resolver safe zones y mapear edición a tiempo fuente. Construir adaptador local
que aplique estas decisiones a clips existentes y valide voz/captions. El flag
renderReady:false impide confundir el plan con una exportación lista.

Se puede avanzar técnicamente sin pedir más material o referencias ahora:
mapa de tiempos + renderer local, usando presentador como fallback. Cuando se
vaya a cerrar el estilo, revisar 3 referencias y sustituir parámetros provisionales.
No repetir ASR/MediaPipe; no APIs de pago, Shotstack, CapCut o Lovable en este bloque.
