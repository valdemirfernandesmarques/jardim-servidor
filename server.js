const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONEXÃO COM O BANCO DE DADOS MONGO DB ---
const dbURI = process.env.DATABASE_URL;

mongoose.connect(dbURI)
    .then(() => console.log('Conectado ao MongoDB com sucesso!'))
    .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

// --- MODELO DO USUÁRIO ---
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    garden: { type: Object }
});
const User = mongoose.model('User', userSchema);

// --- ROTAS ---

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Este e-mail já está cadastrado.' });
        }
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        console.log('Novo usuário cadastrado:', newUser.email);
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ message: 'Erro no servidor durante o registro.', error });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
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
        res.status(500).json({ message: 'Erro no servidor durante o login.', error });
    }
});

app.post('/save-game', async (req, res) => {
    const { email, gameState } = req.body;
    try {
        await User.updateOne({ email: email }, { $set: { garden: gameState } });
        console.log(`Jogo salvo para ${email}`);
        res.status(200).json({ message: 'Jogo salvo com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar:', error);
        res.status(500).json({ message: 'Erro ao salvar o jogo.', error });
    }
});

app.get('/load-game', async (req, res) => {
    const { email } = req.query;
    try {
        const user = await User.findOne({ email: email });
        if (user && user.garden) {
            console.log(`Jogo carregado para ${email}`);
            res.status(200).json({ garden: user.garden });
        } else {
            res.status(200).json({ garden: null });
        }
    } catch (error) {
        console.error('Erro ao carregar:', error);
        res.status(500).json({ message: 'Erro ao carregar o jogo.', error });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}.`);
});