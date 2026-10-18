# Profundidad con contorno revisado · 18/10/2026

Carlos pide continuar con el recorte/profundidad y avanzar hacia Hostinger.
Se incorpora oclusión real de texto mediante un contorno vectorial trazado a mano.
La prueba usa tres fotogramas de la toma interior y37puntos correspondientes,
interpolados a30fps. El texto se elimina dentro del contorno y permanece fuera:
el sujeto de la fuente sigue visible delante. Los subtítulos son otra capa.
No es una caja facial, fondo desenfocado ni máscara automática.

## Alcance y entrada

project.json admite depthTextPath hacia un JSON privado version1.0 con sourceSha256
y events. Cada evento contiene text,start,end,x,y,size,color y mask. La máscara
requiere method=manual-rotoscope,scope=head-and-neck/upper-body/full-visible-subject,
reviewedRegion top/bottom y keyframes con time y points[x,y]. Mínimo16puntos,
misma correspondencia entre keyframes, geometría finita dentro del vídeo, área
mínima y cobertura temporal completa. Máximo seis eventos de tres segundos.

La primera versión exige fuente1080×1920,encuadre completo y timeline sin cortes
adicionales; rechaza eventos solapados con tarjetas, zooms o entre sí. El texto
cabe en la zona segura y en el área vertical revisada. Una selección precortada
es una fuente distinta, con su propio SHA. El editor debe revisar que el evento
no cruce un corte dentro de esa fuente. No se presenta como seguimiento real.
El importador es de configuración local; no hay nuevo botón de máscaras en UI.

prepareProject valida procedencia/contorno, fingerprint incluye el JSON y el motor,
y buildPreviewASS genera iclip vectorial por fotograma. Desactivar motions quita
el efecto. La copia portable conserva el JSON y restaura ASS idéntico. La subida
de otro vídeo elimina depthTextPath heredado; no aplica contornos ajenos.

## Prueba real y límites

SUES_PRUEBA_PROFUNDIDAD.mp4 contiene PARALIZADO detrás de la cabeza0,25–1,25s.
Se revisa el contorno donde hay texto, zona vertical250–650. Las coordenadas por
debajo de esa zona no acreditan segmentación completa de brazos/torso/manos.
Se mantiene el montaje de17,20s,el motion y el audio. Se retira el pequeño rótulo
superior anterior para evitar acumular textos. Es prueba de profundidad, no una
nueva aprobación creativa de Carlos ni cierre de F6.

SHAcaef5a4f6d305d8a9e541fcf501269e68a658daa1e4347f02fe93563f9b37620,
9975895bytes,1080×1920/30fps,H264/AAC. Fuente preservada,decodePASS,audioPCM
idéntico a entrega previa.10frames finales inspeccionados.194tests,check,doctor
del proyecto y bash-n de scripts de desplieguePASS. Prueba con libass real verifica
que no cambian píxeles interiores de un contorno sintético y sí los exteriores.
Datos/medios/contornos privados fuera de Git; registro en el maestro.

Automatizar la máscara de una persona completa requiere un método adicional.
No se descargaron modelos ni se repitió MediaPipe. Sigue vigente el bloqueo
histórico de tráfico inesperado de ese paquete; no se ha reintentado ni evitado.
DirectorLLM,QA navegador y aceptación global pendientes. No V1.
