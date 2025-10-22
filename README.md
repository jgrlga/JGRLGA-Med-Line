# SinapsCore · Código Infarto · Fibrinólisis (TNK)

Web app estática (GitHub Pages) con **branding SinapsCore** y **modo “solo checklist”** para móvil/iPad. Calcula y guía la fibrinólisis con **Tenecteplasa (TNK)** en IAMCEST, incluyendo coadyuvantes, ajustes por edad/ClCr y un **cronograma** con casillas de verificación.

## Novedades
- ✅ **Branding SinapsCore** (título, tagline y colores oro/plata). Se puede ajustar logo y colores desde el botón **Brand**.
- ✅ **Modo “Solo Checklist”**: oculta formularios y texto no esencial, dejando un **checklist táctil** con tiempos y notas. Toggle con el botón **Checklist**. Persistente en `localStorage` y se activa por defecto en pantallas angostas.
- ✅ **Fuente Exo 2** y UI refinada.

## Despliegue
1. Sube estos archivos al repo (raíz): `index.html`, `style.css`, `app.js`, `sinapscore-logo-placeholder.svg`, `LICENSE`, `README.md`.
2. En **Settings → Pages**, habilita GitHub Pages desde la rama principal.
3. Abre la URL generada. (El estado y el branding se guardan en `localStorage` del navegador).

## Uso rápido
1. Rellena **Datos del paciente** y pulsa **Generar plan**.
2. Cambia a **Checklist** si estás en móvil/iPad.
3. Marca cada paso (ASA, TNK, anticoagulación, EKG 60–90 min, PCI 2–24 h). Puedes **Imprimir/PDF** o **Exportar JSON**.

> Nota: Esta herramienta es orientativa, no sustituye el juicio clínico ni los protocolos institucionales.


## PWA (opcional)
- Incluye `site.webmanifest` e íconos (`apple_touch_icon_180.png`, `pwa_icon_512.png`, `icon_1024.png`) y un `sw.js` básico para cache de primer uso.
- En iOS puedes **Agregar a la pantalla de inicio** para modo app.
