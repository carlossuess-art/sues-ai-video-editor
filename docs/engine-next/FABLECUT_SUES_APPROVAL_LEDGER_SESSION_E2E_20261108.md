# Fase 2.3 · Aprobación de sesión SUES + MCP nativo FableCut + auditoría persistente · 08/11/2026

**PR #27 únicamente; sin merge ni despliegue. PUBLICACIÓN DE FABLECUT APLAZADA por Carlos.**

## Implementación efectuada

Se integró la puerta de autorización de transformaciones de capa en el servidor existente SUES, reutilizando sus controles de sesión y protección de escritura. No se creó otro editor visual NLE ni se abrió el puerto privado FableCut.

- `src/engine-next/fablecut-director-approval-ledger.js`: fichero de autorización privada con permiso 0600 y directorio 0700; requiere emisión desde host tras verificar sesión, une hash SHA-256 a **actor, projectId, revision, clipId, x, y, scale**, emite identificador aleatorio, TTL de cinco minutos y consumo de una sola vez con archivo `.claimed` creado exclusivamente. La reclamación sigue consumida tras reinicio. Auditoría `dispatch-audit.jsonl` con eventos `approved-before-dispatch`, `committed-verified` o fallo; sincroniza escrituras al disco con `fsync`. Este módulo no se expone como servidor autónomo.
- `src/editor-server.js`: dos endpoints bajo autenticación SUES ya existente y comprobación de origen, sesión/cookie y cabecera anti-CSRF `X-Sues-Request: editor`. `POST /api/engine-next/director/approve-transform` valida identidad del proyecto, revisión y bloqueo de clip y emite aprobación sin editar nada; `POST /api/engine-next/director/execute-transform` consume la aprobación y utiliza el dispatcher anterior, con un invocador MCP proporcionado por el servidor de confianza.
- **Desactivado por defecto**: las rutas exigen `SUES_ENGINE_NEXT_FABLECUT_URL`, `SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR` y para ejecución la dependencia explícita `nativeDirectorInvoker`. Sin habilitarse, responden 503. Ninguna credencial secreta, MCP ni API privada se publica directamente.
- Se rechazan `force`, edición de vídeo fuente V1 bloqueado y revisiones anteriores. El dispatcher es de una transformación segura a la vez; no acepta operaciones arbitrarias ni reintenta automáticamente un cambio fallido.

## Pruebas observadas

- `tests/engine-next/fablecut-director-approval-ledger.test.js`: aprobación humana exigida para emitir en el módulo, vinculación exacta, caducidad, consumo único incluso tras reinicio, y auditoría en fichero persistente.
- `tests/engine-next/studio-media-http.test.js`: sesión inválida 401, falta CSRF 403, intento sobre fuente bloqueada 409, revisión antigua 409, modificación `force` rechazada, aprobación válida sin editar.
- `tests/engine-next/fablecut-director-approval-http.test.js`: flujo HTTP de aprobación → ejecución una vez → rechazo del replay, eventos de auditoría, rechazo de origen indebido.
- Prueba E2E real FUERA de producción: la ruta SUES fue llamada con una **sesión autenticada del servidor creada en QA mediante su token de administración**, no con el formulario de contraseña de un usuario real; control CSRF y sin sesión rechazados. La solicitud aprobada por el servidor pasó por `DirectorApprovalLedger` y `dispatchDirectorNativeTransform` hacia `mcp-server.js` auténtico instalado, con datos clonados en `127.0.0.1:7781`. El proyecto aislado pasó de rev54 a rev55, B02 `x=300→325`. Aprobación usada una vez; segundo intento bloqueado; auditoría `approved-before-dispatch` y `committed-verified`; seis clips, B02 disabled y fuente V1 locked preservados. **El Master Director autónomo no generó esa orden**.
- Evidencia privada en VPS `/srv/sues-fablecut-next/data/qa/director-sues-real-approval-e2e-20261108/evidence/e2e-report.json` y registro persistente de QA.
- **95/95 pruebas dirigidas PASS** tras subir y sincronizar todos los archivos en GitHub, incluidos checks de integridad de `src/editor-server.js` con **1215 líneas**, `node --check` OK. Worktree limpio, original de producción rev54 y 6 clips, FableCut privado y SUES público HTTP200.

## Limitaciones precisas / siguiente etapa

1. La emisión de aprobación se verifica mediante sesión de servidor. Falta validar **inicio de sesión con credenciales humanas reales** y atribución de identidad concreta (actualmente actor genérico `sues-authenticated-admin`); no inventar identidades de quien aprueba.
2. Las operaciones están desactivadas en producción; hace falta integrar en el **flujo propio de SUES Master Director** una revisión humana real del comando, con botón o diálogo de aprobación y consentimiento específico por operación, y dispatcher conectado mediante un invocador de confianza que no exponga MCP a Internet.
3. La auditoría existe y sobrevive al reinicio; revisar permisos/rotación/retención de logs y alertas. Implementar cancelación/revocación explícita y procedimiento de restauración sin permitir replay.
4. Probar antes en clon real cambios concurrentes y reinicios. No desplegar ni publicar el editor hasta superar una revisión de seguridad completa y recibir la orden de Carlos de retomar esa fase.
5. Backups previos: servicio de rotación del editor anterior sigue fallando por pin fijo ausente y carpeta incompleta. No borrar ni forzar rotaciones.

Google Doc maestro: https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit
