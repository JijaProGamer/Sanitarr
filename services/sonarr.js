import axios from 'axios'; 

class Service {
    name = 'Sonarr';
    requiresKey = true;
    requiresUsername = false;
    requiresLogin = true;

    networkConnection;

    async login(url, key){
        this.networkConnection = axios.create({
            baseURL: `${url}/api/v3`,
            headers: {
                'X-Api-Key': key
            }
        });

        try {
            const res = await this.networkConnection.get('/system/status');
            console.log(`Logged into Sonarr. Version: ${res.data.version}`)
        } catch (err) {
            console.error('Failed to connect to Sonarr API:', err.message);
            throw err;
        }
    }

    async getQueue(){
        const res = await this.networkConnection.get('/queue', {
            params: {
                page: 1,
                pageSize: 1000,
                sortKey: 'timeleft',
                sortDirection: 'ascending'
            }
        });

        return res.data.records;
    }

    async blocklistAndSearch(id){
        await this.networkConnection.delete(`/queue/${id}`, {
            params: {
                removeFromClient: true,
                blocklist: true,
                skipRedownload: false,
                changeCategory: false
            }
        });
    }
}

export default Service;