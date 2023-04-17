import { createApp } from 'vue'
import "./style.css"
import './index.css'
import App from './App.vue'
import './samples/node-api'
// const { app, BrowserWindow } = require('electron') 

// function createWindow() {
//   const mainWindow = new BrowserWindow({frame:false,
//     width: 1024,
//     height: 565,
//     minWidth: 1024,
//     minHeight: 565,
//     resizable: false,
//     show: false,
//     center: true,
//     backgroundColor: '#312450',
//   })

//   mainWindow.loadURL(`file://${__dirname}/index.html`)

//   mainWindow.once('ready-to-show', () => {
//     mainWindow.show()
//   })
// }
createApp(App)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })

