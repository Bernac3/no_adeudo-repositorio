import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';  // Importar el operador debounceTime
import { AuthService } from '../../../../service/auth.service';
import { Alumno as Usuario } from '../../../../interfaces/alumno.interface';
import { PeticionesService } from '../../../../service/peticion.service';
import { DepartamentoService } from '../../../../service/departamento.service';

@Component({
  selector: 'app-lista-admin',
  templateUrl: './lista-admin.component.html',
  styleUrls: ['./lista-admin.component.css']
})
export class ListaAdminComponent implements OnInit {

  usuario: Usuario | null = null; // estos son los datos del usuario que inicio sesion

  alumnosConPeticiones: any[] = [];
  alumnosOriginales: any[] = [];

  searchTermControl: FormControl = new FormControl(''); // Crear un FormControl para el input de búsqueda

  adeudoEstado: string | null = null; // Puede ser 'Sin Adeudo', 'Con Adeudo' o null.

  // datos alumno, comentario y peticion
  alumnoEstatusAdministracionFinanzas: string = '';
  alumnoEstatusCentroInformacion: string = '';
  alumnoEstatusCentroComputo: string = '';
  alumnoEstatusRecursosMateriales: string = '';
  alumnoEstatusDepartamentoVinculacion: string = '';

  alumnoEstatusAdministracionFinanzasModal: string = '';
  alumnoEstatusCentroInformacionModal: string = '';
  alumnoEstatusCentroComputoModal: string = '';
  alumnoEstatusRecursosMaterialesModal: string = '';
  alumnoEstatusDepartamentoVinculacionModal: string = '';

  alumnoComentarioAdministracionFinanzas: string = '';
  alumnoComentarioCentroInformacion: string = '';
  alumnoComentarioCentroComputo: string = '';
  alumnoComentarioRecursosMateriales: string = '';
  alumnoComentarioDepartamentoVinculacion: string = '';
  alumnoEstatusAdministracionFinanzascolor: string | null = null;

  alumnoFoto: string = '';


  constructor(private authService: AuthService, private peticionesService: PeticionesService, private departamentoService: DepartamentoService) {}

  ngOnInit(): void {
    this.authService.getAlumnosYPeticiones().subscribe(
      (data) => {
        this.alumnosConPeticiones = data;
        this.alumnosOriginales = [...data];  // Guardamos una copia de los datos completos
      },
      (error) => {
        console.error('Error al obtener los datos de los alumnos:', error);
      }
    );

    // Aplicar debounceTime al control de búsqueda
    this.searchTermControl.valueChanges.pipe(
      debounceTime(1000)  // Esperar 1 segundo después de la última escritura
    ).subscribe((searchTerm) => {
      this.buscarAlumnos(searchTerm);  // Ejecutar la búsqueda automáticamente
    });

    // Obtener los datos del Usuario Departamento
    this.authService.getUser().subscribe((data) => {
      this.usuario = data; // Asignamos los datos del alumno
    });
  }

