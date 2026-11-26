# SUES · Biblioteca IL · checkpoint de investigación 26/11/2026

Estado: **fuentes y parámetros originales recuperados; NO integrados, NO instalados, NO probados en vídeo.** Mantener edición actual y producción intactas.

## Decisión funcional
IL (Iluminación) es independiente de CE (Color Emocional); familia VFX dorado translúcido con borde dorado intenso. Selección por preset de un toque, duración predeterminada ajustable, aplicación a tramo/clip/todo el vídeo, intensidad opcional y cambios inmediatos o progresivos. CE incluye blanco y negro además de los 18 LUTs Creator Club. MR = Máscara Roll. Reutilizar editor, máscaras y motor actuales; no instalar un segundo editor ni modelos generativos por defecto. Proteger texto y gráficos.

## ReLight: ocho presets originales
Origen: https://github.com/EnragedAntelope/comfyui-relight
Fuente: https://github.com/EnragedAntelope/comfyui-relight/blob/main/relight.py
Blob SHA: 991f6f0af25241cdc16e960ad686c2c06de86449
Licencia: MIT, ver texto íntegro abajo, blob 94660a9ba3131908dececfdef9937f9cdaaeeaeb.
Parámetros originales extraídos del código; se conserva el bloque completo sin ejecutar código de terceros. No confundir con un contrato FableCut.

| Original | Etiqueta SUES |
|---|---|
| Soft Window Light | Luz suave de ventana |
| Dramatic Side Light | Lateral izquierda |
| Warm Sunset Glow | Golden Hour |
| Cool Blue Moonlight | Luz de luna |
| Studio Key Light | Luz de estudio |
| Rim Light (Behind) | Contraluz de contorno |
| Spotlight | Foco dirigido |
| Negative Light (Darken) | Oscurecimiento selectivo |

Variante propuesta lateral derecha: espejo horizontal x=1-x de Dramatic Side Light. Superior/frontal y Rembrandt pendientes de diseño/validación, no atribuir al catálogo original. El efecto es simulación espacial con máscaras y corrección de color, no reconstrucción física 3D de la cara. Contraluz requiere máscara. Preservar semántica de defaults, modos, gamma, escala de intensidad y composición del original al adaptar. Verificar equivalencia preview/export, continuidad entre frames, máscaras, piel, clipping, latencia y memoria en VPS 1 vCPU / 4 GB antes de aprobar. No desplegar.

## Fuentes adicionales
- https://daedal.art/resources/optical-flares-and-light-fx-pack/ y https://daedal.art/resources/light-leaks-and-burns-pack/ : overlays, no reluminación; licencia declarada CC0 en https://daedal.art/terms/ . Revisar biblioteca Creator Club antes de descargar.
- https://daedal.art/resources/film-and-mono-pack/ : LUTs de película y monocromo CC0; candidato CE blanco y negro, todavía no descargado.
- https://github.com/anshulsubramanian/Video-Relighting : alternativa neural direccional, CPU lenta según README, requiere modelos y comprobar licencias de componentes; no instalar.

