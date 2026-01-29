"""
Скрипт для отладки эндпоинта create_task прямым вызовом функции.
"""
import sys
import os
import asyncio
sys.path.insert(0, os.path.abspath("jarilo-ecosystem/brain/src"))

# Импортируем необходимые модули
from api.v1.endpoints import create_task
from api.v1.schemas import TaskCreate
from api.dependencies import get_state_manager, get_task_planner, get_task_executor

async def main():
    print("=" * 60)
    print("Тестирование эндпоинта create_task напрямую")
    print("=" * 60)

    try:
        print("\n[1] Создание объекта TaskCreate...")
        task_input = TaskCreate(prompt="Тестовая задача")
        print("✓ TaskCreate создан успешно")
        
        print("\n[2] Получение зависимостей...")
        state_manager = get_state_manager()
        print("✓ StateManager получен")
        
        task_planner = get_task_planner()
        print("✓ TaskPlanner получен")
        
        task_executor = get_task_executor()
        print("✓ TaskExecutor получен")
        
        print("\n[3] Вызов функции create_task...")
        result = await create_task(task_input, state_manager, task_planner, task_executor)
        print("✓ create_task выполнена успешно")
        
        print("\n[4] Результат:")
        print(result)
        
    except Exception as e:
        print(f"\n✗ Ошибка: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()

    print("\n" + "=" * 60)
    print("Отладка завершена")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
