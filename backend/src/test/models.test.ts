import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose, { Types } from 'mongoose';
import {
  Achievement, ActivityAudit, Announcement, Attendance, Coach, EnrollmentInquiry, FeeRecord,
  Match, Parent, Payment, Player, PlayerPerformance, Sport, Team, TrainingSession, User,
} from '../models/index.js';

const id = () => new Types.ObjectId();

test('User requires a supported role and normalizes account email', () => {
  const user = new User({ email: '  TEST@EXAMPLE.COM ', role: 'admin' });
  assert.equal(user.email, 'test@example.com');
  assert.equal(user.sessionVersion, 0);
  assert.equal(user.validateSync(), undefined);
  const invalid = new User({ email: 'x@example.com', role: 'owner' });
  assert.ok(invalid.validateSync()?.errors.role);
  const invalidVersion = new User({ email: 'version@example.com', role: 'player', sessionVersion: -1 });
  assert.ok(invalidVersion.validateSync()?.errors.sessionVersion);
  const plaintext = new User({ email: 'plain@example.com', role: 'player', passwordHash: 'this-is-not-a-password-hash' });
  assert.ok(plaintext.validateSync()?.errors.passwordHash);
  assert.ok(User.schema.indexes().some(([keys, options]) => keys.email === 1 && options.unique === true));
});

test('models use ObjectId relationship paths', () => {
  assert.equal(Team.schema.path('sportId')?.instance, 'ObjectId');
  assert.equal(Player.schema.path('sportId')?.instance, 'ObjectId');
  assert.equal(TrainingSession.schema.path('teamId')?.instance, 'ObjectId');
  assert.equal(Attendance.schema.path('sessionId')?.instance, 'ObjectId');
  assert.equal(Match.schema.path('teamId')?.instance, 'ObjectId');
  assert.equal(PlayerPerformance.schema.path('playerId')?.instance, 'ObjectId');
  assert.equal(FeeRecord.schema.path('playerId')?.instance, 'ObjectId');
  assert.equal(Payment.schema.path('feeRecordId')?.instance, 'ObjectId');
  assert.equal(new Parent({ name: 'A', email: 'a@example.com', phone: '12345678', childIds: [id()] }).childIds.length, 1);
});

test('attendance declares unique session/player pair to prevent duplicate records', () => {
  const uniquePair = Attendance.schema.indexes().find(([keys, options]) =>
    keys.sessionId === 1 && keys.playerId === 1 && options.unique === true,
  );
  assert.ok(uniquePair, 'attendance must have a unique compound session/player index');
});

test('attendance accepts every status supported by the coach API', () => {
  for (const status of ['Present', 'Absent', 'Late', 'Excused'] as const) {
    const record = new Attendance({ sessionId: id(), playerId: id(), status });
    assert.equal(record.validateSync(), undefined);
  }
});

test('parent validation rejects duplicate child references', () => {
  const child = id();
  const parent = new Parent({ name: 'Parent', email: 'parent@example.com', phone: '12345678', childIds: [child, child] });
  assert.match(parent.validateSync()?.errors.childIds?.message ?? '', /only be linked once/);
});

test('important enums and numeric validation are enforced', () => {
  const invalidSport = new Sport({ name: 'Sport', category: 'Mixed', description: 'Demo' });
  assert.ok(invalidSport.validateSync()?.errors.category);
  const invalidCoach = new Coach({ name: 'Coach', email: 'coach@example.com', phone: '12345678', sportId: id(), experience: -1, schedule: 'Daily' });
  assert.ok(invalidCoach.validateSync()?.errors.experience);
  const invalidPerformance = new PlayerPerformance({ playerId: id(), rating: 11, notes: 'Too high' });
  assert.ok(invalidPerformance.validateSync()?.errors.rating);
  const invalidMatch = new Match({ teamId: id(), opponent: 'Opponent', date: new Date(), venue: 'Ground', tournament: 'Cup', ourScore: -1, status: 'Upcoming' });
  assert.ok(invalidMatch.validateSync()?.errors.ourScore);
});

test('achievement requires an explicit recipient ref matching recipient type', async () => {
  const achievement = new Achievement({ title: 'Award', type: 'Award', recipientType: 'player', teamId: id(), sportId: id(), date: new Date() });
  await assert.rejects(achievement.validate(), /exactly one recipient reference/);
});

test('inquiry validates current public form fields without requiring extra personal data', () => {
  const inquiry = new EnrollmentInquiry({ name: 'Test Person', email: 'test@example.com', phone: '+91 90000 00000', sport: 'football' });
  assert.equal(inquiry.validateSync(), undefined);
  const invalid = new EnrollmentInquiry({ name: 'A', email: 'bad', phone: '1', sport: '' });
  assert.ok(invalid.validateSync());
});

test('models can be imported repeatedly without registration errors', () => {
  assert.equal(mongoose.models.User, User);
  assert.equal(mongoose.models.Announcement, Announcement);
  assert.equal(mongoose.models.Attendance, Attendance);
});

test('audit rejects secret-bearing metadata keys and accepts safe scalar metadata', async () => {
  const safe = new ActivityAudit({ actorId: id(), action: 'updated', entityType: 'Player', entityId: id(), metadata: { field: 'phone' } });
  await safe.validate();
  const unsafe = new ActivityAudit({ actorId: id(), action: 'updated', entityType: 'Player', entityId: id(), metadata: { accessToken: 'hidden' } });
  await assert.rejects(unsafe.validate(), /secret-related keys/);
});
