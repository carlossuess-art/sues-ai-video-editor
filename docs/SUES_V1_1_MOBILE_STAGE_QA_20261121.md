# SUES AI VIDEO EDITOR · Continuidad V1.1 · Bloque de preparación aislada 21/11/2026

## Estado de versiones
V1 NO CERRADA. Roadmap V1-2026-11-21-r16: Q03 en curso, Q04 aceptación funcional pendiente, Q05 despliegue inicial técnico hecho con cierre funcional pendiente, Q06 limpieza posterior. La limitación de Vista rápida es real: compone a tamaño original antes de reducir JPEG, por lo que 73s/106 clips sigue siendo lento y no hay render completo nuevo acreditado. No modificar render de máscaras sin paridad demostrada.

V1.1 únicamente PLANIFICADA, 0/10 módulos aceptados. El Roadmap contiene V1.1-01 a V1.1-10 y sus pruebas. Se adelantó un prototipo aislado del shell móvil en V1.1-01/02 sin desviar el punto activo de V1.

## Código implementado EN COPIA AISLADA
- VPS /opt/sues-video-setup/v1_1-mobile-20261121/stage, datos QA en /opt/sues-video-setup/v1_1-mobile-20261121/qa-data, servidor solo 127.0.0.1:17899 durante pruebas.
- La copia conserva app.js SHA256 d68028065f4b9c5155c4405081291cd310ad8b3a5ae7bb29b68cf10f9eff8a8f, style.css SHA256 723b68f0a93437576282440b2823e7f74df1f5e0a19f39906151386d973155d4. Coinciden con producción.
- Nuevos CSS y JS mobile-only: ops/fablecut/mobile-v1_1/sues-mobile.css y sues-mobile.js. Barra inferior navega al bin/inspector/mixer/transcripción ORIGINALES; monitor visible y timeline bajo en la hoja de estilos móvil. Estilos de escritorio intactos.
- index.html modificado SOLO EN STAGE para importar ambos archivos. Fuente/explicación en ops/fablecut/mobile-v1_1/README.md.
- Ningún código de V1.1 desplegado ni activado en producción; tampoco se modificaron proyectos, rollbacks, WAC, V29 o SUES Editor público.

## Pruebas y bloqueos
- node --test /opt/sues-video-setup/v1_1-mobile-20261121/qa-mobile-shell.test.cjs: 2 PASS/0 FAIL (DOM simulado, no navegador).
- node --test test/keyframes.test.js test/export-jobs.test.js test/captions.test.js en stage: 56 PASS/0 FAIL/0 SKIP (log /opt/sues-video-setup/v1_1-mobile-20261121/regression.log).
- El servidor de QA devolvió HTTP200. Chromium headless 155 falló al leer DOM de la aplicación; Chrome headless-shell 152 agotó 20s / renderer destroyed; segunda prueba de fixture ligero con CSS devolvió RC153. Ninguna captura y ningún test táctil de app real aprobado. No confundir pruebas unitarias con validación visual ni con aceptación Q04.
- No probado el buscador de herramientas, gesto de pellizco, orden de capas, subtítulos animados, máscaras o render end-to-end en este prototipo.

## Siguiente paso exacto
1) Mantener prioridad de V1 Q03/Q04/Q05 conforme Roadmap, sin reconstruir el Reel de prueba.
2) Para V1.1-01: estabilizar browser QA en entorno aislado; auditar menú→acción→modelo→render y capacidades existentes de timeline/touch/keyframes; probar el shell móvil en 390x844, 844x390 y desktop, monitor visible, panel real activado y cerrar; corregir hasta reproducible.
3) Solo después empezar V1.1-03 selección bidireccional y V1.1-04 timeline. No desplegar CSS/JS actualmente hasta QA real, export y regresión.
4) Al cerrar un ID actualizar Roadmap Maestro + Estado General misma revisión, PROJECT_STATUS.md y AGENTS.md si cambia operación; registrar SHA, pruebas y deploy.
