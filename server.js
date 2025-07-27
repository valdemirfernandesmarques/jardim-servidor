const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONEXÃO COM O BANCO DE DADOS (sem alterações) ---
const dbURI = process.env.DATABASE_URL;
mongoose.connect(dbURI)
    .then(() => console.log('Conectado ao MongoDB com sucesso!'))
    .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

// --- MODELO DO USUÁRIO (ATUALIZADO) ---
// 1. ATUALIZAÇÃO NO "RG" DO USUÁRIO: Adicionamos um campo 'garden' para guardar o estado do jogo.
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    garden: { type: Object } // Campo para salvar o gameState
});
const User = mongoose.model('User', userSchema);

// --- ROTAS DE AUTENTICAÇÃO (sem alterações) ---
app.post('/register', async (req, res) => { /* ...código de cadastro sem alterações... */ });
app.post('/login', async (req, res) => { /* ...código de login sem alterações... */ });


// --- NOVAS ROTAS PARA O JOGO ---

// 2. NOVA ROTA PARA SALVAR O JOGO
app.post('/save-game', async (req, res) => {
    const { email, gameState } = req.body;
    try {
        await User.updateOne({ email: email }, { $set: { garden: gameState } });
        console.log(`Jogo salvo para ${email}`);
        res.status(200).json({ message: 'Jogo salvo com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar o jogo.', error });
    }
});

// 3. NOVA ROTA PARA CARREGAR O JOGO
app.get('/load-game', async (req, res) => {
    const { email } = req.query; // Pega o email da URL (ex: /load-game?email=teste@gmail.com)
    try {
        const user = await User.findOne({ email: email });
        if (user && user.garden) {
            console.log(`Jogo carregado para ${email}`);
            res.status(200).json({ garden: user.garden });
        } else {
            // Se o usuário não tiver um jardim salvo, retorna nulo
            res.status(200).json({ garden: null });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro ao carregar o jogo.', error });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}.`);
});