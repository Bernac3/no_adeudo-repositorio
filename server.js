const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./src/app/db/db'); // Asegúrate de que este archivo apunta correctamente a tu conexión con la base de datos
const path = require('path');
const multer = require('multer');
const uploads = multer();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());


//------------------------------------------------------------Nueva Ruta------------------------------------------------------------//
// Ruta para el login
app.post('/auth/login', (req, res) => {
  const { correo, contrasena } = req.body;

  // Consulta para administradores
  const queryAdmin = `
    SELECT
      idadministrador AS id,
      usuario,
      rol
    FROM administrador
    WHERE usuario = ? AND contrasena = ?
  `;

  db.query(queryAdmin, [correo, contrasena], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error en el servidor al verificar administrador' });
    }

    if (results.length > 0) {
      return res.status(200).json(results[0]); // Enviar los datos del administrador
    }

    // Consulta para alumnos
    const queryAlumno = `
      SELECT
        a.idalumnos AS id,
        a.nombre_completo,
        a.correo,
        a.telefono,
        a.no_control,
        a.foto,
        a.fecha_registro,
        a.rol,
        p.estatus_administracion_y_finanzas,
        p.estatus_centro_de_informacion,
        p.estatus_centro_de_computo,
        p.estatus_recursos_materiales,
        p.estatus_departamento_de_vinculacion,
        p.comentario_administracion_y_finanzas,
        p.comentario_centro_de_informacion,
        p.comentario_centro_de_computo,
        p.comentario_recursos_materiales,
        p.comentario_departamento_de_vinculacion,
        p.estatus_peticion
      FROM alumnos a
      LEFT JOIN peticiones p ON a.no_control = p.no_control
      WHERE a.correo = ? AND a.contrasena = ?
    `;

    db.query(queryAlumno, [correo, contrasena], (err, results) => {
      if (err) {
        console.error('Error al verificar alumno:', err);
        return res.status(500).json({ error: 'Error en el servidor al verificar alumno' });
      }

      if (results.length > 0) {
        console.log('Alumno autenticado:', results[0]);
        return res.status(200).json(results[0]); // Enviar los datos del alumno
      }

      // Consulta para departamentos
      const queryDepartamento = `
        SELECT
          d.iddepartamentos AS id,
          d.nombre_departamento,
          d.usuario,
          d.departamento_id,
          d.rol
        FROM departamentos d
        WHERE d.usuario = ? AND d.contrasena = ?
      `;

      db.query(queryDepartamento, [correo, contrasena], (err, results) => {
        if (err) {
          console.error('Error al verificar departamento:', err);
          return res.status(500).json({ error: 'Error en el servidor al verificar departamento' });
        }

        if (results.length > 0) {
          console.log('Departamento autenticado:', results[0]);
          return res.status(200).json(results[0]); // Enviar los datos del departamento
        }

        // Credenciales incorrectas
        console.log('Credenciales incorrectas');
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      });
    });
  });
});


//------------------------------------------------------------Nueva Ruta------------------------------------------------------------//
// Ruta para obtener alumnos y peticiones
app.get('/common/alumnos-peticiones', (req, res) => {
  const query = `
    SELECT alumnos.*, peticiones.*
    FROM alumnos
    LEFT JOIN peticiones ON alumnos.no_control = peticiones.no_control;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener los datos:', err);
      return res.status(500).json({ error: 'Error al obtener los datos' });
    }

    res.json(results); // Retorna los resultados como un arreglo de objetos
  });
});

//------------------------------------------------------------Nueva Ruta------------------------------------------------------------//
// obtener los departamentos
app.post('/admin/obtener-departamento', (req, res) => {
  // Obtener los datos de autenticación desde los headers
  const authData = req.headers.authorization ? JSON.parse(req.headers.authorization) : {};
  const { usuario, contrasena } = authData;

  // Consulta para validar las credenciales del administrador
  const queryAdmin = `
    SELECT *
    FROM administrador
    WHERE usuario = ? AND contrasena = ?
  `;

  db.query(queryAdmin, [usuario, contrasena], (error, results) => {
    if (error) {
      console.error('Error al verificar las credenciales del administrador:', error);
      return res.status(500).json({ error: 'Error al verificar las credenciales del administrador' });
    }
    if (results.length === 0) {
      console.warn('Credenciales inválidas para administrador');
      return res.status(403).json({ error: 'Credenciales inválidas' });
    }

    // Si las credenciales son válidas, obtener los datos de los departamentos
    const queryDepartamentos = `
      SELECT
        iddepartamentos,
        nombre_departamento,
        usuario,
        contrasena,
        departamento_id,
        fecha_registro
      FROM departamentos
    `;

    db.query(queryDepartamentos, (error, departamentos) => {
      if (error) {
        console.error('Error al obtener los departamentos:', error);
        return res.status(500).json({ error: 'Error al obtener los departamentos' });
      }
      // Retornar los departamentos en formato JSON
      return res.status(200).json({ departamentos });
    });
  });
});

//------------------------------------------------------------Nueva Ruta------------------------------------------------------------//
// Obtener departamentos no autorizados
app.get('/admin/departamentos-no-autorizados', (req, res) => {
  const query = `
    SELECT nombre_departamento, usuario, contrasena, departamento_id, fecha_registro
    FROM departamentos_no_autorizados
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener los departamentos no autorizados:', err);
      return res.status(500).json({ error: 'Error al obtener los datos de la base de datos' });
    }

    // Si no hay resultados, enviar un mensaje claro
    if (results.length === 0) {
      return res.status(404).json({ message: 'No se encontraron departamentos no autorizados' });
    }

    // Respuesta exitosa con los datos
    return res.status(200).json({ departamentosNoAutorizados: results });
  });
});



