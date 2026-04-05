import time
import logging
from langchain_core.callbacks import BaseCallbackHandler
from blooddonorapp.utils.mlflow_logger import MLflowLogger

from blooddonorapp.utils.metrics import (
    RAG_QUERY_TOTAL,
    RAG_QUERY_LATENCY,
    RAG_RETRIEVAL_LATENCY,
    RAG_LLM_LATENCY,
    RAG_TOKEN_USAGE,
    RAG_RETRIEVAL_DOC_COUNT,
    RAG_EMPTY_RETRIEVAL,
    RAG_RETRIEVAL_HAS_DOC,
    RAG_REQUEST_IN_PROGRESS,
    RAG_CONTEXT_LENGTH,
)

logger = logging.getLogger(__name__)


class RAGMonitoringCallback(BaseCallbackHandler):
    def __init__(self, model="unknown", config=None, session_id=None, chat_history=None):
        self.start_time = None
        self.retrieval_start_time = None
        self.llm_start_time = None
        self.retrieved_documents = []
        self.current_query = ""
        self.retrieval_duration = 0.0

        self.model = model
        self.phase = "unknown"
        self.config = config
        self.mlflow = MLflowLogger(config) if config else None
        self.mlflow_run_started = False
        self.session_id = session_id
        self.chat_history = chat_history or []

    def on_chain_start(self, serialized, inputs, **kwargs):
        self.start_time = time.time()
        self.current_query = inputs.get("question", "")[:200]

        RAG_REQUEST_IN_PROGRESS.inc()

        if "context" in inputs:
            self.phase = "qa"
            context = inputs.get("context", "")
            context_len = 0
            if isinstance(context, str):
                context_len = len(context)
                RAG_CONTEXT_LENGTH.observe(context_len)
            logger.info(f"Context Length: {context_len}")

        else:
            self.phase = "condense"

        if self.mlflow and not self.mlflow_run_started:
            self.mlflow.start_run(self.current_query, session_id=self.session_id, chat_history=self.chat_history)
            self.mlflow_run_started = True

    def on_retriever_start(self, serialized, query, **kwargs):
        self.retrieval_start_time = time.time()

    def on_retriever_end(self, documents, **kwargs):
        self.retrieval_duration = time.time() - self.retrieval_start_time
        self.retrieved_documents = documents
        doc_count = len(documents)
        RAG_RETRIEVAL_DOC_COUNT.observe(doc_count)

        if doc_count == 0:
            RAG_EMPTY_RETRIEVAL.inc()

        RAG_RETRIEVAL_HAS_DOC.labels(
            has_doc='Đã tìm thấy document' if doc_count > 0 else 'Không tìm thấy document').inc()

        if self.mlflow:
            self.mlflow.log_retrieval(doc_count, self.retrieval_duration)

        logger.info(f"[Retrieval] Documents: {doc_count} | "
                    f"Duration: {self.retrieval_duration:.3f}s | "
                    f"Status: {'FOUND' if doc_count > 0 else 'EMPTY'}")

    def on_llm_start(self, serialized, prompts, **kwargs):
        self.llm_start_time = time.time()

    def on_llm_end(self, response, **kwargs):
        llm_duration = time.time() - self.llm_start_time
        total_duration = time.time() - self.start_time
        input_tokens = output_tokens = 0

        try:
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                usage = response.usage_metadata
                input_tokens = usage.get('input_tokens') or usage.get('prompt_tokens', 0)
                output_tokens = usage.get('output_tokens') or usage.get('completion_tokens', 0)

            elif hasattr(response, 'llm_output') and response.llm_output:
                token_usage = response.llm_output.get("token_usage", {}) or {}
                input_tokens = token_usage.get('prompt_tokens', 0)
                output_tokens = token_usage.get('completion_tokens', 0)
        except Exception as e:
            logger.warning(f"Không lấy được token usage: {e}")

        logger.info(
            f"[RAG] Hoàn thành | Total process query: {total_duration:.2f}s | Retrieval time: {self.retrieval_duration:.3f}s | "
            f"Call LLM: {llm_duration:.2f}s | Tokens Usage: {input_tokens} in / {output_tokens} out")

        RAG_QUERY_TOTAL.labels(
            status='success',
            phase=self.phase,
            model=self.model
        ).inc()

        RAG_QUERY_LATENCY.labels(self.phase).observe(total_duration)
        RAG_RETRIEVAL_LATENCY.observe(self.retrieval_duration)
        RAG_LLM_LATENCY.labels(self.phase).observe(llm_duration)

        RAG_TOKEN_USAGE.labels('input', self.phase).inc(input_tokens)
        RAG_TOKEN_USAGE.labels('output', self.phase).inc(output_tokens)
        RAG_REQUEST_IN_PROGRESS.dec()

        if self.mlflow and self.mlflow_run_started:
            self.mlflow.log_llm(input_tokens, output_tokens, llm_duration)
            self.mlflow.end_run(total_duration, status="success")
            self.mlflow_run_started = False

    def on_chain_error(self, error, **kwargs):
        total_duration = time.time() - (self.start_time or time.time())
        logger.error(f"[RAG] Query lỗi: {error}", exc_info=True)
        RAG_QUERY_TOTAL.labels(
            status='failed',
            phase=self.phase,
            model=self.model
        ).inc()
        RAG_QUERY_LATENCY.labels(self.phase).observe(total_duration)
        RAG_REQUEST_IN_PROGRESS.dec()

        if self.mlflow and self.mlflow_run_started:
            self.mlflow.end_run(total_duration, status="failed")
            self.mlflow_run_started = False

    def on_retriever_error(self, error, **kwargs):
        logger.error(f"[Retrieval] Lỗi: {error}")

    def on_llm_error(self, error, **kwargs):
        logger.error(f"[LLM] Lỗi: {error}")
