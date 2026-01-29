# test_network.py
import uvicorn
from fastapi import FastAPI
import logging

# Настроим базовый логгер, чтобы видеть, что происходит
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

log.info("Создание экземпляра FastAPI...")
app = FastAPI()
log.info("Экземпляр FastAPI создан.")

@app.get("/")
def read_root():
    log.info("Получен запрос на /")
    return {"Hello": "World"}

if __name__ == "__main__":
    log.info("Запуск минимального тестового сервера на http://127.0.0.1:8000" )
    # Используем reload=True, это иногда меняет поведение uvicorn
    uvicorn.run("test_network:app", host="127.0.0.1", port=8000, reload=False)
