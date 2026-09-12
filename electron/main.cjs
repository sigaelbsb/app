const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

let mainWindow = null;

// URL oficial de producción en la nube para auto-actualizaciones instantáneas
const PRODUCTION_LIVE_URL = 'https://app-delta-ten-80.vercel.app';

// Bloqueo de instancia única para evitar múltiples ventanas abiertas a la vez
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  function createWindow() {
    const isDev = !app.isPackaged && process.env.NODE_ENV === 'development';

    mainWindow = new BrowserWindow({
      width: 1300,
      height: 850,
      minWidth: 980,
      minHeight: 650,
      title: 'SIGAE - Sistema Integral de Gestión y Administración Escolar',
      icon: path.join(__dirname, '../public/assets/img/icono.png'),
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false,
        allowRunningInsecureContent: true
      },
      autoHideMenuBar: true,
      backgroundColor: '#f8fafc',
      show: false
    });

    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });

    // Fallback de visualización por si el evento ready-to-show tarda
    setTimeout(() => {
      if (mainWindow && !mainWindow.isVisible()) {
        mainWindow.show();
      }
    }, 1500);

    // Abrir enlaces externos en el navegador predeterminado (WhatsApp, links, etc.)
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (
        url.startsWith('https:') || 
        url.startsWith('http:') || 
        url.startsWith('mailto:') || 
        url.startsWith('tel:')
      ) {
        // Si es la misma app interna de SIGAE, permitirla dentro de la ventana
        if (url.includes('app-delta-ten-80.vercel.app') || url.includes('localhost')) {
          return { action: 'allow' };
        }
        shell.openExternal(url);
        return { action: 'deny' };
      }
      return { action: 'allow' };
    });

    // Atajos de teclado para desarrollador y recarga (F12, F5, Ctrl+R)
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
        mainWindow.webContents.toggleDevTools();
        event.preventDefault();
      } else if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) {
        mainWindow.reload();
        event.preventDefault();
      }
    });

    // Si falla la carga de la URL en vivo (ejemplo: sin internet), cargar la versión local offline
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      if (validatedURL && validatedURL.startsWith('http')) {
        console.warn(`[SIGAE Electron] Red no disponible (${errorDescription}). Cargando respaldo local offline.`);
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
      }
    });

    // Carga de la aplicación: En vivo con fallback local
    if (isDev) {
      const devServerUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
      mainWindow.loadURL(devServerUrl).catch(() => {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
      });
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
      // Modo Producción: Conectar a la nube para auto-actualizaciones instantáneas
      mainWindow.loadURL(PRODUCTION_LIVE_URL).catch(() => {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
      });
    }

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
