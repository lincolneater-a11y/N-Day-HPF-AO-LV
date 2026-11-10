# nDay HPF · Registro digital nutritionDay 2026

Página web instalable (PWA) para registrar los cuestionarios **nutritionDay en el Hospital** del
Hospital Papa Francisco (Salta) desde celular, tablet o computadora, sin papel.
Los datos se guardan en una **planilla de Google** a través de una pequeña API de Apps Script.

```
GitHub Pages (esta página)  ──►  Apps Script (apps-script/Code.gs)  ──►  Google Sheets
     interfaz + instalable           API: guarda y lee                    base de datos
```

> El repositorio **no contiene datos de pacientes**. Todo queda en la planilla de Google.

## Estructura

| Archivo | Para qué |
|---|---|
| `index.html` | La aplicación completa (formularios, panel, seguimiento) |
| `config.js` | **Único archivo a editar**: URL de la API y nombres de los logos |
| `manifest.webmanifest`, `sw.js`, `icons/` | Instalación en la pantalla de inicio y apertura sin señal |
| `assets/` | Logos del hospital y del servicio (`logo-hospital.png`, `logo-nutricion.png`) |
| `apps-script/Code.gs` | Código para pegar en Apps Script de la planilla (no lo usa GitHub) |

## Puesta en marcha (resumen)

1. **Planilla:** crear una hoja de cálculo de Google → Extensiones → Apps Script → pegar `apps-script/Code.gs` → ejecutar `configurarPlanilla` → completar la hoja *Config* (códigos y PIN).
2. **API:** Implementar → Nueva implementación → *Aplicación web* → Ejecutar como **Yo** → Acceso **Cualquier usuario** → copiar la URL `/exec`.
3. **Página:** pegar esa URL en `config.js` (`API_URL`), subir los logos a `assets/` y activar **Settings → Pages → Deploy from a branch → main / (root)**.
4. Abrir `https://<usuario>.github.io/<repositorio>/` en el celular → **Instalar acceso directo**.

Para pasar de la planilla personal a la del hospital: repetir los pasos 1–2 con la cuenta del hospital y reemplazar `API_URL` en `config.js`.

El paso a paso con capturas está en el **Manual de usuario**.

## Créditos y licencia de los cuestionarios

Preguntas basadas en los cuestionarios *nutritionDay en el Hospital* (2024 v1) © nutritionDay worldwide · ESPEN ·
Medical University of Vienna, licencia CC BY-NC-ND 4.0. Se reproducen sin modificar su contenido, con fines no comerciales,
como herramienta interna de captura de datos. Más información: https://www.nutritionday.org
