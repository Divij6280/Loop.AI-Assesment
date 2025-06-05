const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(bodyParser.json());

const PORT = 5000;

// Store for ingestion and batch statuses
const ingestionStore = {};

// Rate limit
const RATE_LIMIT_MS = 5000; // 5 seconds
let lastProcessedTime = 0;

// Maximum retry attempts for processing a batch
const MAX_RETRY_ATTEMPTS = 3;

// Function to process batches with error recovery
async function processBatches(ingestionId) {
  for (const batch of ingestionStore[ingestionId].batches) {
    let attempts = 0;
    let success = false;

    while (attempts < MAX_RETRY_ATTEMPTS && !success) {
      const currentTime = Date.now();

      // Respect rate limit
      if (currentTime - lastProcessedTime < RATE_LIMIT_MS) {
        await new Promise((resolve) =>
          setTimeout(resolve, RATE_LIMIT_MS - (currentTime - lastProcessedTime))
        );
      }

      lastProcessedTime = Date.now();
      batch.status = "triggered"; // Update status to triggered

      try {
        // Simulate processing delay
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * batch.ids.length)
        ); // 1 second per ID

        // Simulate a random error for demonstration purposes
        if (Math.random() < 0.2) {
          // 20% chance to fail
          throw new Error("Simulated processing error");
        }

        batch.status = "completed"; // Update status to completed
        success = true; // Mark as successful
      } catch (error) {
        attempts++;
        console.error(
          `Error processing batch ${batch.batch_id}: ${error.message}`
        );
        if (attempts >= MAX_RETRY_ATTEMPTS) {
          batch.status = "failed"; // Mark as failed after max attempts
        }
      }
    }
  }

  // Update overall status
  ingestionStore[ingestionId].status = "completed";
}

// POST API
app.post("/ingest", (req, res) => {
  const { ids, priority } = req.body;

  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    !["HIGH", "MEDIUM", "LOW"].includes(priority)
  ) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const ingestionId = uuidv4();
  ingestionStore[ingestionId] = {
    status: "triggered",
    batches: [],
  };

  // Process IDs in batches of 3
  for (let i = 0; i < ids.length; i += 3) {
    const batchIds = ids.slice(i, i + 3);
    const batchId = uuidv4();
    ingestionStore[ingestionId].batches.push({
      batch_id: batchId,
      ids: batchIds,
      status: "yet_to_start",
    });
  }

  processBatches(ingestionId);

  res.json({ ingestion_id: ingestionId });
});

// GET API
app.get("/status/:ingestionId", (req, res) => {
  const { ingestionId } = req.params;

  if (!ingestionStore[ingestionId]) {
    return res.status(404).json({ error: "Ingestion ID not found" });
  }

  const batches = ingestionStore[ingestionId].batches;
  const overallStatus = batches.every((batch) => batch.status === "completed")
    ? "completed"
    : batches.some((batch) => batch.status === "failed")
    ? "failed"
    : "triggered";

  res.json({
    ingestion_id: ingestionId,
    status: overallStatus,
    batches: batches,
  });
});

// For Starting the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
