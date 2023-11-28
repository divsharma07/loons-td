# Django ASGI Backend Application

This repository contains the Django ASGI backend application. It is designed to be run either via Docker Compose or directly using Uvicorn, an ASGI server.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Python 3.x
- Docker and Docker Compose (for Docker method)
- Pip (for direct method)

### Installing

Clone the repository to your local machine:

```bash
git clone https://github.com/divsharma07/loons-td
cd loonsTd
```

### Running with Docker Compose
This is the recommended way to run the application for development. It ensures that your development environment matches production and avoids issues with local configurations.

1. Build and Run with Docker Compose:
    ```bash
    docker-compose up -build
    ```
2. The application will be accessible at http://localhost:8000


### Running Directly with Uvicorn
1. Set Up a Virtual Environment (Optional but Recommended):
    ```bash
        python -m venv venv
        source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```
2. Install Dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3. Run the Application:
    ```bash
    uvicorn loonsTd.asgi:application --reload
    ```
4. Access the Application:
    The application will be running at http://localhost:8000.