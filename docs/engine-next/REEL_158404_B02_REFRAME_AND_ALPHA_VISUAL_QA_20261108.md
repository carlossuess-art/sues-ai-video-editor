# Reel 158404 · B02 · evaluación visual nativa de bordes y reencuadre · 08/11/2026

**Estado: CANDIDATOS PRIVADOS, SIN APROBACIÓN ESTÉTICA, NO IMPORTABLE TODAVÍA.** Este es un hito de revisión del mismo storyboard humano de Film Director V2 D01–D77 y su anexo técnico `shot-2-2`. No altera el contrato maestro `sues-master-story/v1` (7 escenas y 49 operaciones), ni su fingerprint, ni acredita que se haya ejecutado íntegramente. Ningún fragmento privado con Carlos o niños se ha subido al repositorio.

## Storyboard humano · B02 · `scene-02`, `shot-2-2`, 9,50–13,50 s

- **Propósito narrativo existente:** visualizar a los niños/las expectativas mientras Carlos permanece en primer plano hablando; voz real como autoridad, no texto o generación inventada.
- **Plano fuente técnicamente probado:** 120 fotogramas H.264 + AAC exportados por FableCut en clon, 1080×1920 a 30fps, sin objeto de oro V5. Seguimiento de Carlos V3 y matte temporal V4, niños V2, V1/A1 bloqueados. SSIM en 3 muestras >0,96; **NO** supervisión estética o auditiva completa.
- **Entrada/salida propuestas:** fade de niños V2, `transitionIn` y `transitionOut` de 9 fotogramas (=0,3 s) por extremo. Revisión previa de 12 canvas FableCut reales ON/OFF, cero errores JS; candidato **no exportado ni aprobado**. Carlos V3 y matte V4 mantienen su composición.
- **Título protagonista:** `title-3` «NO MOLESTAR», momento y geometría **no verificados con el texto/voz reales**. Se plantea encima de la cabeza respetando niños, safe zones y continuidad. NO introducir título en las pruebas.
- **Subtítulos:** `captions-2`, progresivos palabra a palabra justo bajo barbilla, 2 líneas como máximo normalmente y énfasis visual diferenciado. Los 11 tokens ASR de B02 continúan sin revisión de escucha humana: no activar, no suponer negaciones ni timings.

## Dos opciones de reencuadre REAL (FableCut visor, no mockup)

Se estudió el PNG RGBA de los niños, 512×896, que ya incluía máscara alfa. En zonas inferiores y del borde derecho conserva alfa casi opaco, pero el cambio de opacidad de esos píxeles no explica por sí solo el recorte visible del grupo en el visor actual.

| Candidato | Child V2 geometry (`x,y,scale`) | Observación en tres tiempos reales (10, 11,5, 13 s) |
| --- | --- | --- |
| Base | `(340, -160, 0.85)` | Parte de caras y cuerpos infantiles se pierden por borde derecho. Mantiene visible a Carlos, pero el grupo se entiende peor. |
| **Abierto · Wide** | `(180, -250, 0.73)` | Muestra claramente más niños y caras; mayor ocupación del fondo a la derecha. Puede competir visualmente con el sujeto y futuras palabras protagonistas. |
| **Intermedio · Balanced** | `(215, -215, 0.76)` | Recupera visibilidad de varios niños con menor ocupación lateral que Wide. Sigue requiriendo revisión de capas y legibilidad de título. |

Ambos son proyectos nativos FableCut, clonados e independientes, con los 9 recursos en la biblioteca del clon. Las dos previsualizaciones se capturaron directamente de `canvas.toDataURL()` a **1080×1920**, sin errores de JavaScript. No se ha exportado MP4 de ninguno de estos dos reencuadres. La comparación visual a tres tiempos NO acredita que el matte sea correcto durante los 120 fotogramas; el usuario aún debe decidir la opción artística.

## Candidatos de alfa evaluados y descartados como solución del defecto

- Se construyó `scripts/engine-next/build-b02-alpha-edge-candidate.py`, generador conservador que modifica **solo alfa**, preserva todos los canales RGB byte a byte y obliga a proporcionar SHA256 auténtico del recurso derivado.
- Recurso de entrada legítimo `sues-child-despill50.png` SHA256 `aac8b173f301df941a5e9e882c17f7231d34b8cdb36e5991326b7313d7213ea0`, 512×896. Se probaron las transparencias de borde `bottom=110,right=0` y `bottom=130,right=28`, cada una en su propio proyecto FableCut nativo sin cambiar V1/A1/V3/V4/V5.
- Contacto privado `B02-edge-three-candidates-contact.jpg` (base/soft/soft-right, tres tiempos). Sus cambios visuales interiores fueron insuficientes para resolver el encuadre. En 11,5 s los SSIM base↔candidato fueron >0,999 (variación mínima): no promover esas variantes a recurso «mejorado» ni asumir que un filtro de alfa soluciona el problema compositivo.
- Las diferencias marcadas en 10 s entre sesiones también incluyen posible asincronía de decodificación de vídeo VFR; no interpretar el SSIM global como prueba causal del efecto. Por eso se prefiere un ajuste explícito de geometría y QA por imagen real.

## Anexo técnico NO IMPORTABLE · contrato y dependencia

