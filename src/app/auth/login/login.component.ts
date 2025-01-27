import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  correo: string = '';
  contrasena: string = '';
  errorMessage: string | null = null; // Variable para el mensaje de error

  constructor(private authService: AuthService, private router: Router) {}

  login(): void {

    this.authService.login(this.correo, this.contrasena).subscribe(
      (user) => {

        this.authService.setUser(user);

        // Redirigir según el rol del usuario
        if (user.rol === 'alumno') {
          this.router.navigate(['/alumno/home']);
        } else if (user.rol === 'departamento') {
          this.router.navigate(['/departamentos/list']);
        } else if (user.rol === 'admin') {
          this.router.navigate(['/admin/list']);
        }

        this.errorMessage = null; // Limpiar mensaje de error si el login fue exitoso
      },
      (error) => {
        console.error('Error en el login:', error);
        this.errorMessage = 'Credenciales incorrectas'; // Mostrar mensaje de error en el HTML
      }
    );
  }

  goToRagister(): void {
    this.router.navigate(['/auth/register']);
  }
}
