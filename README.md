# Card Duel PWA

Aplicación web progresiva (PWA) de cartas coleccionables, preparada para subir a GitHub y desplegar en GitHub Pages, Netlify o Vercel. Se puede instalar desde el navegador en Android y en iPhone/iPad (Safari: Compartir → Añadir a pantalla de inicio).

## Incluye
- Registro e inicio de sesión con Supabase Auth.
- Editor de cartas: nombre, tipo, elemento, ATQ, DEF, descripción, color de marco e imagen propia.
- Almacenamiento de ilustraciones en Supabase Storage.
- Colección e inventario por usuario, con opción de añadir copias.
- Guardado de snapshots de partida en Supabase.
- Manifest, iconos y service worker para instalación PWA y caché básica de la interfaz.
- Diseño adaptable a móvil y escritorio.

> Importante: esta versión es una base PWA funcional para cuentas, cartas, inventario y guardado de snapshots. Todavía no contiene el motor de duelos, reglas completas, IA, emparejamiento PvP ni sincronización en tiempo real. El service worker guarda la carcasa de la aplicación; las operaciones de cuenta y base de datos requieren conexión a internet.

## 1. Requisitos
- Node.js 20 o superior recomendado.
- Proyecto gratuito de Supabase.
- Git instalado (opcional para subirlo por terminal).

## 2. Configurar Supabase
1. Crea un proyecto en https://supabase.com.
2. En **SQL Editor**, ejecuta todo el archivo `supabase/schema.sql`.
3. En **Project Settings → API**, copia Project URL y la publishable key (o anon key).
4. Crea `.env` copiando `.env.example` y rellena:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_PUBLISHABLE_O_ANON_KEY
```

Nunca pongas `service_role` ni claves secretas en el frontend. La key pública está diseñada para el cliente y el acceso debe quedar protegido por las políticas RLS del SQL.

## 3. Ejecutar en tu computadora

```bash
npm install
cp .env.example .env
# Edita .env y agrega tus claves
npm run dev
```

Vite mostrará una dirección local. Para probar la PWA en un teléfono, usa un despliegue HTTPS o una herramienta de túnel HTTPS; los service workers no funcionan en cualquier origen HTTP.

## 4. Compilar

```bash
npm run build
npm run preview
```

La carpeta lista para publicar es `dist/`.

## 5. Subir a GitHub

1. Crea un repositorio nuevo en GitHub.
2. Extrae este ZIP.
3. Sube el contenido de `card-duel-pwa/` al repositorio (no subas tu `.env`).
4. En GitHub, configura el despliegue con GitHub Actions o conecta el repositorio a Netlify/Vercel.

Para subir desde terminal:

```bash
git init
git add .
git commit -m "Initial Card Duel PWA"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/card-duel-pwa.git
git push -u origin main
```

## 6. Publicar con GitHub Pages

Para GitHub Pages, si el repositorio no se publica en la raíz del dominio, configura `base` en `vite.config.ts` con el nombre del repositorio, por ejemplo `base: '/card-duel-pwa/'`, y ajusta `start_url`, `scope` y rutas de iconos en `public/manifest.webmanifest` y `index.html` para ese prefijo. Para una publicación más sencilla de PWA, Netlify o Vercel suelen requerir menos ajustes.

## 7. Instalar
- **Android:** abre la URL HTTPS en Chrome y elige “Instalar aplicación” o “Añadir a pantalla de inicio”.
- **iOS:** abre la URL HTTPS en Safari, toca Compartir y luego “Añadir a pantalla de inicio”.

## Seguridad y producción
Revisa las políticas RLS antes de producción. Las cartas e inventario de este starter son privados por usuario. Para partidas públicas o PvP, implementa un backend confiable que valide turnos y resultados; no confíes en el estado enviado por el navegador. Añade límites de subida y moderación de imágenes según las necesidades de tu comunidad.

## Licencia y marca
Card Duel es un prototipo original. No utiliza ni incluye arte, nombres, logotipos o recursos de Yu-Gi-Oh!; crea y utiliza contenido para el que tengas derechos.
