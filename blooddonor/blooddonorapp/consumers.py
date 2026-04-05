import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async

from blooddonorapp.models import Message, ChatSession, RAGConfig
from blooddonorapp.utils.rag import RAGSystem
from blooddonorapp.utils.rag_monitoring import RAGMonitoringCallback


def get_active_config():
    return RAGConfig.objects.filter(is_active=True).first()


RAG_CACHE = {}


def get_rag_system(config):
    key = config.version
    if key not in RAG_CACHE:
        RAG_CACHE[key] = RAGSystem(config)
    return RAG_CACHE[key]


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.session_id = self.scope["url_route"]["kwargs"]["session_id"]
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        data = json.loads(text_data)
        question = data.get("text", "").strip()

        if not question:
            return

        try:
            chat_session = await sync_to_async(ChatSession.objects.get)(
                session_code=self.session_id
            )
        except ChatSession.DoesNotExist:
            await self.send(json.dumps({
                "type": "error",
                "message": "Session not found"
            }))
            return

        await sync_to_async(Message.objects.create)(
            sender="human",
            text=question,
            chat_session=chat_session
        )

        config = await sync_to_async(get_active_config)()

        if not config:
            await self.send(json.dumps({
                "type": "error",
                "message": "No active RAG config"
            }))
            return

        messages = await sync_to_async(list)(Message.objects.filter(chat_session=chat_session).order_by("-created_at"))
        messages = messages[1:]
        messages = messages[:10]
        messages.reverse()

        chat_history = []
        for i in range(0, len(messages) - 1, 2):
            if messages[i].sender == "human" and messages[i + 1].sender == "ai":
                chat_history.append((messages[i].text, messages[i + 1].text))

        rag_system = await sync_to_async(get_rag_system)(config)

        callback = RAGMonitoringCallback(
            model=config.llm_model,
            config=config,
            session_id=self.session_id,
            chat_history=chat_history
        )

        full_answer = []

        async def send_token(token):
            full_answer.append(token)
            await self.send(json.dumps({
                "type": "stream",
                "token": token
            }))

        def stream_callback(token):
            asyncio.create_task(send_token(token))

        try:
            result = await sync_to_async(rag_system.qa_chain.invoke)(
                {
                    "question": question,
                    "chat_history": chat_history
                },
                config={"callbacks": [callback]}
            )

            answer = result.get("answer", "")

        except Exception as e:
            import traceback
            traceback.print_exc()
            answer = "Xin lỗi, hệ thống đang gặp sự cố."

        await sync_to_async(Message.objects.create)(
            sender="ai",
            text=answer,
            chat_session=chat_session
        )

        await self.send(json.dumps({
            "type": "done",
            "answer": answer
        }, ensure_ascii=False))
