/**
 * ZoomBird Leaderboard API
 * Cloudflare Workers + D1 Database
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route: GET /api/leaderboard
      if (path === '/api/leaderboard' && request.method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '10');
        return await getLeaderboard(env, limit, corsHeaders);
      }

      // Route: POST /api/score
      if (path === '/api/score' && request.method === 'POST') {
        const body = await request.json();
        return await submitScore(env, body, corsHeaders);
      }

      // Route: POST /api/check-name (check if username exists)
      if (path === '/api/check-name' && request.method === 'POST') {
        const body = await request.json();
        return await checkName(env, body, corsHeaders);
      }

      // Route: GET / (health check)
      if (path === '/' && request.method === 'GET') {
        return new Response(JSON.stringify({
          status: 'ok',
          service: 'ZoomBird Leaderboard API',
          version: '1.0.0'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 404 Not Found
      return new Response(JSON.stringify({
        success: false,
        error: 'Not Found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * Get leaderboard
 */
async function getLeaderboard(env, limit, corsHeaders) {
  try {
    const results = await env.DB.prepare(
      'SELECT id, name, score, created_at FROM leaderboard ORDER BY score DESC, created_at ASC LIMIT ?'
    ).bind(limit).all();

    const data = results.results.map((row, index) => ({
      rank: index + 1,
      name: row.name,
      score: row.score,
      timestamp: row.created_at
    }));

    return new Response(JSON.stringify({
      success: true,
      data: data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Submit score - only keep highest score per player
 */
async function submitScore(env, body, corsHeaders) {
  try {
    const { name, score } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.length > 20) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid name (max 20 characters)'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (typeof score !== 'number' || score < 0 || score > 999999) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid score'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if player already exists
    const existingPlayer = await env.DB.prepare(
      'SELECT id, score FROM leaderboard WHERE name = ?'
    ).bind(name).first();

    let resultId;
    let isNewRecord = false;

    if (existingPlayer) {
      // Player exists - only update if new score is higher
      if (score > existingPlayer.score) {
        await env.DB.prepare(
          'UPDATE leaderboard SET score = ?, created_at = datetime("now") WHERE id = ?'
        ).bind(score, existingPlayer.id).run();
        resultId = existingPlayer.id;
        isNewRecord = true;
      } else {
        // Score is not higher, don't update
        resultId = existingPlayer.id;
      }
    } else {
      // New player - insert
      const result = await env.DB.prepare(
        'INSERT INTO leaderboard (name, score, created_at) VALUES (?, ?, datetime("now"))'
      ).bind(name, score).run();
      resultId = result.meta.last_row_id;
      isNewRecord = true;
    }

    // Get rank
    const rankResult = await env.DB.prepare(
      'SELECT COUNT(*) as rank FROM leaderboard WHERE score > ?'
    ).bind(score).first();

    const rank = (rankResult?.rank || 0) + 1;

    return new Response(JSON.stringify({
      success: true,
      rank: rank,
      isNewRecord: isNewRecord,
      data: {
        id: resultId,
        name: name,
        score: score,
        rank: rank
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Check if username exists
 */
async function checkName(env, body, corsHeaders) {
  try {
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid name'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const existing = await env.DB.prepare(
      'SELECT id FROM leaderboard WHERE name = ?'
    ).bind(name).first();

    return new Response(JSON.stringify({
      success: true,
      exists: !!existing
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
