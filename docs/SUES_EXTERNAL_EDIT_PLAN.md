> 21/10/2026: [Cuatro motions nativos por caption](SUES_EXTERNAL_MOTIONS.md) disponibles en planes externos; no conversión MOGRT. SFX puntuales ya integrados según SUES_CUSTOM_SFX.md. Los registros siguientes son históricos.

# Importar un plan de edición externo · 20/10/2026

Dos recorridos distintos: la app prepara la edición con sus controles actuales,
o Carlos analiza el vídeo fuera (por ejemplo con Gemini) y pega su plan en SUES.
Esta entrega implementa el segundo recorrido como datos validados y ejecución
local. No activa un LLM, una API ni la comprensión automática de texto libre.

En Director IA, abrir **Ya tengo un plan de edición**, preparar/copiar las
instrucciones del proyecto y adjuntar el mismo vídeo a la IA externa. El texto
copiado contiene catálogo, IDs privados de recursos disponibles, duración,
subtítulos temporizados, restricciones y un ejemplo JSON. No contiene medios,
rutas locales, cookies ni credenciales. Copiarlo no envía nada a un proveedor.
Pegar la respuesta JSON, comprobar el plan y ejecutar en otra versión.

## Contrato ejecutable

`sues-edit-plan/v1` exige `sourceSha256` del vídeo y 1–60 `operations`.
Admite un único bloque Markdown JSON pegado; máximo 30000 caracteres. No se
interpreta prosa arbitraria ni se ejecutan scripts, rutas, URLs o instrucciones
de herramientas. La IA externa debe devolver el formato del catálogo.

| Acción | Ejecución real | Límites actuales |
| --- | --- | --- |
| transition | `resourceId: warm`, inicio exacto, duración 0.4 s | Máximo tres transiciones por versión, sin solaparse ni invadir cierre; motions activo |
| image | ID privado de imagen y start/end | Hasta seis; 0.6–8 s por imagen; colocación automática con análisis facial existente; conflictos se bloquean |
| music | ID privado de audio, gain y duck | Pista al menos tan larga como el vídeo; volumen 0–18 %; no inserción SFX puntual |
| caption | captionId y text | Cambia texto, conserva tiempos; hasta 52 caracteres |
| command | Un comando local ya soportado | Volumen, zoom, activar/desactivar motions/SFX; no cambia estilo ni agrupación |

Tiempos del original; el importador no corta ni acelera. Las operaciones se
aplican sobre los ajustes guardados, conservando lo no mencionado. Las imágenes
añadidas y las transiciones se acumulan con las existentes hasta sus límites.
Un recurso se selecciona por ID y tipo, nunca por parecido del nombre. Biblioteca
privada existente reutilizada, sin crear un banco ficticio. Las imágenes no se
ofrecen como seguras para vídeos nuevos con sólo Whisper/plano completo: falta
el análisis espacial. El catálogo lo explica y la revisión bloquea ese caso.

Se distingue recurso ausente de capacidad no soportada y dato inválido. Si una
operación falla no se ejecuta parcialmente el resto. Carlos puede corregir o
pedir otro plan a la IA externa y comprobarlo otra vez. No se buscan ni compran
recursos automáticamente. No se sustituye un recurso sin avisar.

## Seguridad, revisión y continuidad

API privada/sesión/CSRF habituales. La revisión no escribe trabajos ni renderiza:
compila todo con el motor y verifica hashes, derechos, tiempos, solapamientos y
límites. Un hash de revisión vincula plan, ajustes base, motor y recursos.
Ejecutar recompila y exige el mismo hash; cambios invalidan la revisión. Los
reintentos con requestId crean una sola versión. La versión anterior, los
originales, proyectos y ajustes se conservan; el historial guarda el plan y las
acciones. Tras ejecutar, la cola continúa aunque se cierre el navegador.
Comprobar guarda además el borrador privado por trabajo, incluso si hay recursos
pendientes; se recupera al volver al proyecto. Cambiar texto exige otra revisión.
Los controles manuales conservan los destellos de tiempo exacto importados.

No hay asociación de Google/Gemini ni llamada externa nueva. La generación
creativa del plan sigue ocurriendo fuera y su coste depende del servicio que
Carlos use allí. No se afirma que cualquier plan libre pueda ejecutarse.

## Validación

247 pruebas Node y npm run check superados en la primera revisión. Pruebas HTTP:
privacidad, CSRF, plan ajeno, datos incorrectos, recurso ausente, operación no
soportada, bloqueo total, revisión obsoleta, idempotencia, versión anterior
intacta y persistencia tras reinicio.
Chromium145 móvil393×852 y escritorio1440×1000: catálogo, pegar/comprobar,
invalidez al cambiar texto, bloqueo de faltantes, nueva versión y render MP4 real
24s con destello en15.27s, imagen y audio subidos realmente y corrección de subtítulo;
se retoma el borrador tras recargar; descarga idéntica y
fullDecode, originales intactos y sin desbordamiento. Material y análisis facial sintéticos para QA;
no es una muestra creativa ni aceptación audiovisual de Carlos.
Un primer ensayo con imagen en3–5s se bloqueó correctamente por solaparse con
un motion de plantilla; caso corregido a12–14s y repetido en ambos dispositivos.
Evidencia: external-plan.chromium-result.json.

Pendientes de banco/validación creativa: recursos visuales/sonoros definitivos,
probar planes reales externos con ese catálogo y revisar composición/sonido.
Capacidades aún no implementadas: cortes/velocidad por plan externo, seguimiento
de ojos/cuerpo, desenfoque selectivo, posición libre y SFX independientes por
segundo. Blur/radial existentes no se exponen en el importador antes de su auditoría
de memoria. No se cierran F6/F9/V1 ni se promete dirección semántica automática.

## Despliegue comprobado

Código instalado `9febcdfbf2d9f641a455af958a7d1970d47298b5`, árbol
`8390f6296c0b5e2126d223e73148df56270de7ce`; anterior `a75c76f`.
Oficial integrada sin force mediante lease desde `c99f4185`.
Unidad `sues-editor-update-20261020-201352-fd680eb5`, supervisor
`sues-external-plan-deploy-20261020-9febcdf-retry`: SUCCESS, exitCode0,
Result=success/ExecMainStatus0. Whisper congelado durante copia y reiniciado.
Primer preflight del supervisor abortó al considerar pendiente una solicitud
ASR ya COMPLETE; guard corregido reconociendo terminales, sin borrar datos.

Backup `/opt/sues-video-setup/update-backup-20261020-201355-26377/editor-state.tar`,
SHA256 `aba378266bb25a34f829440787f5b49317f7ee93aef1267b2c1f71526850555c`,
recalculado contra manifiesto. Contenedor anterior
`sues-video-editor-before-update-20261020-201355-26377` conservado.
Rollback requiere código+estado de la misma copia, conservando antes los trabajos
posteriores; no se ha necesitado una reversión real.

HTTPS200, API401 sin sesión, revisión privada real compila destello2.27s y
bloquea faltantes/operación no soportada. No se renderiza otro trabajo privado
para esta comprobación ni se afirma nuevo acceso visual nativo Work.
6trabajos y259archivos previos comprobados:258idénticos y sólo heartbeat esperado;
ninguna baja.4recursos públicos y7archivos instalados SHA idénticos. Editor
running/OOMfalse,Whisper activo. Evidencia external-plan.vps-result.json.
Sin consumo API ni cambios de otras aplicaciones.
