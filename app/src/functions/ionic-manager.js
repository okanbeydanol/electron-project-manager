const { ChildProcess } = require('./child_process');

class IonicManager extends ChildProcess {
    constructor() {
        super();
    }

    async getIonicVersion() {
        return new Promise((resolve) => {
            this.execCommand('ionic -v', (event) => {
                if (event.error) {
                    return resolve({ error: true, data: null, message: 'Ionic is not installed on your computer!' });
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

    async getIonicInfo() {
        return new Promise((resolve) => {
            this.execCommand('ionic info --json', (event) => {
                if (event.error) {
                    return resolve({ error: true, data: null, message: 'Ionic not install!' });
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data
                    });
                }
            });
        });
    }

    async installIonic() {
        return new Promise(async (resolve) => {
            const command = 'npm install -g @ionic/cli';
            await this.execCommand(command, (event) => {
                if (event.error) {
                    return resolve({ error: true, data: null, message: 'Ionic can`t be install!' });
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

}


module.exports = { IonicManager };
