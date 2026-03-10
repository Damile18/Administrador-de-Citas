// Variables globales
let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
let pacientes = JSON.parse(localStorage.getItem('pacientes')) || [];
let currentUser = null;
let currentDeleteId = null;

// Usuario administrador por defecto
const adminDefault = {
    id: 'admin-default',
    nombre: 'Administrador',
    email: 'admin@hospital.com',
    username: 'admin',
    password: 'admin123',
    tipo: 'admin',
    fechaRegistro: new Date().toISOString()
};

// Verificar si hay usuarios, si no, agregar admin por defecto
if (usuarios.length === 0) {
    usuarios.push(adminDefault);
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
}

// Elementos del DOM - Verificar que existan antes de usarlos
const loginContainer = document.getElementById('loginContainer');
const mainPanel = document.getElementById('mainPanel');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.content-section');
const patientForm = document.getElementById('patientForm');
const patientsTableBody = document.getElementById('patientsTableBody');
const recentPatientsBody = document.getElementById('recentPatientsBody');
const sectionTitle = document.getElementById('sectionTitle');
const currentDateSpan = document.getElementById('currentDate');
const searchInput = document.getElementById('searchPatient');
const appointmentsGrid = document.getElementById('appointmentsGrid');
const filterBtns = document.querySelectorAll('.filter-btn');
const confirmModal = document.getElementById('confirmModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const patientToDeleteSpan = document.getElementById('patientToDelete');
const loginHint = document.getElementById('loginHint');
const loggedUser = document.getElementById('loggedUser');
const userRole = document.getElementById('userRole');

// Función para cambiar entre login y registro
window.switchAuthTab = function(tab) {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginTab && registerTab && loginForm && registerForm) {
        if (tab === 'login') {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
            if (loginHint) loginHint.textContent = 'Usuario: admin | Contraseña: admin123';
        } else {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
            if (loginHint) loginHint.textContent = 'Complete el formulario para registrarse';
        }
    }
};

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.className = `notification ${type} show`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Validar contraseña
function validatePassword(password) {
    if (password.length < 6) {
        return 'La contraseña debe tener al menos 6 caracteres';
    }
    if (!/[A-Z]/.test(password)) {
        return 'La contraseña debe tener al menos una mayúscula';
    }
    if (!/[0-9]/.test(password)) {
        return 'La contraseña debe tener al menos un número';
    }
    return null;
}

// Registro de nuevos usuarios
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById('regNombre')?.value;
        const email = document.getElementById('regEmail')?.value;
        const username = document.getElementById('regUsername')?.value;
        const password = document.getElementById('regPassword')?.value;
        const confirmPassword = document.getElementById('regConfirmPassword')?.value;
        const tipo = document.getElementById('regTipo')?.value;
        
        // Validaciones
        if (!nombre || !email || !username || !password || !confirmPassword || !tipo) {
            showNotification('Todos los campos son obligatorios', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('Las contraseñas no coinciden', 'error');
            return;
        }
        
        const passwordError = validatePassword(password);
        if (passwordError) {
            showNotification(passwordError, 'error');
            return;
        }
        
        // Verificar si el usuario ya existe
        const userExists = usuarios.some(u => u.username === username || u.email === email);
        if (userExists) {
            showNotification('El usuario o email ya está registrado', 'error');
            return;
        }
        
        // Crear nuevo usuario
        const nuevoUsuario = {
            id: Date.now().toString(),
            nombre: nombre,
            email: email,
            username: username,
            password: password,
            tipo: tipo,
            fechaRegistro: new Date().toISOString(),
            activo: true
        };
        
        usuarios.push(nuevoUsuario);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        
        showNotification('Registro exitoso. Ahora puedes iniciar sesión', 'success');
        
        // Cambiar a login
        switchAuthTab('login');
        registerForm.reset();
    });
}

