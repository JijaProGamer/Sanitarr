import axios from 'axios'; 

class DownloadClient {
    name = 'BASE_CLIENT';
    requiresKey = false;
    requiresUsername = false;
    requiresLogin = false;

    async login(password){
        throw new Error('Not implemented');
    }

    async login(username, password){
        throw new Error('Not implemented');
    }

    async getDownload(hash){
        throw new Error('Not implemented');
    }
}

export default DownloadClient;