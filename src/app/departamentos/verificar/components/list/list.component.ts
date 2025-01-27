import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';  // Importar el operador debounceTime
import { AuthService } from '../../../../service/auth.service';
import { Alumno as Usuario } from '../../../../interfaces/alumno.interface';
import { PeticionesService } from '../../../../service/peticion.service';


@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {

  usuario: Usuario | null = null; // estos son los datos del usuario que inicio sesion

  alumnosConPeticiones: any[] = [];
  alumnosOriginales: any[] = [];

  searchTermControl: FormControl = new FormControl(''); // Crear un FormControl para el input de búsqueda

  adeudoEstado: string | null = null; // Puede ser 'Sin Adeudo', 'Con Adeudo' o null.

  // datos peticion
  alumnoComentario: string = ''

  constructor(private authService: AuthService, private peticionesService: PeticionesService) {}

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

    // Obtener los datos del Usuaro Departamento
    this.authService.getUser().subscribe((data) => {
      this.usuario = data; // Asignamos los datos del alumno
    });
  }

  cargarDatosModal(alumno: any): void {
    const alumnoNombre = document.getElementById('alumnoNombre');
    const alumnoCorreo = document.getElementById('alumnoCorreo');
    const alumnoTelefono = document.getElementById('alumnoTelefono');
    const alumnoNoControl = document.getElementById('alumnoNoControl');
    const alumnoFechaRegistro = document.getElementById('alumnoFechaRegistro');
    const alumnoFoto = document.getElementById('alumnoFoto') as HTMLImageElement;

    if (alumnoNombre) alumnoNombre.textContent = alumno.nombre_completo;
    if (alumnoCorreo) alumnoCorreo.textContent = alumno.correo;
    if (alumnoTelefono) alumnoTelefono.textContent = alumno.telefono;
    if (alumnoNoControl) alumnoNoControl.textContent = alumno.no_control;
    if (alumnoFechaRegistro) {
      const fecha = new Date(alumno.fecha_registro);
      alumnoFechaRegistro.textContent = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${fecha.getFullYear()}`;
    }

    if (alumnoFoto) {
      alumnoFoto.src = `http://localhost:3000/uploads/${alumno.foto}`;
    }

    // switch aqui
    switch (this.usuario?.departamento_id) {
      case 'administracion_finanzas':
        this.alumnoComentario = alumno.comentario_administracion_y_finanzas;
        break;
      case 'centro_informacion':
        this.alumnoComentario = alumno.centro_informacion;
      break;
      case 'centro_computo':
        this.alumnoComentario = alumno.centro_computo;
      break;
      case 'recursos_materiales':
        this.alumnoComentario = alumno.recursos_materiales;
      break;
      case 'departamento_vinculacion':
        this.alumnoComentario = alumno.departamento_vinculacion;
      break;
    }

    // Asignar el comentario del alumno al campo del modal
    //this.alumnoComentario = alumno.comentario_administracion_y_finanzas || ''; // Asume que 'comentario' está en los datos del alumno.
  }

  clearComment(): void {
    this.alumnoComentario = ''; // Limpia el comentario cuando el textarea recibe enfoque.
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

  // Funcion para Establecer Campo Adeudo a Alumno
  setEstadoAdeudoAlumno(): void {
    const alumnoNoControl = document.getElementById('alumnoNoControl')?.textContent

    const usuarioDepartamento = this.usuario?.usuario
    const usuarioDepartamentoId = this.usuario?.departamento_id

    let peticionEstatus;

    switch (this.usuario?.departamento_id) {
      case 'administracion_finanzas':
        peticionEstatus = 'estatus_administracion_y_finanzas';
        break;
      case 'centro_informacion':
        peticionEstatus = 'estatus_centro_de_informacion';
        break;
      case 'centro_computo':
        peticionEstatus = 'estatus_centro_de_computo';
        break;
      case 'recursos_materiales':
        peticionEstatus = 'estatus_recursos_materiales';
        break;
      case 'departamento_vinculacion':
        peticionEstatus = 'estatus_departamento_de_vinculacion';
        break;
    }


    this.guardarDatosEstado();
      const alumnoComentario = this.alumnoComentario
      const datos = {
        alumnoNoControl, // No de control de alumno, usalo para saber donde insertar en la tabla peticiones (esta dato no se inserta, es solo para referencia)
        peticionEstatus, // Este es el nombre de la columna donde se insertara el dato de adeudoEstado ej: este dato se llama estatus_administracion_y_finanzas y el dato de adeudo se insertarea en esta col
        adeudoEstado: this.adeudoEstado, // Este es el valor que ira en el col peticionEstatus(ej: estatus_administracion_y_finanzas, estatos_centro_de_informacion)
        usuarioDepartamento, // Este es el nombre del usuario De Departamento Logeado actualmente (este dato nos sirve como comporovacion para insertar los datos)
        usuarioDepartamentoId,
        alumnoComentario

        // Este nos pertime saber que tipo de usuaro Departamento es ej: si es administracion_finanzas, el solo puede modificar de la tabla peticiones
        // estatus_administracion_y_finanzas
        // resumiendo, alumnoNoControl = para saber la fila a modificar de peticiones, peticionEstatus = nombre de la col de peticiones, adeudoEstado = valor a insertar en peticionEstatus
        // usuarioDepartamento = nombre del ususario de departamento logeado y usuarioDepartamentId = tipo de usuario de departamento: de estos son 5 tipos en total:
        // administracion_finanzas, centro_informacion, centro_computo, recursos_materiales, departamento_vinculacion
      };

      this.peticionesService.insertarPeticion(datos).subscribe(
        response => {
          console.log('Peticon insertada correctamente')
        },
        error => {
          console.log('Error al insertar peticion')
        }
      )
    this.adeudoEstado = ''
}


guardarDatosEstado(): void {
  const etiquetaEstado = document.getElementById('etiquetaEstado'); // <p> completo
  const etiquetaEstadoSpan = document.getElementById('etiquetaEstadoSpan'); // <span> específico


  if (etiquetaEstado && etiquetaEstadoSpan && this.adeudoEstado) {
    // Configurar texto del span
    etiquetaEstadoSpan.textContent = this.adeudoEstado;

    // Remover clases previas
    etiquetaEstadoSpan.classList.remove('text-success', 'text-danger');

    // Agregar clase según el estado
    if (this.adeudoEstado === 'Con Adeudo') {
      etiquetaEstadoSpan.classList.add('text-danger');
    } else {
      etiquetaEstadoSpan.classList.add('text-success');
    }

    // Mostrar la etiqueta principal
    etiquetaEstado.classList.remove('d-none'); // Mostrar
    etiquetaEstado.classList.add('d-block');

    // Ocultar después de 3 segundos
    setTimeout(() => {
      etiquetaEstado.classList.remove('d-block'); // Ocultar
      etiquetaEstado.classList.add('d-none');
    }, 3000);
  }
   // default para los botones
}

setConAdeudoAlumno(): void {
  this.adeudoEstado = 'Con Adeudo';
}

setSinAdeudoAlumno(): void {
  this.adeudoEstado = 'Sin Adeudo';
}

}
