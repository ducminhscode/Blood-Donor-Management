from blooddonorapp.models import RAGConfig

def get_active_rag_config():
    return RAGConfig.objects.filter(is_active=True).first()