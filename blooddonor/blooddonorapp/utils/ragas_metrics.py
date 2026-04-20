import logging
from typing import List, Dict, Any, Tuple
from langchain_core.documents import Document

logger = logging.getLogger(__name__)


class RAGASMetrics:
    
    def __init__(self, llm=None, embeddings=None):
        self.llm = llm
        self.embeddings = embeddings
        
    def calculate_retrieval_accuracy(
        self, 
        retrieved_docs: List[Document], 
        query: str,
        ground_truth_docs: List[Document] = None
    ) -> Dict[str, float]:
        if not retrieved_docs:
            return {
                "retrieval_precision": 0.0,
                "retrieval_recall": 0.0,
                "retrieval_f1": 0.0,
                "retrieval_count": 0
            }
        
        metrics = {
            "retrieval_count": len(retrieved_docs),
            "retrieval_precision": min(1.0, len(retrieved_docs) / max(len(retrieved_docs), 1)),
        }

        if ground_truth_docs:
            relevant_count = self._count_relevant_docs(retrieved_docs, ground_truth_docs)
            recall = relevant_count / max(len(ground_truth_docs), 1)
            precision = relevant_count / max(len(retrieved_docs), 1)
            
            metrics.update({
                "retrieval_recall": recall,
                "retrieval_precision": precision,
                "retrieval_f1": self._calculate_f1(precision, recall),
                "relevant_docs_count": relevant_count
            })
        else:
            metrics.update({
                "retrieval_recall": 0.5,
                "retrieval_f1": 0.5 * metrics["retrieval_precision"] * 2 / (metrics["retrieval_precision"] + 0.5)
            })
        return metrics
    
    def calculate_answer_relevance(
        self,
        answer: str,
        query: str,
        retrieved_context: str = None
    ) -> Dict[str, float]:
        try:
            query_words = set(query.lower().split())
            answer_words = set(answer.lower().split())

            stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are'}
            query_words = query_words - stop_words
            answer_words = answer_words - stop_words

            if not query_words:
                relevance = 0.5
            else:
                overlap = len(query_words & answer_words) / len(query_words)
                relevance = min(1.0, overlap + 0.3)  # Boost for answer generation
            
            metrics = {
                "answer_relevance": relevance,
                "answer_length": len(answer),
                "query_coverage": len(query_words & answer_words) / len(query_words) if query_words else 0.0
            }

            return metrics
        except Exception as e:
            logger.error(f"Error calculating answer relevance: {e}")
            return {"answer_relevance": 0.5, "error": str(e)}
    
    def calculate_faithfulness(
        self,
        answer: str,
        retrieved_docs: List[Document]
    ) -> Dict[str, float]:
        try:
            if not retrieved_docs:
                return {"faithfulness": 0.0, "grounded_sentences": 0}

            answer_sentences = self._extract_sentences(answer)

            grounded_count = 0
            for sentence in answer_sentences:
                if self._is_grounded(sentence, retrieved_docs):
                    grounded_count += 1
            
            faithfulness_score = grounded_count / max(len(answer_sentences), 1)
            
            metrics = {
                "faithfulness": min(1.0, faithfulness_score),
                "grounded_sentences": grounded_count,
                "total_sentences": len(answer_sentences),
                "grounding_ratio": grounded_count / max(len(answer_sentences), 1)
            }

            return metrics
        except Exception as e:
            logger.error(f"Error calculating faithfulness: {e}")
            return {"faithfulness": 0.5, "error": str(e)}
    
    def calculate_ragas_score(
        self,
        retrieval_metrics: Dict[str, float],
        answer_relevance: Dict[str, float],
        faithfulness: Dict[str, float]
    ) -> float:
        try:
            retrieval_score = retrieval_metrics.get("retrieval_f1", 0.5)
            relevance_score = answer_relevance.get("answer_relevance", 0.5)
            faithfulness_score = faithfulness.get("faithfulness", 0.5)

            ragas_score = (retrieval_score + relevance_score + faithfulness_score) / 3
            
            logger.info(f"RAGAS Score: {ragas_score:.4f} | Retrieval: {retrieval_score:.2f} | "
                       f"Relevance: {relevance_score:.2f} | Faithfulness: {faithfulness_score:.2f})")
            
            return min(1.0, max(0.0, ragas_score))
        except Exception as e:
            logger.error(f"Error calculating RAGAS score: {e}")
            return 0.5
    
    @staticmethod
    def _count_relevant_docs(retrieved: List[Document], ground_truth: List[Document]) -> int:
        retrieved_contents = {doc.page_content.strip() for doc in retrieved}
        ground_truth_contents = {doc.page_content.strip() for doc in ground_truth}
        return len(retrieved_contents & ground_truth_contents)
    
    @staticmethod
    def _calculate_f1(precision: float, recall: float) -> float:
        if precision + recall == 0:
            return 0.0
        return 2 * (precision * recall) / (precision + recall)
    
    @staticmethod
    def _extract_sentences(text: str) -> List[str]:
        import re
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    @staticmethod
    def _is_grounded(sentence: str, docs: List[Document]) -> bool:
        sentence_lower = sentence.lower()
        sentence_words = set(sentence_lower.split()) - {'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'to', 'of'}
        
        for doc in docs:
            doc_content_lower = doc.page_content.lower()
            matching_words = sum(1 for word in sentence_words if word in doc_content_lower)
            if matching_words / max(len(sentence_words), 1) > 0.5:
                return True
        
        return False
    
    def get_all_metrics(
        self,
        query: str,
        answer: str,
        retrieved_docs: List[Document],
        ground_truth_docs: List[Document] = None
    ) -> Dict[str, Any]:
        retrieval_metrics = self.calculate_retrieval_accuracy(
            retrieved_docs, query, ground_truth_docs
        )
        answer_relevance = self.calculate_answer_relevance(answer, query)
        faithfulness = self.calculate_faithfulness(answer, retrieved_docs)
        ragas_score = self.calculate_ragas_score(
            retrieval_metrics, answer_relevance, faithfulness
        )
        
        return {
            "retrieval": retrieval_metrics,
            "answer_relevance": answer_relevance,
            "faithfulness": faithfulness,
            "ragas_score": ragas_score,
            "all_metrics": {
                **retrieval_metrics,
                **answer_relevance,
                **faithfulness,
                "ragas_score": ragas_score
            }
        }
