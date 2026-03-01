export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === '/api/leaderboard' && request.method === 'GET') {
      return handleGetLeaderboard(env, corsHeaders);
    }

    return new Response('Not Found', { status: 404 });
  }
};

async function handleGetLeaderboard(env, corsHeaders) {
  try {
    // Check KV cache
    const cached = await env.KV.get('leaderboard:top100');
    if (cached) {
      return new Response(cached, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Query D1
    const result = await env.DB.prepare(
      'SELECT nickname, score FROM scores ORDER BY score DESC LIMIT 100'
    ).all();

    // Add rank
    const leaderboard = result.results.map((row, index) => ({
      rank: index + 1,
      nickname: row.nickname,
      score: row.score
    }));

    const json = JSON.stringify(leaderboard);

    // Cache for 5 minutes
    await env.KV.put('leaderboard:top100', json, { expirationTtl: 300 });

    return new Response(json, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
