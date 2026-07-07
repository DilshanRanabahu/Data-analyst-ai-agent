import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Google Cloud & AI Settings
GCP_PROJECT_ID = os.getenv('GCP_PROJECT_ID', 'data-analyst-ai-d233d')
GCP_LOCATION = os.getenv('GCP_LOCATION', 'us-central1')
GOOGLE_APPLICATION_CREDENTIALS = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', 'credentials/firebase-admin-key.json')

# Google AI Studio Settings
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

# Model Settings
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-flash-lite-latest')
EMBEDDING_MODEL = os.getenv('EMBEDDING_MODEL', 'gemini-embedding-2')

# ChromaDB Configuration
CHROMADB_PERSIST_DIR = os.getenv('CHROMADB_PERSIST_DIR', './chromadb_data')

# Flask Configuration
FLASK_ENV = os.getenv('FLASK_ENV', 'development')
FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True'
PORT = int(os.getenv('PORT', 5000))

# Processing Configuration
MAX_CHUNK_SIZE = 1000  # Maximum rows per chunk for embedding
MAX_FILE_SIZE_MB = 50  # Maximum file size in MB
