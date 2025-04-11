class Installer {
    constructor() {
        this.session = { // The session data.
            hasInstalled: false,
        }

        try {
            if (require('./output/data/installed')) {
                console.log('[V] Skipping installation, dependencies already installed');

                // If the installation hasn't been completed yet,
                if (!this.session.hasInstalled) {
                    // Mark the session as installed
                    this.session.hasInstalled = true;
                }
            }
        } catch (error) {
            if (
                // Look for if the installer has ran before.
                error.code === 'MODULE_NOT_FOUND' &&
                error.message.includes(`'./output/data/installed'`)
            ) {
                console.warn('[!] Module not found: ./output/data/installed');
                const { exec } = require('child_process');
                this.install(exec); // Installs the dependencies
            } else {
                throw error; // Re-throw if it's some other error (like a syntax error inside the module)
            }
        }
    }

    async complete(writeFileSync, resolve) {
        // Perform any necessary actions after installation
        console.log('[V] Installation complete');
        writeFileSync(resolve('./output/data/installed.js'), 'return true;'); // Save the installation status
        this.session.hasInstalled = true; // Mark the session as installed
    }

    async install(exec) {
        console.log('[V] Installing dependencies...');

        try {
            // Use child_process.exec to run the 'npm install' command in a new child process
            await new Promise((resolve, reject) => {
                exec('npm install', (error, stdout, stderr) => {
                    // If errors exits the process, and outputs an error
                    if (error) { console.error(`[X] Error installing dependencies: ${error.message}`); return; }
                    console.log('[V] Dependencies installed successfully');
                    resolve(); // Completes the installation.
                });
            });

            // After installation, resolve the promise
            const { writeFileSync } = require('fs');
            const { resolve } = require('path');

            // Call complete() method after installation
            this.complete(writeFileSync, resolve);
        } catch (error) { console.error('[X] Error installing dependencies'); throw error; }
    }
}

class Initialize {
    constructor() {
        const { existsSync, mkdirSync, writeFileSync } = require('fs');
        const { resolve } = require('path');

        if (!existsSync('./output/data/completed.js')) {
            this.createDirectories(existsSync, mkdirSync, resolve); // Creates necessary directories
            this.initializeHandbook(resolve); // Initializes the handbook
            this.createFiles(existsSync, writeFileSync, resolve); // Creates necessary files
            writeFileSync(resolve('./output/data/completed.js'), 'return true;')
        }
    }

    createDirectories(existsSync, mkdirSync, resolve) {
        try {
            const dirNames = [ // The directories to be created
                'output', 'output/logs', 'config', 'config/handbook', 'output/data', 'output/src'
            ];
            dirNames.forEach(dirName => { // Go through each directories
                const dirPath = resolve(dirName); // Resolves the directory path
                if (!existsSync(dirPath)) mkdirSync(dirPath); // Creates the directory if it doesn't exist.
            });
        } catch (error) { console.error(`[X] Error creating directories: ${error.message}`); throw error; }
    }


    createFiles(existsSync, writeFileSync, resolve) {
        try {
            const files = [ // The files to be created
                { name: 'output/data/initialized.js', content: 'return false;' }
            ];
            files.forEach(file => { // Go through each file
                const filePath = resolve(file.name); // Resolves the file path
                if (!existsSync(filePath)) writeFileSync(filePath, file.content); // Creates the file if it doesn't exist.
            });
            console.log('[V] Files initialized successfully');
        } catch (error) {
            console.error(`[X] Error initializing files: ${error.message}`);
            throw error; // Re-throws the error
        }
    }

    async initializeHandbook(resolve) {
        const source = resolve('output/handbook.zip'); // The source file
        const target = resolve('config/handbook'); // The target directory

        const extract = require('extract-zip'); // Extract library
        const { Axios }= require('axios'); // Axios web library

        async function download() {
            const axios = new Axios({
                responseType: 'arraybuffer', // Needed for binary data
                timeout: 10000, // 10 seconds timeout
                maxRedirects: 5, // Few redirects
            })

            try {
                const data = await axios.get('https://github.com/cassitly/source-assets/releases/download/AHB-1/handbook.zip');
                writeFileSync(source, Buffer.from(data.data))
            } catch (error) {
                throw error; // Returns the thrown error
            }
        }
 
        async function main () {
            try {
                // Extracts the file
                await extract(source, { dir: target })
                console.log('[V] Extraction complete')
            } catch (err) {
                throw err; // Throws the errors back
            }
        }

        try {
            await download(); // Downloads the zip file.
            await main(); // Extracts the zip file
        } catch (error) {
            console.error(`[X] Error initializing handbook: ${error.message}`);
            throw error; // Re-throws the caught error
        }
    }
}

