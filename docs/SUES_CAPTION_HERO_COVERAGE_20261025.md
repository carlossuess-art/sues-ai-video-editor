# Cobertura literal del rótulo · corrección de revisión visual · 25/10/2026

El MP4 revisado mostraba RUNAS y EGO dos veces: caption superior y rótulo grande.
buildPreviewASS ahora conserva la palabra en el rótulo cuando éste representa exactamente
todos los tokens del caption y cubre todo su intervalo. Las frases parciales,
paráfrasis y solapamientos incompletos mantienen el caption. CALMA sin rótulos
maestros conserva su comportamiento. No se eliminan palabras de voz ni datos ASR.

Validación previa al despliegue: 17 pruebas dirigidas PASS. Sobre fotogramas del
bruto real, con ambos ASS y las mismas fuentes, la región superior pasa de
1.039 a 0 píxeles cálidos en RUNAS y de 701 a 0 en EGO; el rótulo conserva exactamente
4.251 y 4.478 píxeles cálidos, respectivamente. Ambos fotogramas corregidos se revisan
visualmente. Es una prueba de cobertura de texto, no aprobación del Reel completo.

La corrección nace de revisar el archivo renderizado. Un nuevo render completo
es necesario para incorporarla; los MP4 existentes permanecen intactos.