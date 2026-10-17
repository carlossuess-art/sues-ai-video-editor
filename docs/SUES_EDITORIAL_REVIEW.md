# Elegir citas y deshacer ajustes

Sobre la app existente, sin APIs pagadas ni nuevo análisis. En PREVIEW_READY cada
caption tiene «Destacar esta frase». Hasta3selecciones, con indicadoresaria-pressed.
Guardar incorpora las citas; desmarcar las elimina. El interruptormotions permite
ocultarlas conservando selección. Render/cola/DONE no permiten mutar el montaje.
Duplicar unDONE crea otra versión para editar como antes.

Settings agrega highlightCaptions (IDsseg-xxx únicos, máximo3, orden canónico). Sólo
acepta captions del trabajo, no paths, planes, IDsde catálogo o tiempos arbitrarios.
Si hay selección, reemplaza las citas automáticas y conserva zooms. Texto toma el
caption actual; si fue editado se marcauser-edited-caption, no cita literalASR.
Evidencia registra caption/índices fuente/intervalo original ydisplayEnd. Mantiene
los tiemposASR; permanencia puede extenderse a2,2s para lectura, respetando outro.

Bookends, catálogo, duración, wrapping, cap de zoom y posición segura pasan por el
mismo renderer/validador. Una cita explícita que no cabe rechaza el ajuste completo:
no se descarta silenciosamente ni se sobrescribe versión previa. Se mantienen todas
las palabras y la voz; no aparecen cortes nuevos. Errores de selección en UI usan
mensajes de frase/tiempo, sin exponer razones técnicas de plantillas.

## Versiones y undo

Guardar ajustes con el mismofingerprint es idempotente y no copia otro bundle. Se
comprueba digest previo incluso en ese caso. Hasta10settings anteriores persisten
por trabajo. POST/api/jobs/:id/undo (misma sesión/protecciones) restaura el último
como revisión nueva, conservando bundles anteriores. SóloPREVIEW_READY y cuando hay
historial; canUndo/revision forman parte del snapshot público. Undo no llamaASR,
visión, modelos ni renderer. La UI descarta los cambios locales aún no guardados al
cargar una versión restaurada; los guardados quedan en su historial.

## Verificación

Suite133tests; literalidad/índices, ediciones, unknown/duplicate/excessive IDs,
geometría insegura, interruptor, idempotencia, undo tras reinicio, APIundo y fallo de
ajuste sin cambiar la revisión. Check del frontend y compilaciónPythonOK. La prueba
visual de navegador sigue pendiente; no equivale a una UI aceptada ni aV1.

Smoke real optativo:

```
node scripts/app/smoke_real.mjs CONFIG NUEVO_DIRECTORIO --highlight-first
```

Simula un cliente seleccionando el primer caption de la fuente deCarlos (no una
intervención humana), ajusta intensidad75% y conserva texto. Sólo sirve si ese
caption es elegible. Resultado17/10:38,30s,75/75palabras,16captions,2zooms1,07× y cita
«Te enseñaron a mirar,». Un intento;sourcePreserved/fullDecode;Range206; archivo
privado. Plan y auditoría se guardan enexamples/director/calma-caption-highlight-real.json
yexamples/preview/caption-highlight-real.audit.json. Comparación posterior del motor:
manifest idéntico yASS/filtro byte idénticos, tras cambios de mensajes/normalización.

Frame3,2s revisado: cita por encima de cabeza y caption inferior. No escucha completa,
aprobación editorial deCarlos ni QA visual/PWA. Demo separada de la entrega automática
anterior, guardada con nombreSUES_CALMA_PRUEBA_REVISION.mp4. No se declara estética
NationalGeographic completa niB-roll propio: faltan esos materiales/aceptación.
