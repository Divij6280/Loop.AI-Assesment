# Data Ingestion API

This API provides endpoints for submitting data ingestion requests and checking their status.

## Endpoints

### Ingestion API

- **POST /ingest**
  - **Request Body**:
    ```json
    {
      "ids": [1, 2, 3, 4, 5],
      "priority": "HIGH"
    }
    ```
  - **Response**:
    ```json
    {
      "ingestion_id": "abc123"
    }
    ```

### Status API

- **GET /status/:ingestionId**
  - **Response**:
    ```json
    {
      "ingestion_id": "abc123",
      "status": "triggered",
      "batches": [
        { "batch_id": "uuid1", "ids": [1, 2, 3], "status": "completed" },
        { "batch_id": "uuid2", "ids": [4, 5], "status": "yet_to_start" }
      ]
    }
    ```

## Running the Application

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Start the server with `node server.js`.
4. Use Postman or curl to test the endpoints.