// Login
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username')?.value;
        const password = document.getElementById('password')?.value;
        
        if (!username || !password) {
            showNotification('Ingrese usuario y contraseña', 'error');
            return;
        }
        
        // Buscar usuario
        const user = usuarios.find(u => u.username === username && u.password === password && u.activo !== false);
        
        if (user) {
            currentUser = user;
            if (loginContainer) loginContainer.classList.add('hidden');
            if (mainPanel) mainPanel.classList.remove('hidden');
            
            // Actualizar información del usuario
            if (loggedUser) loggedUser.textContent = user.nombre;
            if (userRole) userRole.textContent = user.tipo.charAt(0).toUpperCase() + user.tipo.slice(1);
            
            showNotification(`Bienvenido ${user.nombre}`, 'success');
            
            // Actualizar dashboard
            updateDashboard();
            renderPatientsTable();
            renderAppointments('all');
            
            // Establecer fecha mínima en los inputs de fecha
            const hoy = new Date().toISOString().split('T')[0];
            const fechaInput = document.getElementById('fecha');
            if (fechaInput) fechaInput.min = hoy;
        } else {
            showNotification('Usuario o contraseña incorrectos', 'error');
        }
    });
}

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        currentUser = null;
        if (mainPanel) mainPanel.classList.add('hidden');
        if (loginContainer) loginContainer.classList.remove('hidden');
        if (loginForm) loginForm.reset();
        switchAuthTab('login');
        showNotification('Sesión cerrada exitosamente', 'success');
    });
}

// Navegación
if (navItems.length > 0) {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            const sectionId = item.dataset.section;
            showSection(sectionId);
            
            // Actualizar active en nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function showSection(sectionId) {
    if (!sections.length) return;
    
    sections.forEach(section => section.classList.remove('active'));
    const sectionToShow = document.getElementById(sectionId);
    if (sectionToShow) sectionToShow.classList.add('active');
    
    // Actualizar título
    const titles = {
        'dashboard': 'Inicio',
        'registro': 'Registrar Paciente',
        'lista': 'Lista de Pacientes',
        'citas': 'Citas Programadas'
    };
    if (sectionTitle) sectionTitle.textContent = titles[sectionId] || 'Inicio';
    
    // Actualizar contenido según la sección
    if (sectionId === 'lista') {
        renderPatientsTable();
    } else if (sectionId === 'citas') {
        renderAppointments('all');
    } else if (sectionId === 'dashboard') {
        updateDashboard();
    }
}

// Actualizar fecha
function updateDate() {
    if (!currentDateSpan) return;
    
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    currentDateSpan.textContent = now.toLocaleDateString('es-ES', options);
}
updateDate();

// Registrar paciente
if (patientForm) {
    patientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById('nombre')?.value;
        const telefono = document.getElementById('telefono')?.value;
        const fecha = document.getElementById('fecha')?.value;
        const hora = document.getElementById('hora')?.value;
        const sintomas = document.getElementById('sintomas')?.value;
        const urgencia = document.getElementById('urgencia')?.value;
        
        if (!nombre || !telefono || !fecha || !hora || !sintomas || !urgencia) {
            showNotification('Todos los campos son obligatorios', 'error');
            return;
        }
        
        const nuevoPaciente = {
            id: Date.now(),
            nombre: nombre,
            telefono: telefono,
            fecha: fecha,
            hora: hora,
            sintomas: sintomas,
            urgencia: urgencia,
            fechaRegistro: new Date().toISOString(),
            registradoPor: currentUser ? currentUser.username : 'admin'
        };
        
        pacientes.push(nuevoPaciente);
        localStorage.setItem('pacientes', JSON.stringify(pacientes));
        
        // Limpiar formulario
        patientForm.reset();
        
        // Establecer fecha mínima como hoy
        const hoy = new Date().toISOString().split('T')[0];
        const fechaInput = document.getElementById('fecha');
        if (fechaInput) fechaInput.min = hoy;
        
        showNotification('Paciente registrado exitosamente', 'success');
        
        // Actualizar vistas
        updateDashboard();
        renderPatientsTable();
        renderAppointments('all');
        
        // Ir a la lista de pacientes
        showSection('lista');
    });
}

