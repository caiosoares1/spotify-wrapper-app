import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config();
const app = express();
const port = 3000;

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;   

app.use(express.static(path.join(process.cwd(), "public")));

// 🔑 Passo 1: Login do usuário no Spotify
app.get("/login", (req, res) => {
  const scope = "user-read-email user-top-read playlist-read-private";
  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(
    scope
  )}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.redirect(authUrl);
});

// 🔑 Passo 2: Callback do Spotify
app.get("/callback", async (req, res) => {
  const code = req.query.code || null;

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        },
      }
    );

    const { access_token, refresh_token } = response.data;

  // Redireciona para a página principal passando o token na URL
  res.redirect(`/index.html?token=${access_token}`);
  } catch (error) {
    res.send("Erro na autenticação: " + error);
  }
});

// 🔎 Função auxiliar para chamadas à API
async function spotifyGet(endpoint, token) {
  const res = await axios.get(`https://api.spotify.com/v1/${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// 👤 Perfil do usuário
app.get("/me", async (req, res) => {
  const token = req.query.token;
  const data = await spotifyGet("me", token);
  res.json(data);
});

// 🎤 Top artistas
app.get("/top-artists", async (req, res) => {
  const token = req.query.token;
  const data = await spotifyGet("me/top/artists?limit=10", token);
  res.json(data);
});

// 🎵 Top músicas
app.get("/top-tracks", async (req, res) => {
  const token = req.query.token;
  const data = await spotifyGet("me/top/tracks?limit=10", token);
  res.json(data);
});

app.get("/profile", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "profile.html"));
});

app.listen(port, () => {
  console.log(`🚀 App rodando em http://localhost:${port}`);
});
