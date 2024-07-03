const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3000;

// Configuração do CORS
app.use(cors());
app.use(bodyParser.json());
app.use(express.json())

// Configuração do banco de dados
const db_config = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'yrpreyapi'
};

// Rota para pesquisar usuários
app.post('/01', (req, res) => {
    const { name, id } = req.body;

    if (!name || !id) {
        return res.status(400).json({ status: 'error', message: 'Name or id not provided in request' });
    }

    const connection = mysql.createConnection(db_config);

    connection.connect();

    connection.query('SELECT * FROM team WHERE nome LIKE ?', [`%${name}%`], (error, results) => {
        if (error) {
            connection.end();
            return res.status(500).json({ status: 'error', message: `Database error: ${error.message}` });
        }

        if (results.length > 0) {
            const users = results.map(row => ({
                name: row.nome,
                owner: id === row.user_id.toString() ? 'yes' : 'no',
                type: id === row.user_id.toString() ? 'no' : 'yes',
                message: `User found: ${id}`
            }));
            return res.json({ status: 'success', users });
        } else {
            return res.status(404).json({ status: 'error', message: `No users found with name: ${name}` });
        }

        connection.end();
    });
});

// Rota para login de usuário
app.post('/02', (req, res) => {
    const { username, password, token } = req.body;

    if (!username || !password || !token) {
        return res.status(400).json({ status: 'error', message: 'Name, password, or token not provided' });
    }

    const connection = mysql.createConnection(db_config);

    connection.connect();

    connection.query('SELECT * FROM `user` WHERE (username=? AND password=?) OR token=?', [username, password, token], (error, results) => {
        if (error) {
            connection.end();
            return res.status(500).json({ status: 'error', message: `Database error: ${error.message}` });
        }

        if (results.length === 0) {
            return res.json({ status: 'error', msg: 'Name not found' });
        }

        const { username: foundUsername, token: foundToken, role } = results[0];
        return res.json({ status: 200, username: foundUsername, token: foundToken, role, msg: 'Register found' });

        connection.end();
    });
});

// Rota para verificar usuário
app.post('/03', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ status: 'error', message: 'Name not provided' });
    }

    const connection = mysql.createConnection(db_config);

    connection.connect();

    connection.query('SELECT * FROM `user` WHERE username=? AND password=?', [username, password], (error, results) => {
        if (error) {
            connection.end();
            return res.status(500).json({ status: 'error', message: `Database error: ${error.message}` });
        }

        if (results.length === 0) {
            connection.query('SELECT * FROM `user` ORDER BY RAND() LIMIT 1', (randomError, randomResults) => {
                if (randomError) {
                    connection.end();
                    return res.status(500).json({ status: 'error', message: `Database error: ${randomError.message}` });
                }

                const { token: randomToken } = randomResults[0];
                return res.json({ status: 'error', token: randomToken, msg: 'Name not found' });

                connection.end();
            });
        } else {
            const { username: foundUsername, token: foundToken, role } = results[0];
            return res.json({ status: 200, username: foundUsername, token: foundToken, role, msg: 'Register found' });

            connection.end();
        }
    });
});

// Rota para obter imagens
app.get('/04', (req, res) => {
    const img = parseInt(req.query.img) || 1;

    const connection = mysql.createConnection(db_config);

    connection.connect();

    const images = [];

    connection.query('SELECT url FROM images', (error, results) => {
        if (error) {
            connection.end();
            return res.status(500).json({ error: `Database error: ${error.message}` });
        }

        for (let i = 0; i <= img; i++) {
            if (results[i]) {
                images.push(results[i].url);
            } else {
                images.push('http://localhost/img/logo.webp');
            }
        }

        return res.json(images);

        connection.end();
    });
});

// Rota para verificar usuário com token e role
app.post('/05', (req, res) => {
    const { token, role } = req.body;

    if (!token || !role) {
        return res.status(400).json({ status: 'error', message: 'Token or role not provided' });
    }

    const connection = mysql.createConnection(db_config);

    connection.connect();

    connection.query('SELECT * FROM user WHERE token LIKE ? OR role = ?', [`%${token}%`, role], (error, results) => {
        if (error) {
            connection.end();
            return res.status(500).json({ status: 'error', message: `Error: ${error.message}` });
        }

        if (results.length > 0) {
            const { username, role: foundRole, token } = results[0];
            return res.json({
                status: 'success',
                name: username,
                owner: foundRole,
                token,
                message: `User found: ${token}`
            });
        } else {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        connection.end();
    });
});

// Rota para validar URL
app.post('/06', async (req, res) => {
    const { validate } = req.body;

    if (!validate) {
        return res.status(400).json({ error: 'No validate key provided in the request' });
    }

    if (validate === 'localhost') {
        return res.json('200 OK');
    }

    try {
        const response = await axios.get(validate);
        const { data: result, headers } = response;

        return res.json({ result, headers });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Rota para pesquisar usuário pelo nome
app.post('/v2/08', (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ status: 'error', message: 'Name not provided' });
    }

    const connection = mysql.createConnection(db_config);

    connection.connect();

    connection.query('SELECT * FROM user WHERE username LIKE ?', [`%${name}%`], (error, results) => {
        if (error) {
            connection.end();
            return res.status(500).json({ status: 'error', message: `Error: ${error.message}` });
        }

        if (results.length > 0) {
            return res.json(results);
        } else {
            return res.status(404).json({ status: 'error', message: 'Name not found' });
        }

        connection.end();
    });
});

// Rota para pesquisar todos os usuários
app.post('/v1/08', (req, res) => {
    const connection = mysql.createConnection(db_config);

    connection.connect();

    connection.query('SELECT * FROM user', (error, results) => {
        if (error) {
            connection.end();
            return res.status(500).json({ status: 'error', message: `Error: ${error.message}` });
        }

        if (results.length > 0) {
            return res.json(results);
        } else {
            return res.status(404).json({ status: 'error', message: 'No users found' });
        }

        connection.end();
    });
});

// Rota para lidar com requisições de URL
    app.post('/07', async (req, res) => {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        try {
            const response = await axios.get(url, { timeout: 5000 });
            const { headers } = response;

            return res.json(headers);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });

    // Inicializa o servidor
    app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
