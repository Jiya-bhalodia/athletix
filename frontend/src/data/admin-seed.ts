// Demo records for the Coach/Admin dashboard. Replaced by API data once the backend exists.
import type {
  Parent,
  Achievement,
  Activity,
  Announcement,
  Attendance,
  Coach,
  Fee,
  FeePlan,
  Match,
  Performance,
  Player,
  Session,
  Sport,
  Team,
} from "@/lib/api/types";

const d = (offset: number) => {
  const t = new Date();
  t.setDate(t.getDate() + offset);
  return t.toISOString().slice(0, 10);
};
export const today = () => d(0);

export const sports: Sport[] = [
  {
    id: "s1",
    name: "Football",
    category: "Team",
    description: "Ball control, positional play and match fitness.",
  },
  {
    id: "s2",
    name: "Cricket",
    category: "Team",
    description: "Batting, bowling and fielding fundamentals.",
  },
  {
    id: "s3",
    name: "Basketball",
    category: "Team",
    description: "Footwork, shooting and team defence.",
  },
  {
    id: "s4",
    name: "Badminton",
    category: "Individual",
    description: "Agility, racket skills and court movement.",
  },
  {
    id: "s5",
    name: "Athletics",
    category: "Individual",
    description: "Sprints, distance running and field events.",
  },
];

export const coaches: Coach[] = [
  {
    id: "c1",
    name: "Arjun Mehta",
    email: "arjun@athletix.in",
    phone: "98200 11223",
    sportId: "s1",
    experience: 9,
    schedule: "Mon/Wed/Fri 5–7 PM",
    status: "Active",
  },
  {
    id: "c2",
    name: "Priya Nair",
    email: "priya@athletix.in",
    phone: "98200 33445",
    sportId: "s2",
    experience: 7,
    schedule: "Tue/Thu/Sat 6–8 AM",
    status: "Active",
  },
  {
    id: "c3",
    name: "Rahul Singh",
    email: "rahul@athletix.in",
    phone: "98200 55667",
    sportId: "s3",
    experience: 5,
    schedule: "Mon–Fri 4–6 PM",
    status: "Active",
  },
  {
    id: "c4",
    name: "Sneha Iyer",
    email: "sneha@athletix.in",
    phone: "98200 77889",
    sportId: "s4",
    experience: 6,
    schedule: "Tue/Thu 5–7 PM",
    status: "On leave",
  },
  {
    id: "c5",
    name: "Vikram Rao",
    email: "vikram@athletix.in",
    phone: "98200 99001",
    sportId: "s5",
    experience: 11,
    schedule: "Daily 6–8 AM",
    status: "Active",
  },
];

export const teams: Team[] = [
  { id: "t1", name: "Athletix FC U-16", sportId: "s1", coachId: "c1", ageGroup: "U-16" },
  { id: "t2", name: "Athletix FC U-19", sportId: "s1", coachId: "c1", ageGroup: "U-19" },
  { id: "t3", name: "Strikers XI", sportId: "s2", coachId: "c2", ageGroup: "U-19" },
  { id: "t4", name: "Hoops U-17", sportId: "s3", coachId: "c3", ageGroup: "U-17" },
  { id: "t5", name: "Shuttle Squad", sportId: "s4", coachId: "c4", ageGroup: "Open" },
  { id: "t6", name: "Track Team", sportId: "s5", coachId: "c5", ageGroup: "Open" },
];

const names = [
  "Aarav Shah",
  "Diya Patel",
  "Kabir Khan",
  "Ananya Gupta",
  "Vihaan Reddy",
  "Isha Joshi",
  "Reyansh Das",
  "Myra Kapoor",
  "Advik Menon",
  "Sara Thomas",
  "Arnav Bose",
  "Kiara Pillai",
  "Dhruv Malhotra",
  "Anika Verma",
  "Ishaan Chopra",
  "Navya Kulkarni",
  "Aryan Saxena",
  "Tara Bhat",
];
export const players: Player[] = names.map((name, i) => {
  const team = teams[i % teams.length]!;
  return {
    id: `p${i + 1}`,
    name,
    email: `${name.split(" ")[0]!.toLowerCase()}@mail.com`,
    phone: `99${(10000000 + i * 734521).toString().slice(0, 8)}`,
    age: 12 + (i % 7),
    sportId: team.sportId,
    teamId: team.id,
    joinDate: d(-30 * (i + 2)),
    emergencyName: `Parent of ${name.split(" ")[0]}`,
    emergencyPhone: `97${(20000000 + i * 51234).toString().slice(0, 8)}`,
    status: i % 9 === 8 ? "Inactive" : "Active",
  };
});