// Renderizar tabla de pacientes
function renderPatientsTable() {
    if (!patientsTableBody) return;
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    const filteredPacientes = pacientes.filter(p => 
        p.nombre.toLowerCase().includes(searchTerm) || 
        p.telefono.includes(searchTerm)
    );
    
    if (filteredPacientes.length === 0) {
        patientsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px;">No hay pacientes registrados</td></tr>`;
        return;
    }
    
    patientsTableBody.innerHTML = filteredPacientes.map(p => {
        // Escapar comillas simples para evitar errores
        const nombreSeguro = p.nombre.replace(/'/g, "\\'");
        return `
        <tr>
            <td>${p.nombre}</td>
            <td>${p.telefono}</td>
            <td>${p.sintomas.substring(0, 30)}${p.sintomas.length > 30 ? '...' : ''}</td>
            <td>${formatDate(p.fecha)}</td>
            <td>${p.hora}</td>
            <td>
                <span class="urgency-badge ${p.urgencia}">
                    ${p.urgencia.toUpperCase()}
                </span>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="editPatient(${p.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="showDeleteModal(${p.id}, '${nombreSeguro}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `}).join('');
}

// Búsqueda de pacientes
if (searchInput) {
    searchInput.addEventListener('input', renderPatientsTable);
}

// Renderizar citas
function renderAppointments(filter) {
    if (!appointmentsGrid) return;
    
    const hoy = new Date().toISOString().split('T')[0];
    const semana = new Date();
    semana.setDate(semana.getDate() + 7);
    const semanaStr = semana.toISOString().split('T')[0];
    const mes = new Date();
    mes.setMonth(mes.getMonth() + 1);
    const mesStr = mes.toISOString().split('T')[0];
    
    let filteredPacientes = [...pacientes];
    
    switch(filter) {
        case 'hoy':
            filteredPacientes = pacientes.filter(p => p.fecha === hoy);
            break;
        case 'semana':
            filteredPacientes = pacientes.filter(p => p.fecha >= hoy && p.fecha <= semanaStr);
            break;
        case 'mes':
            filteredPacientes = pacientes.filter(p => p.fecha >= hoy && p.fecha <= mesStr);
            break;
        default:
            // 'all' - no filtrar
            break;
    }
    
    // Ordenar por fecha y hora
    filteredPacientes.sort((a, b) => {
        if (a.fecha === b.fecha) {
            return a.hora.localeCompare(b.hora);
        }
        return a.fecha.localeCompare(b.fecha);
    });
    
    if (filteredPacientes.length === 0) {
        appointmentsGrid.innerHTML = '<p class="no-appointments">No hay citas programadas</p>';
        return;
    }
    
    appointmentsGrid.innerHTML = filteredPacientes.map(p => {
        const nombreSeguro = p.nombre.replace(/'/g, "\\'");
        return `
        <div class="appointment-card ${p.urgencia === 'alta' ? 'urgent' : ''}">
            <div class="appointment-header">
                <h3>${p.nombre}</h3>
                <span class="urgency-badge ${p.urgencia}">
                    ${p.urgencia.toUpperCase()}
                </span>
            </div>
            <div class="appointment-body">
                <p>
                    <i class="fas fa-calendar"></i>
                    ${formatDate(p.fecha)}
                </p>
                <p>
                    <i class="fas fa-clock"></i>
                    ${p.hora} hrs
                </p>
                <p>
                    <i class="fas fa-phone"></i>
                    ${p.telefono}
                </p>
                <p>
                    <i class="fas fa-notes-medical"></i>
                    ${p.sintomas.substring(0, 50)}${p.sintomas.length > 50 ? '...' : ''}
                </p>
            </div>
            <div class="appointment-footer">
                <button class="action-btn edit-btn" onclick="editPatient(${p.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="action-btn delete-btn" onclick="showDeleteModal(${p.id}, '${nombreSeguro}')">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `}).join('');
}

// Filtros de citas
if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderAppointments(btn.dataset.filter);
        });
    });
}

