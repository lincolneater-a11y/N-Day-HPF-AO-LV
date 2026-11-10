/**
 * nDay HPF · Registro digital nutritionDay 2026
 * Hospital Papa Francisco (Salta)
 *
 * Aplicación web (Google Apps Script) vinculada a una planilla de Google Sheets.
 * Cada formulario guarda una fila por registro; si el registro ya existe
 * (misma unidad + mismo número de paciente) se actualiza en lugar de duplicarse.
 *
 * Instalación: ver "Manual de usuario". Resumen:
 *   1) Crear una planilla de Google nueva → Extensiones → Apps Script.
 *   2) Pegar este archivo (Code.gs). La interfaz está en GitHub Pages.
 *   3) Ejecutar la función  configurarPlanilla  una vez (autorizar).
 *   4) Completar la hoja "Config" (códigos y PIN).
 *   5) Implementar → Nueva implementación → Aplicación web (acceso: Cualquier usuario).
 *   6) Copiar la URL /exec en config.js del repositorio de GitHub.
 */

var HOJAS = {
  hospital: 'Hospital',
  unidad: 'Unidades_1a1b',
  pac2: 'Paciente_2a2b2c',
  pac3: 'Paciente_3a3b',
  seg: 'Seguimiento_30d',
  id: 'ID_PRIVADO'
};

/* ------------------------------------------------------------- API web */
/*
 * La interfaz vive en GitHub Pages y se comunica con esta API.
 * Implementar como Aplicación web → Ejecutar como: Yo → Acceso: Cualquier usuario.
 * (Con "Cualquier usuario con cuenta de Google" la página de GitHub NO puede conectarse.)
 */
var API_PUBLICA = {
  getConfig: function (a) { return getConfig(); },
  guardar: function (a) { return guardar(a[0], a[1], a[2]); },
  obtener: function (a) { return obtener(a[0], a[1], a[2]); },
  siguientePaciente: function (a) { return siguientePaciente(a[0]); },
  datosPanel: function (a) { return datosPanel(a[0]); },
  listaSeguimiento: function (a) { return listaSeguimiento(a[0]); }
};

function responder_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ejecutar_(fn, args) {
  if (!Object.prototype.hasOwnProperty.call(API_PUBLICA, fn)) throw new Error('Función no permitida: ' + fn);
  return API_PUBLICA[fn](args || []);
}

/** POST {fn:"guardar", args:[...]}  (Content-Type: text/plain para evitar CORS preflight) */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    return responder_({ ok: true, data: ejecutar_(body.fn, body.args) });
  } catch (err) {
    return responder_({ ok: false, error: String(err && err.message || err) });
  }
}

/** GET de prueba: abrir la URL /exec en el navegador debe mostrar {"ok":true,...} */
function doGet(e) {
  try {
    var fn = (e && e.parameter && e.parameter.fn) || 'getConfig';
    if (fn !== 'getConfig') throw new Error('Por GET solo está disponible getConfig');
    return responder_({ ok: true, data: getConfig(), api: 'nDay HPF', version: 2 });
  } catch (err) {
    return responder_({ ok: false, error: String(err && err.message || err) });
  }
}