export const sessions: Session[] = [
  {
    id: "ss1",
    title: "Passing & possession",
    teamId: "t1",
    coachId: "c1",
    date: d(0),
    time: "17:00",
    venue: "Ground A",
  },
  {
    id: "ss2",
    title: "Net practice",
    teamId: "t3",
    coachId: "c2",
    date: d(0),
    time: "06:30",
    venue: "Nets 1–3",
  },
  {
    id: "ss3",
    title: "Shooting drills",
    teamId: "t4",
    coachId: "c3",
    date: d(-1),
    time: "16:00",
    venue: "Indoor court",
  },
  {
    id: "ss4",
    title: "Sprint starts",
    teamId: "t6",
    coachId: "c5",
    date: d(-2),
    time: "06:00",
    venue: "Track",
  },
  {
    id: "ss5",
    title: "Match tactics",
    teamId: "t2",
    coachId: "c1",
    date: d(-3),
    time: "17:00",
    venue: "Ground A",
  },
  {
    id: "ss6",
    title: "Footwork patterns",
    teamId: "t5",
    coachId: "c4",
    date: d(2),
    time: "17:00",
    venue: "Court 2",
  },
  // Extra demo sessions so Player/Parent portals show a schedule and attendance trend
  {
    id: "ss7",
    title: "Finishing in the box",
    teamId: "t1",
    coachId: "c1",
    date: d(-7),
    time: "17:00",
    venue: "Ground A",
  },
  {
    id: "ss8",
    title: "Conditioning circuit",
    teamId: "t1",
    coachId: "c1",
    date: d(-14),
    time: "17:00",
    venue: "Ground B",
  },
  {
    id: "ss9",
    title: "Set pieces",
    teamId: "t1",
    coachId: "c1",
    date: d(2),
    time: "17:00",
    venue: "Ground B",
  },
  {
    id: "ss10",
    title: "Spin bowling",
    teamId: "t3",
    coachId: "c2",
    date: d(-6),
    time: "06:30",
    venue: "Nets 1–3",
  },
  {
    id: "ss11",
    title: "Fielding drills",
    teamId: "t3",
    coachId: "c2",
    date: d(1),
    time: "06:30",
    venue: "Main oval",
  },
];

export const attendance: Attendance[] = sessions
  .filter((s) => s.date <= d(0))
  .flatMap((s) =>
    players
      .filter((p) => p.teamId === s.teamId)
      .map((p, i) => ({
        id: `a-${s.id}-${p.id}`,
        sessionId: s.id,
        playerId: p.id,
        status: (i + s.id.length) % 4 === 0 ? ("Absent" as const) : ("Present" as const),
      })),
  );

export const matches: Match[] = [
  {
    id: "m1",
    teamId: "t1",
    opponent: "City Juniors",
    date: d(-20),
    venue: "Home",
    tournament: "District League",
    ourScore: 3,
    theirScore: 1,
    status: "Completed",
  },
  {
    id: "m2",
    teamId: "t3",
    opponent: "Royal CC",
    date: d(-14),
    venue: "Away",
    tournament: "Inter-academy Cup",
    ourScore: 182,
    theirScore: 176,
    status: "Completed",
  },
  {
    id: "m3",
    teamId: "t4",
    opponent: "Skyline Ballers",
    date: d(-9),
    venue: "Home",
    tournament: "Friendly",
    ourScore: 58,
    theirScore: 64,
    status: "Completed",
  },
  {
    id: "m4",
    teamId: "t2",
    opponent: "Riverside FC",
    date: d(-5),
    venue: "Away",
    tournament: "District League",
    ourScore: 2,
    theirScore: 2,
    status: "Completed",
  },
  {
    id: "m5",
    teamId: "t1",
    opponent: "Northside Academy",
    date: d(3),
    venue: "Home",
    tournament: "District League",
    ourScore: null,
    theirScore: null,
    status: "Upcoming",
  },
  {
    id: "m6",
    teamId: "t3",
    opponent: "Greenfield XI",
    date: d(6),
    venue: "Away",
    tournament: "Inter-academy Cup",
    ourScore: null,
    theirScore: null,
    status: "Upcoming",
  },
  {
    id: "m7",
    teamId: "t4",
    opponent: "Metro Hoops",
    date: d(10),
    venue: "Home",
    tournament: "State Qualifier",
    ourScore: null,
    theirScore: null,
    status: "Upcoming",
  },
];

