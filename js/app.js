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
// VARIABLES PARA EL SISTEMA DE MATCH
// ============================================

let perfilesDisponibles = [];
let indiceActual = 0;
let misTags = [];

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

async function registrarUsuario(email, password, nombre) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "usuarios", user.uid), {
            nombre: nombre,
            email: email,
            activo: true,
            creado: new Date().toISOString()
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
    const match = document.getElementById('seccion-match');
    
    if (registro) registro.classList.add('hidden');
    if (login) login.classList.add('hidden');
    if (principal) principal.classList.remove('hidden');
    if (match) match.classList.add('hidden');
}

window.mostrarLogin = function() {
    const registro = document.getElementById('seccion-registro');
    const login = document.getElementById('seccion-login');
    const principal = document.getElementById('seccion-principal');
    const match = document.getElementById('seccion-match');
    
    if (registro) registro.classList.add('hidden');
    if (login) login.classList.remove('hidden');
    if (principal) principal.classList.add('hidden');
    if (match) match.classList.add('hidden');
};

window.mostrarRegistro = function() {
    const registro = document.getElementById('seccion-registro');
    const login = document.getElementById('seccion-login');
    const principal = document.getElementById('seccion-principal');
    const match = document.getElementById('seccion-match');
    
    if (registro) registro.classList.remove('hidden');
    if (login) login.classList.add('hidden');
    if (principal) principal.classList.add('hidden');
    if (match) match.classList.add('hidden');
};

function mostrarUsuarioAutenticado(userData) {
    const nombreEl = document.getElementById('usuario-nombre');
    const emailEl = document.getElementById('usuario-email');

    if (nombreEl) nombreEl.textContent = userData.nombre || 'Sin nombre';
    if (emailEl) emailEl.textContent = userData.email || 'Sin correo';
}

// ============================================
// MANEJAR REGISTRO
// ============================================

