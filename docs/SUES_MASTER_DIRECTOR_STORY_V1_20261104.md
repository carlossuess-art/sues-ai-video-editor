# SUES MASTER DIRECTOR · Narrativa global y recursos por crear · 04/11/2026

**Estado: trabajo aislado en rama. NO desplegado ni conectado al editor web.**

Se construye primero el cerebro y, después de validar su interfaz, se adapta la skill de dirección creativa. La skill no ha sido modificada.

## Entrada estructurada: sues-master-story/v1

El cerebro recibe vídeo original + SHA, fingerprint de cortes, duración de la edición, modo visual explícito, mensaje central, experiencia buscada, escenas completas, metáforas que conectan escenas distantes, recursos numerados y operaciones con tiempo, motor, pista, parámetros, razones, dependencias, sincronía con palabra real y controles QA.

El modo brand-sues protege la identidad y sus tapices. El modo reference-exact requiere referencia explícitamente aprobada; nunca se importa una paleta o pizarra de otra referencia sin selección.

Un recurso se identifica como library (con ID/SHA/derechos comprobados) o generate (con encargo de creación y motivo). Un generate pendiente **no recibe identificador inventado ni un sustituto**: el estado NEEDS_RESOURCES detiene la compilación y devuelve instrucciones para crearlo. La generación mediante ChatGPT/Gemini u otro proveedor queda fuera de este módulo y exige la autorización necesaria para servicios de pago.

Las metáforas transversales tienen setupSceneId y payoffSceneId. El cerebro no las acepta como realizadas si faltan las operaciones de inicio o resolución, aunque ocurran con 50 segundos de diferencia.

La sincronía de un evento con una palabra exige wordId real en transcripción verificada. Un evento sonoro requiere QA de audio y tiempo. Una composición gráfica necesita evidencia visual y movimiento y una revisión narrativa.

## Salidas y garantías

BLOCKED: dato no verificado, escenas incompletas, referencia sin permiso, recurso no licenciado, capacidad ausente, relaciones incompletas o dependencias inválidas.
NEEDS_RESOURCES: faltan recursos ideales y se detallan solicitudes de creación; no se rebaja el resultado ni se generan activos de pago sin permiso.
READY_FOR_PLAN_REVIEW: se crea sues-master-director/v1 para la puerta previa existente; todavía requiere aprobación del plan.

El módulo src/master-director-story.js no renderiza, ni mide calidad audiovisual, ni transforma por sí solo el plan en operaciones soportadas por el editor; tampoco edita archivos ni publica nada. El siguiente paso es un adaptador seguro hacia el importador sues-edit-plan/v1 y los motores Remotion/FFmpeg, más un supervisor QA realmente independiente y autenticado.

## Fuentes de autoridad

- Rama inicial: feat/master-director-gate-20261104, módulo master-director-gate.js.
- Gramática de referencia 158623 y pausas 0,7 s en documentación de la rama Remotion.
- Roadmap maestro de Drive y tapices maestros ya existentes; no copiar ni reemplazar sus archivos.
- La aprobación creativa final continúa siendo de Carlos.

## Pruebas y limitaciones

Se han escrito 13 pruebas en tests/master-director-story.test.js para metáforas, solicitudes de creación, permisos, SHA, referencias, palabras, capacidades, audio y dependencias. Los smoke tests lógicos del módulo pasaron antes de subirlo, pero falta ejecución Node 22 de la suite completa y QA con vídeos reales sobre el checkout aislado. No atribuir pruebas de render, despliegue ni aceptación creativa.

**Próximo hito:** definir y validar en lenguaje natural las reglas maestras, probar con un caso integral (miedo/cadenas → liberación), conectarlo al editor existente sin perder componentes productivos; después adaptar la skill al contrato definitivo.