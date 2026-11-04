# SUES MASTER DIRECTOR · Primera barrera de seguridad · 04/11/2026

**Estado:** código aislado en rama de desarrollo. **No está conectado al editor web, desplegado, ni aprobado como vídeo final.** No hay servicios de pago, claves, medios privados ni alteraciones de originales.

## Propósito
Comenzar a implementar «el cerebro que coordina todo» sobre el repositorio existente, sin suplantar los contratos ya operativos: `sues-edit-plan/v1`, `director-contract.js`, `sourceTimeMap`, `timelineFingerprint` ni la gramática visual 158623.

Archivos nuevos:
- `src/master-director-gate.js`: revisión cerrada por defecto de entradas, reglas y capacidades; comparación de ejecución y pruebas.
- `tests/master-director-gate.test.js`: nueve casos sobre aprobaciones, versiones, capacidades, derechos, conflictos, dependencias y evidencias caducadas.

## Decisiones verificables del primer módulo
1. **Original y edición reversible:** bloquea fuentes aplanadas, fuentes no originales, SHA distintos o timeline desactualizado.
2. **Autoridad:** precedencia expresa: seguridad/derechos → aprobación de Carlos → maestros bloqueados → proyecto → perfil → escena. Conflictos pendientes impiden avanzar.
3. **Identidad visual:** hashes de recursos maestros comparados con registro confiable externo al plan.
4. **Plan narrativo:** escenas identificadas con propósito y cobertura completa; operaciones por escena con motivo y dependencias sin ciclos.
5. **Capacidades:** ninguna operación se habilita solo porque figure en un catálogo. La capacidad debe estar declarada por el registro del motor real; no existe sustitución silenciosa.
6. **Recursos:** si una operación incorpora recursos de biblioteca, los derechos comerciales y su huella deben estar comprobados en el registro confiable.
7. **Aprobación previa:** una huella SHA-256 del plan vincula explícitamente la aprobación. Cualquier modificación invalida esa aprobación.
8. **Auditoría independiente:** manifiesto ejecutado idéntico al plan y dos ejecuciones QA con identificadores distintos, pruebas completas por operación y hashes de artefactos. La evidencia debe suministrarse desde un verificador autenticado, nunca desde el mismo generador del plan.
9. **Aceptación final:** superar QA no representa la aceptación audiovisual de Carlos; esta permanece separada.

## Estados
- `BLOCKED`: entrada, reglas, origen, capacidades o dependencias inválidas.
- `AWAITING_PLAN_APPROVAL`: borrador técnicamente válido, todavía no autorizado.
- `READY_TO_EXECUTE`: plan aprobado y coherente; **no significa render final validado**.
- `QA_REJECTED`: evidencia ausente, incompleta o incompatible.
- `AWAITING_CREATIVE_ACCEPTANCE`: dos auditorías completas, falta revisión creativa.
- `READY_FOR_RELEASE`: consta aceptación creativa de la misma huella; todavía hay que realizar la publicación por el flujo autorizado.

## Pruebas y límites reales
- Nueve casos lógicos comprobados con un intérprete JavaScript aislado y una función hash de sustitución; **no equivale a ejecutar la suite Node, FFmpeg o revisar vídeo real**.
- Para permitir que la edición nativa adopte estas reglas hay que conectar el módulo con el servidor autenticado, convertir las operaciones existentes al modelo auditable y obtener capacidades del renderer real.
- El registro QA debe ser escrito **solo** por un servicio autenticado distinto del ejecutor; declarar `verifierId` en un JSON sin controles de servidor no prueba independencia.
- El SHA del plan es deliberadamente sensible a cambios de orden de propiedades JSON: prefiere invalidar de más antes que reutilizar una aprobación vieja.
- El módulo aún no mide ritmo narrativo, audibilidad, oclusión, máscaras, fluidez de preview ni equivalencia del MP4. Estas evidencias quedan pendientes para los verificadores específicos.
- No se ha hecho merge ni modificación de producción.

## Próxima integración, sin saltarse etapas
1. Comparar commit y funciones reales de la rama desplegada con la experimental; seleccionar incorporación mínima sin sobrescribir módulos nuevos.
2. Crear adaptador desde `sues-edit-plan/v1` y la línea temporal editable; persistir huellas y reglas aprobadas.
3. Registrar capacidades reales por motor y conectar `reviewMasterDirectorPlan` antes de cualquier render autorizado.
4. Recolectar manifiesto real, pruebas de fotograma/movimiento/audio y dos QA independientes; llamar `auditMasterDirectorExecution` únicamente desde backend autenticado.
5. Ejecutar tests en Node 22, suite de regresión con AJV/FFmpeg, vídeo 158404, preview/render equivalentes y revisión humana. Desplegar solo tras respaldo y validación total.

**Prohibición de interpretación:** este documento no autoriza que un MP4 V3C aplanado se convierta por sí solo en fuente editable ni confirma segmentación corporal automática.
