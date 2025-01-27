import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../service/auth.service';
import { Alumno } from '../../../../interfaces/alumno.interface';

@Component({
  selector: 'app-archivo',
  templateUrl: './archivo.component.html',
  styleUrls: ['./archivo.component.css']
})
export class ArchivoComponent implements OnInit {

  alumno: Alumno | null = null;
  estatusPeticiones: any = {};



  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getUser().subscribe((data) => {
      this.alumno = data;
    });
  }

  getBadgeClass(estatus: string | undefined): string {
    if (!estatus) return 'badge text-bg-secondary'; // Clase por defecto (gris)
    const estatusNormalizado = estatus.toLowerCase();
    if (estatusNormalizado === 'pendiente') return 'badge text-bg-warning'; // Amarillo
    if (estatusNormalizado === 'sin adeudo') return 'badge text-bg-success'; // Verde
    if (estatusNormalizado === 'con adeudo') return 'badge text-bg-danger';  // Rojo
    return 'badge text-bg-secondary'; // Por si hay algún valor inesperado
  }
}