## Bloque fuente original (MIT)
```python
    MODE_CORRECTION = "Color Correction"
    MODE_BOTH = "Both"
    SHAPE_RADIAL = "Radial falloff"
    SHAPE_GRADIENT = "Directional gradient"
    SUBJECT_NONE = "None"
    SUBJECT_RIM = "Light behind subject (rim)"

    PRESETS = {
        "None": {},
        "Soft Window Light": {
            "light_position_x": 0.7, "light_position_y": 0.3, "inner_circle_radius": 0.45, "outer_circle_radius": 0.8,
            "inner_brightness": 10, "inner_contrast": 0, "inner_saturation": 0, "inner_temperature": -5, "inner_tint": 0, "inner_gamma": 1.0,
            "outer_brightness": -15, "outer_contrast": 0, "outer_saturation": -10, "outer_temperature": -5, "outer_tint": 0, "outer_gamma": 0.83,
            "mask_blur": 80, "rim_amplification": 1.0
        },
        "Dramatic Side Light": {
            "light_position_x": 0.1, "light_position_y": 0.5, "inner_circle_radius": 0.3, "outer_circle_radius": 0.6,
            "inner_brightness": 15, "inner_contrast": 10, "inner_saturation": 10, "inner_temperature": 0, "inner_tint": 0, "inner_gamma": 1.11,
            "outer_brightness": -30, "outer_contrast": 10, "outer_saturation": -20, "outer_temperature": 0, "outer_tint": 0, "outer_gamma": 0.77,
            "mask_blur": 50, "rim_amplification": 1.0
        },
        "Warm Sunset Glow": {
            "light_position_x": 0.9, "light_position_y": 0.4, "inner_circle_radius": 0.5, "outer_circle_radius": 0.8,
            "inner_brightness": 3, "inner_contrast": 5, "inner_saturation": 10, "inner_temperature": 25, "inner_tint": -5, "inner_gamma": 1.05,
            "outer_brightness": -10, "outer_contrast": 0, "outer_saturation": -5, "outer_temperature": 15, "outer_tint": -5, "outer_gamma": 0.91,
            "mask_blur": 75, "lighting_mode": MODE_BOTH, "light_color_r": 255, "light_color_g": 200, "light_color_b": 120,
            "light_intensity": 0.45, "rim_amplification": 1.0, "mask_shape": SHAPE_GRADIENT
        },
        "Cool Blue Moonlight": {
            "light_position_x": 0.8, "light_position_y": 0.2, "inner_circle_radius": 0.4, "outer_circle_radius": 0.7,
            "inner_brightness": -5, "inner_contrast": 5, "inner_saturation": -5, "inner_temperature": -20, "inner_tint": 0, "inner_gamma": 0.91,
            "outer_brightness": -20, "outer_contrast": 0, "outer_saturation": -10, "outer_temperature": -30, "outer_tint": 0, "outer_gamma": 0.83,
            "mask_blur": 60, "lighting_mode": MODE_BOTH, "light_color_r": 120, "light_color_g": 150, "light_color_b": 255,
            "light_intensity": 0.35, "rim_amplification": 1.0
        },
        "Studio Key Light": {
            "light_position_x": 0.4, "light_position_y": 0.3, "inner_circle_radius": 0.6, "outer_circle_radius": 0.9,
            "inner_brightness": 12, "inner_contrast": 5, "inner_saturation": 0, "inner_temperature": 0, "inner_tint": 0, "inner_gamma": 1.0,
            "outer_brightness": -5, "outer_contrast": 0, "outer_saturation": -5, "outer_temperature": 0, "outer_tint": 0, "outer_gamma": 0.91,
            "mask_blur": 90, "rim_amplification": 1.0
        },
        "Rim Light (Behind)": {
            "light_position_x": 0.5, "light_position_y": 0.1, "inner_circle_radius": 0.3, "outer_circle_radius": 0.6,
            "subject_interaction": SUBJECT_RIM, "lighting_mode": MODE_BOTH,
            # Neutral white. This shipped as (200, 255, 200) from v1.0, which put a
            # +20/255 green cast on the rim and the background glow - invisible while
            # the grading block was being discarded, obvious once inner_saturation
            # landed. Intensity drops 1.2 -> 1.0 so removing the tint does not also
            # make the preset brighter: mean lift stays within 2% of what shipped.
            "light_color_r": 255, "light_color_g": 255, "light_color_b": 255, "light_intensity": 1.0,
            "inner_brightness": 0, "inner_contrast": 8, "inner_saturation": 12, "inner_temperature": 0, "inner_tint": 0, "inner_gamma": 1.0,
            "outer_brightness": 0, "outer_contrast": 0, "outer_saturation": 0, "outer_temperature": 0, "outer_tint": 0, "outer_gamma": 1.0,
            "mask_blur": 25, "effect_strength": 1.5, "rim_amplification": 2.5,
            "shadow_strength": 0.7, "shadow_length": 0.45
        },
        "Spotlight": {
            "light_position_x": 0.5, "light_position_y": 0.4, "inner_circle_radius": 0.1, "outer_circle_radius": 0.25,
            "inner_brightness": 25, "inner_contrast": 15, "inner_saturation": -5, "inner_temperature": 0, "inner_tint": 0, "inner_gamma": 1.11,
            "outer_brightness": -40, "outer_contrast": 10, "outer_saturation": -20, "outer_temperature": 0, "outer_tint": 0, "outer_gamma": 0.77,
            "mask_blur": 30, "rim_amplification": 1.0, "effect_strength": 1.2
        },
        "Negative Light (Darken)": {
            "light_position_x": 0.5, "light_position_y": 0.5, "inner_circle_radius": 0.4, "outer_circle_radius": 0.7,
            "inner_brightness": -20, "inner_contrast": 5, "inner_saturation": -5, "inner_temperature": 0, "inner_tint": 0, "inner_gamma": 0.91,
            "outer_brightness": 0, "outer_contrast": 0, "outer_saturation": 0, "outer_temperature": 0, "outer_tint": 0, "outer_gamma": 1.0,
            "mask_blur": 60, "rim_amplification": 1.0, "effect_strength": 1.0
        }
    }
```

## Licencia original
```text
MIT License

Copyright (c) 2025 EnragedAntelope

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

```
