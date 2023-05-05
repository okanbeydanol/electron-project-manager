const {exec, execSync} = require('child_process');
const {BrowserWindow, app} = require('electron');
const path = require('path');
const {FsManager} = require('./fs-manager');
const {dialog} = require('electron');
let terminalWindow;

class ChildProcess {
    colors = [
        {
            code: '[0m',
            color: 'none',
        },
        {
            code: '[0;30m',
            color: '#000000',
        },
        {
            code: '[0;31m',
            color: '#FF0000',
        },
        {
            code: '[1;30m',
            color: '#808080',
        },
        {
            code: '[1;31m',
            color: '#FFCCCB',
        },
        {
            code: '[0;32m',
            color: '#008000',
        },
        {
            code: '[1;32m',
            color: '#90EE90',
        },
        {
            code: '[0;33m',
            color: '#A52A2A',
        },
        {
            code: '[1;33m',
            color: '#FFFF00',
        },
        {
            code: '[0;34m',
            color: '#0000FF',
        },
        {
            code: '[1;34m',
            color: '#ADD8E6',
        },
        {
            code: '[0;35m',
            color: '#800080',
        },
        {
            code: '[1;35m',
            color: '#8467D7',
        },
        {
            code: '[0;36m',
            color: '#00FFFF',
        },
        {
            code: '[1;36m',
            color: '#E0FFFF',
        },
        {
            code: '[0;37m',
            color: '#D3D3D3',
        },
        {
            code: '[1;37m',
            color: '#FFFFFF',
        }
    ]

    config_path = path.join(__dirname, '../config');
    childProcessExec;
    controller = null;
    stdoutOn = null;
    stderrOn = null;
    execClose = null;
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

