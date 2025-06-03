from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
import fitz
import os
#Imaginando que o diretório 'TCC_MENTOR' está em na Área de Trabalho
arquivo = open("../../Documents/chave.txt", "r")

os.environ['GOOGLE_API_KEY'] = arquivo.read()

from google import genai
from google.genai import types

app = FastAPI()

client = genai.Client()
modelo = 'gemini-2.0-flash'

chat_config = types.GenerateContentConfig(
    system_instruction = '''Voce é um assistente na criação de TCC para alunos, e apenas
    analisa se a resposta do professor foi uma resposta foi positiva, negativa ou neutra,
    explicando o porquê sucintamente e como resolver o problema, caso haja. Nao use marcadores de formatação.''',
)
chat = client.chats.create(model=modelo, config=chat_config)

chatPDF_config = types.GenerateContentConfig(
    system_instruction = '''Voce é um assistente na criação de TCC para alunos, e irá
    analisar um PDF tendo base que será algo para ajudar em um projeto.
    Nao use marcadores de formatação.''',
)
chatPDF = client.chats.create(model=modelo, config=chatPDF_config)

chatbox_config = types.GenerateContentConfig(
    system_instruction = '''
        Seu nome é Tessy. Você irá se apresentar, sem dizer prazer em te conhecer.
        Você é uma IA que auxilia alunos no desenvolvimento de seu TCC.
        Seu tom de voz é amigável mas suas respostas não são extensas.
        Você é proativa e sempre busca ajudar o aluno.
        NÃO USE Markdown e símbolos de formatação. Responda apenas com texto puro.
    ''',
    )
chatChatbox = client.chats.create(model=modelo, config=chatbox_config)
    
chatResumo_config = types.GenerateContentConfig(
    system_instruction = '''
        Você é um assistente que resume as mensagens da IA chamada Tessy de forma
        objetiva, contínua e direta. Seu objetivo é manter um resumo contínuo da
        conversa entre Tessy e o aluno, focando nas decisões, sugestões e próximos
        passos discutidos durante o desenvolvimento do TCC. Cada nova entrada deve
        considerar o que já foi discutido anteriormente, mantendo coerência com os
        resumos anteriores e evitando repetições desnecessárias. Evite frases como
        "Tessy perguntou..." ou "Tessy disse...", a menos que sejam essenciais para
        o contexto. Não use formatação ou floreios. Seja claro, conciso e direto.
    ''',
)
chatResumo = client.chats.create(model=modelo, config=chatResumo_config)


class Comentario(BaseModel):
    conteudo: str

class ChatBox(BaseModel):
    loggedin: bool
    conteudo: str
    resumo: str
    

@app.post("/analisar")
def analisar_comentario(comentario: Comentario):
    prompt = comentario.conteudo.lower()
    response = chat.send_message(prompt)
    
    return{"resposta": response.text}


@app.post("/analisarPDF")
async def analisar_pdf(file: UploadFile = File(...)):
    conteudo = ""
    pdf_bytes = await file.read()
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for pagina in doc:
            conteudo += pagina.get_text()

    response = chatPDF.send_message(conteudo[:3000])

    return {"resposta": response.text}


@app.post("/chatbox")
def chatbox(msg: ChatBox):
    while msg.loggedin == True or msg.conteudo.lower() == 'reiniciar':
        prompt = msg.conteudo.lower()
        promptContextualizado = f"Resumo da conversa:\n{msg.resumo}\n\nNova mensagem do usuário:\n{prompt}"
        response = chatChatbox.send_message(promptContextualizado)
        resumoCompleto = chatResumo.send_message(f'{msg.resumo}\n{response}')
    
        return{"resposta": response.text, "resumo": resumoCompleto.text}
