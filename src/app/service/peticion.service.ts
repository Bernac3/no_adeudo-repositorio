import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DepartamentosResponse } from '../interfaces/departamentos-no-autorizados-interfade';

@Injectable({
  providedIn: 'root'
})
export class PeticionesService {
  private apiUrl = 'https://no-adeudo.onrender.com/departamento/insertar-peticion';  // API de inserción de peticiones

  private apiUrlAdmin = 'https://no-adeudo.onrender.com/admin/actualizar-peticion-Adm';  // API de inserción de peticiones

  private apiUrlDepartamentosNoAutorizados = 'https://no-adeudo.onrender.com/admin/departamentos-no-autorizados';

  private apiUrlInsertarDepartamentosNoAutorizados = 'https://no-adeudo.onrender.com/admin/insertar-departamentos-no-autorizados';

  private apiUrlInsertarAdmn = 'https://no-adeudo.onrender.com/admin/insertar-admin'

  constructor(private http: HttpClient) {}

  insertarPeticion(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, datos);
  }


  insertarPeticionAdmin(datosAlumno: any, authData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': JSON.stringify(authData)  // Añadimos el encabezado Authorization
    });

    return this.http.post(`${this.apiUrlAdmin}`, datosAlumno, { headers });
  }


  obtenerDepartamentosNoAutorizados(): Observable<DepartamentosResponse> {
    return this.http.get<DepartamentosResponse>(this.apiUrlDepartamentosNoAutorizados);
  }

  insertarDepartamentoAutorizado(datosDepartamento: any, authData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': JSON.stringify(authData)
    });

    return this.http.post(`${this.apiUrlInsertarDepartamentosNoAutorizados}`, datosDepartamento, { headers });
  }

  crearAdministrativo(datosAdmin: any, authData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': JSON.stringify(authData)
    });

    return this.http.post(`${this.apiUrlInsertarAdmn}`, datosAdmin, { headers });
  }
}
