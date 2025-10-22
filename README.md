# Código Infarto · Fibrinólisis (TNK) · Planificador

Aplicación web estática (ready for GitHub Pages) para **calcular y guiar la fibrinólisis con Tenecteplasa (TNK)** en IAMCEST dentro de un **Código Infarto**, con coadyuvantes, ajustes por edad y función renal, y un **cronograma operativo**.

## Funciones clave
- Formulario de **datos del paciente** (edad, sexo, peso, TA, SatO₂, creatinina).
- Cálculo de **ClCr (Cockcroft–Gault)** y ajuste de anticoagulación.
- **Tenecteplasa (TNK)** por banda de peso, con opción de **½ dosis si ≥75 a** (según protocolo local).
- **Clopidogrel** (carga/omitir ≥75 a) y **ASA** (carga/mantenimiento).
- **Enoxaparina** con reglas por edad y ClCr; alternativa **UFH** (bolo + infusión).
- Alertas por **contraindicaciones**, embarazo/posparto y **SCAD**.
- **Cronograma** con tiempos (ahora, +15 min, +60–90 min, etc.).
- **Imprimir**/PDF y **exportar JSON** del plan.

> Esta app no sustituye el juicio clínico. Confirme siempre las dosis, concentraciones y protocolos institucionales.

## Despliegue en GitHub Pages
1. Crea un repositorio nuevo y sube estos archivos (`index.html`, `style.css`, `app.js`, `LICENSE` y `README.md`).  
2. En **Settings → Pages**, selecciona la rama (p. ej., `main`) y la carpeta raíz `/`.
3. Guarda y visita la URL que te genere GitHub Pages.

## Personalización rápida
- Edita **`app.js`** para modificar umbrales, textos o reglas locales (p. ej., política del bolo IV con ClCr <30 mL/min).
- El estilo se encuentra en **`style.css`** (tema claro/oscuro incluido).

## Seguridad y notas
- Tenecteplasa: bolo IV único (5–10 s) por banda de peso.
- ≥75 años: varias redes usan **½ dosis** en esquemas farmacoinvasivos (valida tu protocolo).
- Embarazo/posparto y **SCAD**: **evitar fibrinólisis**, preferir **PCI**.
- Enoxaparina: primeras 2 dosis capadas (100 mg si <75 a; 75 mg si ≥75 a). ClCr <30: **1 mg/kg cada 24 h**, evitar bolo IV.
- UFH alternativa: **60 U/kg (máx. 4000 U) bolo**, luego **12 U/kg/h (máx. 1000 U/h)**, ajustar por TTPa.

## Licencia
**MIT** — ver `LICENSE`.
