// ============================================
// IMPORTAR FIREBASE
// ============================================

import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    setDoc,
    addDoc
} from "firebase/firestore";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";

// ============================================
// CONFIGURACIÓN DE FIREBASE
// ¡REEMPLAZA CON TUS VALORES!
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyAnfbt24mnC1cR_sMl2FSsnNXaMbLc2PO0",
  authDomain: "birdmatch-lima.firebaseapp.com",
  projectId: "birdmatch-lima",
  storageBucket: "birdmatch-lima.firebasestorage.app",
  messagingSenderId: "166632281489",
  appId: "1:166632281489:web:03ec3d3c4b92413aa17630"
};

// ============================================
// INICIALIZAR FIREBASE
// ============================================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("✅ Firebase inicializado correctamente");

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

async function registrarUsuario(email, password, nombre, rol) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "usuarios", user.uid), {
            nombre: nombre,
            email: email,
            rol: rol,
            activo: true,
            creadoEn: new Date().toISOString()
        });

        console.log("✅ Usuario registrado:", user.uid);
        return { success: true, user: user };
    } catch (error) {
        console.error("❌ Error en registro:", error);
        return { success: false, error: error.message };
    }
}

async function iniciarSesion(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("✅ Usuario autenticado:", user.uid);
        return { success: true, user: user };
    } catch (error) {
        console.error("❌ Error en inicio de sesión:", error);
        return { success: false, error: error.message };
    }
}

async function cerrarSesion() {
    try {
        await signOut(auth);
        console.log("✅ Sesión cerrada");
        return { success: true };
    } catch (error) {
        console.error("❌ Error al cerrar sesión:", error);
        return { success: false, error: error.message };
    }
}

// ============================================
// FUNCIONES DE INTERFAZ
// ============================================

function mostrarMensaje(elementoId, mensaje, tipo) {
    const elemento = document.getElementById(elementoId);
    if (!elemento) return;
    elemento.textContent = mensaje;
    elemento.className = `mensaje mensaje-${tipo}`;
    elemento.classList.remove('hidden');
}

function limpiarMensaje(elementoId) {
    const elemento = document.getElementById(elementoId);
    if (!elemento) return;
    elemento.textContent = '';
    elemento.className = 'mensaje hidden';
}

function mostrarSeccionPrincipal() {
    const registro = document.getElementById('seccion-registro');
    const login = document.getElementById('seccion-login');
    const principal = document.getElementById('seccion-principal');
    if (registro) registro.classList.add('hidden');
    if (login) login.classList.add('hidden');
    if (principal) principal.classList.remove('hidden');
}

window.mostrarLogin = function() {
    const registro = document.getElementById('seccion-registro');
    const login = document.getElementById('seccion-login');
    const principal = document.getElementById('seccion-principal');
    if (registro) registro.classList.add('hidden');
    if (login) login.classList.remove('hidden');
    if (principal) principal.classList.add('hidden');
};

window.mostrarRegistro = function() {
    const registro = document.getElementById('seccion-registro');
    const login = document.getElementById('seccion-login');
    const principal = document.getElementById('seccion-principal');
    if (registro) registro.classList.remove('hidden');
    if (login) login.classList.add('hidden');
    if (principal) principal.classList.add('hidden');
};

function mostrarUsuarioAutenticado(userData) {
    const nombreEl = document.getElementById('usuario-nombre');
    const emailEl = document.getElementById('usuario-email');
    const rolEl = document.getElementById('usuario-rol');

    if (nombreEl) nombreEl.textContent = userData.nombre || 'Sin nombre';
    if (emailEl) emailEl.textContent = userData.email || 'Sin correo';
    if (rolEl) rolEl.textContent = userData.rol || 'Sin rol';
}

// ============================================
// MANEJAR REGISTRO
// ============================================

