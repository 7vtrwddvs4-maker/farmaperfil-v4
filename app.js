// ============================================================================
// 🚀 FARMAPERFIL v4.0 - MOTOR INTEGRAL FIRESTORE + CLÍNICA AVANZADA
// ============================================================================
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ============================================================================
// 1. VARIABLES GLOBALES Y DICCIONARIOS CLÍNICOS
// ============================================================================
window.datosGlobales = {};
window.medicosData = [];
window.sobredosisValidadas = new Set();
window.interaccionesValidadas = new Set();
window.alertasEmitidas = new Set();
window.medicamentosPendientes = {};
window.nuevosSaldosParaManana = {};

window.isCargandoPerfil = false;
window.isModoHistorico = false;
window.hayCambiosSinGuardar = false;
window.datosSincronizados = true;
window.temporizadorGuardado = null;
window.temporizadorNavegacionCama = null;

window.tipoAlertaActual = "";
window.filaAlertaActiva = null;
window.datosInteraccionActiva = null;
window.datosAlergiaActiva = null;

window.inputActivo = null;
window.opcionResaltadaIndex = -1;
window.accionGestionSeleccionada = "";

const PROTOCOLOS_RESTRINGIDOS = {
    // Cardiología / Diabetología / Nefrología
    "dapagliflozina": { especialidad: "Cardiología / Diabetología / Nefrología", medicos: ["Dr. Escobar", "Dr. Garibaldi", "Dr. Palma", "Dr. Sanhueza", "Dra. Bustamante", "Dra. Pulido", "Dr. Rodríguez"] },
    "empagliflozina": { especialidad: "Cardiología", medicos: ["Dr. Escobar", "Dr. Garibaldi", "Dr. Palma"] },
    "sacubitrilo": { especialidad: "Cardiología", medicos: ["Dr. Escobar", "Dr. Garibaldi", "Dr. Palma"] },
    "valsartán": { especialidad: "Cardiología", medicos: ["Dr. Escobar", "Dr. Garibaldi", "Dr. Palma"] },
    "valsartan": { especialidad: "Cardiología", medicos: ["Dr. Escobar", "Dr. Garibaldi", "Dr. Palma"] },
    "vildagliptina": { especialidad: "Cardiología / Diabetología", medicos: ["Dr. Escobar", "Dr. Garibaldi", "Dr. Palma", "Dr. Sanhueza"] },
    "linagliptina": { especialidad: "Diabetología", medicos: ["Dr. Sanhueza"] },
    // Psiquiatría
    "bupropion": { especialidad: "Psiquiatría", medicos: ["Equipo Psiquiatría"] },
    "aripiprazol": { especialidad: "Psiquiatría", medicos: ["Equipo Psiquiatría"] },
    "litio": { especialidad: "Psiquiatría", medicos: ["Equipo Psiquiatría"] },
    "citalopram": { especialidad: "Psiquiatría", medicos: ["Equipo Psiquiatría"] },
    "ziprasidona": { especialidad: "Psiquiatría", medicos: ["Equipo Psiquiatría"] },
    "clozapina": { especialidad: "Psiquiatría", medicos: ["Equipo Psiquiatría"] },
    "eszopiclona": { especialidad: "Psiquiatría", medicos: ["Equipo Psiquiatría"] },
    "fluoxetina": { especialidad: "Psiquiatría", medicos: ["Equipo Psiquiatría"] },
    "flupentixol": { especialidad: "Psiquiatría", medicos: ["Equipo Psiquiatría"] },
    "lamotrigina": { especialidad: "Psiquiatría", medicos: ["Equipo Psiquiatría"] },
    "mirtazapina": { especialidad: "Psiquiatría", medicos: ["Equipo Psiquiatría"] },
    "olanzapina": { especialidad: "Psiquiatría", medicos: ["Equipo Psiquiatría"] },
    "zuclopentixol": { especialidad: "Psiquiatría", medicos: ["Equipo Psiquiatría"] },
    "paroxetina": { especialidad: "Psiquiatría", medicos: ["Equipo Psiquiatría"] },
    "trihexifenidilo": { especialidad: "Psiquiatría", medicos: ["Equipo Psiquiatría"] },
    "venlafaxina": { especialidad: "Psiquiatría", medicos: ["Equipo Psiquiatría"] },
    "trazodona": { especialidad: "Psiquiatría", medicos: ["Equipo Psiquiatría"] },
    "risperidona": { especialidad: "Psiquiatría", medicos: ["Equipo Psiquiatría"] },
    // Dermatología
    "mometasona": { especialidad: "Dermatología", medicos: ["Equipo Dermatología"] },
    "clobetasol": { especialidad: "Dermatología", medicos: ["Equipo Dermatología"] },
    "mupirocina": { especialidad: "Dermatología", medicos: ["Equipo Dermatología"] },
    "hidrocortisona 1%": { especialidad: "Dermatología", medicos: ["Equipo Dermatología"] }
};

const DB_LIQUIDOS = { 
    "Amoxicilina 250 mg/5 mL": { mg: 250, ml: 5, total: 60 }, 
    "Amoxicilina 500 mg/5 mL": { mg: 500, ml: 5, total: 60 }, 
    "Ácido Ursodesoxicólico 250 mg/5 mL": { mg: 250, ml: 5, total: 200 }, 
    "Ácido Valproico 250 mg/5 mL": { mg: 250, ml: 5, total: 120 }, 
    "Azitromicina 200 mg/5 mL": { mg: 200, ml: 5, total: 30 }, 
    "Cefadroxilo 250 mg/5 mL": { mg: 250, ml: 5, total: 60 }, 
    "Levetiracetam 100 mg/mL": { mg: 100, ml: 1, total: 300 }, 
    "Paracetamol 120 mg/5 mL": { mg: 120, ml: 5, total: 60 }, 
    "Risperidona 1 mg/mL": { mg: 1, ml: 1, total: 30, gotas: "" },
    "N-Acetil-Cisteína 100 mg/mL": { mg: 100, ml: 1, total: 60 },
    "Sulfato Ferroso 125 mg/1 mL": { mg: 125, ml: 1, total: 30, gotas: "" },
    "Ferroso Sulfato 125 mg/mL": { mg: 125, ml: 1, total: 30, gotas: "" },
    "Sulfato de Zinc 5 mg/1 mL": { mg: 5, ml: 1, total: 30, gotas: "" },
    "Vitamina ACD 2500 UI/1 mL": { mg: 2500, ml: 1, total: 30, gotas: "" }, 
    "Tramadol 100 mg/1 mL": { mg: 100, ml: 1, total: 10, gotas: "" },
    "BioGaia (Probiótico)": { biogaia: true }
};

const CAMAS_URGENCIA_ADULTO = [
    "REA Camilla 1", "REA Camilla 2", "REA Camilla 3", "REA Camilla 4", "REA Camilla 5", "REA Camilla 6",
    "Proce 1", "Proce 2", "Proce 3", "Proce 4", "Proce 5", "Proce 6", "OH",
    "Camilla 1", "Camilla 2", "Camilla 3", "Camilla 4", "Camilla 5", "Camilla 6",
    "Pasillo Camilla 1", "Pasillo Camilla 2", "Pasillo Camilla 3", "Pasillo Camilla 4", "Pasillo Camilla 5", "Pasillo Camilla 6",
    "B4 Sillon 1", "B4 Sillon 2", "B4 Sillon 3", "B4 Sillon 4", "B1", "B2", "B3",
    "Sala Hidratación 1 Sillon 1", "Sala Hidratación 1 Sillon 2", "Sala Hidratación 1 Sillon 3", "Sala Hidratación 1 Sillon 4", "Sala Hidratación 1 Sillon 5", "Sala Hidratación 1 Sillon 6",
    "Sala Hidratación 2 Sillon 1", "Sala Hidratación 2 Sillon 2", "Sala Hidratación 2 Sillon 3", "Sala Hidratación 2 Sillon 4", "Sala Hidratación 2 Sillon 5",
    "Sala Hidratación 3 Sillon 1", "Sala Hidratación 3 Sillon 2", "Sala Hidratación 3 Sillon 3",
    "Sala Transitoria Cirugía Agudo Cama 25", "Sala Transitoria Cirugía Agudo Cama 26", "Sala Transitoria Cirugía Agudo Cama 27", "Sala Transitoria Cirugía Agudo Cama 28", "Sala Transitoria Cirugía Agudo Cama 29", "Sala Transitoria Cirugía Agudo Cama 30", "Sala Transitoria Cirugía Agudo Cama 31", "Sala Transitoria Cirugía Agudo Cama 32",
    "Hospitalización Box Urgencia Cama 5", "Hospitalización Box Urgencia Cama 6", "Hospitalización Box Urgencia Cama 7", "Hospitalización Box Urgencia Cama 8", "Hospitalización Box Urgencia Cama 9", "Hospitalización Box Urgencia Cama 10", "Hospitalización Box Urgencia Cama 11", "Hospitalización Box Urgencia Cama 12",
    "Sala 10 Cama 13", "Sala 10 Cama 14", "Sala 10 Cama 15", "Sala 10 Cama 16", "Sala 10 Cama 17", "Sala 10 Cama 18", "Sala 10 Cama 19", "Sala 10 Cama 20", "Sala 10 Cama 21", "Sala 10 Cama 22", "Sala 10 Cama 23", "Sala 10 Cama 24"
];

const mapaCamasHospital = {
    "medicina": { inicio: 1, fin: 40 },
    "cirugia": { inicio: 1, fin: 47 },
    "uci": { inicio: 1, fin: 17 },
    "uti": { inicio: 18, fin: 34 },
    "ucm": { inicio: 1, fin: 24 },
    "uce": { inicio: 1, fin: 34 },
    "pensionado": { inicio: 1, fin: 48 },
    "maternidad": { inicio: 1, fin: 42 },
    "pediatria": { inicio: 1, fin: 30 },
    "urgencia adulto hospitalizado": { personalizado: CAMAS_URGENCIA_ADULTO }
};

const dictDiagnosticos = {
    "hta": "Hipertensión Arterial",
    "dm2": "Diabetes Mellitus Tipo 2",
    "dm1": "Diabetes Mellitus Tipo 1",
    "acv": "Accidente Cerebrovascular",
    "epoc": "EPOC",
    "irc": "Insuficiencia Renal Crónica",
    "icc": "Insuficiencia Cardíaca Congestiva",
    "iam": "Infarto Agudo al Miocardio",
    "itu": "Infección del Tracto Urinario",
    "sifilis": "Sífilis",
    "neumonia": "Neumonía"
};

// ============================================================================
// 2. UTILIDADES DE INTERFAZ, RUT, TEMA Y CASILLAS (TICKS)
// ============================================================================
window.quitarTildes = function(texto) {
    return (texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

window.toggleTheme = function() {
    const isLight = document.body.classList.toggle("light-theme");
    const icon = document.getElementById("theme-icon");
    if (icon) icon.textContent = isLight ? "dark_mode" : "light_mode";
    localStorage.setItem("themePreference", isLight ? "light" : "dark");
    
    const themeMsg = { tema: isLight ? 'light' : 'dark' };
    const iframeCalc = document.getElementById('iframeCalculadora');
    if (iframeCalc && iframeCalc.contentWindow) iframeCalc.contentWindow.postMessage(themeMsg, '*');
    const iframeDesp = document.getElementById('iframeDespacho');
    if (iframeDesp && iframeDesp.contentWindow) iframeDesp.contentWindow.postMessage(themeMsg, '*');
};

window.validarRut = function(input) {
    if (!input) return;
    let valor = input.value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (valor.length < 2) {
        input.classList.remove("input-warning");
        return;
    }
    let cuerpo = valor.slice(0, -1);
    let dv = valor.slice(-1);
    input.value = cuerpo + "-" + dv;
    
    let suma = 0; let multiplo = 2;
    for (let i = 1; i <= cuerpo.length; i++) {
        let index = multiplo * valor.charAt(cuerpo.length - i);
        suma = suma + index;
        if (multiplo < 7) { multiplo = multiplo + 1; } else { multiplo = 2; }
    }
    let dvEsperado = 11 - (suma % 11);
    dvEsperado = (dvEsperado == 10) ? "K" : (dvEsperado == 11) ? "0" : dvEsperado.toString();
    
    if (dv !== dvEsperado) {
        input.classList.add("input-warning");
    } else {
        input.classList.remove("input-warning");
    }
};

window.toggleTick = function(btn) {
    const input = btn.previousElementSibling;
    if (!input || !input.value.trim()) return;
    
    if (btn.classList.contains("ticked")) {
        btn.classList.remove("ticked");
        delete input.dataset.manual; 
    } else {
        btn.classList.add("ticked");
        input.dataset.manual = "true"; 
    }
    input.dispatchEvent(new Event("change", { bubbles: true })); 
};

window.syncCheckUI = function(input) {
    if (!input) return;
    const btn = input.nextElementSibling;
    if (btn && btn.classList.contains("btn-check")) {
        if (input.value.includes("✓")) {
            btn.classList.add("ticked");
            input.dataset.manual = "true";
            input.value = input.value.replace("✓", "").trim(); 
        } else if (input.value.trim() === "") {
            btn.classList.remove("ticked");
            delete input.dataset.manual;
        }
    }
};

window.mostrarToastFarmacia = function(mensaje, titulo) {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.style.cssText = "position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;";
        document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.style.cssText = "background: rgba(30, 136, 229, 0.95); color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); font-size: 13px; font-weight: bold; opacity: 0; transform: translateY(20px); transition: all 0.3s ease; display: flex; flex-direction: column; gap: 4px; min-width: 250px;";
    toast.innerHTML = `<div style="font-size: 11px; text-transform: uppercase; opacity: 0.8; letter-spacing: 0.5px;">${titulo}</div><div>${mensaje}</div>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = "1"; toast.style.transform = "translateY(0)"; }, 10);
    setTimeout(() => { toast.style.opacity = "0"; toast.style.transform = "translateY(20px)"; setTimeout(() => toast.remove(), 300); }, 6000);
};

// ============================================================================
// 3. AUTENTICACIÓN, REGISTRO Y CONFIGURACIÓN MAESTRA (FIRESTORE)
// ============================================================================
window.intentarLogin = async function() {
    const rutInput = document.getElementById("loginRut").value.trim().toUpperCase();
    const pinInput = document.getElementById("loginPin").value.trim();
    const errorDiv = document.getElementById("loginError");
    const btn = document.getElementById("btnIngresar");

    if (!rutInput || !pinInput) {
        errorDiv.innerText = "⚠️ Por favor, complete su RUT y PIN.";
        errorDiv.style.display = "block";
        return;
    }

    btn.innerText = "VERIFICANDO EN LA NUBE...";
    btn.disabled = true;
    errorDiv.style.display = "none";

    try {
        const referenciaUsuario = doc(window.db, "usuarios", rutInput);
        const docSnap = await getDoc(referenciaUsuario);

        if (docSnap.exists()) {
            const datosUsuario = docSnap.data();
            if (String(datosUsuario.pin).trim() === pinInput) {
                sessionStorage.setItem("FarmaPerfil_Sesion", JSON.stringify(datosUsuario));
                document.getElementById("loginStepCredentials").style.display = "none";
                document.getElementById("welcomeUserName").innerText = `¡HOLA, ${datosUsuario.nombre}!`;
                document.getElementById("loginStepService").style.display = "block";
            } else {
                errorDiv.innerText = "❌ PIN de Seguridad incorrecto.";
                errorDiv.style.display = "block";
                btn.innerText = "INGRESAR AL SISTEMA";
                btn.disabled = false;
            }
        } else {
            errorDiv.innerText = "❌ Usuario no encontrado en la base de datos.";
            errorDiv.style.display = "block";
            btn.innerText = "INGRESAR AL SISTEMA";
            btn.disabled = false;
        }
    } catch (error) {
        console.error("Error crítico en login:", error);
        errorDiv.innerText = "❌ Error de conexión con los servidores de Google.";
        errorDiv.style.display = "block";
        btn.innerText = "INGRESAR AL SISTEMA";
        btn.disabled = false;
    }
};

window.mostrarRegistro = function() {
    document.getElementById("loginStepCredentials").style.display = "none";
    document.getElementById("loginStepRegister").style.display = "block";
    document.getElementById("regError").style.display = "none";
};

window.ocultarRegistro = function() {
    document.getElementById("loginStepRegister").style.display = "none";
    document.getElementById("loginStepCredentials").style.display = "block";
    document.getElementById("loginError").style.display = "none";
    document.getElementById("regNombre").value = "";
    document.getElementById("regRut").value = "";
    document.getElementById("regRol").value = "";
    document.getElementById("regPin").value = "";
};

window.olvidePin = function() {
    alert("🔒 SEGURIDAD CLÍNICA\n\nPor protocolos de seguridad, las contraseñas no pueden ser recuperadas de forma automática.\n\nSi olvidó su PIN de 4 dígitos, por favor contacte al Administrador del Sistema para verificar su identidad.");
};

window.ejecutarRegistro = async function() {
    const nombre = document.getElementById("regNombre").value.trim().toUpperCase();
    const rut = document.getElementById("regRut").value.trim().toUpperCase();
    const rol = document.getElementById("regRol").value;
    const pin = document.getElementById("regPin").value.trim();
    const errorDiv = document.getElementById("regError");
    const btn = document.getElementById("btnRegistrar");

    if (!nombre || !rut || !rol || !pin) {
        errorDiv.innerText = "⚠️ Por favor, complete todos los campos.";
        errorDiv.style.display = "block";
        return;
    }
    if (pin.length !== 4) {
        errorDiv.innerText = "⚠️ El PIN debe tener exactamente 4 números.";
        errorDiv.style.display = "block";
        return;
    }
    if (rut.length < 8 || !rut.includes("-")) {
        errorDiv.innerText = "⚠️ Ingrese un RUT válido con guion.";
        errorDiv.style.display = "block";
        return;
    }

    errorDiv.style.display = "none";
    btn.innerText = "REGISTRANDO...";
    btn.disabled = true;

    try {
        const refUser = doc(window.db, "usuarios", rut);
        const snap = await getDoc(refUser);
        if (snap.exists()) {
            errorDiv.innerText = "⚠️ Este RUT ya tiene una cuenta registrada.";
            errorDiv.style.display = "block";
            btn.innerText = "CREAR CUENTA";
            btn.disabled = false;
            return;
        }
        await setDoc(refUser, { nombre, rut, rol, pin, fechaCreacion: new Date().toISOString() });
        alert("✅ Cuenta creada exitosamente.");
        window.ocultarRegistro();
        document.getElementById("loginRut").value = rut;
        document.getElementById("loginPin").focus();
    } catch (e) {
        errorDiv.innerText = "❌ Error al registrar en la nube.";
        errorDiv.style.display = "block";
    }
    btn.innerText = "CREAR CUENTA";
    btn.disabled = false;
};

window.cerrarSesion = function() {
    if (typeof window.validarSalidaSegura === "function" && !window.validarSalidaSegura()) return;
    sessionStorage.removeItem("FarmaPerfil_Sesion");
    document.getElementById("loginRut").value = "";
    document.getElementById("loginPin").value = "";
    document.getElementById("btnIngresar").innerText = "INGRESAR AL SISTEMA";
    document.getElementById("btnIngresar").disabled = false;
    
    document.getElementById("loginStepService").style.display = "none";
    document.getElementById("loginStepCredentials").style.display = "block";
    
    const overlay = document.getElementById("loginOverlay");
    overlay.style.display = "flex";
    setTimeout(() => { overlay.style.opacity = "1"; document.getElementById("loginRut").focus(); }, 50);
};

window.volverAlMenuPrincipal = function() {
    if (typeof window.validarSalidaSegura === "function" && !window.validarSalidaSegura()) return;
    window.limpiarFormularioPerfil(); 
    document.body.classList.remove("modo-historico");
    window.isModoHistorico = false;
    const status = document.getElementById("statusGuardado");
    if (status) status.innerHTML = `<span class="material-icons-round" style="font-size: 18px;">cloud_done</span> <span>Nube actualizada</span>`;
    window.cargarDashboardBienvenida();
    const overlay = document.querySelector(".login-overlay");
    if (overlay) { overlay.style.display = "flex"; setTimeout(() => overlay.style.opacity = "1", 10); }
};

window.cargarListasMaestras = async function() {
    try {
        const docListas = await getDoc(doc(window.db, "config_maestra", "listas_desplegables"));
        const docCatalogo = await getDoc(doc(window.db, "config_maestra", "catalogo_cdss"));
        
        if (docListas.exists()) {
            const datos = docListas.data();
            window.datosGlobales = {
                nombres: datos.nombresMedicamentos || [],
                vias: datos.vias || [],
                dosis: datos.dosisSugeridas || [],
                posologias: datos.posologias || [],
                alergias: datos.alergias || [],
                servicios: datos.servicios || [],
                camas: datos.camas || [],
                protocoloBIC: datos.protocoloBIC || []
            };

            const loginSelect = document.getElementById("loginServicioSelect");
            const selectServicio = document.getElementById("servicio");
            
            if (window.datosGlobales.servicios.length > 0) {
                if (loginSelect) loginSelect.innerHTML = '<option value="" disabled selected hidden>Seleccione Servicio...</option>';
                if (selectServicio) selectServicio.innerHTML = '<option value="" disabled selected hidden>Seleccione...</option>';
                window.datosGlobales.servicios.sort().forEach(s => {
                    if (loginSelect) loginSelect.appendChild(new Option(s, s));
                    if (selectServicio) selectServicio.appendChild(new Option(s, s));
                });
            }
            
            const dlCamas = document.getElementById("listaCamas");
            if (dlCamas && window.datosGlobales.camas.length > 0) {
                dlCamas.innerHTML = "";
                window.datosGlobales.camas.forEach(c => dlCamas.appendChild(new Option(c, c)));
            }
        }

        if (docCatalogo.exists()) {
            window.datosGlobales.catalogo = docCatalogo.data().farmacos || [];
        }

        const docMedicos = await getDoc(doc(window.db, "config_maestra", "equipo_medico"));
        if (docMedicos.exists()) {
            window.medicosData = docMedicos.data().medicos || [];
            const dlMedicos = document.getElementById("medicosList");
            if (dlMedicos) {
                dlMedicos.innerHTML = "";
                window.medicosData.forEach(m => dlMedicos.appendChild(new Option(m.nombre, m.nombre)));
            }
        }

        const docInteracciones = await getDoc(doc(window.db, "config_maestra", "matriz_interacciones"));
        if (docInteracciones.exists()) {
            window.datosGlobales.matrizInteracciones = docInteracciones.data().interacciones || [];
        }

        console.log("✅ Configuración maestra y CDSS sincronizados desde Firestore.");
    } catch (error) {
        console.error("❌ Error descargando configuración maestra:", error);
    }
};

window.cargarDashboardBienvenida = async function() {
    try {
        const docAvisos = await getDoc(doc(window.db, "config_maestra", "pizarra_avisos"));
        let htmlAvisos = "";
        
        if (docAvisos.exists() && docAvisos.data().mensajes) {
            docAvisos.data().mensajes.forEach(m => {
                let esPeligro = m.includes("⚠️") || m.includes("❌") || m.includes("🚨") || m.toLowerCase().includes("quiebre") || m.toLowerCase().includes("urgente");
                let color = esPeligro ? "var(--accent-red)" : "var(--accent-blue)";
                let bg = esPeligro ? "rgba(255,82,82,0.1)" : "rgba(64,196,255,0.1)";
                let icon = esPeligro ? "warning" : "info";
                let textoLimpio = m.replace(/⚠️|❌|🚨|✅|💡/g, '').trim();

                htmlAvisos += `
                <div style="background: var(--panel-bg); border: 1px solid var(--glass-border); border-left: 5px solid ${color}; padding: 15px; border-radius: 12px; display: flex; gap: 12px; align-items: flex-start; box-shadow: 0 8px 20px rgba(0,0,0,0.15);">
                    <span class="material-icons-round" style="color: ${color}; font-size: 24px; background: ${bg}; padding: 6px; border-radius: 8px;">${icon}</span>
                    <div style="font-size: 13px; color: var(--text-main); line-height: 1.5; font-weight: 500; margin-top: 3px;">${textoLimpio}</div>
                </div>`;
            });
        } else {
            htmlAvisos = `<div style="color: var(--text-muted); font-size: 13px; text-align: center; margin-top: 20px;">No hay avisos activos en Farmacia.</div>`;
        }
        const divAvisos = document.getElementById("lista-avisos");
        if (divAvisos) divAvisos.innerHTML = htmlAvisos;

        // Radar de ocupación en vivo desde camas_activas
        const snapCamas = await getDocs(collection(window.db, "camas_activas"));
        const conteoPorServicio = {};
        snapCamas.forEach(docSnap => {
            const d = docSnap.data();
            if (d && d.nombre && d.nombre.trim() !== "" && d.servicio) {
                const srv = d.servicio.toUpperCase();
                conteoPorServicio[srv] = (conteoPorServicio[srv] || 0) + 1;
            }
        });

        let htmlCenso = "";
        const serviciosRadar = ["MEDICINA", "CIRUGIA", "UCI", "UTI", "UCM", "UCE", "MATERNIDAD", "PEDIATRIA", "PENSIONADO"];
        serviciosRadar.forEach(srv => {
            const conf = mapaCamasHospital[srv.toLowerCase()];
            const max = conf ? (conf.fin - conf.inicio + 1) : 40;
            const ocupadas = conteoPorServicio[srv] || 0;
            const porcentaje = max > 0 ? Math.round((ocupadas / max) * 100) : 0;
            const colorBarra = porcentaje >= 90 ? "var(--accent-red)" : (porcentaje >= 70 ? "#ff9800" : "var(--accent-green)");

            htmlCenso += `
            <div style="background: var(--panel-bg); padding: 12px 15px; border-radius: 12px; border: 1px solid var(--glass-border); box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 900; color: var(--text-main); margin-bottom: 8px; letter-spacing: 0.5px;">
                    <span>${srv}</span>
                    <span style="color: ${colorBarra}; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 6px;">${ocupadas} / ${max}</span>
                </div>
                <div style="width: 100%; background: rgba(0,0,0,0.4); height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${porcentaje}%; background: ${colorBarra}; height: 100%; border-radius: 4px; transition: width 1s ease-in-out;"></div>
                </div>
            </div>`;
        });
        const divCenso = document.getElementById("lista-mini-censo");
        if (divCenso) divCenso.innerHTML = htmlCenso;

    } catch (error) {
        console.error("❌ Error cargando dashboard:", error);
    }
};

// ============================================================================
// 4. NAVEGACIÓN DE SERVICIOS, CAMAS Y LECTURA/ESCRITURA FIRESTORE
// ============================================================================
window.actualizarDropdownCamas = function(idServicio, idCama) {
    const selectServicio = document.getElementById(idServicio);
    const selectCama = document.getElementById(idCama);
    if (!selectServicio || !selectCama) return;

    const servicioElegido = selectServicio.value;
    selectCama.innerHTML = ""; 

    if (!servicioElegido) {
        selectCama.appendChild(new Option("Seleccione Servicio...", ""));
        return;
    }

    let servicioNormalizado = window.quitarTildes(servicioElegido.toLowerCase());
    const config = mapaCamasHospital[servicioNormalizado];
    
    if (config) {
        if (config.personalizado) {
            config.personalizado.forEach(camaNombre => {
                selectCama.appendChild(new Option(camaNombre, camaNombre));
            });
        } else {
            for (let c = config.inicio; c <= config.fin; c++) {
                selectCama.appendChild(new Option(`Cama ${c}`, `Cama ${c}`));
            }
        }
    } else {
        for (let c = 1; c <= 40; c++) {
            selectCama.appendChild(new Option(`Cama ${c}`, `Cama ${c}`));
        }
    }
};

window.comenzarTurnoWeb = function() {
    const servicioSeleccionado = document.getElementById("loginServicioSelect").value;
    if (!servicioSeleccionado) { alert("Por favor seleccione un servicio."); return; }
    
    const selectPrincipal = document.getElementById("servicio");
    if (selectPrincipal && window.datosGlobales && window.datosGlobales.servicios) {
        selectPrincipal.innerHTML = '<option value="" disabled hidden>Seleccione...</option>';
        window.datosGlobales.servicios.sort().forEach(s => selectPrincipal.appendChild(new Option(s, s)));
    }
    selectPrincipal.value = servicioSeleccionado; 
    
    window.actualizarDropdownCamas("servicio", "cama");
    
    const usuario = JSON.parse(sessionStorage.getItem("FarmaPerfil_Sesion") || "{}");
    const overlay = document.getElementById("loginOverlay");
    overlay.style.opacity = "0";
    setTimeout(() => { overlay.style.display = "none"; }, 500);
    
    if (usuario.nombre) document.getElementById("displayUserName").innerText = usuario.nombre;
    if (usuario.rol) document.getElementById("displayUserRole").innerText = usuario.rol;

    window.cargarTratamientoPacienteCama();
};

window.cambiarServicioUI = function() {
    if (typeof window.validarSalidaSegura === "function" && !window.validarSalidaSegura()) {
        if (window.servicioActivoSeguro) document.getElementById("servicio").value = window.servicioActivoSeguro;
        return;
    }
    window.servicioActivoSeguro = document.getElementById("servicio").value;
    window.actualizarDropdownCamas("servicio", "cama");
    window.cargarTratamientoPacienteCama();
};

window.cambiarCamaNavegacion = function(direccion) {
    if (typeof window.validarSalidaSegura === "function" && !window.validarSalidaSegura()) return;
    const selectorCama = document.getElementById("cama");
    if (!selectorCama || selectorCama.options.length === 0) return;

    let indiceActual = selectorCama.selectedIndex;
    if (indiceActual === -1) indiceActual = 0; 

    let nuevoIndice = indiceActual + direccion;
    if (nuevoIndice >= 0 && nuevoIndice < selectorCama.options.length) {
        selectorCama.selectedIndex = nuevoIndice;
        window.limpiarFormularioPerfil();
        const status = document.getElementById("statusGuardado");
        if (status) {
            status.innerHTML = `<span class="material-icons-round" style="font-size: 18px; color: var(--accent-blue);">sync</span> <span style="color: var(--accent-blue);">Cargando paciente...</span>`;
        }
        clearTimeout(window.temporizadorNavegacionCama);
        window.temporizadorNavegacionCama = setTimeout(() => {
            window.cargarTratamientoPacienteCama();
        }, 300); 
    }
};

window.limpiarFormularioPerfil = function() {
    document.getElementById("rut").value = "";
    document.getElementById("rut").classList.remove("input-warning");
    document.getElementById("paciente").value = "";
    document.getElementById("peso").value = "";
    document.getElementById("ficha").value = "";
    document.getElementById("genero").value = "";
    document.getElementById("fechaIngreso").value = "";
    document.getElementById("diagnostico").value = "";
    document.getElementById("alergiaPaciente").value = "";

    document.querySelectorAll(".header-fecha").forEach(inp => {
        inp.value = ""; inp.style.background = "transparent"; inp.style.color = "var(--accent-blue)";
    });

    document.querySelectorAll("#grillaFila tr").forEach(fila => {
        const inputs = fila.querySelectorAll("input");
        inputs.forEach(inp => {
            inp.value = "";
            inp.classList.remove("alerta-sobredosis", "alerta-interaccion", "alerta-alergia", "input-warning");
            inp.style.color = "";
            delete inp.dataset.manual;
            delete inp.dataset.pendiente;
            window.syncCheckUI(inp);
        });
        const msg = fila.querySelector(".mensaje-reaccion");
        if (msg) msg.style.display = "none";
    });
    
    const sidebarSaldos = document.getElementById("sidebar-saldos-content");
    if (sidebarSaldos) {
        sidebarSaldos.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px; line-height: 1.5;">
          <span class="material-icons-round" style="font-size: 32px; color: var(--glass-border); margin-bottom: 10px;">science</span><br>
          Escriba un fármaco multidosis o líquido oral para monitorear sus saldos en tiempo real.
        </div>`;
    }
    window.medicamentosPendientes = {};
    window.sobredosisValidadas.clear();
    window.interaccionesValidadas.clear();
    window.alertasEmitidas.clear();
};

window.cargarTratamientoPacienteCama = async function() {
    if (typeof window.validarSalidaSegura === "function" && !window.validarSalidaSegura()) {
        if (window.camaActivaSegura) document.getElementById("cama").value = window.camaActivaSegura;
        return;
    }

    const servicio = document.getElementById("servicio").value;
    const cama = document.getElementById("cama").value;
    if (!servicio || !cama) return;
    
    window.camaActivaSegura = cama;
    window.servicioActivoSeguro = servicio;
    
    const status = document.getElementById("statusGuardado");
    if (status) status.innerHTML = `<span class="material-icons-round" style="font-size: 18px; color: var(--accent-blue);">sync</span> <span style="color: var(--accent-blue);">Descargando de Firebase...</span>`;

    window.isCargandoPerfil = true;
    window.limpiarFormularioPerfil();

    try {
        const idCama = `${servicio.toLowerCase()}_${cama.toLowerCase()}`.replace(/\s+/g, '_');
        const docRef = doc(window.db, "camas_activas", idCama);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const res = docSnap.data();
            
            document.getElementById("rut").value = res.rut || "";
            if (res.rut) window.validarRut(document.getElementById("rut"));
            document.getElementById("paciente").value = res.nombre || "";
            document.getElementById("peso").value = res.peso || "";
            document.getElementById("ficha").value = res.ficha || "";
            document.getElementById("fechaIngreso").value = res.fechaIngreso || "";
            document.getElementById("diagnostico").value = res.diagnostico || "";
            document.getElementById("alergiaPaciente").value = res.alergia || "";
            document.getElementById("genero").value = res.genero || "";
            
            const inputsFecha = document.querySelectorAll(".header-fecha");
            if (res.fechasCabecera) {
                res.fechasCabecera.forEach((fec, idx) => {
                    if (inputsFecha[idx]) inputsFecha[idx].value = fec;
                });
            }
            
            const filas = document.querySelectorAll("#grillaFila tr");
            if (res.medicamentos) {
                res.medicamentos.forEach((med, idx) => {
                    if (filas[idx]) {
                        const inputs = filas[idx].querySelectorAll("input");
                        inputs[0].value = med.farmaco || "";
                        inputs[1].value = med.via || "";
                        inputs[2].value = med.dosis || "";
                        inputs[3].value = med.posologia || "";
                        
                        for (let d = 0; d < 10; d++) {
                            if (inputs[5 + d] && med.dias && med.dias[d] !== undefined) {
                                inputs[5 + d].value = med.dias[d];
                                window.syncCheckUI(inputs[5 + d]);
                            }
                        }
                        // Evaluar estado visual CDSS sin disparar modal molesto al cargar
                        if (med.farmaco && med.posologia) {
                            window.evaluarCDSSLocal(filas[idx], med.farmaco, med.posologia, "", med.dosis, true);
                        }
                    }
                });
            }
        }

        if (status) status.innerHTML = `<span class="material-icons-round" style="font-size: 18px; color: var(--accent-green);">cloud_done</span> <span style="color: var(--text-muted);">Nube actualizada</span>`;
        
        setTimeout(() => {
            let rutActual = document.getElementById("rut").value.trim() || idCama;
            window.medicamentosPendientes = JSON.parse(localStorage.getItem("pendientes_" + rutActual)) || {};

            window.actualizarSaldosYSidebar();
            window.escanearInteraccionesGlobales();
            window.escanearAlergias();
            window.escanearRestringidos(); 
            
            window.isCargandoPerfil = false;
        }, 200);

    } catch (error) {
        console.error("Error crítico cargando cama:", error);
        if (status) status.innerHTML = `<span class="material-icons-round" style="font-size: 18px; color: var(--accent-red);">cloud_off</span> <span style="color: var(--accent-red);">Fallo de conexión</span>`;
        window.isCargandoPerfil = false;
    }
};

