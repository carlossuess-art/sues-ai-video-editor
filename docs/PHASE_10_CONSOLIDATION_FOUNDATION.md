# Fase 10 · Consolidación / despliegue · foundation

Pretrabajo. Fase 10 sólo empieza oficialmente después de alcanzar V1 en Fase 9.

## Checklist de consolidación
- rama principal contiene fases validadas y tests verdes;
- PROJECT_STATUS.md coincide con Google Doc maestro;
- README de instalación/operación actualizado;
- variables de entorno documentadas sin secretos;
- provider adapters reemplazables;
- limpieza/retención automática de temporales validada;
- observabilidad: job ID, timings, coste, proveedor, errores;
- backups y recuperación documentados;
- dependencias fijadas/versionadas;
- política de privacidad y manejo de medios definida antes de usuarios externos;
- rollback probado.

## Despliegue
La arquitectura final se decide después del E2E. No contratar suscripciones mensuales por
adelantado. Priorizar infraestructura ya disponible, open source o PAYG.

## CapCut
CapCut permanece opcional y fuera del camino crítico V1. Si se integra:
- adapter propio;
- nunca tocar original;
- clonar/backup;
- validar versión;
- lint/preview;
- posibilidad de cambiar CLI/MCP sin afectar al motor.

## MCP
Será una fachada de alto nivel sobre el motor, no su implementación interna.
Acciones previstas: create_edit, apply_template, smart_cut, apply_style,
change_caption_style, add_motion, reframe_face, preview, validate, restore.

## Pendiente
Deployment real, documentación final, seguridad de producción y cualquier salida editable
CapCut sólo cuando la Fase 9 esté aceptada.
