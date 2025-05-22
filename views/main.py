from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
import fitz
import os
#Imaginando que o diretório 'TCC_MENTOR' está em na Área de Trabalho
arquivo = open("../../../Documents/chave.txt", "r")

os.environ['GOOGLE_API_KEY'] = arquivo.read()

from google import genai
from google.genai import types

app = FastAPI()

client = genai.Client()
modelo = 'gemini-2.0-flash'
chat_config = types.GenerateContentConfig(
    system_instruction = '''Voce é um assistente na criação de TCC para alunos, e apenas
    analisa se a resposta do professor foi uma resposta foi positiva, negativa ou neutra,
    explicando o porquê sucintamente. Nao use marcadores de formatação.''',
)
chat = client.chats.create(model=modelo, config=chat_config)

chatPDF_config = types.GenerateContentConfig(
    system_instruction = '''Voce é um assistente na criação de TCC para alunos, e irá
    analisar um PDF tendo base que será algo para ajudar em um projeto.
    Nao use marcadores de formatação.''',
)
chatPDF = client.chats.create(model=modelo, config=chatPDF_config)

class Comentario(BaseModel):
    conteudo: str

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