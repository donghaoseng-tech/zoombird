const {
  handleCors,
  sendJson,
  parseJsonBody,
  isValidName,
  isValidScore,
  getPlayerScore,
  savePlayerScore,
  getRankByScore,
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
    const { name, score } = body;

    if (!isValidName(name)) {
      sendJson(res, 400, {
        success: false,
        error: "Invalid name (max 20 characters)",
      });
      return;
    }

    if (!isValidScore(score)) {
      sendJson(res, 400, {
        success: false,
        error: "Invalid score",
      });
      return;
    }

    const existingScore = await getPlayerScore(name);
    const hasExistingScore = existingScore !== null;

    let isNewRecord = false;
    let finalScore = score;

    if (!hasExistingScore) {
      await savePlayerScore(name, score);
      isNewRecord = true;
    } else if (score > existingScore) {
      await savePlayerScore(name, score);
      isNewRecord = true;
    } else {
      finalScore = existingScore;
    }

    const rank = await getRankByScore(finalScore);

    sendJson(res, 200, {
      success: true,
      rank,
      isNewRecord,
      data: {
        id: name,
        name,
        score: finalScore,
        rank,
      },
    });
  } catch (error) {
    sendJson(res, 500, {
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};
