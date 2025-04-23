# Sanitarr

**Sanitarr** is a Node.js utility designed to monitor and audit downloads managed by automated media services such as **Radarr**, **Sonarr**, and **Lidarr**. It ensures the integrity of your media library by identifying and flagging failed imports or potentially unsafe and unsupported files—such as executables, obscure archive formats, or content with missing extensions.

---

## 💖 Support Development

If you find Sanitarr helpful, please consider supporting ongoing development:

- Patreon: https://www.patreon.com/c/bloxxy213/membership
- PayPal: https://www.paypal.me/bloxxywashere

Your support directly helps maintain, improve, and expand the project. Thank you.

---

## ✨ Features

- Scans ongoing and recent downloads from supported automation tools
- Detects:
  - Failed imports due to missing or invalid files
  - Suspicious file types (e.g., executable binaries)
- Supported services:
  - Radarr
  - Sonarr
  - Lidarr
- Supported download clients:
  - Deluge
- Extensible architecture:
  - Easy to add new services or download clients
  - Contributions are encouraged—feel free to submit a Pull Request if you add support for additional integrations

---

## ⚙️ Configuration

Sanitarr supports configuration via:
- An environment variable named `OPTIONS_FILE` pointing to a JSON configuration file
- Direct environment variables (which override the file values)

### Example Configuration (`OPTIONS_FILE`):

```json
{
    "RADARR_ENABLED": "yes",
    "RADARR_URL": "http://127.0.0.0:7878",
    "RADARR_KEY": "your_radarr_api_key",

    "SONARR_ENABLED": "yes",
    "SONARR_URL": "http://127.0.0.0:8989",
    "SONARR_KEY": "your_sonarr_api_key",

    "LIDARR_ENABLED": "yes",
    "LIDARR_URL": "http://127.0.0.0:8686",
    "LIDARR_KEY": "your_lidarr_api_key",

    "DELUGE_ENABLED": "yes",
    "DELUGE_URL": "http://192.0.0.0:8112",
    "DELUGE_PASSWORD": "your_deluge_password",

    "SCAN_INTERVAL": 30,
    "BLOCKED_EXTENSIONS_FILE": "./blocked_extensions.txt",
    "FFPROBE_PATH": "null"
}
```

Use the `OPTIONS_FILE` environment variable to specify the path to this configuration file. Any configuration key can also be provided as an individual environment variable.

---

## 🚀 Getting Started

Sanitarr is developed with **Node.js v22.14.0**. You should install that version, or else unexpected errors might occur.

### Run Locally

1. Clone the repository:

   ```
   git clone https://github.com/JijaProGamer/Sanitarr.git
   cd sanitarr
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Launch the application:

   ```
   OPTIONS_FILE=./options.json node index.js
   ```

---

## 🐳 Running with Docker

To run Sanitarr using Docker, use the following `docker-compose.yml` template:

```yaml
version: '3.8'

services:
  sanitarr:
    image: bloxxy213/sanitarr:latest
    environment:
      RADARR_ENABLED: "yes"
      RADARR_URL: "http://127.0.0.0:7878"
      RADARR_KEY: "your_radarr_api_key"

      SONARR_ENABLED: "yes"
      SONARR_URL: "http://127.0.0.0:8989"
      SONARR_KEY: "your_sonarr_api_key"

      LIDARR_ENABLED: "yes"
      LIDARR_URL: "http://127.0.0.0:8686"
      LIDARR_KEY: "your_lidarr_api_key"

      DELUGE_ENABLED: "yes"
      DELUGE_URL: "http://192.0.0.0:8112"
      DELUGE_PASSWORD: "your_deluge_password"

      SCAN_INTERVAL: "30"
      BLOCKED_EXTENSIONS_FILE: "/usr/src/app/blocked_extensions.txt"

      FFPROBE_PATH: "null"
    volumes:
      - ./blocked_extensions.txt:/usr/src/app/blocked_extensions.txt
    restart: on-failure
```

Ensure that your `options.json` and `blocked_extensions.txt` are in the same directory as your `docker-compose.yml` or adjust the paths accordingly.

Then start the container:

```
docker-compose up -d
```

---

## 🧩 Extending Functionality

Sanitarr is designed with extensibility in mind:

- Adding new media services or download clients is straightforward
- If you implement support for a new system, please consider opening a Pull Request to share your contribution with the community

---

## 🤝 Contributing

We welcome community contributions. Whether it’s a feature addition, a bug fix, or improved documentation, your input is appreciated. Please follow the existing coding conventions and submit your changes via Pull Request along with any relevant documentation or tests.

---

## 📄 License

This project is licensed under the MIT License.  
© Bloxxy

---

## 🛑 Example Blocked Extensions

These are examples of file extensions considered unsafe or non-media-related and are typically flagged by Sanitarr:

```
exe com bat cmd js vbs ps1 sh py php pl rb jar class scr hta msi msp msu pif vb vba ws wsf wsh xll
docm dotm xlsm xltm pptm potm ppsm sldm thmx xlam ppam docb dotb xltb
iso dmg elf vhd vhdx vmdk ova img cue nrg udf wim
pb savedmodel h5 ckpt meta index data-00000-of-00001 vocab config model pt
tgz bz2 xz izma ace arc cab izh pea sit sitx sqx zoo
pak upk bsa dat
url iqylink deamon nzbs nzb.gz nzb.bz2 zipx arj unknown
```