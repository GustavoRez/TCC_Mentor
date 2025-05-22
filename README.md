# 📦 TCC MENTOR

TCC MENTOR é um auxiliador na criação de TCC's. Ele conta com uma Inteligência Artificial
que auxilia o aluno a compreender os feedbacks do orientador, além de um chatbox com uma IA
que também o auxiliará.

---

## 🚀 Tecnologias Usadas

- [ ] Linguagem: Node.js / Python / HTML
- [ ] Frameworks: Express / Ejs
- [ ] Bibliotecas: Axios / Multer / Form-data / Express-session / MySQL
- [ ] Banco de Dados: MySQL
- [ ] Outras ferramentas: XAMPP

---

## 📂 Estrutura do Projeto

```bash
.
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
````

---

## 📄 Como rodar o projeto

1. Clone o repositório:

   ```bash
   git clone https://github.com/GustavoRez/TCC_Mentor
   ```

2. Instale as dependências:

   ```bash
   npm install axios ejs express express-session form-data multer mysql

   # ou
   yarn axios ejs express express-session form-data multer mysql

   ```

4. Rode o projeto:

   ```bash
   node app.js
   python -m uvicorn views.main:app --reload
   /views 
   ```

---

## 🧪 Testes

Para rodar os testes:

```bash
No seu navegador vá para http://localhost:3000
```