  cargarDatosModal(alumno: any): void {
    // Asignar estatus
    this.alumnoEstatusAdministracionFinanzas = alumno.estatus_administracion_y_finanzas || 'Pendiente'; // Valor por defecto
    this.alumnoEstatusCentroInformacion = alumno.estatus_centro_de_informacion || 'Pendiente';
    this.alumnoEstatusCentroComputo = alumno.estatus_centro_de_computo || 'Pendiente';
    this.alumnoEstatusRecursosMateriales = alumno.estatus_recursos_materiales || 'Pendiente';
    this.alumnoEstatusDepartamentoVinculacion = alumno.estatus_departamento_de_vinculacion || 'Pendiente';

    // Asignar comentarios
    this.alumnoComentarioAdministracionFinanzas = alumno.comentario_administracion_y_finanzas || '';
    this.alumnoComentarioCentroInformacion = alumno.comentario_centro_de_informacion || '';
    this.alumnoComentarioCentroComputo = alumno.comentario_centro_de_computo || '';
    this.alumnoComentarioRecursosMateriales = alumno.comentario_recursos_materiales || '';
    this.alumnoComentarioDepartamentoVinculacion = alumno.comentario_departamento_de_vinculacion || '';


    // Para otros campos de datos del alumno
    const alumnoNombre = document.getElementById('alumnoNombre') as HTMLInputElement;
    const alumnoCorreo = document.getElementById('alumnoCorreo') as HTMLInputElement;
    const alumnoTelefono = document.getElementById('alumnoTelefono') as HTMLInputElement;
    const alumnoNoControl = document.getElementById('alumnoNoControl') as HTMLInputElement;
    const alumnoFechaRegistro = document.getElementById('alumnoFechaRegistro') as HTMLInputElement;
    const alumnoFoto = document.getElementById('alumnoFoto') as HTMLImageElement;
    const alumnoContrasena = document.getElementById('alumnoContrasena') as HTMLInputElement;

    if (alumnoNombre) alumnoNombre.value = alumno.nombre_completo;
    if (alumnoCorreo) alumnoCorreo.value = alumno.correo;
    if (alumnoTelefono) alumnoTelefono.value = alumno.telefono;
    if (alumnoNoControl) alumnoNoControl.value = alumno.no_control;
    if (alumnoFechaRegistro) {
      const fecha = new Date(alumno.fecha_registro);
      alumnoFechaRegistro.value = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
    }

    if (alumnoFoto) {
      alumnoFoto.src = `https://no-adeudo.onrender.com/uploads/${alumno.foto}`;
    }
    if (alumnoContrasena) alumnoContrasena.value = alumno.contrasena;
  }

