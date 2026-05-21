import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const filePath = url.searchParams.get('file');
    const action = url.searchParams.get('action') || 'view';

    if (!filePath) {
      return new Response(JSON.stringify({ error: 'File path is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Security: Prevent directory traversal
    if (filePath.includes('..') || filePath.includes('~')) {
      return new Response(JSON.stringify({ error: 'Invalid file path' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Read file from the project directory
    const projectRoot = '/workspace/app-9cyfgucqbpj5';
    const fullPath = `${projectRoot}${filePath}`;

    try {
      const fileContent = await Deno.readTextFile(fullPath);
      
      if (action === 'download') {
        const fileName = filePath.split('/').pop() || 'file.txt';
        return new Response(fileContent, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="${fileName}"`,
          },
        });
      }

      return new Response(
        JSON.stringify({
          path: filePath,
          content: fileContent,
          size: fileContent.length,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return new Response(JSON.stringify({ error: 'File not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in get-source-code function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
