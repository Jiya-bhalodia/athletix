import 'dotenv/config';
import { createHash } from 'node:crypto';
import { Types } from 'mongoose';
import { loadConfig } from '../config.js';
import { connectToDatabase } from '../db.js';
import {
  Achievement, Announcement, Attendance, Coach, EnrollmentInquiry, FeePlan,
  FeeRecord, Match, Parent, Payment, Player, PlayerPerformance, Sport, Team, TrainingSession,
} from '../models/index.js';

function requireExplicitDevelopmentOptIn() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed: NODE_ENV is production.');
  }
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Refusing to seed: set NODE_ENV=development explicitly.');
  }
  if (!process.argv.includes('--confirm-demo-seed')) {
    throw new Error('Refusing to seed: pass --confirm-demo-seed to confirm development demo data.');
  }
}

const objectId = (key: string) => new Types.ObjectId(createHash('sha256').update(`athletix-dev-seed:${key}`).digest('hex').slice(0, 24));
const dateOffset = (offsetDays: number) => {
  const value = new Date();
  value.setUTCHours(0, 0, 0, 0);
  value.setUTCDate(value.getUTCDate() + offsetDays);
  return value;
};
const d = (offset: number) => dateOffset(offset);
const day = (offset: number) => d(offset).toISOString().slice(0, 10);

type SeedRecord = { _id: Types.ObjectId; [key: string]: unknown };
async function upsertMany<T extends SeedRecord>(Model: { bulkWrite(ops: Array<unknown>, options?: unknown): Promise<unknown> }, docs: T[]) {
  if (!docs.length) return;
  const operations = docs.map(({ _id, ...fields }) => ({
    updateOne: { filter: { _id }, update: { $set: fields, $setOnInsert: { _id } }, upsert: true },
  }));
  await Model.bulkWrite(operations);
}

const sportRows = [
  ['football', 'Football', 'Team', 'Ball control, positional play and match fitness.', '⚽', 'Passing drills, small-sided games, tactical shape and conditioning.'],
  ['cricket', 'Cricket', 'Team', 'Batting, bowling and fielding fundamentals.', '🏏', 'Net practice, bowling technique and match simulation.'],
  ['basketball', 'Basketball', 'Team', 'Footwork, shooting and team defence.', '🏀', 'Dribbling, shooting, offensive sets and defensive rotations.'],
  ['badminton', 'Badminton', 'Individual', 'Agility, racket skills and court movement.', '🏸', 'Grip, strokes, footwork patterns and singles/doubles strategy.'],
  ['athletics', 'Athletics', 'Individual', 'Sprints, distance running and field events.', '🏃', 'Running mechanics, starts, endurance and field events.'],
  ['tennis', 'Tennis', 'Individual', 'Strokes, serve technique and match play.', '🎾', 'Forehand, backhand, serve technique and point play.'],
] as const;
const sports = sportRows.map(([key, name, category, description, emoji, details]) => ({
  _id: objectId(`sport:${key}`), name, category, description, emoji, details, active: true,
}));
const sportId = (key: string) => objectId(`sport:${key}`);

const coachRows = [
  ['c1', 'Arjun Mehta', 'arjun@athletix.in', '98200 11223', 'football', 9, 'Mon/Wed/Fri 5–7 PM', 'Active'],
  ['c2', 'Priya Nair', 'priya@athletix.in', '98200 33445', 'cricket', 7, 'Tue/Thu/Sat 6–8 AM', 'Active'],
  ['c3', 'Rahul Singh', 'rahul@athletix.in', '98200 55667', 'basketball', 5, 'Mon–Fri 4–6 PM', 'Active'],
  ['c4', 'Sneha Iyer', 'sneha@athletix.in', '98200 77889', 'badminton', 6, 'Tue/Thu 5–7 PM', 'On leave'],
  ['c5', 'Vikram Rao', 'vikram@athletix.in', '98200 99001', 'athletics', 11, 'Daily 6–8 AM', 'Active'],
] as const;
const coaches = coachRows.map(([key, name, email, phone, sport, experience, schedule, status]) => ({
  _id: objectId(`coach:${key}`), name, email, phone, sportId: sportId(sport), experience, schedule, status,
}));
const coachId = (key: string) => objectId(`coach:${key}`);