/* ------------------------------------------------- Configuración inicial */
/** Ejecutar UNA vez desde el editor de Apps Script. */
function configurarPlanilla() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = ss.getSheetByName('Config');
  if (!cfg) {
    cfg = ss.insertSheet('Config', 0);
    cfg.getRange(1, 1, 12, 3).setValues([
      ['Parámetro', 'Valor', 'Notas'],
      ['Nombre del hospital', 'Hospital Papa Francisco', ''],
      ['Código del Centro', '', 'Código asignado por nutritionDay'],
      ['Fecha nutritionDay', '2026-11-12', 'Formato AAAA-MM-DD'],
      ['PIN del panel', 'nday2026', 'CAMBIAR antes de compartir el enlace'],
      ['Unidad 1 · nombre', 'Clínica Médica', ''],
      ['Unidad 1 · código', '', 'Código de la Unidad (nutritionDay)'],
      ['Unidad 1 · tipo', 'medica', 'medica o quirurgica'],
      ['Unidad 2 · nombre', 'Cirugía', ''],
      ['Unidad 2 · código', '', 'Código de la Unidad (nutritionDay)'],
      ['Unidad 2 · tipo', 'quirurgica', 'medica o quirurgica'],
      ['Unidad 3 · nombre', '', 'Opcional: dejar vacío si no se usa']
    ]);
    cfg.getRange(13, 1, 2, 3).setValues([
      ['Unidad 3 · código', '', ''],
      ['Unidad 3 · tipo', '', 'medica o quirurgica']
    ]);
    cfg.getRange('A1:C1').setFontWeight('bold').setBackground('#1F2A44').setFontColor('#ffffff');
    cfg.setColumnWidth(1, 200); cfg.setColumnWidth(2, 220); cfg.setColumnWidth(3, 320);
    cfg.getRange('B4').setNumberFormat('@');
  }
  Object.keys(HOJAS).forEach(function (k) {
    var sh = ss.getSheetByName(HOJAS[k]);
    if (!sh) {
      sh = ss.insertSheet(HOJAS[k]);
      var base = (k === 'hospital') ? ['_clave', '_actualizado'] :
                 (k === 'unidad')   ? ['_clave', '_actualizado'] :
                 ['_clave', '_actualizado', 'Unidad', 'Paciente N°'];
      if (k === 'id') base = ['_clave', '_actualizado', 'Unidad', 'Paciente N°', 'DNI', 'Cama / habitación', 'Fecha nDay'];
      sh.getRange(1, 1, 1, base.length).setValues([base]);
      sh.getRange(1, 1, 1, base.length).setFontWeight('bold').setBackground('#0F7C7C').setFontColor('#ffffff');
      sh.setFrozenRows(1);
    }
  });
  // Proteger la hoja de identificación: solo el propietario puede editarla manualmente
  var idSh = ss.getSheetByName(HOJAS.id);
  idSh.getRange('A1').setNote('Datos identificatorios de uso LOCAL. No se envían a nutritionDay. No compartir esta planilla fuera del equipo.');
  var prot = idSh.protect().setDescription('Datos identificatorios – uso local');
  prot.removeEditors(prot.getEditors());
  if (prot.canDomainEdit()) prot.setDomainEdit(false);
  idSh.hideSheet();
  SpreadsheetApp.flush();
  return 'Listo. Completá la hoja Config y luego implementá la aplicación web.';
}

/* ------------------------------------------------------------- Utilidades */
function leerConfig_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config');
  if (!sh) throw new Error('Falta la hoja Config. Ejecutá configurarPlanilla().');
  var v = sh.getDataRange().getValues(), m = {};
  v.forEach(function (r) { m[String(r[0]).trim()] = r[1]; });
  var fecha = m['Fecha nutritionDay'];
  if (fecha instanceof Date) fecha = Utilities.formatDate(fecha, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var unidades = [];
  for (var i = 1; i <= 3; i++) {
    var n = String(m['Unidad ' + i + ' · nombre'] || '').trim();
    if (n) unidades.push({
      nombre: n,
      codigo: String(m['Unidad ' + i + ' · código'] || '').trim(),
      tipo: String(m['Unidad ' + i + ' · tipo'] || 'medica').trim().toLowerCase()
    });
  }
  return {
    hospital: String(m['Nombre del hospital'] || ''),
    centro: String(m['Código del Centro'] || ''),
    fecha: String(fecha || ''),
    unidades: unidades,
    _pin: String(m['PIN del panel'] || '')
  };
}

function getConfig() {
  var c = leerConfig_();
  delete c._pin;
  return c;
}

function checkPin_(pin) {
  var c = leerConfig_();
  if (!c._pin || String(pin) !== c._pin) throw new Error('PIN incorrecto');
}

function limpiar_(v) {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) v = v.join(' | ');
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  var s = String(v);
  if (/^-?\d+([.,]\d+)?$/.test(s)) return Number(s.replace(',', '.'));
  // Texto como "1/2", "1-2" o "2026-11-12" se guarda como texto para que Sheets
  // no lo convierta en fecha; y se evita la inyección de fórmulas (= + - @).
  if (/^[\d\s\/\-.:]+$/.test(s) || /^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function aTexto_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return v;
}

function hoja_(tipo) {
  if (!HOJAS[tipo]) throw new Error('Tipo de registro desconocido: ' + tipo);
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJAS[tipo]);
  if (!sh) throw new Error('Falta la hoja ' + HOJAS[tipo] + '. Ejecutá configurarPlanilla().');
  return sh;
}

