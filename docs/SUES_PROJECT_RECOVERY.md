# Recuperar proyectos desde la app · 19/10/2026

La app admite recuperar una copia SUES `.tar` desde «Tu material → Recuperar un
proyecto guardado». Incluye original, transcripción, cámara, visión, fuentes,
imágenes/música seleccionadas y ajustes. Crea un trabajo nuevo preparado para
exportar; no vuelve a transcribir, analizar ni descargar modelos. Los trabajos
previos permanecen intactos. No reanuda un render interrumpido ni conserva su
aceptación estética: hay que revisar la nueva exportación.

## Flujo

1. Elegir la copia TAR y pulsar «Recuperar proyecto».
2. Esperar subida y comprobación; se muestra progreso real de bytes. La fase de
   validación posterior no inventa un porcentaje.
3. Revisar el montaje recuperado y exportarlo. Repetir la misma copia reutiliza
   almacenamiento y el trabajo del perfil; no genera otro trabajo duplicado.

Hasta 512 MiB por TAR y cuatro proyectos recuperados. Los vídeos nuevos sin
análisis siguen pendientes: este flujo recupera datos existentes, no añade ASR,
visión automática, segmentación corporal ni Director LLM.

## Contrato y validación

POST /api/recoveries exige sesión, Host/Origin permitidos e intención de edición
antes de recibir bytes. Admite TAR sin compresión, longitud acotada, espacio libre
y una recuperación activa. Staging privado con limpieza tras fallo/desconexión.
Extractor Python sólo acepta archivos regulares y directorios; prohíbe links,
traversal, dispositivos, FIFO, sparse, duplicados y rutas ambiguas. Límite de150
entradas, 512 MiB expandidos y8 MiB por JSON. Verificación posterior exige hashes,
manifest íntegro, archivos declarados y configuración que no salga de la copia.
El motor valida el proyecto/ajustes antes de registrar el perfil. Al reiniciar se
verifican las copias antes de habilitar sus perfiles. No existe autenticación
multiusuario ni cifrado adicional del disco.

GET /api/recoveries no devuelve rutas locales. Los perfiles recuperados muestran
su título; la vista Brand Kit se actualiza al cambiar de trabajo. SFX y el resto
de ajustes no se pueden cambiar en un trabajo que no sea editable. Estados en
español; la caché del shell se actualiza a v5, sin almacenar vídeos ni tokens.

Una copia de otro motor puede producir una exportación distinta. Se conserva su
codeCommit/workingTreeDirty de origen; no se promete identidad visual entre
versiones. La prueba siguiente compara el mismo motor y los mismos datos.

## Evidencia

- 199 pruebas Node y npm run check pasan.
- Cinco pruebas Python del extractor; diez del despliegue simulado, incluido el
  actualizador y el procedimiento HTTPS anterior. No Docker real en Work.
- Smoke real con grabación deCarlos38,31s: estadoDONE,75/75palabras,31captions,
  dos acercamientos, tres motions y tres transiciones, un intento, fuente intacta,
  decodificación íntegra y descarga Range206/1024bytes.
- ASS y filtro coinciden antes/después de restaurar. Reintento y reinicio conservan
  trabajo y recursos. Cuatro fotogramas revisados:4,14,18,5 y25s; sin reproducción
  humana completa ni aceptación nueva.
- Vídeo SHA686105e194b34a9ff050dbeb79a3ee5726767148e534b37eeb4ffa0aca905277.
- Copia108.625.920bytes, SHA2a659a1511bc3673b9374c7fb73fc82dfa5a5b0aae2f716b13ac7de8b70e612c.
  Archivo privado SUES_PROYECTO_RECUPERABLE.tar, Library
  libfile_edcad6d1230c8191ad58668614741a3e versión0. No medios privados en Git.
- Sin nuevas llamadas de pago/ASR/inferencia. El navegador local no estaba
  disponible: descargaChromium falló por archivo incompleto y se detuvo. QA visual
  de la nueva interfaz e instalaciónPWA pendientes; capturas anteriores sólo
  acreditan acceso a la versión del VPS anterior.

Reproducir sin nuevas inferencias:

```
node --test tests/project-recovery.test.js tests/project-backup.test.js
python3 -m unittest discover -s scripts/backup -p test_extract_private_project.py
node scripts/app/smoke_recovery_real.mjs PROJECT.json SETTINGS.json NEW_DIRECTORY
```

La receta prepare_voice_motion_scene.mjs permite generar la entrada privada desde
la grabación ya analizada. El smoke produce TAR, exportación y result.json en un
directorio privado; no publicar contenido ni rutas personales.

## Actualizar el VPS

scripts/deploy/update_service.py COMMIT40 obtiene un checkout separado del commit
exacto. Rechaza cambios de dependencias y trabajos activos. Conserva imagen fijada
porID, dependencias, estado/token y origenHTTPS. Doctor aislado antes del reinicio;
crea el destino del montaje anidado node_modules antes de usar raíz de sólo lectura.
Mantiene el contenedor previo detenido; comprueba salud/autenticación/HTTPS de la
nueva instancia e intenta recuperar la anterior ante fallo. No administra Caddy,
WhatsApp ni DNS, no hacepull/build/npm install y no borra material.

Preparado y probado con simulación: todavía no ejecutado en el VPS. Allí siguen
motorba972 yHTTPS verificado porCarlos; no afirmar recuperación/exportaciónVPS.
F6, DirectorLLM, análisis de nuevos vídeos y aceptación global siguen abiertos.
