const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

// Conexión a Render
const pool = new Pool({
  host: 'dpg-db7c570473hc73cqucgg-a.oregon-postgres.render.com',
  port: 5432,
  database: 'pcdb_90ni',
  user: 'pcdb_90ni_user',
  password: 'TXXJSUFAyZpnoOi0xXBOBbjMcMFAG6k1',
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error al conectar a Render:', err.stack);
  }
  console.log(' Conexión exitosa a la Base de Datos en Render');
  release();
});

// PREGUNTA 3: REGISTRO CON HASH
app.post('/register', async (req, res) => {
  const { nombres, apellidos, username, password, rol } = req.body;

  try {
    const password_hash = await bcrypt.hash(password, 10);

    // SQL con los nombres de columna correctos (nombres, apellidos, username)
    const query = `
      INSERT INTO usuarios (nombres, apellidos, username, password_hash, rol) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id_usuario, nombres, apellidos, username, rol
    `;
    const result = await pool.query(query, [
      nombres, 
      apellidos, 
      username, 
      password_hash, 
      rol || 'EMPLEADO'
    ]);

    res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
});

// PREGUNTA 3: LOGIN
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE username = $1 AND estado = TRUE', [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }

    const usuario = result.rows[0];
    const esValida = await bcrypt.compare(password, usuario.password_hash);

    if (!esValida) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: {
        id_usuario: usuario.id_usuario,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        username: usuario.username,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el inicio de sesión' });
  }
});

// PREGUNTA 4: MOVIMIENTOS
app.post('/movimientos', async (req, res) => {
  const { id_producto, id_usuario, tipo, cantidad, motivo, observacion } = req.body;

  try {
    const query = `
      INSERT INTO movimientos (id_producto, id_usuario, tipo, cantidad, motivo, observacion) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `;
    const result = await pool.query(query, [
      id_producto, 
      id_usuario, 
      tipo, 
      cantidad, 
      motivo, 
      observacion
    ]);

    res.status(201).json({
      mensaje: 'Movimiento registrado correctamente',
      movimiento: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar el movimiento' });
  }
});

app.listen(3000, () => {
  console.log('Servidor ejecutándose en http://localhost:3000');
});