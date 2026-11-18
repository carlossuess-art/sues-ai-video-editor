# Auditoría de un montaje real · «¿Quién habla en tu cabeza?» · V17 → V18

18/11/2026 · Fase 2 de 5 · Puntos 1 a 4 · Auditoría cerrada sobre el retoque conservado de V17 a V18. Código comprobado en `95b039aa8b1a923c8f7ffa1ce343a9a74da35a8d` de la [PR #27](https://github.com/carlossuess-art/sues-ai-video-editor/pull/27).

## Resultado

El retoque pasó por un script que envió un lote directamente a FableCut. El registro histórico y la repetición aislada demuestran la aplicación de sus diez órdenes. Al presentar ese mismo archivo a la entrada actual del Master Director, el almacén devuelve `Invalid story schema` y el preparador del lote devuelve `INVALID_STORY_SCHEMA`. El archivo conserva órdenes nativas y huellas del montaje, pero carece del contrato canónico `sues-master-story/v1` y de una revisión/decisión enlazada en el Master Director. El nombre `approved-v18-delta.json` identifica el archivo histórico.

La composición sobre la pista V3 tiene una segunda limitación. En la V18 guardada se superponen intencionadamente capas de niebla, destello y motion. La prueba individual con el inicio, duración, pista y mezcla reales del destello produjo `TRACK_OVERLAP` en el adaptador de órdenes del Master Director. La misma capa sí quedó grabada y verificada en la repetición por FableCut.

## Punto 1 de 4 · Evidencias del mismo montaje

| Evidencia | Identidad |
|---|---|
| Bruto `recording-20261110-115912/original.mp4` | SHA-256 `0190efba90de1f7f73bfef8fc1c3822779a82c123225f77b68a50a9b31a77ad8` |
| FableCut `test-project-039-v17/project.json` | Revisión 22. SHA-256 `528e1c4a237e0cc7b696ea846b0763f4bb5b192dcea296d21178d83bd3d71687` |
| Instrucciones `approved-v18-delta.json` | Diez órdenes. SHA-256 `bcb45d732de9505954b2c443398e6d0a7aa365254fafd2039fc4dc9c8ae6ec1a` |
| FableCut `test-project-040-v18/project.json` | Revisión 23. SHA-256 `1ca6a09fecdfd23bc32ef398c3574e9ff15cbc7dac7a10c8535ff41f1e9ade03` |
| Registro `execution-proof.json` | Resultado del lote 22→23. SHA-256 `9efbe4eb74624fadf0ef8113694d959166f862053e3950823f7f7638b251a26c` |
| Preview V18 | Archivo enlazado por `v18-preview-render-proof.json`. SHA-256 `bd63e30cb56a4de41c5115373c61176b0fc391f31dbd4f67cb3c5068e1fcb5f2` |

Se verificaron la huella de la revisión base que exige el delta, la huella V18 que declara el recibo y los hashes de las dos previsualizaciones que enlazan ambos montajes. El alcance es la revisión V17→V18. El resto del Reel ya estaba montado al comenzar este retoque.

## Punto 2 de 4 · Orden grabada frente a proyecto guardado

Los intervalos pertenecen al reloj de montaje a 30 fps y el último fotograma es exclusivo. Los recursos se registran antes de colocar sus capas. La entrada de medio de las capas auditadas es 0 s.

| Orden | ID | Intervalo y pista | Aplicación comprobada |
|---:|---|---|---|
| 1 | `v18-sofa-integrated` | Recurso | Alta de `sofa-v18-integrated.mp4`, usado por 5. |
| 2 | `v18-mist` | Recurso | Alta de `v18-mist.png`, usado por 6. |
| 3 | `v18-mist-veil` | Recurso | Alta de `v18-mist-veil.png`, usado por 9. |
| 4 | `v18-flash` | Recurso | Alta de `v18-flash.png`, usado por 8. |
| 5 | `SC02-SOFA` | V3 · F228–309 · 7,600–10,300 s | Sustitución del recurso y de propiedades. Duración conservada de 2,700 s. |
| 6 | `V13-SELF-GLOW` | V3 · F1053–1316 · 35,100–43,867 s | Niebla en modo `screen`, propiedades y fotogramas clave. Duración conservada de 8,767 s. |
| 7 | `V14-HIGHER-SELF-MOTION` | V3 · F1092–1316 · 36,400–43,867 s | Cambio de propiedades y fotogramas clave sobre el recurso existente. Duración conservada de 7,467 s. |
| 8 | `V18-LOCAL-FLASH` | V3 · F1053–1099 · 35,100–36,633 s | Alta de capa en `screen` durante 1,533 s. |
| 9 | `V18-MIST-VEIL` | V3 · F1093–1316 · 36,433–43,867 s | Alta de capa en `screen` durante 7,433 s. |
| 10 | `project.name` | Proyecto | Nombre de V18 guardado. |

El cotejo de los documentos completos confirma 160 clips anteriores idénticos, tres modificados y dos nuevos. Los 45 recursos previos y las 55 composiciones se conservaron. A-roll V1 (18), captions V8 (51), títulos y gráficos de las demás pistas, voz A1 (7), música A2/A3 (6) y SFX A4/A5 (40) conservaron sus órdenes y propiedades.

Las previsualizaciones decodifican 834 fotogramas a 540 × 960 y 15 fps. En el reloj de exportación, los intervalos de retoque son F114–155 y F526–658. Se compararon los 834 fotogramas V17/V18. El PSNR mediano es 16,72 dB en el sofá, 28,88 dB en niebla/destello y 48,58 dB fuera de esos intervalos. Los datos muestran dónde se concentraron las diferencias. La pista AAC copiada y el audio PCM decodificado coincidieron bit a bit. SHA-256 de PCM `1000d98cd563b80bff15f6430da50b4cf2e24d0182e37b55779ab40af9e9a25f`. Esta verificación se refiere a las previsualizaciones guardadas y al retoque documentado.

## Punto 3 de 4 · Repetición y localización del fallo

1. Se verificaron las huellas del código del almacén de revisiones, del inspector y del adaptador de lotes en el VPS contra la PR #27.
2. Se probó el archivo histórico intacto en el almacén y preparador actuales con una copia de la revisión 22. Resultado bloqueado antes de FableCut, cero escrituras y misma huella del proyecto.
3. La interfaz nativa `fablecut_patch_project` recibió el lote histórico intacto con `baseRevision:22` sobre la copia. La lectura posterior `fablecut_get_project` devolvió los 165 clips y 49 recursos de la revisión 23. La comparación profunda dio igualdad con el proyecto V18 original, huella estructural `316c4585e022567ebf284152b90f67d9b35b24dc688d1c368e064d49b542b7c1`.
4. La repetición del lote con la revisión vieja devolvió `CONFLICT` y preservó la huella de revisión 23. Se volvieron a comprobar los SHA de los proyectos originales y se verificó que seguían idénticos.
5. El adaptador del Master Director rechazó el comando aislado del destello con `TRACK_OVERLAP` en V3. El lote nativo ya reproducido acredita que el editor admite esa composición.

## Punto 4 de 4 · Primer problema y prueba para la fase siguiente

La primera interrupción está en la entrega del plan al Master Director. La fase 3 debe representar el retoque dentro del contrato existente con IDs estables, recursos, reloj de origen y de montaje, pistas, fotogramas clave y dependencias. Hay que conservar el solape deliberado de V3 y el control de revisión. El lote histórico sirve como caso de regresión y la V18 guardada, como resultado esperado.

Criterio técnico: pasar el mismo caso por la entrada canónica con una revisión y un fingerprint verificables, obtener estado por operación y demostrar en un clon paridad para las diez órdenes. Comparar las capas tocadas, los recursos y el resto del proyecto. Probar conflicto con revisión vencida sin duplicar capas. Cualquier operación sin traducción fiel debe quedar identificada con su ID antes de escribir. La autorización creativa, la exportación final y las dos pasadas de imagen y sonido corresponden a los hitos de validación de V1.
