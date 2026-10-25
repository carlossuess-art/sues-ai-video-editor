# Gemini y OpenAI · conexiones preparadas · 25/10/2026

## Resultado y estado real

Se han añadido dos adaptadores al editor existente, no una aplicación nueva. Ambos generan un plan sues-edit-plan/v1 completo dentro de las capacidades publicadas por el motor. El plan pasa por reviewExternalPlan y usa el recorrido existente para ejecución en otra versión.

La conexión Gemini 3.8 Flash sube el original mediante Files API, espera ACTIVE y solicita un plan por Interactions API con vídeo/audio, muestreo visual static1fps, razonamiento medium y store:false. Intenta borrar el archivo remoto al terminar y registra si DELETE tuvo éxito. La conexión OpenAI GPT-6.1 Sol utiliza Responses API con transcripción/catálogo y8JPEG de640px con timestamps, razonamiento medium y store:false. No interpreta audio directamente.

No se ha realizado ninguna llamada REAL a estos proveedores, subida de vídeo a ellos ni cargo. Se autoriza reutilizar credenciales existentes, pero no se encontró ninguna candidata en35archivos de entorno/configuración revisados, contenedores activos o entorno de trabajo. No equivale a afirmar que Carlos no tenga claves en otra cuenta o equipo. No se han creado ni copiado claves nuevas. Las suscripciones y conectores autenticados no proporcionaron una clave recuperable del editor.

## Interfaz y recorrido

En DirectorIA → Plan por escenas, selector Gemini/OpenAI, Comprobar conexiones y Crear plan. El botón queda bloqueado cuando falta la clave. Con una conexión disponible, solicita una propuesta; muestra el resultado de validación y guarda el borrador. Ejecutar plan en otra versión sigue siendo una acción explícita. No se altera el montaje anterior por analizar ni se inicia un render al recibir el plan.

Los controles se probaron en escritorio y móvil con respuestas de proveedores SIMULADAS, no con una inferencia real. El recorrido conserva el plan al recargar. No hay fallback automático a otro proveedor ni peticiones remotas al cargar la página.

## Control de consumo y conservación

Una llamada de generación como máximo por petición explícita; sin reintentos automáticos ni cambio de proveedor ante429. La petición se guarda privadamente porID yhuella de catálogo/encargo/modelo. Un resultado completo puede reutilizarse; peticiones interrumpidas/fallidas exigen revisión y nueva petición explícita para evitar cobros duplicados. Un solo análisis simultáneo por instancia. Las llamadas de estado de archivo Gemini no generan planes adicionales.

Guardas: fuenteSHA256 antes/después, máximo120s y512MiB, catálogo180000caracteres, encargo4000, respuesta2MiB, plan30000caracteres/60operaciones, salida12000tokens. Esto acota recursos por petición; no es un límite monetario mensual. El saldo y las cuotas siguen siendo del proveedor.

Las claves sólo se leen en servidor, desde variables de entorno existentes o archivo privado de acceso con permisos0600. No se devuelven en estado, errores, UI, logs de prueba ni prompt. Un destino de subida fuera del origen oficial de Google se rechaza antes de enviar el vídeo. Los errores de proveedor no exponen el cuerpo remoto.

Cada resultado se liga al trabajo y a su fingerprint; si cambian los ajustes mientras se analiza no se aplica automáticamente. Las operaciones incompatibles, recursos inventados, tiempos o fuente incorrecta se someten al validador existente. Los límites actuales de motor permanecen: no prometer5×, cortes, posiciónlibre o timeline multicapa por haber conectado laIA.

## Pruebas realizadas

-8/8tests focales PASS: ausencia de claves, peticiónOpenAI/muestras temporizadas, reutilización sinsegunda llamada, subida/estado/borradoGemini, cuota/sin fallback, destino ajeno rechazado, plan de otra fuente/incompleto/grande rechazado, permisos de credenciales yendpoint autenticado/ajustes obsoletos.
-BrowserChrome151:4/4combinaciones escritorio/móvil×Gemini/OpenAI PASS. Conexión ausente bloqueada; con servicio simulado el plan se recibe,valida yguarda, conserva padre ynoinicia render. Sin erroresJS ni overflowhorizontal; recarga conserva borrador.
- Suite completa:371casos,370PASSDocker; elúnico casoGit fallido enesecontenedor pasa conlos2testsdeploy enhost. npm run check ygit diff --check PASS. Pruebas deAPI son simuladas. No equivalen a validación de cuenta, cuota, precio real ni calidad creativa.
-Sin render nuevo: no se cambia el compositor, yesta tarea no valida un Reel cinematográfico ni eltimelineconkeyframes.

## Fuentes oficiales consultadas

https://ai.google.dev/api/interactions-api
https://ai.google.dev/gemini-api/docs/files
https://ai.google.dev/gemini-api/docs/structured-output
https://ai.google.dev/gemini-api/docs/video-understanding
https://developers.openai.com/api/docs/models/gpt-6.1-sol
https://developers.openai.com/api/docs/guides/structured-outputs

REA: se conservan los análisis públicos previos de CapCut/Captions. El bloqueo actual es la ausencia de credenciales autorizadas recuperables; REA no puede resolverlo extrayendo claves de terceros ni convertir una suscripción en accesoAPI. Los contratos de conexión proceden de documentación oficial; no se repitió investigación de frontend para este bloqueo.

## Siguiente acción exacta

Resolver la credencial de cada proveedor mediante el flujo seguro autorizado. Carlos eligió reutilizar; al no encontrarse claves disponibles, crear otras requiere nueva decisión expresa. No pegar claves en chat ni publicarlas enGit. Con acceso: validar una petición real por proveedor, medir tokens/latencia/coste, revisar el plan yrenderizar sobre la misma fuente; compararMP4 antes de decidir el director predeterminado. Para ofrecer la app a usuarios delEEE, aplicar las condiciones deGoogle sobre servicios de pago.

No desplegado. Producción anterior, originales yversiones conservados. Gasto externo nuevo0€. Globaloficial48% sin cambio; F6/F7/F9 yV1 abiertas.
