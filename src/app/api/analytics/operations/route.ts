import { NextResponse } from "next/server";

const weekly = [
  { week: "W-26", RECEIVE: 120, PUTAWAY: 110, PICK: 150, TRANSFER: 30, ADJUST: 8 },
  { week: "W-27", RECEIVE: 140, PUTAWAY: 135, PICK: 160, TRANSFER: 28, ADJUST: 10 },
  { week: "W-28", RECEIVE: 160, PUTAWAY: 155, PICK: 170, TRANSFER: 35, ADJUST: 7 },
  { week: "W-29", RECEIVE: 150, PUTAWAY: 145, PICK: 180, TRANSFER: 26, ADJUST: 9 },
  { week: "W-30", RECEIVE: 170, PUTAWAY: 165, PICK: 190, TRANSFER: 32, ADJUST: 6 },
];

const kpis = {
  putawayLeadTimeAvgMin: 46,     // minutos
  pickAccuracyPct: 99.2,         // %
  linesPerHour: 42.5,
};

export async function GET() {
  return NextResponse.json({ weekly, kpis });
}
