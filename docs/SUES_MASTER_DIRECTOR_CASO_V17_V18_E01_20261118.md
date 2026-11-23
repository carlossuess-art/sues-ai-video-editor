# Master Director · Fase 3 de 5, punto 1 de 5 · Caso V17 → V18

18/11/2026 · Punto E01 finalizado. Este caso comprueba la representación del retoque real auditado en [V17 → V18](SUES_AUDITORIA_CADENA_REAL_V17_V18_20261118.md). El borrador técnico privado conserva las instrucciones históricas. La validación de permisos, disponibilidad de recursos y soporte de comandos sigue en E02.

## Una revisión con las diez órdenes

El script [fablecut-v18-story-regression.mjs](../scripts/engine-next/fablecut-v18-story-regression.mjs) verifica el hash del bruto, el delta histórico y las huellas de los proyectos FableCut antes y después. Construye un borrador del contrato existente `sues-master-story/v1` y lo guarda y relee con `MasterDirectorProjectStore`. La revisión reproducida es `a4220b5f5a7ff50556a6373860de1b128b0d56c11b70b2e5e66e54201a7dd001`. Tamaño canónico 14.021 bytes.

Las diez operaciones tienen ID estable y orden histórico. Las cinco capas conservan su pista V3, la posición en fotogramas, el punto de entrada del recurso, las propiedades, los fotogramas clave y sus dependencias. Las cuatro altas de medios tienen la ventana de revisión de la capa que los usa y carecen de posición propia. El cambio de nombre depende de las cinco ediciones y se revisa en la ventana del proyecto completo. Se comprobaron las huellas de los cinco recursos implicados, incluida la capa de motion que reutiliza un medio existente.

Se reconstruyeron los 18 segmentos de A-roll sin mezclar el tiempo del bruto, la posición en el montaje y el tiempo del medio colocado en V3. Los cinco cambios de capa tienen cobertura de A-roll en sus propios intervalos. El final del montaje va de F1652 a F1667 sin A-roll en V1, con otras capas existentes de cierre. El mapa conserva explícitamente ese intervalo.

## Comprobación y punto siguiente

Al leer la revisión se extrajeron de vuelta las diez órdenes y se compararon íntegramente con el delta histórico. El motor nativo aplicó ese lote en memoria a una copia de la V17. El documento completo resultante coincidió con la V18 de referencia, con huella `316c4585e022567ebf284152b90f67d9b35b24dc688d1c368e064d49b542b7c1`. Dos ejecuciones privadas produjeron la misma revisión y la misma prueba.

El inspector mantiene el borrador bloqueado mientras faltan reglas, maestros y derechos verificados en el registro de confianza. Las acciones históricas `addMedia`, `updateClip`, `addClip` y `setProject` quedan representadas en los parámetros del borrador, pendientes de un mapeo admitido por la lista de comandos del adaptador. La prueba en memoria comprueba fidelidad de representación. La aplicación de extremo a extremo por el Master Director y la exportación se verifican en sus puntos respectivos del roadmap.

E02, fase 3 de 5, punto 2 de 5. Comprobar disponibilidad, derechos, duración, cortes, pista y capacidad con los validadores existentes. Identificar por ID los bloqueos que impedirían aplicar una orden y fijar la comprobación del solape deliberado de V3.
