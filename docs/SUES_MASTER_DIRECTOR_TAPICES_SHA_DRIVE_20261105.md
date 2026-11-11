# SUES MASTER DIRECTOR · Procedencia SHA de tres tapices maestros · 05/11/2026

**Evidencia positiva obtenida sin modificar Drive, biblioteca, producción ni archivos.** Se descargaron los tres archivos originales completos de la carpeta Drive `06_TAPICES_MAESTROS`, se calculó SHA-256 y se volvió a calcular SHA-256 sobre los archivos `.media` presentes en la biblioteca privada del editor del VPS. Los tres pares son idénticos byte a byte según SHA-256 y tamaño.

Carpeta de origen: https://drive.google.com/drive/folders/1xHgnFP0337j60Fltca4oophCdz464de9
Biblioteca: VPS `srv1841004`, `/opt/sues-video-setup/editor/jobs/assets` (volumen de datos de `sues-video-editor`). Verificación **solo de lectura**.

| Tapiz | Original privado en Drive | SHA-256 confirmado de Drive Y editor | Tamaño | Fecha de origen Drive UTC |
|---|---|---|---|---|
| 01 Cuadrícula antracita ámbar | [TAPIZ_01_ANTRACITA_CUADRICULA_AMBAR.webp](https://drive.google.com/file/d/1vdE73lj_OYE6IhNu-UYm5GLw5tcnC-Ty/view) | `ff9c419c62a2187967029b48a602dabb06cbfd30e0d9a7573334dd0d6e929f21` | 49.626 bytes | 2026-11-03 18:08:01 |
| 02 Perspectiva dorada | [TAPIZ_02_PERSPECTIVA_DORADA.webp](https://drive.google.com/file/d/19Sa_dIFwmUA4NhYPnZwpivnaX7hxteT2/view) | `96733f935696ba3ca805af5aa49f4f9c41a8767a7b80db81a17d006ff8c4cf7d` | 63.844 bytes | 2026-11-03 18:08:10 |
| 03 Ondas cobre sin cuadrícula | [TAPIZ_03_ONDAS_COBRE_SIN_CUADRICULA.webp](https://drive.google.com/file/d/1p7LF5LNLpfXSKf_W7sSMH6X0ZmDuoshk/view) | `1b0ad44ab27d9081f161a4185d5e0a5fa05d275f02b4a0562542313e080bf9d8` | 44.808 bytes | 2026-11-03 18:08:18 |

Metadatos antiguos del editor (fecha de registro 2026-11-03 ~18:11 UTC): `kind=image`, `mimeType=image/webp`, `rights=owned`, títulos `TAPIZ MAESTRO 01/02/03`. La etiqueta antigua `owned` es una declaración, NO es prueba jurídica independiente.

## Qué se puede declarar con fundamento

- **Identidad técnica y trazabilidad entre Drive y biblioteca: verificada** mediante SHA-256 de seis archivos, tamaños y fechas de registro. No se necesitan nuevas versiones ni reimportar imágenes.
- **Titularidad/licencia para uso comercial: NO verificada aún**. Faltan evidencia de creación/autorización y, según el sistema V2, `license.rightsStatus=verified`, `license.commercialUseAllowed=true`, `license.proofRef`, `testReportRef`, `approvedForProduction=true`. No rellenar estos campos de forma automática, no usar como evidencia simplemente un nombre, la ubicación en Drive o `rights=owned`.
- No hay que repetir la comparación de hashes mientras los seis archivos conserven exactamente estos SHA-256; si cambia cualquiera, invalidar la evidencia y volver a comprobar.

## Continuación para Work

1. Recuperar el historial verificable de generación/adquisición o la autorización de Carlos referente a los tres fondos; documentar pruebas de licencia comercial y procedencia. Si falta, preguntar solo por esa evidencia y **continuar el resto de implementación sin ella**.
2. Preparar propuesta de registros V2 en una copia aislada; validarla con el inspector existente. No escribir en la biblioteca productiva sin autorización.
3. Una vez aprobadas las evidencias, vincular los mismos tres SHA-256 a `master-director-policy-builder.js` sin reconstruir tapices.
4. Conservar este archivo en la misma cadena de documentación que `docs/SUES_MASTER_DIRECTOR_CHECKPOINT_ACTIVO.md`.

No hay gasto API, subida de nuevos assets, publicación, edición de licencia ni despliegue.
