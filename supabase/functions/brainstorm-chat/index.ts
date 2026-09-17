const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // 1. Handle browser CORS preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Fetch the Hugging Face access token from your backend secrets
    const hfToken = Deno.env.get('HF_ACCESS_TOKEN') || Deno.env.get('HUGGINGFACE_API_KEY')
    
    if (!hfToken) {
      console.error("Configuration Error: HF_ACCESS_TOKEN secret is missing in Supabase.")
      return new Response(
        JSON.stringify({ error: 'AI backend credentials are missing.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Extract and validate the user's prompt text
    const { prompt } = await req.json()
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'No prompt text was sent.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Send request directly to Hugging Face Inference API
    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        headers: { 
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json",
          "X-Wait-For-Model": "true" // 🌟 Forces Hugging Face to wake up instead of throwing a 503 error
        },
        method: "POST",
        body: JSON.stringify({
          inputs: `<s>[INST] You are an expert AI brainstorming partner for Invenity. Analyze, build upon, and provide creative feedback for this invention idea: ${prompt} [/INST]`,
          parameters: { 
            max_new_tokens: 600, 
            temperature: 0.7,
            return_full_text: false 
          }
        }),
      }
    )

    // 5. Catch any API errors from Hugging Face safely
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Hugging Face API Error (${response.status}): ${errorText}`)
      return new Response(
        JSON.stringify({ error: `AI engine returned status code ${response.status}.` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await response.json()
    
    // Parse the output correctly whether it returns an array or an object
    const aiTextOutput = Array.isArray(result) 
      ? result[0]?.generated_text 
      : (result.generated_text || "No response text generated.")

    // 6. Return successful 200 message back to the frontend app
    return new Response(
      JSON.stringify({ text: aiTextOutput }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error(`Edge Function Exception: ${error.message}`)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
