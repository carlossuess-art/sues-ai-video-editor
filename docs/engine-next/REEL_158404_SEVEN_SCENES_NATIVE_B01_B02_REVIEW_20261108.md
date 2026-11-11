# Reel 158404 · Primer proyecto nativo editable de las 7 escenas + B01/B02 · 08/11/2026

**Hito real de ejecución, NO Reel acabado, NO aprobación estética y NO importación de 49 acciones cinematográficas.** Se conserva el contrato de Film Director v1.5.7 / V2 D01–D77. Se trabajó sobre FableCut 1.18.0 en clones independientes. **Producción:** FableCut original 127.0.0.1:7780 revisión54/seis clips; Editor HTTPS anterior sin cambios; Studio público no desplegado. Los MP4 privados y los fotogramas con Carlos/terceros no se subieron a GitHub público.

## A. Storyboard humano coordinado, **estado visible REAL**

| Escena | Intervalo plan maestro | Operaciones | Lo que YA se ve en único proyecto | Lo que NO debe darse por hecho |
| --- | --- | ---: | --- | --- |
| S01 «Gancho» | 0–7,73 s | 8 | Carlos y voz auténticos; B01 aplausos a pantalla completa **candidato** 3,2–5,6 s, 0,2 s de fade IN/OUT, regreso a Carlos | Títulos `title-1`, `title-2`, captions, impacto inicial, SFX/música, adecuación de rostros del público |
| S02 «Aprender a encajar» | 7,73–16,83 s | 6 | Carlos original; detrás, B02 niños en plano 9,5–13,5 s, matte V3/V4, fundidos, **candidato técnico** | Subtítulos/título `title-3`, validación artística de cabello, oclusiones y emoción |
| S03 «El conflicto» | 16,83–26,67 s | 8 | Carlos/voz continuos; mano STOP de 29f **guardada desactivada** | M01 3D/motion, mano con muñeca limpia y derechos, título, captions, mezcla música |
| S04 «Miedo a perder el amor» | 26,67–43,33 s | 10 | Carlos/voz originales y cambios de escena señalados en marcadores | B04, M02, objeto/escena significativa, títulos, captions y mezcla; motor/matte/recursos pendientes |
| S05 «Volver a reconocerte» | 43,33–55,83 s | 6 | Carlos/voz originales | B05 detrás con espejo/tracking, M03, título, captions y música |
| S06 «La decisión diaria» | 55,83–65,17 s | 6 | Carlos/voz originales | Montaje expresivo de planos y voz validada, título, captions y mezcla |
| S07 «Cierre maestro» | 65,17–73,753467 s | 5 | Carlos/voz originales hasta fin de fuente de 73,766667 s | CTA real y caption word-by-word, título, mezcla y supervisión completa |

**Se han visto en el visor FableCut real 7 instantes**, uno por escena, con petición y espera del fotograma verdadero (WebCodecs), en t=1,2 / 11 / 23,2 / 37,5 / 49 / 61,5 / 71,5 segundos. Todos 1080×1920, sin errores JS. Solo S02 añade en ese punto la composición infantil B02; los restantes instantes muestran la cámara original. Prueba privada `/srv/sues-fablecut-next/data/qa/reel-158404-full-native-49ops-20261108/previews/seven-scenes-native-proof.json`, contacto `all-seven-scenes-FABLECUT-native-private.jpg`. **No afirmar que esto prueba ejecución de siete escenas artísticas.**

## B. Anexo técnico verificable del proyecto (NO JSON importable a Master Director)

### Dos proyectos independientes, ambos editables, con lista completa de operaciones

**Base siete escenas + B02:** directorio privado `/srv/sues-fablecut-next/data/qa/reel-158404-full-native-49ops-20261108/`. Proyecto `project.json` y registro por operationId `49-operations-native-crosswalk.json`. Cámara V1 y voz A1 originales, **bloqueados**, 73,766667s, 1080×1920 30fps, ocho clips nativos y nueve assets presentes. Marcadores FableCut: siete escenas y doce momentos significativos (19 en total). Medio original SHA `9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad`; voz `.m4a` SHA `4ef5fdaa558de448dcc8f42bfd69cbbc6f41e1d7df99c977ae55731f55fb70c0`. `native-media-preflight`: nueve de nueve, cero faltantes. Tras abrir en UI, FableCut avanzó una revisión interna, pero los clips y marcadores se conservaron.

