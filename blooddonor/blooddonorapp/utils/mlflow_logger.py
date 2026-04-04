import mlflow
import time


class MLflowLogger:
    def __init__(self, config):
        self.config = config
        self.run = None

        mlflow.set_tracking_uri("http://localhost:5000")
        mlflow.set_experiment("RAG Experiments")
        mlflow.langchain.autolog()

    def start_run(self, query):
        if mlflow.active_run():
            mlflow.end_run()
        self.run = mlflow.start_run()

        mlflow.log_param("embedding_model", self.config.embedding_model)
        mlflow.log_param("llm_model", self.config.llm_model)
        mlflow.log_param("chunk_size", self.config.chunk_size)
        mlflow.log_param("chunk_overlap", self.config.chunk_overlap)
        mlflow.log_param("top_k", self.config.top_k)
        mlflow.log_param("version", self.config.version)
        mlflow.log_param("query", query[:200])

        self.start_time = time.time()

    def log_retrieval(self, doc_count, duration):
        mlflow.log_metric("retrieval_doc_count", doc_count)
        mlflow.log_metric("retrieval_latency", duration)

    def log_llm(self, input_tokens, output_tokens, duration):
        mlflow.log_metric("input_tokens", input_tokens)
        mlflow.log_metric("output_tokens", output_tokens)
        mlflow.log_metric("llm_latency", duration)

    def end_run(self, total_duration, status="success"):
        mlflow.log_metric("total_latency", total_duration)
        mlflow.log_param("status", status)

        mlflow.end_run()