export const performance: Performance[] = players.slice(0, 12).flatMap((p, i) =>
  matches
    .filter((m) => m.status === "Completed" && m.teamId === p.teamId)
    .map((m, j) => ({
      id: `pf-${p.id}-${m.id}`,
      playerId: p.id,
      matchId: m.id,
      rating: 5 + ((i * 3 + j * 2) % 5),
      notes: j % 2 ? "Solid positional play" : "Good work rate",
    })),
);

export const achievements: Achievement[] = [
  {
    id: "ac1",
    title: "District League Champions",
    type: "Trophy",
    recipientType: "team",
    teamId: "t1",
    recipient: "Athletix FC U-16",
    sportId: "s1",
    date: d(-120),
    description: "Unbeaten league season.",
    featured: "Yes",
  },
  {
    id: "ac2",
    title: "State 100m Gold",
    type: "Medal",
    recipientType: "player",
    playerId: "p12",
    recipient: "Kiara Pillai",
    sportId: "s5",
    date: d(-75),
    description: "Personal best 12.4s.",
    featured: "Yes",
  },
  {
    id: "ac3",
    title: "Best Bowler — Inter-academy Cup",
    type: "Award",
    recipientType: "player",
    playerId: "p2",
    recipient: "Diya Patel",
    sportId: "s2",
    date: d(-14),
    description: "14 wickets across the tournament.",
    featured: "No",
  },
  {
    id: "ac4",
    title: "100 sessions attended",
    type: "Milestone",
    recipientType: "player",
    playerId: "p1",
    recipient: "Aarav Shah",
    sportId: "s1",
    date: d(-7),
    description: "Consistency milestone.",
    featured: "No",
  },
];

export const feePlans: FeePlan[] = [
  { id: "fp1", name: "Team sports — monthly", sportId: "s1", amount: 2500, frequency: "Monthly" },
  { id: "fp2", name: "Cricket — quarterly", sportId: "s2", amount: 7000, frequency: "Quarterly" },
  {
    id: "fp3",
    name: "Individual sports — monthly",
    sportId: "s4",
    amount: 2000,
    frequency: "Monthly",
  },
];

export const fees: Fee[] = players.map((p, i) => ({
  id: `f${i + 1}`,
  playerId: p.id,
  planId: p.sportId === "s2" ? "fp2" : ["s4", "s5"].includes(p.sportId) ? "fp3" : "fp1",
  amount: p.sportId === "s2" ? 7000 : ["s4", "s5"].includes(p.sportId) ? 2000 : 2500,
  dueDate: d(i % 3 === 0 ? -10 : 5),
  status: i % 3 === 1 ? "Paid" : i % 3 === 0 ? "Overdue" : "Pending",
  paidDate: i % 3 === 1 ? d(-3) : "",
  method: i % 3 === 1 ? "UPI" : "",
}));

export const announcements: Announcement[] = [
  {
    id: "an1",
    title: "Summer camp registrations open",
    kind: "Event",
    date: d(4),
    body: "Two-week camp for all sports. Limited slots.",
    published: "Yes",
  },
  {
    id: "an2",
    title: "Ground A closed for maintenance",
    kind: "Training notice",
    date: d(1),
    body: "Football sessions move to Ground B on Thursday.",
    published: "Yes",
  },
  {
    id: "an3",
    title: "U-16 beat City Juniors 3–1",
    kind: "Match update",
    date: d(-20),
    body: "Great team performance in the league opener.",
    published: "Yes",
  },
];

export const activities: Activity[] = [
  { id: "ev1", text: "Fee received from Diya Patel", at: d(-3) },
  { id: "ev2", text: "New achievement recorded: Best Bowler", at: d(-14) },
  { id: "ev3", text: "Match result logged: U-19 vs Riverside FC (2–2)", at: d(-5) },
];

// Demo parent accounts. Children are linked by stable player ids.
export const parents: Parent[] = [
  {
    id: "pa1",
    name: "Neha Shah",
    email: "neha.shah@mail.com",
    phone: "97200 11122",
    childIds: ["p1", "p3"],
  },
];
