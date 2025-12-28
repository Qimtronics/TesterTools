console.log('main.js loaded');

const { app, BrowserWindow, ipcMain } = require('electron');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const path = require('path');

let win;
let atgPort, beaconPort;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

/* -------- ATG SERIAL -------- */
ipcMain.handle('connect-atg', (_, { path, baud }) => {
  atgPort = new SerialPort({ path, baudRate: baud });
  const parser = atgPort.pipe(new ReadlineParser({ delimiter: '\n' }));

  parser.on('data', line => {
    win.webContents.send('atg-data', line);
  });

  return true;
});

/* -------- BEACON SERIAL -------- */
ipcMain.handle('connect-beacon', (_, { path, baud }) => {
  beaconPort = new SerialPort({ path, baudRate: baud });
  const parser = beaconPort.pipe(new ReadlineParser({ delimiter: '\n' }));

  parser.on('data', line => {
    win.webContents.send('beacon-data', line);
  });

  return true;
});

ipcMain.handle('list-ports', async () => {
  console.log('list-ports called');
  const ports = await SerialPort.list();
  return ports.map(p => ({
    path: p.path,
    manufacturer: p.manufacturer || ''
  }));
});

