const { ChildProcess } = require('./child_process');
const { IonicManager } = require('./ionic-manager');
const { CordovaManager } = require('./cordova-manager');
const { BrewManager } = require('./brew-manager');
const { GradleManager } = require('./gradle-manager');
const { NodeManager } = require('./node-manager');
const { JavaManager } = require('./java-manager');

class AndroidCleaner extends ChildProcess {
    ionicCli = new IonicManager();
    CordovaManager = new CordovaManager();
    BrewManager = new BrewManager();
    GradleManager = new GradleManager();
    NodeManager = new NodeManager();
    JavaManager = new JavaManager();

    constructor() {
        super();
    }

    async startAndroidCleaner() {
        return new Promise(async (resolve) => {
            const environmentCheck = await this.environmentCheck();
            if (environmentCheck.error) {
                return resolve(environmentCheck);
            }


        });
    }

    async cleanNode() {
        return new Promise(async (resolve) => {
            let nodeVersion = await this.NodeManager.getNodeVersion(false);
            let change_node_version = nodeVersion.data.split('.')[0] + '.' + nodeVersion.data.split('.')[1] + '.' + (+nodeVersion.data.split('.')[nodeVersion.data.split('.').length - 1] === 1 ? 0 : 1).toString();
            console.log('%c change_node_version', 'background: #222; color: #bada55', change_node_version);
            const installNodeWithNvm = await this.tryInstallNodeWithNvm(change_node_version);
            if (installNodeWithNvm.error) {
                return resolve(installNodeWithNvm);
            }
            console.log('%c installNodeWithNvm', 'background: #222; color: #bada55', installNodeWithNvm);
            let change_node_version2 = change_node_version.split('.')[0] + '.' + change_node_version.split('.')[1] + '.' + (+change_node_version.split('.')[change_node_version.split('.').length - 1] === 1 ? 0 : 1).toString();
            console.log('%c change_node_version2', 'background: #222; color: #bada55', change_node_version);
            /*         const removeNodeWithNvm = await this.removeNodeWithNvm(change_node_version2, change_node_version);
                     if (removeNodeWithNvm.error) {
                         return resolve(removeNodeWithNvm);
                     }*/
            nodeVersion = await this.NodeManager.getNodeVersion(false);
            if (nodeVersion.error) {
                return resolve(nodeVersion);
            }
            this.NODE_VERSION = nodeVersion.data;
            return resolve({ error: false, data: nodeVersion });
        });
    }

    async environmentCheck() {
        return new Promise(async (resolve) => {
            // Ionic Version
            let ionicVersion = await this.ionicCli.getIonicVersion();
            if (ionicVersion.error) {
                const installIonic = await this.tryInstallIonic();
                if (installIonic.error) {
                    return resolve(installIonic);
                }
                ionicVersion = await this.ionicCli.getIonicVersion();
                if (ionicVersion.error) {
                    return resolve(installIonic);
                }
            }
            this.IONIC_VERSION = ionicVersion.data;
            console.log('%c IONIC_VERSION', 'background: #222; color: #bada55', this.IONIC_VERSION);


            // Cordova Version
            let cordovaVersion = await this.CordovaManager.getCordovaVersion();
            if (cordovaVersion.error) {
                const installCordova = await this.tryInstallCordova();
                if (installCordova.error) {
                    return resolve(installCordova);
                }
                cordovaVersion = await this.CordovaManager.getCordovaVersion();
                console.log('%c cordovaVersion22222', 'background: #222; color: #bada55', cordovaVersion);
                if (cordovaVersion.error) {
                    return resolve(cordovaVersion);
                }
            }
            this.CORDOVA_VERSION = cordovaVersion.data;
            console.log('%c CORDOVA_VERSION', 'background: #222; color: #bada55', this.CORDOVA_VERSION);

            // Cordova Resources Version
            let cordovaResourcesVersion = await this.CordovaManager.getCordovaResVersion();
            if (cordovaResourcesVersion.error) {
                const installCordovaResources = await this.tryInstallCordovaResources();
                if (installCordovaResources.error) {
                    return resolve(installCordovaResources);
                }
                cordovaResourcesVersion = await this.CordovaManager.getCordovaResVersion();
                if (cordovaResourcesVersion.error) {
                    return resolve(cordovaResourcesVersion);
                }
            }
            this.CORDOVA_RES_VERSION = cordovaResourcesVersion.data;
            console.log('%c CORDOVA_RES_VERSION', 'background: #222; color: #bada55', this.CORDOVA_RES_VERSION);

            // Brew Version
            let brewVersion = await this.BrewManager.getBrewVersion();
            if (brewVersion.error) {
                const installBrew = await this.tryInstallBrew();
                if (installBrew.error) {
                    return resolve(installBrew);
                }
                brewVersion = await this.BrewManager.getBrewVersion();
                if (brewVersion.error) {
                    return resolve(installBrew);
                }
            }
            this.BREW_VERSION = brewVersion.data;
            console.log('%c BREW_VERSION', 'background: #222; color: #bada55', this.BREW_VERSION);

            // Gradle Version
            let gradleVersion = await this.GradleManager.getGradleVersion();
            if (gradleVersion.error) {
                const installGradleWithBrew = await this.tryInstallGradleWithBrew();
                if (installGradleWithBrew.error) {
                    if (!installGradleWithBrew.message.includes('Brew')) {
                        return resolve(installGradleWithBrew);
                    }
                }

                gradleVersion = await this.GradleManager.getGradleVersion();
                if (gradleVersion.error) {
                    return resolve(gradleVersion);
                }
            }
            this.GRADLE_VERSION = gradleVersion.data;
            console.log('%c GRADLE_VERSION', 'background: #222; color: #bada55', this.GRADLE_VERSION);

            // Node Version
            let nodeVersion = await this.NodeManager.getNodeVersion(false);
            if (nodeVersion.error) {
                const installNodeWithNvm = await this.tryInstallNodeWithNvm();
                if (installNodeWithNvm.error) {
                    return resolve(installNodeWithNvm);
                }

                nodeVersion = await this.NodeManager.getNodeVersion(false);
                if (nodeVersion.error) {
                    return resolve(nodeVersion);
                }
            }
            this.NODE_VERSION = nodeVersion.data;
            console.log('%c NODE_VERSION', 'background: #222; color: #bada55', this.NODE_VERSION);


            // Java Version
            let javaVersion = await this.JavaManager.getJavaVersion();
            if (javaVersion.error) {
                const installJavaWithBrew = await this.tryInstallJavaWithBrew();
                if (installJavaWithBrew.error) {
                    return resolve(installJavaWithBrew);
                }

                javaVersion = await this.JavaManager.getJavaVersion();
                if (javaVersion.error) {
                    return resolve(javaVersion);
                }
            }

            if (!javaVersion.data.startsWith('1.8')) {
                const javaVirtualMachine = await this.JavaManager.checkJavaVersionExist('1.8');
                if (javaVirtualMachine.error) {
                    const installJavaWithBrew = await this.tryInstallJavaWithBrew();
                    if (installJavaWithBrew.error) {
                        return resolve(installJavaWithBrew);
                    }
                } else {
                    const setJavaVersion = await this.JavaManager.setJavaVersion(javaVirtualMachine.data);
                    if (setJavaVersion.error) {
                        return resolve(setJavaVersion);
                    }
                }
                javaVersion.data = javaVirtualMachine.data;
            }
            this.JAVA_VERSION = javaVersion.data;
            console.log('%c JAVA_VERSION', 'background: #222; color: #bada55', this.JAVA_VERSION);
            return resolve({ error: false });
        });

    }

