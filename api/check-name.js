const {
  handleCors,
  sendJson,
  parseJsonBody,
  getPlayerScore,
} = require("../lib/vercel-api-shared");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, {
      success: false,
      error: "Method Not Allowed",
    });
    return;
  }

  try {
    const body = await parseJsonBody(req);
    const { name } = body;

    if (!name || typeof name !== "string") {
      sendJson(res, 400, {
        success: false,
        error: "Invalid name",
      });
      return;
    }

    const existingScore = await getPlayerScore(name);

    sendJson(res, 200, {
      success: true,
      exists: existingScore !== null,
    });
  } catch (error) {
    sendJson(res, 500, {
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};
