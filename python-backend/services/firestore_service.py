
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import logging
import os

logger = logging.getLogger(__name__)

class FirestoreService:
    def __init__(self):
        """Initialize Firestore Service"""
        try:
            # Check if already initialized
            if not firebase_admin._apps:
                # Path is /app/credentials in docker, or ../credentials locally
                cred_path = os.environ.get('FIREBASE_CREDENTIALS_PATH', '/app/credentials/firebase-admin-key.json')
                if not os.path.exists(cred_path):
                    cred_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'credentials', 'firebase-admin-key.json')
                
                if os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred)
                    logger.info("Firebase Admin initialized successfully")
                else:
                    logger.warning(f"Firebase credentials not found at {cred_path}")
                    return

            self.db = firestore.client()
            self.sql_connections_ref = self.db.collection('sqlConnections')
            self.datasets_ref = self.db.collection('datasets')
            
        except Exception as e:
            logger.error(f"Error initializing Firestore: {str(e)}")
            self.db = None

    def get_connection(self, connection_id):
        """
        Get SQL connection details from Firestore
        
        Args:
            connection_id: Connection ID
            
        Returns:
            dict: Connection details or None
        """
        if not self.db:
            return None
            
        try:
            doc = self.sql_connections_ref.document(connection_id).get()
            
            if doc.exists:
                return doc.to_dict()
            else:
                return None
                
        except Exception as e:
            logger.error(f"Error fetching connection from Firestore: {str(e)}")
            return None

    def get_user_context(self, user_id):
        """
        Get all data sources for a user from Firestore
        
        Args:
            user_id: User identifier
            
        Returns:
            dict: { 'csvFiles': [...], 'sqlDatabases': [...] }
        """
        if not self.db:
            return {'csvFiles': [], 'sqlDatabases': []}
            
        try:
            # Fetch SQL Connections
            sql_docs = self.sql_connections_ref.where('userId', '==', user_id).stream()
            sql_databases = []
            for doc in sql_docs:
                data = doc.to_dict()
                # Format for context manager
                sql_databases.append({
                    'id': data.get('id'),
                    'name': data.get('name'),
                    'type': 'sql', # Orchestrator expects 'sql' but data has 'mysql'/'postgresql' in 'type' field usually? 
                    # Wait, context_manager registers type='mysql'. 
                    # Let's check what Orchestrator uses. 
                    # Orchestrator uses 'type': 'sql' to group them? No, sql_agent uses db_type.
                    # Let's keep data as is, but ensure shape is correct.
                    'db_type': data.get('type'), 
                    'metadata': {
                        'host': data.get('host'),
                        'database': data.get('database')
                    }
                })
            
            # Fetch Datasets (CSVs)
            csv_docs = self.datasets_ref.where('userId', '==', user_id).stream()
            csv_files = []
            for doc in csv_docs:
                data = doc.to_dict()
                csv_files.append({
                    'id': data.get('id'),
                    'name': data.get('fileName'),
                    'type': 'csv',
                    'metadata': {
                        'rowCount': data.get('rowCount'),
                        'columnCount': data.get('columnCount')
                    }
                })
                
            return {
                'csvFiles': csv_files,
                'sqlDatabases': sql_databases
            }
            
        except Exception as e:
            logger.error(f"Error fetching user context from Firestore: {str(e)}")
            return {'csvFiles': [], 'sqlDatabases': []}

# Global instance
firestore_service = FirestoreService()
