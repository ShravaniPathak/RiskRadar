FROM python:3.11-slim

WORKDIR /app

COPY ml-requirements.txt .
RUN pip install --no-cache-dir -r ml-requirements.txt

RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-mpnet-base-v2', revision='e8c3b32edf5434bc2275fc9bab85f82640a19130')"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONPATH=/app
