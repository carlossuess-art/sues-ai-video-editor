# F7 · Filtro contextual conservador de B-roll · 24/10/2026

**Estado:** implementado y probado en rama aislada `feat/dopamin-context-review-20261024`, **NO desplegado** ni fusionado en `main`. VPS de producción permanece en `051edfb74296592161f526b434872df1ffd56a4a`. No se editó ni se sustituyó el worktree pendiente `dopamin-audio-emphasis-20261024`.

## Error observado

El Director de sugerencias usaba coincidencia directa de cualquier token, reforzada por sinónimos, sin distinguir términos genéricos como «tiempo» o «luz». Sobre la transcripción de **68,6491 s / 165 palabras** del vídeo maestro, antes del parche proponía tres B-rolls en dos bloques: reloj por la expresión «Hacía tiempo ...» y de nuevo «tiempo volveremos...», y caminante hacia luz por la coincidencia lingüística **«hacía» = «hacia»** al eliminar acentos. Ninguna de estas coincidencias prueba pertinencia visual, y el reloj contiene texto visible ajeno en el metraje mostrado por QA.

## Corrección

- Amplía las palabras vacías en castellano de la búsqueda, en especial preposiciones como «hacia», junto con términos gramaticales ambiguos. Mantiene los sinónimos y la consulta manual.
- Añade `lexicalEvidence.exactTerms/expandedTerms` para que la interfaz y las pruebas puedan identificar qué coincidencias proceden de la locución y cuáles de una expansión de diccionario. El puntaje mantiene la ponderación anterior de 12 puntos por coincidencia literal frente a 2 por expansión.
- **Solo para recomendaciones de vídeo**: no propone material a pantalla completa con una sola coincidencia literal genérica (`tiempo`, `luz`, `camino`, etc.) ni solo con sinónimos. Acepta una coincidencia específica o al menos dos literales, siempre con `needsHumanReview:true`.
- No modifica la selección manual de medios, composiciones, exportaciones, la biblioteca, los originales, el motor CALMA, la música ni los SFX. Tampoco introduce visión, NLP profundo o un modelo IA nuevo. Se trata de una protección conservadora, no una acreditación de relevancia narrativa.

## Evidencia

Fixture: «Tenemos tiempo...» y «Ya veo la luz...» ya no sugieren vídeos; «Hacía tiempo que no pasaba...» no selecciona caminante por el falso cognado. «Siento presión del tiempo y estrés» sí propone reloj **solo para revisión** y «Estoy viviendo una transformación profunda» sí propone caminante **solo para revisión**. Contratos de sesión, privacidad y búsqueda protegidos.

Consulta real **solo lectura** sobre el índice privado y transcripción ya existentes del vídeo maestro: **antes: 2 bloques / 3 candidatos de vídeo; después: 0 bloques / 0 candidatos**. Un resultado vacío indica «no hay evidencia suficiente en este catálogo», **no** que el sistema pueda montar DOPAMIN automáticamente ni que el material histórico disponible sea inadecuado.

Pruebas: **9/9 PASS** en `director-context-filter`, `private-library-search`, `director-library-cues`, `director-library-http`, `private-library-http`; `npm run check` PASS y `git diff --check` PASS. No se usó API externa, Work, Lovable, IA de pago ni render nuevo. Gastos 0 €.

## Próximo paso

Tras publicación de la rama, revisión/merge dirigido con respaldo y preflight de cola antes de deploy. Más adelante integrar revisión de metraje (texto incrustado, logos, duración y pertinencia de escena) y clasificación de intención narrativa; **no basta** con el filtro de palabras. Mantener global oficial **48 %** y F6/F7/F9 abiertas. Reproducción completa y aprobación audiovisual de Carlos pendientes.
