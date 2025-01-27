import { Component, OnInit } from '@angular/core';
import { DepartamentoService } from '../../../../service/departamento.service';

@Component({
  selector: 'app-gestion-departamento',
  templateUrl: './gestion-departamento.component.html',
  styleUrls: ['./gestion-departamento.component.css']
})
export class GestionDepartamentoComponent implements OnInit {
  departamentos: any[] = []; // Arreglo para almacenar los datos de los departamentos
  departamentoSeleccionado: any = null; // Propiedad para almacenar los datos del departamento seleccionado
  mostrarContrasena: boolean = false;



  constructor(private departamentoService: DepartamentoService) {}

  ngOnInit(): void {
    this.obtenerDepartamentos();
  }

  obtenerDepartamentos(): void {

    const authData = {
      usuario: '',
      contrasena: ''
    };

    // Recuperar datos del administrador desde sessionStorage
    const sessionAuthData = sessionStorage.getItem('user');
    if (sessionAuthData) {
      const parsedData = JSON.parse(sessionAuthData);
      authData.usuario = parsedData.correo || '';
      authData.contrasena = parsedData.contrasena || '';
    }

    // Llamar al servicio para obtener los departamentos
    this.departamentoService.obtenerDepartamentos(authData).subscribe(
      (response) => {
        this.departamentos = response.departamentos; // Guardar los datos en el arreglo
        console.log('Departamentos obtenidos:', this.departamentos);
      },
      (error) => {
        console.error('Error al obtener los departamentos:', error);
      }
    );
  }
  mostrarDetalles(departamento: any): void {
    this.departamentoSeleccionado = departamento; // Asignar el departamento seleccionado
  }

  guardarDepartamentoAdmin(): void {
    // Obtener los valores actuales de los campos del modal
    const usuario = (document.getElementById('departamentoNombre') as HTMLInputElement).value;
    const contrasena = (document.getElementById('alumnoContrasena') as HTMLInputElement).value;

    // Verificar que los campos no estén vacíos
    if (!usuario || !contrasena) {
      alert('Por favor, complete todos los campos.');
      return; // Si falta algún campo, no se guarda
    }

    // Crear el objeto con los datos que se van a guardar
    const {iddepartamentos} = this.departamentoSeleccionado;
    const nuevoDepartamento = {
      usuario: usuario,
      contrasena: contrasena,
      iddepartamentos
    };

    const authData = {
      tipo_usuario: '',
      correo: '',
      contrasena: ''
    };

    // Recuperar datos del administrador desde sessionStorage
    const sessionAuthData = sessionStorage.getItem('user');
    if (sessionAuthData) {
      const parsedData = JSON.parse(sessionAuthData);
      authData.tipo_usuario = parsedData.tipo_usuario ? parsedData.tipo_usuario.toLowerCase() : '';
      authData.correo = parsedData.correo || ''; // En la DB el campo "correo" se llama "usuario"
      authData.contrasena = parsedData.contrasena || '';
    }


    // Llamar al servicio para verificar al admin y guardar el departamento
    this.departamentoService.guardarDepartamentoAdmin(nuevoDepartamento, authData).subscribe(
      (res) => {
        console.log('Departamento autorizado con éxito:', res);
        alert('Departamento autorizado con éxito');
      },
      (error) => {
        console.error('Error al autorizar el departamento:', error);
        alert('Error al autorizar el departamento');
      }
    );
  }
  eliminarDepartamentoAdmin(): void {
    const departamentoId = (document.getElementById('departamentoid') as HTMLInputElement).value;

    // Verificar que el id del departamento sea válido
    if (!departamentoId) {
      alert('No se ha seleccionado un departamento válido para eliminar.');
      return;
    }

    // Mostrar el cuadro de confirmación antes de proceder con la eliminación
    const confirmacion = window.confirm('¿Desea eliminar el departamento?');

    if (confirmacion) {
      // Si el usuario confirma, crear el objeto de datos del departamento
      const departamentoData = {
        departamentoId
      };

      const authData = {
        tipo_usuario: '',
        correo: '',
        contrasena: ''
      };

      // Recuperar datos del administrador desde sessionStorage
      const sessionAuthData = sessionStorage.getItem('user');
      if (sessionAuthData) {
        const parsedData = JSON.parse(sessionAuthData);
        authData.tipo_usuario = parsedData.tipo_usuario ? parsedData.tipo_usuario.toLowerCase() : '';
        authData.correo = parsedData.correo || ''; // En la DB el campo "correo" se llama "usuario"
        authData.contrasena = parsedData.contrasena || '';
      }

      // Llamar al servicio para eliminar el departamento
      this.departamentoService.eliminarDepartamentoAdmin(departamentoData, authData).subscribe(
        (res) => {
          console.log('Departamento Eliminado:', res);
          alert('Departamento Eliminado');
        },
        (error) => {
          console.error('Error Eliminar Departamento:', error);
          alert('Error al Eliminar Departamento');
        }
      );
    } else {
      // Si el usuario cancela la eliminación
      console.log('Eliminación del departamento cancelada.');
    }
    this.obtenerDepartamentos();
  }


  toggleMostrarContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }
}
