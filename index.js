import fs from "fs"
import path from "path"

import read_options from "./options_reader.js"


const download_clients_directory = path.join(import.meta.dirname, "download_clients")
const download_clients_files = fs.readdirSync(download_clients_directory).filter(v => !v.startsWith("blank"))
const download_clients_classes_entries = await Promise.all(
    download_clients_files.map(async (file) => {
        const modulePath = `file://${path.join(download_clients_directory, file)}`
        const module = await import(modulePath)
        const classExport = module.default || module[Object.keys(module)[0]]
        const key = path.basename(file, ".js")
        return [key, classExport]
    })
)



const services_directory = path.join(import.meta.dirname, "services")
const services_files = fs.readdirSync(services_directory).filter(v => !v.startsWith("blank"))
const services_classes_entries = await Promise.all(
    services_files.map(async (file) => {
        const modulePath = `file://${path.join(services_directory, file)}`
        const module = await import(modulePath)
        const classExport = module.default || module[Object.keys(module)[0]]
        const key = path.basename(file, ".js")
        return [key, classExport]
    })
)





const download_clients_classes = Object.fromEntries(download_clients_classes_entries)
const services_classes = Object.fromEntries(services_classes_entries)

const options = await read_options(process.env["OPTIONS_FILE"], download_clients_classes, services_classes)

if(Object.keys(options.services).length == 0){
    throw new Error("No service loaded, or all services are unable to connect.")
}

/*if(Object.keys(options.download_clients).length == 0){
    throw new Error("No download client loaded, or all download clients are unable to connect.")
}*/

setInterval(async () => {
    for(let service of Object.values(options.services)){
        try {
            let queue = await service.getQueue()
            for(let queueElement of queue){
                let blacklistRelease = false

                let queueElementStatuses = queueElement.statusMessages.map(v => v.messages).flat()
                for (let status of queueElementStatuses) {
                    if (status.includes("No files found are eligible for import")) {
                        blacklistRelease = true
                        break
                    }
                }
        
                if (!blacklistRelease) {
                    try {
                        let download_client = options.download_clients[queueElement.downloadClient.toLowerCase()]
                        if(download_client){
                            let download = await download_client.getDownload(queueElement.downloadId)

                            if(download){
                                for (let file of download.files) {
                                    let isBadFile = options.BLOCKED_EXTENSIONS.includes(file.fileExtension.toLowerCase())
                                    if (isBadFile) {
                                        blacklistRelease = true
                                        break
                                    }
                                }
                            }
                        }
                    } catch (err){
                        console.log(err)
                    }
                }
            
                if (blacklistRelease) {
                    console.log(`Blocked release of ${queueElement.title} from ${queueElement.indexer}. Trying next release.`)
        
                    await service.blocklistAndSearch(queueElement.id)
                }
            }
        } catch (err) {
            console.log(err)
        }
    }
}, options.SCAN_INTERVAL * 1000)