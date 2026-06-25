import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sanitizeJobInput } from "@/lib/security/validation";

const JOB_CREATE_RATE_LIMIT = 20;
const JOB_CREATE_RATE_WINDOW_MS = 60 * 60 * 1_000;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(
    `job-create:${user.id}`,
    JOB_CREATE_RATE_LIMIT,
    JOB_CREATE_RATE_WINDOW_MS
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many job postings. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const jobInput = sanitizeJobInput(body);
  if (!jobInput) {
    return NextResponse.json(
      {
        error:
          "description and at least title or company are required; url must be valid when provided",
      },
      { status: 400 }
    );
  }

  if (jobInput.url) {
    const { data: existing } = await supabase
      .from("jobs")
      .select("id")
      .eq("url", jobInput.url)
      .maybeSingle();

    if (existing) {
      await supabase.from("applications").upsert(
        {
          job_id: existing.id,
          user_id: user.id,
          status: "pending",
        },
        { onConflict: "job_id,user_id", ignoreDuplicates: true }
      );

      return NextResponse.json(
        { error: "A job with this URL already exists", jobId: existing.id },
        { status: 409 }
      );
    }
  }

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      title: jobInput.title,
      company: jobInput.company,
      description: jobInput.description,
      summary: jobInput.summary,
      salary: jobInput.salary,
      url: jobInput.url,
      source: jobInput.source,
      requirements: jobInput.requirements,
      input_mode: jobInput.input_mode ?? "manual",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A job with this URL already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { error: applicationError } = await supabase.from("applications").insert({
    job_id: job.id,
    user_id: user.id,
    status: "pending",
  });

  if (applicationError && applicationError.code !== "23505") {
    return NextResponse.json({ error: applicationError.message }, { status: 500 });
  }

  return NextResponse.json({ job }, { status: 201 });
}