class Notify {
    constructor() {
        require('dotenv').config({ path: './config/.env' })
        const { format } = require('date-and-time');
        const { resolve } = require('path');
        const { v1 } = require('uuid');

        this.date = format(new Date(), 'DD-MM-YYYY');
        this.time = format(new Date(), 'HH:mm:ss');
        this.timestamp = format(new Date(), '[DD-MM-YYY] HH-mm-ss')

        this.session = {
            uniqueId: v1(), // The unique UUID
            directory: resolve('./output/logs'), // The log directory
        }

        this.logs = ""; // Saves the logs
        this.logs += `[SESSION] ${this.timestamp} - ${this.session.uniqueId}\n`;
    }

    async complete() {
        this.save(); // Saves the log file
    }

    async save() {
        const { writeFileSync } = require('fs');
        const { resolve } = require('path');

        try {
            writeFileSync(resolve(`${this.session.directory}/${this.date}-${this.session.uniqueId}.log`), this.logs);
        } catch (error) {
            console.error(`[X] Error saving logs: ${error.message}`);
            throw error; // Re-throws the caught error
        }
    }

    async log(...msg) {
        console.info(`[LOG] ${this.time} - ${this.date}: ${msg.join(' ')}`);
        this.logs += `[LOG] ${this.time} - ${this.date}: ${msg.join(' ')}\n`;
    }

    async info(...msg) {
        console.info(`[INFO] ${this.time} - ${this.date}: ${msg.join(' ')}`);
        this.logs += `[INFO] ${this.time} - ${this.date}: ${msg.join(' ')}\n`;
    }

    async success(...msg) {
        console.info(`[SUCCESS] ${this.time} - ${this.date}: ${msg.join(' ')}`);
        this.logs += `[SUCCESS] ${this.time} - ${this.date}: ${msg.join(' ')}\n`;
    }

    async warn(...msg) {
        console.warn(`[WARNING] ${this.time} - ${this.date}: ${msg.join(' ')}`);
        this.logs += `[WARNING] ${this.time} - ${this.date}: ${msg.join(' ')}\n`;
    }

    async error(...msg) {
        console.error(`[ERROR] ${this.time} - ${this.date}: ${msg.join(' ')}`);
        this.logs += `[ERROR] ${this.time} - ${this.date}: ${msg.join(' ')}\n`;
    }

    async debug(...msg) {
        require('dotenv').config({ path: './output/data/.env' }); // Dotenv Config
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[DEBUG] ${this.time} - ${this.date}: ${msg.join(' ')}`);
            this.logs += `[DEBUG] ${this.time} - ${this.date}: ${msg.join(' ')}\n`;
        }
    }
}

class Payload {
    constructor(notify) {
        this.notify = notify;

        this.run(); // Runs the payload
    }

    async initializePayload(resolve) {
        const source = resolve('output/src.zip'); // The source file
        const target = resolve('config/src'); // The target directory

        const extract = require('extract-zip'); // Extract library
        const { Axios }= require('axios'); // Axios web library

        async function download() {
            const axios = new Axios({
                responseType: 'arraybuffer', // Needed for binary data
                timeout: 10000, // 10 seconds timeout
                maxRedirects: 5, // Few redirects
            })

            try {
                const data = await axios.get('https://github.com/cassitly/Aeronautica-ATC/releases/download/0.1.0-beta/src.zip');
                writeFileSync(source, Buffer.from(data.data))
            } catch (error) {
                throw error; // Returns the thrown error
            }
        }
 
        async function main () {
            try {
                // Extracts the file
                await extract(source, { dir: target })
                this.notify.log('[V] Extraction complete')
            } catch (err) {
                throw err; // Throws the errors back
            }
        }

        try {
            await download(); // Downloads the zip file.
            await main(); // Extracts the zip file
        } catch (error) {
            this.notify.error(`[X] Error initializing source: ${error.message}`);
            throw error; // Re-throws the caught error
        }
    }

    async run() {
        const { resolve } = require('path');
        const { existsSync } = require('fs');

        try {
            if (!existsSync(resolve('output/src/app.js'))) {
                await this.initializePayload(resolve); // Initializes the payload
                this.notify.success('[V] Payload initialized successfully');
            }
            require(resolve('output/src/app.js')); // Runs the application
        } catch (error) {
            this.notify.error(`[X] Error running application: ${error.message}`);
            throw error; // Re-throws the caught error
        }
    }
}

class Application {
    constructor() {
        this.notify = new Notify(); // Initializes the notification system

        this.initialize(); // Initializes the application
        /** Wait for 15 seconds before initializing the payload */
        new Promise(resolve => setTimeout(resolve, 15000)).then(() => this.payload());
    }

    initialize() {
        new Installer() // Installs the required dependencies
        new Initialize() // Initializes directories & files
    }

    payload() {
        new Payload(this.notify); // Initializes the payload
        /** Wait for the application to exit, then save the logs */
        process.on('beforeExit', () => { this.notify.log('Application exiting...'); this.notify.complete(); });
    }
}

new Application();