window.handleRegistro = async function() {
    const nombre = document.getElementById('registro-nombre').value.trim();
    const email = document.getElementById('registro-email').value.trim();
    const password = document.getElementById('registro-password').value;
    const rol = document.getElementById('registro-rol').value;

    if (!nombre) {
        mostrarMensaje('registro-mensaje', 'Por favor, ingresa tu nombre completo', 'error');
        return;
    }
    if (!email) {
        mostrarMensaje('registro-mensaje', 'Por favor, ingresa tu correo electrónico', 'error');
        return;
    }
    if (!password || password.length < 6) {
        mostrarMensaje('registro-mensaje', 'La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    limpiarMensaje('registro-mensaje');

    const resultado = await registrarUsuario(email, password, nombre, rol);

    if (resultado.success) {
        mostrarMensaje('registro-mensaje', '✅ Cuenta creada correctamente', 'exito');
        document.getElementById('registro-nombre').value = '';
        document.getElementById('registro-email').value = '';
        document.getElementById('registro-password').value = '';
        setTimeout(() => {
            limpiarMensaje('registro-mensaje');
            window.mostrarLogin();
        }, 2000);
    } else {
        mostrarMensaje('registro-mensaje', `❌ Error: ${resultado.error}`, 'error');
    }
};

// ============================================
// MANEJAR INICIO DE SESIÓN
// ============================================

window.handleLogin = async function() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email) {
        mostrarMensaje('login-mensaje', 'Por favor, ingresa tu correo electrónico', 'error');
        return;
    }
    if (!password) {
        mostrarMensaje('login-mensaje', 'Por favor, ingresa tu contraseña', 'error');
        return;
    }

    limpiarMensaje('login-mensaje');

    const resultado = await iniciarSesion(email, password);

    if (resultado.success) {
        mostrarMensaje('login-mensaje', '✅ Inicio de sesión exitoso', 'exito');
    } else {
        let mensajeError = resultado.error;
        if (resultado.error.includes('user-not-found')) {
            mensajeError = 'No existe una cuenta con este correo';
        } else if (resultado.error.includes('wrong-password')) {
            mensajeError = 'Contraseña incorrecta';
        } else if (resultado.error.includes('invalid-email')) {
            mensajeError = 'Correo electrónico inválido';
        } else if (resultado.error.includes('too-many-requests')) {
            mensajeError = 'Demasiados intentos. Espera unos minutos';
        }
        mostrarMensaje('login-mensaje', `❌ Error: ${mensajeError}`, 'error');
    }
};

// ============================================
// MANEJAR CIERRE DE SESIÓN
// ============================================

window.handleCerrarSesion = async function() {
    if (!confirm('¿Estás seguro de que quieres cerrar sesión?')) return;
    const resultado = await cerrarSesion();
    if (resultado.success) {
        window.mostrarLogin();
    } else {
        alert('Error al cerrar sesión: ' + resultado.error);
    }
};

// ============================================
// CARGAR PERFILES DESDE FIRESTORE
// ============================================

window.cargarPerfiles = async function() {
    const contenedor = document.getElementById('lista-perfiles');
    if (!contenedor) return;

    const user = auth.currentUser;
    if (!user) {
        contenedor.innerHTML = '<p>🔒 Debes iniciar sesión para ver perfiles</p>';
        return;
    }

    contenedor.innerHTML = '<p>⏳ Cargando perfiles...</p>';

    try {
        let perfiles = [];
        let snapshot;

        // Intentar cargar desde perfiles_publicos
        try {
            snapshot = await getDocs(collection(db, "perfiles_publicos"));
            perfiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.log("⚠️ No se encontró 'perfiles_publicos', intentando con 'perfiles'");
            snapshot = await getDocs(collection(db, "perfiles"));
            perfiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        contenedor.innerHTML = '';

        if (perfiles.length === 0) {
            contenedor.innerHTML = '<p>📭 No hay perfiles disponibles</p>';
            return;
        }

        perfiles.forEach((perfil) => {
            const div = document.createElement('div');
            div.className = 'perfil-card';

            const emojiNivel = {
                'inicio': '😊',
                'aficionado': '🐦',
                'experto': '✈'
            }[perfil.nivel] || '🐦';

            div.innerHTML = `
                <h3>${perfil.nombre || 'Sin nombre'}, ${perfil.edad || '?'}</h3>
                <span class="nivel">${emojiNivel} ${perfil.nivel || 'Sin nivel'}</span>
                <div class="bio">${perfil.bio || 'Sin descripción'}</div>
                <div class="tags">
                    ${(perfil.tags || []).map(tag => `<span>#${tag}</span>`).join('')}
                </div>
            `;
            contenedor.appendChild(div);
        });

        console.log(`✅ ${perfiles.length} perfiles cargados`);
    } catch (error) {
        console.error('❌ Error al cargar perfiles:', error);
        contenedor.innerHTML = `<p style="color:red;">❌ Error: ${error.message}</p>`;
    }
};

// ============================================
// ESCUCHAR CAMBIOS EN AUTENTICACIÓN
// ============================================

onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("✅ Usuario autenticado:", user.uid);

        try {
            const userDoc = await getDoc(doc(db, "usuarios", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log("📋 Datos del usuario:", userData);
                mostrarUsuarioAutenticado(userData);
                mostrarSeccionPrincipal();

                setTimeout(() => {
                    window.cargarPerfiles();
                }, 500);
            } else {
                console.log("⚠️ El usuario no tiene datos en Firestore");
                mostrarMensaje('login-mensaje', '⚠️ Usuario sin datos en Firestore', 'error');
                window.mostrarLogin();
            }
        } catch (error) {
            console.error("❌ Error al obtener datos:", error);
            window.mostrarLogin();
        }
    } else {
        console.log("🔒 Usuario no autenticado");
        window.mostrarLogin();
    }
});

console.log("🚀 BirdMatch Lima - Listo para autenticación");
