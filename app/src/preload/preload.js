const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('mode', {
    switch: () => ipcRenderer.invoke('switch-checked:toggle')
});
contextBridge.exposeInMainWorld('toggleInput', {
    reset: () => ipcRenderer.invoke('toggle-input:reset')
});
contextBridge.exposeInMainWorld('path', {
    checkFolder: () => ipcRenderer.invoke('folder-process:check'),
    addFolder: () => ipcRenderer.invoke('folder-process:add'),
    removeFolder: () => ipcRenderer.invoke('folder-process:remove')
});
contextBridge.exposeInMainWorld('projectBridge', {
    open: () => ipcRenderer.invoke('project:detail')
});
contextBridge.exposeInMainWorld('projectDetail', {
    startRead: () => ipcRenderer.invoke('projectDetail:startRead'),
    openAdvanceSettings: () => ipcRenderer.invoke('projectDetail:openAdvanceSettings'),
    startReadAdvance: () => ipcRenderer.invoke('projectDetail:startReadAdvance'),
    addPackage: (plugin_name) => ipcRenderer.invoke('projectDetail:addPackage', plugin_name),
    addPackageResponse: (callback) => ipcRenderer.on('projectDetail:addPackageResponse', callback),
    stopProcess: (addPackage) => ipcRenderer.invoke('projectDetail:stopProcess', addPackage),
    startTerminal: () => ipcRenderer.invoke('projectDetail:startTerminal'),
    abortTerminal: () => ipcRenderer.invoke('projectDetail:abortTerminal'),
    abortControllerChanged: (abortController) => ipcRenderer.invoke('abortController', abortController)
});
