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
    setDoc
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
// ============================================

const firebaseConfig = {
 " apiKey": "AIzaSyAnfbt24mnC1cR_sMl2FSsnNXaMbLc2PO0",
  "authDomain": "birdmatch-lima.firebaseapp.com",
  "projectId": "birdmatch-lima",
  "storageBucket": "birdmatch-lima.firebasestorage.app",
  "messagingSenderId": "166632281489",
 " appId": "1:166632281489:web:03ec3d3c4b92413aa17630"
}

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

function mostrarRegistro() {
    document.getElementById('seccion-registro').classList.remove('hidden');
    document.getElementById('seccion-login').classList.add('hidden');
    document.getElementById('seccion-principal').classList.add('hidden');
}

function mostrarLogin() {
    document.getElementById('seccion-registro').classList.add('hidden');
    document.getElementById('seccion-login').classList.remove('hidden');
    document.getElementById('seccion-principal').classList.add('hidden');
}

function mostrarSeccionPrincipal() {
    document.getElementById('seccion-registro').classList.add('hidden');
    document.getElementById('seccion-login').classList.add('hidden');
    document.getElementById('seccion-principal').classList.remove('hidden');
}

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
            mostrarLogin();
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
        }
        mostrarMensaje('login-mensaje', `❌ Error: ${mensajeError}`, 'error');
    }
};

// ============================================
// MANEJAR CIERRE DE SESIÓN
// ============================================

window.handleCerrarSesion = async function() {
    const confirmar = confirm('¿Estás seguro de que quieres cerrar sesión?');
    if (!confirmar) return;

    const resultado = await cerrarSesion();
    if (resultado.success) {
        mostrarLogin();
    } else {
        alert('Error al cerrar sesión: ' + resultado.error);
    }
};

// ============================================
// CARGAR CLASES
// ============================================

window.cargarClases = async function() {
    const lista = document.getElementById('lista-clases');
    if (!lista) return;

    const user = auth.currentUser;
    if (!user) {
        lista.innerHTML = '<li>🔒 Debes iniciar sesión para ver las clases</li>';
        return;
    }

    lista.innerHTML = '<li>⏳ Cargando clases...</li>';

    try {
        const q = query(
            collection(db, "CLASES"),
            where("publicada", "==", true)
        );
        const querySnapshot = await getDocs(q);

        lista.innerHTML = '';

        if (querySnapshot.empty) {
            lista.innerHTML = '<li>📭 No hay clases publicadas disponibles</li>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `
                <div style="font-weight: bold; color: #FF6D00;">${data.titulo || 'Sin título'}</div>
                <div style="color: #666;">${data.descripcion || 'Sin descripción'}</div>
                <div style="font-size: 12px; color: #999;">Orden: ${data.orden || 'N/A'}</div>
            `;
            lista.appendChild(li);
        });

        console.log(`✅ ${querySnapshot.size} clases cargadas`);
    } catch (error) {
        console.error('❌ Error al cargar clases:', error);
        lista.innerHTML = `<li style="color:red;">❌ Error: ${error.message}</li>`;
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
                
                // Cargar clases automáticamente
                setTimeout(() => {
                    window.cargarClases();
                }, 500);
            } else {
                console.log("⚠️ El usuario no tiene datos en Firestore");
                mostrarMensaje('login-mensaje', '⚠️ Usuario sin datos en Firestore', 'error');
                mostrarLogin();
            }
        } catch (error) {
            console.error("❌ Error al obtener datos:", error);
            mostrarLogin();
        }
    } else {
        console.log("🔒 Usuario no autenticado");
        mostrarLogin();
    }
});

console.log("🚀 Aplicación lista - Esperando autenticación...");