- 15 operaciones de cámara: **cubiertas por una única fuente V1 continua**, no por quince cortes cinematográficos independientes.
- 1 operación B02 `shot-2-2`: capas V2 niños Wide `(x=180,y=-250,scale=.73)` con fades 9 frames, V3 Carlos, V4 MODNet temporal, export 120/120 previamente probado; **NO aprobada estéticamente**.
- 2 operaciones con capas **desactivadas**: `GIF-STOP-overlay` 29f en B03 y `title-1` de voz/meaning no verificado. Oro 3D V5 también desactivado y no equivale a una operación adicional ejecutada.
- 31 operaciones sin clip nativo correspondiente ni recurso/licencia/timing validado. Todas siguen registradas 49/49 en el crosswalk; ninguna fue eliminada, disimulada ni marcada como aprobada.

**Variante B01 real:** directorio privado `/srv/sues-fablecut-next/data/qa/reel-158404-full-native-B01-candidate-20261108/` con `project.json` y `49-operations-B01-native-crosswalk.json`: **nueve clips, diez assets, 49 operaciones intactas**, fuente/voz bloqueadas. Activado **solo para revisión QA** `shot-1-2` en V2, `3.2–5.6s`, `in=0`, clip MP4 H.264 1080×1920 30fps **72 frames**, sin audio, fundido IN/OUT 0,2s = seis fotogramas cada uno. S02 B02 permanece intacto y no se solapa con B01. Preflight diez/diez. El registro suma 15 cámara-continuas, 2 visuales candidatos B01+B02, 2 capas desactivadas y **30 operaciones pendientes de materializar**.

La fuente B01 existe en staging previo, **NO se ha inventado ni generado una imagen nueva**: `/opt/sues-video-setup/pr27-stage-20261106/real-158404/render-candidates/B01_applause_2_4s_pexels_40772168.mp4`, SHA256 **`e7cd8569daba11abf7065ebd8f881002630bbb04dc830e6334f51de199ed820a`**, 1.312.406 bytes, equivalente EXACTO al `assetId` B01 del ledger y a la operación `shot-1-2` en el master plan de recursos reales. Ficha https://www.pexels.com/video/audience-applauding-during-live-performance-40772168/ . La licencia general Pexels permite usar y modificar comercialmente, **pero no acredita por sí sola permisos de personas identificables, marcas o que no se insinúe respaldo**. En la versión B01 aparecen rostros reconocibles del público: quedan pendiente aprobación cinematográfica y revisión contextual de derechos antes de publicar.

### Evidencia de B01 en FableCut y exportación 72f

- El visor real capturó t=3,1 (Carlos), 3,3 (fundido inicial de B01), 4,3 (B01 a pantalla completa), 5,5 (fundido final), 5,7 (vuelta a Carlos), 11 (B02 intacto) y 71,5 (fin original). Las siete capturas y la comparación se conservaron solo en el VPS privado. Sin error de navegador ni frame-source perdido.
- Export **real nativo FableCut** `x_h5r2zfdr`: 72 fotogramas H264 distintos, 1080×1920 30fps, 2,400s; AAC 48kHz estéreo 2,400s, 72/72 framemd5 distintos sin duplicados. `status done`, informe FableCut OK, cero errores JS, 106,711 s totales de harness sobre VPS.
- MP4 privado `/srv/sues-fablecut-next/data/qa/reel-158404-B01-72f-native-export-20261108/exports/SUES B01 applause 72f native export QA NOT APPROVED_reel_1080x1920.mp4`, SHA256 **`3a535f969a67ba0a5b1129e8374dbf4e2f35db5c7a1d3567342c5724272c4687`**, 2.527.343 bytes.
- Programa FableCut real vs MP4 RGB SSIM en t=3,3 (frame3) **0,970834**, t=4,3 (frame33) **0,972192**, t=5,5 (frame69) **0,969103**. Prueba `B01-72f-native-technical-proof.json`, y contacto `B01-72f-export-contact12.jpg`, privados. Las tres muestras y el recuento completo prueban **capacidad técnica** del B-roll, no la adecuación creativa o jurídica de la imagen.

### Incompatibilidad de versiones que se ha detectado y NO se fusiona

