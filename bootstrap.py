import docker
import logging
import os

# Настройка базового логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Словарь необходимых образов и путей к их Dockerfile
REQUIRED_IMAGES = {
    "jarilo-agent:latest": "jarilo-ecosystem/brain/src/agents/image",
    "jarilo-sandbox:latest": "jarilo-ecosystem/brain/src/security/sandbox" # Предполагаемый путь
}

def ensure_docker_images():
    """
    Проверяет наличие необходимых Docker-образов и собирает их, если они отсутствуют.
    """
    try:
        client = docker.from_env()
        logging.info("Проверка доступности Docker-демона... ✓")
    except docker.errors.DockerException as e:
        logging.error(f"Не удалось подключиться к Docker. Убедитесь, что он запущен. Ошибка: {e}")
        return

    # Получаем список существующих образов
    existing_images = [tag for image in client.images.list() for tag in image.tags]

    for image_name, build_context in REQUIRED_IMAGES.items():
        if image_name in existing_images:
            logging.info(f"Образ '{image_name}' уже существует. Пропускаем сборку.")
        else:
            logging.warning(f"Образ '{image_name}' не найден. Начинаем сборку...")
            dockerfile_path = os.path.join(build_context, 'Dockerfile')

            if not os.path.exists(dockerfile_path):
                logging.error(f"Dockerfile не найден по пути: {dockerfile_path}. Невозможно собрать образ '{image_name}'.")
                continue

            try:
                image, build_logs = client.images.build(
                    path=build_context,
                    tag=image_name,
                    rm=True # Удалять промежуточные контейнеры
                )
                logging.info(f"Образ '{image_name}' успешно собран. ID: {image.id}")
            except docker.errors.BuildError as e:
                logging.error(f"Ошибка при сборке образа '{image_name}'. Логи сборки:")
                for log_line in e.build_log:
                    if 'stream' in log_line:
                        logging.error(log_line['stream'].strip())

if __name__ == "__main__":
    logging.info("Запуск скрипта начальной загрузки Jarilo...")
    ensure_docker_images()
    logging.info("Проверка зависимостей завершена.")