  guardarCambiosModal(): void {
    const alumnoNombre = (document.getElementById('alumnoNombre') as HTMLInputElement).value;
    const alumnoCorreo = (document.getElementById('alumnoCorreo') as HTMLInputElement).value;
    const alumnoTelefono = (document.getElementById('alumnoTelefono') as HTMLInputElement).value;
    const alumnoNoControl = (document.getElementById('alumnoNoControl') as HTMLInputElement).value;

    // Convertir la fecha al formato "yyyy-mm-dd"
    const alumnoFechaRegistroInput = (document.getElementById('alumnoFechaRegistro') as HTMLInputElement).value;
    const [day, month, year] = alumnoFechaRegistroInput.split('/');
    const alumnoFechaRegistro = `${year}-${month}-${day}`; // Transformar la fecha

    const alumnoContrasena = (document.getElementById('alumnoContrasena') as HTMLInputElement).value;

    const alumnoComentarioAdministracionFinanzasModal = (document.getElementById('comentarioAdministracionFinanzas') as HTMLTextAreaElement).value;
    const alumnoComentarioCentroInformacionModal = (document.getElementById('alumnoComentarioCentroInformacion') as HTMLTextAreaElement).value;
    const alumnoComentarioCentroComputo = (document.getElementById('alumnoEstatusCentroComputo') as HTMLTextAreaElement).value;
    const alumnoComentarioRecursosMateriales = (document.getElementById('alumnoEstatusRecursosMateriales') as HTMLTextAreaElement).value;
    const alumnoComentarioDepartamentoVinculacion = (document.getElementById('alumnoEstatusDepartamentoVinculacion') as HTMLTextAreaElement).value;

    let alumnoEstatusAFModal: string = '';
    let alumnoEstatusCIModal: string = '';
    let alumnoEstatusCCModal: string = '';
    let alumnoEstatusRMModal: string = '';
    let alumnoEstatusDVModal: string = '';

    if(this.alumnoEstatusAdministracionFinanzasModal){
      alumnoEstatusAFModal = this.alumnoEstatusAdministracionFinanzasModal
    } else {
      alumnoEstatusAFModal = this.alumnoEstatusAdministracionFinanzas;
    }

    if(this.alumnoEstatusCentroInformacionModal){
      alumnoEstatusCIModal = this.alumnoEstatusCentroInformacionModal
    } else {
      alumnoEstatusCIModal = this.alumnoEstatusCentroInformacion
    }

    if (this.alumnoEstatusCentroComputoModal) {
      alumnoEstatusCCModal = this.alumnoEstatusCentroComputoModal
    } else {
      alumnoEstatusCCModal = this.alumnoEstatusCentroComputo
    }

    if (this.alumnoEstatusRecursosMaterialesModal) {
      alumnoEstatusRMModal = this.alumnoEstatusRecursosMaterialesModal
    } else {
      alumnoEstatusRMModal = this.alumnoEstatusRecursosMateriales
    }

    if (this.alumnoEstatusDepartamentoVinculacionModal) {
      alumnoEstatusDVModal = this.alumnoEstatusDepartamentoVinculacionModal
    } else {
      alumnoEstatusDVModal = this.alumnoEstatusDepartamentoVinculacion
    }

    const datosAlumnoModalAdmin = {
        alumnoNombre,
        alumnoCorreo,
        alumnoTelefono,
        alumnoNoControl,
        alumnoFechaRegistro, // La fecha ya está en el formato correcto
        alumnoContrasena,
        alumnoEstatusAFModal,
        alumnoEstatusCIModal,
        alumnoEstatusCCModal,
        alumnoEstatusRMModal,
        alumnoEstatusDVModal,
        alumnoComentarioAdministracionFinanzasModal,
        alumnoComentarioCentroInformacionModal,
        alumnoComentarioCentroComputo,
        alumnoComentarioRecursosMateriales,
        alumnoComentarioDepartamentoVinculacion
    };


    // Llamada al servicio: estos datos aun falta obtenerlos del localstorage, pero los tengo asi por el momento
    // Creamos el objeto authData con los valores por defecto
    const authData = {
      tipo_usuario: '',  // Vacío por defecto
      correo: '',         // Vacío por defecto
      contrasena: ''      // Vacío por defecto
    };

    // Recuperamos los datos desde sessionStorage
    const sessionAuthData = sessionStorage.getItem('user'); // 'user' es la clave utilizada

    // Si los datos existen en sessionStorage, los asignamos a authData
    if (sessionAuthData) {
      const parsedData = JSON.parse(sessionAuthData); // Convertimos el string JSON a objeto

      // Asignamos los valores de sessionStorage a authData
      // Y convertimos tipo_usuario a minúsculas
      authData.tipo_usuario = parsedData.tipo_usuario ? parsedData.tipo_usuario.toLowerCase() : '';
      authData.correo = parsedData.correo || '';
      authData.contrasena = parsedData.contrasena || '';
    }



    this.peticionesService.insertarPeticionAdmin(datosAlumnoModalAdmin, authData).subscribe(
      response => {

        // Recargar los datos de alumnos y peticiones después de insertar
        this.authService.getAlumnosYPeticiones().subscribe(
          updatedData => {
            this.alumnosConPeticiones = updatedData;
            this.alumnosOriginales = [...updatedData]; // Actualizar la copia original
          },
          error => {
            console.error('Error al recargar los datos de los alumnos:', error);
          }
        );
      },
      error => {
        console.log('Error al insertar petición:', error);
      }
    );
  }

  eliminarAlumnoAdminModal(): void {
    const alumnoIdModal = (document.getElementById('alumnoNoControl') as HTMLInputElement).value;

    // Mostrar alerta de confirmación
    const confirmacion = window.confirm(`¿Estás seguro de que deseas eliminar al alumno?`);

    if (!confirmacion) {
      return; // Salir de la función si el usuario cancela
    }

    const authData = {
      tipo_usuario: '',
      correo: '',
      contrasena: ''
    };

    const sessionAuthData = sessionStorage.getItem('user');
    if (sessionAuthData) {
      const parsedData = JSON.parse(sessionAuthData);
      authData.tipo_usuario = parsedData.tipo_usuario ? parsedData.tipo_usuario.toLowerCase() : '';
      authData.correo = parsedData.correo || ''; // En la DB el campo "correo" se llama "usuario"
      authData.contrasena = parsedData.contrasena || '';
    }



    this.departamentoService.eliminarAlumnoAdminModal(alumnoIdModal, authData).subscribe(
      (res) => {


        // Actualizar la lista de alumnos
        this.actualizarListaAlumnos();
      },
      (error) => {
        alert('Error al Eliminar el Alumno');
      }
    );
  }




