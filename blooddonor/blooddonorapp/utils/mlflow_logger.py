import mlflow
import time


class MLflowLogger:
    def __init__(self, config):
        self.config = config
        self.run = None

        mlflow.set_tracking_uri("http://localhost:5000")
        mlflow.set_experiment("RAG Experiments")
        mlflow.langchain.autolog()

    def start_run(self, query, session_id=None, chat_history=None):
        if mlflow.active_run():
            mlflow.end_run()
        self.run = mlflow.start_run()

        if session_id:
            session_id = str(session_id)
            mlflow.log_param("Chat Session", session_id)
            mlflow.set_tag("Chat Session", session_id)

        if chat_history:
            mlflow.log_dict(
                [{"human": h, "ai": a} for h, a in chat_history],
                "chat_history.json"
            )

        mlflow.log_param("Embedding Model", self.config.embedding_model)
        mlflow.log_param("LLM Model", self.config.llm_model)
        mlflow.log_param("Chunk Size", self.config.chunk_size)
        mlflow.log_param("Chunk Overlap", self.config.chunk_overlap)
        mlflow.log_param("Top K", self.config.top_k)
        mlflow.log_param("Version", self.config.version)
        mlflow.log_param("Query", query[:200])

        self.start_time = time.time()

    def log_retrieval(self, doc_count, duration):
        mlflow.log_metric("Retrieval Document Count", doc_count)
        mlflow.log_metric("Retrieval Latency", duration)

    def log_llm(self, input_tokens, output_tokens, duration):
        mlflow.log_metric("Input Tokens", input_tokens)
        mlflow.log_metric("Output Tokens", output_tokens)
        mlflow.log_metric("LLM Latency", duration)

    def log_evaluation_metrics(self, metrics_dict):
        try:
            if "retrieval" in metrics_dict:
                retrieval = metrics_dict["retrieval"]
                mlflow.log_metric("Retrieval Document Count", retrieval.get("retrieval_count", 0))
                mlflow.log_metric("Retrieval Precision", retrieval.get("retrieval_precision", 0))
                mlflow.log_metric("Retrieval Recall", retrieval.get("retrieval_recall", 0))
                mlflow.log_metric("Retrieval F1", retrieval.get("retrieval_f1", 0))

            if "answer_relevance" in metrics_dict:
                relevance = metrics_dict["answer_relevance"]
                mlflow.log_metric("Answer Relevance", relevance.get("answer_relevance", 0))
                mlflow.log_metric("Query Coverage", relevance.get("query_coverage", 0))

            if "faithfulness" in metrics_dict:
                faith = metrics_dict["faithfulness"]
                mlflow.log_metric("Faithfulness", faith.get("faithfulness", 0))
                mlflow.log_metric("Grounding Ratio", faith.get("grounding_ratio", 0))

            if "ragas_score" in metrics_dict:
                mlflow.log_metric("RAGAS Score", metrics_dict["ragas_score"])

            if "all_metrics" in metrics_dict:
                mlflow.log_dict(metrics_dict["all_metrics"], "evaluation_metrics.json")
                
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error logging evaluation metrics: {e}")

    def end_run(self, total_duration, status="success"):
        mlflow.log_metric("Total Latency", total_duration)
        mlflow.log_param("Status", status)

        mlflow.end_run()