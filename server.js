// 1. Importando as ferramentas
const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const fs = require('fs'); // Módulo para lidar com arquivos

// 2. Configurando o servidor
const app = express();
app.use(cors()); // Habilita o CORS para todas as rotas
app.use(express.json()); // Permite que o servidor entenda JSON

const DB_FILE = './db.json'; // Nosso "banco de dados" em arquivo

// Função para ler o banco de dados
const readDB = () => {
    if (!fs.existsSync(DB_FILE)) {
        return { users: [] };
    }
    const data = fs.readFileSync(DB_FILE);
    return JSON.parse(data);
};

// Função para escrever no banco de dados
const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// 3. Criando as Rotas (os "endpoints")

// Rota de Cadastro
app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    const db = readDB();

    // Verifica se o usuário já existe
    const userExists = db.users.find(user => user.email === email);
    if (userExists) {
        return res.status(400).json({ message: 'Este e-mail já está cadastrado.' });
    }

    // Criptografa a senha antes de salvar
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Cria o novo usuário
    const newUser = { id: Date.now(), name, email, password: hashedPassword };
    db.users.push(newUser);
    writeDB(db);

    console.log('Novo usuário cadastrado:', newUser.email);
    res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
});

// Rota de Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const db = readDB();

    // Encontra o usuário pelo e-mail
    const user = db.users.find(user => user.email === email);
    if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // Compara a senha enviada com a senha criptografada no banco
    const isPasswordCorrect = bcrypt.compareSync(password, user.password);
    if (!isPasswordCorrect) {
        return res.status(401).json({ message: 'Senha incorreta.' });
    }

    console.log('Usuário logado:', user.email);
    // Em um app real, aqui retornaríamos um token (JWT). Por simplicidade, vamos apenas confirmar o sucesso.
    res.status(200).json({ message: 'Login realizado com sucesso!', user: { name: user.name, email: user.email } });
});

// 4. Iniciando o servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}. Acesse http://localhost:${PORT}`);
});