  ordenarAlumnos(opcion: string, event: Event): void {
    event.preventDefault();
    switch(opcion) {
      case 'nombre-asc':
        this.alumnosConPeticiones.sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));
        break;
      case 'nombre-desc':
        this.alumnosConPeticiones.sort((a, b) => b.nombre_completo.localeCompare(a.nombre_completo));
        break;
      case 'nuevos':
        this.alumnosConPeticiones.sort((a, b) => new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime());
        break;
      case 'viejos':
        this.alumnosConPeticiones.sort((a, b) => new Date(a.fecha_registro).getTime() - new Date(b.fecha_registro).getTime());
        break;
    }
  }

  // Función para realizar la búsqueda automática
  buscarAlumnos(searchTerm: string): void {
    if (searchTerm) {
      this.alumnosConPeticiones = this.alumnosOriginales.filter(alumno => {
        const nombreValido = alumno.nombre_completo ? alumno.nombre_completo.toLowerCase() : '';
        const noControlValido = alumno.no_control ? alumno.no_control.toLowerCase() : '';
        const correoValido = alumno.correo ? alumno.correo.toLowerCase() : '';

        return nombreValido.includes(searchTerm.toLowerCase()) ||
               noControlValido.includes(searchTerm.toLowerCase()) ||
               correoValido.includes(searchTerm.toLowerCase());
      });
    } else {
      this.alumnosConPeticiones = [...this.alumnosOriginales];
    }
  }

  // Función para abrir el modal, puedes agregar el control para abrirlo manualmente si necesitas
  openModal(): void {
    const modal = document.getElementById('modalAlumno');
    if (modal) {
      modal.style.display = 'block';  // Abre el modal mostrando el contenedor
    }
  }

  closeModal(): void {
    const modal = document.getElementById('modalAlumno');
    if (modal) {
      modal.style.display = 'none';  // Cierra el modal
    }
  }

  // Función que se ejecuta al seleccionar un estatus del dropdown
  cambiarEstatusAdministracionFinanzas(nuevoEstatus: string): void {

    this.alumnoEstatusAdministracionFinanzasModal = nuevoEstatus; // Asigna el nuevo valor al modelo
    this.alumnoEstatusAdministracionFinanzas = nuevoEstatus; // Retornamos el valor para el color del dropdown
  }
  cambiarEstatusCentroInformacion(nuevoEstatus: string): void {
    this.alumnoEstatusCentroInformacionModal = nuevoEstatus;
    this.alumnoEstatusCentroInformacion = nuevoEstatus;
  }
  cambiarEstatusCentroComputo(nuevoEstatus: string): void {
    this.alumnoEstatusCentroComputoModal = nuevoEstatus
    this.alumnoEstatusCentroComputo = nuevoEstatus
  }
  cambiarEstatusRerursosMateriales(nuevoEstatus: string): void {
    this.alumnoEstatusRecursosMaterialesModal = nuevoEstatus
    this.alumnoEstatusRecursosMateriales = nuevoEstatus
  }
  cambiarEstatusDepartamentoVinculacion(nuevoEstatus: string): void {
    this.alumnoEstatusDepartamentoVinculacionModal = nuevoEstatus
    this.alumnoEstatusDepartamentoVinculacion = nuevoEstatus
  }

  // Función para alternar la visibilidad de la contraseña
  togglePasswordVisibility(): void {
    const contrasenaInput = document.getElementById('alumnoContrasena') as HTMLInputElement;
    const tipoActual = contrasenaInput.type;

    // Cambiar el tipo de input entre 'password' y 'text'
    if (tipoActual === 'password') {
      contrasenaInput.type = 'text';
    } else {
      contrasenaInput.type = 'password';
    }
  }
  actualizarListaAlumnos(): void {
    this.authService.getAlumnosYPeticiones().subscribe(
      (data) => {
        this.alumnosConPeticiones = data; // Actualizar la lista visible
        this.alumnosOriginales = [...data]; // Actualizar la copia de seguridad
        console.log('Lista de alumnos actualizada:', this.alumnosConPeticiones);
      },
      (error) => {
        console.error('Error al actualizar la lista de alumnos:', error);
      }
    );
  }


}