function upsert_(sh, clave, rec) {
  var lastCol = Math.max(sh.getLastColumn(), 1);
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  var nuevos = Object.keys(rec).filter(function (k) { return headers.indexOf(k) < 0; });
  if (nuevos.length) {
    sh.getRange(1, headers.length + 1, 1, nuevos.length).setValues([nuevos])
      .setFontWeight('bold').setBackground('#0F7C7C').setFontColor('#ffffff');
    headers = headers.concat(nuevos);
  }
  var fila = -1, last = sh.getLastRow();
  if (last > 1) {
    var claves = sh.getRange(2, 1, last - 1, 1).getValues();
    for (var i = 0; i < claves.length; i++) if (String(claves[i][0]) === clave) { fila = i + 2; break; }
  }
  rec._clave = clave;
  rec._actualizado = new Date();
  var actual = fila > 0 ? sh.getRange(fila, 1, 1, headers.length).getValues()[0] : headers.map(function () { return ''; });
  var row = headers.map(function (h, i) {
    return Object.prototype.hasOwnProperty.call(rec, h) ? (h === '_actualizado' ? rec[h] : limpiar_(rec[h])) : actual[i];
  });
  if (fila > 0) sh.getRange(fila, 1, 1, row.length).setValues([row]);
  else sh.appendRow(row);
  return fila > 0;
}

function claveDe_(tipo, rec) {
  if (tipo === 'hospital') return 'HOSPITAL';
  if (tipo === 'unidad') return 'U|' + rec['Unidad'];
  return rec['Unidad'] + '|' + rec['Paciente N°'];
}

/* ------------------------------------------------------- API para la app */
/**
 * Guarda (o actualiza) un registro.
 * @param {string} tipo  hospital | unidad | pac2 | pac3 | seg
 * @param {Object} rec   columnas → valores
 * @param {Object} ident (opcional) {dni, cama} → hoja ID_PRIVADO
 */
function guardar(tipo, rec, ident) {
  if (tipo === 'id') throw new Error('No permitido');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var clave = claveDe_(tipo, rec);
    if (tipo !== 'hospital' && !rec['Unidad']) throw new Error('Falta la unidad');
    if ((tipo === 'pac2' || tipo === 'pac3' || tipo === 'seg') && !rec['Paciente N°']) throw new Error('Falta el número de paciente');
    var actualizado = upsert_(hoja_(tipo), clave, rec);
    if (ident && (ident.dni || ident.cama)) {
      upsert_(hoja_('id'), clave, {
        'Unidad': rec['Unidad'], 'Paciente N°': rec['Paciente N°'],
        'DNI': ident.dni ? String(ident.dni).replace(/\D/g, '') : '',
        'Cama / habitación': ident.cama || '',
        'Fecha nDay': rec['Fecha'] || leerConfig_().fecha
      });
    }
    return { ok: true, actualizado: actualizado, clave: clave };
  } finally {
    lock.releaseLock();
  }
}

function filas_(tipo) {
  var sh = hoja_(tipo), v = sh.getDataRange().getValues();
  if (v.length < 2) return [];
  var h = v[0].map(String);
  return v.slice(1).filter(function (r) { return r[0] !== ''; }).map(function (r) {
    var o = {};
    h.forEach(function (k, i) { o[k] = aTexto_(r[i]); });
    return o;
  });
}

/** Devuelve un registro existente para corregirlo (sin datos identificatorios). */
function obtener(tipo, unidad, paciente) {
  if (tipo === 'id') throw new Error('No permitido');
  var clave = tipo === 'hospital' ? 'HOSPITAL' : tipo === 'unidad' ? 'U|' + unidad : unidad + '|' + paciente;
  var f = filas_(tipo).filter(function (o) { return String(o._clave) === clave; });
  return f.length ? f[0] : null;
}

/** Sugiere el siguiente número de paciente para una unidad. */
function siguientePaciente(unidad) {
  var max = 0;
  filas_('pac2').forEach(function (o) {
    if (o['Unidad'] === unidad) {
      var n = parseInt(String(o['Paciente N°']).replace(/\D/g, ''), 10);
      if (n > max) max = n;
    }
  });
  return max + 1;
}

/** Datos para el panel (requiere PIN). No incluye la hoja ID_PRIVADO. */
function datosPanel(pin) {
  checkPin_(pin);
  return {
    config: getConfig(),
    hospital: filas_('hospital'),
    unidad: filas_('unidad'),
    pac2: filas_('pac2'),
    pac3: filas_('pac3'),
    seg: filas_('seg')
  };
}

/** Lista de seguimiento a 30 días con DNI (requiere PIN). */
function listaSeguimiento(pin) {
  checkPin_(pin);
  var ids = {}, segs = {};
  filas_('id').forEach(function (o) { ids[o._clave] = o; });
  filas_('seg').forEach(function (o) { segs[o._clave] = o; });
  return filas_('pac2').map(function (o) {
    var i = ids[o._clave] || {};
    return {
      unidad: o['Unidad'], paciente: o['Paciente N°'],
      consentimiento: o['Consentimiento informado'] || '',
      dni: i['DNI'] || '', cama: i['Cama / habitación'] || '',
      fecha: o['Fecha'] || '', cargado: !!segs[o._clave]
    };
  });
}
