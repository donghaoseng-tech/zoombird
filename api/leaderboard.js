const {
  handleCors,
  sendJson,
  getLimit,
  getTopLeaderboard,
} = require("../lib/vercel-api-shared");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) {
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, {
      success: false,
      error: "Method Not Allowed",
    });
    return;
  }

  try {
    const limit = getLimit(req.query?.limit);
    const data = await getTopLeaderboard(limit);

    sendJson(res, 200, {
      success: true,
      data,
    });
  } catch (error) {
    sendJson(res, 500, {
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};
