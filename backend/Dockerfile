# Use an official Python runtime as a parent image
FROM python:3.8-slim-buster

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /code

# Install dependencies
COPY requirements.txt /code/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy project
COPY . /code/

# Run migrations
# Doing this only because we are using a local sqlite db
RUN python manage.py migrate gameState

# Run the application
CMD ["uvicorn", "loonsTd.asgi:application", "--host", "0.0.0.0", "--port", "8000"]