/*
 * CONFIGURACIÓN DE LA PÁGINA · nDay HPF
 * Es el único archivo que hay que editar para conectar la página con una planilla.
 *
 * API_URL: URL de la aplicación web de Apps Script (termina en /exec).
 *   - Vacía  → la página funciona en MODO DEMOSTRACIÓN (datos solo en el dispositivo).
 *   - Para pasar de la planilla personal a la del hospital: reemplazar esta URL
 *     por la nueva y guardar (commit). Todos los dispositivos toman el cambio solos.
 */
window.NDAY_CONFIG = {
  API_URL: '',

  // Logos: subir los archivos a la carpeta assets/ con estos nombres (PNG, fondo blanco o transparente).
  // Si un archivo no existe, simplemente no se muestra.
  LOGO_HOSPITAL: 'assets/logo-hospital.png',
  LOGO_NUTRICION: 'assets/logo-nutricion.png',

  // Texto opcional debajo del nombre del hospital en la pantalla de inicio.
  NOMBRE_SERVICIO: 'Programa de Nutrición'
};
