# from fastapi import FastAPI
# from pydantic import BaseModel
# from fastapi.middleware.cors import CORSMiddleware
# from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain_core.prompts import ChatPromptTemplate
# from langchain_core.output_parsers import StrOutputParser
# import os
# from dotenv import load_dotenv

# # Load environment variables
# load_dotenv()
# api_key = os.getenv("GOOGLE_API_KEY")
# if not api_key:
#     raise ValueError("❌ GOOGLE_API_KEY not found. Please check your .env file.")

# # Setup LangChain tracing (optional)
# os.environ["LANGCHAIN_TRACING_V2"] = "true"
# os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")

# # Initialize FastAPI app
# app = FastAPI()

# # Allow frontend (React) to call backend
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # you can restrict this to ["http://localhost:5173"] for security
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Define request body model
# class ChatRequest(BaseModel):
#     message: str

# # Define LangChain prompt
# prompt = ChatPromptTemplate.from_messages(
#     [
#         (
#             "system",
#             "You are a knowledgeable and empathetic medical assistant. "
#             "Always respond in a clear, structured format using bullet points. "
#             "Your answers must:\n"
#             "- Be concise, accurate, and medically relevant.\n"
#             "- Use clear section headers in bold (e.g., **Causes**, **Symptoms**, **Treatment**, **Prevention**).\n"
#             "- Under each section, list items as bullet points with short explanations.\n"
#             "- Ensure spacing and alignment are neat for easy readability.\n"
#             "- Avoid long paragraphs; focus on point-wise formatting.\n"
#             "If the question is about lifestyle or health habits, structure the response under:\n"
#             "• **What to avoid**\n"
#             "• **When to avoid**\n"
#             "• **Why to avoid**\n"
#             "Make the answer look like a well-formatted medical note."
#         ),
#         ("user", "Question: {question}"),
#     ]
# )



# # Setup Gemini model
# llm = ChatGoogleGenerativeAI(
#     model="gemini-2.5-flash",
#     temperature=0,
#     google_api_key=api_key,
# )

# output_parse = StrOutputParser()
# chain = prompt | llm | output_parse

# # API route for chatbot
# @app.post("/chat")
# async def chat(req: ChatRequest):
#     try:
#         response = chain.invoke({"question": req.message})
#         return {"reply": response}
#     except Exception as e:
#         return {"reply": f"⚠️ Error: {str(e)}"}


from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain.docstore.document import Document
import os
from dotenv import load_dotenv
import tempfile
from PyPDF2 import PdfReader

# ============ Load Environment Variables ============
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("❌ GOOGLE_API_KEY not found. Please check your .env file.")

os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")

# ============ Initialize FastAPI ============
app = FastAPI()

# Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to frontend URL for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ Request Models ============
class ChatRequest(BaseModel):
    message: str

# ============ General Medical Prompt ============
prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a knowledgeable and empathetic medical assistant. "
            "Always respond in a clear, structured format using bullet points. "
            "Your answers must:\n"
            "- Be concise, accurate, and medically relevant.\n"
            "- Use clear section headers in bold (e.g., **Causes**, **Symptoms**, **Treatment**, **Prevention**).\n"
            "- Under each section, list items as bullet points with short explanations.\n"
            "- Ensure spacing and alignment are neat for easy readability.\n"
            "- Avoid long paragraphs; focus on point-wise formatting.\n"
            "If the question is about lifestyle or health habits, structure the response under:\n"
            "• **What to avoid**\n"
            "• **When to avoid**\n"
            "• **Why to avoid**\n"
            "Make the answer look like a well-formatted medical note."
        ),
        ("user", "Question: {question}"),
    ]
)

# ============ LLM Setup ============
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    google_api_key=api_key,
)

output_parse = StrOutputParser()
chain = prompt | llm | output_parse

# ============ Embeddings + FAISS ============
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=api_key)
vectorstore = None  # Global store (in-memory for now)

# ============ Chat API ============
@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        response = chain.invoke({"question": req.message})
        return {"reply": response}
    except Exception as e:
        return {"reply": f"⚠️ Error: {str(e)}"}


# ============ Upload Document API ============
@app.post("/upload-doc")
async def upload_document(file: UploadFile = File(...)):
    global vectorstore

    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
            tmp_file.write(await file.read())
            tmp_path = tmp_file.name

        # Read file content
        file_content = ""
        if file.filename.endswith(".txt"):
            with open(tmp_path, "r", encoding="utf-8") as f:
                file_content = f.read()
        elif file.filename.endswith(".md"):
            with open(tmp_path, "r", encoding="utf-8") as f:
                file_content = f.read()
        elif file.filename.endswith(".pdf"):
            reader = PdfReader(tmp_path)
            file_content = " ".join([page.extract_text() for page in reader.pages if page.extract_text()])
        else:
            return {"error": "❌ Unsupported file format. Use .txt, .md, or .pdf"}

        # Split document into chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        docs = text_splitter.split_documents([Document(page_content=file_content)])

        # Create FAISS vectorstore
        vectorstore = FAISS.from_documents(docs, embeddings)

        return {"message": f"✅ Document '{file.filename}' uploaded and indexed successfully!"}

    except Exception as e:
        return {"error": f"⚠️ Error: {str(e)}"}


# ============ QnA API with Fallback ============
@app.post("/doc-qna")
async def document_qna(req: ChatRequest):
    global vectorstore
    if not vectorstore:
        return {"reply": "⚠️ No document uploaded yet. Please upload a document first."}

    try:
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
        docs = retriever.invoke(req.message)

        # If no relevant content → fallback to general medical assistant
        if not docs or all(len(d.page_content.strip()) == 0 for d in docs):
            response = chain.invoke({"question": req.message})
            return {"reply": response}

        qa_prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are a knowledgeable and empathetic medical assistant.\n"
                    "You have access to an uploaded medical document as well as general medical knowledge.\n"
                    "Rules:\n"
                    "- If the document contains relevant information, use it in your answer.\n"
                    "- If the document is not relevant, fall back to your general medical expertise.\n"
                    "- Always answer in structured bullet points with clear section headers.\n"
                    "\n"
                    "Here is the document context (if relevant):\n{context}"
                ),
                ("user", "{question}"),
            ]
        )

        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            retriever=retriever,
            chain_type="stuff",
            chain_type_kwargs={"prompt": qa_prompt}
        )

        result = qa_chain.invoke({"query": req.message})
        if isinstance(result, dict) and "result" in result:
            reply_text = result["result"]
        else:
            reply_text = str(result)

        return {"reply": reply_text}

    except Exception as e:
        return {"reply": f"⚠️ Error: {str(e)}"}