window.ejecutarGuardadoSilencioso = async function(servicio, cama) {
    if (window.isCargandoPerfil || window.isModoHistorico) return;
    try {
        const paciente = {
            cama: cama,
            rut: document.getElementById("rut").value.trim(),
            nombre: document.getElementById("paciente").value.trim(),
            peso: document.getElementById("peso").value.trim(),
            servicio: servicio,
            ficha: document.getElementById("ficha").value.trim(),
            genero: document.getElementById("genero") ? document.getElementById("genero").value : "",
            fechaIngreso: document.getElementById("fechaIngreso").value,
            diagnostico: document.getElementById("diagnostico").value.trim(),
            alergia: document.getElementById("alergiaPaciente") ? document.getElementById("alergiaPaciente").value.trim() : "",
            fechasCabecera: [],
            medicamentos: [],
            ultimaModificacion: new Date().toISOString()
        };

        document.querySelectorAll(".header-fecha").forEach(inp => paciente.fechasCabecera.push(inp.value));

        document.querySelectorAll("#grillaFila tr").forEach(fila => {
            const inputs = fila.querySelectorAll("input");
            const farmaco = inputs[0].value.trim();
            if (farmaco !== "") {
                const med = { 
                    farmaco: farmaco, 
                    via: inputs[1].value.trim(), 
                    dosis: inputs[2].value.trim(), 
                    posologia: inputs[3].value.trim(), 
                    dias: [] 
                };
                for (let i = 0; i < 10; i++) {
                    let cellVal = "";
                    if (inputs[5 + i]) {
                        cellVal = inputs[5 + i].value.trim();
                        const btn = inputs[5 + i].nextElementSibling;
                        if (btn && btn.classList.contains("ticked") && cellVal !== "") {
                            cellVal += " ✓";
                        }
                    }
                    med.dias.push(cellVal);
                }
                paciente.medicamentos.push(med);
            }
        });

        const idCama = `${servicio.toLowerCase()}_${cama.toLowerCase()}`.replace(/\s+/g, '_');
        const docRef = doc(window.db, "camas_activas", idCama);
        await setDoc(docRef, paciente);

        window.datosSincronizados = true;
        window.hayCambiosSinGuardar = false;
        
        const status = document.getElementById("statusGuardado");
        if (status) status.innerHTML = `<span class="material-icons-round" style="font-size: 18px; color: var(--accent-green);">cloud_done</span> <span style="color: var(--text-muted);">Nube actualizada</span>`;

    } catch (error) {
        console.error("Error guardando paciente:", error);
        const status = document.getElementById("statusGuardado");
        if (status) status.innerHTML = `<span class="material-icons-round" style="font-size: 18px; color: var(--accent-red);">cloud_off</span> <span style="color: var(--accent-red);">Error al guardar</span>`;
    }
};

window.programarAutoguardado = function() {
    if (window.isModoHistorico || window.isCargandoPerfil) return;

    const servicio = document.getElementById("servicio").value;
    const cama = document.getElementById("cama").value;
    if (!servicio || !cama) return;

    window.datosSincronizados = false;
    window.hayCambiosSinGuardar = true;

    const status = document.getElementById("statusGuardado");
    if (status) {
        status.innerHTML = `<span class="material-icons-round" style="font-size: 18px; color: var(--accent-blue);">cloud_sync</span> <span style="color: var(--accent-blue);">Guardando...</span>`;
    }

    clearTimeout(window.temporizadorGuardado);
    window.temporizadorGuardado = setTimeout(() => {
        window.ejecutarGuardadoSilencioso(servicio, cama);
    }, 1200); 
};

window.validarSalidaSegura = function() {
    if (!window.datosSincronizados) {
        const confirmar = confirm("⚠️ ALERTA DE SINCRONIZACIÓN\n\nLos últimos cambios aún se están guardando. ¿Desea salir de todos modos?");
        if (!confirmar) return false;
        window.datosSincronizados = true; 
    }
    return true;
};

// ============================================================================
// 5. MOTOR DE AUTOCOMPLETADO INTELIGENTE Y SUGERENCIAS DE DOSIS
// ============================================================================
window.generarOpcionesDosisInteligentes = function(nombreMed, viaActual, opcionesBase) {
    let opciones = [...opcionesBase];
    const medLow = nombreMed.toLowerCase();
    
    const inhaladores = ["salbutamol", "ipratropio", "budesonida", "formoterol", "fluticasona", "brexotide", "tiotropio", "olodaterol"];
    const esInhalador = inhaladores.some(inh => medLow.includes(inh));
    const esNutricionOSuero = ["fresubin", "ensure", "osmolite", "survimed", "diben", "peptamen", "glucerna", "jevity", "smofkabiven", "smoflipid", "suero", "nacl", "sodio cloruro", "glucosa", "ringer", "sodio bicarbonato 2/3 molar 250 ml"].some(n => medLow.includes(n));
    const esLiquidoOral = Object.keys(DB_LIQUIDOS).some(k => window.quitarTildes(medLow).includes(window.quitarTildes(k.toLowerCase())));
    const esSobre = ["saccharomyces", "rehsal", "polietilenglicol", "banatrol"].some(s => medLow.includes(s));
    const esOftalmico = ["cloramfenicol", "lagrima", "lágrima", "pilocarpina", "proparacaina", "proparacaína", "dorzolamida", "latanoprost", "tobramicina"].some(s => medLow.includes(s));
    const esGotaOral = ["ferroso sulfato 125", "sulfato ferroso 125", "zinc", "tramadol", "vitamina acd", "acd", "biogaia", "risperidona 1 mg/ml"].some(s => medLow.includes(s));
    const esHeparina = medLow.includes("heparina");
    const esInsulina = ["nph", "glargina", "cristalina", "insulina"].some(s => medLow.includes(s));
    const esPomada = ["nistatina 10", "mometasona", "clotrimazol", "mupirocina", "hidrocortisona 1%", "crema", "pomada", "unguento"].some(s => medLow.includes(s)) || (viaActual && viaActual.toLowerCase() === "top");

    if (esGotaOral) {
        opciones = ["5 gotas", "10 gotas", "15 gotas", "20 gotas", "25 gotas", "30 gotas", "40 gotas"];
    } else if (esPomada) {
        opciones = ["Aplicar"];
    } else if (esOftalmico) {
        opciones = ["1 gota", "2 gotas", "3 gotas", "4 gotas"];
    } else if (esSobre) {
        opciones = ["0.5 sobre", "1 sobre", "2 sobres", "3 sobres", "4 sobres"];
    } else if (esLiquidoOral) {
        opciones = ["1 mL", "2 mL", "2.5 mL", "3 mL", "4 mL", "5 mL", "7.5 mL", "10 mL", "15 mL", "20 mL"];
    } else if (esInhalador) {
        const filtradas = opciones.filter(opt => /puff/i.test(opt));
        opciones = filtradas.length > 0 ? filtradas : ["1 puff", "2 puff", "3 puff", "4 puff", "6 puff", "8 puff"];
    } else if (esNutricionOSuero) {
        const filtradas = opciones.filter(opt => /(ml|cc)/i.test(opt));
        if (filtradas.length > 0) opciones = filtradas;
    } else if (esHeparina) {
        opciones = ["2500 UI", "5000 UI", "7500 UI", "10000 UI", "12500 UI", "15000 UI", "20000 UI", "25000 UI"];
    } else if (esInsulina) {
        opciones = ["2 UI", "4 UI", "6 UI", "8 UI", "10 UI", "12 UI", "14 UI", "16 UI", "18 UI", "20 UI", "25 UI", "30 UI"];
    } else {
        const matchBase = medLow.match(/(\d+(?:\.\d+)?)\s*(mcg|mg|g|ui|u|meq)(?:\b|\/|-|$)/i);
        if (matchBase) {
            const baseDosis = parseFloat(matchBase[1]);
            let unidad = matchBase[2].toLowerCase();
            if (unidad === "ui" || unidad === "u") unidad = "UI";
            const multiplicadores = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];
            opciones = multiplicadores.map(m => parseFloat((baseDosis * m).toFixed(3)) + " " + unidad);
        }
    }
    if (!opciones.includes("BIC")) opciones.push("BIC");
    return opciones;
};

