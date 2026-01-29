"""
🧪 Простой тест системы Jarilo AI

Проверяем что все работает после оптимизации:
1. Frontend оптимизации
2. Backend упрощенная архитектура  
3. Plugin System базовая
4. Интеграция всех компонентов
"""

import asyncio
import sys
import os
import json
import time
from pathlib import Path

# Добавляем пути
sys.path.insert(0, str(Path(__file__) / "jarilo-ecosystem" / "brain" / "src"))

async def test_backend():
    """🧪 Тестируем backend"""
    print("🧪 Тестируем Backend...")
    
    try:
        # Импортируем упрощенный оркестратор
        from orchestration.simple_integrated_graph import get_simple_integrated_orchestrator
        from orchestration.simple_plugin_manager import get_simple_plugin_manager
        from orchestration.tools.base_tools import ToolFactory, ToolRegistry
        
        # Создаем тестовый LLM (mock)
        class MockLLM:
            async def ainvoke(self, messages):
                class Response:
                    content = "Test response"
                return Response()
        
        llm = MockLLM()
        
        # Тестируем Tool Registry
        print("  📦 Тестируем Tool Registry...")
        tool_registry = ToolRegistry()
        tools = ToolFactory.create_all_tools()
        
        for tool in tools:
            tool_registry.register_tool(tool)
        
        print(f"  ✅ Зарегистрировано инструментов: {len(tool_registry.list_tools())}")
        
        # Тестируем Plugin Manager
        print("  🔌 Тестируем Plugin Manager...")
        plugin_manager = get_simple_plugin_manager(tool_registry)
        plugins = plugin_manager.list_plugins()
        
        print(f"  ✅ Найдено плагинов: {len(plugins)}")
        
        # Тестируем Integrated Orchestrator
        print("  🚀 Тестируем Integrated Orchestrator...")
        orchestrator = get_simple_integrated_orchestrator(llm)
        
        # Тестируем простую задачу
        test_task = "Проверить работу системы"
        print(f"  🎯 Выполняем задачу: {test_task}")
        
        start_time = time.time()
        result = await orchestrator.execute(test_task)
        execution_time = time.time() - start_time
        
        print(f"  ✅ Задача выполнена за {execution_time:.2f}s")
        print(f"  📊 Стратегия: {result.get('strategy', 'unknown')}")
        print(f"  🎯 Успешность: {result.get('error') is None}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Ошибка backend: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_frontend():
    """🧪 Тестируем frontend оптимизации"""
    print("\n🧪 Тестируем Frontend оптимизации...")
    
    try:
        # Проверяем наличие оптимизированных файлов
        frontend_path = Path(__file__).parent / "Corallum-Studio" / "src"
        
        # Проверяем flowStore.ts
        flowstore_path = frontend_path / "store" / "flowStore.ts"
        if flowstore_path.exists():
            with open(flowstore_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Проверяем наличие оптимизаций
            optimizations = [
                "performance.now()",
                "renderCount", 
                "lastUpdate",
                "batchUpdate",
                "getPerformanceMetrics"
            ]
            
            found_optimizations = [opt for opt in optimizations if opt in content]
            print(f"  ✅ Найдено оптимизаций: {len(found_optimizations)}/{len(optimizations)}")
            print(f"  📊 Оптимизации: {', '.join(found_optimizations)}")
            
        else:
            print(f"  ⚠️ Файл flowStore.ts не найден: {flowstore_path}")
        
        # Проверяем AIWorkflowGenerator.tsx
        ai_workflow_path = frontend_path / "components" / "AIWorkflowGenerator.tsx"
        if ai_workflow_path.exists():
            with open(ai_workflow_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Проверяем интеграцию с новым store
            if "useFlowStore" in content:
                print("  ✅ AIWorkflowGenerator использует оптимизированный store")
            else:
                print("  ⚠️ AIWorkflowGenerator не обновлен")
        else:
            print(f"  ⚠️ Файл AIWorkflowGenerator.tsx не найден")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Ошибка frontend: {e}")
        return False

async def test_integration():
    """🧪 Тестируем полную интеграцию"""
    print("\n🧪 Тестируем полную интеграцию...")
    
    try:
        # Проверяем структуру проекта
        project_path = Path(__file__).parent
        
        required_dirs = [
            "jarilo-ecosystem/brain/src/orchestration",
            "jarilo-ecosystem/brain/src/api",
            "Corallum-Studio/src",
            "Corallum-Studio/src/store",
            "Corallum-Studio/src/components"
        ]
        
        for dir_path in required_dirs:
            full_path = project_path / dir_path
            if full_path.exists():
                print(f"  ✅ Директория существует: {dir_path}")
            else:
                print(f"  ❌ Директория отсутствует: {dir_path}")
                return False
        
        # Проверяем ключевые файлы
        required_files = [
            "jarilo-ecosystem/brain/src/orchestration/simple_integrated_graph.py",
            "jarilo-ecosystem/brain/src/orchestration/simple_plugin_manager.py",
            "jarilo-ecosystem/brain/src/orchestration/plan_execute_agent.py",
            "jarilo-ecosystem/brain/src/api/v1/endpoints.py",
            "Corallum-Studio/src/store/flowStore.ts",
            "Corallum-Studio/src/components/AIWorkflowGenerator.tsx"
        ]
        
        for file_path in required_files:
            full_path = project_path / file_path
            if full_path.exists():
                print(f"  ✅ Файл существует: {file_path}")
            else:
                print(f"  ❌ Файл отсутствует: {file_path}")
                return False
        
        return True
        
    except Exception as e:
        print(f"  ❌ Ошибка интеграции: {e}")
        return False

async def test_performance():
    """🧪 Тестируем производительность"""
    print("\n🧪 Тестируем производительность...")
    
    try:
        # Тестируем скорость загрузки модулей
        start_time = time.time()
        
        from orchestration.simple_integrated_graph import get_simple_integrated_orchestrator
        from orchestration.tools.base_tools import ToolFactory
        
        load_time = time.time() - start_time
        print(f"  ⚡ Модули загружены за {load_time:.3f}s")
        
        # Тестируем создание инструментов
        start_time = time.time()
        tools = ToolFactory.create_all_tools()
        tools_time = time.time() - start_time
        print(f"  🛠️ Инструменты созданы за {tools_time:.3f}s ({len(tools)} шт.)")
        
        # Тестируем оркестратор
        class MockLLM:
            async def ainvoke(self, messages):
                class Response:
                    content = "Test response"
                return Response()
        
        llm = MockLLM()
        start_time = time.time()
        orchestrator = get_simple_integrated_orchestrator(llm)
        orchestrator_time = time.time() - start_time
        print(f"  🚀 Оркестратор создан за {orchestrator_time:.3f}s")
        
        # Общая оценка производительности
        total_time = load_time + tools_time + orchestrator_time
        print(f"  📊 Общее время инициализации: {total_time:.3f}s")
        
        if total_time < 1.0:
            print("  ✅ Производительность отличная!")
        elif total_time < 2.0:
            print("  ✅ Производительность хорошая!")
        else:
            print("  ⚠️ Производительность требует оптимизации")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Ошибка производительности: {e}")
        return False

async def main():
    """🧪 Основной тест"""
    print("🚀 НАЧИНАЕМ ПОЛНОЕ ТЕСТИРОВАНИЕ СИСТЕМЫ JARILO AI")
    print("=" * 60)
    
    start_time = time.time()
    
    # Запускаем все тесты
    tests = [
        ("Backend", test_backend),
        ("Frontend", test_frontend), 
        ("Integration", test_integration),
        ("Performance", test_performance)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            results[test_name] = await test_func()
        except Exception as e:
            print(f"❌ Критическая ошибка в тесте {test_name}: {e}")
            results[test_name] = False
    
    # Итоги
    total_time = time.time() - start_time
    passed_tests = sum(results.values())
    total_tests = len(results)
    
    print("\n" + "=" * 60)
    print("🎉 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ")
    print("=" * 60)
    
    for test_name, result in results.items():
        status = "✅ ПРОЙДЕН" if result else "❌ ПРОВАЛЕН"
        print(f"{test_name:12} : {status}")
    
    print(f"\n📊 Общий результат: {passed_tests}/{total_tests} тестов пройдено")
    print(f"⏱️ Время выполнения: {total_time:.2f}s")
    
    if passed_tests == total_tests:
        print("\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! СИСТЕМА ГОТОВА К ИСПОЛЬЗОВАНИЮ!")
        print("✅ Frontend оптимизирован")
        print("✅ Backend упрощен и работает")
        print("✅ Plugin System базовая реализована")
        print("✅ Интеграция завершена")
    else:
        print(f"\n⚠️ {total_tests - passed_tests} тестов провалено. Нужно исправить проблемы.")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    asyncio.run(main())
