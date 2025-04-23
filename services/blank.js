import axios from 'axios'; 

class Service {
    name = 'BASE_SERVICE';
    requiresKey = false;
    requiresUsername = false;
    requiresLogin = false;

    async login(key){
        throw new Error('Not implemented');
    }


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

export default Service;