document.addEventListener("click", function(e) {
    if ((e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") && e.target.hasAttribute("data-lista")) {
        e.target.dispatchEvent(new Event("input", { bubbles: true }));
    }
});

document.addEventListener("input", function(e) {
    if ((e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") && e.target.hasAttribute("data-lista") && window.datosGlobales) {
        window.inputActivo = e.target;
        const listaId = window.inputActivo.getAttribute("data-lista");
        const menuFlotante = document.getElementById("menu-flotante");
        
        let opciones = window.datosGlobales[listaId] ? [...window.datosGlobales[listaId]] : [];
        let valor = window.inputActivo.value.toLowerCase();
        
        if (listaId === "alergias") {
            const partes = valor.split(',');
            valor = partes[partes.length - 1].trim();
        }
        
        if (listaId === "dosis") {
            const fila = window.inputActivo.closest("tr");
            if (fila) {
                const nombreMed = fila.querySelector('input[data-lista="nombres"]').value;
                const viaActual = fila.querySelector('input[data-lista="vias"]').value;
                opciones = window.generarOpcionesDosisInteligentes(nombreMed, viaActual, opciones);
            }
        }

        const valorSinTildes = window.quitarTildes(valor);
        let opcionesFiltradas = opciones.filter(opt => window.quitarTildes(opt.toLowerCase()).includes(valorSinTildes));
        
        opcionesFiltradas.sort((a, b) => {
            const strA = window.quitarTildes(a.toLowerCase());
            const strB = window.quitarTildes(b.toLowerCase());
            const empA = strA.startsWith(valorSinTildes);
            const empB = strB.startsWith(valorSinTildes);
            if (empA && !empB) return -1;
            if (!empA && empB) return 1;
            return 0;
        });

        if (opcionesFiltradas.length > 50) opcionesFiltradas = opcionesFiltradas.slice(0, 50);

        menuFlotante.innerHTML = "";
        opcionesFiltradas.forEach((opt, index) => {
            const div = document.createElement("div");
            div.textContent = opt;
            div.onmousedown = function(ev) { ev.preventDefault(); ev.stopPropagation(); window.seleccionarOpcion(opt); };
            div.ontouchstart = function(ev) { ev.preventDefault(); ev.stopPropagation(); window.seleccionarOpcion(opt); };
            div.onmouseover = function() { window.opcionResaltadaIndex = index; window.actualizarResaltado(); };
            menuFlotante.appendChild(div);
        });
        
        if (opcionesFiltradas.length > 0) {
            const rect = window.inputActivo.getBoundingClientRect();
            const mainContent = document.querySelector('.main-content');
            const mainRect = mainContent.getBoundingClientRect();
            
            menuFlotante.style.left = (rect.left - mainRect.left + mainContent.scrollLeft) + "px";
            menuFlotante.style.width = rect.width + "px";

            const espacioAbajo = window.innerHeight - rect.bottom;
            if (espacioAbajo < 220) {
                menuFlotante.style.top = (rect.top - mainRect.top + mainContent.scrollTop) + "px";
                menuFlotante.style.transform = "translateY(-100%)";
            } else {
                menuFlotante.style.top = (rect.bottom - mainRect.top + mainContent.scrollTop) + "px";
                menuFlotante.style.transform = "none";
            }
            menuFlotante.style.display = "block";
            window.opcionResaltadaIndex = -1;
        } else {
            menuFlotante.style.display = "none";
        }
    }
});

window.seleccionarOpcion = function(texto) { 
    const menuFlotante = document.getElementById("menu-flotante");
    if (window.inputActivo.getAttribute("data-lista") === "alergias") {
        let partes = window.inputActivo.value.split(',');
        partes.pop(); 
        let nuevaAlergia = partes.length > 0 ? " " + texto : texto; 
        window.inputActivo.value = [...partes, nuevaAlergia].join(',') + ", ";
    } else {
        window.inputActivo.value = texto; 
    }
    menuFlotante.style.display = "none"; 
    window.inputActivo.dispatchEvent(new Event("change", { bubbles: true })); 
};

window.actualizarResaltado = function() {
    const menuFlotante = document.getElementById("menu-flotante");
    const items = menuFlotante.querySelectorAll("div");
    items.forEach(item => item.classList.remove("opcion-activa"));
    if (window.opcionResaltadaIndex > -1 && items[window.opcionResaltadaIndex]) {
        items[window.opcionResaltadaIndex].classList.add("opcion-activa");
        items[window.opcionResaltadaIndex].scrollIntoView({ block: "nearest" });
    }
};

document.addEventListener("mousedown", function(e) { 
    const menuFlotante = document.getElementById("menu-flotante");
    if (menuFlotante && menuFlotante.style.display === "block" && !menuFlotante.contains(e.target) && e.target !== window.inputActivo) {
        menuFlotante.style.display = "none"; 
    }
});
document.addEventListener("focusin", function(e) { 
    const menuFlotante = document.getElementById("menu-flotante");
    if (window.inputActivo && e.target !== window.inputActivo && menuFlotante) {
        menuFlotante.style.display = "none"; 
    }
});

// ============================================================================
// 6. MOTOR MATEMÁTICO DE CÁLCULO DE UNIDADES Y SALDOS MULTIDOSIS
// ============================================================================
window.limpiarDecimales = function(texto) {
    if (!texto) return "";
    let t = texto.toString().trim();
    if (t.includes('.') && t.includes(',')) t = t.replace(/\./g, '');
    return t.replace(/,/g, '.');
};

window.extraerSoloNumero = function(texto) {
    if (!texto) return 0;
    let m = window.limpiarDecimales(texto).match(/(\d+(\.\d+)?)/);
    return m ? parseFloat(m[1]) : 0;
};

window.obtenerFactorFrecuenciaFront = function(texto) {
    const t = (texto || "").toLowerCase().replace(/\s/g, '').replace(/hrs/g, 'h').replace(/hr/g, 'h');
    if (t === "carga" || t.includes("porunavez")) return 1; 
    if (t.includes("c/dia") || t.includes("1vez") || t.includes("24h")) return 1;
    if (t.includes("72h")) return 0.33; 
    if (t.includes("48h")) return 0.5;  
    if (t.includes("36h")) return 0.66; 
    if (t.includes("18h")) return 1.33; 
    if (t.includes("12h") || t.includes("2veces")) return 2;
    if (t.includes("8h")  || t.includes("3veces")) return 3;
    if (t.includes("6h")  || t.includes("4veces")) return 4;
    if (t.includes("4h")  || t.includes("6veces")) return 6;
    if (t.includes("3h")  || t.includes("8veces")) return 8;
    if (t.includes("2h")  || t.includes("12veces")) return 12;
    if (t === "c/h" || t.includes("1h") || t.includes("cadahora")) return 24;
    return 0; 
};

window.extraerSoloMasa = function(texto) {
    if (!texto) return 0;
    let t = window.limpiarDecimales(texto).toLowerCase();
    t = t.replace(/\/\s*\d+([.,]\d+)?\s*(ml|cc)/g, ""); 
    t = t.replace(/\d+([.,]\d+)?\s*(ml|cc)/g, "");
    let matches = t.match(/(\d+(\.\d+)?)/g);
    if (matches && matches.length >= 2 && t.includes("/")) {
        return matches.reduce((acc, val) => acc + parseFloat(val), 0);
    }
    let m = t.match(/(\d+(\.\d+)?)/);
    return m ? parseFloat(m[1]) : 0;
};

window.extraerConcentracionPro = function(texto) {
    if (!texto) return 0;
    let m = window.limpiarDecimales(texto).toLowerCase().match(/(\d+(\.\d+)?)\s*(ml|cc)/);
    if (m) return parseFloat(m[1]);
    let m2 = window.limpiarDecimales(texto).match(/(\d+(\.\d+)?)/);
    return m2 ? parseFloat(m2[1]) : 0;
};

window.calcularDosisFila = function(medTexto, viaTexto, dosisTexto, posoTexto, factorDias, rowId = null) {
    medTexto = (medTexto || "").toLowerCase().trim();
    viaTexto = (viaTexto || "").toLowerCase().trim();
    dosisTexto = (dosisTexto || "").toLowerCase().trim();
    posoTexto = (posoTexto || "").toLowerCase().trim();
    factorDias = parseFloat(factorDias) || 1;

    // Bloqueo por protocolo restringido no autorizado
    if (rowId !== null) {
        let keyEncontrada = Object.keys(PROTOCOLOS_RESTRINGIDOS).find(k => medTexto.includes(k));
        if (keyEncontrada) {
            const prot = PROTOCOLOS_RESTRINGIDOS[keyEncontrada];
            const srv = (document.getElementById("servicio").value || "").toLowerCase();
            if (!(prot.especialidad === "Psiquiatría" && srv === "uce")) {
                const estado = window.medicamentosPendientes[`${rowId}|${medTexto}`]?.estado;
                if (estado && estado !== "ACEPTADO") return ""; 
            }
        }
    }

    if (dosisTexto === "bic" && posoTexto.includes("c/h")) return 2 * factorDias;

    const dosis = window.extraerSoloNumero(dosisTexto);
    const factor = window.obtenerFactorFrecuenciaFront(posoTexto);
    const pesoInput = document.getElementById("peso");
    const peso = pesoInput ? parseFloat(pesoInput.value) || 70 : 70;

    let resultado = 0;
    if (!medTexto || !posoTexto || dosis === 0) return "";

    if (posoTexto.includes("c/min") || posoTexto.includes("gamas")) {
        let concentracionAmpMcg = window.extraerSoloMasa(medTexto) * (medTexto.includes("mg") ? 1000 : 1);
        if (peso > 0 && concentracionAmpMcg > 0) {
            const mcgTotalesPeriodo = dosis * peso * 60 * 24 * factorDias;
            return Math.ceil(mcgTotalesPeriodo / concentracionAmpMcg);
        }
    } 
    else if (medTexto.includes("ui") || medTexto.includes("unidades")) {
        let divisor = window.extraerSoloMasa(medTexto);
        if (divisor > 0) {
            const totalPeriodo = dosis * factor * factorDias;
            resultado = Math.ceil(totalPeriodo / divisor);
        }
    }
    else if (["fresubin", "ensure", "osmolite", "survimed", "diben", "peptamen", "glucerna"].some(n => medTexto.includes(n)) ||
             posoTexto === "c/h" || posoTexto.includes("ml/h") || posoTexto.includes("cc/h") || posoTexto.includes("gotas/min") ||
             (posoTexto.includes("24h") && (dosisTexto.includes("cc") || dosisTexto.includes("ml")))) {
        
        const esNutricion = ["fresubin", "ensure", "osmolite", "survimed", "diben", "peptamen", "glucerna"].some(n => medTexto.includes(n));
        if ((dosisTexto.includes("mg") || dosisTexto.includes("mcg") || dosisTexto.includes("g") || dosisTexto.includes("ui")) && !esNutricion) {
            const concentracionMasa = window.extraerSoloMasa(medTexto);
            if (concentracionMasa > 0) resultado = Math.ceil((dosis * 24 * factorDias) / concentracionMasa);
        } else {
            const concentracionVol = window.extraerConcentracionPro(medTexto); 
            let volumenDiarioML = (factor === 24 || posoTexto.includes("h")) ? (dosis * 24) : (dosis * factor);
            if (concentracionVol > 0) {
                if (esNutricion) {
                    let frascosPorDia = Math.ceil(volumenDiarioML / concentracionVol) || 1;
                    resultado = frascosPorDia * factorDias; 
                } else {
                    resultado = Math.ceil((volumenDiarioML * factorDias) / concentracionVol);
                }
            }
        }
    }
    else if (dosisTexto.includes("sobre")) {
        resultado = Math.ceil(dosis * factor * factorDias);
    }
    else if (dosisTexto.includes("aplicar") || dosisTexto.includes("puff") || dosisTexto.includes("gota") || viaTexto.includes("oft") || ["crema", "pomada", "nistatina 10", "mometasona", "clotrimazol", "mupirocina", "hidrocortisona 1%"].some(t => medTexto.includes(t))) {
        resultado = 1;
    }
    else {
        const concentracionMasa = window.extraerSoloMasa(medTexto); 
        const esLiquido = ["jarabe", "suspension", "gotas"].some(l => medTexto.includes(l));
        const esInyectable = viaTexto.includes("ev") || viaTexto.includes("im") || viaTexto.includes("sc") || viaTexto.includes("iv");
        const esFrasco = ["ceftriaxona", "cloxacilina", "vancomicina", "piperacilina", "meropenem", "ampicilina", "penicilina", "cefazolina", "cefotaxima", "ceftazidima", "hidrocortisona", "omeprazol 40 mg", "anidulafungina", "amfotericina b", "vial", "frasco", "fa", "heparina"].some(f => medTexto.includes(f));
        const esCapsula = medTexto.includes("capsula") || medTexto.includes("cápsula") || medTexto.includes("cap") || ["omeprazol 20 mg", "celecoxib", "gabapentina", "tacrolimus", "ciclosporina", "ácido ursodesoxicólico", "acido ursodesoxicolico"].some(f => medTexto.includes(f));
        const esAmpolla = medTexto.includes("ampolla") || medTexto.includes("furosemida 20 mg/2 ml") || medTexto.includes("amp") || (esInyectable && !esFrasco);
        const dosisEsML = dosisTexto.includes("ml") || dosisTexto.includes("cc");

        if (esLiquido && !esAmpolla) {
            let volumenDosisML = dosis;
            if (!dosisEsML && concentracionMasa > 0) volumenDosisML = (dosis * 1) / concentracionMasa; 
            let capacidadFrasco = medTexto.includes("valproico") ? 120 : 100;
            resultado = Math.ceil((volumenDosisML * factor * factorDias) / capacidadFrasco) || 1;
        } 
        else if (esAmpolla || esCapsula) {
            if (concentracionMasa > 0) {
                let volumenAmpolla = window.extraerConcentracionPro(medTexto) || 1;
                let unidadesPorDosis = dosisEsML ? (dosis / volumenAmpolla) : (dosis / concentracionMasa);
                let factorCalculo = factor < 1 ? 1 : factor; 
                resultado = Math.ceil(unidadesPorDosis) * factorCalculo * factorDias;
            }
        }
        else {
            if (concentracionMasa > 0) {
                let factorCalculo = factor < 1 ? 1 : factor;
                resultado = Math.ceil((dosis / concentracionMasa) * factorCalculo * factorDias);
            }
        }
    }
    return resultado || "";
};

window.actualizarSaldosYSidebar = function() {
    const filas = document.querySelectorAll("#grillaFila tr");
    const diasADespachar = parseInt(document.getElementById("inputDias").value) || 1;
    const contenedorSaldos = document.getElementById("sidebar-saldos-content");
    if (!contenedorSaldos) return;
    
    let colActiva = 0;
    const headersF = document.querySelectorAll(".header-fecha");
    for (let i = 0; i < 10; i++) {
        if (headersF[i].value.trim() !== "") colActiva = i;
    }
    let limiteColumnas = colActiva + 1;
    
    let rut = document.getElementById("rut").value.trim();
    if (!rut) {
        const serv = document.getElementById("servicio").value || "sin_servicio";
        const cam = document.getElementById("cama").value || "sin_cama";
        rut = serv + "_" + cam;
    }

    let saldosGuardados = JSON.parse(localStorage.getItem("saldos_" + rut)) || {};
    window.nuevosSaldosParaManana = {};
    
    let htmlSaldos = ""; let haySaldos = false;

    const diccMultidosis = [
        { clave: "heparina", capacidad: 25000, unidad: "UI" },
        { clave: "salbutamol", capacidad: 200, unidad: "puffs" },
        { clave: "ipratropio", capacidad: 200, unidad: "puffs" },
        { clave: "brexotide", capacidad: 120, unidad: "puffs" },
        { clave: "budesonida", capacidad: 200, unidad: "puffs" },
        { clave: "fluticasona", capacidad: 120, unidad: "puffs" },
        { clave: "formoterol", capacidad: 120, unidad: "puffs" },
        { clave: "tiotropio", capacidad: 60, unidad: "puffs" },
        { clave: "olodaterol", capacidad: 60, unidad: "puffs" },
        { clave: "nph", capacidad: 1000, unidad: "UI" },
        { clave: "glargina", capacidad: 300, unidad: "UI" },
        { clave: "cristalina", capacidad: 1000, unidad: "UI" },
        { clave: "cloramfenicol", capacidad: 200, unidad: "gotas" },
        { clave: "lagrima", capacidad: 300, unidad: "gotas" },
        { clave: "lágrima", capacidad: 300, unidad: "gotas" },
        { clave: "pilocarpina", capacidad: 100, unidad: "gotas" },
        { clave: "proparacaina", capacidad: 300, unidad: "gotas" },
        { clave: "proparacaína", capacidad: 300, unidad: "gotas" },
        { clave: "dorzolamida", capacidad: 100, unidad: "gotas" },
        { clave: "latanoprost", capacidad: 50, unidad: "gotas" },
        { clave: "tobramicina", capacidad: 100, unidad: "gotas" }
    ];

    const diccNutriciones = ["diben", "fresubin", "survimed", "jevity", "osmolite", "smofkabiven", "smoflipid", "glucerna"];
    const diccSueros = ["sodio cloruro", "nacl", "glucosa", "glucosalino", "ringer", "sodio bicarbonato 2/3 molar 250 ml"];

    filas.forEach(fila => {
        const inputs = fila.querySelectorAll("input");
        const medNombre = inputs[0].value.trim().toLowerCase();
        const dosisTexto = inputs[2].value.trim().toLowerCase();
        const posoTexto = inputs[3].value.trim().toLowerCase();
        if (!medNombre || !dosisTexto || !posoTexto) return;
        
        const multiData = diccMultidosis.find(m => medNombre.includes(m.clave));
        const esNutricion = diccNutriciones.some(n => medNombre.includes(n));
        const esSuero = diccSueros.some(s => medNombre.includes(s));
        
        let liqData = null; let liqName = "";
        let medLimpio = window.quitarTildes(medNombre);
        for (let key in DB_LIQUIDOS) {
            if (medLimpio.includes(window.quitarTildes(key.toLowerCase()))) {
                liqData = DB_LIQUIDOS[key]; liqName = key; break;
            }
        }

        if (multiData) {
            let dosisNum = parseFloat(dosisTexto.match(/(\d+(\.\d+)?)/)?.[1]) || 0;
            let esOftalmico = ["cloramfenicol", "lagrima", "lágrima", "pilocarpina", "proparacaina", "proparacaína", "dorzolamida", "latanoprost", "tobramicina"].some(o => medNombre.includes(o));
            if (esOftalmico) dosisNum = dosisNum * 2; 
            else if (dosisTexto.includes("gota")) dosisNum = dosisNum / 20; 
            
            const factor = window.obtenerFactorFrecuenciaFront(posoTexto);
            const dosisDiaria = dosisNum * factor;
            const consumoTotal = dosisDiaria * diasADespachar;
            
            if (consumoTotal > 0) {
                haySaldos = true;
                let saldoPrevio = saldosGuardados[multiData.clave] !== undefined ? saldosGuardados[multiData.clave] : 0;
                let balanceActual = saldoPrevio;
                let diasDuracionUnFrasco = Math.floor(multiData.capacidad / dosisDiaria);
                
                for (let d = colActiva; d < limiteColumnas; d++) {
                    if (d > 9) break;
                    let celdaDia = inputs[5 + d]; 
                    if (!celdaDia) break; 
                    if (celdaDia.dataset.manual === "true") { balanceActual -= consumoTotal; continue; }

                    if (balanceActual < consumoTotal) {
                        let faltante = consumoTotal - balanceActual;
                        let frascos = Math.ceil(faltante / multiData.capacidad);
                        celdaDia.value = frascos;
                        celdaDia.style.color = "var(--text-main)";
                        balanceActual += (frascos * multiData.capacidad);
                    } else {
                        celdaDia.value = "T";
                        celdaDia.style.color = "var(--accent-green)";
                    }
                    celdaDia.style.fontWeight = "900";
                    balanceActual -= consumoTotal;
                    window.syncCheckUI(celdaDia);
                }
                for (let d = limiteColumnas; d < 10; d++) { if (inputs[5 + d] && inputs[5 + d].dataset.manual !== "true") { inputs[5 + d].value = ""; window.syncCheckUI(inputs[5 + d]); } }
                window.nuevosSaldosParaManana[multiData.clave] = balanceActual;

                htmlSaldos += `
                  <div class="nutricion-item" style="border-left: 4px solid var(--accent-green); display:block;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="nutricion-info" style="text-transform:uppercase;">${medNombre}</span>
                        <div style="font-size:11px; color:var(--text-muted); display:flex; align-items:center; gap:5px;">
                            Saldo Previo: 
                            <input type="number" class="input-saldo-manual" data-clave="${multiData.clave}" value="${Math.round(saldoPrevio)}" style="width:60px; font-size:12px; padding:3px; border-radius:4px; border:1px solid var(--glass-border); background:rgba(0,0,0,0.2); color:var(--text-main); text-align:center;">
                        </div>
                    </div>
                    <div style="margin-top: 10px; display:flex; justify-content:space-between; align-items:flex-end;">
                        <div>
                            <span class="nutricion-vol" style="color:var(--text-muted);">Gasto Diario: ${Math.round(dosisDiaria*10)/10} ${multiData.unidad}</span>
                            <span class="nutricion-vol" style="color:var(--accent-green); font-weight:bold; margin-top:3px; font-size: 13px;">Queda para mañana: ${Math.round(balanceActual)} ${multiData.unidad}</span>
                        </div>
                        <span style="font-size:10px; font-weight:bold; color:var(--accent-blue); text-align:right;">1 envase dura<br><b style="font-size:16px;">${diasDuracionUnFrasco}</b> días</span>
                    </div>
                  </div>`;
            }
        } 
        else if (liqData && !liqData.biogaia) {
            let dosisML = parseFloat(dosisTexto.match(/(\d+(\.\d+)?)/)?.[1]) || 0;
            if (dosisTexto.includes("mg") || dosisTexto.includes("ui")) dosisML = (dosisML * liqData.ml) / liqData.mg;
            else if (dosisTexto.includes("gota")) dosisML = dosisML / 20;
            
            const factor = window.obtenerFactorFrecuenciaFront(posoTexto);
            const consumoDiario = dosisML * factor;
            const consumoTotal = consumoDiario * diasADespachar;

            if (consumoTotal > 0) {
                haySaldos = true;
                let saldoPrevio = saldosGuardados[liqName] !== undefined ? saldosGuardados[liqName] : 0;
                let balanceActual = saldoPrevio;
                let diasDuracionUnFrasco = Math.floor(liqData.total / consumoDiario);

                for (let d = colActiva; d < limiteColumnas; d++) {
                    if (d > 9) break;
                    let celdaDia = inputs[5 + d];
                    if (!celdaDia) break;
                    if (celdaDia.dataset.manual === "true") { balanceActual -= consumoTotal; continue; }

                    if (balanceActual < consumoTotal) {
                        let faltante = consumoTotal - balanceActual;
                        let frascos = Math.ceil(faltante / liqData.total);
                        celdaDia.value = frascos;
                        celdaDia.style.color = "var(--text-main)";
                        balanceActual += (frascos * liqData.total);
                    } else {
                        celdaDia.value = "T";
                        celdaDia.style.color = "#0277bd"; 
                    }
                    celdaDia.style.fontWeight = "900";
                    balanceActual -= consumoTotal;
                    window.syncCheckUI(celdaDia);
                }
                for (let d = limiteColumnas; d < 10; d++) { if (inputs[5 + d] && inputs[5 + d].dataset.manual !== "true") { inputs[5 + d].value = ""; window.syncCheckUI(inputs[5 + d]); } }
                window.nuevosSaldosParaManana[liqName] = balanceActual;

                htmlSaldos += `
                  <div class="nutricion-item" style="border-left: 4px solid #0277bd; display:block;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="nutricion-info" style="text-transform:uppercase;"><span class="material-icons-round" style="font-size:12px; color:#0277bd; margin-right:4px;">water_drop</span>${liqName}</span>
                        <div style="font-size:11px; color:var(--text-muted); display:flex; align-items:center; gap:5px;">
                            Saldo: 
                            <input type="number" class="input-saldo-manual" data-clave="${liqName}" value="${Math.round(saldoPrevio)}" style="width:60px; font-size:12px; padding:3px; border-radius:4px; border:1px solid var(--glass-border); background:rgba(0,0,0,0.2); color:var(--text-main); text-align:center;">
                        </div>
                    </div>
                    <div style="margin-top: 10px; display:flex; justify-content:space-between; align-items:flex-end;">
                        <div>
                            <span class="nutricion-vol" style="color:var(--text-muted);">Gasto: ${Math.round(consumoDiario*10)/10} mL / día</span>
                            <span class="nutricion-vol" style="color:#0277bd; font-weight:bold; margin-top:3px; font-size: 13px;">Queda para mañana: ${Math.round(balanceActual)} mL</span>
                        </div>
                        <span style="font-size:10px; font-weight:bold; color:var(--text-muted); text-align:right;">1 frasco (${liqData.total} mL) dura<br><b style="font-size:16px; color:var(--accent-blue);">${diasDuracionUnFrasco}</b> días</span>
                    </div>
                  </div>`;
            }
        }
        else if (esNutricion || esSuero) {
            let dosisNum = parseFloat(dosisTexto.match(/(\d+(\.\d+)?)/)?.[1]) || 0;
            let factor = window.obtenerFactorFrecuenciaFront(posoTexto);
            let esGoteo = posoTexto.includes("c/h") || posoTexto.includes("ml/h") || posoTexto.includes("cc/h");
            let volumenDiarioML = (factor === 24 || esGoteo) ? dosisNum * 24 : dosisNum * factor;
            let volumenTotalML = volumenDiarioML * diasADespachar;

            let capMatraz = 1000;
            let capRegex = medNombre.match(/(1000|500|250|100|20|5)\s*(ml|cc)/i);
            if (capRegex) capMatraz = parseInt(capRegex[1]);
            else if (medNombre.includes("2200")) capMatraz = 2053; 
            else if (medNombre.includes("1800")) capMatraz = 1500; 
            else if (medNombre.includes("1300")) capMatraz = 1904; 

            if (volumenTotalML > 0) {
                haySaldos = true;
                let frascosPorDia = Math.ceil(volumenTotalML / capMatraz) || 1;
                let sobranteDiario = (frascosPorDia * capMatraz) - volumenTotalML;
                let tituloBadge = esNutricion ? "24 HRS HANG TIME" : "INFUSIÓN CONTINUA";
                let colorBadge = esNutricion ? "#ff9800" : "#40c4ff";
                
                for (let d = colActiva; d < limiteColumnas; d++) {
                    if (d > 9) break;
                    let celdaDia = inputs[5 + d]; 
                    if (celdaDia && celdaDia.dataset.manual !== "true") {
                        celdaDia.value = frascosPorDia;
                        celdaDia.style.color = "var(--text-main)";
                        celdaDia.style.fontWeight = "900";
                        window.syncCheckUI(celdaDia);
                    }
                }
                for (let d = limiteColumnas; d < 10; d++) { if (inputs[5 + d] && inputs[5 + d].dataset.manual !== "true") { inputs[5 + d].value = ""; window.syncCheckUI(inputs[5 + d]); } }

                htmlSaldos += `
                  <div class="nutricion-item" style="border-left: 4px solid ${colorBadge}; display:block;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="nutricion-info" style="text-transform:uppercase;">${medNombre}</span>
                        <span class="badge" style="background:${colorBadge}; color:white; font-size:9px; padding:3px 6px; border-radius:4px;">${tituloBadge}</span>
                    </div>
                    <div style="margin-top: 10px; display:flex; justify-content:space-between; align-items:flex-end;">
                        <div>
                            <span class="nutricion-vol" style="color:var(--text-muted);">Gasto Diario: ${Math.round(volumenDiarioML)} mL</span>
                            <span class="nutricion-vol" style="color:var(--accent-red); font-weight:bold; margin-top:3px; font-size: 13px;">Desechar: ${Math.round(sobranteDiario)} mL / día</span>
                        </div>
                        <span style="font-size:10px; font-weight:bold; color:var(--accent-blue); text-align:right;">Matraces / Día<br><b style="font-size:16px;">${frascosPorDia}</b></span>
                    </div>
                  </div>`;
            }
        }
    });

    if (haySaldos) {
        contenedorSaldos.innerHTML = htmlSaldos;
        document.querySelectorAll(".input-saldo-manual").forEach(input => {
            input.addEventListener("change", function() {
                const clave = this.getAttribute("data-clave");
                const val = parseFloat(this.value) || 0;
                let rutActual = document.getElementById("rut").value.trim() || ((document.getElementById("servicio").value || "sin") + "_" + (document.getElementById("cama").value || "sincama"));
                let saldos = JSON.parse(localStorage.getItem("saldos_" + rutActual)) || {};
                saldos[clave] = val; 
                localStorage.setItem("saldos_" + rutActual, JSON.stringify(saldos));
                window.actualizarSaldosYSidebar(); 
                window.programarAutoguardado();
            });
        });
    } else {
        contenedorSaldos.innerHTML = `
          <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px; line-height: 1.5;">
            <span class="material-icons-round" style="font-size: 32px; color: var(--glass-border); margin-bottom: 10px;">science</span><br>
            Escriba un fármaco multidosis o líquido oral para monitorear sus saldos en tiempo real.
          </div>`;
    }
    
    window.actualizarSidebarPendientes();
};

window.guardarSaldosParaManana = function() {
    let rut = document.getElementById("rut").value.trim() || ((document.getElementById("servicio").value || "sin") + "_" + (document.getElementById("cama").value || "sincama"));
    let saldos = JSON.parse(localStorage.getItem("saldos_" + rut)) || {};
    if (window.nuevosSaldosParaManana) {
        for (let clave in window.nuevosSaldosParaManana) saldos[clave] = window.nuevosSaldosParaManana[clave];
    }
    localStorage.setItem("saldos_" + rut, JSON.stringify(saldos));
};

// ============================================================================
// 7. AUTOMATIZACIÓN DE NUEVO DÍA (BOTÓN ▶)
// ============================================================================
window.iniciarNuevoDiaWeb = function(colIndex) {
    const headersFecha = document.querySelectorAll(".header-fecha");
    const inputHeader = headersFecha[colIndex];
    if (!inputHeader) return;

    if (colIndex > 0) window.guardarSaldosParaManana();

    const hoy = new Date();
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    inputHeader.value = `${hoy.getDate()}-${meses[hoy.getMonth()]}`;

    if (colIndex > 0) {
        const filas = document.querySelectorAll("#grillaFila tr");
        filas.forEach(fila => {
            const inputs = fila.querySelectorAll("input");
            const nombreMed = inputs[0].value.trim().toLowerCase();
            if (!nombreMed) return; 
            
            const inputAyer = inputs[5 + colIndex - 1]; 
            const inputHoy = inputs[5 + colIndex];
            
            if (inputAyer && inputHoy) {
                const posoTexto = inputs[3].value.trim().toLowerCase();
                const es48h = posoTexto.includes("48h");
                const es72h = posoTexto.includes("72h");

                // Interceptor de Albúmina > 3 días en UPC
                const esAlbumina = nombreMed.includes("albumina") || nombreMed.includes("albúmina");
                const servicioActual = (document.getElementById("servicio").value || "").toLowerCase();
                const esUciUti = servicioActual === "uci" || servicioActual === "uti";

                if (esAlbumina && esUciUti) {
                    let diasConAlbumina = 0;
                    for (let d = 0; d < colIndex; d++) {
                        if (inputs[5 + d].value.trim() !== "") diasConAlbumina++;
                    }
                    const firmaAlbumina = `${fila.dataset.row}|${nombreMed}`;
                    const estadoAlm = window.medicamentosPendientes[firmaAlbumina]?.estado;

                    if (diasConAlbumina >= 3 && estadoAlm !== "ACEPTADO") {
                        inputHoy.value = "";
                        setTimeout(() => { inputs[3].dispatchEvent(new Event("change", { bubbles: true })); }, 50);
                        return;
                    }
                }

                const diccEspeciales = ["heparina", "salbutamol", "ipratropio", "brexotide", "budesonida", "fluticasona", "formoterol", "tiotropio", "olodaterol", "nph", "glargina", "cristalina", "diben", "fresubin", "survimed", "jevity", "osmolite", "smofkabiven", "smoflipid", "glucerna", "sodio cloruro", "nacl", "glucosa", "glucosalino", "ringer", "sodio bicarbonato 2/3 molar 250 ml", "cloramfenicol", "lagrima", "lágrima", "pilocarpina", "proparacaina", "proparacaína", "dorzolamida", "latanoprost", "tobramicina"];
                let medLimpio = window.quitarTildes(nombreMed);
                let isJarabe = Object.keys(DB_LIQUIDOS).some(k => medLimpio.includes(window.quitarTildes(k.toLowerCase())));
                const esEspecial = diccEspeciales.some(m => nombreMed.includes(m)) || isJarabe;

                if (!esEspecial) {
                    const esCarga = posoTexto === "carga"; 
                    const dosisTexto = inputs[2].value.trim().toLowerCase(); 
                    const esPomada = dosisTexto.includes("aplicar") || ["nistatina 10", "mometasona", "clotrimazol", "mupirocina", "hidrocortisona 1%", "crema", "pomada", "unguento"].some(s => medLimpio.includes(window.quitarTildes(s))) || inputs[1].value.trim().toLowerCase() === "top";

                    if (esCarga || esPomada) {
                        inputHoy.value = "";
                    } else if (es48h || es72h) {
                        let diasDesdeUltimaDosis = 0;
                        let ultimaDosisValor = "";
                        for (let i = colIndex - 1; i >= 0; i--) {
                            let val = inputs[5 + i].value.trim();
                            diasDesdeUltimaDosis++;
                            let num = parseFloat(val);
                            if (val !== "" && !isNaN(num) && num > 0) {
                                ultimaDosisValor = val; 
                                break;
                            }
                        }
                        if (es48h && diasDesdeUltimaDosis === 2 && ultimaDosisValor !== "") {
                            inputHoy.value = ultimaDosisValor.replace("✓", "").trim(); window.syncCheckUI(inputHoy);
                        } else if (es72h && diasDesdeUltimaDosis === 3 && ultimaDosisValor !== "") {
                            inputHoy.value = ultimaDosisValor.replace("✓", "").trim(); window.syncCheckUI(inputHoy);
                        } else {
                            inputHoy.value = ""; window.syncCheckUI(inputHoy);
                        }
                    } else {
                        if (inputAyer.value.trim() !== "") {
                            inputHoy.value = inputAyer.value.replace("✓", "").trim(); window.syncCheckUI(inputHoy);
                        }
                    }
                }
            }
        });
    }

    window.actualizarSaldosYSidebar();
    window.escanearRestringidos();
    window.programarAutoguardado();

    inputHeader.style.background = "var(--accent-green)";
    inputHeader.style.color = "#000";
    setTimeout(() => {
        inputHeader.style.background = "transparent";
        inputHeader.style.color = "var(--accent-blue)";
    }, 800);
};

// ============================================================================
// 8. ESCÁNERES CLÍNICOS CDSS (SOBREDOSIS, ALERGIAS, INTERACCIONES, RESTRINGIDOS)
// ============================================================================
window.evaluarCDSSLocal = function(fila, medTexto, posoTexto, totalDiarioUnidades, dosisTexto, silencioso = false) {
    const celdaResultado = fila.querySelectorAll("input")[4];
    const contenedorAlerta = fila.querySelector(".mensaje-reaccion");
    const rowId = fila.dataset.row;
    const firmaSD = `${rowId}|${medTexto.toUpperCase()}`;

    celdaResultado.classList.remove("alerta-sobredosis");
    celdaResultado.style.color = "var(--text-main)";
    celdaResultado.style.fontWeight = "bold";
    if (contenedorAlerta) contenedorAlerta.style.display = "none";

    if (posoTexto === "c/h" || posoTexto.includes("min") || posoTexto === "carga" || dosisTexto.includes("puff") || dosisTexto.includes("gota")) {
        celdaResultado.value = "✅ OK";
        celdaResultado.style.color = "var(--accent-green)";
        return;
    }

    if (window.datosGlobales && window.datosGlobales.catalogo) {
        const medLimpio = window.quitarTildes(medTexto.toLowerCase().trim());
        const dataCDSS = window.datosGlobales.catalogo.find(m => {
            const catLimpio = window.quitarTildes((m.medicamento || "").toLowerCase().trim());
            return catLimpio === medLimpio || (catLimpio && medLimpio.includes(catLimpio));
        });

        if (dataCDSS) {
            const dosisNum = window.extraerSoloNumero(dosisTexto);
            const factor = window.obtenerFactorFrecuenciaFront(posoTexto);
            const mgDiarios = dosisNum * factor;
            const maxDosisNum = window.extraerSoloNumero(String(dataCDSS.dosisMaxima));

            if (!isNaN(maxDosisNum) && maxDosisNum > 0 && mgDiarios > maxDosisNum) {
                if (window.sobredosisValidadas.has(firmaSD)) {
                    celdaResultado.value = "✅ VAL.";
                    celdaResultado.style.color = "var(--accent-green)";
                    return;
                }
                celdaResultado.classList.add("alerta-sobredosis");
                celdaResultado.value = "⚠️ SOBREDOSIS";
                if (contenedorAlerta) {
                    contenedorAlerta.innerHTML = "⚠️ ALERTA: " + dataCDSS.alertaSobredosis;
                    contenedorAlerta.style.background = "#ff5252"; 
                    contenedorAlerta.style.display = "block";
                }
                
                if (!silencioso && !window.alertasEmitidas.has(firmaSD)) {
                    window.alertasEmitidas.add(firmaSD);
                    window.tipoAlertaActual = "SOBREDOSIS";
                    window.filaAlertaActiva = rowId;
                    window.mostrarModalAlerta(medTexto, dataCDSS.alertaSobredosis);
                }
                return; 
            } else {
                window.alertasEmitidas.delete(firmaSD);
            }
        }
    }
    celdaResultado.value = "✅ OK";
    celdaResultado.style.color = "var(--accent-green)";
};

window.escanearAlergias = function() {
    const inputAlergia = document.getElementById("alergiaPaciente");
    if (!inputAlergia) return;
    
    const alergiaValRaw = inputAlergia.value.trim().toLowerCase();
    const listaAlergias = alergiaValRaw.split(/,|\s+y\s+|-/)
        .map(a => window.quitarTildes(a.trim()))
        .filter(a => a.length > 2 && !["ninguna", "no conoce", "negativo", "n/a", "no refiere"].includes(a));

    const familiasAlergias = {
        "penicilina": ["amoxicilina", "ampicilina", "cloxacilina", "piperacilina", "penicilina", "amoxi"],
        "aines": ["ketorolaco", "ibuprofeno", "naproxeno", "diclofenaco", "ketoprofeno", "meloxicam", "celecoxib", "aspirina", "acetilsalicilico"],
        "cefalosporinas": ["cefazolina", "ceftriaxona", "cefotaxima", "ceftazidima", "cefadroxilo", "cefepime"],
        "sulfas": ["cotrimoxazol", "sulfametoxazol", "sulfadiazina"]
    };

    const filas = document.querySelectorAll("#grillaFila tr");

    filas.forEach(fila => {
        const inputNombre = fila.querySelector('input[data-lista="nombres"]');
        const celdaResultado = fila.querySelectorAll("input")[4];
        const contenedorAlerta = fila.querySelector(".mensaje-reaccion");
        if (!inputNombre || !celdaResultado || !inputNombre.value.trim()) return;
        
        const nombreMed = window.quitarTildes(inputNombre.value.trim().toLowerCase());
        const firmaAlergia = `${fila.dataset.row}|ALERGIA|${nombreMed}`;
        if (celdaResultado.value.includes("✅ AUTORIZADO")) return;

        let alergiaDetectada = null;
        let esCruceFamiliar = false;

        if (listaAlergias.length > 0) {
            alergiaDetectada = listaAlergias.find(al => nombreMed.includes(al) || al.includes(nombreMed));
            if (!alergiaDetectada) {
                for (let al of listaAlergias) {
                    for (let familia in familiasAlergias) {
                        if (al.includes(familia) || familia.includes(al)) {
                            if (familiasAlergias[familia].some(f => nombreMed.includes(f))) {
                                alergiaDetectada = familia;
                                esCruceFamiliar = true;
                                break;
                            }
                        }
                    }
                    if (alergiaDetectada) break;
                }
            }
        }

        if (alergiaDetectada) {
            celdaResultado.classList.add("alerta-alergia", "alerta-sobredosis"); 
            celdaResultado.value = "⚠️ ALERGIA";
            celdaResultado.style.color = "#ff5252";
            
            let msgAlerta = esCruceFamiliar ? `<b>ALERGIA CRUZADA:</b> Familia ${alergiaDetectada.toUpperCase()}` : `<b>ALERGIA DEL PACIENTE:</b> ${alergiaDetectada.toUpperCase()}`;
            if (contenedorAlerta) {
                contenedorAlerta.innerHTML = msgAlerta;
                contenedorAlerta.style.background = "#d93025";
                contenedorAlerta.style.display = "block";
            }

            if (!window.isCargandoPerfil && !window.alertasEmitidas.has(firmaAlergia) && !document.getElementById("modal-overlay").classList.contains("show")) {
                window.alertasEmitidas.add(firmaAlergia);
                window.tipoAlertaActual = "ALERGIA";
                window.filaAlertaActiva = fila.dataset.row;
                window.datosAlergiaActiva = { medicamento: inputNombre.value, alergia: alergiaDetectada };
                window.mostrarModalAlergia(inputNombre.value, alergiaDetectada, esCruceFamiliar);
            }
        } else if (celdaResultado.value === "⚠️ ALERGIA") {
            celdaResultado.classList.remove("alerta-alergia", "alerta-sobredosis");
            celdaResultado.value = "✅ OK";
            celdaResultado.style.color = "var(--accent-green)";
            if (contenedorAlerta) contenedorAlerta.style.display = "none";
        }
    });
};

window.escanearInteraccionesGlobales = function() {
    if (!window.datosGlobales || !window.datosGlobales.matrizInteracciones) return;
    const filas = document.querySelectorAll("#grillaFila tr");
    let medsEnGrilla = [];
    
    filas.forEach(fila => {
        const inputNombre = fila.querySelector('input[data-lista="nombres"]');
        const nombreMed = inputNombre.value.trim().toUpperCase();
        if (nombreMed) {
            medsEnGrilla.push({ nombreCompleto: nombreMed, rowId: fila.dataset.row, celdaAlerta: fila.querySelectorAll("input")[4] });
        }
    });

    if (medsEnGrilla.length < 2) return;
    const matriz = window.datosGlobales.matrizInteracciones;
    let modalAbierto = false;

    for (let i = 0; i < medsEnGrilla.length; i++) {
        for (let j = i + 1; j < medsEnGrilla.length; j++) {
            const m1 = medsEnGrilla[i]; const m2 = medsEnGrilla[j];
            const firmaCruce = [m1.nombreCompleto, m2.nombreCompleto].sort().join("|");
            if (window.interaccionesValidadas.has(firmaCruce)) continue;

            const alerta = matriz.find(int => 
                (m1.nombreCompleto.includes((int.medA || "").toUpperCase()) && m2.nombreCompleto.includes((int.medB || "").toUpperCase())) ||
                (m1.nombreCompleto.includes((int.medB || "").toUpperCase()) && m2.nombreCompleto.includes((int.medA || "").toUpperCase()))
            );

            if (alerta) {
                m1.celdaAlerta.classList.add("alerta-interaccion");
                if (!m1.celdaAlerta.value.includes("CRUCE")) m1.celdaAlerta.value = "⚠️ CRUCE";
                m1.celdaAlerta.nextElementSibling.innerHTML = `<b>CRUCE:</b> ${alerta.medA} + ${alerta.medB}`;
                m1.celdaAlerta.nextElementSibling.style.background = "#ff9800";

                m2.celdaAlerta.classList.add("alerta-interaccion");
                if (!m2.celdaAlerta.value.includes("CRUCE")) m2.celdaAlerta.value = "⚠️ CRUCE";
                m2.celdaAlerta.nextElementSibling.innerHTML = `<b>CRUCE:</b> ${alerta.medA} + ${alerta.medB}`;
                m2.celdaAlerta.nextElementSibling.style.background = "#ff9800";
                
                if (!window.isCargandoPerfil && !modalAbierto && !window.alertasEmitidas.has(firmaCruce) && !document.getElementById("modal-overlay").classList.contains("show")) {
                    window.alertasEmitidas.add(firmaCruce);
                    window.tipoAlertaActual = "INTERACCION"; 
                    window.datosInteraccionActiva = { m1, m2, alerta };
                    window.mostrarModalInteraccion(alerta);
                    modalAbierto = true;
                }
            }
        }
    }
};

window.escanearRestringidos = function() {
    const filas = document.querySelectorAll("#grillaFila tr");
    const firmasActivas = new Set(); 
    const servicioActual = (document.getElementById("servicio").value || "").toLowerCase();
    const esUciUti = servicioActual === "uci" || servicioActual === "uti";
    
    const diagnosticoTexto = (document.getElementById("diagnostico").value || "").toLowerCase();
    const esPacienteOncologico = /\b(ca|cáncer|cancer|oncologia|oncología)\b/.test(diagnosticoTexto);
    const esFallaRenal = /\b(falla renal|insuficiencia renal|irc|ira|enfermedad renal)\b/i.test(diagnosticoTexto);

    let requiereActualizarSidebar = false;

    filas.forEach(fila => {
        const rowId = fila.dataset.row;
        const inputs = fila.querySelectorAll("input");
        const nombreMed = inputs[0].value.trim().toLowerCase();
        const posoTexto = inputs[3].value.trim();
        const celdaAlerta = inputs[4];

        if (!nombreMed || !posoTexto) return;

        let protocolo = null;
        let tipoRestriccion = "ESTANDAR";
        const firmaRestringido = `${rowId}|${nombreMed}`;

        let keyEncontrada = Object.keys(PROTOCOLOS_RESTRINGIDOS).find(k => nombreMed.includes(k));
        if (keyEncontrada) {
            if (!(PROTOCOLOS_RESTRINGIDOS[keyEncontrada].especialidad === "Psiquiatría" && servicioActual === "uce")) {
                protocolo = PROTOCOLOS_RESTRINGIDOS[keyEncontrada];
            }
        } 
        else if (esUciUti && (nombreMed.includes("albumina") || nombreMed.includes("albúmina"))) {
            let diasPrescritos = 0;
            for (let d = 0; d < 10; d++) { if (inputs[5 + d].value.trim() !== "") diasPrescritos++; }
            let estaEnMemoria = window.medicamentosPendientes[firmaRestringido]?.tipo === "ALBUMINA";
            if (diasPrescritos > 3 || estaEnMemoria) { 
                protocolo = { especialidad: "UPC (Extensión Día 4+)", medicos: ["Dra. Gil", "Dr. Moscoso", "Dr. Rodríguez"] };
                tipoRestriccion = "ALBUMINA";
            }
        }
        else if (nombreMed.includes("pregabalina")) {
            const libreEnServicio = servicioActual === "uci" || servicioActual === "uti" || servicioActual === "ucm";
            if (!libreEnServicio && !esPacienteOncologico) {
                protocolo = { especialidad: "Oncología / Equipo Médico", medicos: ["Equipo Médico", "Médico Tratante"] };
                tipoRestriccion = "PREGABALINA";
            }
        }
        else if (nombreMed.includes("hierro 100") || nombreMed.includes("baclofeno") || nombreMed.includes("banatrol")) {
            if (!(nombreMed.includes("hierro 100") && esFallaRenal)) {
                protocolo = { especialidad: "Orden de Compra Requerida", medicos: [] };
                tipoRestriccion = "ORDEN_COMPRA";
            }
        }

        if (protocolo) {
            firmasActivas.add(firmaRestringido);
            let estadoActual = window.medicamentosPendientes[firmaRestringido]?.estado;
            let memoriaOC = window.medicamentosPendientes[firmaRestringido]?.diasOC;

            let matchOC = posoTexto.match(/\[OC:\s*(\d+)\]/i);
            if (matchOC && tipoRestriccion === "ORDEN_COMPRA") {
                estadoActual = "ACEPTADO";
                memoriaOC = parseInt(matchOC[1]);
            }

            if (estadoActual) {
                window.medicamentosPendientes[firmaRestringido] = { estado: estadoActual, rowId, medicamento: nombreMed, especialidad: protocolo.especialidad, medicos: protocolo.medicos, tipo: tipoRestriccion, diasOC: memoriaOC };
                requiereActualizarSidebar = true;
            }
            
            estadoActual = window.medicamentosPendientes[firmaRestringido]?.estado;

            if (!estadoActual || estadoActual === "ESPERANDO_DECISION") {
                window.medicamentosPendientes[firmaRestringido] = { estado: "ESPERANDO_DECISION", rowId, medicamento: nombreMed, especialidad: protocolo.especialidad, medicos: protocolo.medicos, tipo: tipoRestriccion };
                celdaAlerta.classList.add("alerta-interaccion"); 
                if (!celdaAlerta.classList.contains("alerta-sobredosis")) {
                    celdaAlerta.value = tipoRestriccion === "ALBUMINA" ? "⚠️ EXTENSIÓN" : "⚠️ RESTRINGIDO";
                    celdaAlerta.style.color = "#ff9800";
                }
                if (!window.isCargandoPerfil && !window.alertasEmitidas.has(firmaRestringido) && !document.getElementById("modal-overlay").classList.contains("show")) {
                    window.alertasEmitidas.add(firmaRestringido);
                    window.mostrarModalRestringido(firmaRestringido);
                }
            } else if (estadoActual === "PENDIENTE") {
                celdaAlerta.classList.add("alerta-interaccion");
                celdaAlerta.value = "⏳ PENDIENTE";
                celdaAlerta.style.color = "#ff9800";
                requiereActualizarSidebar = true;
            } else if (estadoActual === "ACEPTADO") {
                celdaAlerta.classList.remove("alerta-interaccion");
                if (!celdaAlerta.classList.contains("alerta-sobredosis")) {
                    celdaAlerta.value = "✅ AUTORIZADO";
                    celdaAlerta.style.color = "var(--accent-green)";
                }
                if (tipoRestriccion === "ORDEN_COMPRA") {
                    let limiteOC = window.medicamentosPendientes[firmaRestringido].diasOC || 0;
                    let primeraCol = -1;
                    for (let d = 0; d < 10; d++) { if (inputs[5 + d] && inputs[5 + d].value.trim() !== "") { primeraCol = d; break; } }
                    if (primeraCol !== -1) {
                        for (let d = primeraCol + limiteOC; d < 10; d++) { if (inputs[5 + d]) inputs[5 + d].value = ""; }
                    }
                }
                requiereActualizarSidebar = true;
            }
        }
    });

    for (let firma in window.medicamentosPendientes) {
        if (!firmasActivas.has(firma)) delete window.medicamentosPendientes[firma]; 
    }
    let rutAct = document.getElementById("rut").value.trim() || ((document.getElementById("servicio").value || "sin") + "_" + (document.getElementById("cama").value || "sincama"));
    localStorage.setItem("pendientes_" + rutAct, JSON.stringify(window.medicamentosPendientes));
    if (requiereActualizarSidebar) window.actualizarSidebarPendientes();
};

window.actualizarSidebarPendientes = function() {
    const contenedor = document.getElementById("sidebar-saldos-content");
    if (!contenedor) return;
    let htmlPendientes = ""; let hayEspeciales = false;

    for (let firma in window.medicamentosPendientes) {
        const med = window.medicamentosPendientes[firma];
        if (med.estado === "PENDIENTE" || med.estado === "ACEPTADO") {
            hayEspeciales = true;
            let isAceptado = med.estado === "ACEPTADO";
            let colorBorde = isAceptado ? "var(--accent-green)" : "#ff9800";
            let bgFondo = isAceptado ? "rgba(0, 230, 118, 0.05)" : "rgba(255, 152, 0, 0.05)";
            let badgeColor = isAceptado ? "var(--accent-green)" : "#ff9800";
            let textoBadge = isAceptado ? "AUTORIZADO" : "PENDIENTE";
            let textoFooter = isAceptado ? `Aprobado: ${med.especialidad || 'Especialista'}` : `Requiere autorización Médica`;

            if (med.tipo === "ORDEN_COMPRA" && isAceptado) {
                textoFooter = `Orden de Compra: <b>${med.diasOC || 0} días</b> autorizados`;
            }

            let botonAccion = !isAceptado 
                ? `<button onclick="mostrarModalRestringido('${firma}')" style="background: #ff9800; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer;">RESOLVER</button>`
                : `<span class="material-icons-round" style="color:var(--accent-green); font-size:18px;">check_circle</span>`;

            htmlPendientes += `
              <div class="nutricion-item" style="border-left: 4px solid ${colorBorde}; display:block; background: ${bgFondo}; margin-bottom: 15px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="nutricion-info" style="text-transform:uppercase;">${med.medicamento}</span>
                    <span class="badge" style="background:${badgeColor}; color:white; font-size:9px; padding:3px 6px; border-radius:4px;">${textoBadge}</span>
                </div>
                <div style="margin-top: 10px; display:flex; justify-content:space-between; align-items:flex-end;">
                    <span style="font-size:11px; color:var(--text-muted);">${textoFooter}</span>
                    ${botonAccion}
                </div>
              </div>`;
        }
    }
    const divExistente = document.getElementById("panel-pendientes");
    if (divExistente) divExistente.remove();
    if (hayEspeciales) {
        const divEnv = document.createElement("div");
        divEnv.id = "panel-pendientes";
        divEnv.innerHTML = htmlPendientes;
        contenedor.insertBefore(divEnv, contenedor.firstChild);
    }
};

// ============================================================================
// 9. MODALES DE SEGURIDAD CLÍNICA Y GESTIÓN DE CAMAS
// ============================================================================
window.mostrarModalAlerta = function(medicamento, mensaje) {
    document.getElementById("modal-badge-tipo").textContent = "SOBREDOSIS";
    document.getElementById("modal-badge-tipo").style.background = "var(--accent-red)";
    document.querySelector(".modal-header .material-icons-round").textContent = "report_problem";
    document.querySelector(".modal-header .material-icons-round").style.color = "var(--accent-red)";
    document.getElementById("modal-titulo-principal").textContent = "ALERTA DE SEGURIDAD FARMACOLÓGICA";
    document.getElementById("modal-mensaje").innerHTML = `<b>Fármaco:</b> ${medicamento.toUpperCase()}<br><br><b>Consecuencia Clínica:</b><br>${mensaje}`;
    const overlay = document.getElementById("modal-overlay");
    overlay.style.display = "flex"; overlay.offsetHeight; overlay.classList.add("show");
};

window.mostrarModalAlergia = function(medicamento, alergia, esCruce) {
    document.getElementById("modal-badge-tipo").textContent = esCruce ? "ALERGIA CRUZADA" : "ALERGIA DETECTADA";
    document.getElementById("modal-badge-tipo").style.background = "#d93025";
    document.querySelector(".modal-header .material-icons-round").textContent = "dangerous";
    document.querySelector(".modal-header .material-icons-round").style.color = "#d93025";
    document.getElementById("modal-titulo-principal").textContent = "CONTRAINDICACIÓN CLÍNICA";
    let motivo = esCruce ? `El paciente es alérgico a la familia de las <b>${alergia.toUpperCase()}</b>.` : `El paciente registra alergia a <b>${alergia.toUpperCase()}</b>.`;
    document.getElementById("modal-mensaje").innerHTML = `<b style="color:#d93025;">Fármaco Indicado:</b> ${medicamento.toUpperCase()}<br><br><b>Peligro Clínico:</b><br>${motivo}<br>Se requiere autorización médica directa.`;
    document.getElementById("btn-aceptar-dosis").textContent = "AUTORIZAR ALERGIA";
    const overlay = document.getElementById("modal-overlay");
    overlay.style.display = "flex"; overlay.offsetHeight; overlay.classList.add("show");
};

window.mostrarModalInteraccion = function(alerta) {
    document.getElementById("modal-badge-tipo").textContent = "INTERACCIÓN " + (alerta.nivel || "CRÍTICA");
    document.getElementById("modal-badge-tipo").style.background = "#ff9800"; 
    document.querySelector(".modal-header .material-icons-round").textContent = "compare_arrows";
    document.querySelector(".modal-header .material-icons-round").style.color = "#ff9800";
    document.getElementById("modal-titulo-principal").textContent = "CRUCE PELIGROSO DETECTADO";
    document.getElementById("modal-mensaje").innerHTML = `<b style="color:#ff9800;">Fármacos:</b> ${alerta.medA} + ${alerta.medB}<br><br><b>Consecuencia Clínica:</b><br>${alerta.mensaje}`;
    const overlay = document.getElementById("modal-overlay");
    overlay.style.display = "flex"; overlay.offsetHeight; overlay.classList.add("show");
};

window.mostrarModalRestringido = function(firma) {
    const data = window.medicamentosPendientes[firma];
    if (!data) return;
    document.getElementById("modal-badge-tipo").textContent = data.tipo === "ALBUMINA" ? "PROTOCOLO DE EXTENSIÓN" : "USO RESTRINGIDO";
    document.getElementById("modal-badge-tipo").style.background = "#ff9800";
    document.querySelector(".modal-header .material-icons-round").textContent = "lock";
    document.querySelector(".modal-header .material-icons-round").style.color = "#ff9800";
    document.getElementById("modal-titulo-principal").textContent = "MEDICAMENTO SUJETO A PROTOCOLO";

    const contenedorMensaje = document.getElementById("modal-mensaje");
    if (data.tipo === "ORDEN_COMPRA") {
        contenedorMensaje.innerHTML = `<b style="color:#ff9800;">Fármaco:</b> ${data.medicamento.toUpperCase()}<br><br>Requiere el ingreso de una <b>Orden de Compra (OC)</b> vigente. Indique abajo por cuántos días está autorizada.`;
    } else {
        contenedorMensaje.innerHTML = `<b style="color:#ff9800;">Fármaco:</b> ${data.medicamento.toUpperCase()}<br><br>Requiere autorización exclusiva por <b>${data.especialidad}</b>.`;
    }

    const panelDoctor = document.querySelector(".modal-doctor-panel");
    if (data.tipo === "ORDEN_COMPRA") {
        panelDoctor.innerHTML = `
            <label style="color: var(--accent-blue); text-align: center;">Duración de la Orden de Compra (Días Autorizados)</label>
            <div class="modal-row-inputs" style="justify-content: center;">
                <input type="number" id="modal-diasOC" placeholder="Ej: 30" min="1" autocomplete="off" style="text-align: center; font-size: 24px; max-width: 150px; border-bottom: 2px solid var(--accent-green);">
            </div>`;
        document.getElementById("btn-aceptar-dosis").textContent = "REGISTRAR OC";
    } else {
        panelDoctor.innerHTML = `
            <label>Médico que Autoriza</label>
            <div class="modal-row-inputs">
                <input type="text" id="modal-medNombre" list="medicosList" placeholder="Escriba nombre del médico..." onchange="autoCompletarRut()" autocomplete="off">
                <input type="text" id="modal-medRut" placeholder="RUT del médico">
            </div>
            <datalist id="medicosList"></datalist>`;
        const dlMedicos = document.getElementById("medicosList");
        (data.medicos.length > 0 ? data.medicos : window.medicosData.map(m => m.nombre)).forEach(m => dlMedicos.appendChild(new Option(m, m)));
        document.getElementById("btn-aceptar-dosis").textContent = "AUTORIZAR";
    }

    let btnPendiente = document.getElementById("btn-dejar-pendiente");
    if (!btnPendiente) {
        btnPendiente = document.createElement("button");
        btnPendiente.id = "btn-dejar-pendiente";
        btnPendiente.className = "btn-entendido modal-btn"; 
        btnPendiente.style.cssText = "background: rgba(255, 193, 7, 0.15) !important; border: 1px solid #ffc107 !important; color: #ffc107 !important; margin: 0 10px; font-weight: 900;";
        const accionesModal = document.querySelector("#modal-overlay .modal-actions");
        if (accionesModal) accionesModal.insertBefore(btnPendiente, accionesModal.querySelector(".btn-entendido"));
    }
    btnPendiente.textContent = "DEJAR PENDIENTE";
    btnPendiente.style.display = "block";
    btnPendiente.onclick = function() {
        window.medicamentosPendientes[firma].estado = "PENDIENTE";
        window.actualizarSidebarPendientes();
        window.resetearCerrarModal();
    };

    window.tipoAlertaActual = "RESTRINGIDO";
    window.filaAlertaActiva = firma;
    const overlay = document.getElementById("modal-overlay");
    overlay.style.display = "flex"; overlay.offsetHeight; overlay.classList.add("show");
};

window.resetearCerrarModal = function() {
    const overlay = document.getElementById("modal-overlay"); 
    overlay.classList.remove("show");
    setTimeout(() => { overlay.style.display = "none"; }, 300);

    const panelDoctor = document.querySelector(".modal-doctor-panel");
    if (panelDoctor) {
        panelDoctor.innerHTML = `
            <label>Médico que Autoriza (Buscador Columnas AU/AV)</label>
            <div class="modal-row-inputs">
                <input type="text" id="modal-medNombre" list="medicosList" placeholder="Escriba nombre del médico..." onchange="autoCompletarRut()" autocomplete="off">
                <input type="text" id="modal-medRut" placeholder="RUT del médico">
            </div>
            <datalist id="medicosList"></datalist>`;
    }
    const dlMedicos = document.getElementById("medicosList");
    if (dlMedicos && window.medicosData) window.medicosData.forEach(m => dlMedicos.appendChild(new Option(m.nombre, m.nombre)));

    document.getElementById("btn-aceptar-dosis").textContent = "DOSIS ACEPTADA";
    document.getElementById("btn-aceptar-dosis").disabled = false;
    const btnPendiente = document.getElementById("btn-dejar-pendiente");
    if (btnPendiente) btnPendiente.style.display = "none";
};

window.autoCompletarRut = function() {
    const inputMed = document.getElementById("modal-medNombre");
    if (!inputMed) return;
    const nombre = inputMed.value.toUpperCase();
    if (window.medicosData) {
        const encontrado = window.medicosData.find(m => m.nombre.toUpperCase() === nombre);
        if (encontrado && document.getElementById("modal-medRut")) {
            document.getElementById("modal-medRut").value = encontrado.rut;
        }
    }
};

document.getElementById("btn-aceptar-dosis").onclick = function() {
    const inputNombre = document.getElementById("modal-medNombre");
    const nombreMed = inputNombre ? inputNombre.value.trim().toUpperCase() : "";

    if (window.tipoAlertaActual !== "RESTRINGIDO" || (window.tipoAlertaActual === "RESTRINGIDO" && window.medicamentosPendientes[window.filaAlertaActiva]?.tipo !== "ORDEN_COMPRA")) {
        if (!nombreMed) { alert("⚠️ Ingrese el médico que autoriza."); return; }
    }

    if (window.tipoAlertaActual === "SOBREDOSIS") {
        const filaUI = document.querySelector(`tr[data-row="${window.filaAlertaActiva}"]`);
        if (filaUI) {
            let inputs = filaUI.querySelectorAll("input");
            inputs[4].classList.remove("alerta-sobredosis");
            inputs[4].value = "✅ VAL."; inputs[4].style.color = "var(--accent-green)";
            window.sobredosisValidadas.add(`${window.filaAlertaActiva}|${inputs[0].value.trim().toUpperCase()}`);
        }
    } else if (window.tipoAlertaActual === "INTERACCION" && window.datosInteraccionActiva) {
        let c1 = window.datosInteraccionActiva.m1.celdaAlerta;
        let c2 = window.datosInteraccionActiva.m2.celdaAlerta;
        c1.classList.remove("alerta-interaccion"); c2.classList.remove("alerta-interaccion");
        c1.value = "✅ AUTORIZADO"; c2.value = "✅ AUTORIZADO";
        c1.style.color = "var(--accent-green)"; c2.style.color = "var(--accent-green)";
        const firmaCruce = [window.datosInteraccionActiva.m1.nombreCompleto, window.datosInteraccionActiva.m2.nombreCompleto].sort().join("|");
        window.interaccionesValidadas.add(firmaCruce);
    } else if (window.tipoAlertaActual === "ALERGIA") {
        const filaUI = document.querySelector(`tr[data-row="${window.filaAlertaActiva}"]`);
        if (filaUI) {
            let inputResultado = filaUI.querySelectorAll("input")[4];
            inputResultado.classList.remove("alerta-alergia", "alerta-sobredosis");
            inputResultado.value = "✅ AUTORIZADO";
            inputResultado.style.color = "var(--accent-green)";
            if (inputResultado.nextElementSibling) inputResultado.nextElementSibling.style.display = "none";
        }
    } else if (window.tipoAlertaActual === "RESTRINGIDO") {
        const firma = window.filaAlertaActiva;
        const pendingData = window.medicamentosPendientes[firma];
        const rowId = firma.split('|')[0];
        const filaUI = document.querySelector(`tr[data-row="${rowId}"]`);

        if (pendingData.tipo === "ORDEN_COMPRA") {
            const inputOC = document.getElementById("modal-diasOC");
            if (!inputOC || !inputOC.value || parseInt(inputOC.value) <= 0) {
                alert("⚠️ Ingrese una cantidad de días válida para la Orden de Compra.");
                return;
            }
            let limite = parseInt(inputOC.value);
            pendingData.diasOC = limite;
            if (filaUI) {
                const posoInput = filaUI.querySelectorAll("input")[3];
                posoInput.value = posoInput.value.replace(/\s*\[OC:\s*\d+\]/ig, "") + ` [OC:${limite}]`;
            }
        }
        pendingData.estado = "ACEPTADO";
        if (filaUI) {
            let inputs = filaUI.querySelectorAll("input");
            inputs[4].classList.remove("alerta-interaccion");
            inputs[4].value = "✅ AUTORIZADO"; inputs[4].style.color = "var(--accent-green)";
            inputs[3].dispatchEvent(new Event("change", { bubbles: true }));
        }
        window.actualizarSidebarPendientes();
    }

    window.resetearCerrarModal();
    window.programarAutoguardado();
};

// ============================================================================
// 10. ESCUCHADOR UNIFICADO DE LA GRILLA (VALIDACIÓN ESTRICTA + DEDUCCIÓN)
// ============================================================================
document.getElementById("grillaFila").addEventListener("change", function(e) {
    const celdaModificada = e.target;
    if (celdaModificada.tagName !== "INPUT") return;

    const fila = celdaModificada.closest("tr");
    const inputs = fila.querySelectorAll("input");
    const colIndex = Array.from(inputs).indexOf(celdaModificada);

    if (colIndex >= 5 && colIndex <= 14) {
        celdaModificada.dataset.manual = "true";
        window.actualizarSaldosYSidebar();
        window.programarAutoguardado();
        return;
    } else if (colIndex >= 0 && colIndex <= 3) {
        for (let d = 5; d <= 14; d++) { if (inputs[d]) delete inputs[d].dataset.manual; }
    }

    const rowId = fila.dataset.row; 
    let valorActual = celdaModificada.value.trim();
    let listId = celdaModificada.getAttribute("data-lista");

    // Rescate de etiqueta [OC:XX]
    let tagOC = "";
    if (listId === "posologias") {
        const matchTag = valorActual.match(/(\s*\[OC:\s*\d+\])/i);
        if (matchTag) {
            tagOC = matchTag[1];
            valorActual = valorActual.replace(tagOC, "").trim();
        }
        if (/^\d+$/.test(valorActual)) {
            valorActual += "h";
            celdaModificada.value = valorActual + tagOC;
        }
    }

    // Autolimpieza si borran el fármaco
    const celdaResultado = inputs[4]; 
    const contenedorAlerta = fila.querySelector(".mensaje-reaccion");
    if (!inputs[0].value.trim()) {
        if (inputs[1]) inputs[1].value = ""; 
        if (inputs[2]) inputs[2].value = ""; 
        if (inputs[3]) inputs[3].value = ""; 
        celdaResultado.value = ""; 
        celdaResultado.classList.remove("alerta-sobredosis", "alerta-interaccion", "alerta-alergia");
        if (contenedorAlerta) contenedorAlerta.style.display = "none";
        for (let d = 0; d < 10; d++) { if (inputs[5 + d]) { inputs[5 + d].value = ""; window.syncCheckUI(inputs[5 + d]); } }
        window.actualizarSaldosYSidebar();
        window.escanearInteraccionesGlobales();
        window.escanearAlergias();
        window.escanearRestringidos();
        window.programarAutoguardado();
        return;
    }

    // Validación y deducción inteligente de unidades
    if (valorActual !== "" && listId && window.datosGlobales) {
        let arrayOpciones = window.datosGlobales[listId] ? [...window.datosGlobales[listId]] : [];
        if (listId === "dosis") {
            arrayOpciones = window.generarOpcionesDosisInteligentes(inputs[0].value, inputs[1].value, arrayOpciones);
        }

        if (arrayOpciones.length > 0) {
            const valorSinTildes = window.quitarTildes(valorActual.toLowerCase());
            let coincidencia = arrayOpciones.find(opt => window.quitarTildes(opt.toLowerCase()) === valorSinTildes) || 
                               arrayOpciones.find(opt => window.quitarTildes(opt.toLowerCase()).startsWith(valorSinTildes)) ||
                               arrayOpciones.find(opt => window.quitarTildes(opt.toLowerCase()).includes(valorSinTildes));
            
            if (coincidencia) { 
                celdaModificada.value = coincidencia + tagOC; 
            } else if (listId === "dosis") {
                let valorLimpio = valorActual.replace(/,/g, '.').trim();
                if (/^[\d.]+$/.test(valorLimpio)) {
                    const nombreMed = inputs[0].value.toLowerCase();
                    let unidadDeducida = "mg"; 
                    const inhaladores = ["salbutamol", "ipratropio", "budesonida", "formoterol", "fluticasona", "brexotide", "tiotropio", "olodaterol"];
                    const esNutricionOSuero = ["fresubin", "ensure", "osmolite", "survimed", "diben", "peptamen", "glucerna", "jevity", "smofkabiven", "smoflipid", "suero", "nacl", "sodio cloruro", "glucosa", "ringer", "sodio bicarbonato 2/3 molar 250 ml"].some(n => nombreMed.includes(n));
                    let esLiquidoOral = Object.keys(DB_LIQUIDOS).some(k => window.quitarTildes(nombreMed).includes(window.quitarTildes(k.toLowerCase())));
                    let esSobre = ["saccharomyces", "rehsal", "polietilenglicol", "banatrol"].some(s => nombreMed.includes(s));
                    const esOftalmico = ["cloramfenicol", "lagrima", "lágrima", "pilocarpina", "proparacaina", "proparacaína", "dorzolamida", "latanoprost", "tobramicina"].some(s => nombreMed.includes(s));
                    const esGotaOral = ["ferroso sulfato 125", "sulfato ferroso 125", "zinc", "tramadol", "vitamina acd", "acd", "biogaia", "risperidona 1 mg/ml"].some(s => nombreMed.includes(s));
                    const esPomada = ["nistatina 10", "mometasona", "clotrimazol", "mupirocina", "hidrocortisona 1%", "crema", "pomada", "unguento"].some(s => nombreMed.includes(s)) || inputs[1].value.toLowerCase() === "top";

                    if (inhaladores.some(inh => nombreMed.includes(inh))) unidadDeducida = "puff";
                    else if (esPomada) { valorLimpio = "Aplicar"; unidadDeducida = ""; }
                    else if (esOftalmico || esGotaOral) unidadDeducida = parseFloat(valorLimpio) > 1 ? "gotas" : "gota";
                    else if (esSobre) unidadDeducida = parseFloat(valorLimpio) > 1 ? "sobres" : "sobre";
                    else if (esLiquidoOral || esNutricionOSuero) unidadDeducida = "ml";
                    else if (nombreMed.includes("heparina") || nombreMed.includes("insulina")) unidadDeducida = "UI";
                    else {
                        const matchBase = nombreMed.match(/(\d+(?:\.\d+)?)\s*(mcg|mg|g|ui|u|meq)(?:\b|\/|-|$)/i);
                        if (matchBase) {
                            let u = matchBase[2].toLowerCase();
                            unidadDeducida = (u === "ui" || u === "u") ? "UI" : u;
                        }
                    }
                    celdaModificada.value = (valorLimpio + " " + unidadDeducida).trim();
                }
            } else {
                celdaModificada.value = ""; 
                celdaModificada.style.borderBottom = "2px solid var(--accent-red)"; 
                setTimeout(() => celdaModificada.style.borderBottom = "none", 1500);
                return; 
            }
        }
    }

    const medTexto = inputs[0].value.trim();
    const viaTexto = inputs[1].value.trim();
    const dosisTexto = inputs[2].value.trim();
    const posoTexto = inputs[3].value.trim();

    if (medTexto && posoTexto) {
        let colActiva = 0;
        const headersF = document.querySelectorAll(".header-fecha");
        for (let i = 0; i < 10; i++) { if (headersF[i].value.trim() !== "") colActiva = i; }

        const diasADespachar = parseInt(document.getElementById("inputDias").value) || 1;
        let totalDiarioUnidades = window.calcularDosisFila(medTexto, viaTexto, dosisTexto, posoTexto, diasADespachar, rowId);

        if (totalDiarioUnidades !== "") {
            let limiteColumnas = colActiva + 1;
            for (let d = colActiva; d < limiteColumnas; d++) {
                if (d > 9) break;
                let celdaDia = inputs[5 + d];
                if (celdaDia && celdaDia.dataset.manual !== "true" && (celdaDia.value === "" || !isNaN(celdaDia.value))) {
                    celdaDia.value = totalDiarioUnidades;
                    celdaDia.style.color = "var(--text-main)";
                    celdaDia.style.fontWeight = "900";
                    window.syncCheckUI(celdaDia);
                }
            }
            for (let d = limiteColumnas; d < 10; d++) { 
                if (inputs[5 + d] && inputs[5 + d].dataset.manual !== "true") {
                    inputs[5 + d].value = ""; 
                    window.syncCheckUI(inputs[5 + d]);
                }
            }
        }
        
        window.evaluarCDSSLocal(fila, medTexto, posoTexto, totalDiarioUnidades, dosisTexto, false);
        window.actualizarSaldosYSidebar();
        window.escanearInteraccionesGlobales();
        window.escanearAlergias();
        window.escanearRestringidos();
    }
    window.programarAutoguardado();
});

// ============================================================================
// 11. NAVEGACIÓN POR TECLADO (ENTER, TAB, FLECHAS) Y NORMALIZACIÓN DE TEXTO
// ============================================================================
// Navegación Enter en menú flotante y salto automático de celda
document.addEventListener("keydown", function(e) {
    const menuFlotante = document.getElementById("menu-flotante");
    if (menuFlotante && menuFlotante.style.display === "block") {
        const items = menuFlotante.querySelectorAll("div");
        
        if (e.key === "ArrowDown") { 
            e.preventDefault(); 
            window.opcionResaltadaIndex = (window.opcionResaltadaIndex + 1) % items.length; 
            window.actualizarResaltado(); 
        }
        else if (e.key === "ArrowUp") { 
            e.preventDefault(); 
            window.opcionResaltadaIndex = (window.opcionResaltadaIndex - 1 + items.length) % items.length; 
            window.actualizarResaltado(); 
        }
        else if (e.key === "Enter" || e.key === "Tab") { 
            if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); }
            const indexFinal = window.opcionResaltadaIndex > -1 ? window.opcionResaltadaIndex : 0;
            if (items[indexFinal]) window.seleccionarOpcion(items[indexFinal].textContent); 
            
            if (e.key === "Enter" && window.inputActivo) {
                const td = window.inputActivo.closest("td");
                const tr = window.inputActivo.closest("tr");
                if (td && tr) {
                    const colIndexActual = Array.from(tr.children).indexOf(td);
                    if (colIndexActual === 3) {
                        const nextRow = tr.nextElementSibling;
                        if (nextRow) {
                            const nextInput = nextRow.children[0].querySelector("input");
                            if (nextInput) setTimeout(() => nextInput.focus(), 50);
                        }
                    } else if (colIndexActual >= 0 && colIndexActual <= 2) {
                        const nextTd = tr.children[colIndexActual + 1];
                        const nextInput = nextTd.querySelector("input, select");
                        if (nextInput) setTimeout(() => nextInput.focus(), 50);
                    }
                }
            }
        }
        else if (e.key === "Escape") { 
            menuFlotante.style.display = "none"; 
        }
    }
});

