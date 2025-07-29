const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let users = []; 

// --- ROTAS ---

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = users.find(user => user.email === email);
        if (userExists) {
            return res.status(400).json({ message: 'Este e-mail já está cadastrado.' });
        }
        
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);
        
        const newUser = { 
            id: Date.now(),
            name, 
            email, 
            password: hashedPassword,
            garden: null,
            // --- MUDANÇA AQUI ---
            coins: 0 // Todo novo jogador começa com 0 moedas
        };
        users.push(newUser);

        console.log('Novo usuário cadastrado com moedas:', newUser.email);
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });

    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ message: 'Erro no servidor durante o registro.' });
    }
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    try {
        const user = users.find(user => user.email === email);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const isPasswordCorrect = bcrypt.compareSync(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Senha incorreta.' });
        }

        console.log('Usuário logado:', user.email);
        // Não enviamos a senha de volta para o front-end por segurança
        const userToReturn = {
            name: user.name,
            email: user.email
        };
        res.status(200).json({ message: 'Login realizado com sucesso!', user: userToReturn });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro no servidor durante o login.' });
    }
});

// --- MUDANÇA AQUI ---
// Unificamos as rotas de salvar/carregar para lidar com todos os dados do jogador
app.post('/player-data', (req, res) => {
    const { email, data } = req.body; // 'data' agora contém { garden, coins }
    try {
        const user = users.find(u => u.email === email);
        if (user) {
            user.garden = data.garden;
            user.coins = data.coins;
            console.log(`Dados salvos para ${email}: ${data.coins} moedas.`);
            res.status(200).json({ message: 'Dados salvos com sucesso!' });
        } else {
            res.status(404).json({ message: 'Usuário não encontrado para salvar os dados.' });
        }
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        res.status(500).json({ message: 'Erro ao salvar os dados.' });
    }
});

app.get('/player-data', (req, res) => {
    const { email } = req.query;
    try {
        const user = users.find(u => u.email === email);
        if (user) {
            console.log(`Dados carregados para ${email}: ${user.coins} moedas.`);
            res.status(200).json({ 
                garden: user.garden, 
                coins: user.coins 
            });
        } else {
            res.status(404).json({ message: 'Usuário não encontrado.' });
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        res.status(500).json({ message: 'Erro ao carregar os dados.' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}.`);
});