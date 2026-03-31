from prometheus_client import Counter, Histogram

RAG_QUERY_TOTAL = Counter(
    'rag_queries_total',
    'Tổng số query RAG',
    ['status']
)

RAG_QUERY_LATENCY = Histogram(
    'rag_query_latency_seconds',
    'Thời gian xử lý một query RAG',
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0]
)

RAG_RETRIEVAL_LATENCY = Histogram(
    'rag_retrieval_latency_seconds',
    'Thời gian retrieval',
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0]
)

RAG_LLM_LATENCY = Histogram(
    'rag_llm_latency_seconds',
    'Thời gian gọi Fireworks LLM',
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0]
)

RAG_TOKEN_USAGE = Counter(
    'rag_tokens_total',
    'Tổng số token sử dụng',
    ['token_type']
)
