import requests
import json

BASE_URL = 'http://127.0.0.1:8000'

def test_health():
    try:
        response = requests.get(f'{BASE_URL}/api/v1/health', timeout=5)
        print(f'Health check status: {response.status_code}')
        try:
            data = response.json()
            print(f'Response: {data}')
            return response.status_code == 200
        except json.JSONDecodeError:
            print(f'Invalid JSON response: {response.text}')
            return False
    except requests.exceptions.RequestException as e:
        print(f'Request failed: {e}')
        return False
    except Exception as e:
        print(f'Unexpected error: {e}')
        return False

if __name__ == '__main__':
    print('Testing API endpoints...')
    if test_health():
        print('API health check passed')
    else:
        print('API health check failed')
