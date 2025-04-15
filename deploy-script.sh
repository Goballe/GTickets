#!/bin/bash

# Script de despliegue para SupportDesk
# Este script automatiza el proceso de implementación del sistema de gestión de tickets en un servidor Ubuntu.

# Colores para salida legible
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sin Color

# Función para mostrar mensajes de progreso
print_message() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

# Función para mostrar advertencias
print_warning() {
  echo -e "${YELLOW}[ADVERTENCIA]${NC} $1"
}

# Función para mostrar errores
print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Función para verificar si el último comando se ejecutó correctamente
check_status() {
  if [ $? -eq 0 ]; then
    print_message "$1"
  else
    print_error "$2"
    exit 1
  fi
}

# Bienvenida
clear
echo "================================================================="
echo "     SCRIPT DE DESPLIEGUE PARA SUPPORTDESK - SISTEMA DE TICKETS  "
echo "================================================================="
echo ""

# Verificar que el script se ejecuta como root o con sudo
if [ "$(id -u)" -ne 0 ]; then
    print_error "Este script debe ejecutarse como root o con sudo."
    exit 1
fi

# Actualizar el sistema
print_message "Actualizando el sistema..."
apt update && apt upgrade -y
check_status "Sistema actualizado correctamente." "Error al actualizar el sistema."

# Instalar dependencias
print_message "Instalando dependencias del sistema..."
apt install -y curl git nginx
check_status "Dependencias del sistema instaladas correctamente." "Error al instalar dependencias del sistema."

# Instalar Node.js
print_message "Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
check_status "Node.js instalado correctamente." "Error al instalar Node.js."

# Verificar instalación de Node.js
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
print_message "Node.js $NODE_VERSION y npm $NPM_VERSION instalados correctamente."

# Instalar PM2
print_message "Instalando PM2..."
npm install -g pm2
check_status "PM2 instalado correctamente." "Error al instalar PM2."

# Crear directorio para la aplicación
print_message "Preparando directorio para la aplicación..."
mkdir -p /var/www
cd /var/www

# Solicitar URL del repositorio Git
echo ""
read -p "Ingresa la URL de tu repositorio Git (o presiona Enter para saltar este paso): " GIT_REPO
if [ -n "$GIT_REPO" ]; then
    print_message "Clonando repositorio $GIT_REPO..."
    git clone $GIT_REPO supportdesk
    check_status "Repositorio clonado correctamente." "Error al clonar el repositorio."
else
    print_warning "Paso de clonación saltado. Deberás copiar manualmente los archivos a /var/www/supportdesk"
    mkdir -p /var/www/supportdesk
fi

cd /var/www/supportdesk

# Crear archivo .env
print_message "Creando archivo de variables de entorno..."
cat > .env << EOF
NODE_ENV=production
PORT=5000
SESSION_SECRET=$(openssl rand -hex 32)
EOF
check_status "Archivo .env creado correctamente." "Error al crear archivo .env."

# Solicitar configuración de dominio
echo ""
read -p "Ingresa el nombre de dominio para tu aplicación (o la IP del servidor si no tienes dominio): " DOMAIN_NAME

# Verificar si hay archivos de la aplicación
if [ -f "package.json" ]; then
    # Instalar dependencias y construir la aplicación
    print_message "Instalando dependencias de la aplicación..."
    npm install
    check_status "Dependencias instaladas correctamente." "Error al instalar dependencias."

    print_message "Construyendo la aplicación..."
    npm run build
    check_status "Aplicación construida correctamente." "Error al construir la aplicación."
    
    # Configurar PM2
    print_message "Configurando PM2 para gestionar la aplicación..."
    pm2 start npm --name "supportdesk" -- start
    check_status "Aplicación iniciada con PM2 correctamente." "Error al iniciar la aplicación con PM2."
    
    pm2 startup
    env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
    pm2 save
    check_status "PM2 configurado para iniciar en el arranque del sistema." "Error al configurar PM2 para el arranque."
else
    print_warning "No se encontró el archivo package.json. Deberás realizar la instalación manualmente."
fi

# Configurar Nginx
print_message "Configurando Nginx como proxy inverso..."
cat > /etc/nginx/sites-available/supportdesk << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
check_status "Archivo de configuración de Nginx creado correctamente." "Error al crear archivo de configuración de Nginx."

# Habilitar el sitio y reiniciar Nginx
ln -sf /etc/nginx/sites-available/supportdesk /etc/nginx/sites-enabled/
nginx -t
check_status "Configuración de Nginx validada correctamente." "Error en la configuración de Nginx."

systemctl restart nginx
check_status "Nginx reiniciado correctamente." "Error al reiniciar Nginx."

# Configurar firewall
print_message "Configurando firewall UFW..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
check_status "Firewall configurado correctamente." "Error al configurar el firewall."

# Preguntar si quiere configurar HTTPS
echo ""
read -p "¿Quieres configurar HTTPS con Let's Encrypt? (s/n): " SETUP_HTTPS
if [[ $SETUP_HTTPS == "s" || $SETUP_HTTPS == "S" ]]; then
    # Validar que el dominio no sea una IP
    if [[ ! $DOMAIN_NAME =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_message "Instalando Certbot para Let's Encrypt..."
        apt-get install -y certbot python3-certbot-nginx
        check_status "Certbot instalado correctamente." "Error al instalar Certbot."
        
        certbot --nginx -d $DOMAIN_NAME
        check_status "Certificado SSL configurado correctamente." "Error al configurar SSL."
    else
        print_warning "No se puede configurar HTTPS para una dirección IP. Omitiendo este paso."
    fi
fi

# Mensaje final
echo ""
echo "================================================================="
echo "     ¡INSTALACIÓN COMPLETADA EXITOSAMENTE!                      "
echo "================================================================="
echo ""
print_message "Tu aplicación SupportDesk debería estar ejecutándose ahora."
print_message "Puedes acceder a ella en: http://$DOMAIN_NAME"
if [[ $SETUP_HTTPS == "s" || $SETUP_HTTPS == "S" ]]; then
    if [[ ! $DOMAIN_NAME =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_message "También está disponible en: https://$DOMAIN_NAME"
    fi
fi
echo ""
print_message "Credenciales predeterminadas:"
echo "   Usuario normal: user / user123"
echo "   Agente:         agent / agent123"
echo "   Administrador:  admin / admin123"
echo ""
print_warning "Por seguridad, se recomienda cambiar estas credenciales después de la instalación inicial."
echo ""
print_message "Para verificar el estado de la aplicación:"
echo "   pm2 status"
echo "   pm2 logs supportdesk"
echo ""
print_message "Para reiniciar la aplicación después de cambios:"
echo "   cd /var/www/supportdesk"
echo "   git pull                # Si usaste Git"
echo "   npm install             # Si hay nuevas dependencias"
echo "   npm run build           # Reconstruir"
echo "   pm2 restart supportdesk # Reiniciar"
echo ""
print_message "¡Gracias por usar SupportDesk!"