    async tryInstallBrew() {
        return new Promise(async (resolve) => {
            const installBrew = await this.BrewManager.installBrew();
            return resolve(installBrew);
        });
    }

    async tryInstallJavaWithBrew() {
        return new Promise(async (resolve) => {
            const installJavaWithBrew = await this.JavaManager.installJavaWithBrew();
            return resolve(installJavaWithBrew);
        });
    }

    async tryInstallIonic() {
        return new Promise(async (resolve) => {
            const installIonic = await this.ionicCli.installIonic();
            console.log('%c installIonic', 'background: #222; color: #bada55', installIonic);

            return resolve(installIonic);
        });
    }

    async tryInstallCordova() {
        return new Promise(async (resolve) => {
            const installCordova = await this.CordovaManager.installCordova();
            return resolve(installCordova);
        });
    }

    async tryInstallCordovaResources() {
        return new Promise(async (resolve) => {
            const installCordovaRes = await this.CordovaManager.installCordovaRes();
            return resolve(installCordovaRes);
        });
    }

    async tryInstallGradleWithBrew() {
        return new Promise(async (resolve) => {
            const brewVersion = await this.BrewManager.getBrewVersion();
            if (brewVersion.error) {
                return resolve(brewVersion);
            }
            const installGradle = await this.GradleManager.installGradle();
            return resolve(installGradle);
        });
    }

    async tryInstallNodeWithNvm(node_version = '14.17.0') {
        return new Promise(async (resolve) => {
            let nvmVersion = await this.NodeManager.getNvmVersion();
            if (nvmVersion.error) {
                const installNvm = await this.NodeManager.installNvm();
                if (installNvm.error) {
                    return resolve(installNvm);
                }
                nvmVersion = await this.NodeManager.getNvmVersion();
                if (nvmVersion.error) {
                    return resolve(installNvm);
                }
            }

            const exportNvm = await this.NodeManager.exportNvmDirPathEcho();
            const installNode = await this.NodeManager.installNode(node_version);
            if (installNode.error) {
                return resolve(installNode);
            }

            /* const setNode = await this.NodeManager.setNodeVersionWithNvm(node_version);
             if (setNode.error) {
                 return resolve(setNode);
             }*/
            return resolve({ error: false });
        });
    }

    async removeNodeWithNvm(node_version = '14.17.0', node_version2 = '14.16.0') {
        return new Promise(async (resolve) => {
            let nvmVersion = await this.NodeManager.getNvmVersion();
            if (nvmVersion.error) {
                const installNvm = await this.NodeManager.installNvm();
                if (installNvm.error) {
                    return resolve(installNvm);
                }
                nvmVersion = await this.NodeManager.getNvmVersion();
                if (nvmVersion.error) {
                    return resolve(installNvm);
                }
            }

            const exportNvm = await this.NodeManager.exportNvmDirPathEcho();
            const removeNode = await this.NodeManager.removeNode(node_version, node_version2);
            if (removeNode.error) {
                return resolve(removeNode);
            }


            return resolve({ error: false });
        });
    }


}


module.exports = { AndroidCleaner };
