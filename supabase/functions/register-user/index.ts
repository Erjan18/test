import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, password, username } = await req.json();

    if (!email || !password || !username) {
      return new Response(
        JSON.stringify({ error: "Заполните все поля" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Пароль должен содержать минимум 6 символов" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use the REST API directly with service role to bypass email confirmation
    const signUpRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
        "apikey": serviceKey,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { username },
      }),
    });

    const signUpData = await signUpRes.json();

    if (!signUpRes.ok) {
      const msg = signUpData?.msg || signUpData?.message || signUpData?.error || "Ошибка создания пользователя";
      const status = msg.toLowerCase().includes("already") ? 409 : 400;
      return new Response(
        JSON.stringify({ error: status === 409 ? "Пользователь с таким email уже существует" : msg }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = signUpData.id;

    if (userId) {
      // Ensure profile row exists (trigger may have already created it)
      const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      await supabase.from("profiles").upsert(
        { id: userId, username, role: "user" },
        { onConflict: "id" }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Ошибка: ${err}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
