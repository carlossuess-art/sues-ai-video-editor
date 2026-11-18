# Master Director · Fase 3 de 5 · Validación de la cadena V17 → V18

La prueba usa el [borrador E01](SUES_MASTER_DIRECTOR_CASO_V17_V18_E01_20261118.md) del retoque real. Se conserva el mismo proyecto de FableCut, en una copia privada. Las comprobaciones utilizan la entrada de revisión, el registro de autorizaciones y el despacho MCP existentes.

| Punto | Resultado |
|---|---|
| E02 · Validación previa | Se contrastaron la duración, los tramos de A-roll, la pista física, los puntos de entrada y los hashes de los cinco recursos. La lista de operaciones devuelve identificadores al rechazar un borrador no vinculado o una pista incorrecta. El solape intencionado de V3 se conserva en el proyecto esperado. |
| E03 · Aplicación | El Master Director guardó y revisó las diez órdenes, tomó una decisión exclusivamente de QA y autorizó un único lote. FableCut aplicó el lote con control de revisión 22 → 23 y devolvió el proyecto en lectura posterior. |
| E04 · Recibos y recuperación | Se persistió un recibo por orden. Un fallo antes del despacho conservó V17 y consumió la autorización de ese intento. Una respuesta perdida después del commit se reconcilió leyendo V18. La repetición no duplicó capas. A partir del recibo se creó una operación inversa, validada antes de escribir, y el MCP restauró la V17 como revisión 24. |
| E05 · Equivalencia | El proyecto completo de revisión 23 fue idéntico a V18, con sus 165 clips y 49 medios. Los SHA-256 de los originales V17 y V18 coincidieron antes y después. |

## Alcance del adaptador

El host de una copia privada fija las huellas del borrador, el proyecto base, el lote ordenado y el proyecto esperado. El servidor contrasta los bytes y permisos con el registro de confianza antes de permitir el lote. Se reutilizan el formato y la vista de revisión del Master Director y el mismo método MCP de FableCut. El adaptador histórico queda inactivo en proyectos sin esa vinculación. El resto de las órdenes continúa usando sus validadores habituales.

La prueba aislada volvió a usar los archivos del montaje histórico. Su registro temporal de QA acota el uso a esa copia y no acredita licencias para producciones nuevas ni aprobación creativa de Carlos. La equivalencia comprobada es del proyecto editable completo. El render y las pasadas audiovisuales se verifican en la fase de validación de la V1.

## Evidencia reproducible

- Borrador inmutable `a4220b5f5a7ff50556a6373860de1b128b0d56c11b70b2e5e66e54201a7dd001`.
- Huella de V18 obtenida vía MCP `316c4585e022567ebf284152b90f67d9b35b24dc688d1c368e064d49b542b7c1`.
- [Prueba privada de extremo a extremo](../scripts/engine-next/fablecut-v18-chain-qa.mjs).
