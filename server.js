const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// <<< MUDANÇA: REMOVEMOS O MONGOOSE E A CONEXÃO COM O BANCO DE DADOS >>>
// Em vez disso, usaremos um array simples para guardar os usuários enquanto o servidor estiver rodando.
let users = []; 

// --- ROTAS ---

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    try {
        // Procura o usuário no nosso array em memória
        const userExists = users.find(user => user.email === email);
        if (userExists) {
            return res.status(400).json({ message: 'Este e-mail já está cadastrado.' });
        }
        
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);
        
        // Cria um novo usuário e o adiciona no array
        const newUser = { 
            id: Date.now(), // Um ID simples baseado no tempo
            name, 
            email, 
            password: hashedPassword,
            garden: null // O jardim começa vazio
        };
        users.push(newUser);

        console.log('Novo usuário cadastrado:', newUser.email);
        console.log('Total de usuários agora:', users.length);
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });

    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ message: 'Erro no servidor durante o registro.' });
    }
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    try {
        // Encontra o usuário no nosso array
        const user = users.find(user => user.email === email);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const isPasswordCorrect = bcrypt.compareSync(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Senha incorreta.' });
        }

        console.log('Usuário logado:', user.email);
        res.status(200).json({ message: 'Login realizado com sucesso!', user: { name: user.name, email: user.email } });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro no servidor durante o login.' });
    }
});

app.post('/save-game', (req, res) => {
    const { email, gameState } = req.body;
    try {
        // Encontra o usuário no array e atualiza seu jardim
        const user = users.find(u => u.email === email);
        if (user) {
            user.garden = gameState;
            console.log(`Jogo salvo para ${email}`);
            res.status(200).json({ message: 'Jogo salvo com sucesso!' });
        } else {
            res.status(404).json({ message: 'Usuário não encontrado para salvar o jogo.' });
        }
    } catch (error) {
        console.error('Erro ao salvar:', error);
        res.status(500).json({ message: 'Erro ao salvar o jogo.' });
    }
});

app.get('/load-game', (req, res) => {
    const { email } = req.query;
    try {
        // Encontra o usuário no array e retorna seu jardim
        const user = users.find(u => u.email === email);
        if (user && user.garden) {
            console.log(`Jogo carregado para ${email}`);
            res.status(200).json({ garden: user.garden });
        } else {
            // Se não houver jogo salvo, retorna nulo para o front-end criar um novo
            res.status(200).json({ garden: null });
        }
    } catch (error) {
        console.error('Erro ao carregar:', error);
        res.status(500).json({ message: 'Erro ao carregar o jogo.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}.`);
});