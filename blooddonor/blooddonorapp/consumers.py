import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async

from blooddonorapp.models import Message, ChatSession
from blooddonorapp.utils.rag import RAGSystem
from blooddonorapp.utils.rag_monitoring import RAGMonitoringCallback

rag_system = RAGSystem()


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

        full_answer = []

        async def send_token(token):
            full_answer.append(token)

            await self.send(json.dumps({
                "type": "stream",
                "token": token
            }))

        def stream_callback(token):
            asyncio.create_task(send_token(token))

        callback = RAGMonitoringCallback(model=rag_system.OPENAI_MODEL)

        try:
            result = await sync_to_async(rag_system.qa_chain.invoke)(
                {
                    "question": question,
                    "chat_history": []
                },
                config={"callbacks": [callback]}
            )

            answer = result.get("answer", "")

        except Exception as e:
            print("RAG ERROR:", e)
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