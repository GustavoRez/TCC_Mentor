---

# 📦 TCC MENTOR

TCC MENTOR é um auxiliador na criação de TCC's. Ele conta com uma Inteligência Artificial que auxilia o aluno a compreender os feedbacks do orientador, além de um chatbox com uma IA que também o auxiliará.

---

## 🚀 Tecnologias Usadas

* **Linguagens:** Node.js / Python / HTML
* **Frameworks:** Express / EJS
* **Bibliotecas:** Axios / Multer / Form-data / Express-session / MySQL
* **Banco de Dados:** MySQL
* **Outras ferramentas:** XAMPP

---

## 📂 Estrutura do Projeto

```bash
TCC_MENTOR/
├── images/
│   └── favicon.png
├── node_modules/
├── public/
│   └── uploads/
├── views/
│   ├── __pycache__/
│   ├── adicionarProjeto.ejs
│   ├── cadastro.html
│   ├── home.ejs
│   ├── login.html
│   ├── not_logged.html
│   ├── projeto.ejs
│   └── tela_inicial.html
├── app.js
├── database.js
├── main.py
├── package.json
├── package-lock.json
└── vercel.json
```

---

## 📄 Como Rodar o Projeto

### 1. Clone o repositório

```bash
git clone https://github.com/GustavoRez/TCC_Mentor
```

### 2. Pegue uma API Key do Gemini (Google AI)

Acesse: https://aistudio.google.com/app/apikey

Faça login com sua conta Google.

Clique em "+ Criar chave de API".

Copie a chave gerada e a guarde em um bloco de notas chamado "chave.txt" nos seus Documentos.

### 3. Instale as dependências

Com npm:

```bash
npm install node axios ejs express express-session form-data multer mysql
```

Ou com yarn:

```bash
yarn add node axios ejs express express-session form-data multer mysql
```

E também com pip
```bash
pip install fastapi google-genai PyMuPDF pydantic uvicorn python-multipart
```

### 4. Rode o projeto

No terminal, rode o backend Node.js:

```bash
node app.js
```

Em outro terminal, rode o backend Python com Uvicorn:

```bash
python -m uvicorn main:app --reload
```

> **Obs:** Se o seu `main.py` estiver dentro da pasta `views`, rode:

```bash
python -m uvicorn views.main:app --reload
```

---

## 🧪 Testes

Abra seu navegador e acesse:

```
http://localhost:3000
```

---
