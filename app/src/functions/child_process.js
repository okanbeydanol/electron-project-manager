const { exec } = require('child_process');
const { BrowserWindow, app } = require('electron');
const path = require('path');
const { FsManager } = require('./fs-manager');
const { dialog } = require('electron');

class ChildProcess {

    config_path = path.join(__dirname, '../config');
    childProcessExec;
    controller = null;
    stdoutOn = null;
    stderrOn = null;
    execClose = null;
    terminalWindow;
    fsManager = new FsManager();
    config = null;

    NODE_VERSION;
    IONIC_VERSION;
    BREW_VERSION;
    JAVA_VERSION;
    GRADLE_VERSION;
    CORDOVA_VERSION;
    CORDOVA_RES_VERSION;
    NPM_VERSION;


    constructor() {
    }


    async abort() {
        return new Promise((resolve) => {
            this.controller.abort();
            this.controller = null;
            return true;
        });
    }

    async startWindow() {
        const settings = await this.fsManager.readFile(this.config_path + '/settings.json', {
            encoding: 'utf8',
            flag: 'r',
            signal: null
        });
        this.config = JSON.parse(settings.data);
        if (!this.config.terminal) {
            this.terminalWindow = new BrowserWindow({
                width: 500,
                height: 500,
                webPreferences: {
                    devTools: true,
                    enableRemoteModule: true,
                    disableHtmlFullscreenWindowResize: true,
                    nodeIntegration: true,
                    webSecurity: true,
                    experimentalFeatures: false,
                    contextIsolation: true,
                    preload: path.resolve(app.getAppPath(), 'app/src/preload/preload.js')
                }
            });
            this.terminalWindow.loadFile(path.resolve(app.getAppPath(), 'app/src/frontend/terminal/index.html')).then(async (r) => {
                this.terminalWindow.webContents.openDevTools({ mode: 'detach', activate: true });
                this.config.terminal = true;
                this.config.terminalId = this.terminalWindow.id;
                await this.fsManager.writeFile(this.config_path + '/settings.json', JSON.stringify(this.config));
                this.terminalWindow.on('close', async () => {
                    this.config.terminal = false;
                    await this.fsManager.writeFile(this.config_path + '/settings.json', JSON.stringify(this.config));
                });

                this.terminalWindow.on('unresponsive', async () => {
                    const { response } = await dialog.showMessageBox({
                        message: 'App has become unresponsive',
                        title: 'Do you want to try forcefully reloading the app?',
                        buttons: ['OK', 'Cancel'],
                        cancelId: 1
                    });
                    if (response === 0) {
                        this.terminalWindow.forcefullyCrashRenderer();
                        this.terminalWindow.reload();
                        this.config.terminal = false;
                        await this.fsManager.writeFile(this.config_path + '/settings.json', JSON.stringify(this.config));
                    }
                });


            });
        } else {
            const browser = BrowserWindow.getAllWindows().findIndex((o) => o.id === this.config.terminalId);
            if (browser !== -1) {
                const openedBrowser = BrowserWindow.fromId(BrowserWindow.getAllWindows()[browser].id);

            } else {
                this.config.terminal = false;
                await this.fsManager.writeFile(this.config_path + '/settings.json', JSON.stringify(this.config));
                await this.startWindow();
            }
        }

    }

