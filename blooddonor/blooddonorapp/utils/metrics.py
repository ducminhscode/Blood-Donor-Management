from prometheus_client import Counter, Histogram, Gauge

RAG_QUERY_TOTAL = Counter(
    'rag_queries_total',
    'Tổng số query RAG',
    ['status', 'phase', 'model']
)

RAG_QUERY_LATENCY = Histogram(
    'rag_query_latency_seconds',
    'Tổng thời gian xử lý một query RAG',
    ['phase'],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0]
)

RAG_RETRIEVAL_LATENCY = Histogram(
    'rag_retrieval_latency_seconds',
    'Thời gian retrieval documents',
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0]
)

RAG_RETRIEVAL_DOC_COUNT = Histogram(
    'rag_retrieval_docs_count',
    'Số document retrieve được'
)

RAG_LLM_LATENCY = Histogram(
    'rag_llm_latency_seconds',
    'Thời gian gọi Fireworks LLM',
    ['phase'],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0]
)

RAG_TOKEN_USAGE = Counter(
    'rag_tokens_total',
    'Tổng số token sử dụng',
    ['token_type', 'phase']
)

RAG_EMPTY_RETRIEVAL = Counter(
    'rag_empty_retrieval_total',
    'Số lần không tìm được tài liệu'
)

RAG_RETRIEVAL_HAS_DOC = Counter(
    'rag_retrieval_has_doc_total',
    'Query có tìm được document hay không',
    ['has_doc']
)

RAG_REQUEST_IN_PROGRESS = Gauge(
    'rag_requests_in_progress',
    'Số request đang xử lý'
)

RAG_CONTEXT_LENGTH = Histogram(
    'rag_context_length_chars',
    'Độ dài context truyền vào LLM',
    buckets=[100, 500, 1000, 2000, 5000, 10000, 20000]
)