// Navegación Enter en Cabecera del Paciente
const inputsPaciente = document.querySelectorAll('#alergiaPaciente, .patient-grid input:not([tabindex="-1"]), .patient-grid select:not([tabindex="-1"])');
inputsPaciente.forEach((input, index) => {
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            if (document.getElementById("menu-flotante").style.display === "block") return;
            e.preventDefault();
            const nextInput = inputsPaciente[index + 1];
            if (nextInput) {
                nextInput.focus();
            } else {
                const primerInputGrilla = document.querySelector('.med-grid tbody input');
                if (primerInputGrilla) primerInputGrilla.focus();
            }
        }
    });
});

// Navegación con Flechas y Enter en la Grilla Farmacológica
const tbodyGrilla = document.querySelector('.med-grid tbody');
if (tbodyGrilla) {
    tbodyGrilla.addEventListener('keydown', function(e) {
        const menuFlotanteVisible = document.getElementById("menu-flotante").style.display === "block";
        if (menuFlotanteVisible && (e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) return; 

        const teclasNavegacion = ['Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        if (!teclasNavegacion.includes(e.key)) return;

        const currentInput = e.target;
        if (currentInput.tagName !== 'INPUT' && currentInput.tagName !== 'SELECT') return;

        const currentTd = currentInput.closest('td');
        const currentRow = currentTd.closest('tr');
        if (!currentTd || !currentRow) return;

        const cells = Array.from(currentRow.children);
        const colIndex = cells.indexOf(currentTd);

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevRow = currentRow.previousElementSibling;
            if (prevRow) {
                const inputArriba = prevRow.children[colIndex].querySelector('input, select');
                if (inputArriba) { inputArriba.focus(); inputArriba.select(); }
            }
        }
        else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextRow = currentRow.nextElementSibling;
            if (nextRow) {
                const inputAbajo = nextRow.children[colIndex].querySelector('input, select');
                if (inputAbajo) { inputAbajo.focus(); inputAbajo.select(); }
            }
        }
        else if (e.key === 'ArrowLeft') {
            if (currentInput.selectionStart === 0) {
                e.preventDefault();
                let prevCol = colIndex - 1;
                while (prevCol >= 0 && window.getComputedStyle(currentRow.children[prevCol]).display === 'none') prevCol--;
                if (prevCol >= 0) {
                    const inputIzq = currentRow.children[prevCol].querySelector('input, select');
                    if (inputIzq) { inputIzq.focus(); inputIzq.select(); }
                }
            }
        }
        else if (e.key === 'ArrowRight') {
            if (currentInput.selectionEnd === currentInput.value.length) {
                e.preventDefault();
                let nextCol = colIndex + 1;
                while (nextCol < cells.length && window.getComputedStyle(currentRow.children[nextCol]).display === 'none') nextCol++;
                if (nextCol < cells.length) {
                    const inputDer = currentRow.children[nextCol].querySelector('input, select');
                    if (inputDer) { inputDer.focus(); inputDer.select(); }
                }
            }
        }
        else if (e.key === 'Enter') {
            e.preventDefault();
            const nextRow = currentRow.nextElementSibling; 
            if (colIndex >= 0 && colIndex <= 2) {
                const nextCell = cells[colIndex + 1];
                const nextInput = nextCell.querySelector('input, select');
                if (nextInput) nextInput.focus();
            }
            else if (colIndex === 3) {
                currentInput.blur(); 
                if (nextRow) {
                    const firstInputNextRow = nextRow.children[0].querySelector('input, select');
                    if (firstInputNextRow) setTimeout(() => firstInputNextRow.focus(), 10);
                }
            }
            else if (colIndex >= 5) {
                if (nextRow) {
                    const inputBelow = nextRow.children[colIndex].querySelector('input');
                    if (inputBelow) { inputBelow.focus(); inputBelow.select(); }
                }
            }
        }
    });
}

