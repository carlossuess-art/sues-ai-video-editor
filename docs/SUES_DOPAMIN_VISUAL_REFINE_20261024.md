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
