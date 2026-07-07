FROM python:3.11-slim
WORKDIR /app

# Install system dependencies needed for some python packages like psycopg2
RUN apt-get update && apt-get install -y build-essential libpq-dev

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000
CMD ["python", "app.py"]