Reconciliando el antiguo `approved-film-director-158404-story-v3-with-real-assets.json` de staging con el registro `REEL_158404_ENGINE_GAP_LEDGER.json`: fuente original SHA idéntica, 49/49 IDs de operaciones iguales, 38 intervalos idénticos, **11 títulos con horas de inicio/fin distintas** (`title-1`…`title-11`) y **un asset ID B02 distinto**. No se debe escoger una versión automáticamente para títulos, palabra por palabra, sincronía o biblioteca. Auditoría exacta privada `native-vs-v3-story-consistency-audit.json`, `REVIEW_REQUIRED_NOT_MERGED`. Herramienta `src/engine-next/reel-158404-story-consistency.js` + CLI y tests lo bloquean. Hasta revisar voz/tiempo y SHA de B02, NO exportar título/字幕 semánticos como si fueran aprobados.

### Invariantes técnicos y siguientes puertas reales

`src/engine-next/reel-158404-native-assembly.js` + CLI crea **un proyecto FableCut completo pero provisional**, y conserva 49/49 en sidecar; falla si se cambia voz, fuente, B02 matte/fades, escena o inventario. `src/engine-next/reel-158404-b01-native-candidate.js` + CLI solo añade B01 si existe físicamente y su SHA/FPS/duración son exactos, mantiene B03/`title-1`/oro desactivados. No hay operación en abstracto reclamada como «renderizada» por estar en el sidecar. Ambos proyectos se mantienen aparte y con rollback simplemente seleccionando la copia anterior.

El plan maestro termina exactamente en **73,753467s**, mientras el bruto original llega a **73,766667s**, diferencia **13,2 ms**. Hay límites de títulos y tomas fuera de la cuadrícula exacta 30fps: se registran los errores de cuantización por operación, **sin redondear ni retimar voz automáticamente**.

**Siguiente:** cerrar referencia/timing de las 11 palabras protagonistas y el B02 discrepante; verificar realmente assets B04/B05, M01–M03, SFX/música y derechos; ejecutar por operaciones/escenas sobre la misma línea de tiempo; 2 pasadas QA completas audio/imagen, revisión artística Carlos, habilitar Studio privado autenticado y solo entonces evaluar publicar. **No afirmar Reel terminado ni desplegar producción.**

## Prueba nativa adicional del final S07 (no es el render completo)

En clon **independiente del mismo proyecto completo** con B01/B02 y 49 operaciones intactas en el registro, se acotó solamente la ventana de exportación a **71,4–71,9s** (candidato original S07). La línea de tiempo original se conserva 0–73,766667s en la copia principal. Trabajo nativo FableCut `x_sajzv3j9`, `status done`, report nativo conforme, cero errores de navegador, 39,551 s de harness. MP4 privado `.../reel-158404-S07-15f-native-export-20261108/exports/SUES S07 original ending 15f native QA NOT FINAL_reel_1080x1920.mp4`, SHA256 **`ded2e2c931c09a2b58c0c94f5f584ebf4767299c5b2fa794f9036bcfb121ab91`**, 733.883 bytes, 15 fotogramas H.264 únicos, 1080×1920/30fps 0,5s y AAC 48kHz estéreo 0,5s. Frame exportado índice3 (t=71,5s) vs canvas auténtico de FableCut en t=71,5s: **SSIM RGB 0,968005**. Informe independiente `S07-15f-independent-proof.json` privado. **No acredita los demás fotogramas S07 ni ningún Reel completo.**

## Trazabilidad consolidada

- **7 escenas / 49 operaciones** vinculadas a un proyecto único editable, **no a 49 clips ejecutados**; fuente/voz originales SHA verificados y bloqueados.
- **B01 `shot-1-2`** técnicamente exportado íntegro 72/72 frames; transiciones visibles en entrada y salida; contexto de rostros/permiso de uso y valor narrativo pendiente de Carlos.
- **B02 `shot-2-2`** cuatro segundos/120frames técnicos previamente probados con matte temporal, composición no aprobada estéticamente.
- **S07** prueba nativa auténtica 15/15 frames y audio final; solo intervalo 71,4–71,9s.
- **30 operaciones** restantes sin materialización en la variante B01, **2 con capas desactivadas**, **15 cámaras cubiertas solo por original continuo**, **2 candidatos nativos**.
- **11 conflictos de tiempo de títulos y 1 de SHA B02** entre dos fuentes maestras previas, bloqueados explícitamente para evitar pérdida de palabra, sobreescritura o sustitución silenciosa.
- Ningún despliegue, actualización de NLE productivo, aprobación creativa ni promesa de render de 74s.