// Normalización de Paciente (MAYÚSCULAS) y Diagnóstico (Diccionario Clínico)
const inputPaciente = document.getElementById("paciente");
if (inputPaciente) {
    inputPaciente.addEventListener("blur", function() {
        if (this.value) {
            this.value = this.value.toUpperCase();
            window.programarAutoguardado();
        }
    });
}

const inputDiagnostico = document.getElementById("diagnostico");
if (inputDiagnostico) {
    inputDiagnostico.addEventListener("blur", function() {
        if (!this.value) return;
        const conectores = ["y", "e", "o", "u", "de", "del", "con", "sin", "por", "para", "en"];
        let corregido = this.value.split(/\s+/).map((palabraOriginal, index) => {
            let palabraLower = palabraOriginal.toLowerCase();
            if (dictDiagnosticos[palabraLower]) return dictDiagnosticos[palabraLower];
            if (/^(I{1,3}|IV|V|VI{1,3}|IX|X)$/i.test(palabraOriginal)) return palabraOriginal.toUpperCase();
            if (conectores.includes(palabraLower) && index > 0) return palabraLower;
            if (palabraOriginal === palabraOriginal.toUpperCase() && /[A-Z]/.test(palabraOriginal)) return palabraOriginal;
            if (palabraOriginal.length > 1) return palabraLower.charAt(0).toUpperCase() + palabraLower.slice(1);
            return palabraOriginal.toUpperCase();
        }).join(' ');
        this.value = corregido;
        window.escanearRestringidos();
        window.programarAutoguardado();
    });
}

// Auto-formateo de RUT en Login, Registro y Perfil
["loginRut", "regRut", "rut"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener("input", function() {
            let valor = this.value.replace(/[^0-9kK]/g, '').toUpperCase();
            this.value = valor.length > 1 ? valor.slice(0, -1) + '-' + valor.slice(-1) : valor;
        });
    }
});

document.getElementById("loginRut")?.addEventListener("keypress", e => { if (e.key === "Enter") document.getElementById("loginPin").focus(); });
document.getElementById("loginPin")?.addEventListener("keypress", e => { if (e.key === "Enter") window.intentarLogin(); });
document.getElementById("rut")?.addEventListener("blur", function() { window.validarRut(this); window.actualizarSaldosYSidebar(); });
document.getElementById("inputDias")?.addEventListener("change", function() {
    document.querySelectorAll("#grillaFila tr").forEach(fila => {
        const poso = fila.querySelectorAll("input")[3];
        if (poso && poso.value.trim() !== "") poso.dispatchEvent(new Event("change", { bubbles: true }));
    });
});

// Sensores de autoguardado para campos de cabecera y alergia con Debounce
const camposCabecera = document.querySelectorAll("#rut, #paciente, #peso, #ficha, #genero, #fechaIngreso, #diagnostico, #alergiaPaciente, .header-fecha");
camposCabecera.forEach(campo => {
    campo.addEventListener("input", window.programarAutoguardado);
    campo.addEventListener("change", window.programarAutoguardado);
});

const inputAlergia = document.getElementById("alergiaPaciente");
if (inputAlergia) {
    let tempAlergia;
    inputAlergia.addEventListener("keyup", () => {
        clearTimeout(tempAlergia);
        tempAlergia = setTimeout(window.escanearAlergias, 800);
    });
    inputAlergia.addEventListener("change", window.escanearAlergias);
}

// ============================================================================
// 12. IMPRESIÓN SEGURA, SIDEBAR TABS Y GESTIÓN DE CAMAS (LIMPIEZA / TRASLADO)
// ============================================================================
window.imprimirSeguro = function() {
    // Quita el cursor del input activo para asegurar que el último texto digitado se fije
    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
        document.activeElement.blur();
    }
    // Disparo instantáneo: Ya no hay retraso esperando a la nube
    window.print();
};

window.cambiarTabSidebar = function(pestana) {
    const tabSaldos = document.getElementById("tab-saldos");
    const tabTransito = document.getElementById("tab-transito");
    const contentSaldos = document.getElementById("sidebar-saldos-content");
    const contentTransito = document.getElementById("sidebar-transito-content");
    if (pestana === 'saldos') {
        tabSaldos.classList.add("active"); tabTransito.classList.remove("active");
        contentSaldos.style.display = "block"; contentTransito.style.display = "none";
    } else {
        tabTransito.classList.add("active"); tabSaldos.classList.remove("active");
        contentTransito.style.display = "block"; contentSaldos.style.display = "none";
    }
};

window.abrirModalGestion = function() {
    const pacienteActual = document.getElementById("paciente").value.trim();
    if (!pacienteActual) { alert("La cama actual está vacía. No hay paciente para gestionar."); return; }
    const selectServicios = document.getElementById("gestion-nuevo-servicio");
    selectServicios.innerHTML = '<option value="">Servicio Destino...</option>';
    if (window.datosGlobales && window.datosGlobales.servicios) {
        window.datosGlobales.servicios.forEach(s => selectServicios.appendChild(new Option(s, s)));
    }
    document.getElementById("gestion-nueva-cama").innerHTML = '<option value="">Seleccione Servicio Primero...</option>';
    document.getElementById("modal-gestion").style.display = "flex";
    setTimeout(() => document.getElementById("modal-gestion").classList.add("show"), 10);
};

window.cerrarModalGestion = function() {
    const modal = document.getElementById("modal-gestion");
    modal.classList.remove("show");
    setTimeout(() => { 
        modal.style.display = "none";
        document.querySelectorAll(".gestion-card").forEach(c => c.classList.remove("activa"));
        document.getElementById("form-traslado").style.display = "none";
        document.getElementById("form-egreso").style.display = "none";
        document.getElementById("form-limpiar").style.display = "none";
        document.getElementById("btn-ejecutar-gestion").style.display = "none";
        window.accionGestionSeleccionada = "";
    }, 300);
};

window.seleccionarOpcionGestion = function(opcion) {
    window.accionGestionSeleccionada = opcion;
    const btnEjecutar = document.getElementById("btn-ejecutar-gestion");
    document.querySelectorAll(".gestion-card").forEach(c => c.classList.remove("activa"));
    document.getElementById("form-traslado").style.display = "none";
    document.getElementById("form-egreso").style.display = "none";
    document.getElementById("form-limpiar").style.display = "none";
    
    document.getElementById("card-" + opcion).classList.add("activa");
    btnEjecutar.style.display = "block";

    if (opcion === 'traslado') {
        document.getElementById("form-traslado").style.display = "block";
        btnEjecutar.innerText = "TRASLADAR PACIENTE";
        btnEjecutar.style.background = "var(--accent-blue)";
    } else if (opcion === 'transito') {
        btnEjecutar.innerText = "ENVIAR A TRÁNSITO";
        btnEjecutar.style.background = "#ff9800"; 
    } else if (opcion === 'egreso') {
        document.getElementById("form-egreso").style.display = "block";
        btnEjecutar.innerText = "ARCHIVAR EGRESO";
        btnEjecutar.style.background = "var(--accent-red)";
    } else if (opcion === 'limpiar') {
        document.getElementById("form-limpiar").style.display = "block";
        btnEjecutar.innerText = "EJECUTAR LIMPIEZA";
        btnEjecutar.style.background = "var(--accent-red)";
    }
};