    async execCommand(command, callback = () => {
    }, options = {
        stdout: 'inherit',
        encoding: 'utf8',
        signal: null,
        timeout: 0,
        maxBuffer: 200 * 1024, //increase here
        killSignal: 'SIGTERM',
        cwd: null,
        env: null
    }) {
        return new Promise(async (resolve) => {
            await this.startWindow();
            this.controller = new AbortController();
            console.log('%c command: ', 'background: #222; color: #bada55', command);

            global.abortController = this.controller;
            const { signal } = this.controller;
            options.signal = options.signal ? options.signal : signal;
            this.childProcessExec = exec
            (
                command,
                options
                , async (error, stdout, stderr) => {
                    if (error) {
                        callback({
                            data: false,
                            error: true,
                            type: 'error:end',
                            message: error.message,
                            road: 'child_process.js:execCommand:exec'
                        });
                        return resolve(false);
                    }

                    callback({
                        data: stderr,
                        error: false,
                        type: 'stdout:end',
                        road: 'child_process.js:execCommand:exec'
                    });
                    callback({
                        data: stdout,
                        error: false,
                        type: 'stderr:end',
                        road: 'child_process.js:execCommand:exec'
                    });
                    return resolve(true);
                });
            this.childProcessExec.stdout.setEncoding('utf8');
            this.childProcessExec.stderr.setEncoding('utf8');

            if (this.stdoutOn !== null) {
                await this.childProcessExec.stdout.removeListener('data');
                this.stdoutOn = null;
            }
            this.stdoutOn = this.childProcessExec.stdout.on('data', data => {
                console.log('%c data', 'background: #222; color: #bada55', data);

                callback({
                    data: data,
                    error: false,
                    type: 'stdout'
                });
            });

            if (this.stderrOn !== null) {
                await this.childProcessExec.stderr.removeListener('data');
                this.stderrOn = null;
            }
            this.stderrOn = this.childProcessExec.stderr.on('data', data => {
                console.log('%c data', 'background: #222; color: #bada55', data);
                callback({
                    data: data,
                    error: false,
                    type: 'stderr'
                });
            });

            if (this.execClose !== null) {
                await this.childProcessExec.removeListener('close');
                this.execClose = null;
            }
            this.execClose = this.childProcessExec.on('close', exitCode => {
                callback({
                    data: false,
                    error: false,
                    type: 'close'
                });
                this.execClose = null;
                this.stdoutOn = null;
                this.stderrOn = null;
            });

        });
    }

    /*    async init(command, options = {
        stdout: 'inherit',
        encoding: 'utf8',
        signal: null,
        timeout: 0,
        maxBuffer: 200 * 1024, //increase here
        killSignal: 'SIGTERM',
        cwd: null,
        env: null
    }) {
        return new Promise((resolve) => {
            this.controller = new AbortController();
            const { signal } = this.controller;
            options.signal = options.signal ? options.signal : signal;
            this.childProcess = exec
            (
                command,
                options
                , (error, stdout, stderr) => {
                    if (error) {
                        console.log(`${ error.name }: ${ error.message }`);
                        console.log(`[STACK] ${ error.stack }`);
                        this.advanceSettingsWindow.webContents.send('projectDetail:addPackageResponse', {
                            data: false,
                            error: true,
                            message: error.message,
                            road: 'main.js:projectDetail:addPackage:exec'
                        });
                        return resolve(false);

                    }


                    this.advanceSettingsWindow.webContents.send('projectDetail:addPackageResponse', {
                        data: stderr,
                        error: false,
                        type: 'stdout:finish'
                    });
                    this.advanceSettingsWindow.webContents.send('projectDetail:addPackageResponse', {
                        data: stdout,
                        error: false,
                        type: 'stderr:finish'
                    });
                    return resolve(true);
                });
            this.childProcess.stdout.setEncoding('utf8');
            this.childProcess.stderr.setEncoding('utf8');
            this.childProcess.stdout.on('data', data => {
                this.advanceSettingsWindow.webContents.send('projectDetail:addPackageResponse', {
                    data: data,
                    error: false,
                    type: 'stdout'
                });
            });
            this.childProcess.stderr.on('data', data => {
                this.advanceSettingsWindow.webContents.send('projectDetail:addPackageResponse', {
                    data: data,
                    error: false,
                    type: 'stderr'
                });
            });
            this.childProcess.on('error', error => {
                this.advanceSettingsWindow.webContents.send('projectDetail:addPackageResponse', {
                    data: false,
                    error: true,
                    message: error.message,
                    road: 'main.js:projectDetail:addPackage:childProcess'
                });
            });
            this.childProcess.on('close', exitCode => {
                this.advanceSettingsWindow.webContents.send('projectDetail:addPackageResponse', {
                    data: false,
                    error: false,
                    type: 'close'
                });
            });

        });
    }*/
}


module.exports = { ChildProcess };
