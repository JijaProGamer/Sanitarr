import axios from 'axios'; 

class Deluge {
    name = 'Deluge';
    requiresKey = false;
    requiresUsername = false;
    requiresLogin = true;

    networkConnection;

    async login(url, password){
        this.networkConnection = axios.create({
            baseURL: `${url}/json`,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    
        const res = await this.networkConnection.post('', {
            method: 'auth.login',
            params: [password],
            id: 1
        });

        const cookie = res.headers['set-cookie']?.[0];
        if (cookie) {
            this.networkConnection.defaults.headers.Cookie = cookie.split(';')[0];
            console.log('Logged into Deluge.');
        } else {
            throw new Error('No session cookie received from Deluge.');
        }
    }

    async getDownload(hash){
        const res = await this.networkConnection.post('', {
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
                const filesRes = await this.networkConnection.post('', {
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



        return downloading.find((v) => v.hash.toLowerCase() == hash.toLowerCase())
    }
}

export default Deluge;