document.getElementById("btn-ejecutar-gestion")?.addEventListener("click", async function() {
    const camaOrigen = document.getElementById("cama").value;
    const servicioOrigen = document.getElementById("servicio").value;
    const idOrigen = `${servicioOrigen.toLowerCase()}_${camaOrigen.toLowerCase()}`.replace(/\s+/g, '_');
    const paciente = document.getElementById("paciente").value.trim();
    const rut = document.getElementById("rut").value.trim();

    if (window.accionGestionSeleccionada !== 'limpiar' && (!paciente || !rut)) {
        alert("⚠️ Faltan datos críticos del paciente (Nombre/RUT) para realizar esta acción.");
        return;
    }

    const btn = this;
    const textoOriginal = btn.innerText;
    btn.disabled = true;

    try {
        // ---------------------------------------------------------
        // 🧹 ACCIÓN: LIMPIAR PERFIL
        // ---------------------------------------------------------
        if (window.accionGestionSeleccionada === 'limpiar') {
            const tipoLimpieza = document.getElementById("gestion-tipo-limpieza").value;
            if (!confirm("⚠️ ¿Confirmar limpieza del perfil?")) { btn.disabled = false; return; }

            if (tipoLimpieza === "todo") {
                window.limpiarFormularioPerfil();
                await deleteDoc(doc(window.db, "camas_activas", idOrigen));
                alert("✅ Perfil vaciado completamente en la nube.");
            } else {
                document.querySelectorAll("#grillaFila tr input").forEach(inp => {
                    inp.value = ""; inp.classList.remove("alerta-sobredosis", "alerta-interaccion", "alerta-alergia");
                    delete inp.dataset.manual; window.syncCheckUI(inp);
                });
                window.actualizarSaldosYSidebar();
                await window.ejecutarGuardadoSilencioso(servicioOrigen, camaOrigen);
                alert("✅ Grilla de medicamentos limpiada.");
            }
            window.cerrarModalGestion();
        }
        
        // ---------------------------------------------------------
        // 🛏️ ACCIÓN: TRASLADO DE CAMA
        // ---------------------------------------------------------
        else if (window.accionGestionSeleccionada === 'traslado') {
            btn.innerText = "TRASLADANDO...";
            const servicioDestino = document.getElementById("gestion-nuevo-servicio").value;
            const camaDestino = document.getElementById("gestion-nueva-cama").value;
            
            if (!servicioDestino || !camaDestino) { alert("⚠️ Seleccione destino."); btn.disabled = false; btn.innerText = textoOriginal; return; }
            if (servicioDestino === servicioOrigen && camaDestino === camaOrigen) { alert("⚠️ El destino es igual al origen."); btn.disabled = false; btn.innerText = textoOriginal; return; }

            const idDestino = `${servicioDestino.toLowerCase()}_${camaDestino.toLowerCase()}`.replace(/\s+/g, '_');
            const refOrigen = doc(window.db, "camas_activas", idOrigen);
            const refDestino = doc(window.db, "camas_activas", idDestino);
            
            const snapOrigen = await getDoc(refOrigen);
            const snapDestino = await getDoc(refDestino);

            if (!snapOrigen.exists()) { alert("❌ Error: No hay datos en la cama origen."); btn.disabled = false; btn.innerText = textoOriginal; return; }

            let datosOrigen = snapOrigen.data();
            datosOrigen.servicio = servicioDestino;
            datosOrigen.cama = camaDestino;

            if (snapDestino.exists() && snapDestino.data().rut) {
                // Hay paciente en la cama destino -> Colisión / Intercambio
                const datosOcupante = snapDestino.data();
                const confirmarCruce = confirm(`🚨 COLISIÓN DETECTADA:\nLa ${camaDestino} está ocupada por ${datosOcupante.nombre}.\n\n¿Deseas INTERCAMBIAR las camas de ambos pacientes?`);
                
                if (confirmarCruce) {
                    btn.innerText = "INTERCAMBIANDO...";
                    datosOcupante.servicio = servicioOrigen;
                    datosOcupante.cama = camaOrigen;
                    
                    // Guardamos cruzado
                    await setDoc(refDestino, datosOrigen);
                    await setDoc(refOrigen, datosOcupante);
                    
                    alert("✅ Intercambio exitoso. Los pacientes han cruzado sus camas.");
                    window.cerrarModalGestion();
                    window.cargarTratamientoPacienteCama(); 
                }
            } else {
                // Cama destino libre -> Movimiento directo
                await setDoc(refDestino, datosOrigen);
                await deleteDoc(refOrigen);
                
                alert(`✅ Traslado exitoso a ${servicioDestino} - ${camaDestino}`);
                window.cerrarModalGestion();
                window.cargarTratamientoPacienteCama(); 
            }
        }
        
        // ---------------------------------------------------------
        // 🚶 ACCIÓN: ENVIAR A TRÁNSITO
        // ---------------------------------------------------------
        else if (window.accionGestionSeleccionada === 'transito') {
            btn.innerText = "ENVIANDO A TRÁNSITO...";
            const refOrigen = doc(window.db, "camas_activas", idOrigen);
            const snapOrigen = await getDoc(refOrigen);
            
            if (snapOrigen.exists()) {
                let datosTransito = snapOrigen.data();
                datosTransito.origen = `${servicioOrigen} - ${camaOrigen}`;
                datosTransito.timestamp = new Date().getTime();
                
                await setDoc(doc(window.db, "pacientes_transito", rut), datosTransito);
                await deleteDoc(refOrigen);
                
                alert("✅ Paciente enviado a Tránsito de forma segura.");
                window.cerrarModalGestion();
                window.limpiarFormularioPerfil(); 
                window.cargarSidebarTransito();
            }
        }
        
        // ---------------------------------------------------------
        // 🚪 ACCIÓN: EGRESO CLÍNICO (ARCHIVO)
        // ---------------------------------------------------------
        else if (window.accionGestionSeleccionada === 'egreso') {
            btn.innerText = "ARCHIVANDO EGRESO...";
            const motivo = document.getElementById("gestion-motivo-egreso").value;
            const refOrigen = doc(window.db, "camas_activas", idOrigen);
            const snapOrigen = await getDoc(refOrigen);
            
            if (snapOrigen.exists()) {
                let datosEgreso = snapOrigen.data();
                datosEgreso.motivoEgreso = motivo;
                const hoy = new Date();
                datosEgreso.fechaEgreso = `${hoy.getDate().toString().padStart(2, '0')}/${(hoy.getMonth()+1).toString().padStart(2, '0')}/${hoy.getFullYear()}`;
                
                await setDoc(doc(window.db, "archivo_historico", rut), datosEgreso);
                await deleteDoc(refOrigen);
                
                window.cerrarModalGestion();
                
                setTimeout(() => {
                    const deseaImprimir = confirm(`✅ Egreso archivado en la nube (${motivo}). Cama liberada.\n\n¿Desea generar el Comprobante de Alta para respaldar el retiro de medicamentos?`);
                    if (deseaImprimir) {
                        document.body.classList.add("impresion-alta");
                        const usuario = JSON.parse(sessionStorage.getItem("FarmaPerfil_Sesion"));
                        if (usuario && usuario.nombre) {
                            document.getElementById("firma-farmacia-nombre").innerText = usuario.nombre;
                        }
                        if(typeof window.imprimirSeguro === "function") window.imprimirSeguro();
                    } else {
                        window.limpiarFormularioPerfil();
                    }
                }, 400);
            }
        }

    } catch (error) {
        console.error("Error en gestión:", error);
        alert("❌ Error de red al gestionar paciente: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = textoOriginal;
    }
});

// ============================================================================
// 🏥 FUNCIONES DEL PANEL DE TRÁNSITO
// ============================================================================

window.cargarSidebarTransito = async function() {
    const contenedor = document.getElementById("sidebar-transito-content");
    const badge = document.getElementById("badge-transito");
    
    try {
        const querySnapshot = await getDocs(collection(window.db, "pacientes_transito"));
        let pacientes = [];
        querySnapshot.forEach((doc) => pacientes.push(doc.data()));

        if (pacientes.length === 0) {
            if(badge) badge.style.display = "none";
            if(contenedor) contenedor.innerHTML = `
                <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px; line-height: 1.5;">
                    <span class="material-icons-round" style="font-size: 32px; color: var(--glass-border); margin-bottom: 10px;">transfer_within_a_station</span><br>
                    No hay pacientes en tránsito. Las camas liberadas aparecerán aquí.
                </div>`;
            return;
        }

        if(badge) {
            badge.style.display = "inline-block";
            badge.innerText = pacientes.length; 
        }
        
        pacientes.sort((a, b) => b.timestamp - a.timestamp);

        let html = "";
        pacientes.forEach(p => {
            let ahora = new Date().getTime();
            let diffMinutos = Math.floor((ahora - (p.timestamp || ahora)) / 60000);
            let tiempoStr = diffMinutos < 60 ? `Hace ${diffMinutos} min` : `Hace ${Math.floor(diffMinutos/60)} hrs`;

            html += `
            <div class="nutricion-item" style="border-left: 4px solid var(--accent-red); display: block; background: rgba(255, 82, 82, 0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="nutricion-info" style="text-transform: uppercase;">${p.nombre}</span>
                    <span class="badge" style="background: var(--accent-red); color: white; font-size: 9px; padding: 3px 6px; border-radius: 4px;">EN ESPERA</span>
                </div>
                <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <span class="nutricion-vol" style="color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                            <span class="material-icons-round" style="font-size: 12px;">bed</span> De: ${p.origen}
                        </span>
                        <span class="nutricion-vol" style="color: var(--accent-blue); font-weight: bold; margin-top: 4px; display: flex; align-items: center; gap: 4px; font-size: 11px;">
                            <span class="material-icons-round" style="font-size: 12px;">schedule</span> ${tiempoStr}
                        </span>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="window.ejecutarAltaTransito('${p.rut}', '${p.nombre}')" style="background: var(--accent-red); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);" title="Dar de Alta Definitiva">ALTA</button>
                        <button onclick="window.ejecutarRescate('${p.rut}', '${p.nombre}')" style="background: var(--accent-blue); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">RESCATAR</button>
                    </div>
                </div>
            </div>`;
        });
        if(contenedor) contenedor.innerHTML = html;

    } catch(e) {
        console.error("Error cargando tránsito:", e);
    }
};

window.ejecutarRescate = async function(rutPaciente, nombrePaciente) {
    const servicioDestino = document.getElementById("servicio").value;
    const camaDestino = document.getElementById("cama").value;

    if (!servicioDestino || !camaDestino) {
        alert("⚠️ Seleccione el Servicio y la Cama en la pantalla principal donde desea ingresar al paciente.");
        return;
    }

    const confirmar = confirm(`¿Desea asignar a ${nombrePaciente} a la ${camaDestino} de ${servicioDestino}?`);
    if (!confirmar) return;

    try {
        const idDestino = `${servicioDestino.toLowerCase()}_${camaDestino.toLowerCase()}`.replace(/\s+/g, '_');
        const refDestino = doc(window.db, "camas_activas", idDestino);
        const snapDestino = await getDoc(refDestino);

        if (snapDestino.exists() && snapDestino.data().rut) {
            alert(`🚨 La ${camaDestino} está ocupada por ${snapDestino.data().nombre}. Mueva el selector a una cama vacía primero.`);
            return;
        }

        const refTransito = doc(window.db, "pacientes_transito", rutPaciente);
        const snapTransito = await getDoc(refTransito);
        
        if (snapTransito.exists()) {
            let datos = snapTransito.data();
            datos.servicio = servicioDestino;
            datos.cama = camaDestino;
            
            await setDoc(refDestino, datos);
            await deleteDoc(refTransito);
            
            alert(`✅ ${nombrePaciente} ha sido rescatado y asignado a la ${camaDestino}.`);
            window.cargarSidebarTransito(); 
            window.cargarTratamientoPacienteCama(); 
        }
    } catch(e) {
        alert("❌ Error de conexión: " + e.message);
    }
};

window.ejecutarAltaTransito = function(rutPaciente, nombrePaciente) {
    let modalHtml = document.getElementById("modal-alta-transito-rapida");
    if (!modalHtml) {
        modalHtml = document.createElement("div");
        modalHtml.id = "modal-alta-transito-rapida";
        modalHtml.className = "modal-overlay";
        modalHtml.style.zIndex = "9999999";
        modalHtml.innerHTML = `
            <div class="modal-container" style="width: 500px;">
                <div class="modal-header">
                    <span class="material-icons-round icon" style="color: var(--accent-red); font-size: 48px;">output</span>
                    <div>
                        <div style="font-size: 20px; font-weight: 800; color: var(--text-main); text-transform: uppercase;">EGRESO DESDE TRÁNSITO</div>
                        <div style="color: var(--text-muted); font-size: 13px; margin-top: 5px;">Paciente: <b id="nombre-alta-transito" style="color: var(--accent-blue);"></b></div>
                    </div>
                </div>
                <div class="gestion-formulario" style="display: block; padding: 20px; margin-top: 20px;">
                    <label style="font-size: 12px; font-weight: 800; color: var(--accent-red); text-transform: uppercase;">Motivo de Cierre de Perfil:</label>
                    <select id="motivo-alta-transito" class="login-input" style="width: 100%; margin-top: 10px; margin-bottom: 0;">
                        <option value="Alta Médica">Alta Médica</option>
                        <option value="Traslado a otro Hospital">Traslado a otro Hospital</option>
                        <option value="Fallecimiento">Fallecimiento</option>
                        <option value="Error de Registro">Error de Registro (Anular)</option>
                    </select>
                </div>
                <div class="modal-actions" style="margin-top: 20px;">
                    <button class="btn-entendido" onclick="document.getElementById('modal-alta-transito-rapida').classList.remove('show'); setTimeout(() => document.getElementById('modal-alta-transito-rapida').style.display = 'none', 300);">CANCELAR</button>
                    <button class="btn-validar" id="btn-confirmar-alta-transito" style="background: var(--accent-red);">ARCHIVAR EGRESO</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalHtml);
    }

    document.getElementById("nombre-alta-transito").innerText = nombrePaciente;
    modalHtml.style.display = "flex";
    setTimeout(() => modalHtml.classList.add("show"), 10);

    const btnConfirmar = document.getElementById("btn-confirmar-alta-transito");
    const newBtnConfirmar = btnConfirmar.cloneNode(true);
    btnConfirmar.parentNode.replaceChild(newBtnConfirmar, btnConfirmar);

    newBtnConfirmar.onclick = async function() {
        const motivoFinal = document.getElementById("motivo-alta-transito").value;
        const textOriginal = this.innerText;
        this.innerText = "ARCHIVANDO...";
        this.disabled = true;

        try {
            const refTransito = doc(window.db, "pacientes_transito", rutPaciente);
            const snapTransito = await getDoc(refTransito);
            
            if (snapTransito.exists()) {
                let datosEgreso = snapTransito.data();
                datosEgreso.motivoEgreso = motivoFinal;
                const hoy = new Date();
                datosEgreso.fechaEgreso = `${hoy.getDate().toString().padStart(2, '0')}/${(hoy.getMonth()+1).toString().padStart(2, '0')}/${hoy.getFullYear()}`;
                
                await setDoc(doc(window.db, "archivo_historico", rutPaciente), datosEgreso);
                await deleteDoc(refTransito);
                
                modalHtml.classList.remove('show');
                setTimeout(() => modalHtml.style.display = 'none', 300);
                alert(`✅ ${nombrePaciente} ha sido archivado/dado de alta correctamente.`);
                window.cargarSidebarTransito();
            }
        } catch (err) {
            alert("❌ Error de conexión: " + err.message);
        } finally {
            this.innerText = textOriginal;
            this.disabled = false;
        }
    };
};

document.getElementById("tab-transito")?.addEventListener("click", window.cargarSidebarTransito);

// ============================================================================
// 13. ARRANQUE INICIAL DEL SISTEMA
// ============================================================================
if (localStorage.getItem("themePreference") === "light") {
    document.body.classList.add("light-theme");
    const icon = document.getElementById("theme-icon");
    if (icon) icon.textContent = "dark_mode";
}

setTimeout(async () => {
    await window.cargarListasMaestras();
    await window.cargarDashboardBienvenida();

    const sesionActiva = sessionStorage.getItem("FarmaPerfil_Sesion");
    if (sesionActiva) {
        const usuario = JSON.parse(sesionActiva);
        document.getElementById("loginStepCredentials").style.display = "none";
        document.getElementById("welcomeUserName").innerText = `¡HOLA, ${usuario.nombre}!`;
        document.getElementById("loginStepService").style.display = "block";
    }
}, 100);

// ============================================================================
// 14. MÓDULO INTEGRADO DE BODEGA Y DESPACHO (DISEÑO ORIGINAL RESTAURADO)
// ============================================================================

const SERVICIOS_DESPACHO = [
    'UCI Norte', 'UCI Sur A', 'UCI Sur B', 'UTI', 
    'MEDICINA', 'UCM', 'CIRUGIA', 'PEDIATRIA'
];

const NUTRI_DB = [
    "Diben HP 1.5 kcal 500 mL", "Diben 1.0 kcal 1000 mL", "Fresubin 2 kcal HP 500 mL",
    "Fresubin HP Energy 1.5 kcal 1000 mL", "Fresubin Intensive 500 mL",
    "Fresubin Original 500 mL", "Jevity 1000 mL", "SmofKabiven Central 2200 kcal",
    "SmofKabiven Extra Nitrogeno 1800 kcal", "SmofKabiven Periferica 1300 kcal", "Survimed OPD HN 500 mL",
    "Osmolite 1000 mL"
];

const SOLU_DB = [
    "Agua Estéril 10 mL", "Glucosa 5% 250 mL", "Glucosa 5% 500 mL", "Glucosa 5% 1000 mL",
    "Glucosa 10 % 250 mL", "Glucosa 10 % 500 mL", "Glucosa 10 % 1000 mL",
    "Glucosa 30 % 20 mL", "Glucosa 30 % 500 mL", "Glucosalino 500 mL", "Glucosalino 1000 mL",
    "Ringer Lactato 500 mL", "Sodio Cloruro 09% 5 mL", "Sodio Cloruro 09% 20 mL", "Sodio Cloruro 0.9% 100 mL", 
    "Sodio Cloruro 0.9% 250 mL", "Sodio Cloruro 0.9% 500 mL", "Sodio Cloruro 0.9% 1000 mL", "Potasio Cloruro 2 g (10% en 10 mL)",
    "Sodio Cloruro 10% 20 mL", "Sodio Bicarbonato 2/3 Molar 250 mL"
];

const STOCK_DB = [
    "Lactulosa 66.7% 200 mL", "Potasio Gluconato 31.2% 200 mL", "Salbutamol 5 mg/mL", "Ipratropio Bromuro DE 0.025%",
    "Insulina NPH 100 UI/10 mL", "Insulina Cristalina 100 UI/10 mL"
];

window.initDespachoData = function() {
    let obj = {};
    SERVICIOS_DESPACHO.forEach(s => { 
        obj[s] = {}; 
        [...NUTRI_DB, ...SOLU_DB, ...STOCK_DB].forEach(p => obj[s][p] = 0); 
    });
    return obj;
};

// Usamos la misma llave 'nutri_stock_v6' para rescatar datos previos si existían
window.despachoData = JSON.parse(localStorage.getItem('nutri_stock_v6')) || window.initDespachoData();
// Asegurar que todos los servicios de la lista existan en el objeto cargado
SERVICIOS_DESPACHO.forEach(s => {
    if (!window.despachoData[s]) {
        window.despachoData[s] = {};
        [...NUTRI_DB, ...SOLU_DB, ...STOCK_DB].forEach(p => window.despachoData[s][p] = 0);
    }
});

window.despachoSrv = SERVICIOS_DESPACHO[0];
window.despachoCat = "nutri";
window.numpadItem = "";

window.saveDespacho = function() {
    localStorage.setItem('nutri_stock_v6', JSON.stringify(window.despachoData));
};

window.abrirDespachoModal = function() {
    let overlay = document.getElementById('modalDespachoOverlay');
    
    // Reconstruimos el contenedor con el diseño exacto del módulo original
    if (overlay) overlay.remove();

    overlay = document.createElement("div");
    overlay.id = "modalDespachoOverlay";
    overlay.className = "modal-overlay";
    overlay.style.cssText = "z-index: 999999; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);";
    
    overlay.innerHTML = `
      <style>
        #modalDespachoBox {
          width: 95%; max-width: 1000px; height: 90vh;
          background: var(--bg-gradient);
          border-radius: 24px; position: relative; overflow-y: auto; overflow-x: hidden;
          box-shadow: 0 25px 50px rgba(0,0,0,0.5);
          border: 1px solid var(--glass-border);
          display: flex; flex-direction: column;
          scrollbar-width: none; user-select: none;
        }
        #modalDespachoBox::-webkit-scrollbar { display: none !important; }
        
        #modalDespachoBox .desp-top-bar {
          position: sticky; top: 0; z-index: 1000;
          padding: 15px 75px 15px 20px;
          border-bottom: 1px solid var(--glass-border);
          border-radius: 0 0 16px 16px;
          background: var(--panel-bg);
          backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
          margin-bottom: 20px;
        }
        #modalDespachoBox .desp-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 15px; flex-wrap: wrap; gap: 15px;
        }
        #modalDespachoBox .desp-title {
          display: flex; align-items: center; gap: 10px; color: var(--accent-green);
          padding: 5px; border-radius: 8px;
        }
        #modalDespachoBox .desp-title h2 {
          margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 1px;
          color: var(--accent-green); text-transform: uppercase;
        }
        #modalDespachoBox .desp-close-btn {
          position: absolute; top: 15px; right: 15px; z-index: 10000;
          background: rgba(0,0,0,0.6); color: white; border: none;
          border-radius: 50%; width: 36px; height: 36px; cursor: pointer;
          display: flex; justify-content: center; align-items: center;
          backdrop-filter: blur(10px); transition: 0.2s;
        }
        #modalDespachoBox .desp-close-btn:hover { transform: scale(1.08); background: rgba(255,82,82,0.8); }

        #modalDespachoBox .desp-tabs {
          display: flex; justify-content: space-around;
          font-size: 11px; font-weight: bold; gap: 10px; flex-wrap: wrap; margin-top: 0;
        }
        #modalDespachoBox .desp-tab {
          flex: 1; text-align: center; cursor: pointer; padding: 10px 5px; min-width: 100px;
          border-radius: 12px; border: 1px solid transparent; background: transparent;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          font-family: inherit; font-weight: bold; letter-spacing: 0.5px; color: var(--text-muted);
        }
        #modalDespachoBox .desp-tab:hover {
          border-color: var(--accent-blue); background: rgba(64, 196, 255, 0.1);
          transform: translateY(-4px); box-shadow: 0 8px 15px rgba(0,0,0,0.2); color: var(--text-main);
        }
        #modalDespachoBox .desp-tab.active {
          color: var(--accent-blue); border-color: var(--accent-blue);
          background: rgba(64, 196, 255, 0.2); transform: translateY(-4px);
          box-shadow: 0 8px 15px rgba(0,0,0,0.3);
        }
        #modalDespachoBox .desp-tab.total.active {
          color: var(--accent-green); border-color: var(--accent-green); background: rgba(0, 230, 118, 0.2);
        }
        #modalDespachoBox .desp-tab.total:hover {
          border-color: var(--accent-green); background: rgba(0, 230, 118, 0.1); color: var(--text-main);
        }

        #modalDespachoBox .desp-main { padding: 0 20px 20px 20px; flex: 1; }
        #modalDespachoBox .desp-items-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;
        }
        /* TARJETA HORIZONTAL IDÉNTICA A LA IMAGEN 2 */
        #modalDespachoBox .desp-card {
          padding: 15px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;
          background: var(--glass-bg); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
          border: 1px solid var(--glass-border); border-radius: 16px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
          animation: popDesp 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; transition: all 0.3s ease;
        }
        #modalDespachoBox .desp-card:hover {
          transform: translateY(-3px); border-color: var(--accent-blue); box-shadow: 0 8px 20px rgba(0,0,0,0.25);
        }
        @keyframes popDesp {
          0% { transform: scale(0.95) translateY(10px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      </style>

      <div id="modalDespachoBox">
        <button class="desp-close-btn" onclick="window.cerrarDespachoModal()" title="Cerrar">
          <span class="material-icons-round">close</span>
        </button>

        <div class="desp-top-bar">
          <div class="desp-header">
            <div class="desp-title">
              <span class="material-icons-round" style="font-size: 24px; color: var(--accent-blue);">local_shipping</span>
              <h2>Módulo de Despacho</h2>
            </div>
            
            <div class="input-pill">
              <span class="material-icons-round" style="font-size: 18px; color: var(--text-muted);">domain</span>
              <select id="despachoSrvSelect" onchange="window.despachoSetSrv(this.value)">
                <option value="UCI Norte">UCI Norte</option>
                <option value="UCI Sur A">UCI Sur A</option>
                <option value="UCI Sur B">UCI Sur B</option>
                <option value="UTI">UTI</option>
                <option value="MEDICINA">MEDICINA</option>
                <option value="UCM">UCM</option>
                <option value="CIRUGIA">CIRUGÍA</option>
                <option value="PEDIATRIA">PEDIATRÍA</option>
              </select>
            </div>
          </div>

          <div class="desp-tabs">
            <button class="desp-tab active" id="btn-nutri" onclick="window.despachoSetCat('nutri')">
              <span class="material-icons-round" style="font-size: 18px;">local_dining</span>
              NUTRICIONES
            </button>
            <button class="desp-tab" id="btn-solu" onclick="window.despachoSetCat('solu')">
              <span class="material-icons-round" style="font-size: 18px;">water_drop</span>
              SOLUCIONES
            </button>
            <button class="desp-tab" id="btn-stock" onclick="window.despachoSetCat('stock')">
              <span class="material-icons-round" style="font-size: 18px;">medication</span>
              STOCK CLÍNICO
            </button>
            <button class="desp-tab total" id="btn-total" onclick="window.despachoSetCat('total')">
              <span class="material-icons-round" style="font-size: 18px;">summarize</span>
              HOJA DE RUTA
            </button>
          </div>
        </div>

        <div class="desp-main">
          <div id="despachoContent" class="desp-items-grid"></div>
          <div id="despachoFooterActions" class="footer-actions"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Crear teclado numérico flotante si no existe
    if (!document.getElementById('numpad-overlay')) {
        const numpad = document.createElement("div");
        numpad.id = "numpad-overlay";
        numpad.className = "numpad-overlay";
        numpad.style.zIndex = "9999999";
        numpad.innerHTML = `
          <div class="numpad-box">
            <div class="numpad-header">
              <div class="numpad-title" id="numpad-title">Nombre del Producto</div>
              <button onclick="window.closeNumpad()" class="btn-c" style="background: rgba(255, 82, 82, 0.15); color: var(--accent-red); width: 35px; height: 35px; border:none;">X</button>
            </div>
            <div class="numpad-display" id="numpad-val">0</div>
            <div class="keypad-grid">
              <button class="key-btn" onclick="window.numpadType('1')">1</button>
              <button class="key-btn" onclick="window.numpadType('2')">2</button>
              <button class="key-btn" onclick="window.numpadType('3')">3</button>
              <button class="key-btn" onclick="window.numpadType('4')">4</button>
              <button class="key-btn" onclick="window.numpadType('5')">5</button>
              <button class="key-btn" onclick="window.numpadType('6')">6</button>
              <button class="key-btn" onclick="window.numpadType('7')">7</button>
              <button class="key-btn" onclick="window.numpadType('8')">8</button>
              <button class="key-btn" onclick="window.numpadType('9')">9</button>
              <button class="key-btn del-key" onclick="window.numpadType('C')">C</button>
              <button class="key-btn" onclick="window.numpadType('0')">0</button>
              <button class="key-btn action-key" onclick="window.numpadType('DEL')">⌫</button>
              <button class="key-next" onclick="window.numpadConfirm()">CONFIRMAR</button>
            </div>
          </div>
        `;
        document.body.appendChild(numpad);
    }

    document.getElementById("despachoSrvSelect").value = window.despachoSrv;

    overlay.style.display = 'flex';
    setTimeout(() => { overlay.classList.add('show'); overlay.style.opacity = '1'; }, 10);
    window.despachoSetCat(window.despachoCat || 'nutri');
};

window.cerrarDespachoModal = function() {
    const overlay = document.getElementById('modalDespachoOverlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
};

window.despachoSetSrv = function(s) {
    window.despachoSrv = s;
    window.renderDespachoList();
};

window.despachoSetCat = function(c) {
    window.despachoCat = c;
    document.querySelectorAll('#modalDespachoBox .desp-tab').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('btn-' + c);
    if (btn) btn.classList.add('active');
    window.renderDespachoList();
};

window.getSafeId = function(str) { return str.replace(/[^a-zA-Z0-9]/g, '_'); };

window.renderDespachoList = function() {
    const c = document.getElementById('despachoContent');
    const f = document.getElementById('despachoFooterActions');
    if (!c || !f) return;
    c.innerHTML = ''; f.innerHTML = '';

    if (window.despachoCat === 'total') {
        c.className = "summary-grid"; 
        window.renderTotalBodega(c, f);
    } else {
        c.className = "desp-items-grid"; 
        let listado = window.despachoCat === 'nutri' ? NUTRI_DB : (window.despachoCat === 'solu' ? SOLU_DB : STOCK_DB);
        
        listado.forEach((p, index) => {
            const val = (window.despachoData[window.despachoSrv] && window.despachoData[window.despachoSrv][p]) || 0;
            const div = document.createElement('div');
            div.className = 'desp-card';
            div.style.animationDelay = (index * 0.02) + "s";
            
            let namePart = p; let volPart = "";
            const parts = p.split(' ');
            if (parts.length > 1) {
                volPart = parts.slice(-2).join(' ');
                namePart = parts.slice(0, -2).join(' ');
            }

            div.innerHTML = `
              <div class="item-info">
                <div class="item-name">${namePart}</div>
                <div class="item-vol">${volPart}</div>
              </div>
              <div class="counter">
                <button class="btn-c" onclick="window.updDespacho('${p}', -1)">−</button>
                <input type="text" readonly class="val-i" id="input-${window.getSafeId(p)}" value="${val}" onclick="window.openNumpad('${p}')">
                <button class="btn-c" onclick="window.updDespacho('${p}', 1)">+</button>
              </div>
            `;
            c.appendChild(div);
        });

        f.innerHTML = `
            <button class="btn-action btn-reset" onclick="window.resetDespacho()">
              <span class="material-icons-round">delete_sweep</span> Borrar Día
            </button>
            <button class="btn-action" onclick="window.descargarInforme()">
              <span class="material-icons-round">picture_as_pdf</span> Imprimir Ruta
            </button>
        `;
    }
};

window.renderTotalBodega = function(c, f) {
    let hayAlgo = false;
    
    [...NUTRI_DB, ...SOLU_DB, ...STOCK_DB].forEach((p, index) => {
        let totalP = 0; let rows = '';
        SERVICIOS_DESPACHO.forEach(s => {
            let v = (window.despachoData[s] && window.despachoData[s][p]) || 0;
            if (v > 0) { totalP += v; rows += `<div>${s}: <span class="service-val">${v}</span></div>`; }
        });

        if (totalP > 0) {
            hayAlgo = true;
            const div = document.createElement('div');
            div.className = 'summary-group';
            div.style.animationDelay = (index * 0.03) + "s";
            div.innerHTML = `
              <div class="summary-header">
                <div class="item-name" style="max-width:75%; font-size:15px; margin:0;">${p}</div>
                <div class="summary-grand-total">${totalP}</div>
              </div>
              <div class="service-breakdown">${rows}</div>
            `;
            c.appendChild(div);
        }
    });

    if (!hayAlgo) {
        c.innerHTML = `
          <div class="empty-state">
            <span class="material-icons-round" style="font-size: 60px; margin-bottom:15px; opacity:0.3;">inventory_2</span><br>
            Bodega vacía. No hay despachos registrados para hoy.
          </div>`;
    } else {
        f.innerHTML = `
          <button class="btn-action" style="flex: 1;" onclick="window.descargarInforme()">
            <span class="material-icons-round">print</span> Imprimir Hoja de Ruta Completa
          </button>
        `;
    }
};

window.updDespacho = function(p, delta) {
    let v = ((window.despachoData[window.despachoSrv] && window.despachoData[window.despachoSrv][p]) || 0) + delta;
    v = v < 0 ? 0 : v;
    window.despachoData[window.despachoSrv][p] = v;
    window.saveDespacho();
    let inputEl = document.getElementById('input-' + window.getSafeId(p));
    if (inputEl) inputEl.value = v;
};

// TECLADO VIRTUAL DESPACHO
window.openNumpad = function(item) {
    window.numpadItem = item;
    let val = (window.despachoData[window.despachoSrv] && window.despachoData[window.despachoSrv][item]) || 0;
    document.getElementById('numpad-title').innerText = item;
    document.getElementById('numpad-val').innerText = val;
    document.getElementById('numpad-overlay').classList.add('active');
};

window.closeNumpad = function() {
    document.getElementById('numpad-overlay').classList.remove('active');
};

window.numpadType = function(key) {
    let display = document.getElementById('numpad-val');
    let val = display.innerText;
    if (key === 'C') display.innerText = '0';
    else if (key === 'DEL') display.innerText = val.length > 1 ? val.slice(0, -1) : '0';
    else display.innerText = val === '0' ? key : val + key;
    if (display.innerText === '') display.innerText = '0';
};

window.numpadConfirm = function() {
    let num = parseInt(document.getElementById('numpad-val').innerText);
    window.despachoData[window.despachoSrv][window.numpadItem] = (isNaN(num) || num < 0) ? 0 : num;
    window.saveDespacho();
    let inputEl = document.getElementById('input-' + window.getSafeId(window.numpadItem));
    if (inputEl) inputEl.value = window.despachoData[window.despachoSrv][window.numpadItem];
    window.closeNumpad();
};

document.addEventListener('keydown', function(event) {
    const overlay = document.getElementById('numpad-overlay');
    if (!overlay || !overlay.classList.contains('active')) return;

    const key = event.key;
    if (/^[0-9]$/.test(key)) { event.preventDefault(); window.numpadType(key); }
    else if (key === 'Backspace') { event.preventDefault(); window.numpadType('DEL'); }
    else if (key === 'Escape') { event.preventDefault(); window.closeNumpad(); }
    else if (key === 'Enter') { event.preventDefault(); window.numpadConfirm(); }
    else if (key.toUpperCase() === 'C') { event.preventDefault(); window.numpadType('C'); }
});

// ACCIONES GENERALES DESPACHO
window.resetDespacho = function() {
    Swal.fire({
      title: '¿Reiniciar Sistema?', 
      text: 'Se borrarán todos los conteos de TODOS los servicios clínicos.', 
      icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ff5252', cancelButtonColor: '#3c3c43',
      confirmButtonText: 'Sí, limpiar todo', cancelButtonText: 'Cancelar',
      background: document.body.classList.contains('light-theme') ? '#ffffff' : '#1c1c1e',
      color: document.body.classList.contains('light-theme') ? '#000000' : '#ffffff',
      borderRadius: '20px'
    }).then(r => { 
      if (r.isConfirmed) { 
          window.despachoData = window.initDespachoData(); 
          window.saveDespacho();
          window.despachoSetCat('nutri'); 
      }
    });
};

window.descargarInforme = function() {
    let fecha = new Date().toLocaleDateString('es-CL');
    let hora = new Date().toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'});
    
    let html = `<html><head><title>Despacho Farmacia - ${fecha}</title><style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
      body { font-family: 'Inter', sans-serif; padding: 20px; color: #1c1c1e; max-width: 100%; margin: 0 auto; }
      .header { text-align: center; border-bottom: 2px solid #1c1c1e; padding-bottom: 8px; margin-bottom: 15px; }
      .header h1 { margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase; color: #1c1c1e; }
      .header p { margin: 4px 0 0 0; color: #666; font-size: 11px; font-weight: 600; }
      .service-block { page-break-inside: avoid; margin-bottom: 20px; border: 2px solid #e5e5ea; border-radius: 10px; overflow: hidden; }
      .service-title { background: #1c1c1e; color: #fff; padding: 8px 15px; font-weight: 900; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
      .category-title { background: #f2f2f7; font-weight: 800; font-size: 11px; color: #444; padding: 4px 15px; border-bottom: 1px solid #e5e5ea; border-top: 1px solid #e5e5ea; text-transform: uppercase; }
      .category-title:first-child { border-top: none; }
      .items-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 10px 15px; }
      .item-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #d1d1d6; padding-bottom: 4px; }
      .item-name { font-weight: 700; font-size: 12px; color: #1c1c1e; line-height: 1.2; padding-right: 10px; }
      .item-total { font-size: 15px; font-weight: 900; color: #1c1c1e; min-width: 25px; text-align: right; }
      @media print { 
        @page { margin: 10mm; size: A4 portrait; }
        body { padding: 0; } html { zoom: 0.95; }
        .service-block { border: 1px solid #000; }
        .service-title { background: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .category-title { background: #eee !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style></head><body>
      <div class="header"><h1>Hoja de Ruta - Despacho por Servicio</h1><p>Generado el ${fecha} a las ${hora} - Hospital El Pino</p></div>`;

    let hayDatosGlobal = false;

    SERVICIOS_DESPACHO.forEach(srv => {
      let srvHasData = false;
      let srvHTML = `<div class="service-block"><div class="service-title">${srv}</div>`;

      let nutriHTML = ''; NUTRI_DB.forEach(p => { let v = window.despachoData[srv][p] || 0; if (v > 0) nutriHTML += `<div class="item-row"><div class="item-name">${p}</div><div class="item-total">${v}</div></div>`; });
      if (nutriHTML) { srvHasData = true; srvHTML += `<div class="category-title">Nutriciones</div><div class="items-grid">${nutriHTML}</div>`; }

      let soluHTML = ''; SOLU_DB.forEach(p => { let v = window.despachoData[srv][p] || 0; if (v > 0) soluHTML += `<div class="item-row"><div class="item-name">${p}</div><div class="item-total">${v}</div></div>`; });
      if (soluHTML) { srvHasData = true; srvHTML += `<div class="category-title">Soluciones</div><div class="items-grid">${soluHTML}</div>`; }

      let stockHTML = ''; STOCK_DB.forEach(p => { let v = window.despachoData[srv][p] || 0; if (v > 0) stockHTML += `<div class="item-row"><div class="item-name">${p}</div><div class="item-total">${v}</div></div>`; });
      if (stockHTML) { srvHasData = true; srvHTML += `<div class="category-title">Stock Clínico</div><div class="items-grid">${stockHTML}</div>`; }

      srvHTML += `</div>`;
      if (srvHasData) { hayDatosGlobal = true; html += srvHTML; }
    });

    if(!hayDatosGlobal) { html += `<div style="text-align:center; padding: 50px; color: #888; font-weight:600;">No hay productos registrados para despachar.</div>`; }
    html += `</body></html>`;
    
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
};

// ============================================================================
// 15. MÓDULO INTEGRADO: CALCULADORA CLÍNICA (AUTO-INYECTABLE Y SINCRONIZADA)
// ============================================================================

const CALC_DB_MEDS = { 
    "Salbutamol 100 mcg": 200, 
    "Bromuro Ipratropio 20 mcg": 200, 
    "Budesonida 200 mcg": 120, 
    "Fluticasona 125 mcg": 120, 
    "Salmeterol / Fluticasona 25/125 mcg": 120, 
    "Salmeterol / Fluticasona 25/250 mcg": 120, 
    "Tiotropio / Olodaterol 2.5/2.5 mcg": 30, 
    "Budesonida / Formoterol 160/4.5 mcg": 60, 
    "Budesonida / Formoterol 320/9 mcg": 120 
};

const CALC_DB_LIQUIDOS = { 
    "Amoxicilina 250 mg/5 mL": { mg: 250, ml: 5, total: 60 }, 
    "Amoxicilina 500 mg/5 mL": { mg: 500, ml: 5, total: 60 }, 
    "Ácido Ursodesoxicólico 250 mg/5 mL": { mg: 250, ml: 5, total: 200 }, 
    "Ácido Valproico 250 mg/5 mL": { mg: 250, ml: 5, total: 120 }, 
    "Azitromicina 200 mg/5 mL": { mg: 200, ml: 5, total: 30 }, 
    "Cefadroxilo 250 mg/5 mL": { mg: 250, ml: 5, total: 60 }, 
    "Levetiracetam 500 mg/5 mL": { mg: 500, ml: 5, total: 300 }, 
    "Paracetamol 120 mg/5 mL": { mg: 120, ml: 5, total: 60 }, 
    "N-Acetil-Cisteína 100 mg/mL": { mg: 100, ml: 1, total: 60 },
    "Sulfato Ferroso 125 mg/1 mL": { mg: 125, ml: 1, total: 30, gotas: "" }, 
    "Sulfato de Zinc 5 mg/1 mL": { mg: 5, ml: 1, total: 30, gotas: "" },
    "Vitamina ACD 2500 UI/1 mL": { mg: 2500, ml: 1, total: 30, gotas: "" },
    "Risperidona 1 mg/mL": { mg: 1, ml: 1, total: 30, gotas: "" }, 
    "Tramadol 100 mg/1 mL": { mg: 100, ml: 1, total: 10, gotas: "" },
    "BioGaia (Probiótico)": { biogaia: true }
};

window.CALC_CURRENT_MODE = 'PESO';
window.calcInputActivo = null;

window.abrirCalculadoraModal = function() {
    let overlay = document.getElementById('modalCalcOverlay');
    const isIframeVersion = overlay && overlay.innerHTML.includes('iframeCalculadora');

    if (!overlay || isIframeVersion) {
        if (isIframeVersion) overlay.remove();

        overlay = document.createElement("div");
        overlay.id = "modalCalcOverlay";
        overlay.className = "modal-overlay";
        overlay.style.cssText = "z-index: 999999; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);";

        overlay.innerHTML = `
          <style>
            #modalCalcBox {
              width: 95%; max-width: 850px; height: 88vh;
              background: var(--bg-gradient);
              border-radius: 24px; position: relative; overflow-y: auto; overflow-x: hidden;
              box-shadow: 0 25px 50px rgba(0,0,0,0.5);
              border: 1px solid var(--glass-border);
              display: flex; flex-direction: column;
              scrollbar-width: none; user-select: none;
            }
            #modalCalcBox::-webkit-scrollbar { display: none !important; }

            #modalCalcBox .calc-close-btn {
              position: absolute; top: 15px; right: 15px; z-index: 10000;
              background: rgba(0,0,0,0.6); color: white; border: none;
              border-radius: 50%; width: 36px; height: 36px; cursor: pointer;
              display: flex; justify-content: center; align-items: center;
              backdrop-filter: blur(10px); transition: 0.2s;
            }
            #modalCalcBox .calc-close-btn:hover { transform: scale(1.08); background: rgba(255,82,82,0.8); }

            #modalCalcBox .calc-top-bar {
              position: sticky; top: 0; z-index: 1000; padding: 15px 20px;
              border-bottom: 1px solid var(--glass-border); border-radius: 0 0 16px 16px;
              background: var(--panel-bg); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
            }
            #modalCalcBox .calc-header-container { display: flex; justify-content: center; align-items: center; }
            #modalCalcBox .calc-app-title { display: flex; align-items: center; gap: 10px; color: var(--accent-green); }
            #modalCalcBox .calc-app-title h2 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px; color: var(--accent-green); }

            #modalCalcBox .calc-tabs {
              display: flex; justify-content: space-around; margin-top: 15px;
              font-size: 10px; font-weight: bold; color: var(--text-muted); gap: 8px; padding: 0 10px;
            }
            #modalCalcBox .calc-tab {
              flex: 1; text-align: center; cursor: pointer; padding: 10px 5px;
              border-radius: 12px; border: 1px solid transparent; background: transparent;
              transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              display: flex; flex-direction: column; align-items: center; gap: 6px;
            }
            #modalCalcBox .calc-tab:hover {
              border-color: var(--accent-blue); background: rgba(64, 196, 255, 0.1);
              transform: translateY(-4px); box-shadow: 0 8px 15px rgba(0,0,0,0.2); color: var(--text-main);
            }
            #modalCalcBox .calc-tab.active {
              color: var(--accent-blue); border-color: var(--accent-blue);
              background: rgba(64, 196, 255, 0.2); transform: translateY(-4px);
              box-shadow: 0 8px 15px rgba(0,0,0,0.3);
            }

            #modalCalcBox .calc-main-layout {
              display: flex; gap: 20px; padding: 20px; max-width: 850px; width: 100%;
              margin: 0 auto; align-items: flex-start; box-sizing: border-box;
            }
            #modalCalcBox .calc-left-column { flex: 1; display: flex; flex-direction: column; min-width: 0; }
            #modalCalcBox .calc-right-column { width: 300px; position: sticky; top: 135px; flex-shrink: 0; }

            #modalCalcBox .calc-card { padding: 25px; margin-bottom: 20px; width: 100%; box-sizing: border-box; }
            #modalCalcBox .calc-mode-section { width: 100%; opacity: 1; transform: translateY(0); transition: all 0.4s ease; }
            #modalCalcBox .calc-mode-section.hidden { opacity: 0; transform: translateY(-10px); display: none; }

            #modalCalcBox .calc-row { display: flex; gap: 15px; width: 100%; align-items: flex-end; }
            #modalCalcBox .calc-col { flex: 1; min-width: 0; }

            #modalCalcBox label {
              display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700;
              color: var(--accent-blue); text-transform: uppercase; margin-bottom: 8px;
            }
            #modalCalcBox .calc-pill {
              display: flex; align-items: center; background: var(--input-bg); border: 1px solid var(--glass-border);
              border-radius: 8px; padding: 0 12px; margin-bottom: 20px; height: 46px; transition: 0.2s; width: 100%; box-sizing: border-box;
            }
            #modalCalcBox .calc-pill.focused {
              border-color: var(--accent-blue); box-shadow: 0 0 0 3px rgba(64, 196, 255, 0.3);
            }
            #modalCalcBox .calc-pill input, #modalCalcBox .calc-pill select {
              flex: 1; border: none; background: transparent; color: var(--text-main);
              font-size: 15px; outline: none; font-weight: 700; width: 100%; text-align: center;
            }
            #modalCalcBox .calc-mi-icon { font-size: 18px; color: var(--accent-blue); margin-right: 8px; }

            #modalCalcBox .calc-result-box {
              margin-top: 20px; padding: 15px; border-radius: 12px; text-align: center;
              font-size: 14px; font-weight: 700; display: none; line-height: 1.5;
              border: 2px solid transparent; background: rgba(0,0,0,0.2);
            }
            body.light-theme #modalCalcBox .calc-result-box { background: rgba(255,255,255,0.6); }
            #modalCalcBox .res-green { color: var(--accent-green); border-color: var(--accent-green); }
            #modalCalcBox .res-blue { color: var(--accent-blue); border-color: var(--accent-blue); }

            #modalCalcBox .keypad-container { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
            #modalCalcBox .keypad-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
            #modalCalcBox .key-btn {
              background: var(--key-bg); border: 1px solid var(--glass-border); border-radius: 10px;
              color: var(--text-main); font-size: 22px; font-weight: 700; height: 60px;
              display: flex; justify-content: center; align-items: center; cursor: pointer;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1); user-select: none; transition: 0.1s;
            }
            #modalCalcBox .key-btn:active { transform: scale(0.92); background: var(--key-active); }
            #modalCalcBox .key-btn.action-key { background: rgba(64, 196, 255, 0.15); color: var(--accent-blue); font-size: 18px; }
            #modalCalcBox .key-btn.del-key { background: rgba(255, 82, 82, 0.15); color: var(--accent-red); }
            #modalCalcBox .key-btn.key-next {
              grid-column: span 3; background: var(--accent-green); color: #000;
              font-size: 16px; font-weight: 900; gap: 8px;
            }
          </style>

          <div id="modalCalcBox">
            <button class="calc-close-btn" onclick="window.cerrarCalculadoraModal()" title="Cerrar">
              <span class="material-icons-round">close</span>
            </button>

            <div class="calc-top-bar">
              <div class="calc-header-container">
                <div class="calc-app-title">
                  <span class="material-icons-round">calculate</span>
                  <h2>Calculadora Clínica</h2>
                </div>
              </div>
              <div class="calc-tabs">
                <div class="calc-tab active" id="calcBtnPeso" onclick="window.calcSetMode('PESO')"><span class="material-icons-round">balance</span>PESO</div>
                <div class="calc-tab" id="calcBtnFija" onclick="window.calcSetMode('FIJA')"><span class="material-icons-round">av_timer</span>FIJA</div>
                <div class="calc-tab" id="calcBtnJarabe" onclick="window.calcSetMode('JARABE')"><span class="material-icons-round">water_drop</span>GOTAS</div>
                <div class="calc-tab" id="calcBtnStock" onclick="window.calcSetMode('STOCK')"><span class="material-icons-round">inventory</span>STOCK</div>
                <div class="calc-tab" id="calcBtnClinica" onclick="window.calcSetMode('CLINICA')"><span class="material-icons-round">medical_services</span>CLÍNICA</div>
                <div class="calc-tab" id="calcBtnEsquema" onclick="window.calcSetMode('ESQUEMA')"><span class="material-icons-round">trending_down</span>ESQUEMA</div>
              </div>
            </div>

            <div class="calc-main-layout">
              <div class="calc-left-column">
                
                <!-- SECCIÓN 1: INFUSIÓN (PESO / FIJA) -->
                <div id="calcSectionInfusion" class="calc-mode-section">
                  <div class="calc-card glass-panel">
                    <div id="calcWrapperPeso">
                      <label>Peso del Paciente</label>
                      <div class="calc-pill">
                        <span class="material-icons-round calc-mi-icon">monitor_weight</span>
                        <input type="text" inputmode="decimal" id="calc_peso" placeholder="Ej: 70">
                      </div>
                    </div>

                    <div class="calc-row">
                      <div class="calc-col" style="flex: 2;">
                        <label id="calc_lblDosis">Dosis (mcg/kg/h)</label>
                        <div class="calc-pill">
                          <span class="material-icons-round calc-mi-icon">speed</span>
                          <input type="text" inputmode="decimal" id="calc_dosis" placeholder="0.7">
                        </div>
                      </div>
                      <div id="calc_colUnidad" class="calc-col" style="flex: 1.2;">
                        <label>Unidad</label>
                        <div class="calc-pill">
                          <select id="calc_unidadTiempo" onchange="window.calcActualizarEtiquetas()">
                            <option value="h">/ h</option>
                            <option value="m">/ min (γ)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div class="calc-row">
                      <div class="calc-col" style="flex: 2;">
                        <label id="calc_lblConc">Conc. Ampolla (mcg)</label>
                        <div class="calc-pill">
                          <span class="material-icons-round calc-mi-icon">vaccines</span>
                          <input type="text" inputmode="decimal" id="calc_concentracion" placeholder="200">
                        </div>
                      </div>
                      <div id="calc_colUnidadConc" class="calc-col" style="flex: 1.2;">
                        <label>Unidad</label>
                        <div class="calc-pill">
                          <select id="calc_unidadConc" onchange="window.calcActualizarEtiquetas()">
                            <option value="mcg">mcg</option>
                            <option value="mg">mg</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <button class="btn-action" onclick="window.calcCalcularStock()">
                      <span class="material-icons-round">inventory_2</span> CALCULAR STOCK 24H
                    </button>
                    <div id="calc_resAmp" class="calc-result-box res-green"></div>
                  </div>
                  
                  <div class="calc-card glass-panel">
                    <label>Volumen Mezcla (ml)</label>
                    <div class="calc-pill">
                      <span class="material-icons-round calc-mi-icon">water_drop</span>
                      <input type="text" inputmode="decimal" id="calc_volumen" value="100">
                    </div>
                    <button class="btn-action" style="background: var(--accent-blue);" onclick="window.calcCalcularBomba()">
                      <span class="material-icons-round">settings_input_component</span> CALCULAR BOMBA Y GOTEO
                    </button>
                    <div id="calc_resBomba" class="calc-result-box res-blue"></div>
                  </div>
                </div>

                <!-- SECCIÓN 2: JARABES Y GOTAS -->
                <div id="calcSectionJarabe" class="calc-mode-section hidden">
                  <div class="calc-card glass-panel">
                    <div style="background: rgba(64,196,255,0.05); padding: 15px 15px 1px 15px; border-radius: 12px; margin-bottom: 20px; border: 1px dashed var(--glass-border);">
                      <label style="color: var(--text-main); font-size: 10px; margin-bottom: 10px;">CÁLCULO PEDIÁTRICO (OPCIONAL)</label>
                      <div class="calc-row">
                        <div class="calc-col">
                          <label>Peso Paciente</label>
                          <div class="calc-pill"><span class="material-icons-round calc-mi-icon">child_care</span><input type="text" inputmode="decimal" id="calc_jarabePesoNino" placeholder="kg"></div>
                        </div>
                        <div class="calc-col">
                          <label>Indicación médica</label>
                          <div class="calc-pill"><input type="text" inputmode="decimal" id="calc_jarabeMgKg" placeholder="mg/kg"></div>
                        </div>
                      </div>
                    </div>

                    <label>Fármaco (Líquidos y Gotas)</label>
                    <div class="calc-pill">
                      <span class="material-icons-round calc-mi-icon">list</span>
                      <select id="calc_selectJarabe" onchange="window.calcAutoCompletarJarabe()">
                        <option value="">Manual / Otro...</option>
                      </select>
                    </div>
                    <div class="calc-row" id="calc_rowJarabeConc">
                      <div class="calc-col"><label id="calc_lblJarabeMg">Conc. (mg)</label><div class="calc-pill"><input type="text" inputmode="decimal" id="calc_jarabeMg" placeholder="mg"></div></div>
                      <div class="calc-col"><label>En (mL)</label><div class="calc-pill"><input type="text" inputmode="decimal" id="calc_jarabeMl" placeholder="mL"></div></div>
                    </div>
                    <div class="calc-row">
                      <div class="calc-col" id="calc_colJarabeTotal"><label>Frasco (mL)</label><div class="calc-pill"><input type="text" inputmode="decimal" id="calc_jarabeTotal" placeholder="60"></div></div>
                      <div class="calc-col"><label>Frec. (Hrs)</label><div class="calc-pill"><input type="text" inputmode="decimal" id="calc_jarabeFrec" placeholder="8"></div></div>
                    </div>
                    
                    <div class="calc-row">
                      <div class="calc-col" style="flex: 2;">
                        <label id="calc_lblDosisReq">Dosis Requerida</label>
                        <div class="calc-pill">
                          <span class="material-icons-round calc-mi-icon">assignment</span>
                          <input type="text" inputmode="decimal" id="calc_jarabeDosis" placeholder="Ej: 100">
                        </div>
                      </div>
                      <div class="calc-col" style="flex: 1;" id="calc_colUnidadJarabe">
                        <label>En</label>
                        <div class="calc-pill">
                          <select id="calc_unidadJarabe">
                            <option value="mg">mg</option>
                            <option value="ml">mL</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div class="calc-row" id="calc_rowGoteroFactor">
                      <div class="calc-col">
                        <label style="color: var(--accent-red);">Gotas por 1 mL (Ver envase)</label>
                        <div class="calc-pill" style="border-color: var(--accent-red);">
                          <span class="material-icons-round calc-mi-icon" style="color: var(--accent-red);">opacity</span>
                          <input type="text" inputmode="decimal" id="calc_jarabeFactorGotas" placeholder="Ej: 20">
                        </div>
                      </div>
                    </div>

                    <button class="btn-action" style="background: var(--accent-green); color: #000;" onclick="window.calcCalcularJarabe()">CALCULAR DOSIS</button>
                    <div id="calc_resJarabe" class="calc-result-box res-blue"></div>
                  </div>
                </div>

                <!-- SECCIÓN 3: STOCK INHALADORES -->
                <div id="calcSectionStock" class="calc-mode-section hidden">
                  <div class="calc-card glass-panel">
                    <label>Medicamento</label>
                    <div class="calc-pill">
                      <span class="material-icons-round calc-mi-icon">medication</span>
                      <select id="calc_selectMed" onchange="window.calcCargarDatosMed()"><option value="">Seleccione fármaco...</option></select>
                    </div>
                    <label id="calc_lblStockDosis">Puffs por vez</label>
                    <div class="calc-pill">
                      <span class="material-icons-round calc-mi-icon">auto_fix_high</span>
                      <input type="text" inputmode="decimal" id="calc_cantVez" placeholder="Ej: 2">
                    </div>
                    <label>Frecuencia (Horas)</label>
                    <div class="calc-pill">
                      <span class="material-icons-round calc-mi-icon">schedule</span>
                      <input type="text" inputmode="decimal" id="calc_frecHoras" placeholder="Ej: 8">
                    </div>
                    <label>Capacidad Envase</label>
                    <div class="calc-pill">
                      <span class="material-icons-round calc-mi-icon">inventory</span>
                      <input type="text" inputmode="decimal" id="calc_totalEnvase" readonly style="opacity:0.5">
                    </div>
                    <button class="btn-action" onclick="window.calcCalcularDuracion()">CALCULAR AUTONOMÍA</button>
                    <div id="calc_resInhala" class="calc-result-box res-green"></div>
                  </div>
                </div>

                <!-- SECCIÓN 4: CLÍNICA (RENAL Y BSA) -->
                <div id="calcSectionClinica" class="calc-mode-section hidden">
                  <div class="calc-card glass-panel">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 15px;">
                       <span class="material-icons-round" style="color: var(--accent-blue);">water_drop</span>
                       <h3 style="margin:0; color: var(--accent-blue); font-size: 15px;">Aclaramiento Renal (Cockcroft-Gault)</h3>
                    </div>
                    <div class="calc-row">
                      <div class="calc-col"><label>Edad</label><div class="calc-pill"><input type="text" inputmode="decimal" id="calc_edadCr" placeholder="Años"></div></div>
                      <div class="calc-col"><label>Peso</label><div class="calc-pill"><input type="text" inputmode="decimal" id="calc_pesoCr" placeholder="kg"></div></div>
                    </div>
                    <div class="calc-row">
                      <div class="calc-col"><label>Creatinina Sérica</label><div class="calc-pill"><input type="text" inputmode="decimal" id="calc_creaCr" placeholder="mg/dL"></div></div>
                      <div class="calc-col"><label>Sexo</label>
                        <div class="calc-pill">
                          <select id="calc_sexoCr"><option value="M">Hombre</option><option value="F">Mujer</option></select>
                        </div>
                      </div>
                    </div>
                    <button class="btn-action" onclick="window.calcCalcularRenal()">CALCULAR CLCR</button>
                    <div id="calc_resRenal" class="calc-result-box res-blue"></div>
                  </div>

                  <div class="calc-card glass-panel">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 15px;">
                       <span class="material-icons-round" style="color: var(--accent-green);">accessibility_new</span>
                       <h3 style="margin:0; color: var(--accent-green); font-size: 15px;">Superficie Corporal (Mosteller)</h3>
                    </div>
                    <div class="calc-row">
                      <div class="calc-col"><label>Peso</label><div class="calc-pill"><input type="text" inputmode="decimal" id="calc_pesoBsa" placeholder="kg"></div></div>
                      <div class="calc-col"><label>Estatura</label><div class="calc-pill"><input type="text" inputmode="decimal" id="calc_alturaBsa" placeholder="cm"></div></div>
                    </div>
                    <button class="btn-action" style="background: var(--accent-green); color:#000;" onclick="window.calcCalcularBSA()">CALCULAR BSA</button>
                    <div id="calc_resBsa" class="calc-result-box res-green"></div>
                  </div>
                </div>

                <!-- SECCIÓN 5: ESQUEMA DE DESESCALADA (TAPERING) -->
                <div id="calcSectionEsquema" class="calc-mode-section hidden">
                  <div class="calc-card glass-panel" style="padding: 20px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
                       <span class="material-icons-round" style="color: var(--accent-blue); font-size: 24px;">trending_down</span>
                       <h3 style="margin:0; color: var(--text-main); font-size: 16px; font-weight: 900; text-transform: uppercase;">Esquema de Desescalada</h3>
                    </div>
                    
                    <div style="background: rgba(64,196,255,0.05); padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px dashed var(--glass-border);">
                      <label style="margin-bottom: 10px;">Fármaco Base (Tapering)</label>
                      <div class="calc-pill" style="margin-bottom: 0;">
                        <span class="material-icons-round calc-mi-icon">medication</span>
                        <select id="calc_esquemaFarmacoBase" style="font-weight: 900; color: var(--accent-blue);">
                          <option value="prednisona">Prednisona</option>
                        </select>
                      </div>
                    </div>

                    <div id="calc_esquemaContenedor"></div>

                    <button class="btn-action" style="background: transparent; color: var(--text-main); border: 2px dashed var(--glass-border); margin-bottom: 20px; box-shadow: none;" onclick="window.calcAgregarFilaEsquema()">
                      <span class="material-icons-round" style="color: var(--accent-blue);">add_circle</span> AÑADIR ESCALÓN
                    </button>

                    <button class="btn-action" style="background: linear-gradient(135deg, #00e676, #00c853); color:#000;" onclick="window.calcCalcularEsquema(true)">
                      <span class="material-icons-round">calculate</span> CALCULAR ESQUEMA TOTAL
                    </button>

                    <div id="calc_resEsquema" class="calc-result-box res-green" style="text-align: left; padding: 20px;"></div>
                  </div>
                </div>

              </div>

              <!-- COLUMNA DERECHA: TECLADO CLÍNICO -->
              <div class="calc-right-column">
                <div class="keypad-container glass-panel">
                  <div style="text-align: center; font-size: 11px; font-weight: 700; color: var(--text-muted); letter-spacing: 1px; margin-bottom: 5px;">TECLADO CLÍNICO</div>
                  <div class="keypad-grid">
                    <div class="key-btn" onmousedown="window.calcTeclear('1', event)">1</div>
                    <div class="key-btn" onmousedown="window.calcTeclear('2', event)">2</div>
                    <div class="key-btn" onmousedown="window.calcTeclear('3', event)">3</div>
                    <div class="key-btn" onmousedown="window.calcTeclear('4', event)">4</div>
                    <div class="key-btn" onmousedown="window.calcTeclear('5', event)">5</div>
                    <div class="key-btn" onmousedown="window.calcTeclear('6', event)">6</div>
                    <div class="key-btn" onmousedown="window.calcTeclear('7', event)">7</div>
                    <div class="key-btn" onmousedown="window.calcTeclear('8', event)">8</div>
                    <div class="key-btn" onmousedown="window.calcTeclear('9', event)">9</div>
                    <div class="key-btn" onmousedown="window.calcTeclear('.', event)">.</div>
                    <div class="key-btn" onmousedown="window.calcTeclear('0', event)">0</div>
                    <div class="key-btn action-key" onmousedown="window.calcTeclear('00', event)">00</div>
                    
                    <div class="key-btn action-key" onmousedown="window.calcTeclear('C', event)">C</div>
                    <div class="key-btn del-key" style="grid-column: span 2;" onmousedown="window.calcTeclear('DEL', event)"><span class="material-icons-round">backspace</span></div>
                    
                    <div class="key-btn key-next" onmousedown="window.calcSiguienteCelda(event)">
                      SIGUIENTE <span class="material-icons-round" style="font-size: 18px;">arrow_forward</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        `;
        document.body.appendChild(overlay);

        // Poblar selectores de la calculadora
        const sStock = document.getElementById('calc_selectMed');
        const sJar = document.getElementById('calc_selectJarabe');
        for (let m in CALC_DB_MEDS) sStock.appendChild(new Option(m, m));
        for (let j in CALC_DB_LIQUIDOS) sJar.appendChild(new Option(j, j));

        // Inicializar primer escalón de Prednisona
        window.calcAgregarFilaEsquema();

        // Escuchador de foco exclusivo para iluminar las píldoras de la calculadora
        document.getElementById('modalCalcBox').addEventListener('focusin', function(e) {
            if (e.target.tagName === 'INPUT' && (e.target.type === 'text' || e.target.type === 'number')) {
                window.calcInputActivo = e.target;
                document.querySelectorAll('#modalCalcBox .calc-pill').forEach(p => p.classList.remove('focused'));
                const pill = window.calcInputActivo.closest('.calc-pill');
                if (pill) pill.classList.add('focused');
            }
        });
    }

    // 🌟 SINCRONIZACIÓN AUTOMÁTICA DE PESO Y EDAD DESDE EL PERFIL ACTIVO
    const pesoPaciente = document.getElementById('peso') ? parseFloat(document.getElementById('peso').value) : NaN;
    if (!isNaN(pesoPaciente) && pesoPaciente > 0) {
        document.getElementById('calc_peso').value = pesoPaciente;
        document.getElementById('calc_jarabePesoNino').value = pesoPaciente;
        document.getElementById('calc_pesoCr').value = pesoPaciente;
        document.getElementById('calc_pesoBsa').value = pesoPaciente;
    }

    const edadRaw = document.getElementById('genero') ? document.getElementById('genero').value : "";
    const edadMatch = edadRaw.match(/(\d+)/);
    if (edadMatch && !edadRaw.toLowerCase().includes('m')) {
        document.getElementById('calc_edadCr').value = edadMatch[1];
    }

    overlay.style.display = 'flex';
    setTimeout(() => { 
        overlay.classList.add('show'); 
        overlay.style.opacity = '1'; 
        const primerInput = document.querySelector('#modalCalcBox .calc-mode-section:not(.hidden) input:not([readonly])');
        if (primerInput) primerInput.focus();
    }, 10);
};

window.cerrarCalculadoraModal = function() {
    const overlay = document.getElementById('modalCalcOverlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
};

// TECLADO CLÍNICO INTERNO
window.calcTeclear = function(valor, evento) {
    if (evento) evento.preventDefault();
    if (!window.calcInputActivo) return;

    if (valor === 'C') {
        window.calcInputActivo.value = '';
    } else if (valor === 'DEL') {
        window.calcInputActivo.value = window.calcInputActivo.value.slice(0, -1);
    } else {
        if (valor === '.') {
            if (window.calcInputActivo.value.includes('.')) return;
            if (window.calcInputActivo.value === '') {
                window.calcInputActivo.value = '0.';
                window.calcInputActivo.dispatchEvent(new Event('input', { bubbles: true }));
                return;
            }
        }
        window.calcInputActivo.value += valor;
    }
    window.calcInputActivo.dispatchEvent(new Event('input', { bubbles: true }));
};

window.calcSiguienteCelda = function(evento) {
    if (evento) evento.preventDefault();
    const seccionActiva = document.querySelector('#modalCalcBox .calc-mode-section:not(.hidden)');
    if (!seccionActiva) return;
    const inputs = Array.from(seccionActiva.querySelectorAll('input:not([readonly])')).filter(el => el.offsetParent !== null);

    if (!window.calcInputActivo) {
        if (inputs.length > 0) inputs[0].focus();
        return;
    }

    const indexActual = inputs.indexOf(window.calcInputActivo);
    if (indexActual > -1 && indexActual < inputs.length - 1) {
        inputs[indexActual + 1].focus();
    } else {
        window.calcInputActivo.blur();
        if (window.CALC_CURRENT_MODE === 'PESO' || window.CALC_CURRENT_MODE === 'FIJA') {
            window.calcCalcularStock();
            window.calcCalcularBomba();
        } else if (window.CALC_CURRENT_MODE === 'JARABE') {
            window.calcCalcularJarabe();
        } else if (window.CALC_CURRENT_MODE === 'STOCK') {
            window.calcCalcularDuracion();
        } else if (window.CALC_CURRENT_MODE === 'CLINICA') {
            window.calcCalcularRenal();
            window.calcCalcularBSA();
        } else if (window.CALC_CURRENT_MODE === 'ESQUEMA') {
            window.calcCalcularEsquema(true);
        }
    }
};

// NAVEGACIÓN DE PESTAÑAS Y ETIQUETAS DE LA CALCULADORA
window.calcActualizarEtiquetas = function() {
    const t = document.getElementById('calc_unidadTiempo').value;
    const c = document.getElementById('calc_unidadConc').value;
    if (window.CALC_CURRENT_MODE === 'PESO') {
        document.getElementById('calc_lblDosis').innerText = t === 'm' ? 'Dosis (mcg/kg/min)' : 'Dosis (mcg/kg/h)';
        document.getElementById('calc_lblConc').innerText = `Conc. Ampolla (${c})`;
    } else if (window.CALC_CURRENT_MODE === 'FIJA') {
        document.getElementById('calc_lblDosis').innerText = t === 'm' ? 'Dosis (mg/min)' : 'Dosis (mg/h)';
        document.getElementById('calc_lblConc').innerText = 'Conc. Ampolla (mg)';
    }
};

window.calcSetMode = function(mode) {
    window.CALC_CURRENT_MODE = mode;
    ['calcBtnPeso', 'calcBtnFija', 'calcBtnJarabe', 'calcBtnStock', 'calcBtnClinica', 'calcBtnEsquema'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });

    let tabId = mode === 'JARABE' ? 'Jarabe' : (mode === 'CLINICA' ? 'Clinica' : (mode === 'ESQUEMA' ? 'Esquema' : mode.charAt(0) + mode.slice(1).toLowerCase()));
    const btnActivo = document.getElementById('calcBtn' + tabId);
    if (btnActivo) btnActivo.classList.add('active');

    document.getElementById('calcSectionInfusion').classList.toggle('hidden', mode !== 'PESO' && mode !== 'FIJA');
    document.getElementById('calcSectionJarabe').classList.toggle('hidden', mode !== 'JARABE');
    document.getElementById('calcSectionStock').classList.toggle('hidden', mode !== 'STOCK');
    document.getElementById('calcSectionClinica').classList.toggle('hidden', mode !== 'CLINICA');
    document.getElementById('calcSectionEsquema').classList.toggle('hidden', mode !== 'ESQUEMA');

    document.querySelectorAll('#modalCalcBox .calc-result-box').forEach(el => el.style.display = 'none');

    const wp = document.getElementById('calcWrapperPeso');
    const colU = document.getElementById('calc_colUnidad');
    const colUC = document.getElementById('calc_colUnidadConc');

    if (mode === 'FIJA') {
        wp.style.display = 'none';
        colU.style.display = 'block';
        colUC.style.display = 'none';
        window.calcActualizarEtiquetas();
    } else if (mode === 'PESO') {
        wp.style.display = 'block';
        colU.style.display = 'block';
        colUC.style.display = 'block';
        window.calcActualizarEtiquetas();
    }

    setTimeout(() => {
        const primerInput = document.querySelector('#modalCalcBox .calc-mode-section:not(.hidden) input:not([readonly])');
        if (primerInput) primerInput.focus();
    }, 80);
};

window.calcMostrarResultado = function(elementId, htmlContent) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = htmlContent;
    el.style.display = 'block';
    el.classList.remove('pop-anim');
    void el.offsetWidth;
    el.classList.add('pop-anim');
};

// FÓRMULAS MATEMÁTICAS Y CLÍNICAS
window.calcCalcularStock = function() {
    const d = parseFloat(document.getElementById('calc_dosis').value);
    let c = parseFloat(document.getElementById('calc_concentracion').value);
    const p = parseFloat(document.getElementById('calc_peso').value) || 1;
    if (isNaN(d) || isNaN(c) || c <= 0) return;

    const unidadT = document.getElementById('calc_unidadTiempo').value;
    const unidadC = document.getElementById('calc_unidadConc').value;
    const factorMinuto = (unidadT === 'm') ? 60 : 1;

    let total;
    if (window.CALC_CURRENT_MODE === 'PESO') {
        if (unidadC === 'mg') c = c * 1000;
        total = d * p * factorMinuto * 24;
    } else {
        total = d * factorMinuto * 24;
    }

    const html = `Total Demanda 24h: <b>${total.toFixed(1)} ${window.CALC_CURRENT_MODE === 'PESO' ? 'mcg' : 'mg'}</b><br>💊 Ampollas a dispensar: <b>${(total / c).toFixed(2)}</b>`;
    window.calcMostrarResultado('calc_resAmp', html);
};

window.calcCalcularBomba = function() {
    const d = parseFloat(document.getElementById('calc_dosis').value);
    let c = parseFloat(document.getElementById('calc_concentracion').value);
    const v = parseFloat(document.getElementById('calc_volumen').value);
    const p = parseFloat(document.getElementById('calc_peso').value) || 1;
    if (isNaN(d) || isNaN(c) || isNaN(v) || v <= 0 || c <= 0) return;

    const unidadT = document.getElementById('calc_unidadTiempo').value;
    const unidadC = document.getElementById('calc_unidadConc').value;
    const factorMinuto = (unidadT === 'm') ? 60 : 1;

    if (window.CALC_CURRENT_MODE === 'PESO' && unidadC === 'mg') c = c * 1000;

    let uniHora = (window.CALC_CURRENT_MODE === 'PESO') ? (d * p * factorMinuto) : (d * factorMinuto);
    const velocidad = uniHora / (c / v);
    const macrogotas = Math.round(velocidad / 3);
    const microgotas = Math.round(velocidad);

    const html = `
      🚀 Velocidad Bomba: <b style="font-size: 18px;">${velocidad.toFixed(1)} ml/h</b><br>
      <span style="opacity:0.8; font-size:12px;">Gravedad: <b>${macrogotas}</b> macrogotas/min o <b>${microgotas}</b> microgotas/min</span>
    `;
    window.calcMostrarResultado('calc_resBomba', html);
};

window.calcCargarDatosMed = function() {
    const med = document.getElementById('calc_selectMed').value;
    if (!med) return;
    document.getElementById('calc_totalEnvase').value = CALC_DB_MEDS[med];
    document.getElementById('calc_lblStockDosis').innerText = med.includes("Valproico") || med.includes("Acetil") ? "Dosis (mL)" : "Puffs por vez";
};

window.calcAutoCompletarJarabe = function() {
    const val = document.getElementById('calc_selectJarabe').value;
    const j = CALC_DB_LIQUIDOS[val];
    const isBioGaia = val === "BioGaia (Probiótico)";

    const rowConc = document.getElementById('calc_rowJarabeConc');
    const colTotal = document.getElementById('calc_colJarabeTotal');
    const colUnidadJarabe = document.getElementById('calc_colUnidadJarabe');
    const rowGoteroFactor = document.getElementById('calc_rowGoteroFactor');
    const lblMg = document.getElementById('calc_lblJarabeMg');
    const lblDosis = document.getElementById('calc_lblDosisReq');

    if (isBioGaia) {
        rowConc.style.display = 'none';
        colTotal.style.display = 'none';
        colUnidadJarabe.style.display = 'none';
        rowGoteroFactor.style.display = 'none';
        lblDosis.innerText = 'Gotas por vez';
        document.getElementById('calc_jarabeFrec').value = 24;
        document.getElementById('calc_jarabeDosis').placeholder = "Ej: 5";
        document.getElementById('calc_jarabeDosis').value = "";
    } else {
        rowConc.style.display = 'flex';
        colTotal.style.display = 'block';
        colUnidadJarabe.style.display = 'block';
        rowGoteroFactor.style.display = 'flex';
        let isUI = val.includes('UI');
        lblMg.innerText = isUI ? 'Conc. (UI)' : 'Conc. (mg)';
        lblDosis.innerText = 'Dosis Requerida';

        const unitSelect = document.getElementById('calc_unidadJarabe');
        unitSelect.options[0].text = isUI ? 'UI' : 'mg';

        if (j) {
            document.getElementById('calc_jarabeMg').value = j.mg;
            document.getElementById('calc_jarabeMl').value = j.ml;
            document.getElementById('calc_jarabeTotal').value = j.total;
            document.getElementById('calc_jarabeFactorGotas').value = j.gotas || "";
        } else {
            document.getElementById('calc_jarabeMg').value = "";
            document.getElementById('calc_jarabeMl').value = "";
            document.getElementById('calc_jarabeTotal').value = "";
            document.getElementById('calc_jarabeFactorGotas').value = "";
        }
        document.getElementById('calc_jarabeDosis').placeholder = "Ej: 100";
    }
};

window.calcCalcularJarabe = function() {
    const val = document.getElementById('calc_selectJarabe').value;
    const isBioGaia = val === "BioGaia (Probiótico)";
    let msg = '';

    if (isBioGaia) {
        const gotasVez = parseFloat(document.getElementById('calc_jarabeDosis').value);
        const frec = parseFloat(document.getElementById('calc_jarabeFrec').value);
        if (!gotasVez || !frec) return;
        const dias = 125 / (gotasVez * (24 / frec));
        msg = `💧 Administrar: <b>${gotasVez} gotas</b><br>⏳ Duración frasco: <b>${Math.floor(dias)} días</b>`;
    } else {
        const pNino = parseFloat(document.getElementById('calc_jarabePesoNino').value);
        const mgKg = parseFloat(document.getElementById('calc_jarabeMgKg').value);
        let inputValue = parseFloat(document.getElementById('calc_jarabeDosis').value);
        const unit = document.getElementById('calc_unidadJarabe').value;

        if (pNino > 0 && mgKg > 0) {
            inputValue = pNino * mgKg;
            document.getElementById('calc_jarabeDosis').value = inputValue.toFixed(1);
            document.getElementById('calc_unidadJarabe').value = 'mg';
        }

        const mgBase = parseFloat(document.getElementById('calc_jarabeMg').value);
        const mlBase = parseFloat(document.getElementById('calc_jarabeMl').value);
        const totalBottle = parseFloat(document.getElementById('calc_jarabeTotal').value);
        const hours = parseFloat(document.getElementById('calc_jarabeFrec').value);

        if (!mgBase || !mlBase || !inputValue) return;

        let mlDose = (unit === 'mg' || (pNino && mgKg)) ? (inputValue * mlBase) / mgBase : inputValue;
        let mgEq = (unit === 'mg' || (pNino && mgKg)) ? inputValue : (inputValue * mgBase) / mlBase;

        msg = `🚀 Administrar: <b style="font-size: 16px;">${mlDose.toFixed(2)} mL (cc)</b>`;

        if (unit === 'ml' && !(pNino && mgKg)) {
            const isUI = val.includes('UI');
            msg += `<br>⚖️ Dosis equivalente: <b>${mgEq.toFixed(1)} ${isUI ? 'UI' : 'mg'}</b>`;
        } else if (pNino && mgKg) {
            msg += `<br>⚖️ Requerimiento: <b>${mgEq.toFixed(1)} mg</b>`;
        }

        const factorGotas = parseFloat(document.getElementById('calc_jarabeFactorGotas').value) || 0;
        if (factorGotas > 0) {
            const cantGotas = Math.round(mlDose * factorGotas);
            msg += `<br>💧 Equivale a: <b>${cantGotas} gotas</b> <small style="opacity:0.8">(${factorGotas} gts/mL)</small>`;
        } else if (mlDose <= 3) {
            msg += `<br><small style="color: var(--accent-red);">⚠️ Indica cuántas gotas son 1 mL en el envase para ver equivalencia.</small>`;
        }

        if (totalBottle && hours) {
            msg += `<br>⏳ Duración frasco: <b>${Math.floor(totalBottle / (mlDose * (24 / hours)))} días</b>`;
        }
    }
    window.calcMostrarResultado('calc_resJarabe', msg);
};

window.calcCalcularDuracion = function() {
    const cant = parseFloat(document.getElementById('calc_cantVez').value);
    const horas = parseFloat(document.getElementById('calc_frecHoras').value);
    const total = parseFloat(document.getElementById('calc_totalEnvase').value);
    if (!cant || !horas || !total) return;

    const html = `⏳ Autonomía Estimada: <b style="font-size: 16px;">${Math.floor(total / ((24 / horas) * cant))} días</b><br>Capacidad total: ${total} unidades`;
    window.calcMostrarResultado('calc_resInhala', html);
};

window.calcCalcularRenal = function() {
    const e = parseFloat(document.getElementById('calc_edadCr').value);
    const p = parseFloat(document.getElementById('calc_pesoCr').value);
    const c = parseFloat(document.getElementById('calc_creaCr').value);
    const s = document.getElementById('calc_sexoCr').value;
    if (!e || !p || !c) return;

    let crcl = ((140 - e) * p) / (72 * c);
    if (s === 'F') crcl = crcl * 0.85;

    let estado = ""; let color = "";
    if (crcl >= 90) { estado = "Función Normal"; color = "#00e676"; }
    else if (crcl >= 60) { estado = "Deterioro Leve"; color = "#b2ff59"; }
    else if (crcl >= 30) { estado = "Deterioro Moderado"; color = "#ffeb3b"; }
    else if (crcl >= 15) { estado = "Deterioro Severo"; color = "#ff9800"; }
    else { estado = "Fallo Renal"; color = "#ff5252"; }

    window.calcMostrarResultado('calc_resRenal', `🩸 Clearance Creatinina: <b style="font-size: 18px;">${crcl.toFixed(1)} mL/min</b><br><span style="color: ${color}; font-size: 12px; font-weight: 800;">${estado.toUpperCase()}</span>`);
};

window.calcCalcularBSA = function() {
    const p = parseFloat(document.getElementById('calc_pesoBsa').value);
    const a = parseFloat(document.getElementById('calc_alturaBsa').value);
    if (!p || !a) return;

    const bsa = Math.sqrt((p * a) / 3600);
    window.calcMostrarResultado('calc_resBsa', `🧍 Superficie Corporal: <b style="font-size: 18px;">${bsa.toFixed(2)} m²</b>`);
};

// MOTOR DE DESESCALADA DE CORTICOIDES (TAPERING)
window.calcAgregarFilaEsquema = function() {
    const contenedor = document.getElementById('calc_esquemaContenedor');
    if (!contenedor) return;
    const filas = contenedor.querySelectorAll('.esquema-row');
    let fechaInicioSugerida = "";

    if (filas.length > 0) {
        const ultimaFila = filas[filas.length - 1];
        const ultimaFechaTermino = ultimaFila.querySelector('.eq-termino').value;
        if (ultimaFechaTermino) {
            let d = new Date(ultimaFechaTermino + "T12:00:00Z");
            d.setDate(d.getDate() + 1);
            fechaInicioSugerida = d.toISOString().split('T')[0];
        }
    } else {
        let d = new Date();
        const offset = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d - offset)).toISOString().slice(0, -1);
        fechaInicioSugerida = localISOTime.split('T')[0];
    }

    const numeroEscalon = filas.length + 1;
    const html = `
    <div class="esquema-row pop-anim" style="background: var(--panel-bg); border: 1px solid var(--glass-border); padding: 15px; border-radius: 12px; margin-bottom: 15px; position: relative;">
        <div style="position: absolute; top: -10px; left: 15px; background: var(--accent-blue); color: #fff; padding: 2px 8px; border-radius: 6px; font-size: 9px; font-weight: 900; letter-spacing: 1px;">ESCALÓN ${numeroEscalon}</div>
        <button onclick="this.closest('.esquema-row').remove(); window.calcCalcularEsquema(false);" style="position: absolute; right: 10px; top: 10px; background: rgba(255,82,82,0.15); color: var(--accent-red); border: none; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s;"><span class="material-icons-round" style="font-size: 18px;">delete_outline</span></button>
        
        <div class="calc-row" style="margin-top: 8px; margin-bottom: 12px; padding-right: 35px;">
            <div class="calc-col">
                <label style="font-size: 9px;">Fecha Inicio</label>
                <div class="calc-pill" style="height: 38px; margin-bottom: 0;"><input type="date" class="eq-inicio" style="font-size: 13px; font-family: inherit; font-weight: 700; color: var(--accent-blue);" value="${fechaInicioSugerida}" onchange="window.calcCalcularEsquema(false)" required></div>
            </div>
            <div class="calc-col">
                <label style="font-size: 9px;">Fecha Término</label>
                <div class="calc-pill" style="height: 38px; margin-bottom: 0;"><input type="date" class="eq-termino" style="font-size: 13px; font-family: inherit; font-weight: 700; color: var(--accent-blue);" onchange="window.calcCalcularEsquema(false)" required></div>
            </div>
        </div>
        <div class="calc-row">
            <div class="calc-col" style="flex: 1.5;">
                <label style="font-size: 9px;">Dosis (mg)</label>
                <div class="calc-pill" style="height: 38px; margin-bottom: 0;"><input type="text" inputmode="decimal" class="eq-dosis" placeholder="Ej: 15" style="font-size: 15px;" oninput="window.calcCalcularEsquema(false)" required></div>
            </div>
            <div class="calc-col" style="flex: 1;">
                <label style="font-size: 9px;">Frecuencia</label>
                <div class="calc-pill" style="height: 38px; margin-bottom: 0;">
                    <select class="eq-frecuencia" style="font-size: 13px;" onchange="window.calcCalcularEsquema(false)">
                        <option value="1">c/24h</option>
                        <option value="2">c/12h</option>
                        <option value="3">c/8h</option>
                        <option value="4">c/6h</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="subtotal-escalon" style="background: rgba(64, 196, 255, 0.05); border: 1px dashed rgba(64, 196, 255, 0.4); border-radius: 8px; padding: 10px; margin-top: 12px; font-size: 13px; text-align: center; color: var(--text-main); display: none; font-weight: 600;"></div>
    </div>`;

    const div = document.createElement('div');
    div.innerHTML = html.trim();
    contenedor.appendChild(div.firstChild);
};