const teamRows = [
  ['t1', 'Athletix FC U-16', 'football', 'c1', 'U-16'], ['t2', 'Athletix FC U-19', 'football', 'c1', 'U-19'],
  ['t3', 'Strikers XI', 'cricket', 'c2', 'U-19'], ['t4', 'Hoops U-17', 'basketball', 'c3', 'U-17'],
  ['t5', 'Shuttle Squad', 'badminton', 'c4', 'Open'], ['t6', 'Track Team', 'athletics', 'c5', 'Open'],
] as const;
const teams = teamRows.map(([key, name, sport, coach, ageGroup]) => ({
  _id: objectId(`team:${key}`), name, sportId: sportId(sport), coachId: coachId(coach), ageGroup, active: true,
}));
const teamId = (key: string) => objectId(`team:${key}`);

const playerNames = ['Aarav Shah', 'Diya Patel', 'Kabir Khan', 'Ananya Gupta', 'Vihaan Reddy', 'Isha Joshi', 'Reyansh Das', 'Myra Kapoor', 'Advik Menon', 'Sara Thomas', 'Arnav Bose', 'Kiara Pillai', 'Dhruv Malhotra', 'Anika Verma', 'Ishaan Chopra', 'Navya Kulkarni', 'Aryan Saxena', 'Tara Bhat'];
const players = playerNames.map((name, index) => {
  const teamKey = `t${(index % 6) + 1}`;
  const sportKey = teamRows.find(([key]) => key === teamKey)![2];
  const first = name.split(' ')[0]!.toLowerCase();
  return {
    _id: objectId(`player:p${index + 1}`), name, email: `${first}@mail.com`, phone: `99${String(10000000 + index * 734521).slice(0, 8)}`,
    age: 12 + (index % 7), sportId: sportId(sportKey), teamId: teamId(teamKey), joinDate: d(-30 * (index + 2)),
    emergencyName: `Parent of ${name.split(' ')[0]}`, emergencyPhone: `97${String(20000000 + index * 51234).slice(0, 8)}`,
    status: index % 9 === 8 ? 'Inactive' : 'Active',
  };
});
const playerId = (key: string) => objectId(`player:${key}`);

const sessionRows = [
  ['ss1', 'Passing & possession', 't1', 'c1', 0, '17:00', 'Ground A'], ['ss2', 'Net practice', 't3', 'c2', 0, '06:30', 'Nets 1–3'],
  ['ss3', 'Shooting drills', 't4', 'c3', -1, '16:00', 'Indoor court'], ['ss4', 'Sprint starts', 't6', 'c5', -2, '06:00', 'Track'],
  ['ss5', 'Match tactics', 't2', 'c1', -3, '17:00', 'Ground A'], ['ss6', 'Footwork patterns', 't5', 'c4', 2, '17:00', 'Court 2'],
  ['ss7', 'Finishing in the box', 't1', 'c1', -7, '17:00', 'Ground A'], ['ss8', 'Conditioning circuit', 't1', 'c1', -14, '17:00', 'Ground B'],
  ['ss9', 'Set pieces', 't1', 'c1', 2, '17:00', 'Ground B'], ['ss10', 'Spin bowling', 't3', 'c2', -6, '06:30', 'Nets 1–3'],
  ['ss11', 'Fielding drills', 't3', 'c2', 1, '06:30', 'Main oval'],
] as const;
const sessions = sessionRows.map(([key, title, team, coach, offset, time, venue]) => ({
  _id: objectId(`session:${key}`), title, teamId: teamId(team), coachId: coachId(coach), date: d(offset), time, venue,
}));
const sessionId = (key: string) => objectId(`session:${key}`);
const attendance = sessionRows.filter(([, , , , offset]) => offset <= 0).flatMap(([sessionKey, , teamKey]) =>
  players.filter((player) => String(player.teamId) === String(teamId(teamKey))).map((player, index) => ({
    _id: objectId(`attendance:${sessionKey}:${String(player._id)}`), sessionId: sessionId(sessionKey), playerId: player._id,
    status: (index + sessionKey.length) % 4 === 0 ? 'Absent' : 'Present', markedAt: d(0),
  })),
);

