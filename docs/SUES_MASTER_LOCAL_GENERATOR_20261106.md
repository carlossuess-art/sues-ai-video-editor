# Generación local opcional de borradores · 06/11/2026

La entrada `GENERAR PLAN CON IA` puede utilizar un ejecutable local llama.cpp y un modelo Qwen3 elegidos por el operador. Produce un borrador `sues-master-story/v1` y pasa por el mismo almacenamiento, revisión, comprobación de recursos y aprobación que la entrada pegada. No ejecuta ni aprueba el plan. Sin configuración sigue desactivada.

El archivo privado indicado por `SUES_MASTER_LOCAL_PLAN_CONFIG` debe ser absoluto, normalizado, propiedad del operador o root, no escribible por terceros y estar bajo directorios confiables. El formato es:

```json
{
  "schema": "sues-master-local-generator/v1",
  "modelFamily": "qwen3",
  "binary": {"path": "/ruta/absoluta/llama-completion", "sha256": "<sha256-del-binario>"},
  "model": {"path": "/ruta/absoluta/modelo-qwen3.gguf", "sha256": "<sha256-del-modelo>"}
}
```

El servicio comprueba los hashes al cargar y antes y después de cada invocación. Solo admite una generación local simultánea, 24.000 bytes de contexto, 60.000 bytes de respuesta y 300 segundos; llama.cpp recibe un máximo de 8192 tokens de contexto y 3072 de respuesta. No hay truncado autorizado: una entrada excesiva, respuesta incompleta o salida no JSON bloquea la preparación. El prompt temporal es privado y se elimina al terminar la invocación normal. Tras un cierre abrupto del proceso podría quedar en la carpeta temporal privada y requerir limpieza operativa.

La prueba aislada usó llama.cpp y Qwen3 0.6B ya existentes, sin red ni coste de API. Se obtuvo un objeto JSON con las claves principales del contrato en una entrada sintética; eso **no demuestra** que el plan sea narrativamente válido, completo, seguro creativamente ni ejecutable. El validador existente sigue bloqueando ausencia de evidencia, referencias, capacidades y derechos. La generación puede fallar ante planes complejos, capacidad insuficiente o un modelo incapaz de seguir el contrato; no se garantiza que 0.6B sea apropiado para uso real.

Los hashes solo fijan binario y modelo, no bibliotecas compartidas o cambios durante una carrera. El código no impone por sí mismo aislamiento de red ni límites de memoria al proceso, y no descarga ni instala modelos. Para cualquier futura activación real hay que aislar el proceso y sus dependencias, garantizar red y memoria según política, revisar licencias del modelo, disponibilidad y calidad con material autorizado, y comprobar que la revisión nunca apruebe errores. No está configurado en producción ni implica despliegue.
