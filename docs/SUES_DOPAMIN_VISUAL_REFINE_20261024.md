# DOPAMIN: revisión visual del maestro y prueba con otro original

Base de producción auditada: b3e0a7ae34c84266c6df0249a77b6fe82289cb7e.
Trabajo aislado: feat/dopamin-visual-refine-20261024; no se altera el worktree previo.

## Hallazgos y cambios

La hoja de contacto del MP4 maestro 0954702a mostró VOLVEMOS como caption,
texto detrás de cabeza y rótulo inferior simultáneos. El rótulo inferior redundante
se suprime cuando existe un contorno revisado del mismo texto y tiempo; los
captions de voz se conservan. Los demás gráficos crecen de 132 a hasta 190 unidades
ASS, ajustando el ancho mediante las métricas Montserrat y manteniendo zona segura.
MIEDO y BLOQUEO ya no se rotulan EGO. Atención admite atentos/atentas: el segundo
original real de 13,4102 s contenía «atentos» y no recibía el gráfico PRESENTE.

## Evidencia y límites

Pruebas específicas 9/9 PASS en runtime FFmpeg del VPS; Git/despliegue 2/2 PASS
en host. El fallo de la suite anterior era Git ausente en la imagen, reproducido
como spawn.status=null; no era una corrupción del vídeo ni un fallo visual.
No se oculta el resultado original 324/325 ni se declara toda la suite verde.

QA privada fuera de Git: dopamin-master-qa-20261024/refine-focused-v2.log,
refine-host-git-tests.log, refine-check-v2.log. Nuevo render completo en refine-v1;
registrar decodificación y fotogramas antes de declarar aceptación técnica.
Segundo original preparado desde ASR existente y ajustes DOPAMIN del flujo de UI,
sin rótulos, máscaras, cortes ni tiempos copiados del maestro. Su ASR contiene
nombres mal reconocidos; no se corrigen por conjetura. Esto verifica preparación,
no que se haya vuelto a subir/transcrito hoy ni aceptación audiovisual.

Código y QA no equivalen a despliegue; verificar servicio-commit y HTTPS al publicar.
F6/F7/F9 abiertas, global oficial 48%; no cierre V1 ni aceptación creativa/audio.
No APIs de pago ni nuevos modelos/proveedores. Roadmap Drive no actualizado:
los métodos fetch/get_document_text anunciados devolvieron Unknown tool.


## Resultado verificado del bloque

Código 71fa366b4e6c200f45a371d60f95e41b91d5f794 instalado con backup SHA256
12fcf90f6490240290eb75c198efe687a10e0a364238a1f6cb6296a673846cb4;
rollback update-backup-20261024-181655-165228. Whisper activo y servicio disponible.
Pruebas de integración 13/13 PASS; Git host 2/2 PASS; sintaxis/diff PASS.
Maestro revisado completo: 68,633333 s, 32.560.708 bytes, SHA256
81f4ef4820280ec8ae25fd9c93b74bda418dce6e054e7d690bb0374369170132.
Decodificación completa PASS; original preservado. Se revisan 35 muestras de hoja
de contacto y seis frames finales, además de seis muestras ASS. No escucha subjetiva.

Segundo original: job eb2ca2a7-a8b8-472f-b0b4-63947a722668, 13,4102 s;
flujo API de producción, sin overrides específicos del maestro, DONE y exportación
idéntica por SHA256: edbe7101bd2ecf7d661d888769ecb00d508d04d08cf4d6018446a16ed2711bd9,
12.895.862 bytes. Original preservado/fullDecode pass. 19 captions, un gráfico,
una transición, tres SFX y música; cero cortes/zooms. Demuestra flujo técnico,
no intensidad cinematográfica general ni nueva ingesta/ASR hoy. Nombres del ASR
siguen requiriendo corrección humana.

La revisión final encuentra además un borde duro en la mitad inferior de overlays.
Nuevo feather de alpha en los 240px superiores del recurso elimina el salto en su
entrada. Cuatro pruebas de overlays PASS, incluida medición alpha del filtro
realmente compilado (0/128/255 a filas 0/120/240). Muestras reales de esa etapa
hard/soft fuera de Git. Esta corrección adicional requiere nuevo render para
aparecer en un MP4; el maestro completo y el segundo job anteriores NO la incluyen.
No afirmar que esos archivos se actualizan al desplegar código. No cierre F9.
