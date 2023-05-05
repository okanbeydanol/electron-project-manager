const {ChildProcess} = require('./child_process');
const os = require('os');
const {getOSInfo} = require('get-os-info');
const {FsManager} = require('./fs-manager');
const path = require('path');

class CordovaManager extends ChildProcess {
    config_path = path.join(__dirname, '../config');
    system_type = {mac: false, windows: false, linux: false};
    system_info = {name: null, version: null};
    osPlatform = os.platform();

    constructor() {
        super();
        if (this.osPlatform === 'win32' || process.env.OSTYPE === 'cygwin' || process.env.OSTYPE === 'msys') {
            this.system_type.windows = true;
        }
        if (this.osPlatform === 'darwin') {
            this.system_type.mac = true;
        }
        if (!(this.osPlatform === 'win32' || process.env.OSTYPE === 'cygwin' || process.env.OSTYPE === 'msys') && !(this.osPlatform === 'darwin')) {
            this.system_type.linux = true;
        }
    }

    async getCordovaVersion() {
        return new Promise((resolve) => {
            return this.execCommand('cordova -v', async (event) => {
                console.log('%c event', 'background: #222; color: #bada55', event);
                if (event.error) {
                    if (event.message.includes('const [name, version] = nameMap.get(release)')) {
                        return resolve({error: true, data: null, message: 'nameMap ERROR'});
                    } else {
                        return resolve({error: true, data: null, message: 'Cordova not install!'});
                    }
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    console.log('%c burdaaaaaaaaaaa', 'background: #222; color: #bada55', event);

                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    console.log('%c burdaaaaaaaaaaa', 'background: #222; color: #bada55', event);

                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            });
        });
    }

    async installCordovaRes() {
        return new Promise(async (resolve) => {
            const command = 'npm install -g cordova-res --unsafe-perm=true';
            await this.execCommand(command, (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Cordova res not install!'});
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            });
        });
    }

    async installCordova(cordova_version = 10) {
        return new Promise(async (resolve) => {
            const command = 'npm install -g cordova@' + cordova_version + ' --unsafe-perm=true';
            await this.execCommand(command, (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Cordova not install!'});
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            });
        });
    }

    async getCordovaResVersion() {
        return new Promise((resolve) => {
            this.execCommand('cordova-res -v', (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Cordova res not install!'});
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            });
        });
    }

    async getNpmVersion() {
        return new Promise((resolve) => {
            this.execCommand('npm -v', (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Npm not install!'});
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            });
        });
    }

    async getNpmPath() {
        return new Promise((resolve) => {
            this.execCommand('which npm', (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Npm not install!'});
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            });
        });
    }

    async fixMacOsReleaseName(global = true) {
        return new Promise(async (resolve) => {
            console.log('%c whyyyy', 'background: #222; color: #bada55');
            const info = await getOSInfo();
            this.system_info.name = info.name;
            this.system_info.version = info.version;
            console.log('%c this.system_info', 'background: #222; color: #bada55', this.system_info);

            const findOsExistRegex = new RegExp('(\\/*\\[\'' + this.system_info.name + '\', \'' + this.system_info.version + '\']\\/*)', '');
            const getLastIndexRegex = /(\/*\[\d+\/*)/;
            const addNewOsNameRegex = /(\/*const nameMap = new Map\(\[\/*)/;
            let macOsReleasePath = '';

            if (global) {
                const getNpmPath = await this.getNpmPath();
                if (getNpmPath.error) {
                    return resolve(getNpmPath);
                }
                const split = getNpmPath.data.split('/');
                const slice = split.slice(0, split.length - 2);
                const join = slice.join('/');
                macOsReleasePath = join + '/lib/node_modules/cordova/node_modules/macos-release/index.js';
            } else {
                const settings = await new FsManager().readFile(this.config_path + '/settings.json', {
                    encoding: 'utf8',
                    flag: 'r',
                    signal: null
                });
                this.config = JSON.parse(settings.data);
                macOsReleasePath = this.config.project_path + '/node_modules/macos-release/index.js';
            }
            let indexJs = await new FsManager().readFile(macOsReleasePath, {encoding: 'utf8'});
            if (indexJs.error) {
                return resolve(indexJs);
            }
            const findOsExistRegexMatch = findOsExistRegex.exec(indexJs.data);
            if (!findOsExistRegexMatch) {
                const getLastIndexRegexMatch = getLastIndexRegex.exec(indexJs.data);
                if (getLastIndexRegexMatch && getLastIndexRegexMatch[0].split('[').length > 1) {
                    const lastIndexPlus = +getLastIndexRegexMatch[0].split('[')[1] + 1;
                    const addNewOsNameRegexMatch = addNewOsNameRegex.exec(indexJs.data);
                    if (addNewOsNameRegexMatch) {
                        indexJs.data = indexJs.data.replace(addNewOsNameRegexMatch[0],
                            'const nameMap = new Map([\n' +
                            '\t[' + lastIndexPlus + ', [\'' + this.system_info.name + '\', \'' + this.system_info.version + '\']],'
                        );
                        const writeFile = await new FsManager().writeFile(macOsReleasePath, indexJs.data);
                        if (writeFile.error) {
                            return resolve(writeFile);
                        }
                        const cordovaVersion = await this.getCordovaVersion();
                        if (cordovaVersion.error) {
                            return resolve(cordovaVersion);
                        }
                        return resolve(cordovaVersion);
                    } else {
                        return resolve({error: true, data: null, message: 'No data to be corrected2!'});
                    }
                } else {
                    return resolve({error: true, data: null, message: 'No data to be corrected3!'});
                }
            } else {
                return resolve({error: true, data: null, message: 'No data to be corrected4!'});
            }
        });
    }
}

module.exports = {CordovaManager};
