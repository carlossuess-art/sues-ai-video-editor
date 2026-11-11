# SUES MASTER DIRECTOR · Continuidad e integración final · 04/11/2026

Documento para reanudar en Work cuando se necesite navegador/QA audiovisual o una integración muy amplia. **El trabajo ya existe; no reconstruirlo.**

## Contexto verificable

- Proyecto: https://github.com/carlossuess-art/sues-ai-video-editor
- Rama aislada: feat/master-director-story-orchestration-20261104
- PR borrador: https://github.com/carlossuess-art/sues-ai-video-editor/pull/27
- Producción web: https://editor.suesholistics.com
- VPS: srv1841004. El contenedor sues-video-editor monta /app desde /opt/sues-video-setup/release-mobile-layers-20261030. Esa carpeta de producción es una exportación de archivos, NO un repositorio git.
- Skills: SUES AI Film Director; **todavía no modificada**, porque primero debe quedar estabilizado el contrato del cerebro.
- Reglas aprobadas por Carlos verbalmente el 04/11: docs/SUES_MASTER_DIRECTOR_REGLAS_APROBADAS_20261104.md (sustituye el borrador anterior). Respetar íntegramente las 20 y sus matizaciones.

## Piezas ya construidas (no duplicarlas)

1. src/master-director-gate.js: fuente original, masters bloqueados, SHA, dependencias, control de capacidades, dos QA y aprobación separada.
2. src/master-director-rulebook.js: resuelve prioridad, ámbitos, referencias y contradicciones de reglas; no confunde pizarra de referencia con tapices de SUES.
3. src/master-director-story.js: escenas, relaciones narrativas distantes, recursos verificados y recursos ideales por generar.
4. src/master-director-narrative-arc.js: hook → desarrollo → caída → transformación → moraleja → CTA, con segunda caída/transformación opcionales; exige evidencia real de transcripción o fotogramas cuando la política es reel-v1.
5. src/master-director-orchestration.js: entrada única de reglas aprobadas y plan, con huella que invalida aprobaciones anteriores.
6. src/master-director-workflow.js: pregunta aprobar/revisar o modo autónomo, timeline narrativo, catálogo de recursos, límites de saldo, archivo provisional para terminar en CapCut bajo decisión de Carlos.
7. src/master-director-native-bridge.js: traduce solo operaciones reproducibles fielmente por sues-edit-plan/v1. No convierte una máscara Remotion en B-roll completo ni pierde coordenadas, tamaños o tipografía. Rechaza parámetros adicionales sin soporte.
8. src/master-director-native-review.js: llama de forma read-only al validador REAL del editor y no crea ni renderiza un job.
9. src/master-director-layer-graph.js: esquema estructurado de capas, posición exacta, fotogramas, tipografías, máscaras verificadas, keyframes y recursos. **No declara falsamente que esas capas ya puedan editarse en la interfaz web.**

## Evidencia de pruebas

- 96/96 PASS en Node.js v22.23.3, ejecutados sobre copia aislada de la exportación de producción con estos módulos añadidos y tests de external-edit-plan, creative-plan-adapter y Master Director. Ruta temporal: /tmp/sues-master-director-native-integration-qa-20261104. Los tests son dirigidos, NO la suite completa.
- Primer intento de regresión exportadora en host: 104 PASS / 5 fallos por ffmpeg ENOENT (el host no tiene FFmpeg).
- Repetición usando **imagen exacta del contenedor productivo**, en contenedor Docker temporal, con red desactivada, sin secretos, limitada a 0,7 CPU y memoria: 12/12 PASS sobre foreground-effects, mobile-e2e-export, separated-render y source-cut-render. Incluye codificación MP4 real, cortes de fuente, audio multicapas, máscaras/oclusión y presets. Esto **no** es la edición completa del nuevo cerebro.
- No se ha modificado producción, servidores de render activos, trabajos de clientes, skills ni originales. No se han gastado APIs, generado B-roll de pago ni efectuado merge.
- Cambios de la rama guardados en GitHub. Revisar HEAD antes de trabajar, porque puede haber otras ramas y módulos contemporáneos.

## Siguiente ejecución técnica (orden vinculante)

**A. Foto del estado real y rollback.** Comparar archivos del contenedor con la rama y worktrees, verificar jobs actuales, versiones y diferencias. Copiar/validar respaldo antes de escritura. No fusionar ramas completas a ciegas.

**B. Registro confiable del cerebro.** Implementar reglas y activos aprobados en backend autenticado; obtener SHA, time map, catálogo, derechos, fuente de datos y capacidades REALES del motor. Nunca aceptar JSON del usuario como validación/autenticación de recursos, permisos o QA.

**C. Entrada, revisión y autorización.** Conectar la ruta de revisión creativa a una propuesta por vídeo: timeline narrativo legible por etapas (hook, caída, transformación, moraleja, CTA) y operaciones numeradas. Preguntar «¿Apruebas el plan o quieres revisarlo?». Autonomía solo bajo autorización previa por proyecto; ninguna ejecución/pago/publicación por ausencia de respuesta.

**D. Compositor de capas y motores.** Compilar la misma especificación en el motor nativo o Remotion preservando fotogramas, geometría, tipografía, z-order, máscaras, SFX y animaciones. Persistir las capas editables dentro del editor web. Nunca presentar un MP4 plano como proyecto editable; el MP4 solo es la exportación, salvo clips maestros reutilizables aprobados.

**E. Recursos ideales.** Buscar en servidor y Drive existente; si falta el recurso ideal, producir una propuesta creativa y prompt de creación sin sustituirlo en silencio. Usar la biblioteca y revisión con enlaces reales; la biblioteca visual integrada simple puede hacerse primero, la unificación completa sigue para V1.1. Cualquier coste fuera del saldo o proveedor aprobado requiere consulta.

**F. Supervisor QA separado.** Verificar eventos en fotogramas reales, interposición en movimiento, textos y jerarquías, sonido audible y sincronía, transiciones y continuidad narrativa. Probar preview contra MP4. Un PASS lógico no demuestra experiencia artística. Dos auditorías completas consecutivas sin defectos reproducibles antes de declaración técnica de terminado; aprobación creativa final de Carlos.

**G. Reparación y entrega parcial.** Si falla una operación, analizar impacto y proponer reparación. Si el archivo es válido y queda un elemento aislado, ofrecer exportación provisional para completarlo en CapCut con decisión explícita. Si el render no funciona, repararlo y repetir pruebas antes de entregar.

**H. Despliegue controlado.** Ejecutar toda la suite posible en entorno aislado con FFmpeg y un vídeo real (incluido 158404), verificar rollback, jobs existentes, pruebas web móvil y sin regresiones. Solo desplegar bajo autorización; no publicar reels automáticamente. **Después de estabilizar el contrato real, adaptar la skill** para producir el mismo plan técnico.

## Criterios de rechazo

- No se puede certificar «terminado» con 96 tests aislados: falta backend real, UI/capas, audio semántico y los renders del nuevo cerebro.
- No se permite borrar instrucciones porque el renderizador no las admite: devolver NO SOPORTADO o NECESITA RECURSO con detalles.
- No crear cuentas, gastar créditos ni recargar saldos sin permiso. Priorizar gratuito/recursos existentes.
- No sobreescribir los tapices maestros antracita con referencia blanca ni revertir recursos artísticos a líneas sin detalles.
- No declarar que Remotion se puede editar en la web por el hecho de que exista un JSON o un MP4.
