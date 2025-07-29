const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let users = []; 

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
            coins: 0,
            // --- MUDANÇA AQUI ---
            inventory: { pots: ['default'] }, // Inventário inicial
            equipped: { pot: 'default' }     // Item equipado
        };
        users.push(newUser);

        console.log('Novo usuário cadastrado:', newUser.email);
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });

    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor durante o registro.' });
    }
});

app.post('/login', (req, res) => {
    // ... esta função não precisa de mudanças ...
    const { email, password } = req.body;
    try {
        const user = users.find(user => user.email === email);
        if (!user) { return res.status(404).json({ message: 'Usuário não encontrado.' }); }
        const isPasswordCorrect = bcrypt.compareSync(password, user.password);
        if (!isPasswordCorrect) { return res.status(401).json({ message: 'Senha incorreta.' });}
        console.log('Usuário logado:', user.email);
        const userToReturn = { name: user.name, email: user.email };
        res.status(200).json({ message: 'Login realizado com sucesso!', user: userToReturn });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor durante o login.' });
    }
});

app.post('/player-data', (req, res) => {
    const { email, data } = req.body;
    try {
        const user = users.find(u => u.email === email);
        if (user) {
            user.garden = data.garden;
            user.coins = data.coins;
            // --- MUDANÇA AQUI ---
            user.inventory = data.inventory; // Salva o inventário
            user.equipped = data.equipped;   // Salva os itens equipados
            console.log(`Dados salvos para ${email}: ${data.coins} moedas.`);
            res.status(200).json({ message: 'Dados salvos com sucesso!' });
        } else {
            res.status(404).json({ message: 'Usuário não encontrado.' });
        }
    } catch (error) {
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
                coins: user.coins,
                // --- MUDANÇA AQUI ---
                inventory: user.inventory, // Carrega o inventário
                equipped: user.equipped     // Carrega os itens equipados
            });
        } else {
            res.status(404).json({ message: 'Usuário não encontrado.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro ao carregar os dados.' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}.`);
});