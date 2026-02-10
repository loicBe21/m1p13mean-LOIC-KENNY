# Project Title

Backend du projet MEAN P13 Master 1 Kenny - loic , projet de gestion de centre commercial et de leur boutique et mise en place d'une platforme de vente accées au client front end Angular

## Technologies 

*   **Node.js**.
*   **Express.js**.
*   **MongoDB**.
*   **Mongoose**: An elegant MongoDB object modeling for Node.js.
*   **Autres Dependance**: List any other key libraries (`dotenv`, `jsonwebtoken` , `bcryptjs`).

## Getting Started

1.  **Clone  repository**:
    ```bash
    git clone tps://github.com/loicBe21/m1p13mean-LOIC-KENNY.git
    cd m1p13mean-LOIC-KENNY
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure environment variables**:
    Creer le  `.env` cette fichiers dans le repertoire et `.env.dev` pour le developpement  et `.env` pour le production :

    ```
    PORT=3000
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret_key
    ```
    *Replace `your_mongodb_connection_string` with your actual MongoDB connection string.*

### Running the Application

*   **Start the MongoDB server** (if running locally):
    ```bash
    mongodb
    ```
    (You may need to ensure the data directory `/data/db` exists with proper permissions).

*   **Start the Express server**:
    ```bash
    npm start 
    # or npm run dev si mode  development
    ```
    The API will be running at `http://localhost:PORT` (e.g., `http://localhost:3000`).


### Prerequisites

*   [Node.js](https://nodejs.org) installed (includes npm).
*   [MongoDB]