const matchRows = [
  ['m1', 't1', 'City Juniors', -20, 'Home', 'District League', 3, 1, 'Completed'],
  ['m2', 't3', 'Royal CC', -14, 'Away', 'Inter-academy Cup', 182, 176, 'Completed'],
  ['m3', 't4', 'Skyline Ballers', -9, 'Home', 'Friendly', 58, 64, 'Completed'],
  ['m4', 't2', 'Riverside FC', -5, 'Away', 'District League', 2, 2, 'Completed'],
  ['m5', 't1', 'Northside Academy', 3, 'Home', 'District League', null, null, 'Upcoming'],
  ['m6', 't3', 'Greenfield XI', 6, 'Away', 'Inter-academy Cup', null, null, 'Upcoming'],
  ['m7', 't4', 'Metro Hoops', 10, 'Home', 'State Qualifier', null, null, 'Upcoming'],
] as const;
const matches = matchRows.map(([key, team, opponent, offset, venue, tournament, ourScore, theirScore, status]) => ({
  _id: objectId(`match:${key}`), teamId: teamId(team), opponent, date: d(offset), venue, tournament, ourScore, theirScore, status,
}));
const matchId = (key: string) => objectId(`match:${key}`);
const performance = players.slice(0, 12).flatMap((player, index) => matchRows.filter(([, team, , , , , , , status]) =>
  status === 'Completed' && String(player.teamId) === String(teamId(team)),
).map(([key], matchIndex) => ({
  _id: objectId(`performance:${String(player._id)}:${key}`), playerId: player._id, matchId: matchId(key),
  rating: 5 + ((index * 3 + matchIndex * 2) % 5), notes: matchIndex % 2 ? 'Solid positional play' : 'Good work rate',
})));

const achievements = [
  { key: 'ac1', title: 'District League Champions', type: 'Trophy', recipientType: 'team', teamId: teamId('t1'), sportId: sportId('football'), date: d(-120), description: 'Unbeaten league season.', featured: true },
  { key: 'ac2', title: 'State 100m Gold', type: 'Medal', recipientType: 'player', playerId: playerId('p12'), sportId: sportId('athletics'), date: d(-75), description: 'Personal best 12.4s.', featured: true },
  { key: 'ac3', title: 'Best Bowler — Inter-academy Cup', type: 'Award', recipientType: 'player', playerId: playerId('p2'), sportId: sportId('cricket'), date: d(-14), description: '14 wickets across the tournament.', featured: false },
  { key: 'ac4', title: '100 sessions attended', type: 'Milestone', recipientType: 'player', playerId: playerId('p1'), sportId: sportId('football'), date: d(-7), description: 'Consistency milestone.', featured: false },
].map(({ key, ...row }) => ({ _id: objectId(`achievement:${key}`), ...row }));

