
User wants to switch from DeepSeek to Hugging Face Inference API for the brainstorm chat. They have a HF API key ready.

HF Inference API supports OpenAI-compatible chat completions at `https://router.huggingface.co/v1/chat/completions` with streaming. Good free-tier models: `meta-llama/Llama-3.1-8B-Instruct`, `mistralai/Mistral-7B-Instruct-v0.3`, or `Qwen/Qwen2.5-7B-Instruct`.

User asks "where do i paste it" — they don't paste anywhere manually. I'll trigger the secure secret form (add_secret tool) which opens a popup for them to paste it. Then I swap the edge function.

# Plan

## Where you paste the key
You won't paste it in code or in any settings page yourself. After you approve this plan, I'll pop up a **secure secret form** right here in chat — you paste the HF token there, hit save, and it's stored encrypted as `HUGGINGFACE_API_KEY`. Get the token at https://huggingface.co/settings/tokens (create a "Read" token, it's free).

## What I'll change

**1. Add `HUGGINGFACE_API_KEY` secret** (popup form for you)

**2. Rewrite `supabase/functions/brainstorm-chat/index.ts`**
- Swap endpoint to `https://router.huggingface.co/v1/chat/completions`
- Use model `meta-llama/Llama-3.1-8B-Instruct:novita` (free tier, OpenAI-compatible, supports streaming)
- Keep the same SSE response shape so the frontend doesn't need any changes
- Keep the existing system prompt and 429/402 error handling

**3. Update `src/pages/AIBrainstorm.tsx`**
- Change subtitle from "Powered by DeepSeek" to "Powered by Hugging Face"

**4. Leave `DEEPSEEK_API_KEY` in place** (unused but harmless — you can delete it later if you want)

## Files touched
- `supabase/functions/brainstorm-chat/index.ts`
- `src/pages/AIBrainstorm.tsx`
- New secret: `HUGGINGFACE_API_KEY`

After approval I'll open the secret form for you to paste the token, then ship the swap.
