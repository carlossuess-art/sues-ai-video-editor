# Reedición desde un bruto existente · 18/10/2026

Carlos autoriza utilizar uno de los originales de montajes anteriores. Se elige
una toma interior de pie y se confirma su correspondencia con un montaje previo
mediante correlación de audio, sin ASR nuevo ni modelos. Original intacto.

Se prepara una pieza editorial de 17,20 segundos: planteamiento del bloqueo,
pausa gráfica sobre papel técnico y llamada a escribir. Se retira la convocatoria
fechada del montaje antiguo. La selección de cortes es editorial explícita; no
se atribuye a un Director automático. La referencia contiene reordenación de
fragmentos: una alineación global monótona no sirve para recuperar toda su EDL.
Los fragmentos seleccionados posteriores se contrastan por separado.

Los subtítulos recuperados tienen tiempos de frase, marcados como inciertos.
El motor ahora admite phraseId compartido con el mismo intervalo para todas
sus palabras, mantiene la frase indivisible y desactiva karaoke para esos cues.
Rechaza mezcla de procedencias, solapamientos, intervalos distintos o división
en grupos menores que exija inventar tiempos de palabra. La ruta anterior con
alineación real por palabra conserva su comportamiento.

El acabado metálico perdía contraste sobre la camiseta blanca. Se añaden presets
amarillo y rojo planos con glow del mismo color; se mantienen los metálicos.
Montserrat Bold/ExtraBold y Bold Italic reales, proporción14/12. Una tarjeta nativa
con cuadrícula, órbitas, ojo/corazón y salida cálida; dos SFX propios y ambiente
procedural propio con ducking. La salida se ajusta editorialmente al interior del
rango de la tarjeta para no cubrir el primer cue de la llamada a escribir.
No hay B-roll histórico reutilizado ni recorte corporal.

Validación:191tests y npm run check, exportación1080×1920/30fps,17,20s,
decodificación completa, original preservado y diez fotogramas finales revisados.
Los niveles/decodificación no equivalen a escucha humana ni aceptación de Carlos.
Auditoría compacta: examples/preview/raw-reedit.result.json.
El vídeo y su registro privado están fuera de Git; continuidad en el maestro.
Oclusión corporal automática, Director LLM, QA navegador y despliegue pendientes.
No se declara V1 ni perfección objetiva.

## Segunda revisión editorial

Carlos indica que la letra y el motion están bien y que no tiene clara su
valoración del conjunto; autoriza continuar. Se conserva esa dirección y se
prepara una segunda revisión visual, sin reescribir ni recortar la voz.

Se incorpora la pregunta editorial «¿TE BLOQUEAS?» durante0–2,65s, fuera del
rostro y separada de los subtítulos hablados. El encuadre se acerca hasta1,10×
entre2,83–10,9s con rampas de1,2s sobre un punto de composición fijo elegido
manualmente. No usa detección, seguimiento facial ni segmentación automática.
El rótulo editorial «ESCRÍBEME» permanece15,94–16,91s durante la pausa final.
La tarjeta, su tipografía y el audio mantienen la base anterior; salida cálida
contenida13,4–13,8s. No se interpreta la valoración parcial como cierre de F6/V1.

Receta reproducible: scripts/templates/refine_reviewed_raw.mjs requiere el
proyecto y ajustes existentes y un directorio nuevo. Rechaza otro SHA de fuente;
incorpora la receta al fingerprint y guarda sus decisiones en el manifiesto.
Es una pasada editorial de exportación local; estos dos rótulos y el acercamiento
manual no se presentan como una selección automática ni un nuevo control de UI.
ASS, filtro, manifiesto, preparación y receta se reproducen byte a byte en una
segunda preparación. Los191tests del motor ya pasaron antes; no se modifica
el motor en esta pasada y se verifica la sintaxis del script y npm run check.

Resultado de la revisión:17,20s/1080×1920/30fps,9971436bytes,SHA
0ca33d4406b9259a7b7299d8158740d95e7d251643f3d595f037be7c424bfb3d.
Decodificación completaPASS,fuente intacta,diez fotogramas finales inspeccionados.
Audio PCM idéntico a entrega anterior, SHA
25fd15786fe7376b8224857eb5be3bcf7a7dea75df645f0bc853e91bb664e66f.
Se guarda como nueva versión del mismo archivo. Registro resumido:
examples/preview/raw-reedit-reviewed.result.json.
