import fs from "fs/promises";
import path from "path";

const optionsFilePath = path.join(import.meta.dirname, 'options.json');

async function checkOptionsFile() {
    try {
        const data = await fs.readFile(optionsFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        const optionsFileEnv = process.env.OPTIONS_FILE;

        if (optionsFileEnv) {
            const resolvedPath = path.resolve(optionsFileEnv);
            try {
                const data = await fs.readFile(resolvedPath, 'utf-8');
                return JSON.parse(data);
            } catch (envErr) {
                console.log('No options file found via environment variable');
            }
        } else {
            console.log('No OPTIONS_FILE environment variable set');
        }
    }

    return {};
}

export default async function read_options() {
    const optionsFile = await checkOptionsFile();
    const options = {
        RADARR_URL: process.env.RADARR_URL || optionsFile.RADARR_URL || null,
        RADARR_API_KEY: process.env.RADARR_API_KEY || optionsFile.RADARR_API_KEY || null,

        DELUGE_URL: process.env.DELUGE_URL || optionsFile.DELUGE_URL || null,
        DELUGE_PASSWORD: process.env.DELUGE_PASSWORD || optionsFile.DELUGE_PASSWORD || null,

        SCAN_INTERVAL: process.env.SCAN_INTERVAL || optionsFile.SCAN_INTERVAL || null,
        BLOCKED_EXTENSIONS: process.env.BLOCKED_EXTENSIONS || optionsFile.BLOCKED_EXTENSIONS || null,
    }

    for (const [key, value] of Object.entries(options)) {
        if (value === null) {
            throw new Error(`Missing required option: ${key}`);
        }
    }

    options.BLOCKED_EXTENSIONS = (await fs.readFile(options.BLOCKED_EXTENSIONS, "utf-8"))
                                    .replaceAll("\n", " ").replaceAll("\r", " ").split(" ").filter(v => v.length > 0);

    return options;
}