//------------------------------------------------------------Nueva Ruta------------------------------------------------------------//
// configuracion de multer para subir imagenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/'); // Carpeta donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Nombre único para evitar colisiones
  }
});
const upload = multer({ storage: storage });

// Registrar alumnos
app.post('/alumno/register', upload.single('foto'), (req, res) => {
  const { nombre_completo, correo, telefono, no_control, contrasena } = req.body;
  const foto = req.file ? req.file.filename : null; // Nombre de la imagen subida

  // Verificar si el correo ya existe en la tabla `alumnos`
  const checkAlumnoQuery = 'SELECT * FROM alumnos WHERE correo = ? OR no_control = ?';
  db.query(checkAlumnoQuery, [correo, no_control], (err, result) => {
    if (err) {
      console.error('Error al verificar alumno:', err);
      return res.status(500).json({ error: 'Error en el servidor al verificar el alumno' });
    }

    // Si se encuentra un alumno con el mismo correo o número de control
    if (result.length > 0) {
      return res.status(400).json({ error: 'El correo o número de control ya están registrados como alumno' });
    }

    // Verificar si el correo ya existe en la tabla `departamentos`
    const checkDepartamentoQuery = 'SELECT * FROM departamentos WHERE usuario = ?';
    db.query(checkDepartamentoQuery, [correo], (err, result) => {
      if (err) {
        console.error('Error al verificar departamento:', err);
        return res.status(500).json({ error: 'Error en el servidor al verificar el departamento' });
      }

      // Si se encuentra un departamento con el mismo correo
      if (result.length > 0) {
        return res.status(400).json({ error: 'El correo ya está registrado como usuario de departamento' });
      }

      // Verificar si el correo ya existe en la tabla `administrador`
      const checkAdminQuery = 'SELECT * FROM administrador WHERE usuario = ?';
      db.query(checkAdminQuery, [correo], (err, result) => {
        if (err) {
          console.error('Error al verificar administrador:', err);
          return res.status(500).json({ error: 'Error en el servidor al verificar el administrador' });
        }

        // Si se encuentra un administrador con el mismo correo
        if (result.length > 0) {
          return res.status(400).json({ error: 'El correo ya está registrado como usuario administrador' });
        }

        // Si no existen coincidencias, insertar el nuevo alumno
        const insertAlumnoQuery = `
          INSERT INTO alumnos (nombre_completo, correo, telefono, no_control, foto, contrasena, fecha_registro)
          VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;

        // Insertar también el no_control en la tabla peticiones
        const insertAlumnoQueryPeticion = `
          INSERT INTO peticiones (no_control) VALUES (?)
        `;

        db.query(insertAlumnoQuery, [nombre_completo, correo, telefono, no_control, foto, contrasena], (err, result) => {
          if (err) {
            console.error('Error al registrar alumno:', err);
            return res.status(500).json({ error: 'Error en el servidor al registrar el alumno' });
          }

          // Insertar en la tabla peticiones después de registrar al alumno
          db.query(insertAlumnoQueryPeticion, [no_control], (err) => {
            if (err) {
              console.error('Error al insertar no_control en la tabla peticiones:', err);
              return res.status(500).json({ error: 'Error en el servidor al registrar la petición del alumno' });
            }

            // Registro exitoso
            res.status(201).json({
              message: 'Alumno registrado exitosamente y petición creada',
              alumnoId: result.insertId
            });
          });
        });
      });
    });
  });
});

//------------------------------------------------------------Nueva Ruta------------------------------------------------------------//
// Ruta para insertar peticion (desde departamento)
app.post('/departamento/insertar-peticion', (req, res) => {
  const {
    alumnoNoControl,
    peticionEstatus,
    adeudoEstado,
    usuarioDepartamento,
    usuarioDepartamentoId,
    alumnoComentario // Comentario del alumno
  } = req.body;

  // Verificar si el alumno existe
  const queryAlumno = `SELECT * FROM alumnos WHERE no_control = ?`;
  db.query(queryAlumno, [alumnoNoControl], (err, alumnoResults) => {
    if (err) {
      console.error('Error al verificar el alumno:', err);
      return res.status(500).json({ error: 'Error al verificar el alumno' });
    }

    if (alumnoResults.length === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    // Verificar si el usuario del departamento existe y tiene el rol adecuado
    const queryDepartamento = `SELECT * FROM departamentos WHERE usuario = ? AND departamento_id = ?`;
    db.query(queryDepartamento, [usuarioDepartamento, usuarioDepartamentoId], (err, departamentoResults) => {
      if (err) {
        console.error('Error al verificar el departamento:', err);
        return res.status(500).json({ error: 'Error al verificar el departamento' });
      }

      if (departamentoResults.length === 0) {
        return res.status(404).json({ error: 'Departamento no encontrado o no tiene los permisos adecuados' });
      }

      // Determinar la columna de comentario basada en el departamento
      let columnaComentario = '';
      switch (usuarioDepartamentoId) {
        case 'administracion_finanzas':
          columnaComentario = 'comentario_administracion_y_finanzas';
          break;
        case 'centro_informacion':
          columnaComentario = 'comentario_centro_de_informacion';
          break;
        case 'centro_computo':
          columnaComentario = 'comentario_centro_de_computo';
          break;
        case 'recursos_materiales':
          columnaComentario = 'comentario_recursos_materiales';
          break;
        case 'departamento_vinculacion':
          columnaComentario = 'comentario_departamento_de_vinculacion';
          break;
        default:
          return res.status(400).json({ error: 'Departamento no válido' });
      }

      // Si todo es correcto, proceder a actualizar la tabla `peticiones`
      const queryUpdatePeticion = `
        UPDATE peticiones
        SET ${peticionEstatus} = ?, ${columnaComentario} = ?, estatus_peticion = 'Actualizado'
        WHERE no_control = ?
      `;

      // Ejecutar la consulta para actualizar el estado y el comentario
      db.query(queryUpdatePeticion, [adeudoEstado, alumnoComentario, alumnoNoControl], (err, result) => {
        if (err) {
          console.error('Error al actualizar la petición:', err);
          return res.status(500).json({ error: 'Error al actualizar la petición' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'No se encontró la petición para actualizar' });
        }

        res.status(200).json({ message: 'Petición actualizada correctamente' });
      });
    });
  });
});

//------------------------------------------------------------Nueva Ruta------------------------------------------------------------//
// Petición para actualizar datos de un alumno (solo administradores)

app.post('/admin/actualizar-peticion-Adm', (req, res) => {
  // Recuperamos los datos del cuerpo de la solicitud
  const datosAlumnoModalAdmin = req.body;
  let user;
  try {
    // Verificar y parsear el encabezado de autorización
    user = JSON.parse(req.headers.authorization);
  } catch (err) {
    console.error('Error al parsear el encabezado de autorización:', err);
    return res.status(400).json({
      mensaje: 'El encabezado de autorización no es válido',
      error: err.message,
    });
  }

  // Verificamos si el tipo de usuario es "Admin"
  if (user.tipo_usuario !== 'admin') {
    return res.status(403).json({ mensaje: 'No autorizado, se requiere ser administrador' });
  }

  // Validar si el administrador existe en la base de datos
  const queryAdmin = 'SELECT * FROM administrador WHERE usuario = ? AND contrasena = ?';

  db.query(queryAdmin, [user.correo, user.contrasena], (err, result) => {
    if (err) {
      console.error('Error al verificar el administrador:', err);
      return res.status(500).json({
        mensaje: 'Error al verificar el administrador',
        error: err.message,
      });
    }

    if (result.length === 0) {
      console.log('Administrador no encontrado o contraseña incorrecta');
      return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
    }

    console.log('Administrador autenticado correctamente');

    // Actualizar datos del alumno en la tabla `alumnos`
    const updateAlumnoQuery = `
      UPDATE alumnos
      SET nombre_completo = ?, correo = ?, telefono = ?, contrasena = ?, fecha_registro = ?
      WHERE no_control = ?
    `;
    console.log('Actualizando datos del alumno:', updateAlumnoQuery);

    db.query(updateAlumnoQuery, [
      datosAlumnoModalAdmin.alumnoNombre,
      datosAlumnoModalAdmin.alumnoCorreo,
      datosAlumnoModalAdmin.alumnoTelefono,
      datosAlumnoModalAdmin.alumnoContrasena,
      datosAlumnoModalAdmin.alumnoFechaRegistro,
      datosAlumnoModalAdmin.alumnoNoControl,
    ], (err, resultAlumno) => {
      if (err) {
        console.error('Error al actualizar datos del alumno:', err);
        return res.status(500).json({
          mensaje: 'Error al actualizar datos del alumno',
          error: err.message,
        });
      }


      // Actualizar datos en la tabla `peticiones`
      const updatePeticionQuery = `
        UPDATE peticiones
        SET estatus_administracion_y_finanzas = ?, estatus_centro_de_informacion = ?,
            estatus_centro_de_computo = ?, estatus_recursos_materiales = ?,
            estatus_departamento_de_vinculacion = ?, comentario_administracion_y_finanzas = ?,
            comentario_centro_de_informacion = ?, comentario_centro_de_computo = ?,
            comentario_recursos_materiales = ?, comentario_departamento_de_vinculacion = ?,
            estatus_peticion = ?
        WHERE no_control = ?
      `;

      db.query(updatePeticionQuery, [
        datosAlumnoModalAdmin.alumnoEstatusAFModal,
        datosAlumnoModalAdmin.alumnoEstatusCIModal,
        datosAlumnoModalAdmin.alumnoEstatusCCModal,
        datosAlumnoModalAdmin.alumnoEstatusRMModal,
        datosAlumnoModalAdmin.alumnoEstatusDVModal,
        datosAlumnoModalAdmin.alumnoComentarioAdministracionFinanzasModal,
        datosAlumnoModalAdmin.alumnoComentarioCentroInformacionModal,
        datosAlumnoModalAdmin.alumnoComentarioCentroComputo,
        datosAlumnoModalAdmin.alumnoComentarioRecursosMateriales,
        datosAlumnoModalAdmin.alumnoComentarioDepartamentoVinculacion,
        'Pendiente',
        datosAlumnoModalAdmin.alumnoNoControl,
      ], (err, resultPeticion) => {
        if (err) {
          console.error('Error al actualizar datos de la petición:', err);
          return res.status(500).json({
            mensaje: 'Error al actualizar datos de la petición',
            error: err.message,
          });
        }

        console.log('Datos de la petición actualizados correctamente:', resultPeticion);
        return res.status(200).json({ mensaje: 'Datos actualizados correctamente' });
      });
    });
  });
});

//------------------------------------------------------------Nueva Ruta------------------------------------------------------------//
// Guardar cambios departamento (gestionar departamento) desde admin
app.post('/admin/guardar-departamento-adm', (req, res) => {
  const departamento = req.body;

  // Obtener datos del encabezado de autorización y parsearlos
  let authData;
  try {
    authData = JSON.parse(req.headers.authorization);
  } catch (err) {
    console.error('Error al parsear el encabezado de autorización:', err);
    return res.status(400).json({
      error: 'El encabezado de autorización no es válido',
      details: err.message,
    });
  }

  const { usuario, contrasena, iddepartamentos } = departamento; // Datos del departamento
  const { correo, contrasena: adminContrasena } = authData; // Datos del administrador



  // Verificar si el administrador existe en la base de datos
  const queryAdmin = `
    SELECT * FROM administrador WHERE usuario = ? AND contrasena = ?
  `;


  db.query(queryAdmin, [correo, adminContrasena], (error, results) => {
    if (error) {
      console.error('Error al verificar el administrador:', error);
      return res.status(500).json({
        error: 'Error al verificar las credenciales del administrador',
        details: error.message,
      });
    }

    if (results.length === 0) {
      console.log('Administrador no encontrado.');
      return res.status(404).json({ error: 'Administrador no encontrado' });
    }



    // Si el administrador existe, realizar el UPDATE en la tabla `departamentos`
    const queryUpdate = `
      UPDATE departamentos
      SET usuario = ?, contrasena = ?
      WHERE iddepartamentos = ?
    `;

    db.query(queryUpdate, [usuario, contrasena, iddepartamentos], (updateError, updateResults) => {
      if (updateError) {
        console.error('Error al actualizar el departamento:', updateError);
        return res.status(500).json({
          error: 'Error al actualizar el departamento',
          details: updateError.message,
        });
      }

      if (updateResults.affectedRows === 0) {
        console.log('No se actualizó ningún registro. Puede que el iddepartamentos no exista o los datos no coincidan.');
        return res.status(404).json({
          error: 'No se encontró el departamento o los datos no coinciden',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Departamento actualizado correctamente',
      });
    });
  });
});

//------------------------------------------------------------Nueva Ruta------------------------------------------------------------//
// Eliminar departamento (gestionar departamento) desde admin

app.post('/admin/eliminar-departamento-adm', (req, res) => {
  const { departamentoId } = req.body; // Extraemos directamente el ID del departamento desde el cuerpo
  let authData;

  try {
    // Parseamos los datos del encabezado de autorización
    authData = JSON.parse(req.headers.authorization);
  } catch (err) {
    console.error('Error al parsear el encabezado de autorización:', err);
    return res.status(400).json({
      error: 'El encabezado de autorización no es válido',
      details: err.message,
    });
  }

  const { correo, contrasena: adminContrasena } = authData; // Datos del administrador


  // Verificar si el administrador existe en la base de datos
  const queryAdmin = `
    SELECT * FROM administrador WHERE usuario = ? AND contrasena = ?
  `;


  db.query(queryAdmin, [correo, adminContrasena], (error, results) => {
    if (error) {
      console.error('Error al verificar el administrador:', error);
      return res.status(500).json({
        error: 'Error al verificar las credenciales del administrador',
        details: error.message,
      });
    }

    if (results.length === 0) {
      console.log('Administrador no encontrado.');
      return res.status(404).json({ error: 'Administrador no encontrado' });
    }


    // Si el administrador es válido, proceder con la eliminación del departamento
    const queryDelete = `
      DELETE FROM departamentos
      WHERE iddepartamentos = ?
    `;


    db.query(queryDelete, [departamentoId], (deleteError, deleteResults) => {
      if (deleteError) {
        console.error('Error al eliminar el departamento:', deleteError);
        return res.status(500).json({
          error: 'Error al eliminar el departamento',
          details: deleteError.message,
        });
      }


      if (deleteResults.affectedRows === 0) {
        console.log('No se encontró el departamento con el id proporcionado.');
        return res.status(404).json({
          error: 'No se encontró el departamento',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Departamento eliminado correctamente',
      });
    });
  });
});

//------------------------------------------------------------Nueva Ruta------------------------------------------------------------//
// Insertar departamentos no autorizados (verificar departamento) admin
app.post('/admin/insertar-departamentos-no-autorizados', (req, res) => {
  let authData;

  try {
    // Parseamos los datos del encabezado de autorización
    authData = JSON.parse(req.headers.authorization);
  } catch (err) {
    console.error('Error al parsear el encabezado de autorización:', err);
    return res.status(400).json({
      error: 'El encabezado de autorización no es válido',
      details: err.message,
    });
  }

  const { correo, contrasena, tipo_usuario } = authData;

  // Verificar si el usuario es administrador
  if (tipo_usuario !== 'admin') {
    return res.status(401).json({
      error: 'No autorizado: Solo los administradores pueden realizar esta acción',
    });
  }

  // Consulta para verificar al administrador
  const queryAdmin = `
    SELECT * FROM administrador
    WHERE usuario = ? AND contrasena = ? AND rol = 'admin'
  `;

  db.query(queryAdmin, [correo, contrasena], (err, adminResults) => {
    if (err) {
      console.error('Error al verificar administrador:', err);
      return res.status(500).json({
        error: 'Error al verificar administrador',
        details: err.message,
      });
    }

    if (adminResults.length === 0) {
      return res.status(401).json({ error: 'Administrador no autorizado' });
    }


    // Datos del departamento a insertar
    const { usuario: depUsuario, contrasena: depContrasena, departamento, departamentoId } = req.body;

    // Inserción del departamento en la tabla `departamentos`
    const queryInsertDepartamento = `
      INSERT INTO departamentos (nombre_departamento, usuario, contrasena, departamento_id, rol)
      VALUES (?, ?, ?, ?, 'departamento')
    `;

    db.query(
      queryInsertDepartamento,
      [departamento, depUsuario, depContrasena, departamentoId],
      (err, insertResults) => {
        if (err) {
          console.error('Error al insertar departamento:', err);
          return res.status(500).json({
            error: 'Error al insertar departamento',
            details: err.message,
          });
        }


        // Eliminación del registro en `departamentos_no_autorizados`
        const queryDeleteDepartamentoNoAutorizado = `
          DELETE FROM departamentos_no_autorizados
          WHERE nombre_departamento = ? AND usuario = ? AND contrasena = ? AND departamento_id = ?
        `;

        db.query(
          queryDeleteDepartamentoNoAutorizado,
          [departamento, depUsuario, depContrasena, departamentoId],
          (err, deleteResults) => {
            if (err) {
              console.error('Error al eliminar departamento de no autorizados:', err);
              return res.status(500).json({
                error: 'Error al eliminar departamento de no autorizados',
                details: err.message,
              });
            }

            console.log('Registro eliminado de departamentos_no_autorizados:', deleteResults);
            res.status(201).json({
              message: 'Departamento autorizado con éxito y eliminado de no autorizados',
            });
          }
        );
      }
    );
  });
});

//------------------------------------------------------------Nueva Ruta------------------------------------------------------------//
// Crear departamento desde admin (crear-departamento)

app.post('/admin/crear-departamento-admin', (req, res) => {
  // Desestructuramos los valores del cuerpo de la solicitud
  const { nombre_departamento, usuario, contrasena, departamento_id } = req.body;

  // Verificar que no haya valores nulos o vacíos
  if (!nombre_departamento || !usuario || !contrasena || !departamento_id) {
    return res.status(400).json({
      error: 'Faltan datos necesarios para el departamento.',
    });
  }

  // Verificar los datos del administrador en los headers de autorización
  let authData;
  try {
    authData = JSON.parse(req.headers.authorization);
  } catch (err) {
    console.error('Error al parsear el encabezado de autorización:', err);
    return res.status(400).json({
      error: 'El encabezado de autorización no es válido.',
      details: err.message,
    });
  }

  const { correo, contrasena: contrasenaAdmin } = authData;

  if (!correo || !contrasenaAdmin) {
    return res.status(400).json({
      error: 'Faltan los datos del administrador para la autorización.',
    });
  }

  // Consulta para verificar si el administrador es válido
  const queryAdmin = `
    SELECT * FROM administrador
    WHERE usuario = ? AND contrasena = ?
    LIMIT 1
  `;
  db.query(queryAdmin, [correo, contrasenaAdmin], (err, results) => {
    if (err) {
      console.error('Error al verificar los datos del administrador:', err);
      return res.status(500).json({
        error: 'Error en el servidor al verificar el administrador.',
        details: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        error: 'Los datos del administrador no son válidos o no existen.',
      });
    }


    // Comprobación de si el usuario ya existe en otras tablas
    const checkUsuarioQueries = `
      SELECT 'admin' AS tipo, usuario FROM administrador WHERE usuario = ?
      UNION
      SELECT 'departamento' AS tipo, usuario FROM departamentos WHERE usuario = ?
      UNION
      SELECT 'alumno' AS tipo, correo AS usuario FROM alumnos WHERE correo = ?
    `;
    db.query(checkUsuarioQueries, [usuario, usuario, usuario], (err, checkResults) => {
      if (err) {
        console.error('Error al verificar la disponibilidad del usuario:', err);
        return res.status(500).json({
          error: 'Error en el servidor al verificar el usuario.',
          details: err.message,
        });
      }

      if (checkResults.length > 0) {
        const tipo = checkResults[0].tipo;
        return res.status(400).json({
          error: `El usuario ya está en uso por un ${tipo}.`,
        });
      }

      // El usuario está disponible, proceder a insertar el nuevo departamento
      const queryInsertDepartamento = `
        INSERT INTO departamentos (nombre_departamento, usuario, contrasena, departamento_id, rol)
        VALUES (?, ?, ?, ?, 'departamento')
      `;

      db.query(queryInsertDepartamento, [nombre_departamento, usuario, contrasena, departamento_id], (err, result) => {
        if (err) {
          console.error('Error al insertar el nuevo departamento:', err);
          return res.status(500).json({
            error: 'Error en el servidor al insertar el departamento.',
            details: err.message,
          });
        }

        console.log('Departamento creado exitosamente:', result);
        res.status(201).json({
          message: 'Departamento creado exitosamente.',
          departamentoId: result.insertId,
        });
      });
    });
  });
});

//------------------------------------------------------------Nueva Ruta------------------------------------------------------------//
// Crear administrador desde admin (crear-admin)
app.post('/admin/insertar-admin', (req, res) => {
  const { usuario, contrasena } = req.body;

  let authData;
  try {
    // Parsear los datos del encabezado de autorización
    authData = JSON.parse(req.headers.authorization);
  } catch (err) {
    console.error('Error al parsear el encabezado de autorización:', err);
    return res.status(400).json({
      error: 'El encabezado de autorización no es válido.',
      details: err.message,
    });
  }

  if (!authData || !authData.usuario || !authData.contrasena) {
    return res.status(400).json({
      error: 'Faltan datos de autenticación del administrador actual.',
    });
  }

  // Verificar credenciales del administrador actual
  const queryAuth = `
    SELECT * FROM administrador
    WHERE usuario = ? AND contrasena = ?
  `;
  db.query(queryAuth, [authData.usuario, authData.contrasena], (error, results) => {
    if (error) {
      console.error('Error al verificar credenciales del administrador:', error);
      return res.status(500).json({
        error: 'Error interno del servidor al verificar el administrador.',
        details: error.message,
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        error: 'Credenciales del administrador no válidas.',
      });
    }


    // Comprobar si el usuario ya existe en las tablas
    const checkUsuarioQuery = `
      SELECT 'admin' AS tipo FROM administrador WHERE usuario = ?
      UNION
      SELECT 'departamento' AS tipo FROM departamentos WHERE usuario = ?
      UNION
      SELECT 'alumno' AS tipo FROM alumnos WHERE correo = ?
    `;
    db.query(checkUsuarioQuery, [usuario, usuario, usuario], (checkError, checkResults) => {
      if (checkError) {
        console.error('Error al verificar la disponibilidad del usuario:', checkError);
        return res.status(500).json({
          error: 'Error interno del servidor al verificar el usuario.',
          details: checkError.message,
        });
      }

      if (checkResults.length > 0) {
        const tipo = checkResults[0].tipo;
        return res.status(400).json({
          error: `El usuario ya está en uso por un ${tipo}.`,
        });
      }

      // Insertar nuevo administrador
      const queryInsert = `
        INSERT INTO administrador (usuario, contrasena, rol)
        VALUES (?, ?, 'admin')
      `;
      db.query(queryInsert, [usuario, contrasena], (insertError, insertResults) => {
        if (insertError) {
          console.error('Error al insertar el administrador:', insertError);
          return res.status(500).json({
            error: 'Error interno del servidor al insertar el administrador.',
            details: insertError.message,
          });
        }

        console.log('Administrador creado exitosamente:', insertResults);
        res.status(201).json({
          success: true,
          message: 'Administrador creado exitosamente.',
        });
      });
    });
  });
});

//------------------------------------------------------------Nueva Ruta------------------------------------------------------------//
// Eliminar Alumno desde Admin
app.post('/admin/eliminar-alumno-adm', (req, res) => {
  const { alumnoId } = req.body; // ID del alumno (no_control)
  let authData;

  try {
    // Parsear el encabezado de autorización
    authData = JSON.parse(req.headers.authorization);
  } catch (err) {
    console.error('Error al parsear el encabezado de autorización:', err);
    return res.status(400).json({
      error: 'El encabezado de autorización no es válido.',
      details: err.message,
    });
  }

  if (!authData || !authData.correo || !authData.contrasena) {
    return res.status(400).json({
      error: 'Faltan datos de autenticación del administrador.',
    });
  }

  if (!alumnoId) {
    return res.status(400).json({
      error: 'Falta el ID del alumno (no_control).',
    });
  }

  // Verificar credenciales del administrador
  const queryAdmin = `
    SELECT * FROM administrador WHERE usuario = ? AND contrasena = ?
  `;
  db.query(queryAdmin, [authData.correo, authData.contrasena], (error, results) => {
    if (error) {
      console.error('Error al verificar el administrador:', error);
      return res.status(500).json({
        error: 'Error interno al verificar las credenciales del administrador.',
        details: error.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        error: 'Administrador no encontrado o credenciales incorrectas.',
      });
    }

    // Eliminar registros relacionados en la tabla `peticiones`
    const queryDeletePeticiones = `
      DELETE FROM peticiones WHERE no_control = ?
    `;
    db.query(queryDeletePeticiones, [alumnoId], (deleteError) => {
      if (deleteError) {
        console.error('Error al eliminar registros relacionados en peticiones:', deleteError);
        return res.status(500).json({
          error: 'Error al eliminar registros relacionados en peticiones.',
          details: deleteError.message,
        });
      }


      // Eliminar el alumno
      const queryDeleteAlumno = `
        DELETE FROM alumnos WHERE no_control = ?
      `;
      db.query(queryDeleteAlumno, [alumnoId], (deleteAlumnoError, deleteAlumnoResults) => {
        if (deleteAlumnoError) {
          console.error('Error al eliminar el alumno:', deleteAlumnoError);
          return res.status(500).json({
            error: 'Error al eliminar el alumno.',
            details: deleteAlumnoError.message,
          });
        }

        if (deleteAlumnoResults.affectedRows === 0) {
          return res.status(404).json({
            error: 'Alumno no encontrado.',
          });
        }

        console.log('Alumno eliminado correctamente.');
        res.status(200).json({
          success: true,
          message: 'Alumno eliminado correctamente.',
        });
      });
    });
  });
});

//------------------------------------------------------------Nueva Ruta------------------------------------------------------------//
// Ruta para registrar departamentos
app.post('/departamento/register-departamento', uploads.none(), (req, res) => {
  const { nombre_completo, contrasena, tipo_usuario, fecha_registro } = req.body;

  const usuario = nombre_completo; // Renombrar nombre_completo a usuario
  const departamento_id = tipo_usuario; // Renombrar tipo_usuario a departamento_id

  // Verificar que todos los campos estén presentes
  if (!usuario || !contrasena || !departamento_id || !fecha_registro) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  // Verificar si el usuario ya existe en otras tablas
  const checkUsuarioQuery = `
    SELECT 'administrador' AS origen FROM administrador WHERE usuario = ?
    UNION
    SELECT 'departamentos' AS origen FROM departamentos WHERE usuario = ?
    UNION
    SELECT 'alumnos' AS origen FROM alumnos WHERE correo = ?
    UNION
    SELECT 'departamentos_no_autorizados' AS origen FROM departamentos_no_autorizados WHERE usuario = ?
  `;

  db.query(checkUsuarioQuery, [usuario, usuario, usuario, usuario], (err, results) => {
    if (err) {
      console.error('Error al verificar la existencia del usuario:', err);
      return res.status(500).json({ error: 'Error en el servidor al verificar el usuario.' });
    }

    // Verificar si el usuario ya está en uso
    if (results.length > 0) {
      const origen = results[0].origen;
      let mensaje = '';

      switch (origen) {
        case 'administrador':
          mensaje = 'El usuario ya está en uso por un administrador.';
          break;
        case 'departamentos':
          mensaje = 'El usuario ya está en uso por un departamento.';
          break;
        case 'alumnos':
          mensaje = 'El correo ya está en uso por un alumno.';
          break;
        case 'departamentos_no_autorizados':
          mensaje = 'El usuario ya está en uso.';
          break;
        default:
          mensaje = 'El usuario ya está en uso.';
      }

      return res.status(400).json({ error: mensaje });
    }

    // Asignar nombre del departamento según el departamento_id
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
        return res.status(400).json({ error: 'El departamento_id proporcionado no es válido.' });
    }

    // Insertar el registro en la tabla departamentos_no_autorizados
    const insertQuery = `
      INSERT INTO departamentos_no_autorizados
      (nombre_departamento, usuario, contrasena, departamento_id, fecha_registro)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(insertQuery, [nombre_departamento, usuario, contrasena, departamento_id, fecha_registro], (err, result) => {
      if (err) {
        console.error('Error al registrar el departamento:', err);
        return res.status(500).json({ error: 'Error en el servidor al registrar el departamento.' });
      }

      res.status(201).json({
        message:
          'Petición exitosa. Es necesario que el personal encargado del sitio autorice su cuenta para poder iniciar sesión.',
      });
    });
  });
});


// Sirve los archivos estáticos del proyecto Angular
app.use(express.static(path.join(__dirname, 'dist/no_adeudo/browser')));

// Redirige todas las rutas que no sean API al index.html de Angular
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/no_adeudo/browser/index.html'));
});

// Inicia el servidor en el puerto proporcionado (Render o local)
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
