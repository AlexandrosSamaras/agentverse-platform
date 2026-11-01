import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, writeBatch } from "firebase/firestore";
import { mockAgents, mockJobRequests, mockReviews, mockUserProfile } from "@/data/mock";
import { checkRateLimit, getClientIp } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`seed:${clientIp}`, 3, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded for database seeding. Try again in a minute." },
        { status: 429 }
      );
    }

    const batch = writeBatch(db);

    // Seed Agents
    mockAgents.forEach((agent) => {
      const agentRef = doc(collection(db, "agents"), agent.id);
      batch.set(agentRef, agent, { merge: true });
    });

    // Seed Jobs
    mockJobRequests.forEach((job) => {
      const jobRef = doc(collection(db, "jobs"), job.id);
      batch.set(jobRef, job, { merge: true });
    });

    // Seed Reviews
    mockReviews.forEach((review) => {
      const reviewRef = doc(collection(db, "reviews"), review.id);
      batch.set(reviewRef, review, { merge: true });
    });

    // Seed User Profile (mock user)
    const userRef = doc(collection(db, "users"), mockUserProfile.id);
    batch.set(userRef, mockUserProfile, { merge: true });

    await batch.commit();

    return NextResponse.json({
      message: "Database seeded successfully!",
      counts: {
        agents: mockAgents.length,
        jobs: mockJobRequests.length,
        reviews: mockReviews.length,
      },
    });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json(
      { error: "Could not synchronize sample data with Firestore." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed. Use POST /api/seed to synchronize sample data." },
    { status: 405 }
  );
}