window.calcCalcularEsquema = function(hacerScroll = true) {
    const filas = document.querySelectorAll('#calc_esquemaContenedor .esquema-row');
    const resBox = document.getElementById('calc_resEsquema');

    if (filas.length === 0) {
        window.calcMostrarResultado('calc_resEsquema', '<div style="color: var(--accent-red); text-align: center;">Agregue al menos un escalón de tratamiento.</div>');
        return;
    }

    let masaTotal = 0; let error = false;
    let opB_20mg_total = 0; let opB_5mg_total = 0;

    filas.forEach((fila) => {
        const inicio = fila.querySelector('.eq-inicio').value;
        const termino = fila.querySelector('.eq-termino').value;
        const dosisStr = fila.querySelector('.eq-dosis').value.replace(/,/g, '.');
        const dosis = parseFloat(dosisStr);
        const frec = parseFloat(fila.querySelector('.eq-frecuencia').value);
        const divSubtotal = fila.querySelector('.subtotal-escalon');

        if (!inicio || !termino || isNaN(dosis) || dosis <= 0) {
            error = true;
            divSubtotal.style.display = 'none';
        } else {
            const d1 = new Date(inicio + "T12:00:00Z");
            const d2 = new Date(termino + "T12:00:00Z");

            if (d2 < d1) {
                error = true;
                divSubtotal.style.display = 'block';
                divSubtotal.innerHTML = '<span style="color:var(--accent-red);">⚠️ Fechas inválidas</span>';
                return;
            }

            const diffTime = Math.abs(d2 - d1);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            const masaEscalon = dosis * frec * diffDays;
            masaTotal += masaEscalon;

            const dosisDiaria = dosis * frec;
            const comp20_diario = Math.floor(dosisDiaria / 10) * 0.5;
            const comp5_diario = Math.ceil((dosisDiaria % 10) / 5);

            opB_20mg_total += (comp20_diario * diffDays);
            opB_5mg_total += (comp5_diario * diffDays);

            const sA = Math.ceil(masaEscalon / 20);
            const sC = Math.ceil(masaEscalon / 5);
            const sB_20 = Math.ceil(comp20_diario * diffDays);
            const sB_5 = Math.ceil(comp5_diario * diffDays);

            divSubtotal.style.display = 'block';
            divSubtotal.innerHTML = `<span style="font-size: 15px; color: var(--accent-blue); font-weight: 900;">${masaEscalon} mg</span> &nbsp;➔&nbsp; <span style="color: var(--text-muted);"><b>${sA}</b> de 20mg &nbsp;|&nbsp; <b>${sC}</b> de 5mg &nbsp;|&nbsp;</span> <span style="color: var(--accent-green);">Mix: <b>${sB_20}</b>x20 + <b>${sB_5}</b>x5</span>`;
        }
    });

    if (error) {
        if (!hacerScroll) resBox.style.display = 'none';
        else window.calcMostrarResultado('calc_resEsquema', '<div style="color: var(--accent-red); text-align: center; font-size: 12px; font-weight: bold;">⚠️ Complete correctamente las fechas y dosis.</div>');
        return;
    }

    const op20 = Math.ceil(masaTotal / 20);
    const op5 = Math.ceil(masaTotal / 5);
    const max20 = Math.ceil(opB_20mg_total);
    const extra5 = Math.ceil(opB_5mg_total);

    const msg = `
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px dashed var(--glass-border); padding-bottom: 15px;">
            <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Masa Total Requerida</span><br>
            <b style="font-size: 28px; color: var(--accent-blue);">${masaTotal.toFixed(1)} mg</b>
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="background: rgba(64,196,255,0.1); border: 1px solid var(--accent-blue); padding: 15px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <span style="font-size: 10px; color: var(--accent-blue); font-weight: 900; display: block; margin-bottom: 2px;">OPCIÓN A (SOLO 20 MG)</span>
                    <span style="font-size: 13px; color: var(--text-main); font-weight: 600;">Entregar <b style="font-size: 18px; color: var(--accent-blue);">${op20}</b> comp. de 20 mg.</span>
                </div>
                <span class="material-icons-round" style="color: var(--accent-blue); opacity: 0.5; font-size: 32px;">medication</span>
            </div>
            <div style="background: rgba(0,230,118,0.1); border: 1px solid var(--accent-green); padding: 15px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <span style="font-size: 10px; color: var(--accent-green); font-weight: 900; display: block; margin-bottom: 2px;">OPCIÓN B (ESQUEMA MIXTO)</span>
                    <span style="font-size: 13px; color: var(--text-main); font-weight: 600;">Entregar <b style="font-size: 18px; color: var(--accent-green);">${max20}</b> comp. de 20 mg + <b style="font-size: 18px; color: var(--accent-green);">${extra5}</b> comp. de 5 mg.</span>
                </div>
                <span class="material-icons-round" style="color: var(--accent-green); opacity: 0.5; font-size: 32px;">join_inner</span>
            </div>
            <div style="background: rgba(255,152,0,0.1); border: 1px solid #ff9800; padding: 15px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <span style="font-size: 10px; color: #ff9800; font-weight: 900; display: block; margin-bottom: 2px;">OPCIÓN C (SOLO 5 MG)</span>
                    <span style="font-size: 13px; color: var(--text-main); font-weight: 600;">Entregar <b style="font-size: 18px; color: #ff9800;">${op5}</b> comp. de 5 mg.</span>
                </div>
                <span class="material-icons-round" style="color: #ff9800; opacity: 0.5; font-size: 32px;">medication</span>
            </div>
        </div>
    `;
    window.calcMostrarResultado('calc_resEsquema', msg);
    if (hacerScroll) setTimeout(() => { resBox.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 100);
};

// ============================================================================
// 16. MODAL HISTÓRICO Y CÁPSULA DEL TIEMPO (FIRESTORE)
// ============================================================================
window.abrirModalHistorico = async function() {
    const modal = document.getElementById("modal-historico");
    if (modal) {
        modal.style.display = "flex"; 
        setTimeout(() => modal.classList.add("show"), 10);
        
        document.getElementById("lista-egresos-recientes").innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 12px; margin-top: 10px;"><span class="material-icons-round" style="font-size: 24px; display: block; margin-bottom: 5px;">cloud_download</span>Conectando con el Archivo Histórico...</div>`;
        
        const inputRutHist = document.getElementById("input-buscar-rut-historico");
        if (inputRutHist) {
            inputRutHist.value = ""; 
            inputRutHist.oninput = function() {
                let valor = this.value.replace(/[^0-9kK]/g, '').toUpperCase();
                if (valor.length > 1) { this.value = valor.slice(0, -1) + '-' + valor.slice(-1); } 
                else { this.value = valor; }
            };
        }

        try {
            // Descarga todos los egresos y los ordena del más reciente al más antiguo
            const snap = await getDocs(collection(window.db, "archivo_historico"));
            let egresos = [];
            snap.forEach(documento => egresos.push(documento.data()));
            
            egresos.sort((a, b) => {
                let dateA = new Date(a.ultimaModificacion || 0).getTime();
                let dateB = new Date(b.ultimaModificacion || 0).getTime();
                return dateB - dateA; 
            });
            
            egresos = egresos.slice(0, 15); // Muestra solo los 15 más recientes para agilidad

            let html = "";
            if (egresos.length === 0) {
                html = `<div style="text-align:center; padding:10px; color:var(--text-muted); font-size:12px;">No hay egresos registrados en la base de datos.</div>`;
            } else {
                egresos.forEach(e => {
                    html += `<div class="lista-historica-item" onclick="window.cargarPerfilHistorico('${e.rut}')">
                                <div>
                                    <strong style="display:block; color:var(--accent-blue); font-size:13px; text-transform:uppercase;">${e.nombre || 'PACIENTE SIN NOMBRE'}</strong>
                                    <span style="font-size:11px; color:var(--text-muted);">RUT: ${e.rut} | Fecha Egreso: ${e.fechaEgreso || (e.ultimaModificacion ? e.ultimaModificacion.split('T')[0] : 'N/A')}</span>
                                </div>
                                <span class="material-icons-round" style="color:var(--text-muted); font-size:18px;">history</span>
                             </div>`;
                });
            }
            document.getElementById("lista-egresos-recientes").innerHTML = html;
        } catch (err) {
            console.error("Error al cargar historial:", err);
            document.getElementById("lista-egresos-recientes").innerHTML = `<div style="text-align:center; padding:10px; color:var(--accent-red); font-size:12px;">Error al cargar historial de Firestore. Verifique su conexión.</div>`;
        }
    }
};

window.cerrarModalHistorico = function() {
    const modal = document.getElementById("modal-historico");
    if (modal) { 
        modal.classList.remove("show");
        setTimeout(() => modal.style.display = "none", 400); 
    }
};

window.ejecutarBusquedaHistorica = function() {
    const rut = document.getElementById("input-buscar-rut-historico").value.trim();
    if (!rut || rut.length < 8) { alert("⚠️ Ingrese un RUT válido para buscar."); return; }
    window.cargarPerfilHistorico(rut);
};

window.cargarPerfilHistorico = async function(rutBuscado) {
    const modal = document.getElementById("modal-historico");
    const btn = modal.querySelector(".modal-actions .btn-validar");
    const textoOriginal = btn ? btn.innerText : "BUSCAR PACIENTE";
    if (btn) { btn.innerText = "BUSCANDO..."; btn.disabled = true; }

    try {
        const docRef = doc(window.db, "archivo_historico", rutBuscado);
        const docSnap = await getDoc(docRef);

        if (btn) { btn.innerText = textoOriginal; btn.disabled = false; }
        
        if (docSnap.exists()) {
            const res = docSnap.data();
            window.cerrarModalHistorico();
            
            // Bloqueo total de la cápsula del tiempo (Solo Lectura)
            window.isModoHistorico = true;
            document.body.classList.add("modo-historico");
            
            const overlay = document.getElementById("loginOverlay");
            if (overlay) {
                overlay.style.opacity = "0";
                setTimeout(() => overlay.style.display = "none", 500);
            }
            
            const usuario = JSON.parse(sessionStorage.getItem("FarmaPerfil_Sesion") || "{}");
            if (usuario.nombre) {
                const displayNombre = document.getElementById("displayUserName");
                const displayRol = document.getElementById("displayUserRole");
                if (displayNombre) displayNombre.innerText = usuario.nombre;
                if (displayRol) displayRol.innerText = usuario.rol;
            }
            
            window.limpiarFormularioPerfil();
            
            // Inyección de datos
            document.getElementById("rut").value = res.rut || "";
            document.getElementById("paciente").value = res.nombre || "";
            document.getElementById("peso").value = res.peso || "";
            document.getElementById("ficha").value = res.ficha || "";
            document.getElementById("fechaIngreso").value = res.fechaIngreso || "";
            document.getElementById("diagnostico").value = res.diagnostico || "";
            document.getElementById("alergiaPaciente").value = res.alergia || "";
            document.getElementById("genero").value = res.genero || "";
            
            const selectSrv = document.getElementById("servicio");
            selectSrv.innerHTML = `<option value="${res.servicio}">${res.servicio}</option>`;
            selectSrv.value = res.servicio;
            
            const selectCama = document.getElementById("cama");
            selectCama.innerHTML = `<option value="${res.cama}">${res.cama}</option>`;
            selectCama.value = res.cama;
            
            const inputsFecha = document.querySelectorAll(".header-fecha");
            if (res.fechasCabecera) {
                res.fechasCabecera.forEach((fec, idx) => { if (inputsFecha[idx]) inputsFecha[idx].value = fec; });
            }
            
            const filas = document.querySelectorAll("#grillaFila tr");
            if (res.medicamentos) {
                res.medicamentos.forEach((med, idx) => {
                    if (filas[idx]) {
                        const inputs = filas[idx].querySelectorAll("input");
                        inputs[0].value = med.farmaco || "";
                        inputs[1].value = med.via || "";
                        inputs[2].value = med.dosis || "";
                        inputs[3].value = med.posologia || "";
                        for (let d = 0; d < 10; d++) {
                            if (inputs[5 + d] && med.dias && med.dias[d] !== undefined) {
                                inputs[5 + d].value = med.dias[d];
                                window.syncCheckUI(inputs[5 + d]);
                            }
                        }
                    }
                });
            }
            
            const sidebarSaldos = document.getElementById("sidebar-saldos-content");
            if(sidebarSaldos) {
                sidebarSaldos.innerHTML = `<div style="padding: 20px; text-align: center; color: #ff9800; font-size: 14px; font-weight: bold;"><span class="material-icons-round" style="font-size: 42px; display:block; margin-bottom: 10px;">history</span>MODO HISTÓRICO ACTIVO<br><span style="font-size:12px; font-weight:normal; color:var(--text-muted); display:block; margin-top:10px;">El autoguardado y los cálculos están deshabilitados por seguridad clínica.</span></div>`;
            }
            
            const status = document.getElementById("statusGuardado");
            if (status) status.innerHTML = `<span class="material-icons-round" style="font-size: 18px; color: #ff9800;">history</span> <span style="color: #ff9800;">Archivo de Solo Lectura</span>`;
            
            window.mostrarToastFarmacia("Se ha cargado el perfil archivado del paciente.", "Cápsula del Tiempo");
        } else {
            alert("❌ No se encontró ningún egreso reciente con el RUT: " + rutBuscado);
        }
    } catch (err) {
        if (btn) { btn.innerText = textoOriginal; btn.disabled = false; }
        alert("❌ Error de conexión con Firestore: " + err.message);
    }
};

// ============================================================================
// 17. MODAL BUSCADOR UNIVERSAL Y CENSO HOSPITALARIO (FIRESTORE)
// ============================================================================
window.pacientesCensoData = [];

window.abrirModalCenso = async function() {
    const modal = document.getElementById("modal-censo");
    if (modal) {
        modal.style.display = "flex"; 
        setTimeout(() => modal.classList.add("show"), 10);
        
        document.getElementById("censo-resumen-grid").innerHTML = "";
        document.getElementById("lista-censo-pacientes").innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 12px; margin-top: 30px;"><span class="material-icons-round" style="font-size: 32px; display: block; margin-bottom: 10px; color: var(--accent-green);">radar</span>Escaneando servicios del hospital en tiempo real...</div>`;
        document.getElementById("input-buscar-censo").value = "";

        try {
            // Escanea toda la colección de camas activas en la nube
            const snapCamas = await getDocs(collection(window.db, "camas_activas"));
            window.pacientesCensoData = [];
            const conteoPorServicio = {};

            snapCamas.forEach(docSnap => {
                const d = docSnap.data();
                if (d && d.nombre && d.nombre.trim() !== "" && d.servicio) {
                    window.pacientesCensoData.push(d);
                    const srv = d.servicio.toUpperCase();
                    conteoPorServicio[srv] = (conteoPorServicio[srv] || 0) + 1;
                }
            });

            let htmlResumen = "";
            const serviciosRadar = ["MEDICINA", "CIRUGIA", "UCI", "UTI", "UCM", "UCE", "MATERNIDAD", "PEDIATRIA", "PENSIONADO"];
            
            serviciosRadar.forEach(srv => {
                const ocupadas = conteoPorServicio[srv] || 0;
                htmlResumen += `<div class="censo-card" style="cursor: pointer;" onclick="window.filtrarPorServicio('${srv}', this)">
                                  <div class="censo-card-title">${srv}</div>
                                  <div class="censo-card-data">${ocupadas} <span>pacientes</span></div>
                                </div>`;
            });
            
            document.getElementById("censo-resumen-grid").innerHTML = htmlResumen;
            window.filtrarListaCenso(); 

        } catch (err) {
            console.error("Error en el radar de camas:", err);
            document.getElementById("lista-censo-pacientes").innerHTML = `<div style="text-align:center; padding:10px; color:var(--accent-red); font-size:12px;">Error al escanear el hospital.</div>`;
        }
    }
};

window.cerrarModalCenso = function() {
    const modal = document.getElementById("modal-censo");
    if (modal) { modal.classList.remove("show"); setTimeout(() => modal.style.display = "none", 400); }
};

window.filtrarPorServicio = function(servicio, elemento) {
    const inputBuscar = document.getElementById("input-buscar-censo");
    
    // Si vuelve a hacer clic en el mismo, deselecciona
    if (inputBuscar.value === servicio) {
        inputBuscar.value = "";
        document.querySelectorAll('.censo-card').forEach(c => {
            c.style.background = ""; c.style.borderColor = "";
        });
    } else {
        inputBuscar.value = servicio;
        document.querySelectorAll('.censo-card').forEach(c => {
            c.style.background = ""; c.style.borderColor = "";
        });
        elemento.style.background = "rgba(0, 230, 118, 0.1)";
        elemento.style.borderColor = "var(--accent-green)";
    }
    window.filtrarListaCenso(); 
};

window.filtrarListaCenso = function() {
    const textoIngresado = document.getElementById("input-buscar-censo").value.trim();
    const terminoUpper = textoIngresado.toUpperCase();
    const terminoLower = window.quitarTildes(textoIngresado.toLowerCase());
    const listaUI = document.getElementById("lista-censo-pacientes");
    
    let filtrados = window.pacientesCensoData;
    
    if (textoIngresado) {
        filtrados = window.pacientesCensoData.filter(p => {
            const servLimpio = (p.servicio || "").trim().toUpperCase();
            const servLower = window.quitarTildes((p.servicio || "").trim().toLowerCase());
            const nombreLimpio = window.quitarTildes((p.nombre || "").toLowerCase());
            const rutLimpio = window.quitarTildes((p.rut || "").toLowerCase());
            const camaLimpia = window.quitarTildes((p.cama || "").toLowerCase());

            const esBusquedaPorServicioExacto = [
                "CIRUGIA", "MATERNIDAD", "MEDICINA", "PEDIATRIA", "PENSIONADO", 
                "UCE", "UCI", "UCM", "UTI"
            ].includes(terminoUpper);
            
            if (esBusquedaPorServicioExacto) {
                return servLimpio === terminoUpper;
            } else {
                return nombreLimpio.includes(terminoLower) || 
                       rutLimpio.includes(terminoLower) || 
                       camaLimpia.includes(terminoLower) ||
                       servLower.includes(terminoLower);
            }
        });
    }

    let html = "";
    if (filtrados.length === 0) {
        html = `<div style="text-align:center; padding:10px; color:var(--text-muted); font-size:12px;">No se encontraron pacientes activos con esos datos.</div>`;
    } else {
        filtrados.forEach(p => {
            html += `<div class="lista-historica-item" style="border-left: 4px solid var(--accent-green);" onclick="window.irAPacienteCenso('${p.servicio}', '${p.cama}')">
                        <div>
                            <strong style="display:block; color:var(--text-main); font-size:14px; text-transform:uppercase;">${p.nombre}</strong>
                            <span style="font-size:12px; color:var(--text-muted); font-weight: bold;">${p.servicio} | ${p.cama}</span>
                            <span style="font-size:11px; color:var(--text-muted); display: block;">RUT: ${p.rut}</span>
                        </div>
                        <button class="btn-validar" style="padding: 6px 12px; font-size: 10px; background: rgba(0, 230, 118, 0.2); color: var(--accent-green); box-shadow: none;">IR A CAMA <span class="material-icons-round" style="font-size: 14px; vertical-align: middle;">arrow_forward</span></button>
                     </div>`;
        });
    }
    listaUI.innerHTML = html;
};

// TELETRANSPORTADOR DESDE EL BUSCADOR A LA CAMA
window.irAPacienteCenso = function(servicioSeleccionado, camaSeleccionada) {
    window.cerrarModalCenso();
    
    // Configuramos el select oculto para burlar la pantalla de inicio
    const selectInicio = document.getElementById("loginServicioSelect");
    if (selectInicio) {
        let existe = Array.from(selectInicio.options).some(opt => opt.value === servicioSeleccionado);
        if (!existe) selectInicio.appendChild(new Option(servicioSeleccionado, servicioSeleccionado));
        selectInicio.value = servicioSeleccionado;
    }
    
    window.comenzarTurnoWeb(); 
    
    // Tras la animación de entrada, fijamos la cama y descargamos los datos
    setTimeout(() => {
        const selectCama = document.getElementById("cama");
        if (selectCama) {
            let existe = Array.from(selectCama.options).some(opt => opt.value === camaSeleccionada);
            if (!existe) selectCama.appendChild(new Option(camaSeleccionada, camaSeleccionada));
            selectCama.value = camaSeleccionada;
            window.cargarTratamientoPacienteCama();
        }
    }, 500); 
};