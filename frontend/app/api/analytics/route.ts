import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

function getDbPath() {
  // Path to backend database
  return path.join(process.cwd(), '..', 'backend', 'data', 'callers.db');
}

export async function GET() {
  try {
    const dbPath = getDbPath();

    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({
        total_calls: 0,
        successful_calls: 0,
        failed_calls: 0,
        success_rate: 0,
        avg_duration: 0,
        track: 'Financial Services',
        calls: [],
      });
    }

    const db = new DatabaseSync(dbPath);

    // Create table if not exists (defensive check)
    db.exec(`
      CREATE TABLE IF NOT EXISTS calls (
        id TEXT PRIMARY KEY,
        room_name TEXT NOT NULL,
        caller_id TEXT NOT NULL,
        caller_name TEXT DEFAULT 'Anonymous Caller',
        track TEXT DEFAULT 'Financial Services',
        status TEXT NOT NULL,
        outcome_reason TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT NOT NULL,
        duration_seconds INTEGER DEFAULT 0
      );
    `);

    const totalRow = db.prepare('SELECT COUNT(*) as total FROM calls').get() as { total: number };
    const successRow = db
      .prepare("SELECT COUNT(*) as success FROM calls WHERE status = 'success'")
      .get() as { success: number };
    const failedRow = db
      .prepare("SELECT COUNT(*) as failed FROM calls WHERE status = 'failed'")
      .get() as { failed: number };
    const avgRow = db.prepare('SELECT AVG(duration_seconds) as avg_dur FROM calls').get() as {
      avg_dur: number | null;
    };

    const total_calls = totalRow?.total || 0;
    const successful_calls = successRow?.success || 0;
    const failed_calls = failedRow?.failed || 0;
    const avg_duration = avgRow?.avg_dur ? Math.round(avgRow.avg_dur * 10) / 10 : 0;
    const success_rate = total_calls > 0 ? Math.round((successful_calls / total_calls) * 1000) / 10 : 0;

    const calls = db.prepare('SELECT * FROM calls ORDER BY started_at DESC LIMIT 50').all();

    db.close();

    return NextResponse.json({
      total_calls,
      successful_calls,
      failed_calls,
      success_rate,
      avg_duration,
      track: 'Financial Services',
      calls,
    });
  } catch (error) {
    console.error('Error fetching analytics metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics metrics' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const dbPath = getDbPath();

    // Ensure database directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new DatabaseSync(dbPath);

    db.exec(`
      CREATE TABLE IF NOT EXISTS calls (
        id TEXT PRIMARY KEY,
        room_name TEXT NOT NULL,
        caller_id TEXT NOT NULL,
        caller_name TEXT DEFAULT 'Anonymous Caller',
        track TEXT DEFAULT 'Financial Services',
        status TEXT NOT NULL,
        outcome_reason TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT NOT NULL,
        duration_seconds INTEGER DEFAULT 0
      );
    `);

    const callId = `call_sim_${Date.now()}`;
    const now = new Date().toISOString();
    const isSuccess = body.status === 'failed' ? false : Math.random() > 0.25;

    const sampleReasonsSuccess = [
      'Completed scheme eligibility check (PM Awas Yojana)',
      'Created human escalation request (ESC-' + Math.floor(10000 + Math.random() * 90000) + ' - Fraud Alert)',
      'Provided UPI & digital banking security guidance',
      'Saved caller memory & preferred communication language',
      'Completed scheme eligibility check (Sukanya Samriddhi Yojana)',
    ];

    const sampleReasonsFailed = [
      'Call disconnected before completing inquiry',
      'Caller declined consent for saving details',
      'Call dropped due to network timeout',
    ];

    const status = isSuccess ? 'success' : 'failed';
    const reason = isSuccess
      ? sampleReasonsSuccess[Math.floor(Math.random() * sampleReasonsSuccess.length)]
      : sampleReasonsFailed[Math.floor(Math.random() * sampleReasonsFailed.length)];

    const names = ['Pooja Sharma', 'Rajesh Kumar', 'Ananya Patel', 'Vikram Singh', 'Priya Nair', 'Suresh Joshi'];
    const callerName = body.caller_name || names[Math.floor(Math.random() * names.length)];
    const duration = isSuccess ? Math.floor(60 + Math.random() * 120) : Math.floor(10 + Math.random() * 35);

    const stmt = db.prepare(`
      INSERT INTO calls (id, room_name, caller_id, caller_name, track, status, outcome_reason, started_at, ended_at, duration_seconds)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      callId,
      `room_sim_${Math.floor(Math.random() * 1000)}`,
      `usr_sim_${Math.floor(Math.random() * 100)}`,
      callerName,
      'Financial Services',
      status,
      reason,
      now,
      now,
      duration
    );

    db.close();

    return NextResponse.json({
      success: true,
      message: `Simulated call recorded: ${callId}`,
      status,
      reason,
    });
  } catch (error) {
    console.error('Error simulating call log:', error);
    return NextResponse.json({ error: 'Failed to simulate call log' }, { status: 500 });
  }
}