// Dashboard
function updateDashboard() {
    const totalPacientesEl = document.getElementById('totalPacientes');
    const citasHoyEl = document.getElementById('citasHoy');
    const proximasCitasEl = document.getElementById('proximasCitas');
    const urgenciasEl = document.getElementById('urgencias');
    
    if (totalPacientesEl) totalPacientesEl.textContent = pacientes.length;
    
    const hoy = new Date().toISOString().split('T')[0];
    const citasHoy = pacientes.filter(p => p.fecha === hoy).length;
    if (citasHoyEl) citasHoyEl.textContent = citasHoy;
    
    const proximasCitas = pacientes.filter(p => p.fecha > hoy).length;
    if (proximasCitasEl) proximasCitasEl.textContent = proximasCitas;
    
    const urgencias = pacientes.filter(p => p.urgencia === 'alta').length;
    if (urgenciasEl) urgenciasEl.textContent = urgencias;
    
    // Pacientes recientes (últimos 5)
    if (recentPatientsBody) {
        const recientes = [...pacientes].reverse().slice(0, 5);
        if (recientes.length === 0) {
            recentPatientsBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;">No hay pacientes registrados</td></tr>`;
        } else {
            recentPatientsBody.innerHTML = recientes.map(p => `
                <tr>
                    <td>${p.nombre}</td>
                    <td>${p.telefono}</td>
                    <td>${p.sintomas.substring(0, 30)}${p.sintomas.length > 30 ? '...' : ''}</td>
                    <td>${formatDate(p.fecha)}</td>
                    <td>${p.hora}</td>
                </tr>
            `).join('');
        }
    }
}

// Funciones de edición y eliminación
window.editPatient = function(id) {
    const paciente = pacientes.find(p => p.id === id);
    if (!paciente) return;
    
    // Llenar formulario con datos del paciente
    const nombreInput = document.getElementById('nombre');
    const telefonoInput = document.getElementById('telefono');
    const fechaInput = document.getElementById('fecha');
    const horaInput = document.getElementById('hora');
    const sintomasInput = document.getElementById('sintomas');
    const urgenciaSelect = document.getElementById('urgencia');
    
    if (nombreInput) nombreInput.value = paciente.nombre;
    if (telefonoInput) telefonoInput.value = paciente.telefono;
    if (fechaInput) fechaInput.value = paciente.fecha;
    if (horaInput) horaInput.value = paciente.hora;
    if (sintomasInput) sintomasInput.value = paciente.sintomas;
    if (urgenciaSelect) urgenciaSelect.value = paciente.urgencia;
    
    // Eliminar el registro anterior
    pacientes = pacientes.filter(p => p.id !== id);
    localStorage.setItem('pacientes', JSON.stringify(pacientes));
    
    // Ir al formulario de registro
    showSection('registro');
    
    showNotification('Editando paciente', 'success');
};

window.showDeleteModal = function(id, nombre) {
    currentDeleteId = id;
    if (patientToDeleteSpan) patientToDeleteSpan.textContent = nombre;
    if (confirmModal) confirmModal.classList.add('active');
};

window.closeModal = function() {
    if (confirmModal) confirmModal.classList.remove('active');
    currentDeleteId = null;
};

if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
        if (currentDeleteId) {
            pacientes = pacientes.filter(p => p.id !== currentDeleteId);
            localStorage.setItem('pacientes', JSON.stringify(pacientes));
            
            closeModal();
            
            // Actualizar vistas
            updateDashboard();
            renderPatientsTable();
            renderAppointments('all');
            
            showNotification('Registro eliminado exitosamente', 'success');
        }
    });
}

// Cerrar modal al hacer clic fuera
window.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
        closeModal();
    }
});

// Función auxiliar para formatear fecha
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    } catch (e) {
        return dateString;
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Establecer fecha mínima en el input de fecha
    const hoy = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.min = hoy;
    }
    
    // Renderizar vistas iniciales
    updateDashboard();
    renderPatientsTable();
    renderAppointments('all');
    
    // Asegurar que el panel de login sea visible al inicio
    if (loginContainer) loginContainer.classList.remove('hidden');
    if (mainPanel) mainPanel.classList.add('hidden');
});

// Prevenir cierre accidental
window.addEventListener('beforeunload', () => {
    if (pacientes.length > 0) {
        localStorage.setItem('pacientes', JSON.stringify(pacientes));
    }
    if (usuarios.length > 0) {
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
    }
});

// Función para ver usuarios registrados (útil para depuración)
window.verUsuarios = function() {
    console.log('=== USUARIOS REGISTRADOS ===');
    console.table(usuarios.map(u => ({
        Usuario: u.username,
        Nombre: u.nombre,
        Email: u.email,
        Tipo: u.tipo
    })));
};