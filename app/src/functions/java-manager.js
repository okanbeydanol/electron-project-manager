const { ChildProcess } = require('./child_process');

class JavaManager extends ChildProcess {
    constructor() {
        super();
    }

    async getSetJavaVersionTextEcho(java_version) {
        return new Promise((resolve) => {
            const command = `echo 'export JAVA_HOME=$(/usr/libexec/java_home -v ${ java_version })' >> ~/.zshrc`;
            return resolve(command);
        });
    }

    async getSetJavaVersionText(java_version) {
        return new Promise((resolve) => {
            const command = `export JAVA_HOME=$(/usr/libexec/java_home -v ${ java_version })`;
            return resolve(command);
        });
    }

    async getJavaVersion() {
        return new Promise((resolve) => {
            this.execCommand('javac -version', (event) => {
                if (event.error) {
                    return resolve({ error: true, data: null, message: 'Java not install!' });
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.replace('javac ', '').trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.replace('javac ', '').trim()
                    });
                }
            });
        });
    }

    async setJavaVersion(java_version) {
        return new Promise(async (resolve) => {
            const command = await this.getSetJavaVersionTextEcho(java_version);
            await this.execCommand(command, (event) => {
                if (event.error) {
                    return resolve({ error: true, data: null, message: 'Java cannot set!' });
                }
                if (event.type === 'stdout:end' && !event.error) {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error) {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            });
        });
    }

    async getJavaVirtualMachines() {
        return new Promise((resolve) => {
            this.execCommand('/usr/libexec/java_home -V', (event) => {
                if (event.error) {
                    return resolve({ error: true, data: null, message: 'Java not install!' });
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    const replace = event.data.replace(/(\/*Matching Java Virtual Machines \(4\):\n +\/*)/, '');
                    const split = replace.split('\n    ');
                    const filter = split.filter((o) => o !== '\n    ');
                    const versions = filter.map((d) => {
                        return new RegExp(/(\/*\S+\/*)/).exec(d)[0];
                    });
                    return resolve({
                        error: false,
                        data: versions
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    const replace = event.data.replace(/(\/*Matching Java Virtual Machines \(4\):\n +\/*)/, '');
                    const split = replace.split('\n    ');
                    const filter = split.filter((o) => o !== '\n    ');
                    const versions = filter.map((d) => {
                        return new RegExp(/(\/*\S+\/*)/).exec(d)[0];
                    });
                    return resolve({
                        error: false,
                        data: versions
                    });
                }
            });
        });
    }

    async checkJavaVersionExist(java_version) {
        return new Promise(async (resolve) => {
            const virtualMachines = await this.getJavaVirtualMachines();
            const find = virtualMachines.data.find((o) => o.startsWith(java_version));
            if (find) {
                return resolve({ error: false, data: find });
            }
            return resolve({ error: true, data: null });
        });
    }

    async getJavaPath(java_version) {
        return new Promise((resolve) => {
            this.execCommand('/usr/libexec/java_home -v ' + java_version, (event) => {
                if (event.error) {
                    return resolve({ error: true, data: null, message: 'Java not install!' });
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

    async installJavaWithBrew() {
        return new Promise(async (resolve) => {
            const brewTapCask = await this.brewTapCask();
            if (brewTapCask.error) {
                return resolve(brewTapCask);
            }

            const brewInstallZulu8 = await this.brewInstallZulu8();
            if (brewInstallZulu8.error) {
                return resolve(brewInstallZulu8);
            }

            const javaVirtualMachine = await this.checkJavaVersionExist('1.8');
            if (javaVirtualMachine.error) {
                return resolve(javaVirtualMachine);
            }

            const setJavaVersion = await this.setJavaVersion(javaVirtualMachine.data);
            if (setJavaVersion.error) {
                return resolve(setJavaVersion);
            }

            return resolve({ error: false });
        });
    }

    async brewInstallZulu8() {
        return new Promise((resolve) => {
            this.execCommand('brew install --cask zulu8', (event) => {
                if (event.error) {
                    return resolve({ error: true, data: null, message: 'Brew Java Zulu8 can not install!' });
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


    async brewTapCask() {
        return new Promise((resolve) => {
            this.execCommand('brew tap homebrew/cask-versions', (event) => {
                if (event.error) {
                    return resolve({ error: true, data: null, message: 'Brew Cask can not install!' });
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


module.exports = { JavaManager };
