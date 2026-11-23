# Reel 158404 · milestone 1 · fuente y vídeo existentes vinculados sin fingir aprobación

**Fecha:** 08/11/2026. **Trabajo sólo desarrollo/QA:** no Caddy, DNS, despliegue, merge ni proyecto FableCut original modificados. Carlos ha aprobado el plan de desarrollo de Reel integral, no un clip final ni sus 49 operaciones por separado.

### Comprobación ejecutable

```sh
python3 -m unittest discover -s tests/engine-next -p test_reel_158404_milestone_audit.py -v
python3 scripts/engine-next/reel-158404-milestone-audit.py --output /srv/sues-fablecut-next/data/qa/reel-158404-milestone1-20261108/readiness-report.json
node --test tests/engine-next/*.test.js
```

- Se leen, sin tocar, el plan real de 49 operaciones en 7 escenas, la copia editable nativa B02, el informe del export FableCut, el paquete ASR de revisión, la foto B02 y el vídeo bruto real.
- Se recalculan SHA256 fuente, foto y export; no se confía solo en nombres. Si no coinciden, se detiene la auditoría. Fuente SHA `9e06f49c…94ccaad` y foto B02 SHA `193ee26b…9d521b4` coinciden con la historia; MP4 prueba SHA `6988efde…455d243fda` coincide con el manifiesto del export.
- Se rechazan proyectos sin fuente y voz bloqueadas, matte temporal desalineado, ASR fingido como revisado, escenas/operaciones truncadas y manifiesto de export alterado.
- El resultado diferencia **49 operaciones planeadas**, **una operación con escena B02 representada en un prototipo nativo** y **cero operaciones con manifiesto certificado de ejecución plan↔motor, QA cinematográfica y aprobación completa**. Por ello el Reel NO está listo para aprobarse.
- El informe privado no copia palabras habladas ni fotogramas a GitHub; el documento creativo revisable se encuentra en `REEL_158404_B02_STORYBOARD_V2_REVIEW_20261108.md`.

### Bloqueos genuinos y trabajo independiente

- Subtítulos reales: 11 tokens candidatos sin escucha humana, cortes y posición bajo barbilla sin verificar. No activar en producción.
- Oro V5: aparece parcialmente fuera de pantalla y no tiene vínculo narrativo al plan de 49 operaciones; revisar si debe eliminarse antes de continuar con el título semántico.
- Render B02: prueba técnica de 120 frames, NO Reel entero. Un importador y supervisor aún deben vincular capas y efectos sin pérdidas; guardar toda operación pendiente por ID.
- Seguir desarrollo del puente UI/MCP, geometría, escenas y QA en copias locales. La publicación web sigue aplazada expresamente.
