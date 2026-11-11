# Fase 2.3 · Auditoría de integración UI nativa FableCut en SUES · 08/11/2026

**Estado: inventario técnico y política fail-closed implementados; no existe aún un gateway nativo completo. NO desplegar ni fusionar por esta prueba.**

## Por qué se investigó
Tras demostrar SUES Studio→FableCut real (transformaciones/título/undo/concurrencia CAS) con copia privada y probar backup/restore nativo, la siguiente prioridad es **reutilizar el Studio NLE completo FableCut**, no crear otra línea de tiempo independiente.

El FableCut nativo utiliza rutas absolutas de recursos y de API; SUES tiene su propia autenticación, API y política CSP (`frame-ancestors 'none'`). Un proxy genérico de FableCut permitiría operaciones sensibles y eludiría las protecciones de SUES. **No implantarlo ni exponer 7780 al público.**

## Auditoría sobre archivos instalados reales
- Inspección de `/srv/sues-fablecut-next/app/index.html` y `app.js` del FableCut instalado, sin alterar archivos.
- `24` dependencias estáticas explícitas (CSS/JS/íconos).
- `31` rutas `/api/...` literales encontradas en `app.js` (el número es inventario textual, no garantía de detectar rutas construidas dinámicamente).
- Solo `4` rutas catalogadas como candidatas de lectura (`GET /api/project`, `GET /api/projects`, `GET /api/versions`, `GET /api/export/profiles`), que AÚN requerirían autenticación y validación de proyecto.
- `27` rutas restantes clasificadas como **requieren evaluación individual**, no implica que todas escriban. Entre las peligrosas: `POST /api/versions` (incluye restore/delete), `PUT /api/project`, `POST /api/upload`, importación URL, edición y exportación.
- Las rutas absolutas de API colisionan con el namespace `/api` de SUES. Incluir `index.html` en iframe sin adaptación no une seguridad ni modelo de datos. La CSP de SUES usa `frame-ancestors 'none'`; debe diseñarse explícitamente la política del editor embebido y origen.

## Código nuevo en PR27
- `src/engine-next/native-nle-web-contract.js` inspecciona recursos/rutas del frontend a partir de fuentes locales y define `safeNativeNleRead(method,path)`, cerrado por defecto. **No habilita un proxy** y no concede autorización por sí solo.
- `tests/engine-next/native-nle-web-contract.test.js` comprueba que escritura de proyecto, recuperación de versiones, upload, import-url, rutas dinámicas no autorizadas y path traversal se rechacen; el inventario preserva `unrestrictedReverseProxyAllowed:false` y `nativeUiExposed:false`.
- Inventario real persistido privadamente en VPS: `/srv/sues-fablecut-next/data/qa/phase23-native-real-edit-cas-20261108/native-frontend-surface-audit.json`, junto con los artefactos del caso real de edición y recuperación.
- **83/83 pruebas dirigidas PASS** tras las tres pruebas nuevas. GitHub rama PR27 sin despliegue ni merge.

## Puerta de integración pendiente
No requiere comprar otro modelo ni volver a construir el motor. Requiere implementar, probar y auditar:
1. Servir recursos nativos bajo un namespace **autenticado y aislado**, sin choque con rutas SUES y sin leer archivos arbitrarios.
2. Integrar la interfaz original con su CSS/CSP/origen (definir con cuidado iframe, sandbox y las llamadas internas, preferiblemente sin API privada expuesta).
3. Operaciones FableCut por acción explícita detrás del backend SUES: project/versions, media import, edit, trim, undo/redo, render, con autorización, CAS, límites y logs. **No se permite un túnel HTTP sin validación**.
4. Probar acceso denegado sin sesión, CSRF y origen, subida de archivo, rollback y comportamiento con dos editores concurrentes.
5. Repetir E2E con clon del proyecto real, y solo después considerar despliegue controlado y autorización de Carlos.

## Estado de fases y restricciones
Fase1 infra 90 %: recuperación real en clon validada; DR automático y permisos de producción no cerrados.
Fase2 editor 45 % estimado: UI staging+historial y CAS/undo real verificados; frontend nativo NLE íntegro bajo SUES pendiente por la puerta de seguridad.
Fases3–7 siguen 80/60/65/40/30 % como estimación, sin cambios.
Prioridad **continúa FASE 2.3**, con seguridad/backup de Fase1 en paralelo. No publicar ni afirmar NLE finalizado.

Evidencias anteriores: `docs/engine-next/PHASE23_REAL_NATIVE_BROWSER_RECOVERY_QA_20261108.md`, checkpoint `docs/SUES_MASTER_DIRECTOR_CHECKPOINT_ACTIVO.md`, Google Doc persistente `https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit`.
