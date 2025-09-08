/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/lib/db';
import { NextApiRequest, NextApiResponse } from 'next';
import { SignJWT } from 'jose';
import bcrypt from 'bcrypt';



const JWT_SECRET = process.env.AUTH_SECRET || 'secret';
const getJwtSecret = () => new TextEncoder().encode(JWT_SECRET);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { strUsuario, strContra } = req.body;

  
  // Validar usuario (SP o lógica personalizada)
  const [spRows]: any = await db.query("CALL sp_ValidarLoginUsuario (?)", [strUsuario]);
  const user = spRows[0]?.[0];

  //console.log("user", user);
  const isvalidPassword = await bcrypt.compare(strContra, user.strContra);
  if (!isvalidPassword) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  // Datos que firmaremos en el token
  const payload = {
    id: user.id,
    rol: mapRol(user.intRol),
    username: user.strUsuario,
    email: user.strCorreo,
    authType: 'credenciales', // 👈 identificador clave
  };

  // 🔐 Generar un nuevo token cada vez que inicia sesión
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h') // Puedes ajustar esto
    .sign(getJwtSecret());

  // 🧁 Guardar en cookie HttpOnly
  res.setHeader('Set-Cookie', [
    `token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`,
    `role=${payload.rol}; Path=/; SameSite=Strict; Max-Age=7200`,
     `username=${encodeURIComponent(payload.username)}; Path=/; SameSite=Strict; Max-Age=7200`,
  ]);
  
  return res.status(200).json({ success: true, token }); 
}  


// Mapea el número a un texto entendible
function mapRol(intRol: number): string {
 switch (intRol) {
    case 1: return "SuperAdmin";
    case 2: return "Administrador";
    case 3: return "Paciente";
    case 4: return "Doctor";
    default: return "Paciente";
  }
}