window.handleRegistro = async function() {
    const nombre = document.getElementById('registro-nombre').value.trim();
    const email = document.getElementById('registro-email').value.trim();
    const password = document.getElementById('registro-password').value;

    if (!nombre || !email || !password || password.length < 6) {
        mostrarMensaje('registro-mensaje', 'Completa todos los campos (contraseña mínimo 6 caracteres)', 'error');
        return;
    }

    limpiarMensaje('registro-mensaje');

    const resultado = await registrarUsuario(email, password, nombre);

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

    if (!email || !password) {
        mostrarMensaje('login-mensaje', 'Completa todos los campos', 'error');
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
// CARGAR PERFILES (LISTA)
// ============================================

window.cargarPerfiles = async function() {
    const contenedor = document.getElementById('lista-perfiles');
    if (!contenedor) return;

    const user = auth.currentUser;
    if (!user) {
        contenedor.innerHTML = '<p>🔒 Debes iniciar sesión para ver perfiles</p>';
        return;
    }

    contenedor.innerHTML = '<p class="cargando">⏳ Cargando perfiles...</p>';

    try {
        let perfiles = [];
        let snapshot;

        try {
            snapshot = await getDocs(collection(db, "perfiles"));
            perfiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.log("⚠️ Error al cargar perfiles:", error);
            contenedor.innerHTML = `<p style="color:red;">❌ Error: ${error.message}</p>`;
            return;
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
// COMPATIBILIDAD REAL — basada en tags compartidos
// ============================================

function calcularCompatibilidad(misTags, tagsPerfil) {
    const a = (misTags || []).map(t => t.toLowerCase().trim());
    const b = (tagsPerfil || []).map(t => t.toLowerCase().trim());

    if (a.length === 0 || b.length === 0) {
        return { porcentaje: 0, compartidos: [] };
    }

    const compartidos = a.filter(tag => b.includes(tag));
    const union = new Set([...a, ...b]);
    const porcentaje = Math.round((compartidos.length / union.size) * 100);

    return { porcentaje, compartidos };
}

// ============================================
// MOSTRAR PERFIL ACTUAL (MATCH)
// ============================================

function mostrarPerfilActual() {
    const contenedor = document.getElementById('perfil-match');
    if (!contenedor) {
        console.error("❌ Contenedor 'perfil-match' no encontrado");
        return;
    }

    console.log("🔍 mostrarPerfilActual ejecutado");
    console.log("📊 perfilesDisponibles:", perfilesDisponibles);
    console.log("📊 indiceActual:", indiceActual);

    if (perfilesDisponibles.length === 0) {
        contenedor.innerHTML = '<p>📭 No hay más perfiles disponibles</p>';
        return;
    }

    const perfil = perfilesDisponibles[indiceActual];
    if (!perfil) {
        contenedor.innerHTML = '<p>✅ ¡Ya revisaste todos los perfiles!</p>';
        return;
    }

    console.log("📋 Perfil actual:", perfil);

    const emojiNivel = {
        'inicio': '😊',
        'aficionado': '🐦',
        'experto': '✈'
    }[perfil.nivel] || '🐦';

    const { porcentaje: compatibilidad, compartidos } = calcularCompatibilidad(misTags, perfil.tags);

    contenedor.innerHTML = `
        <div class="perfil-match-card">
            <div class="perfil-match-header">
                <span class="perfil-match-emoji">${emojiNivel}</span>
                <h2>${perfil.nombre || 'Sin nombre'}, ${perfil.edad || '?'}</h2>
                <span class="perfil-match-nivel">${perfil.nivel || 'Sin nivel'}</span>
            </div>
            
            <div class="perfil-match-bio">
                "${perfil.bio || 'Sin descripción'}"
            </div>
            
            <div class="perfil-match-tags">
                ${(perfil.tags || []).map(tag => `<span>#${tag}</span>`).join('')}
            </div>
            
            <div class="perfil-match-compatibilidad">
                🤝 ${compatibilidad}% COMPATIBILIDAD
                ${compartidos.length > 0 ? `<br><small>En común: ${compartidos.map(t => '#' + t).join(', ')}</small>` : ''}
            </div>
            
            <div class="perfil-match-acciones">
                <button class="btn-match btn-no" onclick="rechazarPerfil()">
                    ✖️ No
                </button>
                <button class="btn-match btn-si" onclick="gustarPerfil('${perfil.id}')">
                    ❤️ Sí
                </button>
            </div>
            
            <div style="font-size: 12px; color: #999; text-align: center; margin-top: 10px;">
                Perfil ${indiceActual + 1} de ${perfilesDisponibles.length}
            </div>
        </div>
    `;
    
    console.log("✅ Tarjeta renderizada correctamente");
}

function siguientePerfil() {
    indiceActual++;
    if (indiceActual >= perfilesDisponibles.length) {
        document.getElementById('perfil-match').innerHTML = '<p>✅ ¡Ya revisaste todos los perfiles!</p>';
        return;
    }
    mostrarPerfilActual();
}

// ============================================
// MATCHES — registro persistente de matches mutuos
// ============================================

// ID determinístico: combinar ambos UID ordenados alfabéticamente.
// Ventaja sobre addDoc(): si los dos usuarios se dan like el uno al
// otro en cualquier orden, siempre generan el MISMO ID de documento,
// así que nunca se puede crear un match duplicado por accidente.
function idDeMatch(uid1, uid2) {
    return [uid1, uid2].sort().join('_');
}

async function crearMatchSiNoExiste(uid1, uid2, nombre1, nombre2) {
    const matchId = idDeMatch(uid1, uid2);
    const matchRef = doc(db, "matches", matchId);
    const existente = await getDoc(matchRef);

    if (!existente.exists()) {
        await setDoc(matchRef, {
            participantes: [uid1, uid2].sort(),
            nombres: { [uid1]: nombre1, [uid2]: nombre2 },
            timestamp: new Date().toISOString()
        });
        console.log(`✅ Match creado en Firestore: ${matchId}`);
    } else {
        console.log(`ℹ️ El match ${matchId} ya existía, no se duplica`);
    }
}

// ============================================
// BANNER DE MATCH
// ============================================

function mostrarBannerMatch(nombreOtro) {
    const banner = document.getElementById('match-banner');
    if (!banner) return;
    banner.textContent = `🎉 ¡Match con ${nombreOtro}! 🎉`;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 4000);
}

// ============================================
// DAR "ME GUSTA" A UN PERFIL
// ============================================

window.gustarPerfil = async function(perfilId) {
    const user = auth.currentUser;
    if (!user) {
        alert('🔒 Debes iniciar sesión');
        return;
    }

    // Guardamos el perfil actual ANTES de avanzar el índice,
    // para tener su nombre disponible al armar el banner/match.
    const perfilActual = perfilesDisponibles[indiceActual];
    const miNombre = document.getElementById('usuario-nombre-match').textContent
        || document.getElementById('usuario-nombre').textContent
        || 'Alguien';

    try {
        await addDoc(collection(db, "Likes"), {
            de: user.uid,
            a: perfilId,
            timestamp: new Date().toISOString()
        });

        console.log(`❤️ Like dado al perfil: ${perfilId}`);

        // ¿La otra persona ya me dio like antes? (like recíproco)
        const q = query(
            collection(db, "Likes"),
            where("de", "==", perfilId),
            where("a", "==", user.uid)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const nombreOtro = perfilActual?.nombre || 'esa persona';
            mostrarBannerMatch(nombreOtro);
            await crearMatchSiNoExiste(user.uid, perfilId, miNombre, nombreOtro);
        }

        siguientePerfil();
    } catch (error) {
        console.error('❌ Error al dar like:', error);
        alert('❌ Error: ' + error.message);
    }
};

window.rechazarPerfil = function() {
    console.log(`✖️ Perfil rechazado`);
    siguientePerfil();
};

// ============================================
// MOSTRAR LISTA DE PERFILES (VOLVER)
// ============================================

window.mostrarListaPerfiles = function() {
    document.getElementById('seccion-match').classList.add('hidden');
    document.getElementById('seccion-principal').classList.remove('hidden');
    window.cargarPerfiles();
};

// ============================================
// GUARDAR MI PERFIL / EXPLORAR POR NIVEL
// ============================================

window.guardarMiPerfil = async function() {
    console.log("🔍 guardarMiPerfil ejecutado");

    const user = auth.currentUser;
    if (!user) {
        alert('🔒 Debes iniciar sesión');
        return;
    }

    const tagsInput = document.getElementById('mis-tags').value.trim();
    misTags = tagsInput
        ? tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0)
        : [];

    const miNivel = document.getElementById('mi-nivel-select').value;
    const miNombre = document.getElementById('usuario-nombre').textContent;

    try {
        await setDoc(doc(db, "usuarios", user.uid), {
            nivel: miNivel,
            tags: misTags
        }, { merge: true });

        await setDoc(doc(db, "perfiles", user.uid), {
            nombre: miNombre,
            nivel: miNivel,
            tags: misTags
        }, { merge: true });

        console.log(`✅ Perfil guardado — nivel: ${miNivel}, tags:`, misTags);
        mostrarMensaje('perfil-mensaje', '✅ Perfil guardado correctamente', 'exito');
    } catch (error) {
        console.error('❌ Error al guardar perfil:', error);
        mostrarMensaje('perfil-mensaje', '❌ No se pudo guardar tu perfil: ' + error.message, 'error');
    }
};

// ============================================
// EXPLORAR PERFILES POR NIVEL — filtro directo
// ============================================

window.verPerfilesPorNivel = async function(nivel) {
    console.log("🔍 verPerfilesPorNivel ejecutado con nivel:", nivel);

    const user = auth.currentUser;
    if (!user) {
        alert('🔒 Debes iniciar sesión');
        return;
    }

    document.getElementById('seccion-principal').classList.add('hidden');
    document.getElementById('seccion-match').classList.remove('hidden');

    const nombre = document.getElementById('usuario-nombre').textContent;
    const email = document.getElementById('usuario-email').textContent;

    document.getElementById('usuario-nombre-match').textContent = nombre || 'Sin nombre';
    document.getElementById('usuario-email-match').textContent = email || 'Sin correo';

    await window.cargarPerfilesPorNivelDirecto(nivel);
};

window.cargarPerfilesPorNivelDirecto = async function(nivel) {
    console.log("🔍 cargarPerfilesPorNivelDirecto ejecutado con nivel:", nivel);

    const contenedor = document.getElementById('perfil-match');
    const user = auth.currentUser;
    if (!user) {
        contenedor.innerHTML = '<p>🔒 Debes iniciar sesión</p>';
        return;
    }

    contenedor.innerHTML = '<p>⏳ Buscando perfiles...</p>';

    try {
        const q = query(
            collection(db, "perfiles"),
            where("nivel", "==", nivel)
        );
        const snapshot = await getDocs(q);
        console.log("📊 Documentos encontrados:", snapshot.size);

        perfilesDisponibles = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(perfil => perfil.id !== user.uid);
        indiceActual = 0;

        if (perfilesDisponibles.length === 0) {
            contenedor.innerHTML = `<p>📭 No hay perfiles de nivel "${nivel}" disponibles</p>`;
            return;
        }

        mostrarPerfilActual();
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

                if (userData.tags) {
                    misTags = userData.tags;
                    document.getElementById('mis-tags').value = userData.tags.join(', ');
                }
                if (userData.nivel) {
                    document.getElementById('mi-nivel-select').value = userData.nivel;
                }

                setTimeout(() => {
                    window.cargarPerfiles();
                }, 500);
            } else {
                console.log("⚠️ El usuario no tiene datos en Firestore");
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