| ID original | Fuente | Operación QA | Evidencia | Estado |
| --- | --- | --- | --- | --- |
| `shot-2-2` | Foto JPG autenticada + RGBA derivado con SHA256 | V2 `x=180,y=-250,scale=.73`, fades 0.3/0.3 | `B02-reframe-three-candidates-contact.jpg` + 3 full-res PNG + project JSON | PREPARADO, REVISAR |
| `shot-2-2` | Mismos medios autenticados | V2 `x=215,y=-215,scale=.76`, fades 0.3/0.3 | Misma comparativa/archivos QA | PREPARADO, REVISAR |
| `shot-2-2` | Derivado RGBA original | Feather solo alfa bottom y right | `B02-edge-three-candidates-contact.jpg` + SHA/proofs | NO ELEGIR; mejora insuficiente |
| `title-3` | Pendiente verificación semántica con voz | Título protagonista arriba de Carlos, safe zones | Ninguna aprobación de audio | BLOQUEADO por voz/timing |
| `captions-2` | 11 candidatos ASR sin validación | Palabra a palabra con ancla bajo barbilla | Packet ASR privado | BLOQUEADO por revisión humana |

- Herramienta adicional `src/engine-next/native-b02-child-reframe.js` + CLI `scripts/engine-next/stage-b02-child-reframe.mjs` solo modifican `V2.props.x/y/scale`, validando fuente/voz protegidas, matte temporal, ventana, geometría y recurso exacto. No se admiten cambios de archivo ni aprobación implícita.
- Reportes/imágenes/projectos **privados exclusivamente VPS:** `/srv/sues-fablecut-next/data/qa/reel-158404-milestone1-20261108/`, archivos `B02-reframe-wide-CANDIDATE.json`, `B02-reframe-balanced-CANDIDATE.json`, `B02-reframe-three-candidates-contact.jpg`, `B02-alpha-soft-proof.json`, `B02-alpha-soft-right-proof.json` y preflight 9/9. No incluirlos en GitHub público.

**Próximas condiciones de cierre:** elegir visualmente el candidato según la historia (Carlos solo puede aprobar estética), verificar TODO el movimiento 120/120 de ese candidato, corregir límites de la foto, sombras y matte si procede, escuchar voz para títulos/subtítulos, exportar variante aprobada en FableCut y dos pasadas de supervisor. El Reel entero y las 49 acciones siguen pendientes. Puerto temporal local cerrado; producción FableCut original revision54/seis clips intactos, antiguo editor HTTPS 200.

## Actualización: prueba exportadora nativa FableCut del reencuadre ABIERTO (15 frames)

**Resultado NUEVO verificado en clon aislado — técnicamente sí; estética no aprobada.** Después de generar propuestas de geometría V2, se creó un clon específico para **11,0–11,5 s** con las propiedades de la variante ABIERTA `x=180,y=-250,scale=0.73`, fundidos 0,3s a ambos lados del clip original de cuatro segundos, V1/A1 protegidos, V3/V4 intactos, oro V5 desactivado. Nueve recursos encontrados mediante preflight; proyecto y bruto original conservados.

- Primer exportador nativo `x_1kumhqi3` avanzó hasta 97 % pero el **harness de QA** alcanzó su límite de espera de 145 segundos y canceló el navegador antes del cierre. No contar el intento como export válido ni atribuirle un fallo demostrado al codificador.
- Segundo intento con **solo** el tiempo de espera del harness de QA ampliado (480.000 ms), sin modificar FableCut original, servicio productivo o API, trabajo `x_x8jl1hrz`, resultado **`done`, 100 %, `report.ok=true`**, 15 frames en MP4. Resultó en 164,33 segundos de tiempo total de proceso de prueba. Ejecución íntegra en localhost 127.0.0.1:7784 y clon privado.
- Archivo PRIVADO: `/srv/sues-fablecut-next/data/qa/reel-158404-milestone1-20261108/B02-reframe-wide-15f-FABLECUT-NATIVE-QA.mp4`, SHA256 `d0b90f368ebe59def706c92abbf5a3317ca481f61ea0af3d72f9baa5ac522cef`, 616.911 bytes. `ffprobe` confirmó 15 frames distintos H.264, 1080×1920 a 30fps, 0,5s, audio AAC estéreo 48kHz/0,5s. Informe FableCut −21,8 LUFS y −11,5 dBTP.
- Visor FableCut real a 11,2s, `canvas.toDataURL('image/png')` 1080×1920, cero errores JS. Comparación RGB SSIM entre imagen del programa y frame exportado índice 6: **0,966388**, prueba técnica muestreada superior al umbral 0,95. No acredita el resto de frames ni la calidad cinematográfica de la máscara.
- Evidencias privadas: `B02-reframe-wide-15f-native-export-retry-job.json`, `B02-reframe-wide-15f-native-QA-proof.json`, `B02-reframe-wide-15f-native-parity-QA.json`, `B02-reframe-wide-15f-native-export-frame6.png`, `B02-reframe-wide-15f-FABLECUT-native-program-11_2.png`.
- Al concluir el servidor clon estaba cerrado; producción FableCut `127.0.0.1:7780` revision 54 y 6 clips, y editor anterior accesible. **Ninguna escena del storyboard maestro fue aprobada automáticamente.**

Este es un paso de reproducción técnica de una alternativa concreta, no una selección artística definitiva frente a `Balanced`. El rendimiento nativo software continúa siendo cuello de botella; priorizar caché, proxies y mediciones del render antes de intentar reel completo en CPU del VPS. Las 11 palabras ASR todavía precisan escucha humana antes de colocar `title-3`/`captions-2`.
