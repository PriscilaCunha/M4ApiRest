const express = require('express');
const app = express();
const fs = require('fs/promises');
const jwt = require('jsonwebtoken');

app.use(express.json());

const secret = 'secret_123';

app.use((req, res, next) => {
    try {
        // Permite acesso à rota /auth sem a necessidade do token
        if (req.originalUrl == '/auth') {
            return next()
        }
        
        // Pega o token de autorização do cabeçalho
        const {headers} = req;
        const authorization = headers.authorization ? headers.authorization.replace('Bearer', '').trim() : '';
        // Verifica se o token é válido, foi assinado corretamente e não expirou
        jwt.verify(authorization, secret, {algorithm: 'HS256'});
        return next;
        
    } catch (error) {
        return res.status(401).json({message: 'Token inváido!'})
    }
});

app.post('/auth', async (req, res) => {
    const file = JSON.parse( await fs.readFile('./users.json', 'utf-8') );
    // Verifica no arquivo se usuario existe
    const [userExist] = file.filter((users) => users.user == req.body.user && users.password == req.body.password);

    // Caso não exista, mostra erro
    if (!userExist) {
        return res.status(404).json({message: `Invalid User!`});
    }
    
    // Caso exista, extrai usuario, gera e retorna token
    const {user} = userExist;
    const token = jwt.sign({user}, secret, {algorithm: 'HS256', expiresIn: '1h'});
    res.status(200).json({ token });
});

app.get('/', (req, res) => {
    res.send('ok');
});

app.get('/users', async (req, res) => {
    const file = JSON.parse( await fs.readFile('./users.json', 'utf-8') );

    res.status(200).json(file);
});

app.get('/users/:id', async (req, res) => {
    const file = JSON.parse( await fs.readFile('./users.json', 'utf-8') );
    const user = file.filter((users) => users.id == req.params.id)

    res.status(200).json(user);
});

app.post('/users', async (req, res) => {
    const file = JSON.parse( await fs.readFile('./users.json', 'utf-8') );

    let id = 1;

    if (file.length > 0) {
        id = file[file.length - 1].id + 1;
    }

    file.push({id, ...req.body});

    await fs.writeFile('./users.json', JSON.stringify(file));

    res.status(200).json(req.body);
});

app.put('/users/:id', async (req, res) => {
    const file = JSON.parse( await fs.readFile('./users.json', 'utf-8') );

    for (let i = 0; i < file.length; i++) {
        if (file[i].id == req.params.id) {
            file[i] = {
                id: file[i].id,
                ...req.body
            }
        }
    }

    await fs.writeFile('./users.json', JSON.stringify(file));

    res.status(200).json(req.body);
});

app.delete('/users/:id', async (req, res) => {
    const file = JSON.parse( await fs.readFile('./users.json', 'utf-8') );

    for (let i = 0; i < file.length; i++) {
        if (file[i].id == req.params.id) {
            file.splice(i, 1)
        }
    }

    await fs.writeFile('./users.json', JSON.stringify(file));

    res.status(200).json(req.body);
});

app.listen(3000, () => console.log(`Iniciou...`));

module.exports = app;