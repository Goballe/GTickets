# Guía de Implementación: Sistema de Gestión de Tickets (SupportDesk)

Esta guía te ayudará a implementar el Sistema de Gestión de Tickets en una VM con Ubuntu para producción.

## Requisitos previos

- Una VM de Ubuntu (recomendado 20.04 LTS o superior)
- Al menos 2GB de RAM
- Al menos 10GB de espacio en disco
- Acceso a Internet
- Acceso SSH a la VM

## Pasos para la Implementación

### 1. Configurar la VM

Conecta a tu VM a través de SSH:
```bash
ssh username@ip-address
```

Actualiza el sistema:
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar las dependencias necesarias

```bash
# Instalar Node.js (versión 20.x LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar la instalación
node -v
npm -v

# Instalar PM2 (Gestor de procesos para Node.js)
sudo npm install -g pm2

# Instalar Git
sudo apt install -y git
```

### 3. Clonar el repositorio

Crea un directorio para la aplicación:
```bash
mkdir -p /var/www
cd /var/www
```

Clona el repositorio (reemplaza la URL con la de tu repositorio):
```bash
git clone https://github.com/tu-usuario/tu-repo.git supportdesk
cd supportdesk
```

### 4. Configurar el entorno

Crea un archivo .env para las variables de entorno:
```bash
nano .env
```

Añade las siguientes variables (ajusta según sea necesario):
```
NODE_ENV=production
PORT=5000
SESSION_SECRET=tu_secreto_muy_seguro_aqui
```

### 5. Instalar dependencias y construir la aplicación

```bash
# Instalar dependencias
npm install

# Construir la aplicación
npm run build
```

### 6. Configurar PM2 para gestionar el proceso

```bash
# Iniciar la aplicación con PM2
pm2 start npm --name "supportdesk" -- start

# Configurar para que inicie automáticamente en el arranque
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
pm2 save
```

### 7. Configurar Nginx como proxy inverso

Instala Nginx:
```bash
sudo apt install -y nginx
```

Crea un archivo de configuración para el sitio:
```bash
sudo nano /etc/nginx/sites-available/supportdesk
```

Agrega la siguiente configuración:
```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;  # Cambia esto a tu dominio o IP

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Habilita el sitio y reinicia Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/supportdesk /etc/nginx/sites-enabled/
sudo nginx -t  # Verifica la configuración
sudo systemctl restart nginx
```

### 8. Configurar un firewall

```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 9. Configurar HTTPS con Let's Encrypt (opcional pero recomendado)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

### 10. Monitoreo y logs

Monitorear la aplicación:
```bash
pm2 status
pm2 logs supportdesk
```

Revisar los logs de Nginx:
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Mantenimiento y Actualizaciones

### Actualizar la aplicación

```bash
cd /var/www/supportdesk
git pull                # Obtener los últimos cambios
npm install             # Actualizar dependencias si es necesario
npm run build           # Reconstruir la aplicación
pm2 restart supportdesk # Reiniciar la aplicación
```

### Backup de la aplicación

Recuerda hacer backups regulares de tu aplicación y datos:
```bash
# Crear un backup del directorio de la aplicación
sudo tar -czvf /var/backups/supportdesk-$(date +%Y%m%d).tar.gz /var/www/supportdesk
```

## Opciones para Persistencia de Datos

Tu aplicación actualmente usa almacenamiento en memoria, lo que significa que los datos se perderán cuando se reinicie el servidor. Para una implementación en producción, deberías considerar implementar una solución de base de datos persistente como:

1. **PostgreSQL**: Para implementar esta solución, deberías:
   - Instalar PostgreSQL en tu servidor: `sudo apt install postgresql postgresql-contrib`
   - Crear una base de datos y un usuario para tu aplicación
   - Modificar la configuración en `server/storage.ts` para usar PostgreSQL en lugar de la memoria
   - Usar `drizzle-kit` para aplicar el esquema a la base de datos: `npm run db:push`

2. **Archivo JSON**: Una solución más simple pero menos escalable sería guardar los datos en un archivo JSON:
   - Modificar la clase MemStorage para guardar y cargar datos desde un archivo JSON
   - Implementar funciones de guardado periódico

## Solución de Problemas

Si encuentras problemas durante la implementación:

1. Verifica los logs de la aplicación: `pm2 logs supportdesk`
2. Verifica los logs de Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Asegúrate de que todos los puertos necesarios estén abiertos en el firewall
4. Verifica que Node.js y npm estén instalados correctamente
5. Comprueba que PM2 esté ejecutando la aplicación: `pm2 status`

## Información Importante

- Los usuarios predeterminados seguirán siendo:
  - Usuario normal: usuario/contraseña: `user`/`user123`
  - Agente: usuario/contraseña: `agent`/`agent123`
  - Administrador: usuario/contraseña: `admin`/`admin123`

- Se recomienda cambiar estas credenciales después de la implementación inicial