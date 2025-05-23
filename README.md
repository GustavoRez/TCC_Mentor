---

## 📦 TCC MENTOR

**TCC MENTOR** é um auxiliador na criação de TCCs. Ele conta com uma Inteligência Artificial que ajuda o aluno a compreender os feedbacks do orientador, além de um chatbox com IA pra tirar dúvidas.

---

## 🚀 Tecnologias Usadas

* **Linguagens:** Node.js / Python / HTML
* **Frameworks:** Express / EJS / FastAPI
* **Bibliotecas:** Axios / Multer / Form-data / Express-session / MySQL / PyMuPDF / Google GenAI
* **Banco de Dados:** MySQL
* **Outras ferramentas:** XAMPP / MySQL Workbench

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

## 💻 Pré-requisitos e Instalações

1. Instale o **VSCode**:
   👉 [Download](https://code.visualstudio.com/Download)
2. Instale o **Python 3.11** pela Microsoft Store.
3. Instale o **Node.js 22.16.0**:
   👉 [Download](https://nodejs.org/pt/download)
4. No VSCode, instale a extensão de Python.
5. Baixe o **XAMPP** (versão 8.2.12):
   👉 [Download](https://www.apachefriends.org/download.html)
6. Baixe o **MySQL Workbench** (instalação completa):
   👉 [Download](https://dev.mysql.com/downloads/file/?id=541637)

---

## 🔑 Configurar API Key do Gemini

1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Faça login com sua conta Google.
3. Clique em “Criar chave de API”.
4. Copie a chave gerada e salve em um arquivo chamado `chave.txt` dentro da pasta **Documentos** do seu usuário.

---

## 📥 Instalando as Dependências

### Com `npm`

```bash
npm install node axios ejs express express-session form-data multer mysql
```

### Com `yarn`

```bash
yarn add node axios ejs express express-session form-data multer mysql
```

### Com `pip`

```bash
pip install fastapi google-genai PyMuPDF pydantic uvicorn python-multipart
```

> ⚠️ Se estiver com problemas de permissão ao instalar pacotes, rode o PowerShell como administrador e execute:

```bash
Set-ExecutionPolicy RemoteSigned
# Depois pressione 'S' pra confirmar
```

---

## 🛠 Configurações do MySQL

1. Deixe o usuário root **sem senha**.
2. No **MySQL Workbench**, vá em `Server > Data Import`.
3. Importe os bancos de dados do projeto.

---

## ▶️ Rodando o Projeto

### 1. Rode o backend Node.js:

```bash
node app.js
```

### 2. Em outro terminal, rode o backend Python:

```bash
python -m uvicorn main:app --reload
```

> 🔁 Se o arquivo `main.py` estiver dentro de `views/`, use:

```bash
python -m uvicorn views.main:app --reload
```

---

## 🧪 Testes

Abra seu navegador e acesse:

```
http://localhost:3000
```

Se tudo tiver certinho, o sistema vai tá no ar ✨

---

## ⚠️ Dicas Extras

* Se você instalou o **Node.js** com o VSCode aberto, **reinicie o VSCode**.
* Rode primeiro o `import genai`, depois os demais.

---
