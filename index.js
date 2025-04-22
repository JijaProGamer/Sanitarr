import axios from 'axios';
import read_options from "./options_reader.js"

const options = await read_options()


const axiosInstance = axios.create({
    baseURL: `${options.RADARR_URL}/api/v3`,
    headers: {
        'X-Api-Key': options.RADARR_API_KEY
    }
});

const delugeAxios = axios.create({
    baseURL: `${options.DELUGE_URL}/json`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});



let delugeSessionCookie = null;

async function delugeLogin() {
    try {
        const res = await delugeAxios.post('', {
            method: 'auth.login',
            params: [options.DELUGE_PASSWORD],
            id: 1
        });

        const cookie = res.headers['set-cookie']?.[0];
        if (cookie) {
            delugeSessionCookie = cookie.split(';')[0];
            delugeAxios.defaults.headers.Cookie = delugeSessionCookie;
            console.log('🔐 Logged into Deluge');
        } else {
            throw new Error('No session cookie received from Deluge');
        }
    } catch (err) {
        console.error('❌ Failed to login to Deluge:', err.message);
    }
}

async function listDelugeDownloads() {
    try {
        const res = await delugeAxios.post('', {
            method: 'web.update_ui',
            params: [
                [
                    'name',
                    'state',
                    'progress',
                    'download_payload_rate',
                    'upload_payload_rate',
                    'eta',
                    'total_wanted',
                    'total_done',
                    'tracker_host',
                    'num_peers',
                    'total_uploaded',
                    'ratio',
                    'hash'
                ],
                {}
            ],
            id: 2
        });

        const torrents = res.data.result.torrents;

        const downloading = await Promise.all(Object.entries(torrents)
            .map(async ([hash, torrent]) => {
                const filesRes = await delugeAxios.post('', {
                    method: 'core.get_torrent_status',
                    params: [hash, ['files']],
                    id: 3
                });

                const files = filesRes.data.result.files;

                const filesInfo = files.map(file => {
                    const pathParts = file.path.split('/');
                    const fileName = pathParts[pathParts.length - 1];
                    const fileExtension = fileName.includes('.') ? fileName.split('.').pop() : 'unknown';
                    return {
                        path: file.path,
                        fileName,
                        fileExtension,
                        size: file.size
                    };
                });

                return {
                    ...torrent,
                    files: filesInfo
                };
            })
        );

        return downloading;
    } catch (err) {
        console.error('❌ Failed to list Deluge downloads:', err.message);
    }
}

async function listRadarrQueue() {
    try {
        const res = await axiosInstance.get('/queue', {
            params: {
                page: 1,
                pageSize: 1000,
                sortKey: 'timeleft',
                sortDirection: 'ascending'
            }
        });

        const queue = res.data.records;

        return queue;
    } catch (err) {
        console.error('❌ Failed to fetch Radarr queue:', err.response?.data || err.message);
        return [];
    }
}

async function blocklistAndSearchQueueItem(queueId) {
    try {
        const res = await axiosInstance.delete(`/queue/${queueId}`, {
            params: {
                removeFromClient: true,
                blocklist: true,
                skipRedownload: false,
                changeCategory: false
            }
        });
    } catch (err) {
        console.error('❌ Error during blocklist and search:', err.response?.data || err.message);
    }
}


setInterval(async () => {
    let queue = await listRadarrQueue()
    const delugeDownloads = await listDelugeDownloads()

    for (let queueElement of queue) {
        const queueElementID = queueElement.id
        const queueElementStatus = queueElement.statusMessages.map(v => v.messages).flat()
        const queueElementDownloadId = queueElement.downloadId
        const queueElementDownloadClient = queueElement.downloadClient



        let blacklistRelease = false

        for (let status of queueElementStatus) {
            if (status.includes("No files found are eligible for import")) {
                blacklistRelease = true
                break
            }
        }

        if(!blacklistRelease){
            if (queueElementDownloadClient == "Deluge") {
                const delugeElement = delugeDownloads.find((v) => v.hash.toLowerCase() == queueElementDownloadId.toLowerCase())
                if(delugeElement){
                    for (let file of delugeElement.files) {
                        let isBadFile = options.BLOCKED_EXTENSIONS.includes(file.fileExtension.toLowerCase())
                        if (isBadFile) {
                            blacklistRelease = true
                            break
                        }
                    }
                }
            }
        }

        if (blacklistRelease) {
            console.log(`Blocked release with queue ID ${queueElementID}. Trying next release.`)

            blocklistAndSearchQueueItem(queueElementID)
        }
    }
}, options.SCAN_INTERVAL * 1000)



await delugeLogin();