const planRows = [
  ['fp1', 'Team sports — monthly', 'football', 2500, 'Monthly'], ['fp2', 'Cricket — quarterly', 'cricket', 7000, 'Quarterly'], ['fp3', 'Individual sports — monthly', 'badminton', 2000, 'Monthly'],
] as const;
const feePlans = planRows.map(([key, name, sport, amount, frequency]) => ({ _id: objectId(`fee-plan:${key}`), name, sportId: sportId(sport), amount, currency: 'INR', frequency, active: true }));
const planId = (key: string) => objectId(`fee-plan:${key}`);
const feeRecords = players.map((player, index) => {
  const playerTeam = teamRows[index % teamRows.length]!;
  const playerSport = playerTeam[2];
  const key = playerSport === 'cricket' ? 'fp2' : ['badminton', 'athletics'].includes(playerSport) ? 'fp3' : 'fp1';
  const amount = key === 'fp2' ? 7000 : key === 'fp3' ? 2000 : 2500;
  const status = index % 3 === 1 ? 'Paid' : index % 3 === 0 ? 'Overdue' : 'Pending';
  return { _id: objectId(`fee-record:f${index + 1}`), playerId: player._id, planId: planId(key), amount, currency: 'INR', dueDate: d(index % 3 === 0 ? -10 : 5), status, paymentKey: status === 'Paid' ? `payment:f${index + 1}` : null, paidAt: status === 'Paid' ? d(-3) : null };
});
const payments = feeRecords.filter((fee) => fee.paymentKey).map((fee) => ({
  _id: objectId(fee.paymentKey!), feeRecordId: fee._id, playerId: fee.playerId, amount: fee.amount, currency: fee.currency,
  paidAt: fee.paidAt!, method: 'UPI', status: 'Succeeded', reference: `DEMO-${String(fee._id).slice(-8)}`,
}));

const announcements = [
  { _id: objectId('announcement:an1'), title: 'Summer camp registrations open', kind: 'Event', date: d(4), body: 'Two-week camp for all sports. Limited slots.', published: true },
  { _id: objectId('announcement:an2'), title: 'Ground A closed for maintenance', kind: 'Training notice', date: d(1), body: 'Football sessions move to Ground B on Thursday.', published: true },
  { _id: objectId('announcement:an3'), title: 'U-16 beat City Juniors 3–1', kind: 'Match update', date: d(-20), body: 'Great team performance in the league opener.', published: true },
];
const parents = [{
  _id: objectId('parent:pa1'), name: 'Neha Shah', email: 'neha.shah@mail.com', phone: '97200 11122',
  childIds: [playerId('p1'), playerId('p3')],
}];
const inquiries = [{
  _id: objectId('inquiry:sample1'), name: 'Sample Prospective Member', email: 'prospective@example.test', phone: '+91 90000 00000',
  sport: 'football', message: 'Interested in junior batch timings.', status: 'New', receivedAt: d(-1),
}];

async function seed() {
  requireExplicitDevelopmentOptIn();
  const config = loadConfig();
  await connectToDatabase(config.mongoUri);
  try {
    const feeRows = feeRecords.map(({ paymentKey: _paymentKey, paidAt: _paidAt, ...record }) => record);
    await upsertMany(Sport, sports as SeedRecord[]);
    await upsertMany(Coach, coaches as SeedRecord[]);
    await upsertMany(Team, teams as SeedRecord[]);
    await upsertMany(Player, players as SeedRecord[]);
    await upsertMany(Parent, parents as SeedRecord[]);
    await upsertMany(TrainingSession, sessions as SeedRecord[]);
    await upsertMany(Attendance, attendance as SeedRecord[]);
    await upsertMany(Match, matches as SeedRecord[]);
    await upsertMany(PlayerPerformance, performance as SeedRecord[]);
    await upsertMany(Achievement, achievements as SeedRecord[]);
    await upsertMany(FeePlan, feePlans as SeedRecord[]);
    await upsertMany(FeeRecord, feeRows as SeedRecord[]);
    await upsertMany(Payment, payments as SeedRecord[]);
    await upsertMany(Announcement, announcements as SeedRecord[]);
    await upsertMany(EnrollmentInquiry, inquiries as SeedRecord[]);

    console.log('Development demo seed complete. Existing unrelated documents were not deleted.');
    console.log('Seeded: sports, coaches, teams, players, parent-child links, sessions, attendance, matches, performance, achievements, fee plans/records, payments, announcements and one sample inquiry.');
    console.log('No User login accounts or ActivityAudit rows were seeded; authentication remains Phase 3 and audit actors require real accounts.');
  } finally {
    const mongoose = await import('mongoose');
    await mongoose.default.disconnect();
  }
}

seed().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : '';
  const refusal = message.startsWith('Refusing to seed:');
  console.error(refusal ? `Development seed failed: ${message}` : 'Development seed failed. Check the development database and model data.');
  process.exitCode = 1;
});
