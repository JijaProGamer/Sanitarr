import fs from "fs/promises";
import path from "path";

async function checkOptionsFile(optionsFilePath) {
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

export default async function read_options(optionsFilePath, download_clients_classes, services_classes) {
    const optionsFile = await checkOptionsFile(optionsFilePath);
    const options = {
        SCAN_INTERVAL: process.env.SCAN_INTERVAL || optionsFile.SCAN_INTERVAL || null,
        BLOCKED_EXTENSIONS_FILE: process.env.BLOCKED_EXTENSIONS_FILE || optionsFile.BLOCKED_EXTENSIONS_FILE || null,

        FFPROBE_PATH: process.env.FFPROBE_PATH || optionsFile.FFPROBE_PATH || null,

        services: {},
        download_clients: {},
    }

    for (const [key, value] of Object.entries(options)) {
        if (value === null) {
            throw new Error(`Missing required option: ${key}`);
        }
    }

    const combinedOptions = {
        ...Object.fromEntries(Object.entries(process.env).map(([k, v]) => [k.toUpperCase(), v])),
        ...Object.fromEntries(Object.entries(optionsFile).map(([k, v]) => [k.toUpperCase(), v]))
    };
    
    for (let [key, value] of Object.entries(combinedOptions)) {
        if(key.endsWith("_ENABLED") && value == "yes"){
            let service_name = key.replace(/_ENABLED$/, "").toLowerCase()
            let service_class = services_classes[service_name]
            let download_client_class = download_clients_classes[service_name]
            let use_class = service_class || download_client_class

            let serviceData = new use_class() 

            if(service_class){
                options.services[service_name] = serviceData
            } else {
                options.download_clients[service_name] = serviceData
            }


            let key_title = `${service_name.toUpperCase()}_URL`
            let url = process.env[key_title] || optionsFile[key_title] || null
            if(url == null){
                throw new Error(`Missing required option: ${key_title}`);
            }
            
            if(serviceData.requiresLogin){
                if(serviceData.requiresKey){
                    let key_title = `${service_name.toUpperCase()}_KEY`
                    let key = process.env[key_title] || optionsFile[key_title] || null
                    if(key == null){
                        throw new Error(`Missing required option: ${key_title}`);
                    }

                    await serviceData.login(url, key)
                } else {
                    let key_title = `${service_name.toUpperCase()}_PASSWORD`
                    let password = process.env[key_title] || optionsFile[key_title] || null
                    if(password == null){
                        throw new Error(`Missing required option: ${key_title}`);
                    }


                    if(serviceData.requiresUsername){
                        let key_title = `${service_name.toUpperCase()}_USERNAME`
                        let username = process.env[key_title] || optionsFile[key_title] || null
                        if(username == null){
                            throw new Error(`Missing required option: ${key_title}`);
                        }

                        await serviceData.login(url, username, password)
                    } else {
                        await serviceData.login(url, password)
                    }
                }
            } else {
                await serviceData.login(url)
            }
        }
    }
    

    options.BLOCKED_EXTENSIONS = (await fs.readFile(options.BLOCKED_EXTENSIONS_FILE, "utf-8"))
                                    .replaceAll("\n", " ").replaceAll("\r", " ").split(" ").filter(v => v.length > 0);

    return options;
}