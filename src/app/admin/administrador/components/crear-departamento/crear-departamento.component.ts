import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DepartamentoService } from '../../../../service/departamento.service';

@Component({
  selector: 'app-crear-departamento',
  templateUrl: './crear-departamento.component.html',
  styleUrls: ['./crear-departamento.component.css']
})
export class CrearDepartamentoComponent {
  departamentoForm: FormGroup;

  constructor(private fb: FormBuilder, private departamentoService: DepartamentoService) {
    this.departamentoForm = this.fb.group(
      {
        nombre_departamento: ['', Validators.required], // Aquí obtendremos el departamento_id
        usuario: ['', Validators.required], // Simplemente valida que no esté vacío
        contrasena: [
          '',
          [Validators.required, Validators.minLength(6)]
        ],
        confirmarContrasena: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  // Validador personalizado para contraseñas
  passwordMatchValidator(form: FormGroup) {
    const contrasena = form.get('contrasena')?.value;
    const confirmarContrasena = form.get('confirmarContrasena')?.value;
    return contrasena === confirmarContrasena
      ? null
      : { passwordMismatch: true };
  }

  crearDepartamentoAdmin(): void {
    if (this.departamentoForm.valid) {
      // Obtención de valores del formulario
      const departamento_id = this.departamentoForm.get('nombre_departamento')?.value;
      const usuario = this.departamentoForm.get('usuario')?.value;
      const contrasena = this.departamentoForm.get('contrasena')?.value;

      // Determinar el nombre del departamento basado en el departamento_id
      let nombre_departamento = '';
      switch (departamento_id) {
        case 'administracion_finanzas':
          nombre_departamento = 'Administración y Finanzas';
          break;
        case 'centro_informacion':
          nombre_departamento = 'Centro de Información';
          break;
        case 'centro_computo':
          nombre_departamento = 'Centro de Cómputo';
          break;
        case 'recursos_materiales':
          nombre_departamento = 'Recursos Materiales';
          break;
        case 'departamento_vinculacion':
          nombre_departamento = 'Departamento de Vinculación';
          break;
        default:
          console.error('El departamento_id proporcionado no es válido.');
          return;
      }

      // Crear el objeto listo para enviarse a la base de datos
      const nuevoDepartamentoAdmin = {
        nombre_departamento,
        usuario,
        contrasena,
        departamento_id
      };

      // Recuperar los datos de autenticación del administrador desde la sesión
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

      // Llamada al servicio para crear el departamento
      this.departamentoService.crearDepartamentoAdmin(nuevoDepartamentoAdmin, authData).subscribe(
        (res) => {
          alert('Departamento creado con éxito.');
          // Resetear el formulario después de crear el departamento
          this.departamentoForm.reset();
        },
        (error) => {
          console.error('Error al crear el departamento:', error);

          // Mostrar un alert si el usuario ya está en uso
          if (error.status === 400 && error.error?.error?.includes('ya está en uso')) {
            alert('Usuario en uso');
          } else {
            alert('Error al crear el departamento.');
          }
        }
      );
    } else {
      alert('Por favor, complete el formulario correctamente.');
    }
  }
}
