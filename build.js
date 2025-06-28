const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// --- Configuration ---
console.log("🚀 Starting build process...");

// Read manifest to get version
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const version = manifest.version;
console.log(`- Version found: ${version}`);

// Read locales to get extension name
const messages = JSON.parse(fs.readFileSync(path.join('_locales', 'en', 'messages.json'), 'utf8'));
const extensionNameForFile = messages.extensionName.message.replace(/\s+/g, ''); // Remove spaces for filename
const extensionName = messages.extensionName.message;
console.log(`- Extension name found: ${extensionName}`);

const outputFile = `${extensionNameForFile}_v${version}.zip`;
console.log(`- Output file will be: ${outputFile}`);

// Files and directories to include in the zip
const includes = [
    "manifest.json",
    "_locales",
    "icons",
    "js",
    "libs",
    "options",
    "popup"
];
console.log(`- Including the following items: ${includes.join(', ')}`);


// --- Archiving ---
console.log("\n📦 Creating extension package...");

// Create a write stream for the output file
const output = fs.createWriteStream(outputFile);
const archive = archiver('zip', {
    zlib: { level: 9 } // Set compression level to maximum
});

// Listen for the 'close' event on the output stream
output.on('close', function() {
    const sizeInMB = archive.pointer() / 1024 / 1024;
    console.log("\n-----------------------------------------");
    console.log(`✅ Build successful!`);
    console.log(`   - File: ${outputFile}`);
    console.log(`   - Size: ${sizeInMB.toFixed(2)} MB`);
    console.log(`🎉 Ready to be published to the Chrome Web Store!`);
    console.log("-----------------------------------------");
});

// Listen for warnings and errors from the archiver
archive.on('warning', function(err) {
    if (err.code === 'ENOENT') {
        console.warn('⚠️ Warning:', err);
    } else {
        throw err;
    }
});

archive.on('error', function(err) {
    console.error('❌ Error while creating archive:', err);
    throw err;
});

// Pipe the archive data to the output file
archive.pipe(output);

// Add all specified files and directories to the archive
includes.forEach(item => {
    if (fs.existsSync(item)) {
        const stat = fs.statSync(item);
        if (stat.isDirectory()) {
            archive.directory(item, item);
        } else {
            archive.file(item, { name: path.basename(item) });
        }
    } else {
        console.warn(`⚠️ Warning: Item "${item}" not found and will be skipped.`);
    }
});

// Finalize the archive (no more files can be appended)
archive.finalize();

// --- Markdown Update ---
// TODO: Implement markdown file updates based on user requirements.
console.log("\n📝 Skipping Markdown update. Please specify what changes are needed.");