    async startWindow() {
        const settings = await this.fsManager.readFile(this.config_path + '/settings.json', {
            encoding: 'utf8',
            flag: 'r',
            signal: null
        });
        this.config = JSON.parse(settings.data);
        if (!this.config.terminal) {
            terminalWindow = new BrowserWindow({
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
            terminalWindow.loadFile(path.resolve(app.getAppPath(), 'app/src/frontend/terminal/index.html')).then(async (r) => {
                terminalWindow.webContents.openDevTools({mode: 'detach', activate: true});
                this.config.terminal = true;
                this.config.terminalId = terminalWindow.id;
                await this.fsManager.writeFile(this.config_path + '/settings.json', JSON.stringify(this.config));
                terminalWindow.on('close', async () => {
                    this.config.terminal = false;
                    await this.fsManager.writeFile(this.config_path + '/settings.json', JSON.stringify(this.config));
                });

                terminalWindow.on('unresponsive', async () => {
                    const {response} = await dialog.showMessageBox({
                        message: 'App has become unresponsive',
                        title: 'Do you want to try forcefully reloading the app?',
                        buttons: [ 'OK', 'Cancel' ],
                        cancelId: 1
                    });
                    if (response === 0) {
                        terminalWindow.forcefullyCrashRenderer();
                        terminalWindow.reload();
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
            await this.checkCommand(command);
            this.controller = new AbortController();
            const exportData = await this.exportsD();
            const {signal} = this.controller;
            options.signal = options.signal ? options.signal : signal;
            console.log('%c exportData.data + command', 'background: #222; color: #bada55', exportData.data + '&&' + command);
            this.childProcessExec = exec
            (
                'unset npm_config_prefix&&' + exportData.data + '&&' + command,
                options
                , async (error, stdout, stderr) => {
                    if (error) {
                        callback({
                            data: false,
                            error: true,
                            type: 'error:end',
                            message: error.message,
                            road: 'child_process.js:execCommand:exec',
                            window: terminalWindow
                        });
                        return resolve(false);
                    }

                    callback({
                        data: stderr,
                        error: false,
                        type: 'stdout:end',
                        road: 'child_process.js:execCommand:exec',
                        window: terminalWindow
                    });
                    callback({
                        data: stdout,
                        error: false,
                        type: 'stderr:end',
                        road: 'child_process.js:execCommand:exec',
                        window: terminalWindow
                    });
                    return resolve(true);
                });
            this.childProcessExec.stdout.setEncoding('utf8');
            this.childProcessExec.stderr.setEncoding('utf8');

            if (this.stdoutOn !== null) {
                await this.childProcessExec.stdout.removeListener('data');
                this.stdoutOn = null;
            }
            this.stdoutOn = this.childProcessExec.stdout.on('data', async (data) => {
                const dat = await this.coloredTerminal(data);
                terminalWindow.webContents.send('command:listen', {
                    data: dat.join('\n').trimStart(),
                    error: false,
                    type: 'stdout',
                });
                callback({
                    data: dat.join('\n').trimStart(),
                    error: false,
                    type: 'stdout',
                    window: terminalWindow
                });
            });

            if (this.stderrOn !== null) {
                await this.childProcessExec.stderr.removeListener('data');
                this.stderrOn = null;
            }
            this.stderrOn = this.childProcessExec.stderr.on('data', async (data) => {
                const dat = await this.coloredTerminal(data);
                terminalWindow.webContents.send('command:listen', {
                    data: dat.join('\n').trimStart(),
                    error: false,
                    type: 'stderr',
                });
                callback({
                    data: dat.join('\n').trimStart(),
                    error: false,
                    type: 'stderr',
                    window: terminalWindow
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

    async coloredTerminal(data) {
        return new Promise((resolve) => {
            const split = data.trimStart().split('\n');
            const dat = [];
            split.map((s) => {
                const regexFind = /(\/*\[[0-1];[0-9][0-9]m\/*)/g.exec(s.trimStart());
                if (regexFind) {
                    const find = this.colors.find(o => o.code === regexFind[0]);
                    if (find) {
                        dat.push('<label id="color-label" style="color:' + find.color + '">' + s.replace(/(\/*\[[0-1];[0-9][0-9]m\/*)/g, '').replace(/(\/*\[[0-1]m\/*)/g, '').trimStart() + '</label>');
                    } else {
                        dat.push('<label id="color-label" style="color:#a39f9f">' + s.replace(/(\/*\[[0-1];[0-9][0-9]m\/*)/g, '').replace(/(\/*\[[0-1]m\/*)/g, '').trimStart() + '</label>');
                    }
                } else {
                    dat.push('<label id="color-label-no-color" style="color:#a39f9f">' + s.trimStart() + '</label>');
                }
            });
            return resolve(dat);
        });
    }

    async checkCommand(command) {
        return new Promise(async (resolve) => {
            const cdRegex = /((cd +~[^&]+))|((cd +~))|((cd +.[(\/\w+)]+))|((cd +[.][.][(\/\w+)]+))|((cd [(\/\w+)]+))|((cd [(\/\w+)]+))|((cd +[.][.]))/g;
            let m;
            const paths = [];
            while ((m = cdRegex.exec(command.trimStart())) !== null) {
                if (m.index === cdRegex.lastIndex) {
                    cdRegex.lastIndex++;
                }
                m.forEach((match, groupIndex) => {
                    if (match && !paths.find(o => o === match)) {
                        paths.push(match)
                    }
                });
            }
            if (paths.length > 0) {
                for await (let path of paths) {
                    let replace = path.trim().replace('cd ', '').trim();
                    if (replace[replace.length - 1] === '/') {
                        replace = replace.slice(0, replace.length - 2);
                    }
                    const split = replace.split('/');
                    await split.reduce((lastPromise, s, currentIndex, array) => {
                        return lastPromise.then(async () => {
                            if (s === '') {
                                this.config.currentPath = split.join('/');
                                await new FsManager().writeFile(this.config_path + '/settings.json', JSON.stringify(this.config));
                            } else if (s === '..') {
                                this.config.currentPath = '/' + this.config.currentPath.split('/').slice(1, this.config.currentPath.split('/').length - 1).join('/');
                                await new FsManager().writeFile(this.config_path + '/settings.json', JSON.stringify(this.config));
                            } else if (s === '~') {
                                const checkH = await this.checkHome();
                                this.config.currentPath = checkH.data;
                                await new FsManager().writeFile(this.config_path + '/settings.json', JSON.stringify(this.config));
                            } else {
                                const currentDir = await new FsManager().readDir(this.config.currentPath)
                                const findIndex = currentDir.data.findIndex((o) => o.name.trim() === s.trim());
                                if (findIndex !== -1 && currentDir.data[findIndex].isDirectory) {
                                    this.config.currentPath = this.config.currentPath + '/' + s;
                                    await new FsManager().writeFile(this.config_path + '/settings.json', JSON.stringify(this.config));
                                }
                            }
                            return this.config.currentPath;
                        })
                    }, Promise.resolve()).finally(async () => {
                        terminalWindow.webContents.send('command:listen', {
                            error: false,
                            data: this.config.currentPath,
                            type: 'folder_change'
                        });
                    });
                }
            } else {
                return resolve({error: false, data: 'cd ' + this.config.currentPath + '&&' + command})
            }
        });
    }

    async checkHome() {
        return new Promise((resolve) => {
            const home = execSync('echo ~', {encoding: 'utf8'});
            if (home === '') {
                return resolve({
                    data: home,
                    error: true,
                    type: 'stdout:end',
                    road: 'child_process.js:execCommand:exec'
                });
            }
            return resolve({
                data: home,
                error: false,
                type: 'stdout:end',
                road: 'child_process.js:execCommand:exec'
            });
        });
    }

    exportsD() {
        return new Promise(async (resolve) => {
            resolve({
                error: false,
                data: 'export NVM_DIR="$HOME/.nvm"&&[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"&&[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"'
            });
        });
    }

    async abort() {
        return new Promise((resolve) => {
            this.controller.abort();
            this.controller = null;
            return true;
        });
    }

}


module.exports = {ChildProcess};
